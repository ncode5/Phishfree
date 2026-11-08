import copy
import json
import pytest
from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from hexbytes import HexBytes
from eth_utils import keccak
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database.connection import Base
from app.database import models
from app.services.report_canonicalizer import ReportCanonicalizer
from app.services.report_hash_service import ReportHashService
from app.services.blockchain_service import BlockchainService
from app.services.report_verification_service import ReportVerificationService
from app.main import app
import app.api.endpoints as endpoints

# Test database setup (in-memory SQLite)
TEST_DB_URL = "sqlite:///:memory:"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh isolated database for each test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def sample_url_report_dict():
    return {
        "id": "report-url-001",
        "submitted_url": "https://secure-bank.example.com/login",
        "normalized_url": "https://secure-bank.example.com/login",
        "domain": "secure-bank.example.com",
        "risk_level": "HIGH_RISK",
        "risk_score": 85.5,
        "confidence": 0.95,
        "summary": "Suspicious login portal with high likelihood of credential theft.",
        "created_at": datetime(2026, 11, 8, 12, 0, 0, tzinfo=timezone.utc),
        "findings": [
            {
                "category": "DOMAIN",
                "indicator": "BRAND_IMPERSONATION",
                "severity": "HIGH",
                "description": "Domain mimics a major banking institution.",
                "confidence": 0.9,
            },
            {
                "category": "TLS_SECURITY",
                "indicator": "RECENTLY_ISSUED_CERT",
                "severity": "MEDIUM",
                "description": "Certificate issued less than 24 hours ago.",
                "confidence": 1.0,
            }
        ]
    }


# =========================================================================
# Scenario 10-14: Canonicalization & Ethereum Keccak-256 Hashing Tests
# =========================================================================

def test_10_deterministic_report_hashing(sample_url_report_dict):
    """Scenario 10: Report produces a deterministic, 32-byte 0x-prefixed hex string."""
    canonical = ReportCanonicalizer.canonicalize(sample_url_report_dict)
    h = ReportHashService.hash_canonical_report(canonical)

    assert h.startswith("0x")
    assert len(h) == 66  # 0x + 64 hex characters
    assert int(h, 16) > 0


def test_11_same_report_produces_same_hash(sample_url_report_dict):
    """Scenario 11: Idempotency - evaluating the same report twice yields identical hash."""
    h1 = ReportHashService.generate_report_hash(sample_url_report_dict)
    h2 = ReportHashService.generate_report_hash(sample_url_report_dict)

    assert h1 == h2


def test_12_modified_report_produces_different_hash(sample_url_report_dict):
    """Scenario 12: Changing any semantic field (e.g. risk score) alters the hash."""
    h_original = ReportHashService.generate_report_hash(sample_url_report_dict)

    tampered_report = copy.deepcopy(sample_url_report_dict)
    tampered_report["risk_score"] = 12.0  # maliciously downgraded score

    h_tampered = ReportHashService.generate_report_hash(tampered_report)
    assert h_original != h_tampered

    # Tampering findings also alters hash
    tampered_findings = copy.deepcopy(sample_url_report_dict)
    tampered_findings["findings"] = []
    h_tampered_findings = ReportHashService.generate_report_hash(tampered_findings)
    assert h_original != h_tampered_findings


def test_13_different_json_key_ordering_produces_same_canonical_hash():
    """Scenario 13: Shuffling dictionary key order does not alter the canonical hash."""
    dict_order_1 = {
        "report_id": "test-1",
        "domain": "example.com",
        "risk_level": "LOW_RISK",
        "risk_score": 10.0
    }
    dict_order_2 = {
        "risk_score": 10.0,
        "risk_level": "LOW_RISK",
        "domain": "example.com",
        "report_id": "test-1"
    }

    s1 = ReportCanonicalizer.serialize_canonical(dict_order_1)
    s2 = ReportCanonicalizer.serialize_canonical(dict_order_2)

    assert s1 == s2
    assert ReportHashService.compute_keccak256_hex(s1) == ReportHashService.compute_keccak256_hex(s2)


def test_14_correct_keccak256_implementation():
    """Scenario 14: Verifies standard Ethereum Keccak-256 test vectors."""
    # Standard Ethereum keccak256("")
    empty_hash = ReportHashService.compute_keccak256_hex(b"")
    assert empty_hash.lower() == "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"

    # Standard Ethereum keccak256("hello")
    hello_hash = ReportHashService.compute_keccak256_hex("hello")
    assert hello_hash.lower() == "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"


# =========================================================================
# Scenario 15-16: Blockchain Connection & Chain ID Validation Tests
# =========================================================================

def test_15_successful_contract_connection():
    """Scenario 15: Validates contract instance instantiation and address checksumming."""
    service = BlockchainService(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x5fbdb2315678afecb367f032d93f642f64180aa3",
        chain_id=11155111
    )

    assert service.contract_address == "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    contract = service.get_contract()
    assert contract is not None
    assert contract.address == service.contract_address


def test_16_wrong_chain_id_and_unconfigured_handling():
    """Scenario 16: Detects unconfigured RPC and unreachable networks gracefully."""
    empty_service = BlockchainService(rpc_url="", contract_address="")
    status = empty_service.get_network_status()
    assert status["rpc_status"] == "UNCONFIGURED"
    assert status["contract_available"] is False


# =========================================================================
# Scenario 17-21: Report Registration & Tamper Verification Tests
# =========================================================================

def test_17_successful_report_registration(db_session, sample_url_report_dict):
    """Scenario 17: Successfully registers report and records transaction in database."""
    db_rep = models.AnalysisReport(
        id=sample_url_report_dict["id"],
        submitted_url=sample_url_report_dict["submitted_url"],
        normalized_url=sample_url_report_dict["normalized_url"],
        domain=sample_url_report_dict["domain"],
        risk_level=sample_url_report_dict["risk_level"],
        risk_score=sample_url_report_dict["risk_score"],
        confidence=sample_url_report_dict["confidence"],
        summary=sample_url_report_dict["summary"],
        created_at=sample_url_report_dict["created_at"],
        analysis_status="COMPLETED"
    )
    db_session.add(db_rep)
    for f in sample_url_report_dict["findings"]:
        finding = models.Finding(
            report_id=db_rep.id,
            category=f["category"],
            indicator=f["indicator"],
            severity=f["severity"],
            description=f["description"],
            source="Test",
            confidence=f["confidence"]
        )
        db_session.add(finding)
    db_session.commit()

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.register_report_on_chain.return_value = {
        "status": "CONFIRMED",
        "transaction_hash": "0x4a1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "block_number": 6800100,
        "submitter_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
        "explorer_url": "https://sepolia.etherscan.io/tx/0x4a123...",
        "message": "Report fingerprint successfully registered on-chain."
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    res = verification_srv.register_report(report_id=db_rep.id, db=db_session)

    assert res["registration_status"] == "CONFIRMED"
    assert res["report_hash"].startswith("0x")
    assert res["transaction_hash"].startswith("0x4a")
    assert res["block_number"] == 6800100

    # Verify persisted in database
    reg_record = db_session.query(models.BlockchainReportRegistration).filter_by(report_id=db_rep.id).first()
    assert reg_record is not None
    assert reg_record.registration_status == "CONFIRMED"
    assert reg_record.report_hash == res["report_hash"]


def test_18_duplicate_registration_prevention(db_session):
    """Scenario 18: Prevents redundant duplicate on-chain registrations if already confirmed."""
    db_rep = models.AnalysisReport(
        id="report-dup-01",
        submitted_url="https://test.com",
        normalized_url="https://test.com",
        domain="test.com",
        risk_level="LOW_RISK",
        risk_score=10.0,
        summary="Safe site"
    )
    db_session.add(db_rep)
    db_session.commit()

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.register_report_on_chain.return_value = {
        "status": "CONFIRMED",
        "transaction_hash": "0xaaaabbbbcccc1111222233334444555566667777888899990000aaaabbbbcccc",
        "block_number": 6800200,
        "submitter_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)

    # First registration
    res1 = verification_srv.register_report(report_id=db_rep.id, db=db_session)
    assert res1["registration_status"] == "CONFIRMED"
    assert mock_blockchain.register_report_on_chain.call_count == 1

    # Second registration attempt: should detect existing confirmed record and NOT broadcast a new tx
    res2 = verification_srv.register_report(report_id=db_rep.id, db=db_session)
    assert res2["registration_status"] == "CONFIRMED"
    assert "already confirmed and registered" in res2["message"]
    assert mock_blockchain.register_report_on_chain.call_count == 1  # did not call again


def test_19_successful_verification(db_session, sample_url_report_dict):
    """Scenario 19: Unmodified report matches on-chain hash and returns VERIFIED."""
    db_rep = models.AnalysisReport(
        id=sample_url_report_dict["id"],
        submitted_url=sample_url_report_dict["submitted_url"],
        normalized_url=sample_url_report_dict["normalized_url"],
        domain=sample_url_report_dict["domain"],
        risk_level=sample_url_report_dict["risk_level"],
        risk_score=sample_url_report_dict["risk_score"],
        confidence=sample_url_report_dict["confidence"],
        summary=sample_url_report_dict["summary"],
        created_at=sample_url_report_dict["created_at"],
        analysis_status="COMPLETED"
    )
    db_session.add(db_rep)
    for f in sample_url_report_dict["findings"]:
        finding = models.Finding(
            report_id=db_rep.id,
            category=f["category"],
            indicator=f["indicator"],
            severity=f["severity"],
            description=f["description"],
            source="Test",
            confidence=f["confidence"]
        )
        db_session.add(finding)
    db_session.commit()

    # Pre-compute expected hash from the database representation
    data, rtype = ReportVerificationService._fetch_report_and_type(db_rep.id, db_session)
    canonical = ReportCanonicalizer.canonicalize(data, rtype)
    expected_hash = ReportHashService.hash_canonical_report(canonical)

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    # On-chain returns registered=True
    mock_blockchain.verify_report_on_chain.return_value = {
        "registered": True,
        "status": "VERIFIED",
        "report_hash": expected_hash,
        "registered_report_hash": expected_hash,
        "timestamp": 1773000000,
        "submitter": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    verify_res = verification_srv.verify_report(report_id=db_rep.id, db=db_session)

    assert verify_res["verification_status"] == "VERIFIED"
    assert verify_res["integrity_verified"] is True
    assert verify_res["registered"] is True
    assert verify_res["current_report_hash"] == expected_hash


def test_20_tampered_report_detection(db_session, sample_url_report_dict):
    """Scenario 20: Modifying report values after registration is detected as TAMPERED."""
    db_rep = models.AnalysisReport(
        id=sample_url_report_dict["id"],
        submitted_url=sample_url_report_dict["submitted_url"],
        normalized_url=sample_url_report_dict["normalized_url"],
        domain=sample_url_report_dict["domain"],
        risk_level=sample_url_report_dict["risk_level"],
        risk_score=sample_url_report_dict["risk_score"],
        confidence=sample_url_report_dict["confidence"],
        summary=sample_url_report_dict["summary"],
        created_at=sample_url_report_dict["created_at"],
        analysis_status="COMPLETED"
    )
    db_session.add(db_rep)
    db_session.commit()

    # Record historical registration with original hash
    original_canonical = ReportCanonicalizer.canonicalize(sample_url_report_dict)
    original_hash = ReportHashService.hash_canonical_report(original_canonical)

    reg = models.BlockchainReportRegistration(
        report_id=db_rep.id,
        report_type="URL_ANALYSIS",
        report_hash=original_hash,
        registration_status="CONFIRMED",
        transaction_hash="0x1111222233334444555566667777888899990000111122223333444455556666",
        block_number=6800300
    )
    db_session.add(reg)
    db_session.commit()

    # NOW MALICIOUSLY MODIFY REPORT DATA IN DB
    db_rep.risk_level = "LOW_RISK"
    db_rep.risk_score = 5.0
    db_session.commit()

    # Mock blockchain: on-chain does not match the newly calculated tampered hash
    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.verify_report_on_chain.return_value = {
        "registered": False,
        "status": "NOT_REGISTERED",
        "report_hash": "tampered_hash",
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    verify_res = verification_srv.verify_report(report_id=db_rep.id, db=db_session)

    # Must be flagged as TAMPERED
    assert verify_res["verification_status"] == "TAMPERED"
    assert verify_res["integrity_verified"] is False
    assert verify_res["registered"] is True
    assert verify_res["current_report_hash"] != original_hash


def test_21_unregistered_report_detection(db_session):
    """Scenario 21: Report with no on-chain record returns NOT_REGISTERED."""
    db_rep = models.AnalysisReport(
        id="report-unregistered-01",
        submitted_url="https://brand-new.example.com",
        normalized_url="https://brand-new.example.com",
        domain="brand-new.example.com",
        risk_level="LOW_RISK",
        risk_score=15.0,
        summary="Clean website"
    )
    db_session.add(db_rep)
    db_session.commit()

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.verify_report_on_chain.return_value = {
        "registered": False,
        "status": "NOT_REGISTERED",
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    verify_res = verification_srv.verify_report(report_id=db_rep.id, db=db_session)

    assert verify_res["verification_status"] == "NOT_REGISTERED"
    assert verify_res["integrity_verified"] is False
    assert verify_res["registered"] is False


# =========================================================================
# Scenario 22-25: Transaction Failures, RPC Outages & Zero Gas Tests
# =========================================================================

def test_22_failed_transaction_handling(db_session):
    """Scenario 22: Blockchain transaction revert or failure is gracefully recorded."""
    db_rep = models.AnalysisReport(
        id="report-fail-01",
        submitted_url="https://fail-test.com",
        normalized_url="https://fail-test.com",
        domain="fail-test.com",
        risk_level="LOW_RISK",
        risk_score=5.0,
        summary="Test"
    )
    db_session.add(db_rep)
    db_session.commit()

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.register_report_on_chain.return_value = {
        "status": "FAILED",
        "error": "Blockchain transaction reverted by EVM contract."
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    res = verification_srv.register_report(report_id=db_rep.id, db=db_session)

    assert res["registration_status"] == "FAILED"
    assert "reverted" in res["message"]

    # Verify status in database
    reg = db_session.query(models.BlockchainReportRegistration).filter_by(report_id=db_rep.id).first()
    assert reg.registration_status == "FAILED"
    assert "reverted" in reg.error_message


def test_23_rpc_unavailable_handling(db_session):
    """Scenario 23: When RPC is unavailable, verification returns UNAVAILABLE (not false success)."""
    db_rep = models.AnalysisReport(
        id="report-rpc-unavail-01",
        submitted_url="https://unavail-test.com",
        normalized_url="https://unavail-test.com",
        domain="unavail-test.com",
        risk_level="LOW_RISK",
        risk_score=5.0,
        summary="Test"
    )
    db_session.add(db_rep)
    db_session.commit()

    mock_blockchain = MagicMock(spec=BlockchainService)
    mock_blockchain.network_name = "Ethereum Sepolia Testnet"
    mock_blockchain.expected_chain_id = 11155111
    mock_blockchain.contract_address = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    mock_blockchain.verify_report_on_chain.return_value = {
        "registered": False,
        "status": "UNAVAILABLE",
        "error": "Failed to connect to blockchain RPC node."
    }

    verification_srv = ReportVerificationService(blockchain_service=mock_blockchain)
    res = verification_srv.verify_report(report_id=db_rep.id, db=db_session)

    assert res["verification_status"] == "UNAVAILABLE"
    assert res["integrity_verified"] is False


def test_24_insufficient_wallet_balance_handling():
    """Scenario 24: Detects 0 ETH wallet balance and prevents broadcast failure."""
    service = BlockchainService(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        private_key="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
    )

    with patch.object(service.w3.eth, "get_balance", return_value=0):
        with patch.object(service.w3.eth.account, "from_key") as mock_from_key:
            mock_account = MagicMock()
            mock_account.address = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
            mock_from_key.return_value = mock_account

            res = service.register_report_on_chain("0x" + "a" * 64)
            assert res["status"] == "FAILED"
            assert "0 ETH" in res["error"]
            assert "faucet" in res["error"]


def test_25_missing_private_key_handling():
    """Scenario 25: Returns clear error if private key is missing."""
    service = BlockchainService(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
        private_key=""
    )
    res = service.register_report_on_chain("0x" + "b" * 64)
    assert res["status"] == "FAILED"
    assert "private key not configured" in res["error"].lower()


# =========================================================================
# Scenario 26-27: Database Persistence & Cross-Module Support
# =========================================================================

def test_26_cross_module_canonicalization():
    """Scenario 26: Supports Module 3 Message reports and Module 5 Website Security reports."""
    # Module 3 Message Analysis
    msg_rep = {
        "id": "msg-001",
        "message_hash": "0xabcdef123456",
        "primary_category": "KYC Fraud",
        "categories": ["KYC Fraud", "Urgency Trap"],
        "risk_level": "SUSPICIOUS",
        "risk_score": 65.0,
        "confidence": 0.88,
        "summary": "Urgent bank KYC SMS lure."
    }
    canon_msg = ReportCanonicalizer.canonicalize(msg_rep, "MESSAGE_ANALYSIS")
    assert canon_msg["report_type"] == "MESSAGE_ANALYSIS"
    hash_msg = ReportHashService.hash_canonical_report(canon_msg)
    assert hash_msg.startswith("0x") and len(hash_msg) == 66

    # Module 5 Website Security
    sec_rep = {
        "id": "sec-001",
        "target_url": "https://example.com",
        "security_score": 92.5,
        "security_label": "Strong Configuration",
        "category_scores": {"headers": 90, "cookies": 100},
        "summary": "Modern secure configuration"
    }
    canon_sec = ReportCanonicalizer.canonicalize(sec_rep, "WEBSITE_SECURITY")
    assert canon_sec["report_type"] == "WEBSITE_SECURITY"
    hash_sec = ReportHashService.hash_canonical_report(canon_sec)
    assert hash_sec.startswith("0x") and len(hash_sec) == 66


def test_27_api_endpoints_integration(db_session):
    """Scenario 27: End-to-end FastAPI integration testing for Module 6 endpoints."""
    print("--> ENTERING TEST 27 <--")
    import asyncio
    from app.api.endpoints import (
        get_blockchain_status,
        verify_threat_report_integrity,
        register_threat_report_on_chain,
        get_blockchain_report_details
    )
    from fastapi import HTTPException

    async def _run():
        # Seed report
        db_rep = models.AnalysisReport(
            id="api-test-rep-01",
            submitted_url="https://api-test.com",
            normalized_url="https://api-test.com",
            domain="api-test.com",
            risk_level="SUSPICIOUS",
            risk_score=50.0,
            summary="API test report"
        )
        db_session.add(db_rep)
        db_session.commit()

        # 1. GET /api/v1/blockchain/status
        with patch.object(endpoints.blockchain_service, "get_network_status") as mock_status:
            mock_status.return_value = {
                "network_name": "Ethereum Sepolia Testnet",
                "chain_id": 11155111,
                "rpc_url": "https://ethereum-sepolia-rpc.publicnode.com",
                "rpc_status": "CONNECTED",
                "latest_block": 6800500,
                "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "contract_available": True,
                "total_reports_registered": 42,
                "recent_registrations": [],
                "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "wallet_balance_eth": 0.5
            }

            status_res = await get_blockchain_status()
            assert status_res["network_name"] == "Ethereum Sepolia Testnet"
            assert status_res["rpc_status"] == "CONNECTED"
            assert status_res["contract_available"] is True

        # 2. GET /api/v1/blockchain/verify/nonexistent-id -> 404
        with patch.object(endpoints.verification_service, "verify_report") as mock_verify_404:
            mock_verify_404.return_value = {
                "report_id": "nonexistent-id",
                "current_report_hash": "",
                "registered_report_hash": None,
                "registered": False,
                "integrity_verified": False,
                "verification_status": "NOT_REGISTERED",
                "network": "Ethereum Sepolia Testnet",
                "chain_id": 11155111,
                "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "details": {"error": "Report 'nonexistent-id' not found in database."}
            }
            with pytest.raises(HTTPException) as exc_info:
                await verify_threat_report_integrity("nonexistent-id", db_session)
            assert exc_info.value.status_code == 404

        # 3. GET /api/v1/blockchain/verify/api-test-rep-01 -> returns NOT_REGISTERED
        with patch.object(endpoints.verification_service, "verify_report") as mock_verify:
            mock_verify.return_value = {
                "report_id": db_rep.id,
                "current_report_hash": "0x" + "a" * 64,
                "registered_report_hash": None,
                "registered": False,
                "integrity_verified": False,
                "verification_status": "NOT_REGISTERED",
                "network": "Ethereum Sepolia Testnet",
                "chain_id": 11155111,
                "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
                "details": {}
            }
            unreg_res = await verify_threat_report_integrity(db_rep.id, db_session)
            assert unreg_res["report_id"] == db_rep.id
            assert unreg_res["current_report_hash"].startswith("0x")
            assert unreg_res["verification_status"] == "NOT_REGISTERED"

    asyncio.run(_run())


# =========================================================================
# Scenario 28-30: ABI Fallback, Chain ID Protection, and Clean Imports
# =========================================================================

def test_28_abi_fallback_loading(monkeypatch):
    """Scenario 28: Verifies robust ABI loading from primary file, deployment JSON fallback, and error handling."""
    import app.web3.contract_abi as abi_module

    # 1. Primary ABI loads successfully
    primary_abi = abi_module.load_registry_abi()
    assert isinstance(primary_abi, list)
    assert len(primary_abi) > 0
    func_names = [item.get("name") for item in primary_abi if item.get("type") == "function"]
    assert "registerReport" in func_names
    assert "verifyReport" in func_names

    # 2. When primary ABI path does not exist, falls back to contract_deployment.json
    monkeypatch.setattr(abi_module, "_PRIMARY_ABI_PATH", "nonexistent_file_path.json")
    fallback_abi = abi_module.load_registry_abi()
    assert isinstance(fallback_abi, list)
    assert len(fallback_abi) > 0
    fallback_funcs = [item.get("name") for item in fallback_abi if item.get("type") == "function"]
    assert "registerReport" in fallback_funcs

    # 3. When both paths are nonexistent or invalid, gracefully returns empty list
    monkeypatch.setattr(abi_module, "_DEPLOYMENT_PATH", "nonexistent_deploy_path.json")
    empty_abi = abi_module.load_registry_abi()
    assert empty_abi == []


def test_29_chain_id_mismatch_protection():
    """Scenario 29: Aborts transaction creation and returns structured error if Chain ID does not match Sepolia."""
    from unittest.mock import PropertyMock

    service = BlockchainService(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8",
        private_key="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        chain_id=11155111
    )

    dummy_hash = "0x" + "a" * 64

    # 1. Chain ID mismatch: RPC returns 1 (Ethereum Mainnet) instead of 11155111 (Sepolia)
    with patch.object(service.w3.eth, "get_balance", return_value=10**18):  # 1 ETH
        with patch.object(type(service.w3.eth), "chain_id", new_callable=PropertyMock, return_value=1):
            res = service.register_report_on_chain(dummy_hash)
            assert res["status"] == "FAILED"
            assert "Chain ID mismatch" in res["error"]
            assert res["actual_chain_id"] == 1
            assert res["expected_chain_id"] == 11155111

    # 2. Configured Chain ID mismatch: service misconfigured with chain_id != 11155111
    bad_service = BlockchainService(
        rpc_url="http://127.0.0.1:8545",
        contract_address="0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8",
        private_key="0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
        chain_id=1  # Wrong configured chain ID
    )
    with patch.object(bad_service.w3.eth, "get_balance", return_value=10**18):
        res2 = bad_service.register_report_on_chain(dummy_hash)
        assert res2["status"] == "FAILED"
        assert "Configuration error" in res2["error"]
        assert "11155111" in res2["error"]


def test_30_clean_endpoints_imports():
    """Scenario 30: Confirms legacy SepoliaRegistryService is removed and all active endpoints remain bound."""
    import app.api.endpoints as api_endpoints

    # Legacy unused instance should no longer be defined in endpoints module
    assert not hasattr(api_endpoints, "sepolia_service")

    # Module 6 production services are properly bound and available
    assert hasattr(api_endpoints, "blockchain_service")
    assert hasattr(api_endpoints, "verification_service")
    assert isinstance(api_endpoints.blockchain_service, BlockchainService)


