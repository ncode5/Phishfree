export type RiskLevel =
  | 'LOW_RISK'
  | 'SUSPICIOUS'
  | 'HIGH_RISK'
  | 'CONFIRMED_MALICIOUS'
  | 'INCONCLUSIVE';

export type SeverityLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Finding {
  id?: string;
  category: string;
  indicator: string;
  severity: SeverityLevel;
  description: string;
  source: string;
  confidence: number;
  evidence?: Record<string, any>;
  observed_at?: string;
}

export interface DNSRecords {
  a_records: string[];
  aaaa_records: string[];
  mx_records: string[];
  ns_records: string[];
  txt_records: string[];
  status: string;
  error_message?: string;
}

export interface RedirectHop {
  hop_number: number;
  url: string;
  status_code?: number;
  domain: string;
  ip?: string;
  is_cross_domain: boolean;
}

export interface RedirectAnalysis {
  original_url: string;
  final_url: string;
  hops: RedirectHop[];
  redirect_count: number;
  cross_domain_redirects: boolean;
  status: string;
  error_message?: string;
}

export interface DomainAnalysis {
  subdomain: string;
  registered_domain: string;
  tld: string;
  full_domain: string;
  is_punycode: boolean;
  unicode_domain?: string;
  domain_length: number;
  subdomain_count: number;
  has_hyphens: boolean;
  hyphen_count: number;
  is_brand_impersonation: boolean;
  target_brand?: string;
  similarity_score: number;
  suspicious_patterns: string[];
}

export interface ThreatIntel {
  provider: string;
  status: string;
  is_malicious: boolean;
  malicious_count: number;
  suspicious_count: number;
  harmless_count: number;
  total_engines: number;
  scan_date?: string;
  permalink?: string;
  message?: string;
}

export interface AIExplanation {
  summary: string;
  risk_level: string;
  explanation: string[];
  recommendations: string[];
  is_deterministic_fallback: boolean;
}

export interface TLSFinding {
  finding_id: string;
  category: string;
  title: string;
  description: string;
  severity: 'Informational' | 'Low' | 'Medium' | 'High' | 'Critical';
  evidence?: Record<string, any>;
  recommendation?: string;
  confidence: number;
}

export interface CertificateInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  common_name?: string;
  issuer_common_name?: string;
  issuer_organization?: string;
  serial_number: string;
  signature_algorithm: string;
  version: number;
  valid_from: string;
  valid_until: string;
  days_until_expiration: number;
  is_expired: boolean;
  sans: string[];
  public_key_algorithm: string;
  public_key_size?: number;
  curve?: string;
}

export interface CertificateTransparency {
  total_records: number;
  distinct_issuers: string[];
  recent_certificates_count: number;
  sample_logged_entries: Array<{
    id?: number | string;
    entry_type?: string;
    not_before?: string;
    not_after?: string;
    issuer_name?: string;
    common_name?: string;
  }>;
  status: string;
}

export interface TLSAnalysis {
  target: string;
  hostname: string;
  port: number;
  https_available: boolean;
  tls_version?: string;
  cipher_suite?: string;
  certificate_status: string;
  hostname_match: boolean;
  chain_status: string;
  certificate_info?: CertificateInfo;
  cryptographic_strength: string;
  certificate_transparency?: CertificateTransparency;
  findings: TLSFinding[];
  recommendations: string[];
  error_message?: string;
}

export interface AnalysisReport {
  id: string;
  submitted_url: string;
  normalized_url: string;
  domain: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  summary: string;
  analysis_status: string;
  created_at: string;
  findings: Finding[];
  dns?: DNSRecords;
  redirects?: RedirectAnalysis;
  domain_analysis?: DomainAnalysis;
  threat_intel?: ThreatIntel;
  ai_explanation?: AIExplanation;
  tls_analysis?: TLSAnalysis;
  unavailable_checks: string[];
}

export interface AnalysisReportListItem {
  id: string;
  submitted_url: string;
  domain: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  summary: string;
  created_at: string;
  findings_count: number;
}

export interface RiskDistributionItem {
  name: string;
  count: number;
  color: string;
}

export interface DashboardStats {
  total_analyzed: number;
  low_risk_count: number;
  suspicious_count: number;
  high_risk_count: number;
  confirmed_malicious_count: number;
  inconclusive_count: number;
  recent_reports: AnalysisReportListItem[];
  risk_distribution: RiskDistributionItem[];
}

// Module 3: Scam and Message Analysis Types
export interface MessageAnalyzeRequest {
  message: string;
  analyze_urls?: boolean;
}

export interface CryptoAddressEntity {
  type: string;
  address: string;
}

export interface ExtractedEntities {
  urls: string[];
  domains: string[];
  emails: string[];
  phone_numbers: string[];
  crypto_addresses: Array<CryptoAddressEntity | string>;
  payment_handles?: string[];
  upi_handles?: string[];
  gift_card_codes?: string[];
}

export interface SuspiciousIndicator {
  id?: string;
  category: string;
  title: string;
  description: string;
  severity: SeverityLevel | string;
  matched_phrases?: string[];
  matched_text?: string;
  evidence?: Record<string, any>;
  weight?: number;
}

export interface ExtractedURLAnalysis {
  url: string;
  domain: string;
  risk_level: RiskLevel;
  risk_score: number;
  is_malicious?: boolean;
  summary: string;
  report_id?: string;
  tls_status?: string;
  threat_status?: string;
  error?: string | null;
}

export interface MessageExplanation {
  summary: string;
  threat_category?: string;
  likely_scam_category?: string;
  risk_level: string;
  explanation_points?: string[];
  key_findings?: string[];
  manipulation_techniques?: string[];
  social_engineering_tactics?: string[];
  suspicious_phrases?: string[];
  recommendations: string[];
  limitations?: string;
  is_deterministic_fallback: boolean;
}

export interface MessageAnalysisReport {
  id: string;
  message_preview: string;
  message_length: number;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  primary_category: string;
  categories: string[];
  summary: string;
  indicators: SuspiciousIndicator[];
  entities: ExtractedEntities;
  extracted_url_analyses: ExtractedURLAnalysis[];
  ai_explanation?: MessageExplanation;
  recommendations: string[];
  analysis_status: string;
  created_at: string;
}

export interface MessageAnalysisListItem {
  id: string;
  message_preview: string;
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  primary_category: string;
  created_at: string;
  urls_count: number;
}

// ==========================================
// MODULE 4: Intelligent Threat Correlation
// ==========================================

export interface ThreatGraphNode {
  id: string;
  label: string;
  indicator_type: 'URL' | 'DOMAIN' | 'IP' | 'CERTIFICATE' | 'CERT_FINGERPRINT' | 'ISSUER' | 'CERT_ISSUER' | 'MESSAGE' | 'THREAT_INTEL' | 'EMAIL' | 'PHONE';
  normalized_value: string;
  risk_level: 'LOW_RISK' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CONFIRMED_MALICIOUS' | 'INFO';
  risk_score: number;
  occurrence_count: number;
  source_report?: string;
  details?: Record<string, any>;
}

export interface ThreatGraphEdge {
  id: string;
  source: string;
  target: string;
  relationship_type: string;
  label: string;
  evidence_source: string;
  confidence: number;
}

export interface ThreatGraphData {
  nodes: ThreatGraphNode[];
  edges: ThreatGraphEdge[];
}

export interface ThreatPattern {
  id?: string;
  pattern_name: string;
  description: string;
  severity: SeverityLevel;
  confidence: number;
  supporting_evidence: Record<string, any>[];
  related_reports: string[];
  reason?: string;
}

export interface CorrelationExplanation {
  summary: string;
  risk_level: string;
  reasoning: string[];
  corroborating_factors: string[];
  mitigating_factors: string[];
  recommendations: string[];
  is_deterministic_fallback: boolean;
}

export interface EvidenceTransparency {
  verified_external_evidence: Record<string, any>[];
  technical_observations: Record<string, any>[];
  rule_based_correlations: Record<string, any>[];
  ai_generated_insights: string[];
}

export interface CorrelationReport {
  id: string;
  report_id: string;
  report_type: 'URL' | 'MESSAGE';
  correlation_score: number;
  risk_level: RiskLevel;
  confidence: number;
  summary: string;
  graph: ThreatGraphData;
  patterns: ThreatPattern[];
  explanation: CorrelationExplanation;
  evidence_transparency: EvidenceTransparency;
  created_at: string;
}

export interface ThreatIndicatorItem {
  id: string;
  indicator_type: string;
  indicator_value: string;
  normalized_value?: string;
  raw_value?: string;
  threat_category: string;
  source: string;
  occurrence_count: number;
  risk_score: number;
  first_seen?: string;
  last_seen?: string;
}

export interface ThreatRelationshipItem {
  id: string;
  source_indicator_id: string;
  target_indicator_id: string;
  relationship_type: string;
  evidence_source: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface RelatedThreatsResponse {
  root_indicator: ThreatIndicatorItem;
  direct_connections: ThreatRelationshipItem[];
  connected_indicators: ThreatIndicatorItem[];
  graph: ThreatGraphData;
}

export interface ThreatIntelOverview {
  total_indicators: number;
  unique_domains: number;
  unique_ips: number;
  unique_certificates: number;
  suspicious_relationships: number;
  detected_threat_patterns: number;
  total_correlations: number;
  recent_correlations: {
    id: string;
    report_id: string;
    report_type: string;
    risk_level: string;
    score: number;
    patterns_count: number;
    created_at?: string;
  }[];
  top_patterns: {
    pattern_name: string;
    occurrences: number;
  }[];
}


