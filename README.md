# PhishFree — AI-Powered Web Threat Detection & Digital Trust Intelligence

[![Modules 1 to 7: Verified](https://img.shields.io/badge/Modules%201%20to%207-Operational%20%26%20Verified-emerald?style=for-the-badge&logo=shield)](https://github.com/ncode5/Phishfree)
[![Live Frontend](https://img.shields.io/badge/Frontend-Live%20on%20Vercel-blue?style=for-the-badge&logo=vercel)](https://phishfree-rust.vercel.app)
[![Live Backend API](https://img.shields.io/badge/Backend-FastAPI%20Serverless-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://phishfree-api.vercel.app)
[![Ethereum Sepolia](https://img.shields.io/badge/Ethereum-Sepolia%20Testnet-627EEA?style=for-the-badge&logo=ethereum&logoColor=white)](https://sepolia.etherscan.io)
[![Pytest: 137 Passing](https://img.shields.io/badge/Pytest-137%20Passed-brightgreen?style=for-the-badge&logo=pytest)](https://docs.pytest.org)
[![Hardhat: 13 Passing](https://img.shields.io/badge/Hardhat-13%20Passed-yellow?style=for-the-badge&logo=solidity)](https://hardhat.org)

> **Hackathon Submission**: 48-Hour Build  
> **Domains**: Artificial Intelligence · Cybersecurity · Web3  
> **Deployment Target**: Vercel Serverless Platform + Hosted PostgreSQL (Neon / Supabase)

---

## 🌟 Live Production Deployments & Access Endpoints

| Platform Target | Live Production URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | **[https://phishfree-rust.vercel.app](https://phishfree-rust.vercel.app)** | React 18 + Vite + TypeScript Cybersecurity Intelligence SPA |
| **Backend Serverless API** | **[https://phishfree-api.vercel.app](https://phishfree-api.vercel.app)** | FastAPI Python Serverless Engine on Vercel |
| **Interactive OpenAPI Docs** | **[https://phishfree-api.vercel.app/docs](https://phishfree-api.vercel.app/docs)** | Swagger UI for real-time endpoint testing and schema inspection |
| **Alternative API Docs** | **[https://phishfree-api.vercel.app/redoc](https://phishfree-api.vercel.app/redoc)** | ReDoc interactive technical API documentation |
| **GitHub Repository** | **[https://github.com/ncode5/Phishfree](https://github.com/ncode5/Phishfree)** | Source code, test suites, smart contracts, and documentation |

### Pre-Configured Demonstration Credentials
The production database includes seeded demo accounts for immediate testing:
- **Security Analyst Account:** `analyst@phishfree.io` · Password: `Password123!` *(or click "Fill Demo Analyst Credentials" on `/login`)*
- **Security Administrator Account:** `admin@phishfree.io` · Password: `AdminPassword123!`
- *Self-registration is also fully enabled via `/register`.*

---

## 1. Project Title
**PhishFree — AI-Powered Web Threat Detection & Digital Trust Intelligence**

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
**PhishFree** is an intelligent, evidence-grounded digital security platform. Rather than returning a simplistic binary verdict, PhishFree executes a multi-layered forensic investigation:
1. **Audits Technical Telemetry**: Gathers real-time DNS zone records, traces HTTP redirect hops, and profiles domain linguistics.
2. **Detects Deceptive Patterns**: Discovers brand typosquatting, Punycode homographs, excessive subdomains, and credential targeting tokens.
3. **Module 2: TLS Certificate & Digital Trust Engine**: Inspects HTTPS availability, X.509 certificate metadata, UTC-accurate validity, Subject Alternative Name (SAN) wildcard matching, trust chain provenance, cryptographic cipher strength, and historical public Certificate Transparency (CT) logs via `crt.sh`.
4. **Guards Against SSRF**: Protects internal infrastructure by blocking private, loopback, and cloud metadata destinations.
5. **Calculates Explainable Risk**: Uses a weighted, transparent scoring engine with category saturation caps and independent confidence scoring.
6. **Synthesizes Plain-Language Guidance**: An AI explanation layer converts technical findings into human-readable summaries and practical safety recommendations.
7. **Web3 Decentralized Registry**: Anchors deterministic Keccak-256 report commitments on the Ethereum Sepolia Testnet for immutable, tamper-evident audit trails.
8. **Module 5: Website Security Assessment**: Evaluates publicly observable website security posture across 6 key dimensions: HTTPS transport enforcement & downgrade prevention, 9 standard HTTP defensive security headers (HSTS, CSP, X-Frame-Options, etc.), cookie security flags (`Secure`, `HttpOnly`, `SameSite`), mixed active/passive content detection, basic server software information exposure, and well-known configuration files (`security.txt`, `robots.txt`).
9. **Module 6: Decentralized Threat Intelligence (Web3 Registry)**: Provides cryptographic report integrity, timestamped proof of existence, and independent tamper verification using Ethereum Sepolia Testnet. Employs deterministic JSON canonicalization, computes 32-byte Ethereum Keccak-256 digests, broadcasts on-chain registrations to the `ThreatReportRegistry.sol` smart contract, and provides an independent verification tool detecting post-registration alterations (`VERIFIED` vs `TAMPERED`).
10. **Module 7: Enterprise Authentication & SecOps RBAC**: Protects platform workspaces using memory-hard Argon2id password hashing, stateless JWT session cookies (`HttpOnly; SameSite=Lax`), role-based authorization (`security_analyst` vs `admin`), and rate-limited single-use cryptographic password reset tokens.

---

### 3.1 End-to-End Analyst Workflow & Decision Architecture

```mermaid
flowchart TD
    Target["Suspicious Target<br>(URL, Domain, or Message)"] --> Choice{"Choose Tool"}
    
    Choice -->|"Websites & Links"| Scanner["URL Security Scanner<br>(/scanner)"]
    Choice -->|"SMS / Emails / Chats"| Scam["Scam & Social Engineering<br>(/scam-analyzer)"]
    Choice -->|"Configuration Audit"| Security["Website Security Posture<br>(/security)"]
    
    Scam --> NLP["NLP Heuristics & PII Masking<br>(Extracts Links & Wallets)"]
    NLP -->|"Pivot Links"| Scanner
    
    Security --> Headers["9 Security Headers Matrix<br>(Cookies, Mixed Content, security.txt)"]
    
    Scanner --> Pipeline["6-Stage Forensic Pipeline<br>(DNS, Typosquatting, TLS, Redirects)"]
    Pipeline --> Dossier["Forensic Report Dossier<br>(/reports/:id)"]
    
    Dossier --> Web3["Decentralized Web3 Registry<br>(/blockchain)"]
    Dossier --> Graph["Threat Topology Graph<br>(/threat-intel)"]
    
    Web3 --> Sepolia["Sepolia Smart Contract<br>(Keccak-256 Tamper Verification)"]
```

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
- Weighted scoring model producing intuitive labels (Strong, Good, Needs Improvement, Weak, Poor), assessment coverage metrics, and copyable remediation recommendations.

### Module 6: Decentralized Threat Intelligence using Blockchain
- **Deterministic Canonicalization**: Sorts keys lexicographically, standardizes ISO 8601 UTC timestamps, normalizes floating-point scores to 2 decimal places, and strips transient UI/transaction fields.
- **Ethereum Keccak-256 Fingerprinting**: Generates 32-byte (66 hex characters) cryptographic digests compatible with EVM `keccak256()` and Solidity `bytes32`.
- **ThreatReportRegistry Smart Contract**: Written in Solidity `^0.8.20`, deployed on Ethereum Sepolia Testnet (Chain ID `11155111`) / Localhost (Chain ID `31337`). Supports `registerReport(bytes32)` with zero-hash rejection and duplicate registration guards.
- **Independent Tamper Verification**: Evaluates stored reports against on-chain fingerprints, returning unambiguous states: `VERIFIED`, `TAMPERED`, `NOT_REGISTERED`, `PENDING`, or `UNAVAILABLE`.
- **Safe Transaction Management**: Enforces pre-flight wallet balance checks, dynamic gas estimation, nonce tracking, and receipt confirmation.
- **Interactive Web3 Console**: Dedicated React interface (`/blockchain`) providing real-time JSON-RPC node status, Etherscan explorer links, stepper registration progress, and live smart contract event feeds.

### Module 7: User Authentication & Role-Based Access Control (RBAC)
- **Argon2id Cryptographic Hashing**: Memory-hard, GPU-resistant password hashing protecting user credentials against brute-force attacks.
- **Stateless JWT Sessions**: Dual-layer session handling supporting `HttpOnly; SameSite=Lax` cookies for browser clients and `Authorization: Bearer <token>` for API consumers.
- **SecOps Role Hierarchy**: Granular privileges distinguishing standard `security_analyst` roles from elevated `admin` and `superadmin` controls.
- **Cryptographic Password Recovery**: Single-use, time-limited reset tokens stored as SHA-256 digests with anti-enumeration protection.
- **Automated Seeding**: Non-destructive provisioning of pre-configured demonstration accounts on database initialization.

---

## 5. Visual Application Walkthrough & Screenshots Gallery

| Screen # | Module / Feature | Captured State | Screenshot Preview |
| :---: | :--- | :--- | :---: |
| **01** | **User Authentication (`/login`)** | Security analyst sign-in with Argon2id credentials and one-click demo credentials fill | ![01 Login](screenshots/01_login.png) |
| **02** | **Unified Dashboard (`/`)** | Central Security Operations cockpit with threats blocked tally, active campaigns, and Recharts donut distribution | ![02 Dashboard](screenshots/02_dashboard_home.png) |
| **03** | **URL Threat Scanner (`/scanner`)** | 6-stage animated forensic pipeline analyzing destination targets with SSRF guards and typosquatting detection | ![03 Scanner](screenshots/03_url_scanner.png) |
| **04** | **Threat Intelligence (`/threat-intel`)** | Dynamic SVG threat topology relationship graph correlating URLs, DNS IPs, and TLS certificates | ![04 Threat Intel](screenshots/04_threat_intel.png) |
| **05** | **Website Security (`/security`)** | Passive website security posture audit evaluating 9 defensive HTTP headers, cookie security, and configuration files | ![05 Website Security](screenshots/05_website_security.png) |
| **06** | **AI Scam Analyzer (`/scam-analyzer`)** | Multi-intent SMS, email, and social engineering heuristic analysis with PII masking and crypto wallet extraction | ![06 Scam Analyzer](screenshots/06_scam_analyzer.png) |
| **07** | **Web3 Registry (`/blockchain`)** | Ethereum Sepolia testnet threat registry console with real-time JSON-RPC state, Keccak-256 hashes, and tamper verification | ![07 Blockchain](screenshots/07_blockchain_registry.png) |
| **08** | **Scan History (`/history`)** | Comprehensive audit trail of past security investigations with keyword search and risk level filtering | ![08 Scan History](screenshots/08_scan_history.png) |
| **09** | **Mobile Navigation Drawer** | Touch-friendly slide-out navigation drawer providing full access across small viewports (320px–430px) | ![09 Mobile Drawer](screenshots/09_mobile_responsive_drawer.png) |
| **10** | **Light Mode Theme** | High-contrast enterprise cybersecurity blue palette for accessible daylight auditing | ![10 Light Mode](screenshots/10_light_mode_toggle.png) |
| **11** | **SSRF Defense Engine** | Interception of private IP addresses, loopback (127.0.0.1), and cloud metadata (169.254.169.254) | ![11 SSRF Blocked](screenshots/11_error_handling_ssrf_blocked.png) |

---

## 6. Technology Stack

| Layer | Technology | Selection Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + Vite | Lightning-fast development server, optimized ESM bundling, and reactive state management. |
| **Language** | TypeScript 5.5 | Strong typing guarantees contract synchronization with backend Pydantic models. |
| **Styling** | Tailwind CSS 3.4 | Rapid construction of a dark-mode, high-contrast cybersecurity SaaS interface with dual theme support. |
| **Data Visualization** | Recharts | Composable SVG-based chart library for rendering risk distribution donuts and metric breakdowns. |
| **Backend Framework** | FastAPI 0.115+ | Asynchronous performance, native OpenAPI documentation, and automated request validation. |
| **Data Validation** | Pydantic v2 | High-throughput data serialization, strict schemas, and type enforcement. |
| **Authentication & Crypto** | Argon2id + PyJWT + cryptography | State-of-the-art password hashing, stateless token management, and X.509 DER byte extraction. |
| **Domain Analysis** | tldextract | Accurate extraction of registered domains and subdomains against the Public Suffix List. |
| **DNS Resolution** | dnspython | Robust DNS zone queries with granular record-type isolation and timeout management. |
| **HTTP Client** | HTTPX | Asynchronous HTTP client providing manual hop-by-hop redirect control and timeout bounds. |
| **Database & ORM** | SQLAlchemy 2.0 + Hosted PostgreSQL | Neon / Supabase compatibility with `NullPool` serverless connection pooling. |
| **Blockchain & Smart Contracts** | Solidity 0.8.20 + Hardhat + Web3.py | `ThreatReportRegistry.sol` deployed on Ethereum Sepolia Testnet with Keccak-256 fingerprinting and tamper verification. |
| **Automated Testing** | Pytest + pytest-asyncio + Hardhat Chai | 137 backend automated tests + 13 smart contract tests (150 tests total, 100% passing across all 7 modules). |

---

## 7. Project Folder Structure

```
fish_Ditect/
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
│   │   ├── components/          # RiskBadge, ScoreGauge, TopHeader, LeftSidebar, MobileDrawer
│   │   ├── pages/               # DashboardPage, ScannerPage, ReportPage, HistoryPage, LoginPage, RegisterPage...
│   │   ├── layouts/             # MainLayout with dual-theme (Light/Dim) context
│   │   ├── services/            # api.ts (Axios client with dynamic Vercel API routing)
│   │   ├── types/               # TypeScript interfaces (Modules 1 to 7, TLS, Web3, Auth)
│   │   ├── App.tsx              # React Router v6 setup with AuthGuard
│   │   ├── main.tsx             # Application entrypoint
│   │   └── index.css            # Tailwind CSS directives
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── vercel.json              # Isolated frontend Vercel deploy configuration
│   └── README.md
│
├── backend/
│   ├── api/
│   │   └── index.py             # Backend directory Vercel entrypoint
│   ├── app/
│   │   ├── main.py              # FastAPI startup, CORS regex, lifespan
│   │   ├── api/                 # Endpoints (/analyze/*, /reports, /blockchain/*, /auth/*)
│   │   ├── core/                # config.py (Pydantic settings, JWT secrets, timeouts)
│   │   ├── analyzers/           # URL, domain, DNS, redirect, pattern analyzers
│   │   ├── intelligence/        # VirusTotal API v3 provider
│   │   ├── services/            # Analysis, TLS, Message, Correlation, WebSec, Blockchain, Auth
│   │   ├── web3/                # ABI loader, Sepolia service, compiled ABI JSON
│   │   ├── ai/                  # AI explanation engine + deterministic fallback
│   │   ├── risk_engine/         # Scoring thresholds, saturation caps, confidence
│   │   └── database/            # connection.py (NullPool), models.py, schemas.py
│   ├── tests/                   # Pytest suite (137 passing tests across 7 modules)
│   ├── requirements.txt
│   ├── vercel.json              # Isolated backend Vercel deploy configuration
│   └── README.md
│
├── docs/
│   ├── architecture.md          # Architectural whitepaper, serverless pooling, data flow
│   ├── api-documentation.md     # Complete REST API reference (26 endpoints across 7 modules)
│   ├── module-1.md              # Detailed Module 1 technical specifications
│   ├── module-2-tls-analysis.md # Detailed Module 2 TLS analysis technical whitepaper
│   ├── module-3-message-analysis.md # Detailed Module 3 AI scam analyzer whitepaper
│   ├── module-4-threat-correlation.md # Detailed Module 4 Threat correlation whitepaper
│   ├── module-5-website-security-assessment.md # Detailed Module 5 WebSec whitepaper
│   ├── module-6-blockchain-threat-intelligence.md # Detailed Module 6 Web3 whitepaper
│   └── module-7-authentication.md # Detailed Module 7 User Auth & RBAC whitepaper
│
├── screenshots/                 # 11 numbered UI screenshots (01_login.png to 11_error_handling_ssrf_blocked.png)
├── USER_GUIDE.md                # Comprehensive end-user and analyst guide
├── DEPLOYMENT_GUIDE.md          # Production Vercel deployment guide
├── vercel.json                  # Root unified Vercel deployment configuration
├── requirements.txt             # Root requirements for Vercel Python runtime
└── README.md
```

---

## 8. Vercel Deployment Instructions

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
   - `JWT_SECRET_KEY`: Cryptographic HMAC secret for signing and verifying session JWTs.
   - `VIRUSTOTAL_API_KEY`: *(Optional)* Your VirusTotal API v3 key.
   - `GEMINI_API_KEY`: *(Optional)* Your Google Gemini API key.
   - `BLOCKCHAIN_RPC_URL`: `https://ethereum-sepolia-rpc.publicnode.com` (or Infura/Alchemy endpoint).
   - `PRIVATE_KEY`: *(Optional)* Sepolia wallet private key for on-chain transaction publishing.
   - `CONTRACT_ADDRESS`: `0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8` *(Threat registry contract)*.
   - `VITE_API_BASE_URL`: Leave blank or set to `/api/v1` (the frontend automatically detects production Vercel domains and routes to `/api/v1`).
4. **Deploy**:
   - Click **Deploy**. Vercel will build the React frontend with Vite, package `api/index.py` as a Python Serverless Function, and provision CDN endpoints with SPA rewrites.

### Method B: Separate Frontend and Backend Deployments
If you prefer independent deployment projects:
- **Backend Project (`phishfree-api`)**:
  - In Vercel, create a new project and set the Root Directory to `backend`.
  - Add backend environment variables (`DATABASE_URL`, `JWT_SECRET_KEY`, `VIRUSTOTAL_API_KEY`, etc.).
  - Note the generated backend URL: `https://phishfree-api.vercel.app`.
- **Frontend Project (`phishfree`)**:
  - In Vercel, create a second project and set the Root Directory to `frontend`.
  - Add environment variable `VITE_API_BASE_URL=https://phishfree-api.vercel.app/api/v1`.
  - The backend CORS configuration automatically allows any `*.vercel.app` domain.

---

## 9. Hosted PostgreSQL Setup (Neon / Supabase)

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

### Run Automated Test Suites (150 Total Tests, 100% Passing)

**Backend Test Suite (137 Tests):**
```bash
python -m pytest backend/tests/ -v
```
- `test_auth.py` (8 tests): User registration, Argon2id password verification, JWT issuance, HttpOnly cookies, RBAC admin enforcement, anti-enumeration, single-use password reset.
- `test_blockchain_registry.py` (18 tests): Deterministic canonicalization, Keccak-256 test vectors, on-chain verification, post-registration tamper detection, 0 ETH balance handling, Sepolia RPC resilience.
- `test_website_security.py` (30 tests): Non-intrusive passive boundaries, pre-flight SSRF blocks, 9-header defensive matrix, cookie privacy audit, mixed content detection, security.txt compliance.
- `test_threat_correlation.py` (22 tests): Indicator normalization, graph relationship modeling, 8 campaign pattern rules, non-linear risk scoring.
- `test_message_analyzer.py` (22 tests): SMS/email heuristic classification, PII masking, entity extraction (crypto wallets, URLs), prompt injection defense, AI fallback.
- `test_tls_analyzer.py` (14 tests): Port 443 handshakes, X.509 metadata, UTC validity, SAN wildcard matching, cipher strength, crt.sh logs.
- `test_api.py` (4 tests): Health check, invalid URL rejections, report persistence.
- `test_url_validator.py` (5 tests): Scheme validation, RFC syntax, canonical normalization, SSRF guards.
- `test_domain_analyzer.py` (6 tests): Punycode, Cyrillic lookalikes, brand typosquatting.
- `test_url_pattern_analyzer.py` (5 tests): IP hosts, `@` delimiters, phishing keywords.
- `test_dns_analyzer.py` (3 tests): Zone queries, NXDOMAIN handling.
- `test_redirect_analyzer.py` (2 tests): SSRF hop interception, cloud metadata blocking.
- `test_risk_engine.py` (4 tests): Scoring thresholds, saturation caps, confidence scores.
- `test_threat_intel.py` (2 tests): VirusTotal parsing, missing key fallback.

**Smart Contract Test Suite (13 Tests):**
```bash
cd blockchain
npx hardhat test
```
- `ThreatReportRegistry.test.js` (13 tests): Initial state, registration of 32-byte hash, zero-hash rejection, duplicate prevention, getter verification, timestamp recording, submitter recording, event emission, reverse chronological retrieval.

### Frontend Production Build Check
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
| **Antigravity AI Assistant** | Utilized as an AI pair-programmer during the 48-hour development sprint for code generation, architectural scaffolding, and test suite design. | All code was reviewed, validated, and rigorously tested against 150 automated unit and integration tests. |
| **VirusTotal API v3** | External threat intelligence provider used to corroborate known phishing campaigns and malicious domains. | Optional; when key is absent or rate-limited, system flags telemetry as `UNAVAILABLE` without penalizing safe domains. |
| **crt.sh Public CT Logs** | Public Certificate Transparency log aggregator used for historical issuance audits. | Gracefully handles timeouts and rate limits with non-blocking async HTTP calls. |
| **Ethereum Sepolia RPC** | Decentralized EVM node used to verify network height and anchor threat report commitments. | Read/write operations are decoupled from core scanner; outages do not block analysis results. |

---

## 14. Hackathon Track Alignment

| Track / Domain | Project Implementation & Evidence |
|---|---|
| **Artificial Intelligence** | - Grounded explanation synthesis translating complex security telemetry into understandable guidance.<br>- Adversarial prompt injection defense detecting and neutralizing instruction hijacking.<br>- Multi-intent social engineering classification (urgency, KYC traps, fake job lures, financial scams). |
| **Cybersecurity** | - RFC-compliant URL normalization and strict scheme gating (`http`/`https` only).<br>- Levenshtein distance brand typosquatting & Punycode homoglyph analysis.<br>- Pre-flight SSRF protection intercepting private RFC 1918 IPs, loopback, and cloud metadata (169.254.169.254).<br>- Asynchronous DNS zone querying across A, AAAA, MX, NS, and TXT records.<br>- X.509 TLS certificate extraction, UTC expiration window calculation, RFC 6125 SAN wildcard domain matching, and cipher strength auditing.<br>- Sensitive PII redaction protecting user passwords and OTPs.<br>- Memory-hard Argon2id password hashing and secure stateless JWT sessions. |
| **Web3** | - `ThreatReportRegistry.sol` smart contract deployed on Ethereum Sepolia Testnet (Chain ID 11155111).<br>- Deterministic JSON canonicalization & Ethereum Keccak-256 cryptographic fingerprinting.<br>- Independent tamper-verification engine identifying post-registration alterations (`VERIFIED` vs `TAMPERED`).<br>- Native extraction of Bitcoin, Ethereum, and Solana wallet addresses in Module 3 scam detection.<br>- Full Hardhat local testing and deployment workflow with Sepolia Etherscan explorer links. |
