import pytest
from app.analyzers.domain_analyzer import DomainAnalyzer


def test_standard_domain_extraction():
    analyzer = DomainAnalyzer()
    res = analyzer.analyze("docs.github.com")

    assert res.subdomain == "docs"
    assert res.domain == "github"
    assert res.suffix == "com"
    assert res.registered_domain == "github.com"
    assert res.is_brand_impersonation is False


def test_excessive_subdomains():
    analyzer = DomainAnalyzer()
    res = analyzer.analyze("login.secure.verify.account.phishingsite.com")

    assert res.subdomain_count >= 4
    indicators = [f["indicator"] for f in res.findings]
    assert "EXCESSIVE_SUBDOMAINS" in indicators


def test_brand_impersonation_keyword():
    analyzer = DomainAnalyzer()
    # Brand embedded in domain but not official paypal.com
    res = analyzer.analyze("paypal-security-update.com")

    assert res.is_brand_impersonation is True
    assert res.target_brand == "paypal"
    indicators = [f["indicator"] for f in res.findings]
    assert "BRAND_IMPERSONATION_KEYWORD" in indicators


def test_legitimate_brand_not_flagged():
    analyzer = DomainAnalyzer()
    # Legitimate official domain should NOT be flagged as brand impersonation
    res = analyzer.analyze("paypal.com")
    assert res.is_brand_impersonation is False


def test_typosquatting_lookalike():
    analyzer = DomainAnalyzer()
    # Typosquatting lookalike (paypa1 instead of paypal)
    res = analyzer.analyze("paypa1.com")

    assert res.is_brand_impersonation is True
    assert res.target_brand == "paypal"
    indicators = [f["indicator"] for f in res.findings]
    assert "TYPOSQUATTING_SUSPECTED" in indicators


def test_punycode_detection():
    analyzer = DomainAnalyzer()
    # xn-- prefix
    res = analyzer.analyze("xn--pple-43d.com")

    assert res.is_punycode is True
    indicators = [f["indicator"] for f in res.findings]
    assert "PUNYCODE_DETECTED" in indicators

