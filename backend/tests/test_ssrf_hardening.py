import pytest
from app.analyzers.url_validator import URLValidator, is_ip_private, is_hostname_private
from app.analyzers.redirect_analyzer import RedirectAnalyzer


@pytest.mark.parametrize("url,expected_blocked", [
    ("http://localhost", True),
    ("http://localhost:8000", True),
    ("http://localhost:5173/admin", True),
    ("http://127.0.0.1", True),
    ("http://127.0.0.1:8000", True),
    ("http://127.0.0.2:80", True),
    ("http://10.0.0.1", True),
    ("http://10.255.255.254", True),
    ("http://172.16.0.1", True),
    ("http://172.31.255.254", True),
    ("http://192.168.0.1", True),
    ("http://192.168.1.254", True),
    ("http://169.254.169.254", True),  # AWS / Cloud Metadata
    ("http://169.254.1.1", True),
    ("http://[::1]", True),             # IPv6 Loopback
    ("http://[fe80::1]", True),         # IPv6 Link-Local
    ("http://[fc00::1]", True),         # IPv6 Unique Local
    ("http://app.internal", True),
    ("http://cluster.local", True),
    ("https://example.com", False),
    ("https://google.com/search", False)
])
def test_ssrf_url_validation_matrix(url, expected_blocked):
    """Verifies that all internal, private, loopback, and metadata destinations are blocked."""
    result = URLValidator.validate_and_normalize(url)
    if expected_blocked:
        assert result.is_valid is False
        assert result.is_private_ip is True
        assert "unsafe destination" in result.error_message.lower() or "ssrf" in result.error_message.lower()
    else:
        assert result.is_valid is True
        assert result.is_private_ip is False


def test_ssrf_redirect_to_private_ip_blocked():
    """Verifies that HTTP redirects attempting to hop to a private IP or localhost are intercepted."""
    import asyncio
    analyzer = RedirectAnalyzer()
    
    # Test redirect to localhost hostname
    res_host = asyncio.run(analyzer.analyze("http://localhost:8000"))
    # Redirect analyzer will flag it as BLOCKED_SSRF immediately
    assert res_host.status == "BLOCKED_SSRF"
    assert any("ssrf" in f.get("indicator", "").lower() for f in res_host.findings)

    # Test redirect to private IP literal
    res_ip = asyncio.run(analyzer.analyze("http://169.254.169.254/latest/meta-data/"))
    assert res_ip.status == "BLOCKED_SSRF"
    assert any("ssrf" in f.get("indicator", "").lower() for f in res_ip.findings)


def test_is_ip_private_subnets():
    """Validates low-level subnet checking function against all RFC private blocks."""
    assert is_ip_private("127.0.0.1") is True
    assert is_ip_private("127.255.255.255") is True
    assert is_ip_private("10.10.10.10") is True
    assert is_ip_private("172.16.5.5") is True
    assert is_ip_private("192.168.1.1") is True
    assert is_ip_private("169.254.169.254") is True
    assert is_ip_private("0.0.0.0") is True
    assert is_ip_private("::1") is True
    assert is_ip_private("fe80::1") is True
    assert is_ip_private("8.8.8.8") is False
    assert is_ip_private("1.1.1.1") is False
    assert is_ip_private("93.184.216.34") is False
