import re
from typing import Dict, Any, List, Tuple
from app.database import schemas


class SecurityHeadersAnalyzer:
    """Evaluates HTTP response headers for defensive web security standards."""

    HEADER_SPECS = {
        "strict-transport-security": {
            "name": "Strict-Transport-Security",
            "purpose": "Enforces HTTPS connections and prevents SSL-stripping man-in-the-middle attacks.",
            "recommended": "max-age=31536000; includeSubDomains; preload"
        },
        "content-security-policy": {
            "name": "Content-Security-Policy",
            "purpose": "Restricts sources of executable scripts, stylesheets, and resources to prevent XSS and code injection.",
            "recommended": "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"
        },
        "x-content-type-options": {
            "name": "X-Content-Type-Options",
            "purpose": "Prevents MIME-confusion attacks and forces browsers to adhere to declared Content-Type.",
            "recommended": "nosniff"
        },
        "x-frame-options": {
            "name": "X-Frame-Options",
            "purpose": "Guards against UI redressing and clickjacking by restricting embedding in iframes.",
            "recommended": "DENY or SAMEORIGIN (or CSP frame-ancestors)"
        },
        "referrer-policy": {
            "name": "Referrer-Policy",
            "purpose": "Protects user privacy and sensitive tokens by controlling how much referrer metadata is sent in outbound requests.",
            "recommended": "strict-origin-when-cross-origin or no-referrer"
        },
        "permissions-policy": {
            "name": "Permissions-Policy",
            "purpose": "Restricts browser feature access (camera, microphone, geolocation, USB, payment) to authorized origins.",
            "recommended": "camera=(), microphone=(), geolocation=(), payment=()"
        },
        "cross-origin-opener-policy": {
            "name": "Cross-Origin-Opener-Policy",
            "purpose": "Ensures top-level document isolation from cross-origin popups, mitigating Spectre-class side-channel attacks.",
            "recommended": "same-origin"
        },
        "cross-origin-resource-policy": {
            "name": "Cross-Origin-Resource-Policy",
            "purpose": "Prevents unauthorized cross-origin sites from loading sensitive responses via no-cors requests.",
            "recommended": "same-origin or same-site"
        },
        "cross-origin-embedder-policy": {
            "name": "Cross-Origin-Embedder-Policy",
            "purpose": "Prevents loading cross-origin resources that do not explicitly grant permission via CORP or CORS.",
            "recommended": "require-corp or credentialless"
        }
    }

    def analyze(
        self,
        headers: Dict[str, str],
        is_https: bool = True
    ) -> Tuple[float, List[schemas.SecurityHeaderEvaluationSchema], List[schemas.SecurityFindingSchema]]:
        """Analyzes observed HTTP headers, rates configurations, and generates granular findings."""
        # Normalize header keys to lowercase
        norm_headers = {k.lower().strip(): v.strip() for k, v in headers.items()}

        evaluations: List[schemas.SecurityHeaderEvaluationSchema] = []
        findings: List[schemas.SecurityFindingSchema] = []

        total_weight = 0.0
        earned_score = 0.0

        # 1. Strict-Transport-Security (HSTS) - Weight: 25
        hsts_val = norm_headers.get("strict-transport-security")
        total_weight += 25.0
        if not is_https:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Strict-Transport-Security",
                    exists=bool(hsts_val),
                    observed_value=hsts_val,
                    security_purpose=self.HEADER_SPECS["strict-transport-security"]["purpose"],
                    assessment="NOT_APPLICABLE",
                    recommended_improvement="HSTS is only effective when served over a valid HTTPS connection."
                )
            )
            # Not penalized heavily if connection itself is plaintext HTTP, but note it
            earned_score += 10.0
        elif not hsts_val:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Strict-Transport-Security",
                    exists=False,
                    observed_value=None,
                    security_purpose=self.HEADER_SPECS["strict-transport-security"]["purpose"],
                    assessment="MISSING",
                    recommended_improvement=self.HEADER_SPECS["strict-transport-security"]["recommended"]
                )
            )
            findings.append(
                schemas.SecurityFindingSchema(
                    category="SECURITY_HEADERS",
                    title="Strict-Transport-Security (HSTS) Header Missing",
                    description="The website operates over HTTPS but does not advertise HSTS. Browsers may allow unencrypted HTTP downgrade attempts.",
                    evidence={"header": "Strict-Transport-Security", "status": "missing"},
                    severity="Medium",
                    confidence=1.0,
                    recommendation="Enable HSTS with 'max-age=31536000; includeSubDomains' to guarantee strict encrypted transit."
                )
            )
        else:
            # Parse HSTS attributes
            max_age_match = re.search(r"max-age=(\d+)", hsts_val, re.IGNORECASE)
            max_age = int(max_age_match.group(1)) if max_age_match else 0
            has_subdomains = "includesubdomains" in hsts_val.lower()
            has_preload = "preload" in hsts_val.lower()

            if max_age >= 10886400:  # >= 18 weeks
                assessment = "STRONG" if has_subdomains else "ACCEPTABLE"
                earned_score += 25.0 if has_subdomains else 20.0
                if not has_subdomains:
                    findings.append(
                        schemas.SecurityFindingSchema(
                            category="SECURITY_HEADERS",
                            title="HSTS Missing includeSubDomains Directive",
                            description="HSTS max-age is adequate, but subdomains are not protected by default.",
                            evidence={"observed": hsts_val, "max_age": max_age},
                            severity="Low",
                            confidence=0.9,
                            recommendation="Add 'includeSubDomains' to HSTS header once all subdomains support HTTPS."
                        )
                    )
            else:
                assessment = "WEAK"
                earned_score += 10.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="SECURITY_HEADERS",
                        title="HSTS max-age Duration Is Too Short",
                        description=f"Observed HSTS max-age is {max_age} seconds, which is less than the recommended 18 weeks (10886400s).",
                        evidence={"observed": hsts_val, "max_age": max_age},
                        severity="Low",
                        confidence=1.0,
                        recommendation="Increase HSTS max-age to at least 31536000 seconds (1 year)."
                    )
                )

            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Strict-Transport-Security",
                    exists=True,
                    observed_value=hsts_val,
                    security_purpose=self.HEADER_SPECS["strict-transport-security"]["purpose"],
                    assessment=assessment,
                    recommended_improvement=None if assessment == "STRONG" else "Add 'includeSubDomains; preload' and set max-age >= 31536000."
                )
            )

        # 2. Content-Security-Policy (CSP) - Weight: 25
        csp_val = norm_headers.get("content-security-policy")
        total_weight += 25.0
        if not csp_val:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Content-Security-Policy",
                    exists=False,
                    observed_value=None,
                    security_purpose=self.HEADER_SPECS["content-security-policy"]["purpose"],
                    assessment="MISSING",
                    recommended_improvement=self.HEADER_SPECS["content-security-policy"]["recommended"]
                )
            )
            findings.append(
                schemas.SecurityFindingSchema(
                    category="SECURITY_HEADERS",
                    title="Content-Security-Policy (CSP) Header Missing",
                    description="No Content-Security-Policy was detected. The browser relies solely on default same-origin protections against XSS and code injection.",
                    evidence={"header": "Content-Security-Policy", "status": "missing"},
                    severity="Medium",
                    confidence=1.0,
                    recommendation="Define an initial restrictive CSP such as: default-src 'self'; script-src 'self'; object-src 'none';"
                )
            )
        else:
            has_unsafe_inline = "'unsafe-inline'" in csp_val
            has_unsafe_eval = "'unsafe-eval'" in csp_val
            has_wildcard = " *" in csp_val or "http:" in csp_val

            if has_unsafe_inline or has_unsafe_eval or has_wildcard:
                assessment = "WEAK"
                earned_score += 12.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="SECURITY_HEADERS",
                        title="Permissive Directives in Content-Security-Policy",
                        description="CSP was observed but includes potentially permissive flags (such as 'unsafe-inline' or 'unsafe-eval') which weaken XSS defense.",
                        evidence={"observed": csp_val[:150]},
                        severity="Low",
                        confidence=0.9,
                        recommendation="Refactor inline scripts to external files and use nonces or SHA-256 hashes instead of 'unsafe-inline'."
                    )
                )
            else:
                assessment = "STRONG"
                earned_score += 25.0

            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Content-Security-Policy",
                    exists=True,
                    observed_value=csp_val[:200] + ("..." if len(csp_val) > 200 else ""),
                    security_purpose=self.HEADER_SPECS["content-security-policy"]["purpose"],
                    assessment=assessment,
                    recommended_improvement=None if assessment == "STRONG" else "Migrate from 'unsafe-inline' to cryptographic nonces or hashes."
                )
            )

        # 3. X-Content-Type-Options - Weight: 15
        xcto_val = norm_headers.get("x-content-type-options")
        total_weight += 15.0
        if xcto_val and "nosniff" in xcto_val.lower():
            earned_score += 15.0
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="X-Content-Type-Options",
                    exists=True,
                    observed_value=xcto_val,
                    security_purpose=self.HEADER_SPECS["x-content-type-options"]["purpose"],
                    assessment="STRONG"
                )
            )
        else:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="X-Content-Type-Options",
                    exists=bool(xcto_val),
                    observed_value=xcto_val,
                    security_purpose=self.HEADER_SPECS["x-content-type-options"]["purpose"],
                    assessment="MISSING" if not xcto_val else "WEAK",
                    recommended_improvement="Set 'X-Content-Type-Options: nosniff'."
                )
            )
            findings.append(
                schemas.SecurityFindingSchema(
                    category="SECURITY_HEADERS",
                    title="X-Content-Type-Options Header Missing",
                    description="Missing 'nosniff' directive allows legacy browsers to MIME-sniff responses away from the declared content-type, potentially executing user uploads as script.",
                    evidence={"header": "X-Content-Type-Options", "status": "missing"},
                    severity="Low",
                    confidence=1.0,
                    recommendation="Configure your web server to send 'X-Content-Type-Options: nosniff' on all responses."
                )
            )

        # 4. X-Frame-Options & CSP frame-ancestors - Weight: 15
        xfo_val = norm_headers.get("x-frame-options")
        total_weight += 15.0
        has_frame_ancestors = csp_val and "frame-ancestors" in csp_val.lower()

        if xfo_val and xfo_val.upper() in ("DENY", "SAMEORIGIN"):
            earned_score += 15.0
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="X-Frame-Options",
                    exists=True,
                    observed_value=xfo_val,
                    security_purpose=self.HEADER_SPECS["x-frame-options"]["purpose"],
                    assessment="STRONG"
                )
            )
        elif has_frame_ancestors:
            # CSP frame-ancestors is the modern replacement
            earned_score += 15.0
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="X-Frame-Options",
                    exists=bool(xfo_val),
                    observed_value=xfo_val,
                    security_purpose=self.HEADER_SPECS["x-frame-options"]["purpose"],
                    assessment="STRONG",
                    recommended_improvement="CSP frame-ancestors directive is active, modernizing clickjacking defense."
                )
            )
        else:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="X-Frame-Options",
                    exists=bool(xfo_val),
                    observed_value=xfo_val,
                    security_purpose=self.HEADER_SPECS["x-frame-options"]["purpose"],
                    assessment="MISSING",
                    recommended_improvement="Set 'X-Frame-Options: DENY' or 'SAMEORIGIN', or use CSP 'frame-ancestors'."
                )
            )
            findings.append(
                schemas.SecurityFindingSchema(
                    category="SECURITY_HEADERS",
                    title="Anti-Clickjacking Protection Missing",
                    description="Neither X-Frame-Options nor CSP frame-ancestors was detected. Adversaries may embed this page within an opaque iframe to conduct clickjacking.",
                    evidence={"x_frame_options": xfo_val, "csp_frame_ancestors": has_frame_ancestors},
                    severity="Low",
                    confidence=1.0,
                    recommendation="Set 'X-Frame-Options: SAMEORIGIN' or configure 'frame-ancestors' in Content-Security-Policy."
                )
            )

        # 5. Referrer-Policy - Weight: 8
        ref_val = norm_headers.get("referrer-policy")
        total_weight += 8.0
        safe_policies = {"no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"}
        if ref_val and any(p in ref_val.lower() for p in safe_policies):
            earned_score += 8.0
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Referrer-Policy",
                    exists=True,
                    observed_value=ref_val,
                    security_purpose=self.HEADER_SPECS["referrer-policy"]["purpose"],
                    assessment="STRONG"
                )
            )
        elif ref_val and "unsafe-url" in ref_val.lower():
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Referrer-Policy",
                    exists=True,
                    observed_value=ref_val,
                    security_purpose=self.HEADER_SPECS["referrer-policy"]["purpose"],
                    assessment="INSECURE",
                    recommended_improvement="Replace 'unsafe-url' with 'strict-origin-when-cross-origin'."
                )
            )
            findings.append(
                schemas.SecurityFindingSchema(
                    category="SECURITY_HEADERS",
                    title="Insecure Referrer-Policy (unsafe-url) Detected",
                    description="The 'unsafe-url' policy leaks full request paths and query parameters to third-party destinations.",
                    evidence={"observed": ref_val},
                    severity="Medium",
                    confidence=1.0,
                    recommendation="Use 'strict-origin-when-cross-origin' to prevent URL parameter leakage across origins."
                )
            )
        else:
            earned_score += 3.0  # Browsers have improved defaults
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Referrer-Policy",
                    exists=bool(ref_val),
                    observed_value=ref_val,
                    security_purpose=self.HEADER_SPECS["referrer-policy"]["purpose"],
                    assessment="MISSING",
                    recommended_improvement="Set 'Referrer-Policy: strict-origin-when-cross-origin'."
                )
            )

        # 6. Permissions-Policy - Weight: 4
        perm_val = norm_headers.get("permissions-policy")
        total_weight += 4.0
        if perm_val:
            earned_score += 4.0
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Permissions-Policy",
                    exists=True,
                    observed_value=perm_val[:100],
                    security_purpose=self.HEADER_SPECS["permissions-policy"]["purpose"],
                    assessment="STRONG"
                )
            )
        else:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name="Permissions-Policy",
                    exists=False,
                    observed_value=None,
                    security_purpose=self.HEADER_SPECS["permissions-policy"]["purpose"],
                    assessment="MISSING",
                    recommended_improvement="Configure Permissions-Policy to disable unnecessary browser features (e.g. camera, microphone)."
                )
            )

        # 7. Cross-Origin Headers (COOP, CORP, COEP) - Weight: 8 total (app dependent)
        coop_val = norm_headers.get("cross-origin-opener-policy")
        corp_val = norm_headers.get("cross-origin-resource-policy")
        coep_val = norm_headers.get("cross-origin-embedder-policy")
        total_weight += 8.0

        coop_score = 3.0 if coop_val in ("same-origin", "same-origin-allow-popups") else 0.0
        corp_score = 3.0 if corp_val in ("same-origin", "same-site") else 0.0
        coep_score = 2.0 if coep_val in ("require-corp", "credentialless") else 0.0
        earned_score += (coop_score + corp_score + coep_score)

        for name, val, purp, rec in [
            ("Cross-Origin-Opener-Policy", coop_val, self.HEADER_SPECS["cross-origin-opener-policy"]["purpose"], "same-origin"),
            ("Cross-Origin-Resource-Policy", corp_val, self.HEADER_SPECS["cross-origin-resource-policy"]["purpose"], "same-origin"),
            ("Cross-Origin-Embedder-Policy", coep_val, self.HEADER_SPECS["cross-origin-embedder-policy"]["purpose"], "require-corp"),
        ]:
            evaluations.append(
                schemas.SecurityHeaderEvaluationSchema(
                    header_name=name,
                    exists=bool(val),
                    observed_value=val,
                    security_purpose=purp,
                    assessment="STRONG" if val else "MISSING",
                    recommended_improvement=None if val else f"Optionally set '{name}: {rec}' if application isolation is required."
                )
            )

        # Calculate normalized score (0 - 100)
        final_score = round(min(100.0, max(0.0, (earned_score / total_weight) * 100.0)), 1)
        return final_score, evaluations, findings

