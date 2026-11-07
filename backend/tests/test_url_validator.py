import pytest
from app.analyzers.url_validator import URLValidator, is_ip_private


def test_valid_urls():
    v = URLValidator()

    res = v.validate_and_normalize("https://example.com/path?query=1")
    assert res.is_valid is True
    assert res.hostname == "example.com"
    assert res.scheme == "https"
    assert res.normalized_url == "https://example.com/path?query=1"

    # Bare domain should default to http://
    res2 = v.validate_and_normalize("google.com")
    assert res2.is_valid is True
    assert res2.hostname == "google.com"
    assert res2.scheme == "http"


def test_invalid_and_disallowed_schemes():
    v = URLValidator()

    # Disallowed javascript scheme
    res1 = v.validate_and_normalize("javascript:alert(1)")
    assert res1.is_valid is False
    assert "Disallowed protocol" in (res1.error_message or "")

    # Disallowed file scheme
    res2 = v.validate_and_normalize("file:///etc/passwd")
    assert res2.is_valid is False

    # Disallowed ftp scheme
    res3 = v.validate_and_normalize("ftp://ftp.is.co.za/rfc/rfc1808.txt")
    assert res3.is_valid is False


def test_malformed_urls():
    v = URLValidator()

    res1 = v.validate_and_normalize("")
    assert res1.is_valid is False

    res2 = v.validate_and_normalize("https://")
    assert res2.is_valid is False

    res3 = v.validate_and_normalize("http://-invalid-host-.com")
    assert res3.is_valid is False


def test_private_ip_and_ssrf_blocking():
    v = URLValidator()

    # Loopback IP
    res1 = v.validate_and_normalize("http://127.0.0.1:8080/admin")
    assert res1.is_valid is False
    assert res1.is_private_ip is True
    assert "SSRF blocked" in (res1.error_message or "")

    # Cloud metadata IP (AWS/GCP metadata service)
    res2 = v.validate_and_normalize("http://169.254.169.254/latest/meta-data/")
    assert res2.is_valid is False
    assert res2.is_private_ip is True

    # Private RFC1918 10.0.0.0/8
    res3 = v.validate_and_normalize("http://10.200.1.5/dashboard")
    assert res3.is_valid is False
    assert res3.is_private_ip is True


def test_url_normalization():
    v = URLValidator()

    # Normalizes default port and removes dot segments
    res = v.validate_and_normalize("HTTP://EXAMPLE.COM:80/a/b/../c/")
    assert res.is_valid is True
    assert res.normalized_url == "http://example.com/a/c/"

