from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple
from app.core.config import settings


@dataclass
class RiskEvaluationResult:
    risk_score: float  # 0.0 to 100.0
    risk_level: str    # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    confidence: float  # 0.0 to 1.0
    category_scores: Dict[str, float]
    summary_bullets: List[str]
    has_sufficient_evidence: bool


class RiskAssessmentEngine:
    """Evidence-based explainable risk scoring engine with configurable weights."""

    def __init__(self):
        # Load weights from settings
        self.weights = {
            "CONFIRMED_THREAT_INTEL_MATCH": settings.WEIGHT_THREAT_INTEL_CONFIRMED,
            "SUSPICIOUS_THREAT_INTEL_MATCH": settings.WEIGHT_THREAT_INTEL_SUSPICIOUS,
            "BRAND_IMPERSONATION_KEYWORD": settings.WEIGHT_BRAND_IMPERSONATION,
            "TYPOSQUATTING_SUSPECTED": settings.WEIGHT_BRAND_IMPERSONATION,
            "SSRF_PRIVATE_IP_BLOCKED": settings.WEIGHT_SSRF_PRIVATE_IP,
            "CROSS_DOMAIN_REDIRECT": settings.WEIGHT_SUSPICIOUS_REDIRECT,
            "EXCESSIVE_REDIRECT_HOPS": 10,
            "IP_ADDRESS_AS_HOSTNAME": 20,
            "EMBEDDED_AT_SYMBOL": 20,
            "DOUBLE_ENCODING_OR_NULL_BYTE": 15,
            "POTENTIALLY_DANGEROUS_FILE_EXTENSION": 20,
            "CREDENTIAL_TARGETING_KEYWORDS": 10,
            "NON_STANDARD_PORT": 10,
            "PUNYCODE_DETECTED": settings.WEIGHT_PUNYCODE_HOMOGLYPH,
            "HOMOGLYPH_SUBSTITUTION": 20,
            "EXCESSIVE_SUBDOMAINS": settings.WEIGHT_SUSPICIOUS_DOMAIN_CHARS,
            "EXCESSIVE_HYPHENS": 10,
            "CONSECUTIVE_HYPHENS": 5,
            "SUSPICIOUS_DOMAIN_LENGTH": 5,
            "SUSPICIOUS_TLD": 5,
        }

        # Category saturation caps to prevent double-counting related indicators
        self.category_caps = {
            "THREAT_INTEL": 55.0,
            "BRAND_PROTECTION": 35.0,
            "NETWORK_REDIRECT": 45.0,
            "URL_STRUCTURE": 30.0,
            "DOMAIN": 25.0,
            "DNS": 15.0,
        }

    def evaluate(
        self,
        findings: List[Dict[str, Any]],
        dns_status: str,
        redirect_status: str,
        threat_intel_status: str,
        is_ip_destination: bool = False
    ) -> RiskEvaluationResult:
        """Evaluates findings, aggregates category scores, and assigns an explainable risk rating."""
        category_contributions: Dict[str, float] = {
            "THREAT_INTEL": 0.0,
            "BRAND_PROTECTION": 0.0,
            "NETWORK_REDIRECT": 0.0,
            "URL_STRUCTURE": 0.0,
            "DOMAIN": 0.0,
            "DNS": 0.0,
        }

        has_confirmed_threat_intel = False
        has_ssrf_block = False
        has_strong_brand_impersonation = False
        has_credential_phishing_combo = False

        summary_bullets: List[str] = []

        # 1. Calculate weights per indicator
        for finding in findings:
            indicator = finding.get("indicator", "")
            category = finding.get("category", "OTHER")
            weight = self.weights.get(indicator, 0.0)

            if indicator == "CONFIRMED_THREAT_INTEL_MATCH":
                has_confirmed_threat_intel = True
            elif indicator == "SSRF_PRIVATE_IP_BLOCKED":
                has_ssrf_block = True
            elif indicator in ("BRAND_IMPERSONATION_KEYWORD", "TYPOSQUATTING_SUSPECTED"):
                has_strong_brand_impersonation = True

            if category in category_contributions:
                category_contributions[category] += weight
            else:
                category_contributions[category] = weight

        # Check for correlated phishing combo (brand impersonation + credential keywords)
        brand_score = category_contributions.get("BRAND_PROTECTION", 0.0)
        url_struct_score = category_contributions.get("URL_STRUCTURE", 0.0)
        if brand_score > 0 and url_struct_score > 0:
            has_credential_phishing_combo = True

        # 2. Apply category saturation caps to eliminate double-counting
        capped_category_scores: Dict[str, float] = {}
        for cat, raw_score in category_contributions.items():
            cap = self.category_caps.get(cat, 100.0)
            capped_category_scores[cat] = min(cap, raw_score)

        total_score = sum(capped_category_scores.values())

        # Bonus synergy penalty if both brand impersonation AND credential path targeting are present
        if has_credential_phishing_combo:
            total_score += 15.0

        risk_score = round(min(100.0, max(0.0, total_score)), 1)

        # 3. Calculate Evidence Completeness / Confidence
        # Confidence reflects how many verification pillars succeeded, independent of risk score
        confidence_points = 0.0
        max_points = 4.0

        # Domain/Structure check always succeeds
        confidence_points += 1.0

        # DNS Check
        if dns_status == "RESOLVED":
            confidence_points += 1.0
        elif dns_status in ("NXDOMAIN", "NOT_APPLICABLE"):
            confidence_points += 0.9
        elif dns_status in ("UNAVAILABLE", "TIMEOUT"):
            confidence_points += 0.2

        # Redirect / Network Check
        if redirect_status in ("COMPLETED", "BLOCKED_SSRF"):
            confidence_points += 1.0
        else:
            confidence_points += 0.3

        # Threat Intelligence Check
        if threat_intel_status == "COMPLETED":
            confidence_points += 1.0
        elif threat_intel_status == "NOT_FOUND":
            confidence_points += 0.7  # Provider replied, but URL has no history
        else:
            confidence_points += 0.1  # Missing key or timeout

        confidence = round(confidence_points / max_points, 2)

        # 4. Check for Sufficient Evidence
        # If the domain doesn't exist, or could not be contacted, threat intel was unavailable,
        # and there are zero high-confidence local indicators (like brand typosquatting or SSRF):
        has_sufficient_evidence = True
        if dns_status in ("UNAVAILABLE", "TIMEOUT") and threat_intel_status in ("UNAVAILABLE", "ERROR") and risk_score < 20:
            has_sufficient_evidence = False

        # 5. Determine Explainable Risk Classification
        if has_confirmed_threat_intel or has_ssrf_block or (has_strong_brand_impersonation and has_credential_phishing_combo) or risk_score >= 75.0:
            risk_level = "CONFIRMED_MALICIOUS"
            summary_bullets.append("Authoritative evidence confirms malicious or fraudulent activity.")
        elif risk_score >= 50.0:
            risk_level = "HIGH_RISK"
            summary_bullets.append("Multiple high-severity security anomalies suggest a significant threat.")
        elif risk_score >= 25.0:
            risk_level = "SUSPICIOUS"
            summary_bullets.append("One or more suspicious patterns identified that warrant caution.")
        elif not has_sufficient_evidence:
            risk_level = "INCONCLUSIVE"
            summary_bullets.append("Insufficient data to establish safety. Essential DNS or threat intelligence sources were unavailable.")
        else:
            risk_level = "LOW_RISK"
            summary_bullets.append("No significant malicious indicators identified across active verification checks.")

        return RiskEvaluationResult(
            risk_score=risk_score,
            risk_level=risk_level,
            confidence=confidence,
            category_scores=capped_category_scores,
            summary_bullets=summary_bullets,
            has_sufficient_evidence=has_sufficient_evidence
        )

