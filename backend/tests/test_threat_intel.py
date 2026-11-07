import asyncio
import pytest
from unittest.mock import patch, AsyncMock
from app.intelligence.virustotal import VirusTotalProvider


def test_threat_intel_missing_key_fallback():
    provider = VirusTotalProvider(api_key="")
    res = asyncio.run(provider.analyze_url("https://example.com"))

    assert res["status"] == "UNAVAILABLE"
    assert "Threat intelligence lookup unavailable." in res["message"]
    assert res["is_malicious"] is False


def test_threat_intel_confirmed_malicious():
    provider = VirusTotalProvider(api_key="dummy_test_key")

    mock_vt_response = {
        "data": {
            "attributes": {
                "last_analysis_stats": {
                    "malicious": 14,
                    "suspicious": 2,
                    "harmless": 20,
                    "undetected": 35
                },
                "last_analysis_date": 1698765432
            }
        }
    }

    mock_resp = AsyncMock()
    mock_resp.status_code = 200
    mock_resp.json = lambda: mock_vt_response

    async def run_test():
        with patch("httpx.AsyncClient.get", return_value=mock_resp):
            return await provider.analyze_url("http://phishing-site.example.com")

    res = asyncio.run(run_test())
    assert res["status"] == "COMPLETED"
    assert res["is_malicious"] is True
    assert res["malicious_count"] == 14
    indicators = [f["indicator"] for f in res["findings"]]
    assert "CONFIRMED_THREAT_INTEL_MATCH" in indicators
