import pytest
from app.analyzers.url_pattern_analyzer import URLPatternAnalyzer


def test_ip_address_host():
    findings = URLPatternAnalyzer.analyze("http://198.51.100.4/login", is_ip_host=True)
    indicators = [f["indicator"] for f in findings]
    assert "IP_ADDRESS_AS_HOSTNAME" in indicators


def test_embedded_at_symbol():
    findings = URLPatternAnalyzer.analyze("http://trusted.com@evil.com/path", raw_input="http://trusted.com@evil.com/path")
    indicators = [f["indicator"] for f in findings]
    assert "EMBEDDED_AT_SYMBOL" in indicators


def test_credential_targeting_keywords():
    findings = URLPatternAnalyzer.analyze("https://secure-gate.org/verify/restore-wallet?token=123")
    indicators = [f["indicator"] for f in findings]
    assert "CREDENTIAL_TARGETING_KEYWORDS" in indicators


def test_dangerous_extension():
    findings = URLPatternAnalyzer.analyze("https://fileshare-cloud.info/invoices/payment-details.exe")
    indicators = [f["indicator"] for f in findings]
    assert "POTENTIALLY_DANGEROUS_FILE_EXTENSION" in indicators


def test_obfuscated_encoding():
    findings = URLPatternAnalyzer.analyze("https://example.com/%252e%252e/admin")
    indicators = [f["indicator"] for f in findings]
    assert "DOUBLE_ENCODING_OR_NULL_BYTE" in indicators

