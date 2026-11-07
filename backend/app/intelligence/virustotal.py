import base64
from typing import Dict, Any, List
import httpx
from app.core.config import settings
from app.intelligence.base import ThreatIntelProvider


class VirusTotalProvider(ThreatIntelProvider):
    """Integrates with VirusTotal API v3 for external reputation scoring."""

    def __init__(self, api_key: str = ""):
        self.api_key = api_key or settings.VIRUSTOTAL_API_KEY
        self.base_url = "https://www.virustotal.com/api/v3"

    @property
    def name(self) -> str:
        return "VirusTotal"

    @staticmethod
    def url_to_vt_id(url: str) -> str:
        """Encodes URL to VirusTotal base64 identifier without padding."""
        return base64.urlsafe_b64encode(url.encode()).decode().strip("=")

    async def analyze_url(self, url: str) -> Dict[str, Any]:
        """Queries VirusTotal API v3 for URL reputation telemetry."""
        # 1. Missing API Key check
        if not self.api_key:
            return {
                "provider": self.name,
                "status": "UNAVAILABLE",
                "is_malicious": False,
                "malicious_count": 0,
                "suspicious_count": 0,
                "harmless_count": 0,
                "total_engines": 0,
                "message": "Threat intelligence lookup unavailable.",
                "findings": []
            }

        vt_id = self.url_to_vt_id(url)
        headers = {
            "x-apikey": self.api_key,
            "Accept": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(f"{self.base_url}/urls/{vt_id}", headers=headers)

                if response.status_code == 404:
                    return {
                        "provider": self.name,
                        "status": "NOT_FOUND",
                        "is_malicious": False,
                        "malicious_count": 0,
                        "suspicious_count": 0,
                        "harmless_count": 0,
                        "total_engines": 0,
                        "message": "URL not found in VirusTotal threat intelligence database.",
                        "findings": [{
                            "category": "THREAT_INTEL",
                            "indicator": "VIRUSTOTAL_NO_PRIOR_RECORD",
                            "severity": "INFO",
                            "description": "URL has no prior scan history in VirusTotal repository.",
                            "source": "VirusTotal",
                            "confidence": 0.5,
                            "evidence": {"vt_id": vt_id}
                        }]
                    }

                if response.status_code == 429:
                    return {
                        "provider": self.name,
                        "status": "UNAVAILABLE",
                        "is_malicious": False,
                        "malicious_count": 0,
                        "suspicious_count": 0,
                        "harmless_count": 0,
                        "total_engines": 0,
                        "message": "Threat intelligence lookup temporarily unavailable (API rate limit exceeded).",
                        "findings": []
                    }

                if response.status_code != 200:
                    return {
                        "provider": self.name,
                        "status": "ERROR",
                        "is_malicious": False,
                        "malicious_count": 0,
                        "suspicious_count": 0,
                        "harmless_count": 0,
                        "total_engines": 0,
                        "message": f"Threat intelligence query failed with HTTP {response.status_code}.",
                        "findings": []
                    }

                data = response.json()
                attributes = data.get("data", {}).get("attributes", {})
                stats = attributes.get("last_analysis_stats", {})

                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)
                harmless = stats.get("harmless", 0)
                undetected = stats.get("undetected", 0)
                total_engines = malicious + suspicious + harmless + undetected

                is_malicious = malicious >= 3 or (malicious >= 1 and suspicious >= 2)
                findings: List[Dict[str, Any]] = []

                if malicious >= 3:
                    findings.append({
                        "category": "THREAT_INTEL",
                        "indicator": "CONFIRMED_THREAT_INTEL_MATCH",
                        "severity": "CRITICAL",
                        "description": f"URL confirmed as malicious by {malicious} security vendors on VirusTotal ({malicious}/{total_engines} engines).",
                        "source": "VirusTotal",
                        "confidence": 0.99,
                        "evidence": {
                            "malicious_engines": malicious,
                            "suspicious_engines": suspicious,
                            "total_engines": total_engines,
                            "categories": attributes.get("categories", {})
                        }
                    })
                elif malicious > 0 or suspicious > 0:
                    findings.append({
                        "category": "THREAT_INTEL",
                        "indicator": "SUSPICIOUS_THREAT_INTEL_MATCH",
                        "severity": "MEDIUM",
                        "description": f"URL flagged as suspicious/malicious by {malicious + suspicious} security vendors on VirusTotal ({malicious} malicious, {suspicious} suspicious out of {total_engines} engines).",
                        "source": "VirusTotal",
                        "confidence": 0.85,
                        "evidence": {
                            "malicious_engines": malicious,
                            "suspicious_engines": suspicious,
                            "total_engines": total_engines
                        }
                    })
                elif total_engines > 0:
                    findings.append({
                        "category": "THREAT_INTEL",
                        "indicator": "CLEAN_THREAT_INTEL_REPUTATION",
                        "severity": "INFO",
                        "description": f"No security vendors flagged this URL as malicious in VirusTotal ({harmless} harmless / {undetected} undetected across {total_engines} engines). Note: Clean threat intelligence alone does not guarantee a URL is benign.",
                        "source": "VirusTotal",
                        "confidence": 0.7,
                        "evidence": {"total_engines": total_engines, "harmless": harmless}
                    })

                return {
                    "provider": self.name,
                    "status": "COMPLETED",
                    "is_malicious": is_malicious,
                    "malicious_count": malicious,
                    "suspicious_count": suspicious,
                    "harmless_count": harmless,
                    "total_engines": total_engines,
                    "scan_date": str(attributes.get("last_analysis_date")),
                    "permalink": f"https://www.virustotal.com/gui/url/{vt_id}",
                    "findings": findings
                }

        except Exception as e:
            return {
                "provider": self.name,
                "status": "ERROR",
                "is_malicious": False,
                "malicious_count": 0,
                "suspicious_count": 0,
                "harmless_count": 0,
                "total_engines": 0,
                "message": f"Threat intelligence lookup encountered an error: {str(e)}",
                "findings": []
            }

