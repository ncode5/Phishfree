import uuid
from datetime import datetime, timezone
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal, init_db
from app.database import models, schemas
from app.services.indicator_normalizer import IndicatorNormalizer
from app.services.relationship_builder import RelationshipBuilder
from app.services.threat_pattern_detector import ThreatPatternDetector
from app.services.correlation_risk_engine import CorrelationRiskEngine
from app.services.threat_correlation import ThreatCorrelationService
from app.api.endpoints import correlate_report, get_correlation, get_related_threats, get_threat_intelligence_overview

init_db()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def correlation_service():
    return ThreatCorrelationService()


# ============================================================================
# Scenario 1: Domain normalization
# ============================================================================
def test_scenario_01_domain_normalization():
    norm = IndicatorNormalizer()
    assert norm.normalize_domain("   EXAMPLE.COM   ") == "example.com"
    assert norm.normalize_domain("http://sub.TestDomain.com:8080/path?query=1") == "sub.testdomain.com"
    assert norm.normalize_domain("xn--e1afmkfd.xn--p1ai.") == "пример.рф"
    assert norm.normalize_domain("trailingdot.org.") == "trailingdot.org"


# ============================================================================
# Scenario 2: URL normalization
# ============================================================================
def test_scenario_02_url_normalization():
    norm = IndicatorNormalizer()
    u1 = norm.normalize_url("HTTP://Example.COM:80/path/to/resource/#section")
    assert u1 == "http://example.com/path/to/resource"

    u2 = norm.normalize_url("https://secure.site.com:443/login/?b=2&a=1")
    assert u2 == "https://secure.site.com/login?a=1&b=2"

    u3 = norm.normalize_url("phishing.xyz///urgent///")
    assert u3 == "http://phishing.xyz/urgent"


# ============================================================================
# Scenario 3: IP normalization
# ============================================================================
def test_scenario_03_ip_normalization():
    norm = IndicatorNormalizer()
    assert norm.normalize_ip("  192.168.1.1  ") == "192.168.1.1"
    assert norm.normalize_ip("2001:0db8:0000:0000:0000:ff00:0042:8329") == "2001:db8::ff00:42:8329"
    assert norm.normalize_ip("192.168.1.1:8080") == "192.168.1.1"


# ============================================================================
# Scenario 4: Certificate fingerprint normalization
# ============================================================================
def test_scenario_04_cert_fingerprint_normalization():
    norm = IndicatorNormalizer()
    raw = "aa-bb-cc-dd-ee-ff"
    formatted = norm.normalize_cert_fingerprint(raw)
    assert formatted == "AA:BB:CC:DD:EE:FF"

    raw2 = "12 34 56 78 90 ab cd ef"
    formatted2 = norm.normalize_cert_fingerprint(raw2)
    assert formatted2 == "12:34:56:78:90:AB:CD:EF"


# ============================================================================
# Scenario 5: Duplicate indicator detection & occurrence counting
# ============================================================================
def test_scenario_05_duplicate_indicator_detection(db_session):
    builder = RelationshipBuilder()
    dom = f"dup-test-{uuid.uuid4().hex[:6]}.com"

    ind1 = builder.get_or_create_indicator(db_session, "DOMAIN", dom, risk_score=20.0)
    db_session.commit()
    assert ind1.occurrence_count == 1

    ind2 = builder.get_or_create_indicator(db_session, "DOMAIN", f"HTTP://{dom.upper()}/", risk_score=45.0)
    db_session.commit()
    assert ind1.id == ind2.id
    assert ind2.occurrence_count == 2
    assert ind2.risk_score == 45.0


# ============================================================================
# Scenario 6: Related domain detection
# ============================================================================
def test_scenario_06_related_domain_detection(db_session):
    builder = RelationshipBuilder()
    base_dom = f"bank-{uuid.uuid4().hex[:6]}.com"
    url1 = f"https://{base_dom}/login"
    url2 = f"https://{base_dom}/verify-account"

    u_ind1 = builder.get_or_create_indicator(db_session, "URL", url1)
    u_ind2 = builder.get_or_create_indicator(db_session, "URL", url2)
    d_ind = builder.get_or_create_indicator(db_session, "DOMAIN", base_dom)

    r1 = builder.get_or_create_relationship(db_session, u_ind1.id, d_ind.id, "RESOLVES_TO_DOMAIN")
    r2 = builder.get_or_create_relationship(db_session, u_ind2.id, d_ind.id, "RESOLVES_TO_DOMAIN")
    db_session.commit()

    assert r1.target_indicator_id == d_ind.id
    assert r2.target_indicator_id == d_ind.id


# ============================================================================
# Scenario 7: Message-to-URL relationship detection
# ============================================================================
def test_scenario_07_message_to_url_relationship(db_session):
    builder = RelationshipBuilder()
    msg_report = models.MessageAnalysisReport(
        id=str(uuid.uuid4()),
        message_preview="Your card has been locked. Visit http://unlock-card.top",
        message_hash="hash-" + uuid.uuid4().hex[:8],
        message_length=50,
        risk_level="HIGH_RISK",
        risk_score=78.0,
        confidence=0.9,
        primary_category="Banking Fraud",
        categories=["banking_fraud", "urgency"],
        summary="Urgent card suspension scam",
        details={
            "entities": {
                "urls": ["http://unlock-card.top"],
                "emails": [],
                "phone_numbers": []
            }
        }
    )
    db_session.add(msg_report)
    db_session.commit()

    inds, rels = builder.extract_and_link_message_report(db_session, msg_report)
    db_session.commit()

    extracted_rels = [r for r in rels if r.relationship_type == "EXTRACTED_FROM_MESSAGE"]
    assert len(extracted_rels) >= 1
    assert any(i.indicator_type == "URL" and "unlock-card.top" in (i.normalized_value or "") for i in inds)


# ============================================================================
# Scenario 8: URL-to-domain relationship detection
# ============================================================================
def test_scenario_08_url_to_domain_relationship(db_session):
    builder = RelationshipBuilder()
    dom_val = f"portal-{uuid.uuid4().hex[:6]}.net"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"http://{dom_val}/auth",
        normalized_url=f"http://{dom_val}/auth",
        domain=dom_val,
        risk_level="SUSPICIOUS",
        risk_score=55.0,
        confidence=0.85,
        summary="Test auth URL",
        details={"dns": {"a_records": ["1.2.3.4"]}}
    )
    db_session.add(url_report)
    db_session.commit()

    inds, rels = builder.extract_and_link_url_report(db_session, url_report)
    db_session.commit()

    url_to_dom = [r for r in rels if r.relationship_type == "RESOLVES_TO_DOMAIN"]
    assert len(url_to_dom) == 1


# ============================================================================
# Scenario 9: Domain-to-certificate relationship detection
# ============================================================================
def test_scenario_09_domain_to_cert_relationship(db_session):
    builder = RelationshipBuilder()
    dom_val = f"secure-{uuid.uuid4().hex[:6]}.com"
    serial = "998877665544332211"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"https://{dom_val}",
        normalized_url=f"https://{dom_val}",
        domain=dom_val,
        risk_level="LOW_RISK",
        risk_score=15.0,
        confidence=0.9,
        summary="Secure site",
        details={
            "tls_analysis": {
                "certificate_status": "VALID",
                "certificate_info": {
                    "serial_number": serial,
                    "issuer": {"organization": "Let's Encrypt"}
                }
            }
        }
    )
    db_session.add(url_report)
    db_session.commit()

    inds, rels = builder.extract_and_link_url_report(db_session, url_report)
    db_session.commit()

    has_cert_rels = [r for r in rels if r.relationship_type == "HAS_CERTIFICATE"]
    assert len(has_cert_rels) == 1
    assert any(i.indicator_type == "CERT_FINGERPRINT" and serial in (i.normalized_value or "") for i in inds)


# ============================================================================
# Scenario 10: Repeated suspicious indicator detection
# ============================================================================
def test_scenario_10_repeated_suspicious_indicator(db_session):
    builder = RelationshipBuilder()
    suspicious_domain = f"phish-cluster-{uuid.uuid4().hex[:6]}.org"

    ind = builder.get_or_create_indicator(db_session, "DOMAIN", suspicious_domain, risk_score=85.0)
    db_session.commit()
    assert ind.occurrence_count == 1

    # Simulate another report referencing the same domain
    builder.get_or_create_indicator(db_session, "DOMAIN", suspicious_domain, risk_score=85.0)
    db_session.commit()

    updated = db_session.query(models.ThreatIndicator).filter(models.ThreatIndicator.id == ind.id).first()
    assert updated.occurrence_count == 2


# ============================================================================
# Scenario 11: Known malicious indicator correlation
# ============================================================================
def test_scenario_11_known_malicious_correlation(db_session, correlation_service):
    mal_domain = f"confirmed-malware-{uuid.uuid4().hex[:6]}.biz"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"http://{mal_domain}/payload.exe",
        normalized_url=f"http://{mal_domain}/payload.exe",
        domain=mal_domain,
        risk_level="CONFIRMED_MALICIOUS",
        risk_score=95.0,
        confidence=0.99,
        summary="Active malware host",
        details={
            "threat_intel": {
                "provider": "VirusTotal",
                "is_malicious": True,
                "malicious_count": 18,
                "total_engines": 70
            }
        }
    )
    db_session.add(url_report)
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id)
    assert res.risk_level == "CONFIRMED_MALICIOUS"
    assert any(p.pattern_name == "KNOWN_MALICIOUS_THREAT_INTEL" for p in res.patterns)


# ============================================================================
# Scenario 12: False-positive prevention (shared CDN hosting IP)
# ============================================================================
def test_scenario_12_false_positive_prevention(db_session, correlation_service):
    clean_domain = f"innocent-blog-{uuid.uuid4().hex[:6]}.com"
    shared_cdn_ip = "104.21.55.2"

    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"https://{clean_domain}",
        normalized_url=f"https://{clean_domain}",
        domain=clean_domain,
        risk_level="LOW_RISK",
        risk_score=10.0,
        confidence=0.85,
        summary="Normal blog",
        details={
            "dns": {"a_records": [shared_cdn_ip]},
            "threat_intel": {"is_malicious": False}
        }
    )
    db_session.add(url_report)
    db_session.commit()

    # Create previous indicators sharing this CDN IP to simulate high occurrence count
    ip_ind = correlation_service.builder.get_or_create_indicator(db_session, "IP", shared_cdn_ip)
    ip_ind.occurrence_count = 5
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id)
    # Risk should not skyrocket to HIGH_RISK or CONFIRMED_MALICIOUS merely for sharing CDN IP
    assert res.risk_level in ("LOW_RISK", "SUSPICIOUS")
    assert res.correlation_score < 70.0


# ============================================================================
# Scenario 13: Conflicting findings (new domain + valid TLS != safe)
# ============================================================================
def test_scenario_13_conflicting_findings_tls_validity(db_session, correlation_service):
    spoof_domain = f"chase-online-login-{uuid.uuid4().hex[:4]}.com"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"https://{spoof_domain}/signin",
        normalized_url=f"https://{spoof_domain}/signin",
        domain=spoof_domain,
        risk_level="HIGH_RISK",
        risk_score=78.0,
        confidence=0.88,
        summary="Brand spoofing site",
        details={
            "domain_analysis": {"is_brand_impersonation": True, "target_brand": "chase"},
            "tls_analysis": {
                "certificate_status": "VALID",
                "chain_status": "TRUSTED",
                "certificate_info": {"serial_number": "123456", "issuer": {"organization": "Let's Encrypt"}}
            }
        }
    )
    db_session.add(url_report)
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id)
    # Valid TLS must NOT override high-risk brand impersonation
    assert res.risk_level in ("HIGH_RISK", "CONFIRMED_MALICIOUS")
    assert res.correlation_score >= 70.0


# ============================================================================
# Scenario 14: Missing Module 2 evidence
# ============================================================================
def test_scenario_14_missing_module_2_evidence(db_session, correlation_service):
    test_dom = f"no-tls-{uuid.uuid4().hex[:6]}.net"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"http://{test_dom}",
        normalized_url=f"http://{test_dom}",
        domain=test_dom,
        risk_level="SUSPICIOUS",
        risk_score=40.0,
        confidence=0.8,
        summary="Report with no TLS data",
        details={"dns": {"a_records": ["93.184.216.34"]}}  # No tls_analysis section
    )
    db_session.add(url_report)
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id)
    # Missing TLS must be handled gracefully without crashing or false safe verdict
    assert res.id is not None
    assert res.risk_level in ("SUSPICIOUS", "LOW_RISK")


# ============================================================================
# Scenario 15: Missing Module 3 evidence (isolated URL submission)
# ============================================================================
def test_scenario_15_missing_module_3_evidence(db_session, correlation_service):
    test_dom = f"standalone-url-{uuid.uuid4().hex[:6]}.com"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"https://{test_dom}",
        normalized_url=f"https://{test_dom}",
        domain=test_dom,
        risk_level="LOW_RISK",
        risk_score=10.0,
        confidence=0.85,
        summary="Standalone URL without any associated message",
        details={}
    )
    db_session.add(url_report)
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id, report_type="URL")
    assert res.report_type == "URL"
    assert res.graph.nodes is not None


# ============================================================================
# Scenario 16: External API unavailable (threat intel missing)
# ============================================================================
def test_scenario_16_external_api_unavailable(db_session, correlation_service):
    test_dom = f"timeout-intel-{uuid.uuid4().hex[:6]}.com"
    url_report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"http://{test_dom}",
        normalized_url=f"http://{test_dom}",
        domain=test_dom,
        risk_level="HIGH_RISK",
        risk_score=75.0,
        confidence=0.8,
        summary="High risk local heuristics",
        details={"threat_intel": {"status": "UNAVAILABLE"}}
    )
    db_session.add(url_report)
    db_session.commit()

    res = correlation_service.correlate_report(db_session, url_report.id)
    # Missing VT does NOT lower the local 75.0 score to safe
    assert res.correlation_score >= 70.0
    assert res.risk_level == "HIGH_RISK"


# ============================================================================
# Scenario 17: Gemini unavailable (deterministic fallback)
# ============================================================================
def test_scenario_17_gemini_unavailable_fallback(correlation_service):
    explanation = correlation_service._generate_correlation_explanation(
        report_type="URL",
        final_score=75.0,
        risk_level="HIGH_RISK",
        patterns=[
            schemas.ThreatPatternSchema(
                pattern_name="CREDENTIAL_THEFT_LURE_TO_URL",
                description="URL linked to credential phishing lure",
                severity="CRITICAL",
                confidence=0.95,
                reason="Lure urgency correlates with deceptive login"
            )
        ],
        indicators=[]
    )
    assert explanation.is_deterministic_fallback is True
    assert len(explanation.reasoning) >= 1
    assert "CREDENTIAL_THEFT_LURE_TO_URL" in explanation.reasoning[0]
    assert len(explanation.recommendations) >= 1


# ============================================================================
# Scenario 18: Invalid report references (404 handling)
# ============================================================================
def test_scenario_18_invalid_report_references(db_session, correlation_service):
    fake_id = str(uuid.uuid4())
    with pytest.raises(HTTPException) as exc_info:
        correlation_service.correlate_report(db_session, fake_id)
    assert exc_info.value.status_code == 404

    with pytest.raises(HTTPException) as exc_ind:
        correlation_service.get_related_threats(db_session, fake_id)
    assert exc_ind.value.status_code == 404


# ============================================================================
# Scenario 19: Database relationship integrity
# ============================================================================
def test_scenario_19_database_relationship_integrity(db_session):
    builder = RelationshipBuilder()
    ind_src = builder.get_or_create_indicator(db_session, "DOMAIN", f"src-{uuid.uuid4().hex[:6]}.com")
    ind_tgt = builder.get_or_create_indicator(db_session, "IP", "1.1.1.1")
    rel = builder.get_or_create_relationship(db_session, ind_src.id, ind_tgt.id, "HOSTED_ON_IP")
    db_session.commit()

    queried_rel = db_session.query(models.ThreatRelationship).filter(models.ThreatRelationship.id == rel.id).first()
    assert queried_rel is not None
    assert queried_rel.source_indicator_id == ind_src.id
    assert queried_rel.target_indicator_id == ind_tgt.id


# ============================================================================
# Scenario 20: API integration tests
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_20_api_endpoints_integration(db_session):
    test_dom = f"api-test-{uuid.uuid4().hex[:6]}.com"
    report = models.AnalysisReport(
        id=str(uuid.uuid4()),
        submitted_url=f"http://{test_dom}",
        normalized_url=f"http://{test_dom}",
        domain=test_dom,
        risk_level="LOW_RISK",
        risk_score=15.0,
        confidence=0.9,
        summary="API integration test report",
        details={}
    )
    db_session.add(report)
    db_session.commit()

    # 1. POST /correlate
    payload = schemas.CorrelateRequest(report_id=report.id, report_type="URL")
    corr_resp = await correlate_report(payload=payload, db=db_session)
    assert corr_resp.report_id == report.id
    assert corr_resp.graph is not None

    # 2. GET /correlations/{report_id}
    fetch_resp = await get_correlation(report_id=report.id, db=db_session)
    assert fetch_resp.id == corr_resp.id

    # 3. GET /threat-intelligence/overview
    overview_resp = await get_threat_intelligence_overview(db=db_session)
    assert overview_resp.total_indicators >= 1

    # 4. GET /threats/{indicator_id}/related
    first_node_id = corr_resp.graph.nodes[0].id
    related_resp = await get_related_threats(indicator_id=first_node_id, db=db_session)
    assert related_resp.root_indicator.id == first_node_id


# ============================================================================
# Scenario 21: Correlation risk calculation (saturation bounds)
# ============================================================================
def test_scenario_21_correlation_risk_calculation():
    engine = CorrelationRiskEngine()
    patterns = [
        schemas.ThreatPatternSchema(
            pattern_name="MULTI_MESSAGE_DOMAIN_APPEARANCE",
            description="Domain in 5 messages",
            severity="HIGH",
            confidence=0.9
        ),
        schemas.ThreatPatternSchema(
            pattern_name="CREDENTIAL_THEFT_LURE_TO_URL",
            description="Credential lure",
            severity="CRITICAL",
            confidence=0.95
        )
    ]
    score, level, conf, transp = engine.compute_correlation_risk(
        base_score=60.0,
        patterns=patterns,
        has_authoritative_intel=False,
        is_missing_checks=False
    )
    # Score must be bounded between 0 and 100
    assert 60.0 < score <= 100.0
    assert level in ("HIGH_RISK", "SUSPICIOUS")
    assert 0.0 <= conf <= 1.0


# ============================================================================
# Scenario 22: Prevention of duplicate evidence counting
# ============================================================================
def test_scenario_22_prevention_of_duplicate_evidence_counting():
    engine = CorrelationRiskEngine()
    # Pass identical pattern twice
    duplicate_patterns = [
        schemas.ThreatPatternSchema(
            pattern_name="REPEATED_PATTERN",
            description="Instance 1",
            severity="HIGH",
            confidence=1.0
        ),
        schemas.ThreatPatternSchema(
            pattern_name="REPEATED_PATTERN",
            description="Instance 2",
            severity="HIGH",
            confidence=1.0
        )
    ]
    single_patterns = [duplicate_patterns[0]]

    score_single, _, _, _ = engine.compute_correlation_risk(
        base_score=40.0,
        patterns=single_patterns,
        has_authoritative_intel=False,
        is_missing_checks=False
    )
    score_dup, _, _, _ = engine.compute_correlation_risk(
        base_score=40.0,
        patterns=duplicate_patterns,
        has_authoritative_intel=False,
        is_missing_checks=False
    )

    # Risk score must be identical because identical patterns are de-duplicated
    assert score_single == score_dup

