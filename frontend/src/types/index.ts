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

