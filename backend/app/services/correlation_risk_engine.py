import math
from typing import List, Dict, Any, Tuple
from app.database import schemas


class CorrelationRiskEngine:
    """Evaluates cross-module evidence with strict independence checking to prevent double-counting."""

    SEVERITY_WEIGHTS = {
        "CRITICAL": 35.0,
        "HIGH": 20.0,
        "MEDIUM": 10.0,
        "LOW": 5.0,
        "INFO": 0.0,
    }

    def compute_correlation_risk(
        self,
        base_score: float,
        patterns: List[schemas.ThreatPatternSchema],
        has_authoritative_intel: bool,
        is_missing_checks: bool
    ) -> Tuple[float, str, float, schemas.EvidenceTransparencySchema]:
        """Calculates normalized correlation risk score, categorical risk level, confidence, and transparent evidence demarcation."""

        # 1. Base score grounding
        score = float(base_score or 0.0)

        # 2. De-duplicate patterns by pattern_name to prevent double-counting
        seen_patterns = set()
        pattern_contributions = 0.0

        rule_based_evidence: List[Dict[str, Any]] = []

        for p in patterns:
            p_name = p.pattern_name
            if p_name in seen_patterns:
                continue
            seen_patterns.add(p_name)

            rule_based_evidence.append({
                "pattern": p_name,
                "severity": p.severity,
                "confidence": p.confidence,
                "description": p.description,
                "reason": p.reason
            })

            # Ignore INFO patterns for risk inflation (e.g. shared CDN hosting)
            if p.severity in self.SEVERITY_WEIGHTS:
                weight = self.SEVERITY_WEIGHTS[p.severity] * p.confidence
                pattern_contributions += weight

        # Non-linear saturation to avoid runaway double-counting
        # Additional correlated patterns increase risk asymptotically towards 100
        combined_score = score + pattern_contributions * (1.0 - (score / 110.0))
        final_score = max(0.0, min(100.0, round(combined_score, 1)))

        # 3. Determine Risk Level
        # Critical rule: CONFIRMED_MALICIOUS requires authoritative external evidence
        if final_score >= 90.0 and has_authoritative_intel:
            risk_level = "CONFIRMED_MALICIOUS"
            confidence = 0.98
        elif final_score >= 70.0:
            risk_level = "HIGH_RISK"
            confidence = 0.90
        elif final_score >= 30.0:
            risk_level = "SUSPICIOUS"
            confidence = 0.85
        elif final_score > 0.0:
            risk_level = "LOW_RISK"
            confidence = 0.80
        else:
            if is_missing_checks:
                risk_level = "INCONCLUSIVE"
                confidence = 0.40
            else:
                risk_level = "LOW_RISK"
                confidence = 0.85

        # 4. Construct Evidence Transparency
        transparency = schemas.EvidenceTransparencySchema(
            verified_external_evidence=[],
            technical_observations=[],
            rule_based_correlations=rule_based_evidence,
            ai_generated_insights=[]
        )

        return final_score, risk_level, confidence, transparency

