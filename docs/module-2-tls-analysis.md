# Module 2: TLS Certificate & Digital Trust Analysis

## 1. Overview & Objective

Module 2 delivers an evidence-based TLS and digital trust analysis engine that evaluates the transport-layer security and identity indicators of a website's HTTPS connection. 

In modern cybersecurity workflows, **a valid TLS certificate does NOT prove that a website is legitimate or safe**. Phishing syndicates and scam operations frequently acquire valid, free X.509 certificates (e.g., through automated CAs like Let's Encrypt or Cloudflare) to display the browser padlock and instill a false sense of security.

Accordingly, Module 2 treats TLS metadata as **one evidence category** within the holistic threat detection pipeline. It evaluates cryptographic hygiene, certificate validity, issuer provenance, and certificate transparency without blindly reducing or zeroing out phishing risk scores.

---

## 2. Core Verification Pillars

```
                                      TARGET DOMAIN / URL
                                               |
                                               v
                                   [ SSRF Pre-flight Guard ]
                           (Rejects 127.0.0.1, 10.0.0.0/8, 169.254.169.254)
                                               |
                                               v
                          +--------------------+--------------------+
                          |                                         |
                          v                                         v
               [ Dual TLS Handshake ]                     [ CT Public Audit ]
          +-------------------------------+               (crt.sh API Query)
          | 1. Strict Verified Handshake  |                         |
          |    (Hostname & CA Validated)  |                         |
          | 2. Unverified Inspection      |                         |
          |    (Fallback if self-signed)  |                         |
          +---------------+---------------+                         |
                          |                                         |
                          v                                         v
               [ X.509 Metadata Extraction ]              [ Historic Log Stats ]
               - Subject & Issuer CN / Org                - Total logged certs
               - Serial Number & UTC Dates                - Recent certs (90d)
               - Wildcard & SAN Host Matching             - Distinct issuing CAs
               - RSA/ECC Key Size & Curve
               - Signature Hash Algorithm
                          |                                         |
                          +--------------------+--------------------+
                                               |
                                               v
                                  [ Structured TLS Findings ]
                                  [ Digital Trust Synthesis ]
```

### 1. HTTPS Availability & Handshake
- Probes port 443 with a timeout strictly bounded for serverless environments (<= 3.5s).
- Implements a dual-phase handshake:
  1. **Strict Verified Handshake**: Assesses whether modern operating system and browser root stores accept the certificate chain.
  2. **Unverified Peer Inspection Fallback**: If standard verification fails (e.g., self-signed certificate, expired cert, or missing intermediate bundle), safely completes an unverified handshake strictly to extract the peer certificate for cryptographic forensics rather than failing completely.

### 2. X.509 Certificate Metadata Parsing
- Decodes raw DER bytes directly using Python `cryptography.x509`.
- Extracts:
  - **Subject**: Common Name (`CN`), Organization (`O`), Country (`C`).
  - **Issuer**: Issuing CA Common Name, Organization, Country.
  - **Serial Number**: Formatted as colon-delimited hexadecimal.
  - **Signature Algorithm**: e.g., `sha256WithRSAEncryption`, `ecdsa-with-SHA384`. Flags legacy or collision-vulnerable algorithms (e.g., `MD5`, `SHA-1`).
  - **Version**: X.509 version (typically v3).

### 3. Expiration & Temporal Validity
- UTC-aware expiration comparison avoiding timezone skew.
- Computes `days_remaining` / `days_expired`.
- Categorizes status:
  - `VALID`: Currently active and valid.
  - `EXPIRED`: Past expiration date.
  - `EXPIRING_SOON`: Valid for 14 days or fewer.
  - `NOT_YET_VALID`: Certificate start date is in the future.

### 4. Hostname & SAN Domain Matching
- Complies with RFC 6125 for Subject Alternative Name (`SAN`) verification.
- Matches against DNS Subject Alternative Names and Subject Common Name fallback.
- Supports single-label leftmost wildcard expansion (e.g., `*.example.com` matches `api.example.com` but not `sub.api.example.com`).
- Discrepancies generate a high-severity `TLS_HOSTNAME_MISMATCH` finding.

### 5. Trust Chain Validation
- Identifies whether the certificate was signed by an accredited public Certificate Authority.
- Distinguishes between:
  - `TRUSTED`: Certificate chain successfully resolves to trusted root store anchors.
  - `SELF_SIGNED`: Subject equals Issuer, generating a warning and recommendation for public services.
  - `UNTRUSTED`: Missing intermediate certificates or untrusted issuer.

### 6. Cryptographic Strength Evaluation
- **Protocol Version**:
  - `TLSv1.3`: Modern protocol (Informational finding).
  - `TLSv1.2`: Standard protocol (Informational finding).
  - `TLSv1.0` / `TLSv1.1` / `SSLv3`: Deprecated legacy protocols (High severity finding; RFC 8996).
- **Public Key Specifications**:
  - RSA: Evaluates bit length. RSA < 2048-bit triggers `TLS_WEAK_RSA_KEY` (High severity). RSA >= 3072-bit flagged as Strong.
  - ECDSA: Evaluates curve and key length (e.g., `secp256r1`, `secp384r1`).
- **Signature Hash**: Flags deprecated hashing algorithms (`SHA-1`, `MD5`) susceptible to collision attacks.

### 7. Certificate Transparency (CT) Public Audit
- Queries public Certificate Transparency logs via `crt.sh`.
- Retrieves historical issuance records for the registered domain.
- Computes:
  - Total historical certificates logged.
  - Distinct Certificate Authorities utilized over time.
  - Recent certificates issued within the preceding 90 days.
  - Sample log entries with Log IDs, validity periods, and issuer names.
- Fails open gracefully: Network timeouts or rate limits (HTTP 429) on `crt.sh` do not disrupt the primary analysis pipeline.

---

## 3. API Endpoints

### 1. Dedicated TLS Analysis
`POST /api/v1/analyze/tls`

**Request:**
```json
{
  "target": "https://example.com"
}
```

**Response (`schemas.TLSAnalysisResponse`):**
```json
{
  "target": "https://example.com",
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
    "subject": {
      "common_name": "example.com",
      "organization": "Example Organization"
    },
    "issuer": {
      "common_name": "DigiCert Global Root G2",
      "organization": "DigiCert Inc"
    },
    "serial_number": "04:A2:3B:C9:F1:...",
    "valid_from": "2024-01-01T00:00:00Z",
    "valid_to": "2025-01-01T00:00:00Z",
    "days_remaining": 55,
    "san": ["example.com", "*.example.com"],
    "public_key_algorithm": "RSA",
    "public_key_size": 2048,
    "signature_algorithm": "sha256WithRSAEncryption",
    "curve": null
  },
  "certificate_transparency": {
    "total_records": 14,
    "distinct_issuers": ["DigiCert Inc", "Let's Encrypt"],
    "recent_certificates_count": 2,
    "sample_records": [],
    "status": "COMPLETED",
    "error_message": null
  },
  "findings": [
    {
      "finding_id": "TLS_CERT_VALID",
      "category": "validity",
      "title": "Certificate Valid",
      "description": "Certificate is currently valid (55 days remaining). Note: A valid certificate does not guarantee a website is legitimate.",
      "severity": "Informational",
      "evidence": { "days_remaining": 55 },
      "recommendation": null,
      "confidence": 1.0
    }
  ],
  "recommendations": [],
  "error_message": null
}
```

### 2. Comprehensive URL Analysis with Integrated TLS
`POST /api/v1/analyze/url`

**Request:**
```json
{
  "url": "https://example.com",
  "include_tls": true
}
```
Returns `schemas.AnalysisReportResponse` with the embedded `tls_analysis` object and notable TLS security indicators merged into `findings`.

---

## 4. Defensive Networking & SSRF Safeguards

All TLS operations enforce strict pre-flight SSRF protection:
1. Target IP or resolved DNS address is verified before establishing socket connections.
2. Direct connection attempts to:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local and cloud metadata endpoints (`169.254.169.254`, `fe80::/10`)
   - Broadcast and reserved ranges
   are rejected immediately with a `CRITICAL` finding without opening network connections.

---

## 5. Automated Test Coverage (14 Scenarios)

The test suite in `backend/tests/test_tls_analyzer.py` verifies:
1. **Valid HTTPS Certificate**: Handshake, SAN matching, valid dates, and trusted CA.
2. **Expired Certificate**: Past UTC validity flagged with `TLS_CERT_EXPIRED`.
3. **Hostname Mismatch**: Unlisted domain flagged with `TLS_HOSTNAME_MISMATCH` and status `MISMATCHED`.
4. **Self-Signed Certificate**: Detection of self-signed subject/issuer and `TLS_SELF_SIGNED`.
5. **Weak Cryptography**: RSA < 2048-bit and deprecated TLS 1.0 flagged with `TLS_WEAK_RSA_KEY` and `TLS_DEPRECATED_PROTOCOL`.
6. **Unsupported TLS**: Non-HTTPS servers handled cleanly (`https_available=False`).
7. **Certificate Transparency Success**: crt.sh parsing of multiple log entries.
8. **Certificate Transparency Failure**: Graceful handling of external API rate limits or downtime.
9. **DNS Resolution Failure**: Unresolvable hosts reported without crashing.
10. **Connection Timeout**: Timeout boundaries enforced without blocking thread loops.
11. **SSRF Defense**: Private and cloud metadata IP attempts blocked.
12. **Malformed Input**: Resilience against corrupted or malformed target strings.
13. **Partial Failure Robustness**: Handshake succeeds when CT log service is unavailable.
14. **Combined Module 1 + 2 Pipeline**: End-to-end integration with database report storage.

