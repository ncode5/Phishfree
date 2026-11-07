import re
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_, String, cast

from app.database import models, schemas


class ThreatPatternDetector:
    """Evaluates cross-module and cross-report correlation rules to identify campaign patterns."""

    POPULAR_SHARED_INFRA_ASNS = {"CLOUDFLARE", "FASTLY", "AMAZON", "GOOGLE", "AKAMAI", "MICROSOFT"}

    def detect_patterns(
        self,
        db: Session,
        report_id: str,
        report_type: str,
        current_report: Any,
        indicators: List[models.ThreatIndicator],
        relationships: List[models.ThreatRelationship]
    ) -> List[schemas.ThreatPatternSchema]:
        """Runs the rule-based correlation engine across all available indicators and historical reports."""
        patterns: List[schemas.ThreatPatternSchema] = []

        domain_indicators = [i for i in indicators if i.indicator_type == "DOMAIN"]
        url_indicators = [i for i in indicators if i.indicator_type == "URL"]
        ip_indicators = [i for i in indicators if i.indicator_type == "IP"]
        cert_indicators = [i for i in indicators if i.indicator_type == "CERT_FINGERPRINT"]
        msg_indicators = [i for i in indicators if i.indicator_type == "MESSAGE"]

        # Rule 1: Domain appears in multiple suspicious messages
        for d_ind in domain_indicators:
            d_val = d_ind.normalized_value or d_ind.indicator_value
            # Query message reports that mention this domain
            query = db.query(models.MessageAnalysisReport).filter(
                cast(models.MessageAnalysisReport.details, String).like(f"%{d_val}%")
            )
            msg_reports = query.limit(10).all()
            if len(msg_reports) >= 2:
                patterns.append(
                    schemas.ThreatPatternSchema(
                        pattern_name="MULTI_MESSAGE_DOMAIN_APPEARANCE",
                        description=f"Domain '{d_val}' was observed across {len(msg_reports)} independent suspicious message reports.",
                        severity="HIGH",
                        confidence=0.92,
                        supporting_evidence=[
                            {"domain": d_val, "message_report_id": r.id, "risk_level": r.risk_level}
                            for r in msg_reports
                        ],
                        related_reports=[r.id for r in msg_reports],
                        reason="Coordinated scam campaigns frequently distribute the same target landing page across SMS, WhatsApp, and phishing emails."
                    )
                )

        # Rule 2: Multiple suspicious URLs point to the same domain
        for d_ind in domain_indicators:
            d_val = d_ind.normalized_value or d_ind.indicator_value
            related_url_rels = [
                r for r in relationships
                if r.target_indicator_id == d_ind.id and r.relationship_type == "RESOLVES_TO_DOMAIN"
            ]
            # Also check database for other URLs pointing to this domain
            db_url_count = db.query(models.ThreatRelationship).filter(
                models.ThreatRelationship.target_indicator_id == d_ind.id,
                models.ThreatRelationship.relationship_type == "RESOLVES_TO_DOMAIN"
            ).count()

            if len(related_url_rels) >= 2 or db_url_count >= 2:
                count = max(len(related_url_rels), db_url_count)
                patterns.append(
                    schemas.ThreatPatternSchema(
                        pattern_name="MULTIPLE_SUSPICIOUS_URLS_SAME_DOMAIN",
                        description=f"{count} distinct suspicious URLs resolve to the root domain '{d_val}'.",
                        severity="HIGH" if count >= 3 else "MEDIUM",
                        confidence=0.88,
                        supporting_evidence=[
                            {"domain": d_val, "associated_urls_count": count}
                        ],
                        related_reports=[report_id],
                        reason="Attackers frequently generate multiple unique paths or subpaths to evade signature-based URL blocklists while keeping the root domain constant."
                    )
                )

        # Rule 3: URL appears in a message containing credential-theft or urgency language
        is_credential_lure = False
        lure_evidence = []
        if report_type == "MESSAGE" and isinstance(current_report, models.MessageAnalysisReport):
            cats = current_report.categories or []
            if any(c in ["credential_theft", "kyc_fraud", "banking_fraud", "urgency"] for c in cats):
                is_credential_lure = True
                lure_evidence.append({
                    "message_id": current_report.id,
                    "categories": cats,
                    "preview": current_report.message_preview
                })
        else:
            # Check if any URL indicator is linked to a message report in the database
            for u_ind in url_indicators:
                msg_rels = db.query(models.ThreatRelationship).filter(
                    models.ThreatRelationship.target_indicator_id == u_ind.id,
                    models.ThreatRelationship.relationship_type == "EXTRACTED_FROM_MESSAGE"
                ).all()
                if msg_rels:
                    is_credential_lure = True
                    lure_evidence.append({
                        "url": u_ind.normalized_value,
                        "linked_messages_count": len(msg_rels)
                    })

        if is_credential_lure and url_indicators:
            patterns.append(
                schemas.ThreatPatternSchema(
                    pattern_name="CREDENTIAL_THEFT_LURE_TO_URL",
                    description="Extracted URL is coupled with aggressive urgency, credential harvesting, or fake KYC communication.",
                    severity="CRITICAL",
                    confidence=0.95,
                    supporting_evidence=lure_evidence,
                    related_reports=[report_id],
                    reason="Combining social engineering urgency with an unverified external URL is a primary indicator of active credential phishing."
                )
            )

        # Rule 4: Domain or IP has known malicious threat-intelligence match
        for ind in domain_indicators + ip_indicators:
            val = ind.normalized_value or ind.indicator_value
            # Check if flagged by VirusTotal or local high-confidence list
            vt_match = False
            evidence_details = {}
            if hasattr(current_report, "details") and current_report.details:
                ti = current_report.details.get("threat_intel") or {}
                if ti.get("is_malicious"):
                    vt_match = True
                    evidence_details = {
                        "provider": ti.get("provider", "VirusTotal"),
                        "malicious_engines": ti.get("malicious_count", 0),
                        "total_engines": ti.get("total_engines", 0)
                    }

            if ind.threat_category in ("PHISHING", "MALWARE", "C2") and ind.risk_score >= 80:
                vt_match = True
                evidence_details = {"source": ind.source, "category": ind.threat_category, "score": ind.risk_score}

            if vt_match:
                patterns.append(
                    schemas.ThreatPatternSchema(
                        pattern_name="KNOWN_MALICIOUS_THREAT_INTEL",
                        description=f"Indicator '{val}' matches confirmed malicious threat intelligence databases.",
                        severity="CRITICAL",
                        confidence=0.99,
                        supporting_evidence=[{"indicator": val, "details": evidence_details}],
                        related_reports=[report_id],
                        reason="Authoritative global security telemetry confirms that this indicator has previously delivered malicious payloads or hosted phishing campaigns."
                    )
                )

        # Rule 5: Reused certificate fingerprint across multiple domains or previous reports
        for c_ind in cert_indicators:
            # Count domains sharing this certificate in the threat graph
            domain_rels = db.query(models.ThreatRelationship).filter(
                models.ThreatRelationship.target_indicator_id == c_ind.id,
                models.ThreatRelationship.relationship_type == "HAS_CERTIFICATE"
            ).all()
            if len(domain_rels) >= 2 or (c_ind.occurrence_count or 1) >= 2:
                count = max(len(domain_rels), c_ind.occurrence_count or 1)
                patterns.append(
                    schemas.ThreatPatternSchema(
                        pattern_name="REUSED_CERTIFICATE_ACROSS_DOMAINS",
                        description=f"TLS certificate '{c_ind.normalized_value}' is shared across {count} distinct domains or historical reports.",
                        severity="MEDIUM",
                        confidence=0.82,
                        supporting_evidence=[
                            {"certificate_identifier": c_ind.normalized_value, "associated_domains_count": count}
                        ],
                        related_reports=[report_id],
                        reason="Threat actors often purchase or automate single certificates across sprawling clusters of typo-squatted attack domains."
                    )
                )

        # Rule 6: Suspicious DNS and redirect findings
        has_suspicious_redirects = False
        redirect_evidence = []
        if hasattr(current_report, "details") and current_report.details:
            reds = current_report.details.get("redirects") or {}
            if reds.get("cross_domain_redirects") or reds.get("redirect_count", 0) >= 3 or reds.get("status") == "BLOCKED_SSRF":
                has_suspicious_redirects = True
                redirect_evidence.append({
                    "redirect_count": reds.get("redirect_count", 0),
                    "cross_domain": reds.get("cross_domain_redirects", False),
                    "status": reds.get("status")
                })

        if has_suspicious_redirects:
            patterns.append(
                schemas.ThreatPatternSchema(
                    pattern_name="SUSPICIOUS_DNS_AND_REDIRECTS",
                    description="Multiple cross-domain redirects or evasive hop chaining detected before reaching final landing page.",
                    severity="HIGH",
                    confidence=0.85,
                    supporting_evidence=redirect_evidence,
                    related_reports=[report_id],
                    reason="Attackers chain multiple URL shorteners and intermediaries to bypass automated URL reputation filters."
                )
            )

        # Rule 7: Multi-Module Corroboration
        # (Module 1 findings + Module 2 TLS warnings + Module 3 Social Engineering)
        mod1_flag = False
        mod2_flag = False
        mod3_flag = False
        corroboration_findings = []

        if hasattr(current_report, "details") and current_report.details:
            # Mod 1 check
            dom_data = current_report.details.get("domain_analysis") or {}
            if dom_data.get("is_brand_impersonation") or dom_data.get("is_punycode"):
                mod1_flag = True
                corroboration_findings.append("Module 1: Brand impersonation or punycode spoofing identified.")

            # Mod 2 check
            tls_data = current_report.details.get("tls_analysis") or {}
            if tls_data.get("certificate_status") in ("EXPIRED", "UNTRUSTED") or not tls_data.get("hostname_match", True):
                mod2_flag = True
                corroboration_findings.append(f"Module 2: TLS invalid or hostname mismatch ({tls_data.get('certificate_status')}).")

        if report_type == "MESSAGE" or is_credential_lure:
            mod3_flag = True
            corroboration_findings.append("Module 3: Urgency, fear, or deceptive social engineering tactics detected.")

        if (mod1_flag and mod2_flag) or (mod1_flag and mod3_flag) or (mod2_flag and mod3_flag):
            patterns.append(
                schemas.ThreatPatternSchema(
                    pattern_name="MULTI_MODULE_CORROBORATION",
                    description="Multi-engine telemetry corroborates threat: independent indicators across URL structure, TLS trust, and message context reinforce risk.",
                    severity="HIGH" if (mod1_flag and mod2_flag and mod3_flag) else "MEDIUM",
                    confidence=0.91,
                    supporting_evidence=[{"corroborating_findings": corroboration_findings}],
                    related_reports=[report_id],
                    reason="When independent modules (URL, TLS, and Content) simultaneously flag anomalies, the false-positive probability is drastically reduced."
                )
            )

        # Rule 8: Shared Hosting Neutrality Guard (False-positive mitigation)
        # If IP is shared Cloudflare/CDN without malicious findings, add informational note
        for ip_ind in ip_indicators:
            val = ip_ind.normalized_value or ip_ind.indicator_value
            if (ip_ind.occurrence_count or 1) >= 3 and not any(p.severity in ("HIGH", "CRITICAL") for p in patterns):
                patterns.append(
                    schemas.ThreatPatternSchema(
                        pattern_name="SHARED_HOSTING_NEUTRAL_OBSERVATION",
                        description=f"IP address '{val}' hosts multiple domains, typical of modern shared CDN or cloud infrastructure.",
                        severity="INFO",
                        confidence=0.95,
                        supporting_evidence=[{"ip": val, "shared_domain_count": ip_ind.occurrence_count}],
                        related_reports=[report_id],
                        reason="A shared hosting IP alone does not indicate malicious coordination, as thousands of legitimate domains share CDN proxy endpoints."
                    )
                )
                break

        return patterns
