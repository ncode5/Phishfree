# PhishFree User Guide: Digital Trust & Cyber Threat Intelligence

Welcome to **PhishFree** — an AI-powered cybersecurity intelligence platform built to detect phishing websites, typosquatted brand portals, deceptive redirect loops, social engineering scams, and insecure web configurations.

---

## Table of Contents
1. [Platform Access & Navigation](#1-platform-access--navigation)
2. [User Accounts & Authentication](#2-user-accounts--authentication)
3. [Unified Threat Dashboard](#3-unified-threat-dashboard)
4. [How to Scan Websites & URLs](#4-how-to-scan-websites--urls)
5. [Understanding Threat Reports & Forensic Dossiers](#5-understanding-threat-reports--forensic-dossiers)
6. [Analyzing Suspicious Messages & Scams](#6-analyzing-suspicious-messages--scams)
7. [Running Website Security Posture Audits](#7-running-website-security-posture-audits)
8. [Decentralized Web3 Threat Registry](#8-decentralized-web3-threat-registry)
9. [Investigating Threat Correlation & Topology](#9-investigating-threat-correlation--topology)
10. [Browsing & Searching Scan History](#10-browsing--searching-scan-history)
11. [Best Practices for Analysts & Users](#11-best-practices-for-analysts--users)
12. [Frequently Asked Questions (FAQ)](#12-frequently-asked-questions-faq)

---

## 1. Platform Access & Navigation

### Access Endpoints
- **Live Production Application:** [https://phishfree-rust.vercel.app](https://phishfree-rust.vercel.app)
- **Live Backend API:** [https://phishfree-api.vercel.app](https://phishfree-api.vercel.app)
- **Interactive API Documentation:** [https://phishfree-api.vercel.app/docs](https://phishfree-api.vercel.app/docs)

### Adaptive Interface & Controls
- **Desktop (`>= 1024px`)**: The persistent left sidebar gives immediate access to all detection and audit tools.
- **Mobile & Tablet (`< 1024px`)**: Tap the **Menu (☰)** icon in the top header to reveal the slide-out navigation drawer. Tap anywhere on the backdrop or press **Escape** to close.
- **Dual-Mode Theme Toggle**: Located in the top header:
  - **Light Mode**: High-contrast blue corporate cybersecurity theme.
  - **Dim Mode**: Modern dark cybersecurity palette highlighted with high-visibility `#FFD000` accents.

---

## 2. User Accounts & Authentication

### Creating an Account (`/register`)
1. Click **Sign In** from the landing page and choose **Create Security Analyst Account**.
2. Enter your Full Name, Email, Organization, and choose a strong password (minimum 8 characters with numbers and symbols).
3. Select your operational role (**Security Analyst**, **Security Administrator**, or **Incident Responder**).
4. Review the security disclosures and submit to initialize your workspace.

### Signing In (`/login`)
- Enter your credentials or use the pre-configured sandbox analyst credentials:
  - **Email:** `analyst@phishfree.io`
  - **Password:** `PhishFree2026!`
- PhishFree secures authentication using **Argon2id password hashing** and stateless, cryptographic **JWT session tokens**.

### Password Reset Flow (`/forgot-password`)
- If you lose access, request a cryptographic recovery token. Recovery tokens are single-use, strictly rate-limited, and expire within 60 minutes.

---

## 3. Unified Threat Dashboard

The Dashboard (`/`) is your operational cockpit:
1. **Executive Metrics Bar**:
   - **Threats Blocked**: Cumulative tally of intercepted phishing destinations.
   - **Active Campaigns**: Clustered brand impersonation attacks detected across monitored zones.
   - **Monitored Domains**: Assets actively tracked for typosquatting.
   - **Detection Accuracy**: Real-time cross-engine consensus accuracy.
2. **Fast-Action Scanner**: Paste any destination URL directly into the hero input bar to trigger instant pipeline analysis.
3. **Interactive Threat Distribution**:
   - Explore the donut chart breaking down threats across Credential Harvesting, Brand Impersonation, Malware Delivery, and Financial Fraud.
   - Hover over individual slices to isolate threat telemetry.
4. **Recent Security Investigations**:
   - Click on any indicator in the table to slide out an **Incident Snapshot Drawer** showing risk scores, DNS hosts, and fast-pivot actions.

---

## 4. How to Scan Websites & URLs

Navigate to **Scanner** in the navigation menu (`/scanner`):

### Step-by-Step Scan Instructions
1. **Input Destination**: Enter any bare domain (e.g. `login-update-paypal.com`) or full URL (e.g. `http://paypa1-security-update.com/login`).
   - *Protocol note:* If you omit the scheme, `http://` is applied by default. Only safe web schemes (`http` and `https`) are permitted; dangerous schemes (`javascript:`, `file:`, `ftp:`) are rejected immediately.
2. **Execute Scan**: Click **Execute In-Depth Security Assessment**.
3. **Watch the 6-Stage Real-Time Pipeline**:
   - `Stage 1: Validation & Normalization` — Strips credentials, sanitizes ports, validates RFC compliance.
   - `Stage 2: Domain & Typosquatting Profiling` — Measures Levenshtein edit distance against global protected brands (PayPal, Microsoft, Apple, Google, Binance, etc.) and flags Punycode homoglyphs (`xn--...`).
   - `Stage 3: DNS Zone Resolution` — Queries A, AAAA, MX, NS, and TXT records to discover hosting infrastructure.
   - `Stage 4: Safe Redirect Hop Tracing` — Follows multi-hop redirects while enforcing strict Server-Side Request Forgery (SSRF) guards against private IPs (`10.0.0.0/8`, `192.168.0.0/16`, `127.0.0.1`, cloud metadata).
   - `Stage 5: External Threat Intelligence` — Corroborates data across external threat intelligence providers (VirusTotal API v3).
   - `Stage 6: Risk Calculation & AI Explanation` — Synthesizes technical evidence into a numerical score (0–100) and plain-English narrative.

### Using Demonstration Benchmark Targets
Click any of the curated test scenario pills below the scanner input:
- **Benign Official Site**: `https://github.com` (Verifies authentic DNS and valid TLS).
- **Brand Typosquatting**: `http://paypa1-security-update.com/login` (Flags character substitution `1` for `l`).
- **Punycode Homoglyph**: `http://xn--pple-43d.com/support` (Demonstrates cyrillic/unicode spoofing).
- **IP as Hostname**: `http://198.51.100.4/verify-wallet` (Flags suspicious raw IP hostnames).
- **SSRF Attack (Blocked)**: `http://127.0.0.1:8080/internal` (Demonstrates loopback interception).
- **Credential @ Trick**: `http://google.com@evil-phishing.org/login` (Detects deceptive authority delimiters).

---

## 5. Understanding Threat Reports & Forensic Dossiers

Upon completing a scan, PhishFree directs you to the detailed **Forensic Report Dossier** (`/reports/:id`):

### Reading the Risk Score
- **0 – 24 (SAFE)**: Verified benign destination. Authentic infrastructure, valid TLS certificate, zero brand spoofing.
- **25 – 49 (SUSPICIOUS)**: Anomalous configuration detected (e.g. newly registered domain, multiple redirect hops, or self-signed TLS). Proceed with caution.
- **50 – 74 (MALICIOUS)**: High probability of phishing or credential theft. Typosquatting detected or flagged by threat intelligence engines.
- **75 – 100 (CRITICAL)**: Confirmed active cyber threat, homoglyph attack, or verified malware portal. Do not visit.

### Forensic Tabs Breakdown
1. **Overview**: Executive synthesis with plain-English AI explanations, immediate user safety guidance, and one-click report sharing.
2. **Brand & Typosquatting**: Displays visual character diffs, target brand identification, and Punycode decoded strings.
3. **DNS Infrastructure**: Complete audit of A, AAAA, MX (mail exchange), NS (nameservers), and TXT records with IP geolocation.
4. **Redirect Hop Chain**: Visual timeline tracking every HTTP status code (`301`, `302`, `307`, `308`), latency, and destination hop.
5. **TLS / Digital Trust**:
   - Certificate validity and expiration status.
   - Hostname Subject Alternative Names (SAN) matching.
   - Public Certificate Transparency (CT) log query counts and distinct CA issuers via `crt.sh`.
6. **Threat Intel Feeds**: Multi-engine antivirus and reputation breakdown.
7. **Raw JSON Telemetry**: Exportable, machine-readable cryptographic payload for SIEM and SOAR integrations.

---

## 6. Analyzing Suspicious Messages & Scams

PhishFree includes a specialized NLP scam heuristic analyzer (`/scam-analyzer`) designed for SMS (Smishing), phishing emails, WhatsApp messages, and fake invoice scams:

1. **Paste Message Content**: Paste the raw text of any suspicious message.
2. **Privacy Assurance**: PhishFree automatically masks sensitive PII (credit cards, passwords, one-time passwords) before analysis.
3. **Review Extracted Intelligence**:
   - **Extracted Links**: One-click pivot to scan embedded links with the URL Scanner.
   - **Extracted Identifiers**: Phone numbers, sender emails, and cryptocurrency wallet addresses (BTC, ETH, SOL).
   - **Urgency & Coercion Flags**: Heuristics detecting artificial urgency ("Account suspended in 24 hours"), financial lures ("Crypto giveaway", "Inheritance claim"), or fake package delivery issues.
4. **AI-Synthesized Safety Plan**: Receive clear recommendations explaining what the sender is attempting to extract and whether to block, report, or delete the message.

---

## 7. Running Website Security Posture Audits

Access **Website Security** (`/security`) to perform passive, non-intrusive security configuration audits:

### Scope of the Audit
- **Defensive HTTP Headers Matrix**: Evaluates 9 security headers:
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options` (Clickjacking defense)
  - `X-Content-Type-Options` (MIME sniffing prevention)
  - `Referrer-Policy` (Data leakage control)
  - `Permissions-Policy` (Browser feature isolation)
  - `Cross-Origin-Opener-Policy` (COOP)
  - `Cross-Origin-Resource-Policy` (CORP)
  - `Cross-Origin-Embedder-Policy` (COEP)
- **Cookie Security Flags**: Audits `Secure`, `HttpOnly`, and `SameSite` configurations without saving raw session tokens.
- **Mixed Content**: Scans for insecure HTTP scripts, stylesheets, or images loaded inside HTTPS pages.
- **Server Information Leakage**: Flags unnecessary version disclosure in `Server`, `X-Powered-By`, or `X-AspNet-Version` headers.
- **Well-Known Files**: Checks for RFC 9116 compliant `/.well-known/security.txt` and `/robots.txt`.

> **Important Educational Boundary:** A website with a high security configuration score can still host malicious phishing content, and an authentic site with missing headers is not necessarily a scam. PhishFree clearly highlights this distinction.

---

## 8. Decentralized Web3 Threat Registry

PhishFree integrates with the **Ethereum Sepolia Testnet** (`/blockchain`) to provide tamper-evident cryptographic provenance:

### How It Works
1. **Deterministic Canonicalization**: The analysis report is normalized into a standard canonical JSON format (sorted keys, normalized floats, UTC ISO timestamps).
2. **Keccak-256 Fingerprinting**: Generates a 32-byte hash (e.g. `0x8b2e...a91c`) representing the immutable state of the report.
3. **Smart Contract Registration**:
   - The hash is anchored on the `ThreatReportRegistry.sol` smart contract on Ethereum Sepolia.
   - Produces an immutable, public transaction receipt verifiable on Etherscan.
4. **Independent Tamper Verification**:
   - Paste any report hash to verify its integrity.
   - The contract returns `VERIFIED` (hash matches on-chain timestamped record) or `TAMPERED` (report data was altered after registration).

---

## 9. Investigating Threat Correlation & Topology

Navigate to **Threat Intelligence** (`/threat-intel`) to explore cross-vector campaign relationships:

1. **Topology Graph**:
   - Interactive SVG map connecting associated **URLs (Cyan)**, **Root Domains (Blue)**, **Hosting IPs (Purple)**, **TLS Certificates (Green)**, and **Message Lures (Amber)**.
2. **Campaign Correlation Engine**:
   - Uncovers shared infrastructure: multiple phishing domains sharing the same nameserver, bulletproof hosting IP, or TLS serial number.
3. **Correlated Risk Score**: Combines cross-indicator signals into a unified campaign threat rating.

---

## 10. Browsing & Searching Scan History

Navigate to **History** (`/history`) to manage past investigations:
- **Search Bar**: Query by domain, destination path, or specific keywords.
- **Filter by Risk Level**: Filter for `CRITICAL`, `MALICIOUS`, `SUSPICIOUS`, or `SAFE` incidents.
- **Export Data**: Review timestamped entries and re-open full forensic dossiers at any time.

---

## 11. Best Practices for Analysts & Users

1. **Never Click Unverified Links**: Always copy and paste the link into PhishFree before navigating to it in your personal browser.
2. **Do Not Trust the HTTPS Padlock Alone**: Modern phishing attackers frequently acquire free automated Let's Encrypt or Cloudflare TLS certificates. A green padlock only proves connection encryption, not organizational legitimacy.
3. **Inspect Typosquatting Details**: Examine the exact domain name character-by-character. Look for digit-for-letter substitutions (`0` for `O`, `1` for `l`, `vv` for `w`) or strange top-level domains (`.top`, `.xyz`, `.cm`).
4. **Anchor High-Consequence Incident Reports**: When preparing evidence for incident response, regulatory compliance, or legal disputes, anchor the report hash to the Sepolia Blockchain Registry for cryptographic non-repudiation.
5. **Implement Remediation Directives**: When auditing your own web infrastructure on `/security`, use the copy-paste remediation directives to implement missing headers like CSP and HSTS.

---

## 12. Frequently Asked Questions (FAQ)

**Q: Does PhishFree download or execute malware when scanning a URL?**  
**A:** No. PhishFree performs purely passive, safe telemetry collection. It inspects DNS zones, analyzes HTTP response headers, decodes certificates, and queries public threat feeds. It never renders untrusted client-side JavaScript or downloads malicious executable payloads.

**Q: Can I scan internal network URLs or localhost?**  
**A:** No. PhishFree enforces strict defense-in-depth against Server-Side Request Forgery (SSRF). Requests to `127.0.0.1`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`, `169.254.169.254`, or private IPv6 addresses are blocked before any network socket is opened.

**Q: Do I need real cryptocurrency to use the Blockchain Registry?**  
**A:** No. PhishFree operates on the **Ethereum Sepolia Testnet** using testnet ETH (which has no real monetary value). The system can run in simulated demonstration mode or connect to a Sepolia RPC node.

**Q: What credentials can I use to test the platform right now?**  
**A:** You can sign in with:  
- **Email:** `analyst@phishfree.io`  
- **Password:** `PhishFree2026!`  
Or create your own analyst account on the registration page.

