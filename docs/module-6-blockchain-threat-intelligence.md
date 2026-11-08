# Module 6: Decentralized Threat Intelligence using Blockchain

## PhishFree — AI-Powered Web Threat Detection & Digital Trust Intelligence

### 1. Executive Summary & Objective

**Module 6: Decentralized Threat Intelligence using Blockchain** implements an EVM-compatible decentralized registry on the **Ethereum Sepolia Testnet** for cryptographic report integrity, timestamped proof-of-existence, and independent tamper verification.

### Core Principle & Educational Boundary
> **Integrity vs. Threat Intent:**  
> The blockchain record proves report integrity, timestamped provenance, and immutability. It verifies whether a report presented today is bit-for-bit identical to the report generated earlier.  
> **The blockchain does NOT independently determine whether a website is malicious.**  
> Modules 1–5 perform threat analysis; Module 6 provides cryptographic auditability for the resulting intelligence.

---

## 2. End-to-End Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────┐
                      │             User / Security Analyst           │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          React Frontend (Vite / TS)          │
                      │       Decentralized Threat Intelligence      │
                      └──────────────────────┬───────────────────────┘
                                             │ HTTP REST API
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          FastAPI Backend Application         │
                      └──────────────────────┬───────────────────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
                     ▼                                               ▼
       ┌───────────────────────────┐                   ┌───────────────────────────┐
       │   Report Canonicalizer    │                   │   PostgreSQL / SQLite     │
       │  (Key sorting, float norm,│                   │  - AnalysisReports        │
       │   UI & tx field exclusion)│                   │  - MessageAnalysisReports │
       └─────────────┬─────────────┘                   │  - WebsiteSecurityReports │
                     │ Canonical UTF-8 Bytes           │  - BlockchainRegistrations│
                     ▼                                 └─────────────┬─────────────┘
       ┌───────────────────────────┐                                 │
       │    Report Hash Service    │                                 │
       │    Ethereum Keccak-256    │                                 │
       │   (0x + 64 hex chars)     │                                 │
       └─────────────┬─────────────┘                                 │
                     │ 32-Byte Hash Digest                           │
                     ▼                                               ▼
       ┌─────────────────────────────────────────────────────────────┴─┐
       │                 Report Verification Service                   │
       │        (Orchestrates On-Chain Checks & Audit Logic)           │
       └─────────────────────────────┬─────────────────────────────────┘
                                     │ Web3.py (RPC HTTPProvider)
                                     ▼
       ┌───────────────────────────────────────────────────────────────┐
       │               Ethereum Sepolia Testnet (EVM)                  │
       │                                                               │
       │  ThreatReportRegistry.sol (0x...)                             │
       │  ├── registerReport(bytes32 reportHash)                       │
       │  ├── verifyReport(bytes32 reportHash)                         │
       │  └── Event: ReportRegistered(hash, submitter, timestamp)      │
       └─────────────────────────────┬─────────────────────────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │     Sepolia Etherscan        │
                      │  Public Immutable Audit Trail │
                      └──────────────────────────────┘
```

---

## 3. Smart Contract Design: `ThreatReportRegistry.sol`

- **Location:** `blockchain/contracts/ThreatReportRegistry.sol`
- **Solidity Version:** `^0.8.20`
- **License:** MIT

### Storage Layout
```solidity
struct ThreatReport {
    bytes32 reportHash;
    uint256 timestamp;
    address submitter;
    bool exists;
}

mapping(bytes32 => ThreatReport) public reports;
bytes32[] public reportHashes;
uint256 public totalReportsRegistered;
address public immutable owner;
```

### Methods
1. `registerReport(bytes32 reportHash) external returns (bool success)`
   - Rejects `bytes32(0)` zero hashes (`require(reportHash != bytes32(0), "Invalid report hash: zero hash rejected")`).
   - Prevents duplicate registration (`require(!reports[reportHash].exists, "Report hash already registered")`).
   - Records block timestamp, sender address, and marks `exists = true`.
   - Appends to `reportHashes` array and increments `totalReportsRegistered`.
   - Emits `ReportRegistered(bytes32 indexed reportHash, address indexed submitter, uint256 timestamp)`.
2. `verifyReport(bytes32 reportHash) external view returns (bool exists, bytes32 registeredHash, uint256 timestamp, address submitter)`
   - View method returning registration status, stored hash, timestamp, and submitter address.
3. `isReportRegistered(bytes32 reportHash) external view returns (bool)`
   - Boolean check of report presence.
4. `getRecentReports(uint256 count) external view returns (ThreatReport[] memory)`
   - Returns up to `count` recent registered reports in reverse chronological order for live dashboard exploration.

---

## 4. Report Canonicalization & Keccak-256 Hashing

Hashing raw JSON strings produces non-deterministic digests due to differing whitespace, key ordering, or timestamp representations across serialization libraries.

### Canonicalization Algorithm (`app.services.report_canonicalizer.py`)
1. **Key Sorting:** Object keys are recursively sorted in lexicographical order at all nesting levels.
2. **Exclusion of Transient Metadata:** Top-level UI and blockchain fields (`is_loading`, `temporary_id`, `client_timestamp`, `transaction_hash`, `block_number`, `registered_at`, `contract_address`, `explorer_url`) are stripped.
3. **Data Type Normalization:**
   - Float values are rounded to 2 decimal places (`round(val, 2)`), resolving IEEE 754 precision discrepancies.
   - Timestamps are formatted as canonical UTC ISO 8601 strings (`YYYY-MM-DDTHH:MM:SSZ`).
   - Findings lists are deterministically sorted by `(category, indicator, severity)`.
4. **Serialization:** Encoded with compact delimiters `(separators=(',', ':'))` as UTF-8 bytes.

### Cryptographic Hashing (`app.services.report_hash_service.py`)
- Standard **Ethereum Keccak-256** (via `eth_utils.keccak`), producing a 32-byte hash formatted with a `0x` prefix and 64 lowercase hex characters.
- **Critical Distinction:** Ethereum Keccak-256 is compatible with Solidity `keccak256()`, differing from the NIST FIPS 202 SHA3-256 padding standard.

---

## 5. Verification States & Logic

When a report is audited via `GET /api/v1/blockchain/verify/{report_id}`:

| Verification Status | Integrity Verified | Condition & Security Meaning |
|---|---|---|
| **`VERIFIED`** | **`true`** | The recomputed report hash matches the on-chain hash recorded on Ethereum Sepolia. Proven authentic and unmodified. |
| **`TAMPERED`** | **`false`** | A confirmed on-chain registration exists for this report ID, but the recalculated report hash differs. Findings, risk scores, or URLs were modified post-registration. |
| **`NOT_REGISTERED`** | **`false`** | No cryptographic fingerprint has been recorded on-chain for this report. |
| **`PENDING`** | **`false`** | An on-chain registration transaction was broadcast but has not yet been included in a confirmed block. |
| **`UNAVAILABLE`** | **`false`** | The EVM JSON-RPC provider or smart contract could not be reached. The system refuses to assume pass or fail. |

---

## 6. Database Schema Design (`models.BlockchainReportRegistration`)

```
┌────────────────────────────────────────────────────────┐
│             blockchain_report_registrations            │
├────────────────────────────────────────────────────────┤
│ id: String(36) [PK, UUID]                              │
│ report_id: String(36) [Indexed]                        │
│ report_type: String(50) [URL / MESSAGE / SECURITY]     │
│ report_hash: String(66) [Indexed, Keccak-256]          │
│ canonical_payload: JSON                                │
│ network: String(50) (e.g., Ethereum Sepolia)          │
│ chain_id: Integer (11155111)                           │
│ contract_address: String(42)                           │
│ transaction_hash: String(66) [Indexed]                 │
│ block_number: Integer                                  │
│ submitter_address: String(42)                          │
│ registration_status: String(50) (CONFIRMED/FAILED)     │
│ verification_status: String(50) (VERIFIED/TAMPERED...) │
│ registered_at: DateTime [UTC]                          │
│ last_verified_at: DateTime [UTC]                       │
│ error_message: Text                                    │
│ created_at: DateTime [UTC]                             │
└────────────────────────────────────────────────────────┘
```

> **Security Rule:** Private keys, seed phrases, and credentials are **NEVER** stored in the database.

---

## 7. REST API Reference

### 1. Check Blockchain Network & Registry Status
- **Endpoint:** `GET /api/v1/blockchain/status`
- **Description:** Returns JSON-RPC connection state, latest block number, contract availability, total registered count, wallet address, and recent registrations.

### 2. Register Threat Report on Blockchain
- **Endpoint:** `POST /api/v1/blockchain/register/{report_id}?report_type=URL_ANALYSIS`
- **Description:** Canonicalizes the report, computes its Keccak-256 digest, executes gas and balance pre-flight checks, broadcasts the transaction to `registerReport(bytes32)` on Sepolia, awaits receipt, and persists the registration record.

### 3. Verify Threat Report Integrity
- **Endpoint:** `GET /api/v1/blockchain/verify/{report_id}`
- **Description:** Recomputes the canonical Keccak-256 hash from the database report, queries the smart contract via `verifyReport(bytes32)`, compares fingerprints, and returns `VERIFIED`, `TAMPERED`, `NOT_REGISTERED`, or `UNAVAILABLE`.

### 4. Get Registration Details
- **Endpoint:** `GET /api/v1/blockchain/report/{report_id}`
- **Description:** Retrieves the persisted on-chain transaction hash, block number, submitter address, and canonical payload.

---

## 8. Automated Test Suite Summary

### Smart Contract Tests (`blockchain/test/ThreatReportRegistry.test.js`)
**13 Passing Tests** covering contract deployment, report registration, zero hash rejection, duplicate prevention, verification getters, timestamp recording, submitter recording, event emission, and recent feeds.

### Backend Tests (`backend/tests/test_blockchain_registry.py`)
**18 Passing Tests** covering deterministic canonicalization, Keccak-256 Ethereum vectors, key order invariance, contract address checksumming, simulated/unconfigured handling, on-chain registration flow, duplicate prevention, tamper detection, unregistered detection, RPC outage resilience, gas balance checks, cross-module support (URL, Message, Website Security), and API endpoints.

