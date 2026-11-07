import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.connection import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AnalysisReport(Base):
    """Stores full analysis sessions for submitted URLs."""
    __tablename__ = "analysis_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    submitted_url = Column(Text, nullable=False)
    normalized_url = Column(Text, nullable=False)
    domain = Column(String(255), nullable=False, index=True)
    risk_level = Column(String(50), nullable=False, index=True)  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    risk_score = Column(Float, nullable=False, default=0.0)      # 0 to 100
    confidence = Column(Float, nullable=False, default=0.0)      # 0.0 to 1.0
    summary = Column(Text, nullable=False)
    analysis_status = Column(String(50), nullable=False, default="COMPLETED")  # COMPLETED, PARTIAL, FAILED
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    # Rich metadata for telemetry (DNS records, redirect chain, domain breakdown, AI explanation, etc.)
    details = Column(JSON, nullable=True)

    # Relationships
    findings = relationship("Finding", back_populates="report", cascade="all, delete-orphan", order_by="Finding.severity.desc()")


class Finding(Base):
    """Stores granular, explainable evidence findings tied to an analysis report."""
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), ForeignKey("analysis_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # DOMAIN, URL_STRUCTURE, NETWORK_REDIRECT, DNS, THREAT_INTEL, SSRF
    indicator = Column(String(100), nullable=False)  # e.g., BRAND_IMPERSONATION, EXCESSIVE_SUBDOMAINS, PRIVATE_IP_REDIRECT
    severity = Column(String(20), nullable=False)    # INFO, LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    source = Column(String(100), nullable=False)     # e.g. DomainAnalyzer, RedirectAnalyzer, VirusTotal
    confidence = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0
    evidence = Column(JSON, nullable=True)           # Technical key-value facts
    observed_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    report = relationship("AnalysisReport", back_populates="findings")


class ThreatIndicator(Base):
    """Known threat indicators repository for local correlation and reputation tracking."""
    __tablename__ = "threat_indicators"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    indicator_type = Column(String(50), nullable=False, index=True)  # DOMAIN, IP, URL_HASH, URL
    indicator_value = Column(Text, nullable=False, index=True)
    threat_category = Column(String(100), nullable=False)            # PHISHING, MALWARE, C2, FRAUD, BRAND_IMPERSONATION
    source = Column(String(100), nullable=False)                     # VIRUSTOTAL, LOCAL_HEURISTICS, CORRELATION
    first_seen = Column(DateTime(timezone=True), default=utc_now)
    last_seen = Column(DateTime(timezone=True), default=utc_now)

