from typing import Dict, Any, Union
from eth_utils import keccak
from app.services.report_canonicalizer import ReportCanonicalizer


class ReportHashService:
    """
    Ethereum Keccak-256 cryptographic hashing service for canonical forensic threat reports.
    
    IMPORTANT:
    Uses standard Ethereum Keccak-256 (compatible with Solidity keccak256() / bytes32),
    which differs from the NIST SHA3-256 padding standard.
    """

    @staticmethod
    def compute_keccak256_bytes(data: Union[bytes, str]) -> bytes:
        """Computes raw 32-byte Ethereum Keccak-256 digest."""
        if isinstance(data, str):
            data = data.encode("utf-8")
        return keccak(data)

    @staticmethod
    def compute_keccak256_hex(data: Union[bytes, str]) -> str:
        """Computes 0x-prefixed 64-character hex string of Ethereum Keccak-256."""
        raw = ReportHashService.compute_keccak256_bytes(data)
        return "0x" + raw.hex()

    @classmethod
    def hash_canonical_report(cls, canonical_dict: Dict[str, Any]) -> str:
        """
        Takes a canonical dictionary, serializes it deterministically,
        and computes its 0x-prefixed 32-byte Keccak-256 hash.
        """
        serialized = ReportCanonicalizer.serialize_canonical(canonical_dict)
        return cls.compute_keccak256_hex(serialized)

    @classmethod
    def generate_report_hash(cls, report_data: Dict[str, Any], report_type: str = "URL_ANALYSIS") -> str:
        """
        Convenience end-to-end method: canonicalizes raw report data and hashes it.
        """
        canonical = ReportCanonicalizer.canonicalize(report_data, report_type)
        return cls.hash_canonical_report(canonical)

    @classmethod
    def verify_hash(cls, canonical_dict: Dict[str, Any], expected_hash: str) -> bool:
        """
        Verifies whether the canonical dictionary hashes to the expected 0x-prefixed hash.
        """
        if not expected_hash:
            return False
        expected_norm = expected_hash.strip().lower()
        if not expected_norm.startswith("0x"):
            expected_norm = "0x" + expected_norm
        actual = cls.hash_canonical_report(canonical_dict).lower()
        return actual == expected_norm

