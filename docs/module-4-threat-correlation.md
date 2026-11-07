# Module 4: Intelligent Threat Correlation & Campaign Intelligence

## 1. Overview & Objective
Module 4 enhances the PhishFree platform from analyzing individual, isolated indicators to identifying systemic cyber threat campaigns and infrastructure reuse. 

While individual analysis engines evaluate targeted components (e.g., Module 1 inspecting URL structure, Module 2 inspecting TLS handshakes, and Module 3 evaluating social engineering messages), threat actors frequently reuse hosting IPs, deceptive domain clusters, digital certificates, and message lures across multiple attacks.

Module 4 connects findings across Modules 1, 2, and 3, models relationships as a persistent threat graph, runs explainable correlation rules, and computes evidence-grounded risk scores without double-counting.

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
|                           PhishFree Multi-Module Pipeline                         |
+-----------------------------------------------------------------------------------+
   |                             |                               |
   v                             v                               v
[Module 1: URL & DNS]     [Module 2: TLS Trust]     [Module 3: AI Scam Messages]
   |                             |                               |
   +-----------------------------+-------------------------------+
                                 |
                                 v
               +-----------------------------------+
               |        Indicator Normalizer       |
               | (RFC Domains, IPs, URLs, Certs)   |
               +-----------------------------------+
                                 |
                                 v
               +-----------------------------------+
               |        Relationship Builder       |
               | (Graph Nodes, Directed Edges, DB) |
               +-----------------------------------+
                                 |
        +------------------------+------------------------+
        |                                                 |
        v                                                 v
+-------------------------------+              +-------------------------------+
|    Threat Pattern Detector    |              |    Correlation Risk Engine    |
| (8 Explainable Rules & False- |              | (De-duplication, Independent  |
|      Positive Guards)         |              |  Weights & Non-linear Bounds) |
+-------------------------------+              +-------------------------------+
        |                                                 |
        +------------------------+------------------------+
                                 |
                                 v
               +-----------------------------------+
               |   Evidence-Grounded AI Narrative  |
               | (Deterministic Fallback / Gemini) |
               +-----------------------------------+
                                 |
                                 v
             +---------------------------------------+
             | Interactive SVG Threat Topology Graph |
             |    & Platform Telemetry Dashboard     |
             +---------------------------------------+
```

---

## 3. Supported Indicator Types & Normalization

All indicators are normalized before graph linking or comparison to ensure identical entities match regardless of casing, ports, or protocol quirks:

| Indicator Type | Normalization Standard | Example Input | Normalized Identity |
| :--- | :--- | :--- | :--- |
| **Domain** | Lowercase, IDN/Punycode decoded, stripped ports & trailing dots | `HTTP://Secure.EXAMPLE.com:443/.` | `secure.example.com` |
| **URL** | Lowercase scheme/netloc, default ports stripped, fragments dropped, sorted query params | `https://site.org:443/login?b=2&a=1#top` | `https://site.org/login?a=1&b=2` |
| **IP Address** | Canonical IPv4 quad or compressed IPv6 via `ipaddress` | `  2001:0db8:0000:0000::1  ` | `2001:db8::1` |
| **Cert Fingerprint** | Uppercase colon-separated hex or normalized serial number | `aa-bb-cc-dd-ee-ff` | `AA:BB:CC:DD:EE:FF` |
| **Cert Issuer** | Common Name or Organization extracted from X.500 Distinguished Name | `CN=R3, O=Let's Encrypt, C=US` | `Let's Encrypt` |
| **Email** | Lowercase, whitespace stripped | ` Support@Bank-Alert.top ` | `support@bank-alert.top` |
| **Phone Number** | Digits stripped with preserved leading `+` (E.164-like) | `+1 (800) 555-0199` | `+18005550199` |

---

## 4. Graph Schema & Database Design

All graph nodes and directed relationships are stored in the local relational database without requiring external graph engines (e.g. Neo4j) or message brokers:

- **`threat_indicators`**: Stores unique indicators with `indicator_type`, `normalized_value`, `occurrence_count`, `risk_score`, and timestamps (`first_seen`, `last_seen`).
- **`threat_relationships`**: Stores directed edges between indicators with `relationship_type` (e.g., `HOSTED_ON_IP`, `HAS_CERTIFICATE`, `ISSUED_BY_CA`, `EXTRACTED_FROM_MESSAGE`, `REDIRECTS_TO`, `RESOLVES_TO_DOMAIN`), `evidence_source`, and `confidence`.
- **`threat_correlations`**: Records matched attack patterns and campaign clusters tied to specific reports.
- **`correlation_reports`**: Stores overall multi-module correlation syntheses, including full graph topologies, transparent evidence demarcations, and grounded AI narratives.

---

## 5. Correlation Rules & False-Positive Mitigation

Module 4 implements 8 explainable pattern detection rules:

1. **`MULTI_MESSAGE_DOMAIN_APPEARANCE`**: Domain observed across 2 or more independent suspicious message reports.
2. **`MULTIPLE_SUSPICIOUS_URLS_SAME_DOMAIN`**: Multiple suspicious URLs resolve to the same root domain.
3. **`CREDENTIAL_THEFT_LURE_TO_URL`**: URL is extracted from a message containing urgency, KYC fraud, or credential theft language.
4. **`KNOWN_MALICIOUS_THREAT_INTEL`**: Domain or IP matches verified authoritative malicious registries (VirusTotal or local threat indicator registry).
5. **`REUSED_CERTIFICATE_ACROSS_DOMAINS`**: Certificate fingerprint is shared across multiple distinct domains or historical reports.
6. **`SUSPICIOUS_DNS_AND_REDIRECTS`**: Cross-domain redirect hops or SSRF attempts chained with anomalous DNS records.
7. **`MULTI_MODULE_CORROBORATION`**: Independent findings from URL structure (Module 1), TLS trust (Module 2), and Message context (Module 3) corroborate high risk.
8. **`SHARED_HOSTING_NEUTRAL_OBSERVATION`**: Prevents false positives by explicitly recognizing common CDN/Cloudflare IP addresses and marking them as informational rather than malicious.

---

## 6. Correlation Risk Engine Rules

1. **Anti-Double-Counting**: Multiple findings stemming from the same underlying technical observation (e.g., broken TLS in redirects and failed HTTPS handshake) are unified.
2. **Asymptotic Saturation**: Risk increases non-linearly with independent corroboration, capped between 0 and 100.
3. **Confirmed Malicious Guard**: `CONFIRMED_MALICIOUS` is only assigned when verified, authoritative external threat intelligence confirms malicious activity.
4. **Valid TLS != Safe**: A valid Let's Encrypt or DigiCert certificate does not reduce the assessed risk of a typosquatting or phishing landing page.
5. **Missing Evidence != Safe**: When Module 2, Module 3, or external threat intel is unavailable or times out, the engine gracefully handles missing data without falsely declaring the target safe.

---

## 7. API Endpoints

- **`POST /api/v1/correlate`**: Accepts `{ report_id, report_type }` and returns complete correlation report with graph nodes and edges.
- **`GET /api/v1/correlations/{report_id}`**: Retrieves cached or on-demand correlation intelligence for a report.
- **`GET /api/v1/threats/{indicator_id}/related`**: Traverses 1-hop and 2-hop connected graph neighborhood for an indicator.
- **`GET /api/v1/threat-intelligence/overview`**: Aggregated platform metrics (total indicators, unique domains, IPs, certificates, patterns, and recent correlations).

---

## 8. Verification & Test Suite

All 22 specified test scenarios pass with zero warnings and zero regressions:
```bash
python -m pytest backend/tests/test_threat_correlation.py -v
# 22 passed in 2.74s

python -m pytest backend/tests -q
# 89 passed across Modules 1, 2, 3, and 4
```

