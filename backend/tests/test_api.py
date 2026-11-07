import pytest
from unittest.mock import patch, AsyncMock
from fastapi import HTTPException
from app.database.connection import SessionLocal, init_db
from app.database import schemas
from app.api.endpoints import (
    health_check,
    analyze_url,
    analyze_tls,
    get_report,
    list_reports,
    get_dashboard_stats
)

init_db()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.mark.asyncio
async def test_health_check_endpoint(db_session):
    res = await health_check(db_session)
    assert res.status == "healthy"
    assert res.version == "1.0.0"
    assert "Module 1" in res.active_module


@pytest.mark.asyncio
async def test_invalid_url_submission(db_session):
    payload = schemas.URLAnalyzeRequest(url="ftp://unsupported.com")
    with pytest.raises(HTTPException) as exc_info:
        await analyze_url(payload, db_session)
    assert exc_info.value.status_code == 400
    assert "Disallowed protocol" in exc_info.value.detail


@pytest.mark.asyncio
async def test_analyze_and_retrieve_report(db_session):
    # Mock network calls to ensure fast, offline execution
    mock_dns = AsyncMock()
    mock_dns.status = "RESOLVED"
    mock_dns.a_records = ["93.184.216.34"]
    mock_dns.aaaa_records = []
    mock_dns.mx_records = ["10 mail.example.com"]
    mock_dns.ns_records = ["a.iana-servers.net"]
    mock_dns.txt_records = []
    mock_dns.error_message = None
    mock_dns.findings = []

    mock_redirect = AsyncMock()
    mock_redirect.original_url = "https://example.com"
    mock_redirect.final_url = "https://example.com"
    mock_redirect.hops = []
    mock_redirect.redirect_count = 0
    mock_redirect.cross_domain_redirects = False
    mock_redirect.status = "COMPLETED"
    mock_redirect.error_message = None
    mock_redirect.findings = []

    mock_intel = {
        "provider": "VirusTotal",
        "status": "UNAVAILABLE",
        "is_malicious": False,
        "malicious_count": 0,
        "suspicious_count": 0,
        "harmless_count": 0,
        "total_engines": 0,
        "findings": []
    }

    mock_tls = schemas.TLSAnalysisResponse(
        target="example.com",
        hostname="example.com",
        port=443,
        https_available=True,
        certificate_status="VALID",
        hostname_match=True,
        chain_status="TRUSTED",
        cryptographic_strength="STRONG",
        findings=[],
        recommendations=[]
    )

    with patch("app.analyzers.dns_analyzer.DNSAnalyzer.analyze", return_value=mock_dns), \
         patch("app.analyzers.redirect_analyzer.RedirectAnalyzer.analyze", return_value=mock_redirect), \
         patch("app.intelligence.virustotal.VirusTotalProvider.analyze_url", return_value=mock_intel), \
         patch("app.services.tls_analyzer.TLSAnalyzer.analyze", return_value=mock_tls):

        # 1. Submit URL
        payload = schemas.URLAnalyzeRequest(url="https://example.com")
        report = await analyze_url(payload, db_session)
        assert report.domain == "example.com"
        assert report.risk_level in ("LOW_RISK", "SUSPICIOUS", "HIGH_RISK", "CONFIRMED_MALICIOUS", "INCONCLUSIVE")
        assert report.risk_score >= 0.0
        assert report.summary != ""
        assert report.tls_analysis is not None
        assert report.tls_analysis.https_available is True
        report_id = report.id

        # 2. Retrieve Report by ID
        fetched = await get_report(report_id, db_session)
        assert fetched.id == report_id
        assert fetched.domain == "example.com"
        assert fetched.tls_analysis is not None
        assert fetched.tls_analysis.certificate_status == "VALID"

        # 3. Retrieve Non-Existent Report
        with pytest.raises(HTTPException) as exc_info:
            await get_report("non-existent-uuid-12345", db_session)
        assert exc_info.value.status_code == 404

        # 4. List Reports
        reports_list = await list_reports(limit=10, skip=0, db=db_session)
        assert len(reports_list) >= 1
        assert any(r.id == report_id for r in reports_list)

        # 5. Dashboard Stats
        stats = await get_dashboard_stats(db_session)
        assert stats.total_analyzed >= 1
        assert len(stats.risk_distribution) == 5


@pytest.mark.asyncio
async def test_analyze_tls_endpoint():
    mock_tls = schemas.TLSAnalysisResponse(
        target="secure-site.com",
        hostname="secure-site.com",
        port=443,
        https_available=True,
        certificate_status="VALID",
        hostname_match=True,
        chain_status="TRUSTED",
        cryptographic_strength="STRONG",
        findings=[],
        recommendations=[]
    )

    with patch("app.services.tls_analyzer.TLSAnalyzer.analyze", return_value=mock_tls):
        payload = schemas.TLSAnalyzeRequest(target="https://secure-site.com")
        res = await analyze_tls(payload)
        assert res.hostname == "secure-site.com"
        assert res.https_available is True
        assert res.certificate_status == "VALID"

