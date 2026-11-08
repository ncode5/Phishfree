import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_error_invalid_url_submission():
    """Returns structured 400 Bad Request for disallowed schemes."""
    resp = client.post("/api/v1/analyze/url", json={"url": "ftp://example.com/exploit"})
    assert resp.status_code == 400
    data = resp.json()
    assert "detail" in data
    assert "disallowed" in data["detail"].lower() or "invalid" in data["detail"].lower()


def test_error_invalid_message_input():
    """Returns structured 400 Bad Request for whitespace or empty message payload."""
    resp = client.post("/api/v1/analyze/message", json={"message": "    ", "analyze_urls": True})
    assert resp.status_code == 400
    data = resp.json()
    assert "detail" in data
    assert "empty" in data["detail"].lower()


def test_error_unknown_report_id():
    """Returns structured 404 Not Found for non-existent report identifier."""
    resp = client.get("/api/v1/reports/non-existent-report-uuid-999")
    assert resp.status_code == 404
    data = resp.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_error_unknown_blockchain_report_verification():
    """Returns 404 for unknown report verification query."""
    resp = client.get("/api/v1/blockchain/verify/unknown-blockchain-id-000")
    assert resp.status_code == 404
    data = resp.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_error_unknown_blockchain_report_details():
    """Returns 404 when querying DB registration details for unanchored report."""
    resp = client.get("/api/v1/blockchain/report/non-existent-id-777")
    assert resp.status_code == 404
    data = resp.json()
    assert "found" in data["detail"].lower()


def test_error_rpc_unavailable_graceful_handling():
    """Verifies that an RPC network failure does not crash the verification pipeline."""
    from app.services.blockchain_service import BlockchainService
    
    with patch("web3.Web3.is_connected", return_value=False):
        service = BlockchainService(rpc_url="http://nonexistent-rpc.invalid")
        status_res = service.get_network_status()
        assert status_res["rpc_status"] == "DISCONNECTED"
        assert status_res["contract_available"] is False
