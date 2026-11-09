# PhishFree — Frontend Application

Modern, responsive cybersecurity intelligence dashboard for AI-powered web threat detection, digital trust analysis, social engineering defense, and decentralized blockchain verification.

## Live Production Deployment
- **Live Application:** [https://phishfree-rust.vercel.app](https://phishfree-rust.vercel.app)
- **Live Backend API Target:** [https://phishfree-api.vercel.app/api/v1](https://phishfree-api.vercel.app/api/v1)

---

## Technology Stack
- **React 18** with **TypeScript 5.5**
- **Vite** modern ESM build tooling
- **Tailwind CSS 3.4** with dual-theme system (Cyber Dark / Daylight High-Contrast Light)
- **React Router v6** with protected route guards (`AuthGuard`)
- **Recharts** for SVG risk distribution donuts and metric breakdowns
- **Lucide React** for enterprise security iconography
- **Axios** with automatic cookie and Bearer session management

---

## Responsive & Adaptive Interface

Tested and optimized across all device categories:
- **Small Smartphones (320px–360px)**: Compact cards, responsive gauges, wrapped tables.
- **Standard Smartphones (375px–430px)**: Slide-out touch navigation drawer, stacked metric widgets.
- **Tablets (600px–900px)**: Adaptive 2-column grids, collapsible sidebar.
- **Laptops & Desktops (1024px–1920px)**: Full multi-column cockpit, persistent left sidebar.
- **Ultrawide Displays (1920px+)**: Centered max-width containers maintaining visual balance.

### Dual-Mode Theme Toggle
- **Dim Cybersecurity Mode**: Deep `#0d1117` dark palette accented with high-visibility `#FFD000` indicators.
- **Light Corporate Mode**: High-contrast blue corporate cybersecurity theme engineered for daytime audits.

---

## Application Views & Navigation

1. **User Authentication (`/login`, `/register`)**:
   - Secure login with memory-hard Argon2id hash verification.
   - One-click **"Fill Demo Analyst Credentials"** button (`analyst@phishfree.io` / `Password123!`).
   - Self-registration with NIST password strength meter.
   - Cryptographic single-use password recovery (`/forgot-password`, `/reset-password`).
2. **Unified Command Dashboard (`/`)**:
   - Real-time aggregate counters (Threats Blocked, Active Campaigns, Monitored Domains, Detection Accuracy).
   - Interactive Recharts Donut risk breakdown.
   - Instant hero fast-scanner bar.
   - Recent investigation log with sliding Incident Snapshot Drawer.
3. **URL Threat Scanner (`/scanner`)**:
   - 6-stage animated forensic pipeline (Validation -> Typosquatting -> DNS -> Redirects -> Threat Intel -> AI Synthesis).
   - Benchmark demonstration target pills (Official site, brand typosquatting, Punycode homoglyph, IP host, SSRF loopback intercept).
4. **AI Scam Analyzer (`/scam-analyzer`)**:
   - Social engineering heuristic engine for SMS, emails, and chat lures.
   - Automatic PII masking (passwords, OTPs, card numbers).
   - Entity extraction for crypto wallets (BTC, ETH, SOL), phone numbers, and pivot URLs.
5. **Passive Website Security (`/security`)**:
   - Passive posture audit across 9 defensive HTTP headers (HSTS, CSP, X-Frame-Options, COOP...).
   - Privacy-preserving cookie security audit (`Secure`, `HttpOnly`, `SameSite`).
   - Mixed active and passive content detection.
   - `security.txt` and `robots.txt` compliance scoring with copy-ready remediation directives.
6. **Threat Intelligence & Topology (`/threat-intel`)**:
   - Interactive SVG relationship graph connecting URLs, Root Domains, Hosting IPs, and TLS Certificates.
   - Dynamic 2-hop neighborhood expansion and campaign pattern clustering.
7. **Web3 Threat Registry (`/blockchain`)**:
   - Ethereum Sepolia testnet console with live JSON-RPC node status.
   - Keccak-256 report fingerprinting and Etherscan transaction receipt tracking.
   - Independent tamper-verification tool (`VERIFIED` vs `TAMPERED`).
8. **Forensic Analysis Report Dossier (`/reports/:id`)**:
   - Multi-tab investigative dossier (Findings, Domain, DNS, Redirect Hops, TLS Trust, Threat Feeds, Raw JSON).
9. **Investigation History (`/history`)**:
   - Filterable, searchable audit trail of previous investigations by risk level, domain, or timestamp.

---

## Local Development Setup

### Prerequisites
Node.js 18+ and npm.

### Installation
```bash
cd frontend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development Server
```bash
npm run dev
```
The interface will open at `http://localhost:5173`.

### Production Build Verification
```bash
npm run build
```
Build output is generated in `frontend/dist/` with zero TypeScript compiler errors.
