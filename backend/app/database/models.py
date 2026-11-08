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
    indicator_type = Column(String(50), nullable=False, index=True)  # DOMAIN, IP, URL_HASH, URL, EMAIL, PHONE, CERT_FINGERPRINT, CERT_ISSUER
    indicator_value = Column(Text, nullable=False, index=True)
    threat_category = Column(String(100), nullable=False, default="SUSPICIOUS")  # PHISHING, MALWARE, C2, FRAUD, BRAND_IMPERSONATION
    source = Column(String(100), nullable=False, default="CORRELATION")          # VIRUSTOTAL, LOCAL_HEURISTICS, CORRELATION
    normalized_value = Column(Text, nullable=True, index=True)
    raw_value = Column(Text, nullable=True)
    occurrence_count = Column(Integer, nullable=False, default=1)
    risk_score = Column(Float, nullable=False, default=0.0)
    details = Column(JSON, nullable=True)
    first_seen = Column(DateTime(timezone=True), default=utc_now)
    last_seen = Column(DateTime(timezone=True), default=utc_now)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    def __init__(self, **kwargs):
        # Ensure backward and forward compatibility between indicator_value and normalized_value
        if "indicator_value" in kwargs and "normalized_value" not in kwargs:
            kwargs["normalized_value"] = kwargs["indicator_value"]
        elif "normalized_value" in kwargs and "indicator_value" not in kwargs:
            kwargs["indicator_value"] = kwargs["normalized_value"]
        super().__init__(**kwargs)


class ThreatRelationship(Base):
    """Links between indicators in the threat correlation graph."""
    __tablename__ = "threat_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    source_indicator_id = Column(String(36), ForeignKey("threat_indicators.id", ondelete="CASCADE"), nullable=False, index=True)
    target_indicator_id = Column(String(36), ForeignKey("threat_indicators.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=False, index=True)  # HOSTED_ON_IP, HAS_CERTIFICATE, ISSUED_BY_CA, EXTRACTED_FROM_MESSAGE, REDIRECTS_TO, RESOLVES_TO_DOMAIN, SHARED_HOSTING
    evidence_source = Column(String(100), nullable=False, default="CORRELATION_ENGINE")
    confidence = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    source_indicator = relationship("ThreatIndicator", foreign_keys=[source_indicator_id], backref="outgoing_relationships")
    target_indicator = relationship("ThreatIndicator", foreign_keys=[target_indicator_id], backref="incoming_relationships")


class ThreatCorrelation(Base):
    """Stores detected threat patterns and rules matched across reports and indicators."""
    __tablename__ = "threat_correlations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), nullable=False, index=True)  # ID of AnalysisReport or MessageAnalysisReport
    pattern_name = Column(String(150), nullable=False, index=True)
    description = Column(Text, nullable=False)
    severity = Column(String(20), nullable=False)  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, nullable=False, default=1.0)
    supporting_evidence = Column(JSON, nullable=True)
    related_reports = Column(JSON, nullable=True)  # List of related report IDs
    created_at = Column(DateTime(timezone=True), default=utc_now)


class CorrelationReport(Base):
    """Stores the combined correlation synthesis for a submitted URL or Message report."""
    __tablename__ = "correlation_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), nullable=False, index=True, unique=True)
    report_type = Column(String(20), nullable=False, default="URL")  # URL or MESSAGE
    correlation_score = Column(Float, nullable=False, default=0.0)
    risk_level = Column(String(50), nullable=False, default="LOW_RISK")
    confidence = Column(Float, nullable=False, default=1.0)
    summary = Column(Text, nullable=False)
    graph_data = Column(JSON, nullable=True)
    patterns = Column(JSON, nullable=True)
    explanation = Column(JSON, nullable=True)
    evidence_breakdown = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class MessageAnalysisReport(Base):
    """Stores evidence-based analysis reports for submitted messages, SMS, and emails."""
    __tablename__ = "message_analysis_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    message_preview = Column(String(255), nullable=False)  # Redacted & truncated preview for privacy preservation
    message_hash = Column(String(64), nullable=False, index=True)  # SHA-256 digest
    message_length = Column(Integer, nullable=False, default=0)
    risk_level = Column(String(50), nullable=False, index=True)  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    risk_score = Column(Float, nullable=False, default=0.0)      # 0 to 100
    confidence = Column(Float, nullable=False, default=0.0)      # 0.0 to 1.0
    primary_category = Column(String(100), nullable=False)       # Phishing, KYC Fraud, Financial Scam, etc.
    categories = Column(JSON, nullable=False)                    # List of identified categories
    summary = Column(Text, nullable=False)
    analysis_status = Column(String(50), nullable=False, default="COMPLETED")
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    # Detailed structured metadata (entities, linguistic patterns, URL reports, AI explanation, etc.)
    details = Column(JSON, nullable=True)


class WebsiteSecurityAssessment(Base):
    """Stores passive website security configuration assessments (headers, cookies, mixed content, transport, public files)."""
    __tablename__ = "website_security_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), nullable=True, index=True)  # Optional reference to an AnalysisReport or standalone
    target_url = Column(Text, nullable=False)
    security_score = Column(Float, nullable=False, default=0.0)  # 0 to 100
    security_label = Column(String(50), nullable=False, default="Needs Improvement")  # Strong Configuration, Good Configuration, etc.
    coverage = Column(JSON, nullable=False, default=dict)  # {"completed": int, "total": int}
    category_scores = Column(JSON, nullable=False, default=dict)  # {"https_transport": 25, "headers": 20, ...}
    summary = Column(Text, nullable=False)
    recommendations = Column(JSON, nullable=True)
    assessment_status = Column(String(50), nullable=False, default="COMPLETED")  # COMPLETED, PARTIAL, FAILED
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    # Relationships
    findings = relationship("WebsiteSecurityFinding", back_populates="assessment", cascade="all, delete-orphan", order_by="WebsiteSecurityFinding.created_at.desc()")


class WebsiteSecurityFinding(Base):
    """Granular observable security configuration finding or recommendation."""
    __tablename__ = "website_security_findings"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    assessment_id = Column(String(36), ForeignKey("website_security_assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)  # HTTPS_TRANSPORT, SECURITY_HEADERS, COOKIE_SECURITY, MIXED_CONTENT, INFORMATION_EXPOSURE, SECURITY_CONFIG
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(JSON, nullable=True)
    severity = Column(String(20), nullable=False, index=True)  # Informational, Low, Medium, High, Critical
    confidence = Column(Float, nullable=False, default=1.0)  # 0.0 to 1.0
    recommendation = Column(Text, nullable=True)
    source = Column(String(100), nullable=False, default="SECURITY_ASSESSMENT_ENGINE")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    assessment = relationship("WebsiteSecurityAssessment", back_populates="findings")


class BlockchainReportRegistration(Base):
    """
    Stores on-chain registration references, Keccak-256 fingerprints,
    and verification history for PhishFree threat reports.
    """
    __tablename__ = "blockchain_report_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    report_id = Column(String(36), nullable=False, index=True)
    report_type = Column(String(50), nullable=False, default="URL_ANALYSIS")
    report_hash = Column(String(66), nullable=False, index=True)  # 0x + 64 hex characters (Keccak-256)
    canonical_payload = Column(JSON, nullable=True)
    network = Column(String(50), nullable=False, default="sepolia")
    chain_id = Column(Integer, nullable=False, default=11155111)
    contract_address = Column(String(42), nullable=True, index=True)
    transaction_hash = Column(String(66), nullable=True, index=True)
    block_number = Column(Integer, nullable=True)
    submitter_address = Column(String(42), nullable=True)
    registration_status = Column(String(50), nullable=False, default="NOT_REGISTERED")  # NOT_REGISTERED, PENDING, CONFIRMED, FAILED
    verification_status = Column(String(50), nullable=False, default="NOT_REGISTERED")  # VERIFIED, TAMPERED, NOT_REGISTERED, PENDING, UNAVAILABLE
    registered_at = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)



