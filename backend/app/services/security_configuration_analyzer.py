import asyncio
import re
import socket
from typing import List, Dict, Any, Tuple, Optional
from urllib.parse import urlparse, urljoin
import httpx

from app.analyzers.url_validator import is_ip_private
from app.database import schemas


class SecurityConfigurationAnalyzer:
    """Audits server banner exposure and safely checks standard public security files."""

    MAX_FILE_BYTES = 65_536  # Max 64KB per file
    TIMEOUT = 3.0

    def analyze_information_exposure(
        self,
        headers: Dict[str, str]
    ) -> Tuple[float, List[schemas.SecurityFindingSchema], Dict[str, Any]]:
        """Audits HTTP headers for unnecessary technical banner exposure."""
        norm_headers = {k.lower().strip(): v.strip() for k, v in headers.items()}
        findings: List[schemas.SecurityFindingSchema] = []

        exposed_info: Dict[str, str] = {}
        score = 100.0

        server_header = norm_headers.get("server")
        powered_by = norm_headers.get("x-powered-by")
        aspnet_version = norm_headers.get("x-aspnet-version")
        generator = norm_headers.get("x-generator")

        if server_header:
            exposed_info["server"] = server_header
            # Check if version digits are exposed (e.g. Apache/2.4.41, nginx/1.18.0)
            if re.search(r"[\d.]+", server_header):
                score -= 25.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="INFORMATION_EXPOSURE",
                        title=f"Detailed Web Server Version Disclosed: '{server_header}'",
                        description=f"Server header exposes exact software version ('{server_header}'). This simplifies automated reconnaissance and targeted CVE exploitation.",
                        evidence={"header": "Server", "value": server_header},
                        severity="Low",
                        confidence=1.0,
                        recommendation="Configure your web server to suppress exact version strings (e.g., 'ServerTokens Prod' in Apache or 'server_tokens off' in Nginx)."
                    )
                )
            else:
                score -= 5.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="INFORMATION_EXPOSURE",
                        title=f"Server Banner Disclosed: '{server_header}'",
                        description=f"The server returns a generic technology banner ('{server_header}'). While not an immediate vulnerability, minimizing header metadata follows security-by-default principles.",
                        evidence={"header": "Server", "value": server_header},
                        severity="Informational",
                        confidence=1.0,
                        recommendation="Optionally suppress the Server header entirely if supported by your reverse proxy."
                    )
                )

        if powered_by:
            exposed_info["x-powered-by"] = powered_by
            score -= 30.0
            findings.append(
                schemas.SecurityFindingSchema(
                    category="INFORMATION_EXPOSURE",
                    title=f"Application Framework Disclosed in X-Powered-By: '{powered_by}'",
                    description=f"X-Powered-By header advertises underlying backend framework ('{powered_by}'). Adversaries use this to narrow attack vectors.",
                    evidence={"header": "X-Powered-By", "value": powered_by},
                    severity="Low",
                    confidence=1.0,
                    recommendation="Remove X-Powered-By in your application framework settings (e.g. 'app.disable(\"x-powered-by\")' in Express)."
                )
            )

        if aspnet_version:
            exposed_info["x-aspnet-version"] = aspnet_version
            score -= 25.0
            findings.append(
                schemas.SecurityFindingSchema(
                    category="INFORMATION_EXPOSURE",
                    title=f"ASP.NET Version Disclosed: '{aspnet_version}'",
                    description=f"X-AspNet-Version reveals exact runtime framework ('{aspnet_version}').",
                    evidence={"header": "X-AspNet-Version", "value": aspnet_version},
                    severity="Low",
                    confidence=1.0,
                    recommendation="Disable the enableVersionHeader flag in web.config (httpRuntime enableVersionHeader='false')."
                )
            )

        if generator:
            exposed_info["x-generator"] = generator
            score -= 10.0

        final_score = round(max(0.0, min(100.0, score)), 1)
        return final_score, findings, exposed_info

    async def analyze_public_security_files(
        self,
        base_url: str
    ) -> Tuple[float, List[schemas.SecurityFindingSchema], Dict[str, Any]]:
        """Safely checks availability of standard public security files (/robots.txt, /.well-known/security.txt, /sitemap.xml)."""
        parsed = urlparse(base_url)
        hostname = parsed.hostname or ""
        scheme = parsed.scheme or "https"
        port = parsed.port or (443 if scheme == "https" else 80)

        # Pre-flight SSRF IP validation
        try:
            resolved_ip = socket.gethostbyname(hostname)
            if is_ip_private(resolved_ip):
                return 0.0, [
                    schemas.SecurityFindingSchema(
                        category="SECURITY_CONFIG",
                        title="SSRF Protection Blocked Host Resolution",
                        description=f"Hostname '{hostname}' resolved to private/restricted IP '{resolved_ip}'. File checks aborted.",
                        evidence={"hostname": hostname, "ip": resolved_ip},
                        severity="High",
                        confidence=1.0,
                        recommendation="Public file analysis only permitted on public routable internet hosts."
                    )
                ], {"status": "BLOCKED_SSRF"}
        except Exception:
            return 50.0, [], {"status": "DNS_RESOLUTION_FAILED"}

        origin = f"{scheme}://{hostname}:{port}" if (scheme == "https" and port != 443) or (scheme == "http" and port != 80) else f"{scheme}://{hostname}"

        files_to_check = [
            ("security.txt", "/.well-known/security.txt"),
            ("robots.txt", "/robots.txt"),
            ("sitemap.xml", "/sitemap.xml")
        ]

        findings: List[schemas.SecurityFindingSchema] = []
        file_results: Dict[str, Any] = {}
        score = 80.0  # Base neutral score

        client_timeout = httpx.Timeout(self.TIMEOUT, connect=2.0)
        transport_limits = httpx.Limits(max_keepalive_connections=2, max_connections=4)

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) DigitalTrustIntel/1.0",
            "Accept": "text/plain,text/xml,application/xml,*/*"
        }

        async with httpx.AsyncClient(
            timeout=client_timeout,
            limits=transport_limits,
            verify=False,
            follow_redirects=True
        ) as client:
            for label, path in files_to_check:
                target_url = urljoin(origin, path)
                try:
                    resp = await client.get(target_url, headers=headers)
                    file_results[label] = {
                        "url": target_url,
                        "status_code": resp.status_code,
                        "exists": resp.status_code == 200
                    }

                    if resp.status_code == 200:
                        content_sample = resp.text[: self.MAX_FILE_BYTES]

                        if label == "security.txt":
                            score += 15.0
                            has_contact = "contact:" in content_sample.lower()
                            has_expires = "expires:" in content_sample.lower()
                            findings.append(
                                schemas.SecurityFindingSchema(
                                    category="SECURITY_CONFIG",
                                    title="RFC 9116 security.txt File Present",
                                    description="The website publishes a vulnerability disclosure policy and contact file at /.well-known/security.txt.",
                                    evidence={
                                        "status_code": 200,
                                        "has_contact": has_contact,
                                        "has_expires": has_expires
                                    },
                                    severity="Informational",
                                    confidence=1.0,
                                    recommendation="Ensure security.txt expires field is regularly renewed."
                                )
                            )

                        elif label == "robots.txt":
                            score += 5.0
                            # Inspect for sensitive path disclosure
                            disallow_matches = re.findall(r"Disallow:\s*([^\r\n#]+)", content_sample, re.IGNORECASE)
                            sensitive_keywords = ["admin", "backup", "secret", ".git", "config", "internal", "private", "database", "sql"]
                            exposed_sensitive = [
                                d.strip() for d in disallow_matches
                                if any(k in d.lower() for k in sensitive_keywords)
                            ]

                            if exposed_sensitive:
                                score -= 10.0
                                findings.append(
                                    schemas.SecurityFindingSchema(
                                        category="SECURITY_CONFIG",
                                        title="Potentially Sensitive Paths Disclosed in robots.txt",
                                        description=(
                                            "robots.txt is a public crawler instruction file, not an access control mechanism. "
                                            f"Listing sensitive directories ({', '.join(exposed_sensitive[:4])}) in robots.txt reveals their existence to attackers."
                                        ),
                                        evidence={"sample_paths": exposed_sensitive[:5]},
                                        severity="Low",
                                        confidence=0.9,
                                        recommendation="Use robust authentication and authorization on admin paths rather than relying on robots.txt obscurity."
                                    )
                                )
                            else:
                                findings.append(
                                    schemas.SecurityFindingSchema(
                                        category="SECURITY_CONFIG",
                                        title="robots.txt Crawler File Present",
                                        description="Standard robots.txt crawler directives observed without sensitive administrative path leakage.",
                                        evidence={"status_code": 200},
                                        severity="Informational",
                                        confidence=1.0,
                                        recommendation="Continue maintaining robots.txt purely for search indexing."
                                    )
                                )

                    elif label == "security.txt":
                        # Note: Never claim missing security.txt is a vulnerability
                        findings.append(
                            schemas.SecurityFindingSchema(
                                category="SECURITY_CONFIG",
                                title="No RFC 9116 security.txt Discovered",
                                description="The website does not publish a security.txt contact file. This is an optional best practice to streamline responsible vulnerability disclosure.",
                                evidence={"status_code": resp.status_code},
                                severity="Informational",
                                confidence=1.0,
                                recommendation="Consider creating /.well-known/security.txt to give security researchers a direct channel to report vulnerabilities."
                            )
                        )

                except Exception as e:
                    file_results[label] = {
                        "url": target_url,
                        "error": str(e),
                        "exists": False
                    }

        final_score = round(max(0.0, min(100.0, score)), 1)
        return final_score, findings, file_results

