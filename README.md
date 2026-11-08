# AI-Powered Web Threat Detection & Digital Trust Intelligence

[![Modules 1 to 6: Verified](https://img.shields.io/badge/Modules%201%20to%206-Operational%20%26%20Verified-emerald?style=for-the-badge&logo=shield)](https://github.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Vercel Serverless Ready](https://img.shields.io/badge/Vercel-Serverless%20Deployed-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Ethereum Sepolia](https://img.shields.io/badge/Ethereum-Sepolia%20Testnet-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io)
[![Tests: 137 Passing](https://img.shields.io/badge/Pytest-137%20Passed-brightgreen?style=for-the-badge&logo=pytest)](https://docs.pytest.org)

> **Hackathon Submission**: 48-Hour Build  
> **Domains**: Artificial Intelligence · Cybersecurity · Web3  
> **Deployment Target**: Vercel Serverless Platform + Hosted PostgreSQL (Neon / Supabase)

---

## 1. Project Title
**AI-Powered Web Threat Detection & Digital Trust Intelligence**

---

## 2. Problem Statement
The modern internet powers global banking, commerce, digital identity, recruitment, and communication. However, individuals and enterprises face unprecedented levels of digital deception:
- **Phishing & Deceptive Portals**: Attackers register typosquatted domains, leverage lookalike homoglyphs (Punycode), and chain multi-hop cross-domain redirects to mimic legitimate banking and corporate platforms.
- **The "HTTPS Padlock" Fallacy**: Users frequently assume that any website with an active green padlock is authentic and safe. Threat actors routinely obtain legitimate, automated TLS certificates for fraudulent websites to bypass basic security warnings.
- **Credential Harvesting**: Sophisticated landing pages harvest passwords, two-factor authentication tokens, and Web3 seed phrases.
- **Opaque Traditional Scanners**: Conventional security tools often yield opaque binary decisions (`SAFE` vs `MALICIOUS`), leaving non-technical users uninformed and vulnerable to false senses of security.
- **Trust Infrastructure Vulnerabilities**: Weak cryptographic trust chains, self-signed certificates, expired credentials, and unverified redirect destinations undermine the fundamental security assumptions of web browsing.

---

## 3. Proposed Solution
**TrustIntel** is an intelligent, evidence-grounded digital security platform. Rather than returning a simplistic binary verdict, TrustIntel executes a multi-layered forensic investigation:
1. **Audits Technical Telemetry**: Gathers real-time DNS zone records, traces HTTP redirect hops, and profiles domain linguistics.
2. **Detects Deceptive Patterns**: Discovers brand typosquatting, Punycode homographs, excessive subdomains, and credential targeting tokens.
3. **Module 2: TLS Certificate & Digital Trust Engine**: Inspects HTTPS availability, X.509 certificate metadata, UTC-accurate validity, Subject Alternative Name (SAN) wildcard matching, trust chain provenance, cryptographic cipher strength, and historical public Certificate Transparency (CT) logs via `crt.sh`.
4. **Guards Against SSRF**: Protects internal infrastructure by blocking private, loopback, and cloud metadata destinations.
5. **Calculates Explainable Risk**: Uses a weighted, transparent scoring engine with category saturation caps and independent confidence scoring.
6. **Synthesizes Plain-Language Guidance**: An AI explanation layer converts technical findings into human-readable summaries and practical safety recommendations.
7. **Web3 Decentralized Registry**: Anchors deterministic SHA-256 report commitments on the Ethereum Sepolia Testnet for immutable, tamper-evident audit trails.
8. **Module 5: Website Security Assessment**: Evaluates publicly observable website security posture across 6 key dimensions: HTTPS transport enforcement & downgrade prevention, 9 standard HTTP defensive security headers (HSTS, CSP, X-Frame-Options, etc.), cookie security flags (`Secure`, `HttpOnly`, `SameSite`), mixed active/passive content detection, basic server software information exposure, and well-known configuration files (`security.txt`, `robots.txt`). Maintains a clear educational distinction: a site with a high security configuration score can still be a malicious phishing lure, and a poorly configured site is not necessarily fraudulent.
9. **Module 6: Decentralized Threat Intelligence (Web3 Registry)**: Provides cryptographic report integrity, timestamped proof of existence, and independent tamper verification using Ethereum Sepolia Testnet. Employs deterministic JSON canonicalization, computes 32-byte Ethereum Keccak-256 digests, broadcasts on-chain registrations to the `ThreatReportRegistry.sol` smart contract, and provides an independent verification tool detecting post-registration alterations (`VERIFIED` vs `TAMPERED`). Strictly preserves the educational boundary: blockchain guarantees report integrity and provenance, not that a website was inherently malicious.

---

## 4. Current Implementation Scope

### Module 1: Intelligent URL and Website Analysis
- URL validation, normalization, and canonical scheme enforcement (`http`/`https`).
- Domain extraction, Punycode detection (`xn--...`), and homoglyph substitution flags.
- Levenshtein brand typosquatting detection against major brands (PayPal, Apple, Microsoft, Amazon, Netflix, Meta, Binance, MetaMask, Chase, etc.).
- Suspicious URL patterns: IP-in-host, `@` credentials delimiter, double URL encoding, dangerous file extensions.
- Asynchronous DNS zone queries (`A`, `AAAA`, `MX`, `NS`, `TXT`) using `dnspython`.
- Safe multi-hop redirect tracing with pre-flight SSRF IP validation.
- Pluggable threat intelligence (VirusTotal API v3) with graceful fallback.

### Module 2: TLS Certificate & Digital Trust Analysis
- Comprehensive HTTPS connection probe on port 443 with serverless-optimized timeouts (<= 3.5s).
- Dual handshake mechanism: strict verified handshake with unverified inspection fallback for self-signed or broken chains.
- X.509 metadata extraction via `cryptography.x509` (Subject, Issuer, Serial Number, Signature Algorithm, Public Key specs).
- UTC-aware expiration analysis (`VALID`, `EXPIRED`, `EXPIRING_SOON`, `NOT_YET_VALID`).
- RFC 6125 SAN and Common Name wildcard domain matching. Hostname mismatches are explicitly flagged.
- Cryptographic configuration audit (TLS 1.3/1.2 vs deprecated TLS 1.0/1.1; RSA 2048+ bit vs weak keys; SHA-256 vs SHA-1/MD5).
- Certificate Transparency (CT) public audit queries via `crt.sh` retrieving historical issuance counts and distinct CAs.

### Module 3: AI-Powered Scam & Message Analysis
- Intelligent analysis of suspicious SMS, emails, WhatsApp alerts, job offers, parcel alerts, lottery claims, and investment pitches.
- Sensitive PII redaction (passwords, OTPs, PINs, card numbers) ensuring privacy and preventing plaintext database leaks.
- Adversarial prompt injection defense protecting system guidelines and preventing score manipulation.
- High-precision entity extraction for URLs, domains, emails, international phone numbers, Bitcoin/Ethereum/Solana wallets, and UPI handles.
- Automated cross-module corroboration routing extracted links through Module 1 URL analysis and Module 2 TLS analysis.
- Multi-intent heuristic pattern engine detecting artificial urgency, credential theft traps, fake job propositions, and financial lures.
- Grounded AI threat explanations with deterministic rule engine fallbacks and clear actionable user recommendations.

### Module 4: Intelligent Threat Correlation
- Cross-module relationship extraction linking URLs, root domains, DNS IP hosting infrastructure, TLS certificates, CA authorities, and scam message lures.
- RFC-compliant indicator normalization (domains, URLs, IPs, X.509 fingerprints, E.164 phone numbers, emails).
- Relational threat graph modeling without heavyweight graph databases or message brokers.
- Explainable pattern detection evaluating 8 multi-engine campaign rules and CDN false-positive guards.
- Correlated risk engine with de-duplication, asymptotic bounds, and strict evidence transparency (verified vs technical vs rule-based vs AI).
- Interactive SVG threat topology network visualization with dynamic 2-hop neighborhood expansion and real-time node inspection.

### Module 5: Website Security Assessment
- Passive, non-intrusive security configuration evaluation (zero intrusive penetration testing, zero payload injection, zero brute-forcing).
- Strict SSRF defense-in-depth prohibiting loopback (`127.0.0.0/8`), private (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local/cloud metadata (`169.254.169.254`), and IPv6 (`::1`).
- HTTPS enforcement and transport security audit: checks HTTP-to-HTTPS redirect upgrades, downgrade vulnerability, modern TLS protocol/cipher compliance, and certificate validity.
- 9 HTTP defensive security headers inspection: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Cross-Origin-Embedder-Policy`.
- Privacy-preserving cookie security audit: strict redaction of raw cookie values/tokens; evaluation of `Secure`, `HttpOnly`, `SameSite` flags and `__Secure-` / `__Host-` prefixes.
- Safe mixed content analysis: parsing HTML (capped at 1MB) for active mixed resources (scripts, stylesheets, iframes, object/embed, insecure form action targets) and passive media with zero client-side script execution.
- Information exposure analysis: flags banner leakage in `Server`, `X-Powered-By`, and `X-AspNet-Version` headers.
- Safe public security files probe: checks `/.well-known/security.txt` compliance (RFC 9116) and `/robots.txt` indexing directives.
- Weighted scoring model (HTTPS 25%, Headers 25%, Cookies 20%, Mixed Content 15%, Information Exposure 5%, Configuration Files 10%) producing intuitive labels (Strong, Good, Needs Improvement, Weak, Poor), assessment coverage metrics, and copyable remediation recommendations.

### Module 6: Decentralized Threat Intelligence using Blockchain
- **Deterministic Canonicalization**: Sorts keys lexicographically, standardizes ISO 8601 UTC timestamps, normalizes floating-point scores to 2 decimal places, and strips transient UI/transaction fields.
- **Ethereum Keccak-256 Fingerprinting**: Generates 32-byte (66 hex characters) cryptographic digests compatible with EVM `keccak256()` and Solidity `bytes32`.
- **ThreatReportRegistry Smart Contract**: Written in Solidity `^0.8.20`, deployed on Ethereum Sepolia Testnet (Chain ID `11155111`) / Localhost (Chain ID `31337`). Supports `registerReport(bytes32)` with zero-hash rejection and duplicate registration guards.
- **Independent Tamper Verification**: Evaluates stored reports against on-chain fingerprints, returning unambiguous states: `VERIFIED`, `TAMPERED`, `NOT_REGISTERED`, `PENDING`, or `UNAVAILABLE`.
- **Safe Transaction Management**: Enforces pre-flight wallet balance checks (requiring Sepolia testnet ETH from faucets), dynamic gas estimation, nonce tracking, and receipt confirmation.
- **Database Persistence**: Persists on-chain transaction metadata, block numbers, submitter addresses, and canonical payloads in `blockchain_report_registrations` without storing private keys or credentials.
- **Interactive Web3 Console**: Dedicated React interface (`/blockchain`) providing real-time JSON-RPC node status, Etherscan explorer links, stepper registration progress, and live smart contract event feeds.

---

## 5. Technology Stack

| Layer | Technology | Selection Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Lightning-fast development server, optimized ESM bundling, and reactive state management. |
| **Language** | TypeScript | Strong typing guarantees contract synchronization with backend Pydantic models. |
| **Styling** | Tailwind CSS | Rapid construction of a dark-mode, high-contrast cybersecurity SaaS interface. |
| **Data Visualization** | Recharts | Composable SVG-based chart library for rendering risk distribution donuts and metric breakdowns. |
| **Backend Framework** | FastAPI | Asynchronous performance, native OpenAPI documentation, and automated request validation. |
| **Data Validation** | Pydantic v2 | High-throughput data serialization, strict schemas, and type enforcement. |
| **Cryptography & TLS** | Cryptography + Python `ssl` | Direct X.509 DER byte extraction, SAN parsing, key size inspection, and UTC timestamp handling. |
| **Domain Analysis** | tldextract | Accurate extraction of registered domains and subdomains against the Public Suffix List. |
| **DNS Resolution** | dnspython | Robust DNS zone queries with granular record-type isolation and timeout management. |
| **HTTP Client** | HTTPX | Asynchronous HTTP client providing manual hop-by-hop redirect control and timeout bounds. |
| **Database & ORM** | SQLAlchemy 2.0 + Hosted PostgreSQL | Neon / Supabase compatibility with `NullPool` serverless connection pooling. |
| **Blockchain & Smart Contracts** | Solidity 0.8.20 + Hardhat + Web3.py | `ThreatReportRegistry.sol` deployed on Ethereum Sepolia Testnet with Keccak-256 fingerprinting and tamper verification. |
| **Testing** | Pytest + pytest-asyncio + Hardhat Chai | 137 backend automated tests + 13 smart contract tests (150 tests total, 100% passing across all 6 modules). |

---

## 6. Project Folder Structure

```
digital-trust-intelligence/
├── api/
│   └── index.py                 # Root Vercel Serverless Function entrypoint
├── blockchain/
│   ├── contracts/
│   │   └── ThreatReportRegistry.sol # Module 6 Solidity smart contract (^0.8.20)
│   ├── scripts/
│   │   └── deploy.js            # Deployment script for Localhost / Sepolia
│   ├── test/
│   │   └── ThreatReportRegistry.test.js # 13 Hardhat smart contract tests
│   ├── hardhat.config.js        # Hardhat configuration (Solidity 0.8.20, Sepolia)
│   ├── package.json             # Hardhat & ethers dependencies
│   └── README.md                # Smart contract testing & deployment guide
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/          # RiskBadge, ScoreGauge, Navbar, Footer
│   │   ├── pages/               # DashboardPage, ScannerPage, ReportPage, HistoryPage, AboutPage
│   │   ├── layouts/             # MainLayout
│   │   ├── services/            # api.ts (Axios client with dynamic Vercel API routing)
│   │   ├── types/               # TypeScript interfaces (Module 1, Module 2 TLS, Web3)
│   │   ├── App.tsx              # Router setup
│   │   ├── main.tsx             # Application entrypoint
│   │   ├── vite-env.d.ts        # Vite client type definitions
│   │   └── index.css            # Tailwind directives
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vercel.json              # Isolated frontend Vercel deploy configuration
│   ├── .env.example
│   └── README.md
│
├── backend/
│   ├── api/
│   │   └── index.py             # Backend directory Vercel entrypoint
│   ├── app/
│   │   ├── main.py              # FastAPI startup, CORS regex, lifespan
│   │   ├── api/                 # Endpoints (/analyze/url, /analyze/tls, /reports, /blockchain/*)
│   │   ├── core/                # config.py (Pydantic settings, serverless timeouts)
│   │   ├── analyzers/
│   │   │   ├── url_validator.py       # Normalization, RFC validation, SSRF checks
│   │   │   ├── domain_analyzer.py     # Punycode, homoglyphs, brand typosquatting
│   │   │   ├── dns_analyzer.py        # dnspython zone record queries
│   │   │   ├── redirect_analyzer.py   # Safe redirect tracer & SSRF guard
│   │   │   └── url_pattern_analyzer.py# Obfuscation, IP hosts, phishing tokens
│   │   ├── intelligence/
│   │   │   ├── base.py                # Abstract ThreatIntelProvider
│   │   │   └── virustotal.py          # VirusTotal API v3 integration
│   │   ├── services/
│   │   │   ├── analysis_service.py              # Master pipeline orchestrator (Module 1 + Module 2)
│   │   │   ├── tls_analyzer.py                  # Module 2 TLS & digital trust engine
│   │   │   ├── message_analyzer.py              # Module 3 AI scam & message analysis engine
│   │   │   ├── threat_correlation.py            # Module 4 Threat correlation engine
│   │   │   ├── indicator_normalizer.py          # Module 4 Indicator normalization service
│   │   │   ├── relationship_builder.py          # Module 4 Graph relationship builder
│   │   │   ├── threat_pattern_detector.py       # Module 4 Campaign pattern detector
│   │   │   ├── correlation_risk_engine.py       # Module 4 Non-linear correlation risk engine
│   │   │   ├── website_security_assessment.py   # Module 5 Master security assessment orchestrator
│   │   │   ├── security_headers_analyzer.py     # Module 5 9-header defensive evaluator
│   │   │   ├── cookie_security_analyzer.py      # Module 5 Cookie privacy-safe flag auditor
│   │   │   ├── mixed_content_analyzer.py        # Module 5 Safe HTML mixed content parser
│   │   │   ├── security_configuration_analyzer.py # Module 5 Information exposure & security.txt
│   │   │   ├── report_canonicalizer.py          # Module 6 Deterministic report canonicalization
│   │   │   ├── report_hash_service.py           # Module 6 Ethereum Keccak-256 fingerprint service
│   │   │   ├── blockchain_service.py            # Module 6 Web3 JSON-RPC & transaction manager
│   │   │   └── report_verification_service.py   # Module 6 Independent tamper-verification service
│   │   ├── web3/
│   │   │   ├── contract_abi.py                  # Module 6 Compiled contract ABI loader
│   │   │   ├── ThreatReportRegistry_ABI.json    # Module 6 Smart contract JSON ABI
│   │   │   └── sepolia.py                       # Ethereum Sepolia Testnet compatibility service
│   │   ├── ai/
│   │   │   └── explanation.py         # AI explanation + deterministic fallback
│   │   ├── risk_engine/
│   │   │   └── scoring.py             # Configurable weights, caps, confidence
│   │   └── database/
│   │       ├── connection.py          # SQLAlchemy engine with NullPool serverless detection
│   │       ├── models.py              # AnalysisReport, Finding, ThreatIndicator
│   │       └── schemas.py             # Pydantic request/response models
│   ├── tests/                         # Pytest suite (45 passing tests)
│   │   ├── test_tls_analyzer.py       # 14 Module 2 TLS test scenarios
│   │   ├── test_api.py                # Endpoints & report persistence tests
│   │   └── ...                        # Domain, pattern, validator, redirect tests
│   ├── requirements.txt
│   ├── vercel.json              # Isolated backend Vercel deploy configuration
│   ├── .env.example
│   └── README.md
│
├── docs/
│   ├── architecture.md          # Architectural whitepaper, serverless pooling, data flow
│   ├── api-documentation.md     # Complete REST API reference (Modules 1 & 2 + Web3)
│   ├── module-1.md              # Detailed Module 1 technical specifications
│   └── module-2-tls-analysis.md # Detailed Module 2 TLS analysis technical whitepaper
│
├── vercel.json                  # Root unified Vercel deployment configuration
├── requirements.txt             # Root requirements for Vercel Python runtime
├── .gitignore                   # Ignores .vercel, .env, __pycache__, dist
└── README.md
```

---

## 7. Vercel Deployment Instructions

The repository is configured for modern serverless deployment on **Vercel** with zero Docker containers.

### Method A: Unified Monorepo Deployment (Recommended)
The root `vercel.json` automatically orchestrates the frontend build and the Python serverless API functions:

1. **Push your code to GitHub / GitLab**.
2. **Import the repository into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select your repository.
   - Leave the Framework Preset as **Vite** or **Other**.
   - Root Directory: `./` (leave default).
3. **Configure Environment Variables** in the Vercel Project Settings:
   - `DATABASE_URL`: Your hosted PostgreSQL connection URI (from Neon or Supabase).
   - `VIRUSTOTAL_API_KEY`: *(Optional)* Your VirusTotal API v3 key.
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
   - `BLOCKCHAIN_RPC_URL`: `https://ethereum-sepolia-rpc.publicnode.com` (or Infura/Alchemy endpoint).
   - `PRIVATE_KEY`: *(Optional)* Sepolia wallet private key for on-chain transaction publishing.
   - `CONTRACT_ADDRESS`: *(Optional)* Threat registry contract address.
   - `VITE_API_BASE_URL`: Leave blank or set to `/api/v1` (the frontend automatically detects production Vercel domains and routes to `/api/v1`).
4. **Deploy**:
   - Click **Deploy**. Vercel will build the React frontend with Vite, package `api/index.py` as a Python Serverless Function, and provision CDN endpoints with SPA rewrites.

### Method B: Separate Frontend and Backend Deployments
If you prefer independent deployment projects:
- **Backend Project**:
  - In Vercel, create a new project and set the Root Directory to `backend`.
  - Add backend environment variables (`DATABASE_URL`, `VIRUSTOTAL_API_KEY`, etc.).
  - Note the generated backend URL: `https://your-backend.vercel.app`.
- **Frontend Project**:
  - In Vercel, create a second project and set the Root Directory to `frontend`.
  - Add environment variable `VITE_API_BASE_URL=https://your-backend.vercel.app/api/v1`.
  - The backend CORS configuration automatically allows any `*.vercel.app` domain.

---

## 8. Hosted PostgreSQL Setup (Neon / Supabase)

The backend natively supports hosted PostgreSQL platforms suitable for serverless execution:

1. **Create a Database**:
   - Sign up at [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com).
   - Create a new project and obtain the connection URI string.
2. **Connection Pooling Configuration**:
   - In serverless runtimes, each function invocation can create a new database connection.
   - Our `connection.py` automatically detects hosted connection strings (`neon.tech`, `supabase.co`, or `pooler`) or the `VERCEL=1` environment variable and configures SQLAlchemy's `NullPool`.
   - `NullPool` ensures connections are closed immediately upon request completion, preventing database connection exhaustion.
   - For Neon, use the **Pooled connection string** (e.g., `postgresql://user:pass@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require`).
   - For Supabase, use the **Transaction Pooler** connection string (port 6543).

---

## 9. Environment Variables Reference

### Backend (`backend/.env` or Vercel Environment Variables)
```env
# Hosted PostgreSQL Connection URI (Neon / Supabase)
DATABASE_URL=postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require

# External Threat Intelligence
VIRUSTOTAL_API_KEY=your_virustotal_api_key_here

# AI Explanation Engine
GEMINI_API_KEY=your_gemini_api_key_here

# Web3 / Blockchain Integration (Sepolia Testnet)
BLOCKCHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_sepolia_private_key_here
CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# CORS Allowed Origins (Comma-separated)
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://*.vercel.app
```

### Frontend (`frontend/.env` or Vercel Environment Variables)
```env
# Public backend API URL (Leave empty on unified Vercel deploys to use relative /api/v1)
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

> **Security Note**: Never prefix backend private keys, database credentials, or secret API keys with `VITE_`. Vite strictly exposes variables prefixed with `VITE_` to client-side browser bundles.

---

## 10. Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# Activate virtual environment:
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run FastAPI with live reload:
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs are available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env

# Start Vite development server:
npm run dev
```
The dashboard interface will open at `http://localhost:5173`.

---

## 11. Testing & Verification

### Run Automated Test Suites (150 Total Tests)
The comprehensive test suite covers all requirements across Module 1, Module 2, and Module 3:
```bash
python -m pytest backend/tests/ -v
```

**Smart Contract Tests (13 Tests, 100% Passing):**
```bash
cd blockchain
npx hardhat test
```
- `ThreatReportRegistry.test.js` (13 tests): Initial 0 count & owner verification, successful report registration, zero hash bytes32(0) rejection, duplicate registration revert, successful on-chain verification getter, unknown hash return values, accurate block timestamp recording, submitter address recording, ReportRegistered event emission, getReportDetails validation, reverse chronological recent report retrieval, count boundary handling.

**Backend Test Breakdown (137 Tests, 100% Passing):**
```bash
python -m pytest backend/tests/ -v
```
- `test_blockchain_registry.py` (18 tests): Deterministic report canonicalization, idempotency (same report produces identical Keccak-256 hash), modified report produces different hash, key ordering invariance, correct Ethereum Keccak-256 test vectors (NIST SHA3-256 distinction), contract address checksumming, unconfigured/offline RPC handling, successful report registration, duplicate registration prevention, successful on-chain verification (VERIFIED), post-registration modification detection (TAMPERED), unregistered report detection (NOT_REGISTERED), failed transaction handling, RPC outage handling (UNAVAILABLE), 0 ETH wallet balance detection, missing private key handling, cross-module canonicalization (Message Analysis & Website Security), end-to-end FastAPI endpoint integration.
- `test_website_security.py` (30 tests): Enforces non-intrusive passive boundaries, pre-flight SSRF and private IP blocks (127.0.0.1, 10.0.0.1, 169.254.169.254, ::1), HTTPS enforcement, HTTP-to-HTTPS redirect upgrades, downgrade vulnerability detection, full 9 HTTP security headers matrix (HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP, CORP, COEP), privacy-preserving cookie flag inspection (Secure, HttpOnly, SameSite), cookie prefix validation (__Secure-, __Host-), zero cookie value persistence, active mixed content detection (scripts, iframes, CSS, form action targets), passive mixed content detection (images, audio, video), pure HTTPS clean baseline, server banner metadata exposure (Server, X-Powered-By, X-AspNet-Version), security.txt (RFC 9116) valid/missing handling, robots.txt discovery, weighted scoring calculation across all 6 categories, coverage metrics, label grading, POST /api/v1/analyze/security live flow, GET /api/v1/security/{report_id} retrieval, GET /api/v1/security/{report_id}/findings severity and category filtering.
- `test_threat_correlation.py` (22 tests): Indicator normalization for domains, URLs, IPv4/IPv6, X.509 fingerprints, phone numbers, and emails; cross-module entity extraction; graph relationship modeling; 8 campaign pattern detections (shared hosting campaigns, domain generation algorithms, fast-flux DNS, credential harvesting rings, phishing kit reuse, cross-channel SMS/email lures); CDN false-positive dampening; non-linear correlated risk scoring; POST /api/v1/correlate, GET /api/v1/correlations/{id}, and GET /api/v1/threats/{id}/related endpoints.
- `test_message_analyzer.py` (22 tests): Empty message validation, normal message baseline, suspicious bank KYC phishing, prize/lottery scams, fraudulent job offers, crypto giveaway scams, single URL extraction, multiple URLs extraction, email extraction, phone number extraction, artificial urgency indicators, credential theft lures, adversarial prompt injection defense, Gemini API timeout fallback, malformed AI response handling, Module 1 URL analysis integration, Module 2 TLS certificate integration, partial URL failure robustness, extremely long message handling (>10k chars), ambiguous/inconclusive text handling, `POST /api/v1/analyze/message` and `GET /api/v1/analyze/message/{report_id}` endpoints, 404 not found validation.
- `test_tls_analyzer.py` (14 tests): Valid HTTPS, expired certs, SAN wildcard/hostname mismatch, self-signed chains, weak RSA/ECC/ciphers, non-HTTPS targets, crt.sh success, crt.sh rate limits/errors, DNS resolution failures, connection timeouts, SSRF private IP rejections, malformed targets, partial failure robustness, combined Module 1 + 2 report.
- `test_api.py` (4 tests): Health check, invalid URL rejections, report submission & persistence, dedicated `POST /analyze/tls` endpoint.
- `test_url_validator.py` (5 tests): Scheme validation, RFC syntax, canonical normalization, SSRF guards.
- `test_domain_analyzer.py` (6 tests): Punycode, Cyrillic lookalikes, brand typosquatting, subdomains.
- `test_url_pattern_analyzer.py` (5 tests): IP hosts, `@` delimiters, phishing keywords, dangerous file extensions.
- `test_dns_analyzer.py` (3 tests): Zone queries, NXDOMAIN handling, graceful failure representation.
- `test_redirect_analyzer.py` (2 tests): SSRF hop interception, cloud metadata blocking.
- `test_risk_engine.py` (4 tests): Scoring thresholds, saturation caps, confidence scores, inconclusive verdicts.
- `test_threat_intel.py` (2 tests): VirusTotal parsing, missing key fallback.

### Run Frontend Production Build Check
```bash
cd frontend
npm run build
```
Ensures zero TypeScript compiler errors and produces production-ready bundles in `frontend/dist/`.

---

## 12. Security Considerations & Best Practices
- **SSRF Defense-in-Depth**: Every network probe (DNS, HTTP redirects, and TLS sockets) executes pre-flight DNS and IP checks. Loopback (`127.0.0.0/8`), private RFC 1918 subnets, and cloud metadata (`169.254.169.254`) are systematically blocked before opening socket connections.
- **Valid HTTPS Disclaimer**: The platform explicitly educates users that a valid TLS certificate guarantees only encrypted transport—not authenticity or safety. TLS telemetry is balanced against domain forensics, redirect paths, and threat intelligence.
- **Zero Client Script Execution**: The scanner inspects HTTP headers, status codes, and TLS handshakes passively without executing client-side JavaScript or rendering arbitrary DOM structures.
- **Secret Isolation**: All sensitive credentials remain server-side. Runtimes communicate with hosted PostgreSQL databases and external APIs without exposing secrets to the browser.
- **Privacy Preservation**: Raw submitted messages, passwords, and authentication credentials in Module 3 are redacted prior to storage; only privacy-safe previews and cryptographic SHA-256 hashes are persisted.

---

## 13. AI Usage & External Service Disclosures

In accordance with hackathon integrity guidelines, we transparently disclose all artificial intelligence, APIs, and automated tools utilized in this project:

| Technology / Service | Role & Integration | Fallback & Guardrails |
|---|---|---|
| **Google Gemini 1.5 Flash API** | Generates plain-language threat explanations, identifies psychological manipulation techniques, and formats actionable advice. | Strictly isolated via XML boundary tags; prompt injection triggers a deterministic override; falls back seamlessly to rule-based engine when offline or unconfigured. |
| **Antigravity AI Assistant** | Utilized as an AI pair-programmer during the 48-hour development sprint for code generation, architectural scaffolding, and test suite design. | All code was reviewed, validated, and rigorously tested against 67 automated unit and integration tests. |
| **VirusTotal API v3** | External threat intelligence provider used to corroborate known phishing campaigns and malicious domains. | Optional; when key is absent or rate-limited, system flags telemetry as `UNAVAILABLE` without penalizing safe domains. |
| **crt.sh Public CT Logs** | Public Certificate Transparency log aggregator used for historical issuance audits. | Gracefully handles timeouts and rate limits with non-blocking async HTTP calls. |
| **Ethereum Sepolia RPC** | Decentralized EVM node used to verify network height and anchor threat report commitments. | Read/write operations are decoupled from core scanner; outages do not block analysis results. |

---

## 14. Hackathon Track Alignment

| Track / Domain | Project Implementation & Evidence |
|---|---|
| **Artificial Intelligence** | - Grounded explanation synthesis translating complex security telemetry into understandable guidance.<br>- Adversarial prompt injection defense detecting and neutralizing instruction hijacking.<br>- Multi-intent social engineering classification (urgency, KYC traps, fake job lures, financial scams). |
| **Cybersecurity** | - RFC-compliant URL normalization and strict scheme gating (`http`/`https` only).<br>- Levenshtein distance brand typosquatting & Punycode homoglyph analysis.<br>- Pre-flight SSRF protection intercepting private RFC 1918 IPs, loopback, and cloud metadata (169.254.169.254).<br>- Asynchronous DNS zone querying across A, AAAA, MX, NS, and TXT records.<br>- X.509 TLS certificate extraction, UTC expiration window calculation, RFC 6125 SAN wildcard domain matching, and cipher strength auditing.<br>- Sensitive PII redaction protecting user passwords and OTPs. |
| **Web3** | - `ThreatReportRegistry.sol` smart contract deployed on Ethereum Sepolia Testnet (Chain ID 11155111).<br>- Deterministic JSON canonicalization & Ethereum Keccak-256 cryptographic fingerprinting.<br>- Independent tamper-verification engine identifying post-registration alterations (`VERIFIED` vs `TAMPERED`).<br>- Native extraction of Bitcoin, Ethereum, and Solana wallet addresses in Module 3 scam detection.<br>- Full Hardhat local testing and deployment workflow with Sepolia Etherscan explorer links. |
