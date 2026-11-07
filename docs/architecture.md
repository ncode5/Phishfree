# System Architecture Document

## Project: AI-Powered Web Threat Detection & Digital Trust Intelligence

### 1. Architectural Philosophy
The platform is designed around the core principle of **evidence-based, explainable cybersecurity**. Rather than providing an opaque binary classification (`SAFE` vs `MALICIOUS`), the system operates as a transparent forensic pipeline. Each investigation collects raw technical telemetry, evaluates it against rule-based indicators with configurable weights, and explains the findings in plain, actionable language.

```
USER INTERACTION
       │
       ▼
REACT FRONTEND (Vite / TypeScript / Tailwind CSS / Recharts)
       │ HTTP REST API (Deployed on Vercel Edge/CDN)
       ▼
FASTAPI SERVERLESS BACKEND (Vercel Python Functions)
       │
       ├── 1. URL Validation & Normalization
       │        └── Enforce HTTP/HTTPS, RFC 1123 Hostname, SSRF Whitelist
       │
       ├── 2. Domain & Linguistic Analysis
       │        └── Punycode (xn--), Homoglyphs, Levenshtein Brand Typosquatting
       │
       ├── 3. URL Pattern & Obfuscation Analysis
       │        └── @ delimiter, IP-in-hostname, hex/double-encoding, credential tokens
       │
       ├── 4. Asynchronous DNS Zone Audit (dnspython)
       │        └── A, AAAA, MX, NS, TXT record resolution
       │
       ├── 5. Safe HTTP Redirect Chain Inspection (httpx)
       │        └── Destination IP check before each hop (Private/Loopback/Metadata blocked)
       │
       ├── 6. Pluggable Threat Intelligence (VirusTotal API v3)
       │        └── Graceful degradation when API key absent
       │
       ├── 7. Module 2: TLS Certificate & Digital Trust Engine
       │        ├── Port 443 handshake (Verified & Unverified fallback)
       │        ├── X.509 metadata extraction (SAN, Subject, Issuer, Validity)
       │        ├── Cryptographic strength audit (TLS 1.3/1.2, RSA 2048+, ECC)
       │        └── Certificate Transparency audit (crt.sh historical logs)
       │
       ▼
EVIDENCE AGGREGATION ENGINE
       │
       ▼
EXPLAINABLE RISK ASSESSMENT ENGINE
       │ Evaluates indicators, applies category saturation caps, computes confidence
       ▼
AI EXPLANATION LAYER
       │ Synthesizes findings; deterministic fallback when LLM unavailable
       ▼
HOSTED DATABASE LAYER (Neon / Supabase PostgreSQL with NullPool)
       │ AnalysisReports, Findings, ThreatIndicators
       ▼
WEB3 ANCHORING ENGINE (Sepolia Testnet)
       │ Deterministic SHA-256 report commitment published to decentralized registry
       ▼
STRUCTURED REPORT OUTPUT -> REACT DASHBOARD
```

---

### 2. Module Decoupling and Multi-Domain Convergence

#### Domain 1: Artificial Intelligence (AI)
- **Role**: Translation of complex raw telemetry into human-comprehensible summaries and prescriptive recommendations.
- **Security Boundary**: The AI layer does not invent data, DNS records, or vendor reputations. It accepts verified findings from the cybersecurity engine and is strictly isolated against prompt injection.

#### Domain 2: Cybersecurity (Modules 1 & 2)
- **Role**: Deterministic threat detection, SSRF protection, RFC compliance, cryptographic verification, and TLS trust analysis.
- **Operational Rule**: Absence of evidence is not evidence of absence. A valid HTTPS certificate or 0/70 detections on VirusTotal never automatically classifies a URL as `SAFE`.

#### Domain 3: Web3 (Ethereum Sepolia Testnet)
- **Role**: Decentralized, tamper-evident record keeping.
- **Integration Point**: The `AnalysisReport` records generate a deterministic SHA-256 cryptographic commitment anchoring the URL, domain, risk classification, and score. This hash is published to an EVM testnet registry to establish immutable provenance.

---

### 3. Vercel Serverless Architecture & Database Pooling

To ensure scalable, zero-maintenance hosting without container overhead:
1. **Frontend**: Built via `vite build` into static assets hosted on Vercel's global CDN with SPA rewrites (`/index.html`).
2. **Backend**: Implemented via Vercel Python Functions routed through `api/index.py` and `vercel.json` rewrites (`/api/(.*)` -> `/api/index.py`).
3. **Connection Pooling (`NullPool`)**:
   - Serverless functions freeze or terminate between requests. Standard connection pools can easily exhaust database connections in hosted environments like Neon or Supabase.
   - `connection.py` automatically detects serverless environments (`VERCEL=1`, `neon.tech`, `supabase.co`) and applies SQLAlchemy's `NullPool`. Each request opens and closes a connection cleanly without lingering idle processes.
4. **Timeouts & Execution Budgets**:
   - Vercel functions have strict execution limits (10s on Hobby tier).
   - All network tasks (DNS: 2.0s, Redirects: 3.5s, TLS handshake: 3.5s, Threat Intel: 4.0s) run concurrently via `asyncio.gather(..., return_exceptions=True)`. The entire pipeline completes in < 4 seconds.

---

### 4. Database Schema Design (SQLAlchemy)

```
┌─────────────────────────────────┐
│         AnalysisReports         │
├─────────────────────────────────┤
│ id: String (UUID) [PK]          │
│ submitted_url: Text             │
│ normalized_url: Text            │
│ domain: String [Indexed]        │
│ risk_level: String [Indexed]    │
│ risk_score: Float (0-100)       │
│ confidence: Float (0.0-1.0)     │
│ summary: Text                   │
│ analysis_status: String         │
│ created_at: DateTime [Indexed]  │
│ details: JSON                   │
└────────────────┬────────────────┘
                 │ 1
                 │
                 │ *
┌────────────────┴────────────────┐       ┌─────────────────────────────────┐
│            Findings             │       │        ThreatIndicators         │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ id: String (UUID) [PK]          │       │ id: String (UUID) [PK]          │
│ report_id: String [FK]          │       │ indicator_type: String          │
│ category: String                │       │ indicator_value: Text [Indexed] │
│ indicator: String               │       │ threat_category: String         │
│ severity: String (INFO..CRIT)   │       │ source: String                  │
│ description: Text               │       │ first_seen: DateTime            │
│ source: String                  │       │ last_seen: DateTime             │
│ confidence: Float               │       └─────────────────────────────────┘
│ evidence: JSON                  │
│ observed_at: DateTime           │
└─────────────────────────────────┘
```
