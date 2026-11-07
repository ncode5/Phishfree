import uuid
import socket
import asyncio
from datetime import datetime, timezone
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException
import httpx

from app.database.connection import SessionLocal, init_db
from app.database import models, schemas
from app.services.security_headers_analyzer import SecurityHeadersAnalyzer
from app.services.cookie_security_analyzer import CookieSecurityAnalyzer
from app.services.mixed_content_analyzer import MixedContentAnalyzer
from app.services.security_configuration_analyzer import SecurityConfigurationAnalyzer
from app.services.website_security_assessment import WebsiteSecurityAssessmentService
from app.api.endpoints import assess_website_security, get_security_assessment, get_security_findings_filtered

init_db()


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def security_service():
    return WebsiteSecurityAssessmentService()


# ============================================================================
# Scenario 1: HTTPS website assessment
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_01_https_website_assessment(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="example.com",
            hostname="example.com",
            https_available=True,
            certificate_status="VALID",
            hostname_match=True,
            chain_status="TRUSTED",
            cryptographic_strength="STRONG"
        )

        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({
            "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
            "content-security-policy": "default-src 'self'",
            "x-content-type-options": "nosniff",
            "x-frame-options": "DENY",
            "referrer-policy": "strict-origin-when-cross-origin",
            "set-cookie": "sessionid=abc12345; Secure; HttpOnly; SameSite=Strict"
        })
        mock_resp.text = "<html><body><h1>Secure Page</h1></body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        res = await security_service.assess_website(
            url="https://example.com",
            db=db_session,
            include_public_files=False
        )

        assert res.target_url.rstrip("/") == "https://example.com"
        assert res.security_score >= 80.0
        assert res.security_label in ("Strong Configuration", "Good Configuration")


# ============================================================================
# Scenario 2: HTTP-only website (insecure transport)
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_02_http_only_website(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="insecure.com",
            hostname="insecure.com",
            https_available=False,
            certificate_status="UNABLE_TO_DETERMINE",
            chain_status="UNABLE_TO_VERIFY"
        )

        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({"server": "apache"})
        mock_resp.text = "<html><body>Insecure HTTP</body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        res = await security_service.assess_website(
            url="http://insecure.com",
            db=db_session,
            include_public_files=False
        )

        assert any(f.category == "HTTPS_TRANSPORT" and "Not Supported" in f.title for f in res.findings)
        assert res.security_score < 60.0


# ============================================================================
# Scenario 3: HTTP-to-HTTPS redirection
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_03_http_to_https_redirection(security_service):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="redirect-site.com",
            hostname="redirect-site.com",
            https_available=True,
            certificate_status="VALID",
            hostname_match=True
        )

        mock_resp = MagicMock()
        mock_resp.is_redirect = True
        mock_resp.headers = {"location": "https://redirect-site.com/"}
        mock_get.return_value = mock_resp

        score, findings, meta = await security_service._audit_transport_security("redirect-site.com", is_target_https=True)
        assert any(f.title == "Automatic HTTP to HTTPS Redirection Enforced" for f in findings)
        assert score >= 80.0


# ============================================================================
# Scenario 4: HTTPS downgrade redirect
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_04_https_downgrade_redirect(security_service):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="downgrade-site.com",
            hostname="downgrade-site.com",
            https_available=True,
            certificate_status="VALID"
        )

        # First call is http:// (not redirect), second call is https:// (redirects down to http://)
        resp_http = MagicMock()
        resp_http.is_redirect = False

        resp_https = MagicMock()
        resp_https.is_redirect = True
        resp_https.headers = {"location": "http://downgrade-site.com/cleartext"}

        mock_get.side_effect = [resp_http, resp_https]

        score, findings, meta = await security_service._audit_transport_security("downgrade-site.com", is_target_https=True)
        assert any(f.severity == "Critical" and "Downgrade" in f.title for f in findings)


# ============================================================================
# Scenario 5: Missing HSTS
# ============================================================================
def test_scenario_05_missing_hsts():
    analyzer = SecurityHeadersAnalyzer()
    headers = {"content-security-policy": "default-src 'self'"}
    score, evals, findings = analyzer.analyze(headers, is_https=True)

    assert any(f.title == "Strict-Transport-Security (HSTS) Header Missing" for f in findings)
    hsts_eval = next(e for e in evals if e.header_name == "Strict-Transport-Security")
    assert hsts_eval.exists is False
    assert hsts_eval.assessment == "MISSING"


# ============================================================================
# Scenario 6: Missing CSP
# ============================================================================
def test_scenario_06_missing_csp():
    analyzer = SecurityHeadersAnalyzer()
    headers = {"strict-transport-security": "max-age=31536000"}
    score, evals, findings = analyzer.analyze(headers, is_https=True)

    assert any(f.title == "Content-Security-Policy (CSP) Header Missing" for f in findings)
    csp_eval = next(e for e in evals if e.header_name == "Content-Security-Policy")
    assert csp_eval.exists is False


# ============================================================================
# Scenario 7: Weak security header configuration
# ============================================================================
def test_scenario_07_weak_security_headers():
    analyzer = SecurityHeadersAnalyzer()
    headers = {
        "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "referrer-policy": "unsafe-url",
        "strict-transport-security": "max-age=60"  # Too short
    }
    score, evals, findings = analyzer.analyze(headers, is_https=True)

    assert any("Permissive Directives" in f.title for f in findings)
    assert any("unsafe-url" in f.title for f in findings)
    assert any("Too Short" in f.title for f in findings)
    assert score < 70.0


# ============================================================================
# Scenario 8: Secure cookie configuration
# ============================================================================
def test_scenario_08_secure_cookie():
    analyzer = CookieSecurityAnalyzer()
    set_cookies = [
        "auth_token=SECRET_VALUE; Secure; HttpOnly; SameSite=Strict; Path=/"
    ]
    score, evals, findings = analyzer.analyze(set_cookies, is_https=True)

    assert score == 100.0
    assert len(evals) == 1
    assert evals[0].cookie_name == "auth_token"
    assert evals[0].secure is True
    assert evals[0].http_only is True
    assert evals[0].same_site.lower() == "strict"
    # Verify no secret value stored
    assert not hasattr(evals[0], "cookie_value")


# ============================================================================
# Scenario 9: Cookie missing Secure flag
# ============================================================================
def test_scenario_09_cookie_missing_secure():
    analyzer = CookieSecurityAnalyzer()
    set_cookies = [
        "session_id=123456; HttpOnly; SameSite=Lax"
    ]
    score, evals, findings = analyzer.analyze(set_cookies, is_https=True)

    assert any("Missing Secure Flag" in f.title for f in findings)
    assert score < 100.0


# ============================================================================
# Scenario 10: Cookie missing HttpOnly flag
# ============================================================================
def test_scenario_09_10_cookie_missing_httponly():
    analyzer = CookieSecurityAnalyzer()
    set_cookies = [
        "jwt_token=eyJhbGciOi...; Secure; SameSite=Lax"
    ]
    score, evals, findings = analyzer.analyze(set_cookies, is_https=True)

    assert any("Missing HttpOnly Flag" in f.title for f in findings)


# ============================================================================
# Scenario 11: SameSite configuration (missing or None without Secure)
# ============================================================================
def test_scenario_11_samesite_configuration():
    analyzer = CookieSecurityAnalyzer()
    # SameSite=None without Secure
    set_cookies = ["tracking=xyz; SameSite=None"]
    score, evals, findings = analyzer.analyze(set_cookies, is_https=True)

    assert any("SameSite=None" in f.title for f in findings)


# ============================================================================
# Scenario 12: Mixed content in HTML
# ============================================================================
def test_scenario_12_mixed_content_in_html():
    analyzer = MixedContentAnalyzer()
    html = """
    <html>
      <head>
        <script src="http://cdn.insecure.com/script.js"></script>
        <link rel="stylesheet" href="http://cdn.insecure.com/style.css">
      </head>
      <body>
        <img src="http://cdn.insecure.com/tracker.png" />
        <form action="http://insecure-endpoint.com/submit"></form>
      </body>
    </html>
    """
    score, findings, details = analyzer.analyze(html, is_https=True)

    assert any("Active Mixed Content: Insecure HTTP Script" in f.title for f in findings)
    assert any("Insecure Form Action" in f.title for f in findings)
    assert any("Passive Mixed Content" in f.title for f in findings)
    assert score < 50.0


# ============================================================================
# Scenario 13: No mixed content
# ============================================================================
def test_scenario_13_no_mixed_content():
    analyzer = MixedContentAnalyzer()
    html = """
    <html>
      <head>
        <script src="https://cdn.secure.com/app.js"></script>
        <link rel="stylesheet" href="/assets/style.css">
      </head>
      <body>
        <img src="https://images.secure.com/logo.svg" />
      </body>
    </html>
    """
    score, findings, details = analyzer.analyze(html, is_https=True)
    assert score == 100.0
    assert len(findings) == 0


# ============================================================================
# Scenario 14: Server information exposure (version disclosure)
# ============================================================================
def test_scenario_14_server_information_exposure():
    analyzer = SecurityConfigurationAnalyzer()
    headers = {
        "server": "Apache/2.4.41 (Ubuntu)",
        "x-powered-by": "PHP/7.4.3"
    }
    score, findings, exposed = analyzer.analyze_information_exposure(headers)

    assert any("Detailed Web Server Version Disclosed" in f.title for f in findings)
    assert any("X-Powered-By" in f.title for f in findings)
    assert score <= 50.0


# ============================================================================
# Scenario 15: security.txt availability
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_15_security_txt_availability():
    analyzer = SecurityConfigurationAnalyzer()
    with patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        resp_sec = MagicMock()
        resp_sec.status_code = 200
        resp_sec.text = "Contact: security@example.com\nExpires: 2027-01-01T00:00:00.000Z"

        resp_404 = MagicMock()
        resp_404.status_code = 404
        resp_404.text = "Not found"

        mock_get.side_effect = [resp_sec, resp_404, resp_404]

        score, findings, files = await analyzer.analyze_public_security_files("https://example.com")
        assert any("security.txt File Present" in f.title for f in findings)


# ============================================================================
# Scenario 16: robots.txt availability and sensitive path disclosure
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_16_robots_txt_sensitive_paths():
    analyzer = SecurityConfigurationAnalyzer()
    with patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        resp_404 = MagicMock()
        resp_404.status_code = 404
        resp_404.text = "Not found"

        resp_robots = MagicMock()
        resp_robots.status_code = 200
        resp_robots.text = "User-agent: *\nDisallow: /admin/\nDisallow: /backup.sql"

        mock_get.side_effect = [resp_404, resp_robots, resp_404]

        score, findings, files = await analyzer.analyze_public_security_files("https://example.com")
        assert any("Sensitive Paths Disclosed in robots.txt" in f.title for f in findings)


# ============================================================================
# Scenario 17: Public file request failure handling
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_17_public_file_request_failure():
    analyzer = SecurityConfigurationAnalyzer()
    with patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get", side_effect=httpx.ConnectTimeout("Connection timed out")):

        score, findings, files = await analyzer.analyze_public_security_files("https://example.com")
        assert files["security.txt"]["exists"] is False
        assert "error" in files["security.txt"]


# ============================================================================
# Scenario 18: Private IP rejection (SSRF)
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_18_private_ip_rejection(security_service, db_session):
    with patch("socket.gethostbyname", return_value="192.168.1.100"):
        with pytest.raises(HTTPException) as exc:
            await security_service.assess_website("http://internal-router.local", db=db_session)
        assert exc.value.status_code == 400
        assert "SSRF defense" in exc.value.detail


# ============================================================================
# Scenario 19: Localhost rejection (SSRF)
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_19_localhost_rejection(security_service, db_session):
    with pytest.raises(HTTPException) as exc:
        await security_service.assess_website("http://localhost:8080/admin", db=db_session)
    assert exc.value.status_code == 400
    assert "localhost or loopback" in exc.value.detail


# ============================================================================
# Scenario 20: DNS resolution failure protection
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_20_dns_resolution_failure(security_service, db_session):
    with patch("socket.gethostbyname", side_effect=socket.gaierror("NXDOMAIN")):
        with pytest.raises(HTTPException) as exc:
            await security_service.assess_website("http://nonexistent-domain-xyz-1234.org", db=db_session)
        assert exc.value.status_code == 400
        assert "Unable to resolve DNS" in exc.value.detail


# ============================================================================
# Scenario 21: Redirect to private IP rejection (SSRF in file analysis)
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_21_public_file_ssrf_block():
    analyzer = SecurityConfigurationAnalyzer()
    with patch("socket.gethostbyname", return_value="10.0.0.1"):
        score, findings, status = await analyzer.analyze_public_security_files("http://private-metadata.aws")
        assert status.get("status") == "BLOCKED_SSRF"
        assert any("SSRF Protection Blocked" in f.title for f in findings)


# ============================================================================
# Scenario 22: Oversized response handling
# ============================================================================
def test_scenario_22_oversized_response_truncation():
    analyzer = MixedContentAnalyzer()
    # Create HTML larger than 1MB
    large_html = "<html><body>" + ("<p>Text</p>" * 200_000) + "<script src='http://late.com/bad.js'></script></body></html>"
    assert len(large_html) > analyzer.MAX_HTML_LENGTH

    # Must complete safely without OOM or hanging
    score, findings, details = analyzer.analyze(large_html, is_https=True)
    assert score is not None


# ============================================================================
# Scenario 23: Timeout handling
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_23_timeout_handling(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", side_effect=asyncio.TimeoutError("TLS timed out")), \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get", side_effect=httpx.ReadTimeout("Timeout")):

        res = await security_service.assess_website(
            url="https://slow-site.com",
            db=db_session,
            include_public_files=False
        )

        assert res.coverage.completed < res.coverage.total
        assert len(res.coverage.unavailable_checks) >= 1


# ============================================================================
# Scenario 24: TLS integration from Module 2
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_24_tls_integration(security_service):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="valid-tls.com",
            hostname="valid-tls.com",
            https_available=True,
            certificate_status="VALID",
            chain_status="TRUSTED",
            cryptographic_strength="STRONG"
        )
        mock_resp = MagicMock()
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        score, findings, meta = await security_service._audit_transport_security("valid-tls.com", is_target_https=True)
        assert meta["tls_status"] == "VALID"
        assert score >= 80.0


# ============================================================================
# Scenario 25: Partial assessment failure
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_25_partial_assessment_failure(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get", side_effect=Exception("Connection refused")):

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="partial.com",
            hostname="partial.com",
            https_available=True,
            certificate_status="VALID"
        )

        res = await security_service.assess_website(
            url="https://partial.com",
            db=db_session,
            include_public_files=False
        )

        assert res.status == "PARTIAL"
        assert res.coverage.percentage < 100.0


# ============================================================================
# Scenario 26: Score calculation & weighting
# ============================================================================
def test_scenario_26_score_calculation(security_service):
    weights = security_service.CATEGORY_WEIGHTS
    assert sum(weights.values()) == pytest.approx(1.0, 0.01)
    assert weights["https_transport"] == 0.25
    assert weights["security_headers"] == 0.25
    assert weights["cookie_security"] == 0.20
    assert weights["mixed_content"] == 0.15
    assert weights["information_exposure"] == 0.05
    assert weights["security_config"] == 0.10


# ============================================================================
# Scenario 27: Assessment coverage calculation
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_27_coverage_calculation(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="coverage-test.com",
            hostname="coverage-test.com",
            https_available=True,
            certificate_status="VALID"
        )
        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({"server": "nginx"})
        mock_resp.text = "<html><body>Content</body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        res = await security_service.assess_website(
            url="https://coverage-test.com",
            db=db_session,
            include_public_files=False
        )

        assert res.coverage.total == 6
        assert res.coverage.completed >= 4


# ============================================================================
# Scenario 28: Duplicate finding prevention in recommendations
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_28_duplicate_recommendation_prevention(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="dedup.com",
            hostname="dedup.com",
            https_available=True,
            certificate_status="VALID"
        )
        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({})
        mock_resp.text = "<html><body></body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        res = await security_service.assess_website(
            url="https://dedup.com",
            db=db_session,
            include_public_files=False
        )

        # Unique recommendations list check
        assert len(res.recommendations) == len(set(res.recommendations))


# ============================================================================
# Scenario 29: Database persistence
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_29_database_persistence(security_service, db_session):
    with patch.object(security_service.tls_analyzer, "analyze", new_callable=AsyncMock) as mock_tls, \
         patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_tls.return_value = schemas.TLSAnalysisResponse(
            target="db-persist.com",
            hostname="db-persist.com",
            https_available=True,
            certificate_status="VALID"
        )
        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({"x-frame-options": "DENY"})
        mock_resp.text = "<html><body>DB Test</body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        res = await security_service.assess_website(
            url="https://db-persist.com",
            db=db_session,
            include_public_files=False
        )

        fetched = security_service.get_assessment_by_id(db_session, res.report_id)
        assert fetched is not None
        assert fetched.target_url.rstrip("/") == "https://db-persist.com"
        assert fetched.security_score == res.security_score


# ============================================================================
# Scenario 30: API integration
# ============================================================================
@pytest.mark.asyncio
async def test_scenario_30_api_endpoints_integration(db_session):
    with patch("socket.gethostbyname", return_value="93.184.216.34"), \
         patch("httpx.AsyncClient.get") as mock_get:

        mock_resp = MagicMock()
        mock_resp.headers = httpx.Headers({"content-security-policy": "default-src 'self'"})
        mock_resp.text = "<html><body>API Test</body></html>"
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_get.return_value = mock_resp

        # 1. POST /analyze/security
        req = schemas.SecurityAssessRequest(
            url="https://api-assess-test.com",
            include_public_files=False
        )
        assess_resp = await assess_website_security(payload=req, db=db_session)
        assert assess_resp.report_id is not None
        assert assess_resp.security_score is not None

        # 2. GET /security/{report_id}
        get_resp = await get_security_assessment(report_id=assess_resp.report_id, db=db_session)
        assert get_resp.report_id == assess_resp.report_id

        # 3. GET /security/{report_id}/findings
        findings_resp = await get_security_findings_filtered(
            report_id=assess_resp.report_id,
            severity=None,
            category=None,
            limit=10,
            skip=0,
            db=db_session
        )
        assert findings_resp.total >= 0
        assert isinstance(findings_resp.findings, list)
