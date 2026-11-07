import asyncio
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import dns.resolver
import dns.exception


@dataclass
class DNSAnalysisResult:
    hostname: str
    status: str  # RESOLVED, NXDOMAIN, TIMEOUT, UNAVAILABLE, NOT_APPLICABLE
    a_records: List[str] = field(default_factory=list)
    aaaa_records: List[str] = field(default_factory=list)
    mx_records: List[str] = field(default_factory=list)
    ns_records: List[str] = field(default_factory=list)
    txt_records: List[str] = field(default_factory=list)
    error_message: Optional[str] = None
    findings: List[Dict[str, Any]] = field(default_factory=list)


class DNSAnalyzer:
    """Queries DNS records safely using dnspython and returns structured records."""

    def __init__(self, timeout: float = 3.0):
        self.timeout = timeout
        self.resolver = dns.resolver.Resolver()
        self.resolver.lifetime = timeout
        self.resolver.timeout = timeout

    def _query_record(self, domain: str, rdtype: str) -> List[str]:
        try:
            answers = self.resolver.resolve(domain, rdtype)
            records = []
            for rdata in answers:
                records.append(str(rdata).strip('"'))
            return records
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            return []
        except Exception:
            raise

    def analyze_sync(self, hostname: str, is_ip: bool = False) -> DNSAnalysisResult:
        """Synchronously analyzes DNS records."""
        if is_ip:
            return DNSAnalysisResult(
                hostname=hostname,
                status="NOT_APPLICABLE",
                error_message="Host is a raw IP address; standard forward DNS resolution skipped.",
                findings=[{
                    "category": "DNS",
                    "indicator": "RAW_IP_DESTINATION",
                    "severity": "INFO",
                    "description": "Forward DNS query not applicable for direct IP destination.",
                    "source": "DNSAnalyzer",
                    "confidence": 1.0,
                    "evidence": {"ip": hostname}
                }]
            )

        a_records = []
        aaaa_records = []
        mx_records = []
        ns_records = []
        txt_records = []
        findings = []

        try:
            # Query A records
            try:
                a_records = self._query_record(hostname, "A")
            except dns.resolver.NXDOMAIN:
                return DNSAnalysisResult(
                    hostname=hostname,
                    status="NXDOMAIN",
                    error_message=f"Domain '{hostname}' does not exist (NXDOMAIN).",
                    findings=[{
                        "category": "DNS",
                        "indicator": "DOMAIN_DOES_NOT_EXIST",
                        "severity": "INFO",
                        "description": f"Domain '{hostname}' returned NXDOMAIN (Non-Existent Domain). The domain may have been taken down, expired, or never registered.",
                        "source": "DNSAnalyzer",
                        "confidence": 0.95,
                        "evidence": {"status": "NXDOMAIN"}
                    }]
                )
            except Exception:
                pass

            # Query AAAA records
            try:
                aaaa_records = self._query_record(hostname, "AAAA")
            except Exception:
                pass

            # Query MX records
            try:
                mx_records = self._query_record(hostname, "MX")
            except Exception:
                pass

            # Query NS records
            try:
                ns_records = self._query_record(hostname, "NS")
            except Exception:
                pass

            # Query TXT records
            try:
                txt_records = self._query_record(hostname, "TXT")
            except Exception:
                pass

            # Check if any records resolved
            if not a_records and not aaaa_records and not ns_records:
                return DNSAnalysisResult(
                    hostname=hostname,
                    status="UNAVAILABLE",
                    error_message="No active DNS records returned for the domain.",
                    findings=[{
                        "category": "DNS",
                        "indicator": "DNS_RECORDS_UNAVAILABLE",
                        "severity": "INFO",
                        "description": "No authoritative A, AAAA, or NS records could be retrieved. (Treated as UNAVAILABLE, not evidence of maliciousness).",
                        "source": "DNSAnalyzer",
                        "confidence": 0.7,
                        "evidence": {"status": "UNAVAILABLE"}
                    }]
                )

            # Record informational finding
            findings.append({
                "category": "DNS",
                "indicator": "DNS_RECORDS_RESOLVED",
                "severity": "INFO",
                "description": f"Successfully resolved DNS records: {len(a_records)} IPv4 (A), {len(aaaa_records)} IPv6 (AAAA), {len(ns_records)} NameServers (NS), {len(mx_records)} MailExchangers (MX).",
                "source": "DNSAnalyzer",
                "confidence": 1.0,
                "evidence": {
                    "a_count": len(a_records),
                    "aaaa_count": len(aaaa_records),
                    "ns_count": len(ns_records),
                    "mx_count": len(mx_records),
                    "a_samples": a_records[:3],
                    "ns_samples": ns_records[:3]
                }
            })

            return DNSAnalysisResult(
                hostname=hostname,
                status="RESOLVED",
                a_records=a_records,
                aaaa_records=aaaa_records,
                mx_records=mx_records,
                ns_records=ns_records,
                txt_records=txt_records,
                findings=findings
            )

        except dns.resolver.Timeout:
            return DNSAnalysisResult(
                hostname=hostname,
                status="TIMEOUT",
                error_message="DNS resolution timed out.",
                findings=[{
                    "category": "DNS",
                    "indicator": "DNS_QUERY_TIMEOUT",
                    "severity": "INFO",
                    "description": "DNS query exceeded timeout limit. Marked as UNAVAILABLE.",
                    "source": "DNSAnalyzer",
                    "confidence": 0.5,
                    "evidence": {"status": "TIMEOUT"}
                }]
            )
        except Exception as e:
            return DNSAnalysisResult(
                hostname=hostname,
                status="UNAVAILABLE",
                error_message=f"DNS query encountered an error: {str(e)}",
                findings=[{
                    "category": "DNS",
                    "indicator": "DNS_QUERY_ERROR",
                    "severity": "INFO",
                    "description": f"DNS query failed ({str(e)}). Marked as UNAVAILABLE.",
                    "source": "DNSAnalyzer",
                    "confidence": 0.5,
                    "evidence": {"error": str(e)}
                }]
            )

    async def analyze(self, hostname: str, is_ip: bool = False) -> DNSAnalysisResult:
        """Asynchronously executes DNS queries via asyncio executor to prevent event-loop blocking."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.analyze_sync, hostname, is_ip)

