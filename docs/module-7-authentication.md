# Module 7: User Authentication, Session Security & Role-Based Access Control

## PhishFree — AI-Powered Web Threat Detection & Digital Trust Intelligence

### 1. Executive Summary & Objective

**Module 7: User Authentication & Role-Based Access Control (RBAC)** provides enterprise-grade identity federation, cryptographic credential protection, session security, and authorization controls for the PhishFree platform.

Designed to meet SOC2 and NIST SP 800-63B guidelines, Module 7 ensures that incident responders, threat analysts, and system administrators can securely authenticate, investigate threats, and execute administrative functions with zero risk of credential leakage.

---

### 2. Core Security Architecture & Design Decisions

#### 2.1 Cryptographic Password Hashing (Argon2id)
- **Algorithm**: `Argon2id` (the winner of the Password Hashing Competition, combining data-dependent and data-independent memory access).
- **GPU & ASIC Resistance**: Configured with production-grade memory cost (64 MB), time cost (3 iterations), and parallelism (4 threads) to prevent high-speed dictionary and rainbow table attacks.
- **Salting**: Generates a unique, cryptographically random salt per user digest automatically.

#### 2.2 Stateless Session Security (JWT)
- **Token Format**: Standard JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`).
- **Transport Security**:
  - **HttpOnly Cookies**: Browser clients store the session in a cookie marked `HttpOnly`, preventing JavaScript access and neutralizing Cross-Site Scripting (XSS) token theft.
  - **SameSite Protection**: Set to `SameSite=Lax` to protect against Cross-Site Request Forgery (CSRF).
  - **Secure Flag**: Automatically enforced in production (`Secure=True`) to ensure cookies only transmit over TLS/HTTPS.
  - **Bearer Header Support**: Dual-support allows programmatic API consumers and automated SOAR pipelines to supply `Authorization: Bearer <token>` in request headers.
- **Expiration Policy**:
  - Default session: 24 hours (`1440` minutes).
  - Extended "Remember Me" session: 7 days.

#### 2.3 Role-Based Access Control (RBAC)
- **Roles Hierarchy**:
  - `security_analyst`: Can execute scans, view forensic reports, analyze messages, inspect website configurations, anchor threat digests to blockchain, and view correlation topologies.
  - `admin` / `superadmin`: Inherits all analyst permissions plus platform administrative overview (`/api/v1/auth/admin/status`) and user directory management (`/api/v1/auth/admin/users`).
- **Enforcement**: Decorator-level dependency injection (`Depends(get_current_user)` and `Depends(get_current_admin_user)`) guarantees authorization before route handlers execute.

#### 2.4 Cryptographic Single-Use Password Reset
- **Anti-Enumeration**: The `/forgot-password` endpoint always returns a generic success message regardless of whether the email address exists in the database.
- **Storage Protection**: Reset tokens are never stored in plaintext. The database only stores a 32-byte `SHA-256` digest (`token_hash`) of the token.
- **Lifecycle**: Strictly single-use (`is_used=1` on consumption) with a 60-minute expiration window.

#### 2.5 Automated Seeding for Sandbox & Testing
On startup (`connection.py -> init_db()`), the system checks for demonstration accounts and non-destructively provisions them if absent:
- **Default Analyst**: `analyst@phishfree.io` (Password: `Password123!`, Role: `security_analyst`)
- **Default Administrator**: `admin@phishfree.io` (Password: `AdminPassword123!`, Role: `admin`)

---

### 3. Database Schema

```
┌────────────────────────────────────────────────────────┐
│                         users                          │
├────────────────────────────────────────────────────────┤
│ id: String(36) [PK, UUID]                              │
│ full_name: String(100)                                 │
│ email: String(255) [Unique, Indexed]                   │
│ password_hash: String(255) [Argon2id Digest]           │
│ role: String(50) [security_analyst / admin / superadmin│
│ account_status: String(50) [ACTIVE / SUSPENDED]        │
│ is_active: Integer (1=active, 0=disabled)              │
│ is_verified: Integer (1=verified, 0=unverified)        │
│ last_login: DateTime [UTC, Nullable]                   │
│ created_at: DateTime [UTC]                             │
│ updated_at: DateTime [UTC]                             │
└──────────────────────────┬─────────────────────────────┘
                           │ 1
                           │
                           │ *
┌──────────────────────────┴─────────────────────────────┐
│                 password_reset_tokens                  │
├────────────────────────────────────────────────────────┤
│ id: String(36) [PK, UUID]                              │
│ user_id: String(36) [FK -> users.id, Indexed]          │
│ token_hash: String(64) [SHA-256 Digest, Indexed]       │
│ expires_at: DateTime [UTC]                             │
│ is_used: Integer (0=unused, 1=used)                    │
│ created_at: DateTime [UTC]                             │
└────────────────────────────────────────────────────────┘
```

---

### 4. API Endpoints Reference

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | Register a new analyst account with Argon2id password hashing |
| `POST` | `/api/v1/auth/login` | Public | Authenticate analyst credentials and issue session JWT / HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Public | Terminate active session and clear HttpOnly cookie |
| `GET` | `/api/v1/auth/me` | Authenticated | Retrieve active user profile, assigned role, and last login timestamp |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request time-limited single-use password reset token |
| `POST` | `/api/v1/auth/reset-password` | Public | Complete password reset using cryptographic token |
| `GET` | `/api/v1/auth/admin/status` | Admin Only | Administrative overview with registered user counts and operational health |
| `GET` | `/api/v1/auth/admin/users` | Admin Only | List all registered platform users with assigned roles |

---

### 5. Automated Verification & Testing

Module 7 is verified through automated unit and integration tests in `backend/tests/test_auth.py`:
- Successful user registration with NIST-compliant password validation.
- Duplicate email rejection.
- Argon2id password verification and incorrect password rejection.
- JWT session issuance and expiration bounds.
- Role-based access control enforcement (analyst blocked from `/admin/*`, admin permitted).
- Single-use password reset lifecycle with token hash verification.
- Anti-enumeration defense verification.

