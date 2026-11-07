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

### 3. Retrieve Report by ID
**Endpoint:** `GET /api/v1/reports/{report_id}`  
**Description:** Fetches a full historical investigation report by its UUID.

---

### 4. List Reports History
**Endpoint:** `GET /api/v1/reports?limit=50&skip=0`  
**Description:** Returns a paginated array of previous security analysis reports.

---

### 5. Dashboard Statistics
**Endpoint:** `GET /api/v1/dashboard/stats`  
**Description:** Returns platform-wide aggregate counts, risk distributions, and recent investigations for dashboard charting.

---

### 6. Health Check
**Endpoint:** `GET /api/v1/health`  
**Description:** Returns operational health status, connected database engine, and active modules.

---

### 7. Web3 / Blockchain Network Status (Sepolia Testnet)
**Endpoint:** `GET /api/v1/blockchain/status`  
**Description:** Queries live Ethereum Sepolia Testnet block number, JSON-RPC latency, and registry smart contract deployment.

---

### 8. Anchor Cryptographic Commitment on Sepolia
**Endpoint:** `POST /api/v1/blockchain/anchor/{report_id}`  
**Description:** Calculates a deterministic SHA-256 cryptographic digest of the report and publishes an immutable threat commitment to the Sepolia Testnet registry.
