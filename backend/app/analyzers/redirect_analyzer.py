import asyncio
import socket
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin
import httpx
import tldextract
from app.analyzers.url_validator import is_ip_private, is_hostname_private


@dataclass
class RedirectHop:
    hop_number: int
    url: str
    status_code: Optional[int]
    domain: str
    ip: Optional[str]
    is_cross_domain: bool


@dataclass
class RedirectAnalysisResult:
    original_url: str
    final_url: str
    hops: List[RedirectHop] = field(default_factory=list)
    redirect_count: int = 0
    cross_domain_redirects: bool = False
    status: str = "COMPLETED"  # COMPLETED, BLOCKED_SSRF, TIMEOUT, ERROR
    error_message: Optional[str] = None
    findings: List[Dict[str, Any]] = field(default_factory=list)


class RedirectAnalyzer:
    """Safely follows and audits HTTP redirect chains with strict SSRF defense."""

    def __init__(self, max_hops: int = 5, timeout: float = 6.0):
        self.max_hops = max_hops
        self.timeout = timeout
        self.extractor = tldextract.TLDExtract(cache_dir=None)

    def _resolve_ip(self, host: str) -> Optional[str]:
        """Resolves hostname to IPv4 address to evaluate SSRF constraints."""
        try:
            clean_host = host.split(":")[0].strip("[]")
            return socket.gethostbyname(clean_host)
        except Exception:
            return None

    async def analyze(self, initial_url: str) -> RedirectAnalysisResult:
        hops: List[RedirectHop] = []
        findings: List[Dict[str, Any]] = []
        current_url = initial_url
        ext_orig = self.extractor(urlparse(initial_url).netloc)
        original_domain = getattr(ext_orig, "top_domain_under_public_suffix", None) or getattr(ext_orig, "registered_domain", None) or ""
        cross_domain_detected = False

        transport_limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
        client_timeout = httpx.Timeout(self.timeout, connect=3.0)

        # Standard safe User-Agent
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 DigitalTrustIntel/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }

        async with httpx.AsyncClient(
            follow_redirects=False,  # Manually control each hop to enforce per-hop SSRF validation
            timeout=client_timeout,
            limits=transport_limits,
            verify=False  # Do not reject unverified SSL here; we want to inspect redirect destination even on bad certs
        ) as client:
            hop_count = 0
            while hop_count <= self.max_hops:
                parsed = urlparse(current_url)
                hostname = parsed.hostname or ""

                if not hostname:
                    return RedirectAnalysisResult(
                        original_url=initial_url,
                        final_url=current_url,
                        hops=hops,
                        redirect_count=len(hops),
                        cross_domain_redirects=cross_domain_detected,
                        status="ERROR",
                        error_message="Invalid hostname encountered in redirect chain.",
                        findings=findings
                    )

                # SSRF Protection: Check hostname and resolve IP address before connecting
                if is_hostname_private(hostname):
                    finding = {
                        "category": "NETWORK_REDIRECT",
                        "indicator": "SSRF_PRIVATE_IP_BLOCKED",
                        "severity": "CRITICAL",
                        "description": f"Redirect hop '{current_url}' targets private/internal hostname '{hostname}'. Request blocked to prevent Server-Side Request Forgery (SSRF).",
                        "source": "RedirectAnalyzer",
                        "confidence": 1.0,
                        "evidence": {
                            "hop_number": hop_count + 1,
                            "url": current_url,
                            "hostname": hostname
                        }
                    }
                    findings.append(finding)
                    return RedirectAnalysisResult(
                        original_url=initial_url,
                        final_url=current_url,
                        hops=hops,
                        redirect_count=len(hops),
                        cross_domain_redirects=cross_domain_detected,
                        status="BLOCKED_SSRF",
                        error_message=f"SSRF Protection: Redirect destination '{hostname}' is in a private/internal domain namespace.",
                        findings=findings
                    )

                resolved_ip = self._resolve_ip(hostname)
                if resolved_ip and is_ip_private(resolved_ip):
                    finding = {
                        "category": "NETWORK_REDIRECT",
                        "indicator": "SSRF_PRIVATE_IP_BLOCKED",
                        "severity": "CRITICAL",
                        "description": f"Redirect hop '{current_url}' resolved to private/internal network IP '{resolved_ip}'. Request blocked to prevent Server-Side Request Forgery (SSRF).",
                        "source": "RedirectAnalyzer",
                        "confidence": 1.0,
                        "evidence": {
                            "hop_number": hop_count + 1,
                            "url": current_url,
                            "resolved_ip": resolved_ip
                        }
                    }
                    findings.append(finding)
                    return RedirectAnalysisResult(
                        original_url=initial_url,
                        final_url=current_url,
                        hops=hops,
                        redirect_count=len(hops),
                        cross_domain_redirects=cross_domain_detected,
                        status="BLOCKED_SSRF",
                        error_message=f"SSRF Protection: Redirect destination '{hostname}' ({resolved_ip}) is in a private network range.",
                        findings=findings
                    )

                # Check cross-domain
                ext_curr = self.extractor(hostname)
                current_reg_domain = getattr(ext_curr, "top_domain_under_public_suffix", None) or getattr(ext_curr, "registered_domain", None) or ""
                is_cross = bool(original_domain and current_reg_domain and original_domain != current_reg_domain)
                if is_cross:
                    cross_domain_detected = True

                try:
                    # Issue lightweight HEAD request first; if 405 Method Not Allowed, issue GET with stream
                    response = None
                    try:
                        response = await client.head(current_url, headers=headers)
                    except httpx.HTTPStatusError:
                        pass
                    except Exception:
                        pass

                    if response is None or response.status_code == 405:
                        # Use streaming GET to read only headers and first few bytes without loading entire page
                        async with client.stream("GET", current_url, headers=headers) as stream_resp:
                            status_code = stream_resp.status_code
                            location = stream_resp.headers.get("location")
                    else:
                        status_code = response.status_code
                        location = response.headers.get("location")

                except httpx.TimeoutException:
                    findings.append({
                        "category": "NETWORK_REDIRECT",
                        "indicator": "CONNECTION_TIMEOUT",
                        "severity": "INFO",
                        "description": f"Connection timed out while contacting '{current_url}'. Server may be offline or blocking automated scanners.",
                        "source": "RedirectAnalyzer",
                        "confidence": 0.6,
                        "evidence": {"hop_number": hop_count + 1, "url": current_url}
                    })
                    break
                except httpx.RequestError as e:
                    findings.append({
                        "category": "NETWORK_REDIRECT",
                        "indicator": "CONNECTION_ERROR",
                        "severity": "INFO",
                        "description": f"Unable to establish connection to '{current_url}': {str(e)}",
                        "source": "RedirectAnalyzer",
                        "confidence": 0.6,
                        "evidence": {"error": str(e), "hop_number": hop_count + 1}
                    })
                    break

                hop_record = RedirectHop(
                    hop_number=hop_count + 1,
                    url=current_url,
                    status_code=status_code,
                    domain=hostname,
                    ip=resolved_ip,
                    is_cross_domain=is_cross
                )
                hops.append(hop_record)

                # Check if this is a redirect
                if status_code in (301, 302, 303, 307, 308) and location:
                    hop_count += 1
                    # Resolve relative redirect URLs safely
                    current_url = urljoin(current_url, location)
                else:
                    # Final destination reached
                    break

            if hop_count > self.max_hops:
                findings.append({
                    "category": "NETWORK_REDIRECT",
                    "indicator": "EXCESSIVE_REDIRECT_HOPS",
                    "severity": "MEDIUM",
                    "description": f"Redirect chain exceeded safety threshold ({self.max_hops} hops). Long chains are used to obscure final destinations.",
                    "source": "RedirectAnalyzer",
                    "confidence": 0.8,
                    "evidence": {"max_hops": self.max_hops, "total_hops": len(hops)}
                })

            if cross_domain_detected:
                findings.append({
                    "category": "NETWORK_REDIRECT",
                    "indicator": "CROSS_DOMAIN_REDIRECT",
                    "severity": "MEDIUM",
                    "description": f"URL initiated a cross-domain redirection from '{original_domain}' to an external destination ('{hops[-1].domain}'). Attackers often exploit open redirects or URL shorteners to route to phishing landing pages.",
                    "source": "RedirectAnalyzer",
                    "confidence": 0.85,
                    "evidence": {
                        "initial_domain": original_domain,
                        "final_domain": hops[-1].domain if hops else "unknown",
                        "hops_count": len(hops)
                    }
                })

            return RedirectAnalysisResult(
                original_url=initial_url,
                final_url=hops[-1].url if hops else initial_url,
                hops=hops,
                redirect_count=max(0, len(hops) - 1),
                cross_domain_redirects=cross_domain_detected,
                status="COMPLETED",
                findings=findings
            )
