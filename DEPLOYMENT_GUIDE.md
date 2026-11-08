# PhishFree — Production Deployment Guide for Vercel

This guide provides end-to-end instructions for deploying **PhishFree** (Cybersecurity Intelligence and Web Threat Detection Platform) to production on [Vercel](https://vercel.com).

---

## 🌟 Active Live Production Deployments

The platform is officially deployed, hardened, and active on Vercel:

| Target | Production URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | [https://phishfree-rust.vercel.app](https://phishfree-rust.vercel.app) | React + Vite + TypeScript Cybersecurity Intelligence SPA |
| **Backend Serverless API** | [https://phishfree-api.vercel.app](https://phishfree-api.vercel.app) | FastAPI Python Serverless Engine on Vercel |
| **Interactive OpenAPI Docs** | [https://phishfree-api.vercel.app/docs](https://phishfree-api.vercel.app/docs) | Swagger UI for interactive endpoint testing |
| **Health Check Endpoint** | [https://phishfree-api.vercel.app/api/v1/health](https://phishfree-api.vercel.app/api/v1/health) | Live runtime diagnostic and database verification |

> [!NOTE]
> **Understanding Preview URLs vs Production URLs**:
> During builds, Vercel generates preview URLs for each deployment hash (such as `phishfree-p3piuy67c-niru22.vercel.app` or `phishfree-j2j561w0b-niru22.vercel.app`).
> - **Backend Preview URLs**: Serving the FastAPI JSON API only. Opening these URLs in a standard web browser displays the JSON root `{"project": ...}` or `{"detail": "Not Found"}` because there is no HTML UI hosted on the backend.
> - **Frontend Production URL**: [https://phishfree-rust.vercel.app](https://phishfree-rust.vercel.app) is the complete web application with the full interactive dashboard, scanner, threat graph, and authentication interface.

---

## 1. Architecture Overview

PhishFree supports **two production deployment topologies** on Vercel:

| Deployment Pattern | Description | Best Suited For |
| :--- | :--- | :--- |
| **Option A: Microservices (Recommended)** | Two distinct Vercel projects: `phishfree` (Frontend) and `phishfree-api` (Backend). | Independent scaling, isolated deployments, clear separation of concerns. |
| **Option B: Unified Monorepo** | Single Vercel project serving static frontend SPA and routing `/api/*` to Python serverless functions. | Simple single-click deployment, shared domain, zero CORS configuration needed. |

Both patterns are pre-configured in the repository with optimized `vercel.json` configurations.

---

## 2. Database Setup (Crucial Requirement)

> [!IMPORTANT]
> **Vercel Serverless File System Constraint**:
> Vercel executes serverless functions in ephemeral, read-only containers (`/var/task`). Although PhishFree falls back to `/tmp/trust_intel.db` if no database is specified, data written to `/tmp` **does not persist** across cold starts.
> **For production authentication, persistent incident reports, and audit logs, a hosted PostgreSQL database is required.**

### Recommended PostgreSQL Providers (Free / Serverless):
1. **Neon Serverless Postgres** ([neon.tech](https://neon.tech)) — Recommended. Built-in connection pooling (`-pooler`), instant branching, zero-maintenance.
2. **Supabase** ([supabase.com](https://supabase.com)) — Managed PostgreSQL with connection pooling on port 6543.
3. **Vercel Postgres** (powered by Neon) — Directly integrated into the Vercel dashboard.

### Database Connection String Format:
Ensure SSL is enabled by appending `?sslmode=require` to your connection string:
```text
postgresql://<user>:<password>@<pooler-host>.neon.tech/<dbname>?sslmode=require
```

### Automatic Migration & Schema Provisioning:
PhishFree includes automated, non-destructive schema synchronization and initial account seeding:
- Runs automatically on cold-start via `app/database/connection.py` -> `init_db()`.
- Automatically executes `Base.metadata.create_all()` for all models:
  - `analysis_reports`
  - `findings`
  - `threat_indicators`
  - `tls_scans`
  - `users`
  - `password_reset_tokens`
- Seeds default demonstration accounts if the user table is empty:
  - **Security Analyst**: `analyst@phishfree.io` (Password: `Password123!`, Role: `security_analyst`)
  - **Administrator**: `admin@phishfree.io` (Password: `AdminPassword123!`, Role: `admin`)

---

## 3. Environment Variables Reference

### Backend Variables (`phishfree-api`)

| Variable Name | Required? | Example / Default Value | Purpose |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | **Yes** | `production` | Enables production hardening, secure cookies, and suppresses dev tokens. |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@pooler.neon.tech/db?sslmode=require` | Persistent PostgreSQL database connection string. |
| `JWT_SECRET_KEY` | **Yes** | `openssl rand -hex 32` *(e.g. 64 hex characters)* | Cryptographic HMAC secret for signing and verifying session JWTs. |
| `JWT_ALGORITHM` | No | `HS256` | JWT signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `1440` *(24 hours)* | Token lifetime for standard sessions. |
| `REMEMBER_ME_EXPIRE_DAYS` | No | `7` | Token lifetime when "Remember me" is checked. |
| `COOKIE_SECURE` | No | `True` | Forces `Secure; HttpOnly; SameSite=Lax` cookie flags on HTTPS. |
| `ALLOWED_ORIGINS` | **Yes** | `https://phishfree.vercel.app,https://*.vercel.app` | Comma-separated origins allowed to make cross-origin requests. |
| `VIRUSTOTAL_API_KEY` | Optional | `your_virustotal_v3_api_key` | Real-time threat intelligence lookup. If empty, internal heuristic engine is used. |
| `GEMINI_API_KEY` | Optional | `your_google_gemini_api_key` | AI threat narrative analysis. If empty, deterministic forensic explanations are used. |
| `BLOCKCHAIN_RPC_URL` | No | `https://ethereum-sepolia-rpc.publicnode.com` | Ethereum Sepolia testnet RPC endpoint. |
| `SEPOLIA_CHAIN_ID` | No | `11155111` | Sepolia network ID. |
| `CONTRACT_ADDRESS` | No | `0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8` | Verified immutable threat registry contract. |
| `PRIVATE_KEY` | Optional | `0xabcdef...` | Wallet private key used by backend to publish hashes on-chain. If empty, read operations remain live and write transactions are emulated locally. |

### Frontend Variables (`phishfree`)

| Variable Name | Required? | Example / Default Value | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://phishfree-api.vercel.app/api/v1` | Public URL of the deployed FastAPI backend. *(Set to `/api/v1` if using Option B Unified deployment).* |

---

## 4. Option A: Step-by-Step Microservices Deployment (Recommended)

### Step 1: Deploy the Backend (`phishfree-api`)

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Select your imported GitHub repository: `https://github.com/ncode5/Phishfree`.
3. In the configuration modal:
   - **Project Name**: `phishfree-api`
   - **Framework Preset**: `Other`
   - **Root Directory**: Click *Edit* and select **`backend`**.
   - **Build & Development Settings**: Leave blank / default.
4. Expand **Environment Variables** and enter:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = *(Your Neon or Supabase PostgreSQL connection string)*
   - `JWT_SECRET_KEY` = *(Run `openssl rand -hex 32` in terminal and paste value)*
   - `COOKIE_SECURE` = `True`
   - `ALLOWED_ORIGINS` = `https://*.vercel.app` *(or your planned frontend domain)*
   - `VIRUSTOTAL_API_KEY` = *(optional)*
   - `GEMINI_API_KEY` = *(optional)*
   - `BLOCKCHAIN_RPC_URL` = `https://ethereum-sepolia-rpc.publicnode.com`
   - `CONTRACT_ADDRESS` = `0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8`
5. Click **Deploy**.
6. When deployment finishes, note down your assigned URL (e.g. `https://phishfree-api.vercel.app`).
7. Verify by opening in browser: `https://phishfree-api.vercel.app/api/v1/health` or `/docs`.

---

### Step 2: Deploy the Frontend (`phishfree`)

1. In Vercel, click **Add New...** -> **Project**.
2. Select the same GitHub repository: `https://github.com/ncode5/Phishfree`.
3. In the configuration modal:
   - **Project Name**: `phishfree`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and enter:
   - `VITE_API_BASE_URL` = `https://phishfree-api.vercel.app/api/v1` *(replace with your actual backend URL from Step 1)*
5. Click **Deploy**.
6. Once deployed, note your frontend URL (e.g. `https://phishfree.vercel.app`).

---

### Step 3: Complete CORS Handshake

1. Return to the **Backend Project** (`phishfree-api`) on Vercel.
2. Go to **Settings** -> **Environment Variables**.
3. Update `ALLOWED_ORIGINS` to include your exact frontend URL:
   ```text
   https://phishfree.vercel.app,https://*.vercel.app
   ```
4. Click **Redeploy** on the latest backend deployment to apply the updated origin.

---

## 5. Option B: Unified Single-Project Deployment

If you prefer deploying the entire platform under a single Vercel domain without managing cross-origin headers:

1. Import the repository into Vercel.
2. Set **Root Directory** to `./` (repository root).
3. Set **Framework Preset** to `Vite`.
4. The root [`vercel.json`](file:///c:/Users/HP/Desktop/HAKMATRIX/fish_Ditect/vercel.json) will automatically:
   - Execute `cd frontend && npm install && npm run build`.
   - Publish static frontend assets from `frontend/dist`.
   - Route `/api/(.*)`, `/docs`, `/openapi.json`, and `/health` to `/api/index.py`.
   - Route all single-page application paths to `/index.html`.
5. In **Environment Variables**, provide all backend variables plus:
   - `VITE_API_BASE_URL` = `/api/v1`
6. Click **Deploy**.

---

## 6. Post-Deployment Verification Checklist

After deployment, test the following endpoints to confirm full operational readiness:

### 1. API Health Check
```bash
curl -s https://phishfree-api.vercel.app/api/v1/health
```
**Expected Response**:
```json
{"status":"healthy","database":"connected","timestamp":"...","version":"1.0.0"}
```

### 2. Interactive OpenAPI Documentation
Open in browser:
```text
https://phishfree-api.vercel.app/docs
```

### 3. Analyst Authentication
Test login with the seeded demo credentials:
```bash
curl -X POST https://phishfree-api.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@phishfree.io","password":"Password123!","remember_me":false}'
```

### 4. Admin Authentication & Privilege Separation
Test administrator login and access to admin-only overview:
```bash
# 1. Sign in as Admin
ADMIN_TOKEN=$(curl -s -X POST https://phishfree-api.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@phishfree.io","password":"AdminPassword123!"}' | jq -r .access_token)

# 2. Query Admin Overview
curl -s -X GET https://phishfree-api.vercel.app/api/v1/auth/admin/status \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### 5. Suspicious URL Analysis
```bash
curl -X POST https://phishfree-api.vercel.app/api/v1/analyze/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://account-verify-login.xyz","include_tls":true}'
```

### 6. Decentralized Threat Registry On-Chain Query
```bash
curl -s https://phishfree-api.vercel.app/api/v1/blockchain/status
```

---

## 7. Troubleshooting & FAQ

### Q1: Login fails or returns 500 error after deployment
- **Root Cause**: Database was not configured or SQLite file was attempted on read-only serverless disk.
- **Fix**: Check `DATABASE_URL` in Vercel settings. Ensure it points to a live PostgreSQL database (Neon/Supabase) with `?sslmode=require`.

### Q2: Browser shows CORS Error when making API requests
- **Root Cause**: The frontend domain does not match `ALLOWED_ORIGINS` in backend configuration.
- **Fix**: Set `ALLOWED_ORIGINS` in the backend project to `https://*.vercel.app,https://yourdomain.com`, then redeploy the backend.

### Q3: Serverless Function Timeout (> 10s or 15s)
- **Root Cause**: An external network lookup (VirusTotal, crt.sh, or blockchain RPC) took too long.
- **Fix**: PhishFree has built-in network timeouts:
  - DNS resolution: 2.0s
  - HTTP redirects: 3.5s
  - Overall request: 4.0s
  If an RPC provider is slow, swap `BLOCKCHAIN_RPC_URL` to an Alchemy or Infura private endpoint.

### Q4: Reset password emails are not sending
- **Behavior**: In `production` environment, reset tokens are cryptographically hashed and never returned in API responses to prevent account enumeration. For production email delivery, connect a transactional email provider (SendGrid, Resend, or AWS SES) or verify reset flows in `ENVIRONMENT=development` where tokens are returned directly in the response payload for testing.

