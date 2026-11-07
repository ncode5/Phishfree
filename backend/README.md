# Digital Trust Intelligence - Backend (Modules 1 & 2 + Web3)

FastAPI-powered cybersecurity analysis engine for evidence-grounded URL, TLS certificate, and digital trust intelligence.

## Capabilities & Architecture
- **URL Validation & Normalization (Module 1)**: RFC-compliant host and URI parsing, scheme whitelist (`http`/`https`), loopback/private/metadata IP SSRF protection, canonical path normalization.
- **Domain & Linguistic Forensics (Module 1)**: Subdomain depth profiling, domain length anomaly scoring, hyphen chaining checks, Punycode/IDN homograph detection, and brand typosquatting similarity matching against high-value targets (PayPal, Apple, Microsoft, Binance, MetaMask, Chase, etc.).
- **URL Pattern Analysis (Module 1)**: IP-as-host indicators, embedded credential delimiters (`@`), non-standard ports, obfuscated double URL encoding, dangerous extensions, and sensitive credential targeting keywords.
- **DNS Zone Analysis (Module 1)**: Asynchronous DNS record resolution (`A`, `AAAA`, `MX`, `NS`, `TXT`) using `dnspython`. Unreachable DNS servers are marked as `UNAVAILABLE` or `UNKNOWN`, never as false proof of maliciousness.
- **Safe Redirect Inspection (Module 1)**: Controlled multi-hop redirect tracer using `httpx`. Validates resolved destination IPs at every hop to prevent Server-Side Request Forgery (SSRF) and DNS rebinding attacks. Detects cross-domain hops.
- **Threat Intelligence (Module 1)**: Pluggable provider architecture with `VirusTotalProvider`. Safely degrades when API keys are absent without compromising local heuristic analysis.
- **TLS Certificate & Digital Trust Analysis (Module 2)**:
  - Dual-phase HTTPS handshake on port 443 (Strict verified handshake + unverified peer certificate extraction fallback).
  - X.509 metadata parsing via `cryptography.x509` (Subject, Issuer, Serial Number, Signature Algorithm).
  - Expiration and UTC-aware temporal validity evaluation (`VALID`, `EXPIRED`, `EXPIRING_SOON`).
  - RFC 6125 SAN and Common Name wildcard domain matching.
  - Cryptographic configuration audit (TLS 1.3/1.2 vs deprecated TLS 1.0/1.1; RSA 2048+ bit vs weak keys; SHA-256 vs SHA-1/MD5).
  - Certificate Transparency public audit log queries via `crt.sh`.
- **Explainable Risk Assessment Engine**: Rule-based scoring engine with configurable weights, saturation caps (to avoid double-counting), separate confidence scoring, and strict classification criteria (`LOW_RISK`, `SUSPICIOUS`, `HIGH_RISK`, `CONFIRMED_MALICIOUS`, `INCONCLUSIVE`).
- **AI Explanation Layer**: Synthesizes verified cybersecurity findings into actionable summaries and user guidance. Guards against prompt-injection and includes an automated deterministic fallback engine.
- **Web3 Sepolia Registry**: Publishes deterministic SHA-256 report commitments on the Ethereum Sepolia Testnet for tamper-evident provenance.

## Vercel Serverless Deployment
The backend is designed for Vercel Python Functions:
- Entrypoints: `api/index.py` (unified root) and `backend/api/index.py` (isolated backend).
- Database Pooling: In serverless environments, `connection.py` automatically detects Neon/Supabase PostgreSQL and activates SQLAlchemy's `NullPool` to prevent pool exhaustion across stateless invocations.
- Execution Limits: Asynchronous tasks run concurrently via `asyncio.gather(..., return_exceptions=True)` to stay well within serverless timeout budgets (< 4.0s total).

## Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Hosted PostgreSQL URI (Neon / Supabase) or local SQLite | `sqlite:///./trust_intel.db` |
| `VIRUSTOTAL_API_KEY` | Optional VirusTotal API v3 key | `""` |
| `GEMINI_API_KEY` | Optional Google Gemini API key | `""` |
| `BLOCKCHAIN_RPC_URL` | Ethereum Sepolia JSON-RPC endpoint | `https://ethereum-sepolia-rpc.publicnode.com` |
| `PRIVATE_KEY` | Optional wallet private key for on-chain anchoring | `""` |
| `CONTRACT_ADDRESS` | Optional threat registry contract address | `""` |
| `ALLOWED_ORIGINS` | Comma-separated list of CORS allowed origins | `http://localhost:5173,https://*.vercel.app` |

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

## Running Automated Tests
Run the complete 45-test suite covering Module 1, Module 2 TLS, and Web3 integration:
```bash
python -m pytest tests/ -v
```
