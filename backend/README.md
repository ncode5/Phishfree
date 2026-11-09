# PhishFree — Backend API Engine (Modules 1 to 7)

FastAPI-powered cybersecurity analysis engine for evidence-grounded URL detection, TLS certificate trust analysis, AI scam heuristics, threat correlation, passive website security assessment, Web3 blockchain verification, and enterprise SecOps authentication.

## Live Production Endpoints
- **Production REST API:** [https://phishfree-api.vercel.app/api/v1](https://phishfree-api.vercel.app/api/v1)
- **Interactive Swagger Documentation:** [https://phishfree-api.vercel.app/docs](https://phishfree-api.vercel.app/docs)
- **Alternative ReDoc UI:** [https://phishfree-api.vercel.app/redoc](https://phishfree-api.vercel.app/redoc)
- **Health Verification:** [https://phishfree-api.vercel.app/api/v1/health](https://phishfree-api.vercel.app/api/v1/health)

---

## Capabilities & Architecture Across All 7 Modules

1. **URL Validation & Normalization (Module 1)**: RFC-compliant host and URI parsing, scheme whitelist (`http`/`https`), loopback/private/metadata IP SSRF protection, canonical path normalization.
2. **Domain & Linguistic Forensics (Module 1)**: Subdomain depth profiling, domain length anomaly scoring, hyphen chaining checks, Punycode/IDN homograph detection, and brand typosquatting similarity matching against high-value targets (PayPal, Apple, Microsoft, Binance, MetaMask, Chase, etc.).
3. **URL Pattern Analysis (Module 1)**: IP-as-host indicators, embedded credential delimiters (`@`), non-standard ports, obfuscated double URL encoding, dangerous extensions, and sensitive credential targeting keywords.
4. **DNS Zone Analysis (Module 1)**: Asynchronous DNS record resolution (`A`, `AAAA`, `MX`, `NS`, `TXT`) using `dnspython`. Unreachable DNS servers are marked as `UNAVAILABLE` or `UNKNOWN`, never as false proof of maliciousness.
5. **Safe Redirect Inspection (Module 1)**: Controlled multi-hop redirect tracer using `httpx`. Validates resolved destination IPs at every hop to prevent Server-Side Request Forgery (SSRF) and DNS rebinding attacks. Detects cross-domain hops.
6. **Threat Intelligence (Module 1)**: Pluggable provider architecture with `VirusTotalProvider`. Safely degrades when API keys are absent without compromising local heuristic analysis.
7. **TLS Certificate & Digital Trust Analysis (Module 2)**:
   - Dual-phase HTTPS handshake on port 443 (Strict verified handshake + unverified peer certificate extraction fallback).
   - X.509 metadata parsing via `cryptography.x509` (Subject, Issuer, Serial Number, Signature Algorithm).
   - Expiration and UTC-aware temporal validity evaluation (`VALID`, `EXPIRED`, `EXPIRING_SOON`).
   - RFC 6125 SAN and Common Name wildcard domain matching.
   - Cryptographic configuration audit (TLS 1.3/1.2 vs deprecated TLS 1.0/1.1; RSA 2048+ bit vs weak keys; SHA-256 vs SHA-1/MD5).
   - Certificate Transparency public audit log queries via `crt.sh`.
8. **AI Scam & Message Analysis (Module 3)**:
   - NLP heuristic classifier for SMS, email, WhatsApp, and social engineering lures.
   - PII masking for passwords, OTPs, and credit card numbers.
   - High-precision entity extraction for URLs, domains, phones, emails, and crypto wallets (BTC, ETH, SOL).
   - Adversarial prompt injection defense.
9. **Intelligent Threat Correlation (Module 4)**:
   - Multi-indicator relational graph modeling (domains, URLs, IPs, certs, lures).
   - 8 campaign pattern detection rules with shared CDN false-positive dampening.
   - Non-linear correlated risk scoring engine.
10. **Passive Website Security Assessment (Module 5)**:
    - 9 HTTP defensive security headers inspection matrix (HSTS, CSP, X-Frame-Options, COOP, etc.).
    - Privacy-preserving cookie security audit (`Secure`, `HttpOnly`, `SameSite`).
    - Mixed active and passive content detection.
    - Information exposure audit (`Server`, `X-Powered-By`).
    - `security.txt` (RFC 9116) and `robots.txt` compliance verification.
11. **Decentralized Threat Intelligence (Module 6)**:
    - Deterministic JSON canonicalization and Ethereum Keccak-256 (32-byte) report fingerprinting.
    - Ethereum Sepolia testnet smart contract anchoring (`ThreatReportRegistry.sol`).
    - Independent tamper-verification engine (`VERIFIED` vs `TAMPERED`).
12. **User Authentication & Role-Based Access Control (Module 7)**:
    - Argon2id cryptographic password hashing (memory-hard, GPU-resistant).
    - Stateless JWT session cookies (`HttpOnly`, `SameSite=Lax`, `Secure`).
    - SecOps RBAC (`security_analyst` vs `admin`).
    - Rate-limited single-use password reset tokens with SHA-256 storage hashing.
    - Automated seeding of demonstration accounts (`analyst@phishfree.io` / `Password123!`).

---

## Vercel Serverless Deployment
The backend is designed for Vercel Python Functions:
- **Entrypoints**: `api/index.py` (unified root) and `backend/api/index.py` (isolated backend).
- **Database Pooling**: In serverless environments, `connection.py` automatically detects Neon/Supabase PostgreSQL and activates SQLAlchemy's `NullPool` to prevent pool exhaustion across stateless invocations.
- **Execution Limits**: Asynchronous tasks run concurrently via `asyncio.gather(..., return_exceptions=True)` to stay well within serverless timeout budgets (< 4.0s total).

---

## Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
|---|---|---|
| `DATABASE_URL` | Hosted PostgreSQL URI (Neon / Supabase) or local SQLite | `sqlite:///./trust_intel.db` |
| `JWT_SECRET_KEY` | HMAC-SHA256 secret key for signing session tokens | `64-character-hex-secret` |
| `VIRUSTOTAL_API_KEY` | Optional VirusTotal API v3 key | `""` |
| `GEMINI_API_KEY` | Optional Google Gemini API key | `""` |
| `BLOCKCHAIN_RPC_URL` | Ethereum Sepolia JSON-RPC endpoint | `https://ethereum-sepolia-rpc.publicnode.com` |
| `PRIVATE_KEY` | Optional wallet private key for on-chain anchoring | `""` |
| `CONTRACT_ADDRESS` | Threat registry contract address on Sepolia | `0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8` |
| `ALLOWED_ORIGINS` | Comma-separated list of CORS allowed origins | `http://localhost:5173,https://*.vercel.app` |

---

## Local Setup & Execution
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start development server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. Interactive API documentation:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## Running Automated Tests (137 Passing Tests)
Run the complete 137-test backend suite covering all 7 modules:
```bash
python -m pytest tests/ -v
```
