import pytest
from unittest.mock import patch
from app.analyzers.redirect_analyzer import RedirectAnalyzer


@pytest.mark.asyncio
async def test_ssrf_blocked_on_private_ip():
    analyzer = RedirectAnalyzer()

    # Mock IP resolution to return private address 127.0.0.1
    with patch.object(analyzer, "_resolve_ip", return_value="127.0.0.1"):
        res = await analyzer.analyze("http://internal-service.local/admin")
        assert res.status == "BLOCKED_SSRF"
        indicators = [f["indicator"] for f in res.findings]
        assert "SSRF_PRIVATE_IP_BLOCKED" in indicators


@pytest.mark.asyncio
async def test_ssrf_blocked_on_cloud_metadata():
    analyzer = RedirectAnalyzer()

    # Mock IP resolution to return AWS metadata service IP 169.254.169.254
    with patch.object(analyzer, "_resolve_ip", return_value="169.254.169.254"):
        res = await analyzer.analyze("http://metadata.attacker.com/latest/meta-data/")
        assert res.status == "BLOCKED_SSRF"
        severities = [f["severity"] for f in res.findings]
        assert "CRITICAL" in severities

