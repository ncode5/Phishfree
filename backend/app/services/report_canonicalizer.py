import json
from typing import Dict, Any, List, Optional
from datetime import datetime


class ReportCanonicalizer:
    """
    Produces deterministic, canonical JSON representations of forensic threat reports.
    
    Guarantees:
    1. Consistent key ordering at all nesting levels.
    2. Data type normalization (floats rounded to 2 decimal places, trimmed strings).
    3. Normalization of ISO 8601 UTC timestamps (Z suffix, millisecond normalization).
    4. Deterministic sorting of list elements where list order is not semantically significant (e.g. findings).
    5. Exclusion of transient UI state, client-side metadata, and blockchain transaction receipts.
    """

    EXCLUDED_TOP_LEVEL_FIELDS = {
        "is_loading",
        "temporary_id",
        "client_timestamp",
        "blockchain_record",
        "blockchain_status",
        "transaction_hash",
        "block_number",
        "registration_status",
        "verification_status",
        "registered_at",
        "last_verified_at",
        "contract_address",
        "explorer_url",
    }

    @staticmethod
    def _normalize_value(val: Any) -> Any:
        """Recursively normalizes Python objects into deterministic JSON-serializable primitives."""
        if val is None:
            return None
        elif isinstance(val, (int, bool)):
            return val
        elif isinstance(val, float):
            # Round floats to 2 decimal places to avoid IEEE 754 precision divergence
            return round(val, 2)
        elif isinstance(val, str):
            return val.strip()
        elif isinstance(val, datetime):
            # Format in canonical UTC ISO 8601 representation: YYYY-MM-DDTHH:MM:SSZ
            if val.tzinfo is not None:
                # Convert to UTC
                utc_val = val.astimezone()
                return utc_val.strftime("%Y-%m-%dT%H:%M:%SZ")
            return val.strftime("%Y-%m-%dT%H:%M:%SZ")
        elif isinstance(val, dict):
            # Sort keys and recursively normalize values, skipping excluded keys
            normalized = {}
            for k in sorted(val.keys()):
                if k in ReportCanonicalizer.EXCLUDED_TOP_LEVEL_FIELDS:
                    continue
                normalized[str(k).strip()] = ReportCanonicalizer._normalize_value(val[k])
            return normalized
        elif isinstance(val, (list, tuple, set)):
            # Normalize list elements
            normalized_list = [ReportCanonicalizer._normalize_value(item) for item in val]
            return normalized_list
        return str(val).strip()

    @classmethod
    def canonicalize_url_report(cls, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and canonicalizes semantic fields from an AnalysisReport (Module 1 & 2).
        """
        raw_findings = report.get("findings") or []
        normalized_findings = []
        for f in raw_findings:
            if isinstance(f, dict):
                norm_f = {
                    "category": str(f.get("category", "")).strip().upper(),
                    "indicator": str(f.get("indicator", "")).strip().upper(),
                    "severity": str(f.get("severity", "")).strip().upper(),
                    "description": str(f.get("description", "")).strip(),
                    "confidence": round(float(f.get("confidence", 1.0)), 2),
                }
                normalized_findings.append(norm_f)

        # Sort findings deterministically by (category, indicator, severity)
        normalized_findings.sort(key=lambda x: (x["category"], x["indicator"], x["severity"]))

        # Build canonical dictionary
        canonical = {
            "report_id": str(report.get("id") or report.get("report_id", "")).strip(),
            "report_type": "URL_ANALYSIS",
            "submitted_url": str(report.get("submitted_url", "")).strip(),
            "normalized_url": str(report.get("normalized_url", "")).strip(),
            "domain": str(report.get("domain", "")).strip().lower(),
            "risk_level": str(report.get("risk_level", "")).strip().upper(),
            "risk_score": round(float(report.get("risk_score", 0.0)), 2),
            "confidence": round(float(report.get("confidence", 0.0)), 2),
            "findings": normalized_findings,
            "created_at": cls._normalize_value(report.get("created_at")),
        }

        # Include summary if present
        if report.get("summary"):
            canonical["summary"] = str(report.get("summary")).strip()

        return cls._normalize_value(canonical)

    @classmethod
    def canonicalize_message_report(cls, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and canonicalizes semantic fields from a MessageAnalysisReport (Module 3).
        """
        categories = [str(c).strip() for c in (report.get("categories") or [])]
        categories.sort()

        canonical = {
            "report_id": str(report.get("id") or report.get("report_id", "")).strip(),
            "report_type": "MESSAGE_ANALYSIS",
            "message_hash": str(report.get("message_hash", "")).strip(),
            "primary_category": str(report.get("primary_category", "")).strip(),
            "categories": categories,
            "risk_level": str(report.get("risk_level", "")).strip().upper(),
            "risk_score": round(float(report.get("risk_score", 0.0)), 2),
            "confidence": round(float(report.get("confidence", 0.0)), 2),
            "created_at": cls._normalize_value(report.get("created_at")),
        }

        if report.get("summary"):
            canonical["summary"] = str(report.get("summary")).strip()

        return cls._normalize_value(canonical)

    @classmethod
    def canonicalize_security_assessment(cls, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and canonicalizes semantic fields from a WebsiteSecurityAssessment (Module 5).
        """
        canonical = {
            "report_id": str(report.get("id") or report.get("report_id", "")).strip(),
            "report_type": "WEBSITE_SECURITY",
            "target_url": str(report.get("target_url", "")).strip(),
            "security_score": round(float(report.get("security_score", 0.0)), 2),
            "security_label": str(report.get("security_label", "")).strip(),
            "category_scores": cls._normalize_value(report.get("category_scores") or {}),
            "created_at": cls._normalize_value(report.get("created_at")),
        }

        if report.get("summary"):
            canonical["summary"] = str(report.get("summary")).strip()

        return cls._normalize_value(canonical)

    @classmethod
    def canonicalize(cls, report_data: Dict[str, Any], report_type: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches to the appropriate canonicalizer based on report shape or explicit report_type.
        """
        # Auto-detect report type if not provided
        if not report_type:
            if "message_hash" in report_data or "message_preview" in report_data:
                report_type = "MESSAGE_ANALYSIS"
            elif "security_score" in report_data or "category_scores" in report_data:
                report_type = "WEBSITE_SECURITY"
            else:
                report_type = "URL_ANALYSIS"

        if report_type == "MESSAGE_ANALYSIS":
            return cls.canonicalize_message_report(report_data)
        elif report_type == "WEBSITE_SECURITY":
            return cls.canonicalize_security_assessment(report_data)
        else:
            return cls.canonicalize_url_report(report_data)

    @classmethod
    def serialize_canonical(cls, canonical_dict: Dict[str, Any]) -> bytes:
        """
        Serializes a canonical dictionary into compact, sorted-key UTF-8 bytes for hashing.
        """
        # separators=(',', ':') removes whitespace around colons and commas for consistency
        return json.dumps(canonical_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")

