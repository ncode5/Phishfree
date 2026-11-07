# Digital Trust Intelligence - Frontend

Modern cybersecurity dashboard for AI-Powered Web Threat Detection & Digital Trust Intelligence.

## Technology Stack
- **React 18** with **TypeScript**
- **Vite** build tooling
- **Tailwind CSS** with dark-mode cybersecurity SaaS aesthetic
- **React Router v6** for client-side routing
- **Recharts** for risk distribution and telemetry metrics
- **Lucide React** for icons
- **Axios** for API client communication

## User Experience & Pages
1. **Security Dashboard (`/`)**: Real-time aggregate counters (Total URLs, Confirmed Malicious, High-Risk, Suspicious, Low-Risk), interactive Recharts Donut risk breakdown, preset quick-scan triggers, and recent investigations log.
2. **URL Threat Scanner (`/scanner`)**: Cyber scanning console with multi-stage animated verification pipeline, validation indicators, preset demo targets (safe, typosquatting lookalike, IP host, Punycode, SSRF blocked), and actionable error handling.
3. **Forensic Analysis Report (`/reports/:id`)**: Comprehensive security dossier with dedicated tabs:
   - **Evidence Findings**: Granular security anomalies with severity badges.
   - **Domain & Typosquatting**: Subdomain depth, Punycode, Levenshtein brand similarity.
   - **DNS Records**: A, AAAA, MX, NS, and TXT record tables.
   - **Redirect Chain**: Hop-by-hop HTTP status and IP tracer.
   - **Threat Intelligence**: VirusTotal detection statistics.
   - **TLS & Digital Trust (Module 2)**: HTTPS status, X.509 certificate metadata, validity & remaining days, SAN domain matching, cipher suite, public key size, chain trust verification, and crt.sh Certificate Transparency audit logs.
   - **Sepolia Web3 Registry**: Deterministic SHA-256 report commitment publishing to Ethereum Sepolia Testnet.
4. **Investigation History (`/history`)**: Filterable, searchable audit trail of previous scans with real-time classification filters and quick inspection links.
5. **About & Architecture (`/about`)**: Architectural whitepaper detailing the convergence of AI, Cybersecurity, and Web3.

## Vercel Deployment

### Unified Monorepo
When deploying the repository root to Vercel, the root `vercel.json` automatically builds the frontend and sets `frontend/dist` as the output directory.

### Isolated Frontend Deployment
If deploying the frontend independently:
1. In Vercel, set the Root Directory to `frontend`.
2. Configure environment variable:
   ```env
   VITE_API_BASE_URL=https://your-backend.vercel.app/api/v1
   ```
3. Deploy! SPA client-side routing is configured via `frontend/vercel.json`.

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
Default contents:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Development Server
```bash
npm run dev
```
The app will run at `http://localhost:5173`.

### Production Build Verification
```bash
npm run build
```
Build output is generated in `frontend/dist/`.
