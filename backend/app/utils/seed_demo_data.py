import asyncio
from datetime import datetime, timezone, timedelta
from app.database.connection import SessionLocal, init_db
from app.database import models

# Benchmark demo cases to showcase dashboard analytics and risk spectrum
DEMO_BENCHMARKS = [
    {
        "url": "https://github.com",
        "domain": "github.com",
        "risk_level": "LOW_RISK",
        "risk_score": 5.0,
        "confidence": 0.95,
        "summary": "No active malicious indicators or brand impersonation patterns were identified for github.com during this evaluation.",
        "findings": [
            {
                "category": "DNS",
                "indicator": "DNS_RECORDS_RESOLVED",
                "severity": "INFO",
                "description": "Successfully resolved 1 IPv4 (A) address, 4 NameServers (NS), and 1 MailExchanger (MX).",
                "source": "DNSAnalyzer",
                "confidence": 1.0,
                "evidence": {"a_samples": ["140.82.121.4"], "ns_samples": ["dns1.p08.nsone.net"]}
            }
        ],
        "details": {
            "dns": {
                "a_records": ["140.82.121.4"],
                "aaaa_records": [],
                "mx_records": ["10 aspmx.l.google.com"],
                "ns_records": ["dns1.p08.nsone.net", "dns2.p08.nsone.net"],
                "txt_records": ["v=spf1 include:_netblocks.google.com ~all"],
                "status": "RESOLVED"
            },
            "redirects": {
                "original_url": "https://github.com",
                "final_url": "https://github.com",
                "hops": [],
                "redirect_count": 0,
                "cross_domain_redirects": False,
                "status": "COMPLETED"
            },
            "domain_analysis": {
                "subdomain": "",
                "registered_domain": "github.com",
                "tld": "com",
                "full_domain": "github.com",
                "is_punycode": False,
                "domain_length": 6,
                "subdomain_count": 0,
                "has_hyphens": False,
                "hyphen_count": 0,
                "is_brand_impersonation": False,
                "target_brand": None,
                "similarity_score": 0.0,
                "suspicious_patterns": []
            },
            "threat_intel": {
                "provider": "VirusTotal",
                "status": "COMPLETED",
                "is_malicious": False,
                "malicious_count": 0,
                "suspicious_count": 0,
                "harmless_count": 88,
                "total_engines": 88
            },
            "ai_explanation": {
                "summary": "No active malicious indicators or brand impersonation patterns were identified for github.com.",
                "risk_level": "LOW_RISK",
                "explanation": [
                    "The domain structure follows standard conventions without deceptive patterns.",
                    "Active DNS records were verified without suspicious cross-domain redirects."
                ],
                "recommendations": [
                    "Target appears consistent with standard web destinations.",
                    "Always confirm HTTPS certificate identity when entering credentials."
                ],
                "is_deterministic_fallback": True
            },
            "unavailable_checks": []
        }
    },
    {
        "url": "http://paypa1-security-update.com/login",
        "domain": "paypa1-security-update.com",
        "risk_level": "CONFIRMED_MALICIOUS",
        "risk_score": 88.0,
        "confidence": 0.92,
        "summary": "High-confidence threat indicators detected for paypa1-security-update.com. The link presents severe risk of phishing, fraud, or credential harvesting.",
        "findings": [
            {
                "category": "BRAND_PROTECTION",
                "indicator": "TYPOSQUATTING_SUSPECTED",
                "severity": "HIGH",
                "description": "Domain name 'paypa1-security-update' closely resembles well-known brand 'PAYPAL' (similarity ratio: 0.88), suggesting intentional typosquatting.",
                "source": "DomainAnalyzer",
                "confidence": 0.95,
                "evidence": {"target_brand": "paypal", "similarity": 0.88}
            },
            {
                "category": "URL_STRUCTURE",
                "indicator": "CREDENTIAL_TARGETING_KEYWORDS",
                "severity": "MEDIUM",
                "description": "URL path contains sensitive credential targeting keyword: 'login'.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.85,
                "evidence": {"matched_keywords": ["login"]}
            },
            {
                "category": "DOMAIN",
                "indicator": "EXCESSIVE_HYPHENS",
                "severity": "MEDIUM",
                "description": "Domain contains multiple hyphens commonly used to chain deceptive brand names.",
                "source": "DomainAnalyzer",
                "confidence": 0.75,
                "evidence": {"hyphen_count": 2}
            }
        ],
        "details": {
            "dns": {
                "a_records": ["198.51.100.22"],
                "aaaa_records": [],
                "mx_records": [],
                "ns_records": ["ns1.suspicious-host.net"],
                "txt_records": [],
                "status": "RESOLVED"
            },
            "redirects": {
                "original_url": "http://paypa1-security-update.com/login",
                "final_url": "http://paypa1-security-update.com/login",
                "hops": [],
                "redirect_count": 0,
                "cross_domain_redirects": False,
                "status": "COMPLETED"
            },
            "domain_analysis": {
                "subdomain": "",
                "registered_domain": "paypa1-security-update.com",
                "tld": "com",
                "full_domain": "paypa1-security-update.com",
                "is_punycode": False,
                "domain_length": 22,
                "subdomain_count": 0,
                "has_hyphens": True,
                "hyphen_count": 2,
                "is_brand_impersonation": True,
                "target_brand": "paypal",
                "similarity_score": 0.88,
                "suspicious_patterns": ["TYPOSQUATTING_SUSPECTED", "EXCESSIVE_HYPHENS"]
            },
            "threat_intel": {
                "provider": "VirusTotal",
                "status": "COMPLETED",
                "is_malicious": True,
                "malicious_count": 14,
                "suspicious_count": 2,
                "harmless_count": 10,
                "total_engines": 70
            },
            "ai_explanation": {
                "summary": "High-confidence threat indicators detected for paypa1-security-update.com.",
                "risk_level": "CONFIRMED_MALICIOUS",
                "explanation": [
                    "Domain name closely resembles well-known brand PAYPAL suggesting intentional typosquatting.",
                    "Flagged by 14 security vendors in threat intelligence repository as phishing.",
                    "URL targets credential harvesting keywords in its path."
                ],
                "recommendations": [
                    "Do NOT enter passwords or financial information on this website.",
                    "Close browser tabs immediately and do not download any files.",
                    "Navigate directly to the official paypal.com domain to check account status."
                ],
                "is_deterministic_fallback": True
            },
            "unavailable_checks": []
        }
    },
    {
        "url": "http://198.51.100.4:8080/verify-wallet",
        "domain": "198.51.100.4",
        "risk_level": "HIGH_RISK",
        "risk_score": 65.0,
        "confidence": 0.80,
        "summary": "Multiple high-severity security anomalies detected for naked IP host 198.51.100.4:8080 targeting wallet credentials.",
        "findings": [
            {
                "category": "URL_STRUCTURE",
                "indicator": "IP_ADDRESS_AS_HOSTNAME",
                "severity": "HIGH",
                "description": "URL uses a raw IP address ('198.51.100.4') instead of a registered domain name. Legitimate web services rarely direct users to naked IP addresses.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.95,
                "evidence": {"hostname": "198.51.100.4"}
            },
            {
                "category": "URL_STRUCTURE",
                "indicator": "NON_STANDARD_PORT",
                "severity": "MEDIUM",
                "description": "URL directs to uncommon port (8080) rather than standard web ports (80/443).",
                "source": "URLPatternAnalyzer",
                "confidence": 0.8,
                "evidence": {"port": 8080}
            },
            {
                "category": "URL_STRUCTURE",
                "indicator": "CREDENTIAL_TARGETING_KEYWORDS",
                "severity": "MEDIUM",
                "description": "URL path contains sensitive Web3 terms frequently targeted in scams: 'verify', 'wallet'.",
                "source": "URLPatternAnalyzer",
                "confidence": 0.85,
                "evidence": {"matched_keywords": ["verify", "wallet"]}
            }
        ],
        "details": {
            "dns": {
                "a_records": [],
                "aaaa_records": [],
                "mx_records": [],
                "ns_records": [],
                "txt_records": [],
                "status": "NOT_APPLICABLE"
            },
            "redirects": {
                "original_url": "http://198.51.100.4:8080/verify-wallet",
                "final_url": "http://198.51.100.4:8080/verify-wallet",
                "hops": [],
                "redirect_count": 0,
                "cross_domain_redirects": False,
                "status": "COMPLETED"
            },
            "domain_analysis": {
                "subdomain": "",
                "registered_domain": "198.51.100.4",
                "tld": "",
                "full_domain": "198.51.100.4",
                "is_punycode": False,
                "domain_length": 12,
                "subdomain_count": 0,
                "has_hyphens": False,
                "hyphen_count": 0,
                "is_brand_impersonation": False,
                "target_brand": None,
                "similarity_score": 0.0,
                "suspicious_patterns": []
            },
            "threat_intel": {
                "provider": "VirusTotal",
                "status": "UNAVAILABLE",
                "is_malicious": False,
                "message": "Threat intelligence lookup unavailable."
            },
            "ai_explanation": {
                "summary": "Multiple high-severity security anomalies detected for naked IP host 198.51.100.4.",
                "risk_level": "HIGH_RISK",
                "explanation": [
                    "URL uses a raw IP address instead of an authenticated domain name.",
                    "Path directly requests Web3 wallet verification tokens on a non-standard port."
                ],
                "recommendations": [
                    "Do NOT connect your cryptocurrency wallet or enter private keys or seed phrases.",
                    "Disconnect any active sessions pointing to naked IP addresses."
                ],
                "is_deterministic_fallback": True
            },
            "unavailable_checks": ["VirusTotal threat intelligence (API key not configured)"]
        }
    },
    {
        "url": "http://xn--pple-43d.com/support",
        "domain": "xn--pple-43d.com",
        "risk_level": "SUSPICIOUS",
        "risk_score": 42.0,
        "confidence": 0.85,
        "summary": "Domain utilizes Punycode internationalized encoding representing Cyrillic lookalike homoglyphs mimicking Apple.",
        "findings": [
            {
                "category": "DOMAIN",
                "indicator": "PUNYCODE_DETECTED",
                "severity": "MEDIUM",
                "description": "Domain utilizes Punycode internationalized encoding (xn--pple-43d.com -> аpple.com with Cyrillic 'а').",
                "source": "DomainAnalyzer",
                "confidence": 0.9,
                "evidence": {"punycode": "xn--pple-43d.com", "decoded": "аpple.com"}
            },
            {
                "category": "DOMAIN",
                "indicator": "HOMOGLYPH_SUBSTITUTION",
                "severity": "HIGH",
                "description": "Detected potential homoglyph character substitutions mimicking Latin letter 'a'.",
                "source": "DomainAnalyzer",
                "confidence": 0.95,
                "evidence": {"substitutions": ["а->a"]}
            }
        ],
        "details": {
            "dns": {
                "a_records": ["203.0.113.55"],
                "aaaa_records": [],
                "mx_records": [],
                "ns_records": ["ns1.idn-host.com"],
                "txt_records": [],
                "status": "RESOLVED"
            },
            "redirects": {
                "original_url": "http://xn--pple-43d.com/support",
                "final_url": "http://xn--pple-43d.com/support",
                "hops": [],
                "redirect_count": 0,
                "cross_domain_redirects": False,
                "status": "COMPLETED"
            },
            "domain_analysis": {
                "subdomain": "",
                "registered_domain": "xn--pple-43d.com",
                "tld": "com",
                "full_domain": "xn--pple-43d.com",
                "is_punycode": True,
                "unicode_domain": "аpple.com",
                "domain_length": 14,
                "subdomain_count": 0,
                "has_hyphens": True,
                "hyphen_count": 2,
                "is_brand_impersonation": True,
                "target_brand": "apple",
                "similarity_score": 0.95,
                "suspicious_patterns": ["PUNYCODE_DETECTED", "HOMOGLYPH_SUBSTITUTION"]
            },
            "threat_intel": {
                "provider": "VirusTotal",
                "status": "NOT_FOUND",
                "is_malicious": False,
                "message": "URL not found in VirusTotal threat intelligence database."
            },
            "ai_explanation": {
                "summary": "Punycode internationalized domain homoglyph attack detected.",
                "risk_level": "SUSPICIOUS",
                "explanation": [
                    "Domain uses Cyrillic 'а' lookalike to visually impersonate apple.com.",
                    "No prior malicious record found on VirusTotal, but heuristic markers are suspicious."
                ],
                "recommendations": [
                    "Verify the actual ASCII domain address in the browser address bar.",
                    "Never enter Apple ID or iCloud passwords on Punycode lookalike domains."
                ],
                "is_deterministic_fallback": True
            },
            "unavailable_checks": []
        }
    },
    {
        "url": "http://127.0.0.1:8080/admin/system",
        "domain": "127.0.0.1",
        "risk_level": "CONFIRMED_MALICIOUS",
        "risk_score": 95.0,
        "confidence": 1.0,
        "summary": "Access to internal loopback IP address was blocked to protect internal infrastructure (SSRF).",
        "findings": [
            {
                "category": "SSRF",
                "indicator": "SSRF_PRIVATE_IP_BLOCKED",
                "severity": "CRITICAL",
                "description": "Unsafe destination: IP address '127.0.0.1' targets a private, loopback, or cloud-metadata address (SSRF blocked).",
                "source": "URLValidator",
                "confidence": 1.0,
                "evidence": {"hostname": "127.0.0.1", "subnet": "127.0.0.0/8"}
            }
        ],
        "details": {
            "error": "Unsafe destination: IP address '127.0.0.1' targets a private, loopback, or cloud-metadata address (SSRF blocked)."
        }
    },
    {
        "url": "https://unreachable-domain-sample-987654.test",
        "domain": "unreachable-domain-sample-987654.test",
        "risk_level": "INCONCLUSIVE",
        "risk_score": 10.0,
        "confidence": 0.25,
        "summary": "Analysis yielded inconclusive results due to unreachable domain infrastructure and lack of verifiable threat records.",
        "findings": [
            {
                "category": "DNS",
                "indicator": "DNS_RECORDS_UNAVAILABLE",
                "severity": "INFO",
                "description": "No authoritative A, AAAA, or NS records could be retrieved. (Treated as UNAVAILABLE, not evidence of maliciousness).",
                "source": "DNSAnalyzer",
                "confidence": 0.7,
                "evidence": {"status": "UNAVAILABLE"}
            }
        ],
        "details": {
            "dns": {
                "a_records": [],
                "aaaa_records": [],
                "mx_records": [],
                "ns_records": [],
                "txt_records": [],
                "status": "UNAVAILABLE"
            },
            "redirects": {
                "original_url": "https://unreachable-domain-sample-987654.test",
                "final_url": "https://unreachable-domain-sample-987654.test",
                "hops": [],
                "redirect_count": 0,
                "cross_domain_redirects": False,
                "status": "ERROR",
                "error_message": "Domain name resolution failed"
            },
            "domain_analysis": {
                "subdomain": "",
                "registered_domain": "unreachable-domain-sample-987654.test",
                "tld": "test",
                "full_domain": "unreachable-domain-sample-987654.test",
                "is_punycode": False,
                "domain_length": 34,
                "subdomain_count": 0,
                "has_hyphens": True,
                "hyphen_count": 3,
                "is_brand_impersonation": False,
                "target_brand": None,
                "similarity_score": 0.0,
                "suspicious_patterns": []
            },
            "threat_intel": {
                "provider": "VirusTotal",
                "status": "UNAVAILABLE",
                "is_malicious": False,
                "message": "Threat intelligence lookup unavailable."
            },
            "ai_explanation": {
                "summary": "Analysis of unreachable-domain-sample-987654.test yielded inconclusive results.",
                "risk_level": "INCONCLUSIVE",
                "explanation": [
                    "Core DNS resolution and external threat intelligence records could not be verified.",
                    "The absence of known malicious signatures does not confirm the site is safe."
                ],
                "recommendations": [
                    "Do not assume the website is safe simply because threats were not detected.",
                    "Verify the website through secondary channels before entering information."
                ],
                "is_deterministic_fallback": True
            },
            "unavailable_checks": [
                "DNS verification (unavailable)",
                "Live website response (error)",
                "VirusTotal threat intelligence (API key not configured)"
            ]
        }
    }
]


def seed_database(force: bool = False):
    """Seeds realistic benchmark reports into the database for hackathon demonstration."""
    init_db()
    db = SessionLocal()
    try:
        existing_count = db.query(models.AnalysisReport).count()
        if existing_count >= 5 and not force:
            print(f"Database already contains {existing_count} reports. Skipping seed.")
            return

        if force:
            db.query(models.Finding).delete()
            db.query(models.ThreatIndicator).delete()
            db.query(models.AnalysisReport).delete()
            db.commit()

        print("Seeding demo benchmark investigation reports...")
        base_time = datetime.now(timezone.utc)

        for i, item in enumerate(DEMO_BENCHMARKS):
            created_at = base_time - timedelta(minutes=(len(DEMO_BENCHMARKS) - i) * 12)
            report = models.AnalysisReport(
                submitted_url=item["url"],
                normalized_url=item["url"],
                domain=item["domain"],
                risk_level=item["risk_level"],
                risk_score=item["risk_score"],
                confidence=item["confidence"],
                summary=item["summary"],
                analysis_status="COMPLETED",
                created_at=created_at,
                details=item["details"]
            )
            db.add(report)
            db.flush()

            for f in item["findings"]:
                finding = models.Finding(
                    report_id=report.id,
                    category=f["category"],
                    indicator=f["indicator"],
                    severity=f["severity"],
                    description=f["description"],
                    source=f["source"],
                    confidence=f["confidence"],
                    evidence=f["evidence"],
                    observed_at=created_at
                )
                db.add(finding)

            if item["risk_level"] in ("CONFIRMED_MALICIOUS", "HIGH_RISK"):
                threat_ind = models.ThreatIndicator(
                    indicator_type="DOMAIN" if not item["domain"].replace(".", "").isdigit() else "IP",
                    indicator_value=item["domain"],
                    threat_category="PHISHING" if "paypa1" in item["domain"] else "SUSPICIOUS_WEB_HOST",
                    source="AI-Cybersecurity-Engine",
                    first_seen=created_at,
                    last_seen=created_at
                )
                db.add(threat_ind)

        db.commit()
        print(f"Successfully seeded {len(DEMO_BENCHMARKS)} benchmark demonstration reports!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
