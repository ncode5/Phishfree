import pytest
from unittest.mock import patch, MagicMock
import dns.resolver
from app.analyzers.dns_analyzer import DNSAnalyzer


def test_dns_records_resolved():
    analyzer = DNSAnalyzer()

    # Mock resolver query answers
    def mock_query(domain, rdtype):
        if rdtype == "A":
            return ["93.184.216.34"]
        elif rdtype == "MX":
            return ["10 mail.example.com."]
        elif rdtype == "NS":
            return ["a.iana-servers.net."]
        return []

    with patch.object(analyzer, "_query_record", side_effect=mock_query):
        res = analyzer.analyze_sync("example.com")
        assert res.status == "RESOLVED"
        assert "93.184.216.34" in res.a_records
        assert len(res.ns_records) == 1


def test_dns_nxdomain_handling():
    analyzer = DNSAnalyzer()

    with patch.object(analyzer, "_query_record", side_effect=dns.resolver.NXDOMAIN()):
        res = analyzer.analyze_sync("this-domain-definitely-does-not-exist-12345.com")
        assert res.status == "NXDOMAIN"
        # Findings should be INFO, not CRITICAL malicious!
        for f in res.findings:
            assert f["severity"] == "INFO"


def test_dns_failure_represented_as_unavailable_not_malicious():
    analyzer = DNSAnalyzer()

    with patch.object(analyzer, "_query_record", side_effect=dns.resolver.Timeout()):
        res = analyzer.analyze_sync("unresponsive-dns-server.test")
        assert res.status in ("TIMEOUT", "UNAVAILABLE")
        # Ensure DNS failure is not treated as proof of maliciousness
        for f in res.findings:
            assert f["severity"] == "INFO"

