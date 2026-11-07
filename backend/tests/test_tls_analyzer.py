import asyncio
import datetime
import socket
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, ec

from app.services.tls_analyzer import TLSAnalyzer
from app.database import schemas
from app.services.analysis_service import AnalysisService
from app.database.connection import SessionLocal, init_db

init_db()


def generate_mock_cert(
    common_name: str = "example.com",
    sans: list = None,
    key_size: int = 2048,
    is_ecc: bool = False,
    days_valid: int = 90,
    is_expired: bool = False,
    issuer_cn: str = None,
    hash_algo=hashes.SHA256()
):
    """Generates an in-memory X.509 certificate for rapid deterministic testing."""
    if is_ecc:
        private_key = ec.generate_private_key(ec.SECP256R1())
    else:
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)

    subject = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Security Test Subject"),
    ])
    issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, issuer_cn or common_name),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "DigiCert Authority" if issuer_cn else "Security Test Subject"),
    ])

    now = datetime.datetime.now(datetime.timezone.utc)
    if is_expired:
        not_before = now - datetime.timedelta(days=60)
        not_after = now - datetime.timedelta(days=5)
    else:
        not_before = now - datetime.timedelta(days=5)
        not_after = now + datetime.timedelta(days=days_valid)

    builder = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(not_before)
        .not_valid_after(not_after)
    )

    if sans:
        dns_names = [x509.DNSName(s) for s in sans]
        builder = builder.add_extension(x509.SubjectAlternativeName(dns_names), critical=False)

    cert = builder.sign(private_key, hash_algo)
    return cert


@pytest.fixture
def tls_analyzer():
    return TLSAnalyzer(timeout=2.0)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Scenario 1: Valid HTTPS certificate
@pytest.mark.asyncio
async def test_valid_https_certificate(tls_analyzer):
    cert = generate_mock_cert(
        common_name="example.com",
        sans=["example.com", "*.example.com", "www.example.com"],
        key_size=2048,
        days_valid=90,
        issuer_cn="DigiCert Global Root G2"
    )

    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1.3",
        "cipher_suite": "TLS_AES_256_GCM_SHA384",
        "chain_trusted": True,
        "verification_error": None,
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "93.184.216.34", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(
             status="COMPLETED", total_records=12, distinct_issuers=["DigiCert"], recent_certificates_count=3
         )):

        res = await tls_analyzer.analyze("https://example.com")
        assert res.https_available is True
        assert res.certificate_status == "VALID"
        assert res.hostname_match is True
        assert res.chain_status == "TRUSTED"
        assert res.tls_version == "TLSv1.3"
        assert res.cryptographic_strength == "STRONG"
        assert res.certificate_info is not None
        assert res.certificate_info.subject.get("common_name") == "example.com"
        assert res.certificate_info.days_remaining is not None and res.certificate_info.days_remaining > 0


# Scenario 2: Expired certificate
@pytest.mark.asyncio
async def test_expired_certificate(tls_analyzer):
    cert = generate_mock_cert(
        common_name="expired.example.com",
        sans=["expired.example.com"],
        is_expired=True,
        issuer_cn="Let's Encrypt Authority"
    )

    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1.2",
        "cipher_suite": "ECDHE-RSA-AES128-GCM-SHA256",
        "chain_trusted": True,
        "verification_error": None,
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.1", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(status="NOT_FOUND")):

        res = await tls_analyzer.analyze("https://expired.example.com")
        assert res.https_available is True
        assert res.certificate_status == "EXPIRED"
        assert res.certificate_info.days_remaining is not None and res.certificate_info.days_remaining < 0
        assert any(f.finding_id == "TLS_CERT_EXPIRED" for f in res.findings)


# Scenario 3: Certificate hostname mismatch
@pytest.mark.asyncio
async def test_hostname_mismatch(tls_analyzer):
    cert = generate_mock_cert(
        common_name="attacker-server.com",
        sans=["attacker-server.com", "other.com"],
        issuer_cn="Trusted CA"
    )

    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1.3",
        "cipher_suite": "TLS_AES_256_GCM_SHA384",
        "chain_trusted": True,
        "verification_error": None,
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.2", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(status="NOT_FOUND")):

        res = await tls_analyzer.analyze("https://target-bank.com")
        assert res.https_available is True
        assert res.hostname_match is False
        assert res.certificate_status == "MISMATCHED"
        assert any(f.finding_id == "TLS_HOSTNAME_MISMATCH" for f in res.findings)


# Scenario 4: Untrusted / Self-signed certificate chain
@pytest.mark.asyncio
async def test_self_signed_certificate_chain(tls_analyzer):
    # Same subject and issuer represents self-signed
    cert = generate_mock_cert(
        common_name="selfsigned.local",
        sans=["selfsigned.local"],
        issuer_cn=None  # matches subject
    )

    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1.2",
        "cipher_suite": "ECDHE-RSA-AES256-GCM-SHA384",
        "chain_trusted": False,
        "verification_error": "self-signed certificate in certificate chain",
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.3", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(status="NOT_FOUND")):

        res = await tls_analyzer.analyze("https://selfsigned.local")
        assert res.https_available is True
        assert res.chain_status == "SELF_SIGNED"
        assert any(f.finding_id == "TLS_SELF_SIGNED" for f in res.findings)


# Scenario 5: Weak cryptographic configuration (RSA < 2048 and deprecated TLS 1.0)
@pytest.mark.asyncio
async def test_weak_crypto_configuration(tls_analyzer):
    # 1024-bit RSA key is weak
    cert = generate_mock_cert(
        common_name="legacy-crypto.com",
        sans=["legacy-crypto.com"],
        key_size=1024,
        issuer_cn="Legacy CA"
    )

    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1",
        "cipher_suite": "RC4-SHA",
        "chain_trusted": True,
        "verification_error": None,
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.4", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(status="NOT_FOUND")):

        res = await tls_analyzer.analyze("https://legacy-crypto.com")
        assert res.https_available is True
        assert res.cryptographic_strength == "WEAK"
        assert any(f.finding_id == "TLS_DEPRECATED_PROTOCOL" for f in res.findings)
        assert any(f.finding_id == "TLS_WEAK_RSA_KEY" for f in res.findings)


# Scenario 6: Unsupported TLS connection (Connection refused / No HTTPS)
@pytest.mark.asyncio
async def test_unsupported_tls_connection(tls_analyzer):
    mock_handshake = {
        "https_available": False,
        "tls_version": None,
        "cipher_suite": None,
        "chain_trusted": False,
        "verification_error": "[WinError 10061] No connection could be made because the target machine actively refused it",
        "cert_der": None,
        "error": "Connection refused"
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.5", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake):

        res = await tls_analyzer.analyze("http://no-https-server.com")
        assert res.https_available is False
        assert res.certificate_status == "UNABLE_TO_DETERMINE"
        assert res.chain_status == "UNABLE_TO_VERIFY"
        assert res.certificate_info is None


# Scenario 7: Certificate Transparency API success (crt.sh records found)
@pytest.mark.asyncio
async def test_certificate_transparency_success(tls_analyzer):
    mock_records = [
        {"id": 1001, "issuer_name": "C=US, O=Let's Encrypt", "common_name": "example.org", "not_before": "2024-01-01T00:00:00", "not_after": "2024-04-01T00:00:00"},
        {"id": 1002, "issuer_name": "C=US, O=DigiCert Inc", "common_name": "example.org", "not_before": "2023-01-01T00:00:00", "not_after": "2024-01-01T00:00:00"},
    ]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_records

    with patch("httpx.AsyncClient.get", return_value=mock_response):
        ct_result = await tls_analyzer._query_crt_sh("example.org")
        assert ct_result.status == "COMPLETED"
        assert ct_result.total_records == 2
        assert len(ct_result.distinct_issuers) >= 1


# Scenario 8: Certificate Transparency API failure (429 or timeout handled gracefully)
@pytest.mark.asyncio
async def test_certificate_transparency_failure_handled(tls_analyzer):
    with patch("httpx.AsyncClient.get", side_effect=Exception("crt.sh rate limit exceeded (429)")):
        ct_result = await tls_analyzer._query_crt_sh("rate-limited-site.com")
        assert ct_result.status in ("UNAVAILABLE", "ERROR", "TIMEOUT")
        assert ct_result.total_records == 0
        assert ct_result.distinct_issuers == []


# Scenario 9: DNS resolution failure
@pytest.mark.asyncio
async def test_dns_resolution_failure(tls_analyzer):
    with patch("socket.gethostbyname", side_effect=socket.gaierror(-2, "Name or service not known")):
        res = await tls_analyzer.analyze("https://unresolvable-domain-xyz987.org")
        assert res.https_available is False
        assert "DNS resolution failed" in (res.error_message or "")


# Scenario 10: Connection timeout
@pytest.mark.asyncio
async def test_connection_timeout(tls_analyzer):
    mock_handshake = {
        "https_available": False,
        "tls_version": None,
        "cipher_suite": None,
        "chain_trusted": False,
        "verification_error": "Connection attempt timed out after 3.5s",
        "cert_der": None,
        "error": "Connection timed out during HTTPS handshake."
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.10", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake):

        res = await tls_analyzer.analyze("https://timeout-host.com")
        assert res.https_available is False
        assert "timed out" in (res.error_message or "").lower()


# Scenario 11: Private IP rejection (SSRF defense)
@pytest.mark.asyncio
async def test_private_ip_ssrf_rejection(tls_analyzer):
    targets = [
        "https://127.0.0.1",
        "https://10.0.0.1",
        "https://192.168.1.1",
        "https://169.254.169.254",
        "https://localhost"
    ]

    for target in targets:
        res = await tls_analyzer.analyze(target)
        assert res.https_available is False
        assert "SSRF blocked" in (res.error_message or "")


# Scenario 12: Invalid target string handled safely
@pytest.mark.asyncio
async def test_invalid_target_clean_handling(tls_analyzer):
    res = await tls_analyzer.analyze(":::invalid-url///")
    assert res is not None
    assert isinstance(res, schemas.TLSAnalysisResponse)


# Scenario 13: Partial failure — Handshake OK, but CT API fails
@pytest.mark.asyncio
async def test_partial_tls_failure_robustness(tls_analyzer):
    cert = generate_mock_cert("resilient.com", sans=["resilient.com"])
    mock_handshake = {
        "https_available": True,
        "tls_version": "TLSv1.3",
        "cipher_suite": "TLS_AES_128_GCM_SHA256",
        "chain_trusted": True,
        "verification_error": None,
        "cert_der": cert.public_bytes(serialization.Encoding.DER),
        "error": None
    }

    with patch.object(tls_analyzer, "_resolve_and_check_ssrf", return_value=(True, "198.51.100.12", None)), \
         patch.object(tls_analyzer, "_sync_tls_handshake", return_value=mock_handshake), \
         patch.object(tls_analyzer, "_query_crt_sh", return_value=schemas.CertificateTransparencySchema(
             status="ERROR", total_records=0, distinct_issuers=[]
         )):

        res = await tls_analyzer.analyze("https://resilient.com")
        assert res.https_available is True
        assert res.certificate_status == "VALID"
        assert res.certificate_transparency.status == "ERROR"


# Scenario 14: Combined Module 1 + Module 2 report end-to-end
@pytest.mark.asyncio
async def test_combined_module1_and_module2_report(db_session):
    analysis_svc = AnalysisService()

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
        "findings": []
    }

    cert = generate_mock_cert("example.com", sans=["example.com"], issuer_cn="DigiCert Inc")
    mock_tls = schemas.TLSAnalysisResponse(
        target="example.com",
        hostname="example.com",
        port=443,
        https_available=True,
        tls_version="TLSv1.3",
        cipher_suite="TLS_AES_256_GCM_SHA384",
        certificate_status="VALID",
        hostname_match=True,
        chain_status="TRUSTED",
        cryptographic_strength="STRONG",
        findings=[
            schemas.TLSFindingSchema(
                finding_id="TLS_CERT_VALID",
                category="validity",
                title="Certificate Active and Valid",
                description="Certificate is valid.",
                severity="Informational",
                confidence=1.0
            )
        ],
        recommendations=[]
    )

    with patch("app.analyzers.dns_analyzer.DNSAnalyzer.analyze", return_value=mock_dns), \
         patch("app.analyzers.redirect_analyzer.RedirectAnalyzer.analyze", return_value=mock_redirect), \
         patch("app.intelligence.virustotal.VirusTotalProvider.analyze_url", return_value=mock_intel), \
         patch.object(analysis_svc.tls_analyzer, "analyze", return_value=mock_tls):

        report = await analysis_svc.analyze_url("https://example.com", db_session, include_tls=True)
        assert report.id is not None
        assert report.domain == "example.com"
        assert report.tls_analysis is not None
        assert report.tls_analysis.https_available is True
        assert report.tls_analysis.certificate_status == "VALID"
        assert report.tls_analysis.tls_version == "TLSv1.3"
