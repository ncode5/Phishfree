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


# ==========================================
# MODULE 3: Scam & Message Analysis Schemas
# ==========================================

class MessageAnalyzeRequest(BaseModel):
    """Submission payload for scam and message analysis."""
    message: str = Field(..., description="Raw text of the suspicious message, email, or communication", min_length=1, max_length=15000)
    analyze_urls: bool = Field(True, description="Whether to automatically run Module 1 & 2 analysis on extracted URLs")


class ExtractedEntitiesSchema(BaseModel):
    """Entities extracted from analyzed message."""
    urls: List[str] = []
    domains: List[str] = []
    emails: List[str] = []
    phone_numbers: List[str] = []
    crypto_addresses: List[Dict[str, str]] = []
    payment_handles: List[str] = []


class SuspiciousIndicatorSchema(BaseModel):
    """Specific suspicious pattern detected in message."""
    category: str  # urgency, financial, credential_theft, impersonation, suspicious_offer, prompt_injection
    title: str
    description: str
    severity: str  # Informational, Low, Medium, High, Critical
    matched_phrases: List[str] = []
    evidence: Optional[Dict[str, Any]] = None


class ExtractedURLAnalysisSchema(BaseModel):
    """Result of Module 1 & 2 analysis on an extracted URL."""
    url: str
    domain: str
    risk_level: str
    risk_score: float
    is_malicious: bool
    report_id: Optional[str] = None
    summary: str
    tls_status: Optional[str] = None
    error: Optional[str] = None


class MessageExplanationSchema(BaseModel):
    """Grounded AI explanation for message analysis."""
    summary: str
    risk_level: str
    likely_scam_category: str
    suspicious_phrases: List[str] = []
    explanation_points: List[str] = []
    manipulation_techniques: List[str] = []
    recommendations: List[str] = []
    limitations: str = ""
    is_deterministic_fallback: bool = True


class MessageAnalysisResponse(BaseModel):
    """Module 3: Complete AI-Powered Scam and Message Analysis Report."""
    id: str
    message_preview: str
    message_length: int
    risk_level: str  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    risk_score: float
    confidence: float
    primary_category: str
    categories: List[str] = []
    summary: str
    indicators: List[SuspiciousIndicatorSchema] = []
    entities: ExtractedEntitiesSchema
    extracted_url_analyses: List[ExtractedURLAnalysisSchema] = []
    ai_explanation: MessageExplanationSchema
    recommendations: List[str] = []
    analysis_status: str = "COMPLETED"
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)






class MessageAnalysisListItem(BaseModel):
    """Compact message report for listings and history."""
    id: str
    message_preview: str
    risk_level: str
    risk_score: float
    confidence: float
    primary_category: str
    created_at: datetime
    urls_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# ====================================================
# MODULE 4: Intelligent Threat Correlation Schemas
# ====================================================

class CorrelateRequest(BaseModel):
    """Submission payload to trigger or retrieve threat correlation."""
    report_id: str = Field(..., description="UUID of URL AnalysisReport or MessageAnalysisReport", min_length=1)
    report_type: Optional[str] = Field("AUTO", description="URL, MESSAGE, or AUTO")


class ThreatIndicatorSchema(BaseModel):
    """Normalized threat indicator entity."""
    id: str
    indicator_type: str  # URL, DOMAIN, IP, EMAIL, PHONE, CERT_FINGERPRINT, CERT_ISSUER
    indicator_value: str
    normalized_value: Optional[str] = None
    raw_value: Optional[str] = None
    threat_category: str
    source: str
    occurrence_count: int = 1
    risk_score: float = 0.0
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ThreatRelationshipSchema(BaseModel):
    """Directed connection between two indicators."""
    id: str
    source_indicator_id: str
    target_indicator_id: str
    relationship_type: str  # HOSTED_ON_IP, HAS_CERTIFICATE, ISSUED_BY_CA, EXTRACTED_FROM_MESSAGE, REDIRECTS_TO, RESOLVES_TO_DOMAIN, SHARED_HOSTING
    evidence_source: str
    confidence: float = 1.0
    details: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ThreatGraphNodeSchema(BaseModel):
    """Visual node for interactive graph representation."""
    id: str
    label: str
    indicator_type: str  # URL, DOMAIN, IP, CERTIFICATE, ISSUER, MESSAGE, THREAT_INTEL, EMAIL, PHONE
    normalized_value: str
    risk_level: str  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INFO
    risk_score: float = 0.0
    occurrence_count: int = 1
    source_report: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class ThreatGraphEdgeSchema(BaseModel):
    """Visual edge connecting nodes in interactive graph."""
    id: str
    source: str
    target: str
    relationship_type: str
    label: str
    evidence_source: str = "CORRELATION_ENGINE"
    confidence: float = 1.0


class ThreatGraphResponse(BaseModel):
    """Complete graph network topology."""
    nodes: List[ThreatGraphNodeSchema] = []
    edges: List[ThreatGraphEdgeSchema] = []


class ThreatPatternSchema(BaseModel):
    """Specific cross-module or historical pattern detected."""
    id: Optional[str] = None
    pattern_name: str
    description: str
    severity: str  # INFO, LOW, MEDIUM, HIGH, CRITICAL
    confidence: float = 1.0
    supporting_evidence: List[Dict[str, Any]] = []
    related_reports: List[str] = []
    reason: Optional[str] = None


class CorrelationExplanationSchema(BaseModel):
    """Human-readable, evidence-grounded AI narrative."""
    summary: str
    risk_level: str
    reasoning: List[str] = []
    corroborating_factors: List[str] = []
    mitigating_factors: List[str] = []
    recommendations: List[str] = []
    is_deterministic_fallback: bool = True


class EvidenceTransparencySchema(BaseModel):
    """Transparent evidence demarcation preventing false certainties."""
    verified_external_evidence: List[Dict[str, Any]] = []
    technical_observations: List[Dict[str, Any]] = []
    rule_based_correlations: List[Dict[str, Any]] = []
    ai_generated_insights: List[str] = []


class CorrelationReportResponse(BaseModel):
    """Module 4: Complete Cross-Module Intelligent Threat Correlation Report."""
    id: str
    report_id: str
    report_type: str  # URL or MESSAGE
    correlation_score: float
    risk_level: str  # LOW_RISK, SUSPICIOUS, HIGH_RISK, CONFIRMED_MALICIOUS, INCONCLUSIVE
    confidence: float
    summary: str
    graph: ThreatGraphResponse
    patterns: List[ThreatPatternSchema] = []
    explanation: CorrelationExplanationSchema
    evidence_transparency: EvidenceTransparencySchema
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RelatedThreatsResponse(BaseModel):
    """Neighborhood query for a specific indicator."""
    root_indicator: ThreatIndicatorSchema
    direct_connections: List[ThreatRelationshipSchema] = []
    connected_indicators: List[ThreatIndicatorSchema] = []
    graph: ThreatGraphResponse


class ThreatIntelOverviewResponse(BaseModel):
    """System-wide threat intelligence metrics and recent correlations."""
    total_indicators: int
    unique_domains: int
    unique_ips: int
    unique_certificates: int
    suspicious_relationships: int
    detected_threat_patterns: int
    total_correlations: int
    recent_correlations: List[Dict[str, Any]] = []
    top_patterns: List[Dict[str, Any]] = []


# ====================================================
# MODULE 5: Website Security Assessment Schemas
# ====================================================

class SecurityAssessRequest(BaseModel):
    """Submission payload for website security configuration assessment."""
    url: str = Field(..., description="Target website URL to assess", min_length=3, max_length=2048)
    include_headers: bool = Field(True, description="Whether to evaluate HTTP security headers")
    include_cookies: bool = Field(True, description="Whether to evaluate cookie security flags")
    include_mixed_content: bool = Field(True, description="Whether to inspect HTML for mixed HTTP content")
    include_public_files: bool = Field(True, description="Whether to check standard security files (robots.txt, security.txt)")
    report_id: Optional[str] = Field(None, description="Optional associated Module 1 AnalysisReport UUID")


class SecurityFindingSchema(BaseModel):
    """Granular observable security configuration finding or recommendation."""
    id: Optional[str] = None
    category: str  # HTTPS_TRANSPORT, SECURITY_HEADERS, COOKIE_SECURITY, MIXED_CONTENT, INFORMATION_EXPOSURE, SECURITY_CONFIG
    title: str
    description: str
    evidence: Optional[Dict[str, Any]] = None
    severity: str  # Informational, Low, Medium, High, Critical
    confidence: float = 1.0
    recommendation: Optional[str] = None
    source: str = "SECURITY_ASSESSMENT_ENGINE"
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CategoryScoreSchema(BaseModel):
    """Score breakdown for a specific security dimension."""
    category: str
    score: float
    weight: float
    status: str  # STRONG, ACCEPTABLE, WEAK, INSECURE, NOT_APPLICABLE
    description: str


class CoverageSchema(BaseModel):
    """Inspection completeness and coverage metrics."""
    completed: int
    total: int
    percentage: float
    unavailable_checks: List[str] = []


class SecurityHeaderEvaluationSchema(BaseModel):
    """Structured assessment for an individual HTTP response header."""
    header_name: str
    exists: bool
    observed_value: Optional[str] = None
    security_purpose: str
    assessment: str  # STRONG, ACCEPTABLE, WEAK, MISSING, INSECURE
    recommended_improvement: Optional[str] = None


class CookieEvaluationSchema(BaseModel):
    """Security attributes audit for an observed Set-Cookie directive (values redacted for privacy)."""
    cookie_name: str
    secure: bool
    http_only: bool
    same_site: Optional[str] = None
    domain: Optional[str] = None
    path: Optional[str] = None
    expires: Optional[str] = None
    assessment: str  # SECURE, POTENTIALLY_VULNERABLE, WEAK


class SecurityAssessmentResponse(BaseModel):
    """Module 5: Complete Passive Website Security Configuration Assessment Report."""
    report_id: str
    target_url: str
    security_score: float
    security_label: str  # Strong Configuration, Good Configuration, Needs Improvement, Weak Configuration, Poor Configuration
    coverage: CoverageSchema
    categories: List[CategoryScoreSchema] = []
    headers_evaluation: List[SecurityHeaderEvaluationSchema] = []
    cookies_evaluation: List[CookieEvaluationSchema] = []
    findings: List[SecurityFindingSchema] = []
    recommendations: List[str] = []
    status: str = "COMPLETED"
    summary: str = ""
    distinction_note: str = (
        "Note: A strong security configuration does not guarantee a website is legitimate or safe from phishing. "
        "Security configurations defend against client-side exploitation, while threat detection evaluates malicious intent."
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecurityAssessmentListItem(BaseModel):
    """Compact summary for security assessment listing."""
    id: str
    target_url: str
    security_score: float
    security_label: str
    status: str
    findings_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SecurityFindingsFilterResponse(BaseModel):
    """Filtered and paginated findings query response."""
    total: int
    findings: List[SecurityFindingSchema] = []
    limit: int = 50
    skip: int = 0


# ====================================================
# MODULE 6: Decentralized Threat Intelligence Schemas
# ====================================================

class BlockchainRegisterRequest(BaseModel):
    """Request payload to register a threat report fingerprint on blockchain."""
    report_id: str = Field(..., description="UUID of report to anchor")
    report_type: Optional[str] = Field("URL_ANALYSIS", description="URL_ANALYSIS, MESSAGE_ANALYSIS, or WEBSITE_SECURITY")


class BlockchainRegisterResponse(BaseModel):
    """Response returned upon initiating or confirming blockchain report registration."""
    report_id: str
    report_type: str = "URL_ANALYSIS"
    report_hash: str
    network: str = "sepolia"
    chain_id: int = 11155111
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    registration_status: str  # NOT_REGISTERED, PENDING, CONFIRMED, FAILED
    explorer_url: Optional[str] = None
    message: str
    registered_at: Optional[datetime] = None


class BlockchainVerifyResponse(BaseModel):
    """Response returned when independently auditing report integrity against blockchain."""
    report_id: str
    current_report_hash: str
    registered_report_hash: Optional[str] = None
    registered: bool
    integrity_verified: bool
    verification_status: str  # VERIFIED, TAMPERED, NOT_REGISTERED, PENDING, UNAVAILABLE
    network: str = "sepolia"
    chain_id: int = 11155111
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    timestamp: Optional[int] = None
    submitter: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    disclaimer: str = (
        "Blockchain verification confirms whether the current report matches the cryptographic fingerprint "
        "registered on-chain. It does not independently determine whether the original threat assessment was accurate."
    )


class BlockchainReportDetailsResponse(BaseModel):
    """Complete metadata record for an on-chain threat report registration."""
    id: str
    report_id: str
    report_type: str
    report_hash: str
    canonical_payload: Optional[Dict[str, Any]] = None
    network: str
    chain_id: int
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    submitter_address: Optional[str] = None
    registration_status: str
    verification_status: str
    registered_at: Optional[datetime] = None
    last_verified_at: Optional[datetime] = None
    explorer_url: Optional[str] = None
    error_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BlockchainNetworkStatusResponse(BaseModel):
    """Real-time operational status of EVM JSON-RPC connection and registry smart contract."""
    network_name: str
    chain_id: int
    rpc_url: str
    rpc_status: str  # CONNECTED, DISCONNECTED, UNAVAILABLE, UNCONFIGURED
    latest_block: Optional[int] = None
    contract_address: Optional[str] = None
    contract_available: bool = False
    total_reports_registered: Optional[int] = None
    recent_registrations: List[Dict[str, Any]] = []
    wallet_address: Optional[str] = None
    wallet_balance_eth: Optional[float] = None


