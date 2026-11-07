# Module 1 Specification: Intelligent URL and Website Analysis

## 1. Overview & Objective
Module 1 constitutes the foundational cybersecurity detection tier of the platform. Its primary objective is to accept any submitted URL or domain and conduct an automated, multi-vector investigation that gathers technical telemetry, checks for brand impersonation and homograph attacks, executes DNS record audits, performs safe redirect tracing, integrates external threat intelligence, and produces an explainable, evidence-backed security risk evaluation.

---

## 2. Technical Capabilities

### A. URL Validation & Canonical Normalization
- Enforces protocol whitelist: strictly allows `http://` and `https://`.
- Rejects non-web and dangerous schemes: `javascript:`, `file:`, `ftp:`, `data:`, `gopher:`, `ldap:`.
- Enforces RFC 1123 / RFC 952 hostname compliance: max length 253 characters, label max length 63 characters.
- Detects direct IP destination literals and immediately blocks private, loopback, link-local, and cloud-metadata addresses (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`).
- Canonical normalization: lowercases schemes and hosts, strips standard default ports (`:80`, `:443`), resolves relative path dot-segments (`/a/b/../c` -> `/a/c`), and cleans query strings.

### B. Domain & Linguistic Analysis
- Deconstructs hostname into subdomain, registered domain, and public suffix (TLD) using `tldextract`.
- Detects Punycode internationalized domains (`xn--...`), decodes them via IDNA, and checks for homoglyph substitution characters (e.g. Cyrillic lookalikes substituting Latin characters).
- Identifies excessive subdomain nesting (`> 3` levels) often employed to conceal real hosts on mobile devices.
- Audits domain length and unusual hyphen chaining patterns (multiple hyphens or consecutive `--`).
- Performs typosquatting similarity matching against high-value target brands (PayPal, Apple, Microsoft, Amazon, Netflix, Meta, Binance, MetaMask, Coinbase, Chase, FedEx, etc.) using Levenshtein distance and keyword containment, while whitelisting official verified brand domains.

### C. URL Pattern & Phishing Tokens
- Flags IP address used directly as web host.
- Detects URI `@` credential delimiter tricks (`http://trusted.com@phish.net`).
- Detects non-standard ports (e.g., 8080, 8443, 8888, 2082, 3389).
- Flags double percent-encoding (`%25`) and null-byte injection (`%00`).
- Detects credential-harvesting tokens in path and query (`login`, `verify`, `wallet`, `seed-phrase`, `restore-key`).
- Identifies dangerous executable and archive extensions in web paths (`.exe`, `.scr`, `.bat`, `.iso`).

### D. DNS Zone Audit (dnspython)
- Asynchronously queries authoritative `A`, `AAAA`, `MX`, `NS`, and `TXT` records.
- Handles `NXDOMAIN` (domain non-existent or dropped).
- Properly represents lookup failures or timeouts as `UNAVAILABLE` or `UNKNOWN`—never treating a network timeout as false evidence of malicious activity.

### E. Safe Redirect Chain Inspection
- Follows HTTP redirect chains hop-by-hop up to a maximum threshold (5 hops).
- Resolves each hop's destination IP before connection to enforce strict Server-Side Request Forgery (SSRF) and DNS rebinding protections.
- Detects cross-domain hops (e.g., shortener to phishing landing page).
- Disallows arbitrary file downloads and never executes clientside JavaScript.

### F. Threat Intelligence Provider Integration
- Modular interface powered by `VirusTotalProvider` (API v3).
- Gracefully handles missing API keys, returning `Threat intelligence lookup unavailable.` while continuing with local heuristic analysis.
- Extracts vendor engine detection statistics: malicious, suspicious, harmless, undetected counts.

### G. Evidence-Based Explainable Risk Engine
- Configurable weights with category saturation caps to avoid double-counting correlated findings.
- Calculates an explainable Risk Score (0-100) and an independent Evidence Confidence metric (0.0-1.0).
- Assigns definitive risk classifications:
  - `CONFIRMED_MALICIOUS`: Verified by authoritative threat intel, active SSRF block, or combined brand typosquatting + credential targeting.
  - `HIGH_RISK`: Score >= 50. Multiple significant indicators.
  - `SUSPICIOUS`: Score >= 25. One or more anomalous indicators.
  - `LOW_RISK`: Score < 25 with sufficient verified telemetry.
  - `INCONCLUSIVE`: Insufficient evidence to establish safety (e.g., DNS unreachable and intel unavailable).

### H. Grounded AI Explanation Layer
- Generates structured user summaries, bullet-point finding explanations, and practical safety recommendations.
- Prompt-injection safe: treats submitted URLs and external strings as untrusted data.
- Built-in deterministic fallback engine ensures continuous offline reliability.

