import re
from typing import List, Dict, Any, Tuple
from app.database import schemas


class CookieSecurityAnalyzer:
    """Audits Set-Cookie headers for Secure, HttpOnly, and SameSite defensive attributes."""

    SESSION_KEYWORDS = {"session", "sid", "auth", "token", "jwt", "id", "login", "user", "connect.sid", "phpsessid", "jsessionid", "aspsessionid"}

    def analyze(
        self,
        set_cookie_headers: List[str],
        is_https: bool = True
    ) -> Tuple[float, List[schemas.CookieEvaluationSchema], List[schemas.SecurityFindingSchema]]:
        """Parses cookies, redacts values for privacy, audits security attributes, and computes score."""
        evaluations: List[schemas.CookieEvaluationSchema] = []
        findings: List[schemas.SecurityFindingSchema] = []

        if not set_cookie_headers:
            # If no cookies are set, no cookie vulnerabilities exist
            return 100.0, [], []

        total_cookies = len(set_cookie_headers)
        earned_points = 0.0

        for raw_cookie in set_cookie_headers:
            parts = [p.strip() for p in raw_cookie.split(";") if p.strip()]
            if not parts:
                continue

            # First part is name=value. Extract ONLY name, NEVER value.
            first_part = parts[0]
            if "=" in first_part:
                cookie_name = first_part.split("=", 1)[0].strip()
            else:
                cookie_name = first_part.strip()

            is_secure = False
            is_httponly = False
            same_site = None
            domain = None
            path = None
            expires = None

            for attr in parts[1:]:
                attr_lower = attr.lower()
                if attr_lower == "secure":
                    is_secure = True
                elif attr_lower == "httponly":
                    is_httponly = True
                elif attr_lower.startswith("samesite="):
                    same_site = attr.split("=", 1)[1].strip()
                elif attr_lower.startswith("domain="):
                    domain = attr.split("=", 1)[1].strip()
                elif attr_lower.startswith("path="):
                    path = attr.split("=", 1)[1].strip()
                elif attr_lower.startswith("max-age=") or attr_lower.startswith("expires="):
                    expires = attr.split("=", 1)[1].strip()

            is_session_cookie = any(k in cookie_name.lower() for k in self.SESSION_KEYWORDS)

            cookie_points = 0.0
            max_cookie_points = 100.0

            # 1. Secure Flag check (Weight: 40)
            if is_https:
                if is_secure:
                    cookie_points += 40.0
                else:
                    sev = "High" if is_session_cookie else "Medium"
                    findings.append(
                        schemas.SecurityFindingSchema(
                            category="COOKIE_SECURITY",
                            title=f"Cookie '{cookie_name}' Missing Secure Flag over HTTPS",
                            description=(
                                f"Cookie '{cookie_name}' was transmitted over HTTPS without the 'Secure' attribute. "
                                "Browsers may transmit this cookie in plaintext if the user visits an unencrypted HTTP link."
                            ),
                            evidence={"cookie_name": cookie_name, "is_session_like": is_session_cookie},
                            severity=sev,
                            confidence=1.0,
                            recommendation=f"Add '; Secure' to Set-Cookie for '{cookie_name}' to prevent transmission over cleartext HTTP."
                        )
                    )
            else:
                # Target is plain HTTP, Secure cannot be used
                cookie_points += 20.0

            # 2. HttpOnly Flag check (Weight: 35)
            if is_httponly:
                cookie_points += 35.0
            else:
                if is_session_cookie:
                    findings.append(
                        schemas.SecurityFindingSchema(
                            category="COOKIE_SECURITY",
                            title=f"Session Cookie '{cookie_name}' Missing HttpOnly Flag",
                            description=(
                                f"Cookie '{cookie_name}' appears to carry authentication or session data but lacks 'HttpOnly'. "
                                "Client-side scripts (and XSS payloads) can read this cookie directly via document.cookie."
                            ),
                            evidence={"cookie_name": cookie_name, "is_session_like": is_session_cookie},
                            severity="Medium",
                            confidence=0.95,
                            recommendation=f"Add '; HttpOnly' to Set-Cookie for '{cookie_name}' so client-side JavaScript cannot read session credentials."
                        )
                    )
                else:
                    cookie_points += 15.0  # Non-session cookies might intentionally be JS-accessible

            # 3. SameSite Flag check (Weight: 25)
            if same_site:
                ss_lower = same_site.lower()
                if ss_lower in ("strict", "lax"):
                    cookie_points += 25.0
                elif ss_lower == "none":
                    if is_secure:
                        cookie_points += 15.0
                    else:
                        findings.append(
                            schemas.SecurityFindingSchema(
                                category="COOKIE_SECURITY",
                                title=f"Cookie '{cookie_name}' SameSite=None Missing Secure",
                                description=f"Cookie '{cookie_name}' sets SameSite=None without Secure. Modern browsers reject this configuration.",
                                evidence={"cookie_name": cookie_name, "same_site": same_site},
                                severity="Medium",
                                confidence=1.0,
                                recommendation="Cookies using SameSite=None MUST also have the Secure flag set."
                            )
                        )
            else:
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="COOKIE_SECURITY",
                        title=f"Cookie '{cookie_name}' Missing Explicit SameSite Attribute",
                        description=f"Cookie '{cookie_name}' does not specify SameSite. While modern browsers default to Lax, explicit declaration ensures consistent CSRF defense.",
                        evidence={"cookie_name": cookie_name},
                        severity="Low",
                        confidence=1.0,
                        recommendation=f"Explicitly set 'SameSite=Lax' or 'SameSite=Strict' on cookie '{cookie_name}'."
                    )
                )
                cookie_points += 10.0  # Partial credit due to browser default Lax

            earned_points += (cookie_points / max_cookie_points)

            # Evaluation item (NO actual cookie values recorded)
            assessment_label = "SECURE" if (is_secure and is_httponly and same_site) else ("POTENTIALLY_VULNERABLE" if is_session_cookie and not is_secure else "WEAK")
            evaluations.append(
                schemas.CookieEvaluationSchema(
                    cookie_name=cookie_name,
                    secure=is_secure,
                    http_only=is_httponly,
                    same_site=same_site,
                    domain=domain,
                    path=path,
                    expires=expires,
                    assessment=assessment_label
                )
            )

        final_score = round(min(100.0, max(0.0, (earned_points / total_cookies) * 100.0)), 1)
        return final_score, evaluations, findings

