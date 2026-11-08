from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import models
from app.services.report_canonicalizer import ReportCanonicalizer
from app.services.report_hash_service import ReportHashService
from app.services.blockchain_service import BlockchainService


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReportVerificationService:
    """
    High-level orchestrator for report canonicalization, Keccak-256 fingerprinting,
    blockchain registration, and independent tamper verification.
    """

    def __init__(self, blockchain_service: Optional[BlockchainService] = None):
        self.blockchain_service = blockchain_service or BlockchainService()

    @staticmethod
    def _fetch_report_and_type(report_id: str, db: Session, preferred_type: Optional[str] = None):
        """Locates the report in PostgreSQL across URL, Message, and Website Security tables."""
        # 1. URL Analysis Report
        if not preferred_type or preferred_type == "URL_ANALYSIS":
            rep = db.query(models.AnalysisReport).filter(models.AnalysisReport.id == report_id).first()
            if rep:
                findings_data = []
                for f in rep.findings:
                    findings_data.append({
                        "category": f.category,
                        "indicator": f.indicator,
                        "severity": f.severity,
                        "description": f.description,
                        "confidence": f.confidence,
                        "evidence": f.evidence,
                    })
                data = {
                    "id": rep.id,
                    "submitted_url": rep.submitted_url,
                    "normalized_url": rep.normalized_url,
                    "domain": rep.domain,
                    "risk_level": rep.risk_level,
                    "risk_score": rep.risk_score,
                    "confidence": rep.confidence,
                    "summary": rep.summary,
                    "created_at": rep.created_at,
                    "findings": findings_data,
                    "details": rep.details,
                }
                return data, "URL_ANALYSIS"

        # 2. Message Analysis Report
        if not preferred_type or preferred_type == "MESSAGE_ANALYSIS":
            msg_rep = db.query(models.MessageAnalysisReport).filter(models.MessageAnalysisReport.id == report_id).first()
            if msg_rep:
                data = {
                    "id": msg_rep.id,
                    "message_preview": msg_rep.message_preview,
                    "message_hash": msg_rep.message_hash,
                    "risk_level": msg_rep.risk_level,
                    "risk_score": msg_rep.risk_score,
                    "confidence": msg_rep.confidence,
                    "primary_category": msg_rep.primary_category,
                    "categories": msg_rep.categories,
                    "summary": msg_rep.summary,
                    "created_at": msg_rep.created_at,
                    "details": msg_rep.details,
                }
                return data, "MESSAGE_ANALYSIS"

        # 3. Website Security Assessment
        if not preferred_type or preferred_type == "WEBSITE_SECURITY":
            sec_rep = db.query(models.WebsiteSecurityAssessment).filter(
                (models.WebsiteSecurityAssessment.id == report_id) |
                (models.WebsiteSecurityAssessment.report_id == report_id)
            ).first()
            if sec_rep:
                data = {
                    "id": sec_rep.id,
                    "report_id": sec_rep.report_id,
                    "target_url": sec_rep.target_url,
                    "security_score": sec_rep.security_score,
                    "security_label": sec_rep.security_label,
                    "category_scores": sec_rep.category_scores,
                    "summary": sec_rep.summary,
                    "created_at": sec_rep.created_at,
                }
                return data, "WEBSITE_SECURITY"

        # Fallback check
        if preferred_type:
            return ReportVerificationService._fetch_report_and_type(report_id, db, preferred_type=None)

        return None, None

    def register_report(
        self,
        report_id: str,
        db: Session,
        report_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates the canonical Keccak-256 fingerprint of a report and registers it on-chain.
        """
        report_data, detected_type = self._fetch_report_and_type(report_id, db, report_type)
        if not report_data:
            return {
                "report_id": report_id,
                "report_type": report_type or "UNKNOWN",
                "report_hash": "",
                "registration_status": "FAILED",
                "message": f"Report with ID '{report_id}' not found in database."
            }

        # 1. Canonicalize report data
        canonical = ReportCanonicalizer.canonicalize(report_data, detected_type)

        # 2. Compute Ethereum Keccak-256 digest
        report_hash = ReportHashService.hash_canonical_report(canonical)

        # 3. Check for existing database registration record
        existing_reg = db.query(models.BlockchainReportRegistration).filter(
            models.BlockchainReportRegistration.report_id == report_id
        ).first()

        if existing_reg and existing_reg.registration_status == "CONFIRMED":
            # If already confirmed on-chain with the same hash
            if existing_reg.report_hash.lower() == report_hash.lower():
                return {
                    "report_id": report_id,
                    "report_type": detected_type,
                    "report_hash": report_hash,
                    "network": existing_reg.network,
                    "chain_id": existing_reg.chain_id,
                    "contract_address": existing_reg.contract_address,
                    "transaction_hash": existing_reg.transaction_hash,
                    "block_number": existing_reg.block_number,
                    "registration_status": "CONFIRMED",
                    "explorer_url": f"https://sepolia.etherscan.io/tx/{existing_reg.transaction_hash}" if existing_reg.transaction_hash else None,
                    "message": "Report is already confirmed and registered on the blockchain.",
                    "registered_at": existing_reg.registered_at,
                }

        # 4. Attempt on-chain registration via smart contract
        tx_result = self.blockchain_service.register_report_on_chain(report_hash)

        # 5. Persist record in PostgreSQL / SQLite
        now = utc_now()
        if not existing_reg:
            existing_reg = models.BlockchainReportRegistration(
                report_id=report_id,
                report_type=detected_type,
                report_hash=report_hash,
                canonical_payload=canonical,
                network=self.blockchain_service.network_name,
                chain_id=self.blockchain_service.expected_chain_id,
                contract_address=self.blockchain_service.contract_address,
                registration_status=tx_result.get("status", "FAILED"),
                verification_status="VERIFIED" if tx_result.get("status") == "CONFIRMED" else "NOT_REGISTERED",
                transaction_hash=tx_result.get("transaction_hash"),
                block_number=tx_result.get("block_number"),
                submitter_address=tx_result.get("submitter_address"),
                registered_at=now if tx_result.get("status") == "CONFIRMED" else None,
                error_message=tx_result.get("error"),
                created_at=now,
            )
            db.add(existing_reg)
        else:
            existing_reg.report_hash = report_hash
            existing_reg.canonical_payload = canonical
            existing_reg.registration_status = tx_result.get("status", "FAILED")
            existing_reg.contract_address = self.blockchain_service.contract_address
            if tx_result.get("status") == "CONFIRMED":
                existing_reg.verification_status = "VERIFIED"
                existing_reg.transaction_hash = tx_result.get("transaction_hash")
                existing_reg.block_number = tx_result.get("block_number")
                existing_reg.submitter_address = tx_result.get("submitter_address")
                existing_reg.registered_at = now
                existing_reg.error_message = None
            else:
                existing_reg.error_message = tx_result.get("error")

        db.commit()
        db.refresh(existing_reg)

        return {
            "report_id": report_id,
            "report_type": detected_type,
            "report_hash": report_hash,
            "network": existing_reg.network,
            "chain_id": existing_reg.chain_id,
            "contract_address": existing_reg.contract_address,
            "transaction_hash": existing_reg.transaction_hash,
            "block_number": existing_reg.block_number,
            "registration_status": existing_reg.registration_status,
            "explorer_url": tx_result.get("explorer_url"),
            "message": tx_result.get("message") or tx_result.get("error") or "Registration processed.",
            "registered_at": existing_reg.registered_at,
        }

    def verify_report(self, report_id: str, db: Session) -> Dict[str, Any]:
        """
        Independently verifies whether a stored report matches its registered on-chain fingerprint.
        Detects tampering, unregistered status, or confirmation validity.
        """
        report_data, detected_type = self._fetch_report_and_type(report_id, db)
        if not report_data:
            return {
                "report_id": report_id,
                "current_report_hash": "",
                "registered_report_hash": None,
                "registered": False,
                "integrity_verified": False,
                "verification_status": "NOT_REGISTERED",
                "network": self.blockchain_service.network_name,
                "chain_id": self.blockchain_service.expected_chain_id,
                "contract_address": self.blockchain_service.contract_address,
                "details": {"error": f"Report '{report_id}' not found in database."}
            }

        # 1. Re-compute current canonical representation and current Keccak-256 hash
        current_canonical = ReportCanonicalizer.canonicalize(report_data, detected_type)
        current_hash = ReportHashService.hash_canonical_report(current_canonical)

        # 2. Look up historical registration record in database
        db_reg = db.query(models.BlockchainReportRegistration).filter(
            models.BlockchainReportRegistration.report_id == report_id
        ).first()

        registered_db_hash = db_reg.report_hash if db_reg else None

        # 3. Query the blockchain smart contract
        onchain_result = self.blockchain_service.verify_report_on_chain(current_hash)

        onchain_exists = onchain_result.get("registered", False)
        onchain_status = onchain_result.get("status")

        # 4. Determine verification outcome
        verification_status = "NOT_REGISTERED"
        integrity_verified = False

        if onchain_status == "UNAVAILABLE":
            # If blockchain is unreachable, we report UNAVAILABLE rather than false PASS or FAIL
            verification_status = "UNAVAILABLE"
            integrity_verified = False
        elif onchain_exists:
            # Current hash is registered on-chain!
            verification_status = "VERIFIED"
            integrity_verified = True
        elif db_reg and db_reg.registration_status == "CONFIRMED":
            # The report was registered previously, but the recalculated hash does NOT match the on-chain hash!
            # This indicates the report data was modified (tampered) after blockchain registration.
            verification_status = "TAMPERED"
            integrity_verified = False
        else:
            verification_status = "NOT_REGISTERED"
            integrity_verified = False

        # Update last verification telemetry in database if record exists
        if db_reg:
            db_reg.last_verified_at = utc_now()
            db_reg.verification_status = verification_status
            db.commit()

        return {
            "report_id": report_id,
            "current_report_hash": current_hash,
            "registered_report_hash": registered_db_hash or onchain_result.get("registered_report_hash"),
            "registered": bool(onchain_exists or (db_reg and db_reg.registration_status == "CONFIRMED")),
            "integrity_verified": integrity_verified,
            "verification_status": verification_status,
            "network": self.blockchain_service.network_name,
            "chain_id": self.blockchain_service.expected_chain_id,
            "contract_address": self.blockchain_service.contract_address,
            "transaction_hash": db_reg.transaction_hash if db_reg else None,
            "block_number": db_reg.block_number if db_reg else None,
            "timestamp": onchain_result.get("timestamp"),
            "submitter": onchain_result.get("submitter") or (db_reg.submitter_address if db_reg else None),
            "details": {
                "onchain_query_status": onchain_status,
                "db_registration_status": db_reg.registration_status if db_reg else "NONE",
                "hash_matches_historical": bool(registered_db_hash and registered_db_hash.lower() == current_hash.lower())
            }
        }

