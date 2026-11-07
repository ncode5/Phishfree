from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict


class URLAnalyzeRequest(BaseModel):
    """URL submission payload."""
    url: str = Field(..., description="The URL or domain to analyze", min_length=3, max_length=2048)
    include_tls: bool = Field(True, description="Whether to include Module 2 TLS certificate analysis")


class TLSAnalyzeRequest(BaseModel):
    """TLS analysis standalone request."""
    target: str = Field(..., description="Domain or URL to inspect for TLS/HTTPS certificate", min_length=3, max_length=2048)


class TLSFindingSchema(BaseModel):
    """Individual TLS certificate security finding."""
    finding_id: str
    category: str  # certificate_expiration, hostname_validation, chain_validation, cryptographic_strength, certificate_transparency
    title: str
    description: str
    severity: str  # Informational, Low, Medium, High, Critical
    evidence: Optional[Dict[str, Any]] = None
    recommendation: Optional[str] = None
    confidence: float = 1.0


class CertificateInfoSchema(BaseModel):
    """Parsed X.509 Certificate Metadata."""
    subject: Dict[str, str] = {}
    issuer: Dict[str, str] = {}
    serial_number: str = ""
    valid_from: Optional[datetime] = None
    valid_to: Optional[datetime] = None
    days_remaining: Optional[int] = None
    san: List[str] = []
    public_key_algorithm: str = "Unknown"
    public_key_size: Optional[int] = None
    signature_algorithm: str = "Unknown"
    curve: Optional[str] = None


class CertificateTransparencySchema(BaseModel):
    """Certificate Transparency log summary from crt.sh."""
    status: str = "COMPLETED"  # COMPLETED, UNAVAILABLE, RATE_LIMITED, ERROR
    total_records: int = 0
    distinct_issuers: List[str] = []
    recent_certificates_count: int = 0
    sample_records: List[Dict[str, Any]] = []
    error_message: Optional[str] = None


class TLSAnalysisResponse(BaseModel):
    """Module 2: Complete TLS Certificate & Digital Trust Analysis."""
    target: str
    hostname: str
    port: int = 443
    https_available: bool = False
    tls_version: Optional[str] = None
    cipher_suite: Optional[str] = None
    certificate_status: str = "UNABLE_TO_DETERMINE"  # VALID, EXPIRED, EXPIRING_SOON, NOT_YET_VALID, UNTRUSTED, UNABLE_TO_DETERMINE
    hostname_match: bool = False
    chain_status: str = "UNABLE_TO_VERIFY"  # TRUSTED, UNTRUSTED, SELF_SIGNED, INCOMPLETE, UNABLE_TO_VERIFY
    certificate_info: Optional[CertificateInfoSchema] = None
    cryptographic_strength: str = "ACCEPTABLE"  # STRONG, ACCEPTABLE, WEAK, INSECURE
    certificate_transparency: Optional[CertificateTransparencySchema] = None
    findings: List[TLSFindingSchema] = []
    recommendations: List[str] = []
    error_message: Optional[str] = None


class FindingSchema(BaseModel):
    """Structured security finding."""
    id: Optional[str] = None
    category: str
    indicator: str
    severity: str  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    description: str
    source: str
    confidence: float = 1.0
    evidence: Optional[Dict[str, Any]] = None
    observed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DNSRecordsSchema(BaseModel):
    """DNS records breakdown."""
    a_records: List[str] = []
    aaaa_records: List[str] = []
    mx_records: List[str] = []
    ns_records: List[str] = []
    txt_records: List[str] = []
    status: str = "RESOLVED"  # RESOLVED, NXDOMAIN, UNAVAILABLE, TIMEOUT
    error_message: Optional[str] = None


class RedirectHopSchema(BaseModel):
    """Single redirect step."""
    hop_number: int
    url: str
    status_code: Optional[int] = None
    domain: str
    ip: Optional[str] = None
    is_cross_domain: bool = False


class RedirectAnalysisSchema(BaseModel):
    """Redirect chain analysis result."""
    original_url: str
    final_url: str
    hops: List[RedirectHopSchema] = []
    redirect_count: int = 0
    cross_domain_redirects: bool = False
    status: str = "COMPLETED"  # COMPLETED, BLOCKED_SSRF, TIMEOUT, ERROR
    error_message: Optional[str] = None


class DomainAnalysisSchema(BaseModel):
    """Domain structural metrics and typosquatting analysis."""
    subdomain: str = ""
    registered_domain: str = ""
    tld: str = ""
    full_domain: str = ""
    is_punycode: bool = False
    unicode_domain: Optional[str] = None
    domain_length: int = 0
    subdomain_count: int = 0
    has_hyphens: bool = False
    hyphen_count: int = 0
    is_brand_impersonation: bool = False
    target_brand: Optional[str] = None
    similarity_score: float = 0.0
    suspicious_patterns: List[str] = []


class ThreatIntelSchema(BaseModel):
    """External threat intelligence result."""
    provider: str = "VirusTotal"
    status: str = "COMPLETED"  # COMPLETED, NOT_FOUND, UNAVAILABLE, ERROR
    is_malicious: bool = False
    malicious_count: int = 0
    suspicious_count: int = 0
    harmless_count: int = 0
    total_engines: int = 0
    scan_date: Optional[str] = None
    permalink: Optional[str] = None
    message: Optional[str] = None


class AIExplanationSchema(BaseModel):
    """Grounded AI explanation."""
    summary: str
    risk_level: str
    explanation: List[str] = []
    recommendations: List[str] = []
    is_deterministic_fallback: bool = True


class AnalysisReportResponse(BaseModel):
    """Complete analysis report."""
    id: str
    submitted_url: str
    normalized_url: str
    domain: str
    risk_level: str  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    risk_score: float
    confidence: float
    summary: str
    analysis_status: str
    created_at: datetime
    findings: List[FindingSchema] = []
    dns: Optional[DNSRecordsSchema] = None
    redirects: Optional[RedirectAnalysisSchema] = None
    domain_analysis: Optional[DomainAnalysisSchema] = None
    threat_intel: Optional[ThreatIntelSchema] = None
    ai_explanation: Optional[AIExplanationSchema] = None
    tls_analysis: Optional[TLSAnalysisResponse] = None
    unavailable_checks: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class AnalysisReportListItem(BaseModel):
    """Compact analysis report for tables and history."""
    id: str
    submitted_url: str
    domain: str
    risk_level: str
    risk_score: float
    confidence: float
    summary: str
    created_at: datetime
    findings_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class DashboardStatsResponse(BaseModel):
    """Dashboard aggregate statistics."""
    total_analyzed: int
    low_risk_count: int
    suspicious_count: int
    high_risk_count: int
    confirmed_malicious_count: int
    inconclusive_count: int
    recent_reports: List[AnalysisReportListItem]
    risk_distribution: List[Dict[str, Any]]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    database: str
    timestamp: datetime
    version: str = "1.0.0"
    active_module: str = "Module 1 - Intelligent URL and Website Analysis"
