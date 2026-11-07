# API Documentation

## AI-Powered Web Threat Detection & Digital Trust Intelligence

### Base URLs
- Local Development: `http://localhost:8000/api/v1`
- Vercel Production: `https://<your-project>.vercel.app/api/v1`

---

### 1. Submit URL for Comprehensive Analysis (Module 1 + Module 2)
**Endpoint:** `POST /api/v1/analyze/url`  
**Description:** Validates the URL, executes domain profiling, queries DNS records, traces redirect hops with SSRF checks, queries threat intelligence, performs TLS certificate inspection, calculates risk, and generates an AI summary.

#### Request Payload
```json
{
  "url": "https://example.com/login",
  "include_tls": true
}
```

#### Successful Response (`200 OK`)
```json
{
  "id": "c1f7a28b-9023-4e4b-97e3-0d34f0d61109",
  "submitted_url": "https://example.com/login",
  "normalized_url": "https://example.com/login",
  "domain": "example.com",
  "risk_level": "LOW_RISK",
  "risk_score": 10.0,
  "confidence": 0.95,
  "summary": "No significant malicious indicators identified across active verification checks.",
  "analysis_status": "COMPLETED",
  "created_at": "2026-11-07T12:00:00Z",
  "findings": [
    {
      "category": "TLS_SECURITY",
      "indicator": "TLS_CERT_VALID",
      "severity": "INFORMATIONAL",
      "description": "Certificate is currently valid (88 days remaining). Note: A valid certificate does not guarantee a website is legitimate.",
      "source": "TLSAnalyzer",
      "confidence": 1.0,
      "evidence": { "days_remaining": 88 }
    }
  ],
  "dns": {
    "a_records": ["93.184.216.34"],
    "aaaa_records": ["2606:2800:220:1:248:1893:25c8:1946"],
    "mx_records": [],
    "ns_records": ["a.iana-servers.net", "b.iana-servers.net"],
    "txt_records": [],
    "status": "RESOLVED"
  },
  "redirects": {
    "original_url": "https://example.com/login",
    "final_url": "https://example.com/login",
    "hops": [],
    "redirect_count": 0,
    "cross_domain_redirects": false,
    "status": "COMPLETED"
  },
  "domain_analysis": {
    "subdomain": "",
    "registered_domain": "example.com",
    "tld": "com",
    "is_punycode": false,
    "domain_length": 11,
    "is_brand_impersonation": false,
    "target_brand": null,
    "similarity_score": 0.0
  },
  "threat_intel": {
    "provider": "VirusTotal",
    "status": "COMPLETED",
    "is_malicious": false,
    "malicious_count": 0,
    "suspicious_count": 0,
    "harmless_count": 72,
    "total_engines": 72
  },
  "tls_analysis": {
    "target": "example.com",
    "hostname": "example.com",
    "port": 443,
    "https_available": true,
    "tls_version": "TLSv1.3",
    "cipher_suite": "TLS_AES_256_GCM_SHA384",
    "certificate_status": "VALID",
    "hostname_match": true,
    "chain_status": "TRUSTED",
    "cryptographic_strength": "STRONG",
    "certificate_info": {
      "subject": { "common_name": "example.com", "organization": "Internet Assigned Numbers Authority" },
      "issuer": { "common_name": "DigiCert Global Root G2", "organization": "DigiCert Inc" },
      "serial_number": "0C:44:B2:7D:...",
      "valid_from": "2024-01-15T00:00:00Z",
      "valid_to": "2025-01-15T23:59:59Z",
      "days_remaining": 88,
      "san": ["example.com", "*.example.com"],
      "public_key_algorithm": "RSA",
      "public_key_size": 2048,
      "signature_algorithm": "sha256WithRSAEncryption"
    },
    "certificate_transparency": {
      "total_records": 18,
      "distinct_issuers": ["DigiCert Inc"],
      "recent_certificates_count": 2,
      "status": "COMPLETED"
    },
    "findings": [],
    "recommendations": []
  },
  "ai_explanation": {
    "summary": "No critical security threats detected for example.com.",
    "risk_level": "LOW_RISK",
    "explanation": ["Domain structure, DNS records, and TLS certificate pass standard security checks."],
    "recommendations": ["Exercise standard web hygiene."]
  },
  "unavailable_checks": []
}
```

---

### 2. Dedicated TLS Certificate & Digital Trust Analysis (Module 2)
**Endpoint:** `POST /api/v1/analyze/tls`  
**Description:** Performs specialized TLS analysis including HTTPS availability, certificate chain trust, SAN hostname matching, cryptographic parameters, and Certificate Transparency logs via crt.sh.

#### Request Payload
```json
{
  "target": "https://example.com"
}
```

#### Response (`schemas.TLSAnalysisResponse`)
Returns detailed TLS handshake, cryptographic parameters, X.509 certificate metadata, Certificate Transparency audit records, and digital trust findings.

---

### 3. AI-Powered Scam & Message Analysis (Module 3)
**Endpoint:** `POST /api/v1/analyze/message`  
**Description:** Evaluates suspicious messages, phishing emails, fake KYC alerts, delivery scams, and job propositions. Extracts URLs, crypto addresses, and phone numbers, detects social engineering manipulation, guards against adversarial prompt injection, and executes cross-module URL/TLS analysis.

#### Request Payload
```json
{
  "message": "URGENT: Your HDFC bank account has been blocked due to pending KYC. Update at http://hdfc-kyc.com",
  "analyze_urls": true
}
```

#### Response (`schemas.MessageAnalysisResponse`)
Returns risk score, risk level, confidence, extracted entities, suspicious indicators, cross-module URL/TLS analyses, and grounded AI explanation.

---

### 4. Retrieve Message Analysis Report by ID
**Endpoint:** `GET /api/v1/analyze/message/{report_id}`  
**Description:** Fetches a full historical message analysis report by its UUID.

---

### 5. List Message Analysis History
**Endpoint:** `GET /api/v1/messages?limit=50&skip=0`  
**Description:** Returns a paginated list of previous message analysis sessions.

---

### 6. Retrieve Report by ID
**Endpoint:** `GET /api/v1/reports/{report_id}`  
**Description:** Fetches a full historical investigation report by its UUID.

---

### 7. List Reports History
**Endpoint:** `GET /api/v1/reports?limit=50&skip=0`  
**Description:** Returns a paginated array of previous security analysis reports.

---

### 8. Dashboard Statistics
**Endpoint:** `GET /api/v1/dashboard/stats`  
**Description:** Returns platform-wide aggregate counts, risk distributions, and recent investigations for dashboard charting.

---

### 9. Health Check
**Endpoint:** `GET /api/v1/health`  
**Description:** Returns operational health status, connected database engine, and active modules.

---

### 10. Web3 / Blockchain Network Status (Sepolia Testnet)
**Endpoint:** `GET /api/v1/blockchain/status`  
**Description:** Queries live Ethereum Sepolia Testnet block number, JSON-RPC latency, and registry smart contract deployment.

---

### 11. Anchor Cryptographic Commitment on Sepolia
**Endpoint:** `POST /api/v1/blockchain/anchor/{report_id}`  
**Description:** Calculates a deterministic SHA-256 cryptographic digest of the report and publishes an immutable threat commitment to the Sepolia Testnet registry.

---

### 12. Correlate Report Findings (Module 4)
**Endpoint:** `POST /api/v1/correlate`  
**Description:** Links cross-module findings from URL, TLS, and Scam Message modules across historical reports, maps infrastructure relationships, and detects campaign patterns.

#### Request Payload
```json
{
  "report_id": "c1f7a28b-9023-4e4b-97e3-0d34f0d61109",
  "report_type": "URL"
}
```

---

### 13. Retrieve Correlation Report
**Endpoint:** `GET /api/v1/correlations/{report_id}`  
**Description:** Retrieves persistent or on-demand multi-module correlation intelligence, graph nodes, and detected campaign patterns.

---

### 14. Query Connected Threat Neighborhood
**Endpoint:** `GET /api/v1/threats/{indicator_id}/related`  
**Description:** Traverses 1-hop and 2-hop connected graph nodes and edges for a specific threat indicator.

---

### 15. Platform Threat Intelligence Overview
**Endpoint:** `GET /api/v1/threat-intelligence/overview`  
**Description:** Returns platform-wide indicator counts, unique domains, IPs, certificates, relationship edge counts, detected patterns, and recent correlations.

---

### 16. Website Security Assessment (Module 5)
**Endpoint:** `POST /api/v1/analyze/security`  
**Description:** Performs non-intrusive, passive evaluation of publicly observable website security configurations. Evaluates HTTPS & Transport Security, HTTP Security Headers, Cookie Security Attributes, Mixed Content, Information Exposure, and Public Security Configuration Files. Generates an explainable 0–100 security configuration score, coverage metrics, and actionable remediation steps.

> **SSRF Protection:** Enforces strict pre-flight DNS and private/loopback/cloud metadata IP validation (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).  
> **Privacy:** Never stores cookie values, session tokens, or sensitive headers; only cookie names and security flags are recorded.  
> **Conceptual Distinction:** High security configuration (A+) does not imply absence of phishing/scam intent, nor does a low score prove malicious activity.

#### Request Payload
```json
{
  "url": "https://example.com"
}
```

#### Successful Response (`200 OK` - `schemas.SecurityAssessmentResponse`)
```json
{
  "id": "e6a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "report_id": "c1f7a28b-9023-4e4b-97e3-0d34f0d61109",
  "target_url": "https://example.com",
  "security_score": 88.5,
  "security_label": "Good Configuration",
  "coverage": {
    "checks_attempted": 6,
    "checks_successful": 6,
    "coverage_percentage": 100.0,
    "failed_checks": []
  },
  "category_scores": [
    {
      "category": "HTTPS and Transport Security",
      "score": 95.0,
      "weight": 0.25,
      "status": "PASS",
      "summary": "Enforced HTTPS with strong modern TLS configuration."
    },
    {
      "category": "HTTP Security Headers",
      "score": 80.0,
      "weight": 0.25,
      "status": "NEEDS_IMPROVEMENT",
      "summary": "7 of 9 standard defensive headers implemented."
    },
    {
      "category": "Cookie Security",
      "score": 90.0,
      "weight": 0.20,
      "status": "PASS",
      "summary": "All cookies set Secure and HttpOnly flags."
    },
    {
      "category": "Mixed Content",
      "score": 100.0,
      "weight": 0.15,
      "status": "PASS",
      "summary": "No insecure HTTP resources or forms detected on HTTPS page."
    },
    {
      "category": "Information Exposure",
      "score": 70.0,
      "weight": 0.05,
      "status": "NEEDS_IMPROVEMENT",
      "summary": "Server header exposes technology banner."
    },
    {
      "category": "Security Configuration Files",
      "score": 90.0,
      "weight": 0.10,
      "status": "PASS",
      "summary": "security.txt and robots.txt properly configured."
    }
  ],
  "headers_evaluation": [
    {
      "header_name": "Strict-Transport-Security",
      "exists": true,
      "value": "max-age=31536000; includeSubDomains; preload",
      "security_purpose": "Enforces HTTPS connections and prevents SSL stripping.",
      "assessment": "GOOD",
      "recommendation": null
    }
  ],
  "cookie_evaluations": [
    {
      "name": "session_id",
      "has_secure": true,
      "has_httponly": true,
      "samesite": "Lax",
      "is_valid_prefix": true,
      "prefix": null,
      "issues": []
    }
  ],
  "summary": "The website demonstrates a good overall security posture with strong transport encryption and strict cookie policies. Minor improvements recommended for Content-Security-Policy and banner information hiding.",
  "distinction_note": "A strong security configuration score indicates good defensive hygiene (transport encryption, headers, cookie flags), but does NOT guarantee that the site is legitimate or free from phishing intent.",
  "findings": [],
  "recommendations": [
    "Add a robust Content-Security-Policy header to mitigate Cross-Site Scripting (XSS).",
    "Suppress the Server header banner to prevent reconnaissance of software versions."
  ],
  "assessment_status": "COMPLETED",
  "created_at": "2026-11-08T01:00:00Z"
}
```

---

### 17. Retrieve Website Security Assessment Report
**Endpoint:** `GET /api/v1/security/{report_id}`  
**Description:** Fetches an existing website security assessment report by analysis report ID or security assessment ID.

#### Response (`200 OK`)
Returns the complete `schemas.SecurityAssessmentResponse` object including score, 6 category breakdowns, 9-header evaluations, sanitized cookie audit, and remediation recommendations.

---

### 18. Filter Website Security Findings
**Endpoint:** `GET /api/v1/security/{report_id}/findings?severity=MEDIUM&category=HTTP%20Security%20Headers&limit=50&skip=0`  
**Description:** Returns paginated security findings for a specific assessment, filterable by minimum severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFORMATIONAL`) and category.

#### Query Parameters
- `severity` (optional): Filter by severity string.
- `category` (optional): Filter by category name string.
- `limit` (optional, default `50`): Maximum number of findings to return.
- `skip` (optional, default `0`): Pagination offset.

#### Response (`200 OK` - `schemas.SecurityFindingsFilterResponse`)
```json
{
  "report_id": "c1f7a28b-9023-4e4b-97e3-0d34f0d61109",
  "total_count": 3,
  "filtered_count": 1,
  "findings": [
    {
      "id": "7b8c9d0e-1f2a-3b4c-5d6e-7f8a9b0c1d2e",
      "assessment_id": "e6a1b2c3-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
      "category": "HTTP Security Headers",
      "title": "Missing Content-Security-Policy Header",
      "description": "Content-Security-Policy (CSP) is missing, leaving the application more vulnerable to cross-site scripting (XSS) and code injection attacks.",
      "evidence": { "header": "Content-Security-Policy", "present": false },
      "severity": "MEDIUM",
      "confidence": 1.0,
      "recommendation": "Configure a Content-Security-Policy header restricting valid source directives.",
      "source": "SecurityHeadersAnalyzer",
      "created_at": "2026-11-08T01:00:00Z"
    }
  ]
}
```


