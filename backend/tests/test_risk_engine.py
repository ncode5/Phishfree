import pytest
from app.risk_engine.scoring import RiskAssessmentEngine


def test_confirmed_malicious_classification():
    engine = RiskAssessmentEngine()

    findings = [
        {
            "category": "THREAT_INTEL",
            "indicator": "CONFIRMED_THREAT_INTEL_MATCH",
            "severity": "CRITICAL",
            "description": "Flagged by 12 engines",
            "confidence": 0.99
        }
    ]

    res = engine.evaluate(
        findings=findings,
        dns_status="RESOLVED",
        redirect_status="COMPLETED",
        threat_intel_status="COMPLETED"
    )

    assert res.risk_level == "CONFIRMED_MALICIOUS"
    assert res.risk_score >= 50.0
    assert res.confidence > 0.8


def test_suspicious_brand_typosquatting():
    engine = RiskAssessmentEngine()

    findings = [
        {
            "category": "BRAND_PROTECTION",
            "indicator": "TYPOSQUATTING_SUSPECTED",
            "severity": "HIGH",
            "description": "Resembles brand paypal",
            "confidence": 0.9
        },
        {
            "category": "DOMAIN",
            "indicator": "EXCESSIVE_HYPHENS",
            "severity": "MEDIUM",
            "description": "Multiple hyphens",
            "confidence": 0.7
        }
    ]

    res = engine.evaluate(
        findings=findings,
        dns_status="RESOLVED",
        redirect_status="COMPLETED",
        threat_intel_status="NOT_FOUND"
    )

    assert res.risk_level in ("SUSPICIOUS", "HIGH_RISK")
    assert res.risk_score >= 25.0


def test_inconclusive_when_evidence_insufficient():
    engine = RiskAssessmentEngine()

    # DNS failed, threat intel unavailable, no local indicators
    findings = []

    res = engine.evaluate(
        findings=findings,
        dns_status="UNAVAILABLE",
        redirect_status="ERROR",
        threat_intel_status="UNAVAILABLE"
    )

    assert res.risk_level == "INCONCLUSIVE"
    assert res.has_sufficient_evidence is False


def test_low_risk_classification():
    engine = RiskAssessmentEngine()

    findings = [
        {
            "category": "DNS",
            "indicator": "DNS_RECORDS_RESOLVED",
            "severity": "INFO",
            "description": "DNS valid",
            "confidence": 1.0
        }
    ]

    res = engine.evaluate(
        findings=findings,
        dns_status="RESOLVED",
        redirect_status="COMPLETED",
        threat_intel_status="COMPLETED"
    )

    assert res.risk_level == "LOW_RISK"
    assert res.risk_score < 25.0
    assert res.confidence >= 0.7

