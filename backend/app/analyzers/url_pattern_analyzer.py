import re
from typing import List, Dict, Any
from urllib.parse import urlparse, unquote


# Keywords commonly found in phishing campaigns aiming to harvest credentials or manipulate users
CREDENTIAL_KEYWORDS = [
    "login", "signin", "sign-in", "log-in", "verify", "verification",
    "authenticate", "auth", "security-check", "update-account", "wallet",
    "seed-phrase", "privatekey", "private-key", "passphrase", "restore-wallet",
    "banking", "secure-login", "account-alert", "billing", "confirm-identity"
]

SUSPICIOUS_EXTENSIONS = [
    ".exe", ".scr", ".bat", ".cmd", ".vbs", ".ps1", ".iso", ".dmg", ".apk", ".jar"
]

NON_STANDARD_PORTS = {
    8080, 8443, 8888, 2082, 2083, 2086, 2087, 3389, 4444, 5555, 6667, 7001, 8000, 9000
}


class URLPatternAnalyzer:
    """Detects suspicious structural anomalies, encoding tricks, and phishing tokens in URLs."""

    @staticmethod
    def analyze(url: str, is_ip_host: bool = False, raw_input: str = "") -> List[Dict[str, Any]]:
        findings: List[Dict[str, Any]] = []
        parsed = urlparse(url)

        # 1. IP Address as Hostname
        if is_ip_host:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "IP_ADDRESS_AS_HOSTNAME",
                "severity": "HIGH",
                "description": f"URL uses a raw IP address ('{parsed.hostname}') instead of a registered domain name. Legitimate web services rarely direct users to naked IP addresses.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.95,
                "evidence": {"hostname": parsed.hostname}
            })

        # 2. Credential Delimiter / '@' Symbol
        if "@" in raw_input or "@" in url:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "EMBEDDED_AT_SYMBOL",
                "severity": "HIGH",
                "description": "URL contains an '@' character. In URI standards, characters preceding '@' represent user authentication, frequently abused in phishing to trick users regarding the actual host.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.95,
                "evidence": {"url": url}
            })

        # 3. Non-Standard Ports
        if parsed.port and parsed.port not in (80, 443):
            severity = "MEDIUM" if parsed.port in NON_STANDARD_PORTS else "LOW"
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "NON_STANDARD_PORT",
                "severity": severity,
                "description": f"URL directs to an uncommon port ({parsed.port}) rather than standard web ports (80/443).",
                "source": "URLPatternAnalyzer",
                "confidence": 0.8,
                "evidence": {"port": parsed.port}
            })

        # 4. Excessive URL Length
        url_len = len(url)
        if url_len > 150:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "EXCESSIVE_URL_LENGTH",
                "severity": "LOW",
                "description": f"URL is unusually long ({url_len} characters), often used to hide the true destination in mobile browsers or embed obfuscated redirection payloads.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.7,
                "evidence": {"length": url_len}
            })

        # 5. Obfuscated / Double Encoding
        if "%25" in url or "%00" in url:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "DOUBLE_ENCODING_OR_NULL_BYTE",
                "severity": "HIGH",
                "description": "Double percent-encoding (%25) or null-byte (%00) detected in URL. This pattern is commonly exploited for filter evasion and path-traversal attacks.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.9,
                "evidence": {"obfuscation_sample": re.findall(r"%[0-9a-fA-F]{2}", url)[:5]}
            })

        # 6. Credential Harvesting / Target Keywords in Path/Query
        lower_path_query = (parsed.path + "?" + parsed.query).lower()
        matched_keywords = [kw for kw in CREDENTIAL_KEYWORDS if kw in lower_path_query]
        if matched_keywords:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "CREDENTIAL_TARGETING_KEYWORDS",
                "severity": "MEDIUM",
                "description": f"URL path/query contains sensitive terms frequently targeted in social engineering: {', '.join(matched_keywords[:4])}",
                "source": "URLPatternAnalyzer",
                "confidence": 0.75,
                "evidence": {"matched_keywords": matched_keywords}
            })

        # 7. Dangerous Executable or Archive Extension
        lower_path = parsed.path.lower()
        matched_exts = [ext for ext in SUSPICIOUS_EXTENSIONS if lower_path.endswith(ext)]
        if matched_exts:
            findings.append({
                "category": "URL_STRUCTURE",
                "indicator": "POTENTIALLY_DANGEROUS_FILE_EXTENSION",
                "severity": "HIGH",
                "description": f"URL targets a direct download of an executable or payload format ({matched_exts[0]}).",
                "source": "URLPatternAnalyzer",
                "confidence": 0.85,
                "evidence": {"extension": matched_exts[0]}
            })

        return findings

