# Module 5: Website Security Assessment

## 1. Overview & Objective
Module 5 provides **passive, non-intrusive website security posture assessment**. It evaluates publicly observable configurations across transport security, defensive HTTP headers, cookie security directives, mixed content vulnerabilities, banner metadata exposure, and standard public security policy files.

### Critical Educational Distinction: Security Configuration vs. Phishing Risk
- **Security Configuration Score**: Evaluates how well a web server is configured against client-side exploitation (e.g. clickjacking, XSS injection, MIME sniffing, SSL stripping, and cookie theft).
- **Phishing / Fraud Risk**: Evaluates malicious intent and deceptive patterns (e.g. brand typosquatting, credential-harvesting lures, and campaign infrastructure).

> **A website may boast an A+ security configuration with strict HSTS and CSP, yet still be operated by a cybercriminal for credential phishing.**  
> Conversely, a benign local business website may be missing HSTS and CSP without being fraudulent.  
> PhishFree treats Website Security Posture and Threat/Phishing Intent as two separate forensic dimensions.

---

## 2. Assessment Workflow & Dimensions

```
+-----------------------------------------------------------------------------------+
|                        Target Website URL (HTTP / HTTPS)                          |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
                 +───────────────────────────────────────────────+
                 |    URL Validation & Strict SSRF Defense       |
                 | (DNS Pre-flight, Loopback & Private IP Block) |
                 +───────────────────────────────────────────────+
                                         │
          ┌──────────────────────────────┼──────────────────────────────┐
          │                              │                              │
          ▼                              ▼                              ▼
+──────────────────────+       +──────────────────────+       +──────────────────────+
| 1. HTTPS Transport   |       | 2. Defensive Headers |       | 3. Cookie Security   |
| (TLS Handshake,      |       | (HSTS, CSP, XFO,     |       | (Secure, HttpOnly,   |
|  Redirect Upgrades,  |       |  XCTO, Referrer,     |       |  SameSite Directives |
|  Downgrade Checks)   |       |  Permissions, COOP)  |       |  Values Redacted)    |
| [Weight: 25%]        |       | [Weight: 25%]        |       | [Weight: 20%]        |
+──────────────────────+       +──────────────────────+       +──────────────────────+
          │                              │                              │
          ├──────────────────────────────┼──────────────────────────────┤
          │                              │                              │
          ▼                              ▼                              ▼
+──────────────────────+       +──────────────────────+       +──────────────────────+
| 4. Mixed Content     |       | 5. Info Exposure     |       | 6. Public Files      |
| (Active Scripts,     |       | (Server Version,     |       | (security.txt,       |
|  CSS, Forms, Media)  |       |  X-Powered-By,       |       |  robots.txt,         |
| [Weight: 15%]        |       |  Framework Leakage)  |       |  sitemap.xml)        |
|                      |       | [Weight: 5%]         |       | [Weight: 10%]        |
+──────────────────────+       +──────────────────────+       +──────────────────────+
                                         │
                                         ▼
                 +───────────────────────────────────────────────+
                 |       Weighted Score (0-100) & Labeling       |
                 | (Strong, Good, Needs Improvement, Weak, Poor) |
                 +───────────────────────────────────────────────+
                                         │
                                         ▼
                 +───────────────────────────────────────────────+
                 |  Evidence Transparency & Hardening Guidance   |
                 +───────────────────────────────────────────────+
```

---

## 3. Detailed Security Checks

### A. HTTPS & Transport Security (25%)
- Verifies HTTPS connection availability.
- Evaluates TLS version (TLS 1.3/1.2 preferred; flags deprecated TLS 1.0/1.1).
- Audits X.509 certificate status (`VALID`, `EXPIRED`, `UNTRUSTED`).
- Detects automatic HTTP-to-HTTPS redirect upgrades.
- **Critical Flag**: Detects HTTPS downgrade redirects (HTTPS page forwarding to cleartext HTTP).

### B. Defensive HTTP Security Headers (25%)
Evaluates the 9 foundational security headers with context-sensitive criteria:
1. **`Strict-Transport-Security` (HSTS)**: Audits `max-age` (recommended >= 18 weeks / 10886400s), `includeSubDomains`, and `preload`.
2. **`Content-Security-Policy` (CSP)**: Audits script restrictions; flags permissive directives (`'unsafe-inline'`, `'unsafe-eval'`, `*`).
3. **`X-Content-Type-Options`**: Enforces `nosniff` against MIME-sniffing attacks.
4. **`X-Frame-Options`**: Enforces `DENY` or `SAMEORIGIN` against UI redressing/clickjacking (or verifies CSP `frame-ancestors`).
5. **`Referrer-Policy`**: Flags `unsafe-url` leaks; recommends `strict-origin-when-cross-origin`.
6. **`Permissions-Policy`**: Restricts browser APIs (camera, microphone, geolocation, payment).
7. **`Cross-Origin-Opener-Policy` (COOP)**: Document-level process isolation against side-channel leaks.
8. **`Cross-Origin-Resource-Policy` (CORP)**: Protects resources from cross-origin no-cors inclusion.
9. **`Cross-Origin-Embedder-Policy` (COEP)**: Enforces explicit resource loading permissions.

### C. Cookie Security Attributes (20%)
- **Privacy Assurance**: Actual cookie values are **never stored or displayed**; only the cookie name and attribute flags are evaluated.
- Audits `Secure` flag on HTTPS connections.
- Audits `HttpOnly` flag on authentication/session cookies to mitigate client-side XSS theft.
- Audits `SameSite` attribute (`Strict`, `Lax`, `None`). Flags `SameSite=None` without `Secure`.

### D. Mixed Content Detection (15%)
- Non-intrusive HTML inspection (bounded to 1MB; does NOT execute JavaScript).
- **Active Mixed Content** (High severity): `<script src="http://...">`, `<link rel="stylesheet" href="http://...">`, `<iframe src="http://...">`, `<form action="http://...">`.
- **Passive Mixed Content** (Low severity): Insecure images, audio, or video tags over HTTP.

### E. Server Information Exposure (5%)
- Checks `Server` headers for exact software versions (e.g. `Apache/2.4.41`, `nginx/1.18.0`).
- Checks `X-Powered-By`, `X-AspNet-Version`, and framework banners.

### F. Public Security Configuration Files (10%)
- **`/.well-known/security.txt`**: Checks for RFC 9116 vulnerability disclosure policy and contact endpoints.
- **`/robots.txt`**: Explains that robots.txt is a crawler instruction file, not an access boundary. Audits for sensitive path disclosure in `Disallow:` directives.
- **`/sitemap.xml`**: Checks public discovery indexing file.

---

## 4. Scoring Methodology & Labels

| Score Range | Security Configuration Label | Operational Meaning |
| :---: | :--- | :--- |
| **90 – 100** | **Strong Configuration** | Strict transport security, modern defensive headers, hardened cookies, no mixed content. |
| **75 – 89** | **Good Configuration** | HTTPS enforced with reasonable headers; minor hardening recommendations identified. |
| **50 – 74** | **Needs Improvement** | Lacks essential defenses (e.g. missing HSTS/CSP, missing cookie flags). |
| **25 – 49** | **Weak Configuration** | Significant weaknesses (e.g. HTTP only, permissive CSP, session cookies without Secure). |
| **0 – 24** | **Poor Configuration** | Severe vulnerabilities (e.g. HTTPS downgrade redirect, active mixed content on critical paths). |

---

## 5. SSRF & Network Safety Guarantees

All outbound requests implement defense-in-depth SSRF protections:
- Scheme whitelist: Only `http://` and `https://` permitted.
- Hostname resolution: DNS is resolved before connection; private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), link-local (`169.254.0.0/16`), cloud metadata (`169.254.169.254`), and IPv6 (`::1`, `fc00::/7`) destinations are rejected with HTTP 400.
- Safe HTTP methods only: `GET` and `HEAD`.
- Timeouts: Strict connection and read bounds (<= 4.0s).
- Response body bounds: Truncated to 1MB to prevent resource exhaustion.
- No credential transmission: Never forwards authentication tokens or cookies to external targets.

---

## 6. API Endpoints

- **`POST /api/v1/analyze/security`**: Run a website security configuration assessment.
- **`GET /api/v1/security/{report_id}`**: Retrieve full security assessment report by ID.
- **`GET /api/v1/security/{report_id}/findings`**: Query findings with severity/category filters and pagination.

---

## 7. Automated Test Suite

All 30 test scenarios pass:
```bash
python -m pytest backend/tests/test_website_security.py -v
# 30 passed in 1.87s

python -m pytest backend/tests -q
# 119 passed across Modules 1, 2, 3, 4, and 5
```

