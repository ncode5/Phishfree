import asyncio
import socket
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlparse, urlunparse

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.analyzers.url_validator import URLValidator, is_ip_private
from app.database import models, schemas
from app.services.cookie_security_analyzer import CookieSecurityAnalyzer
from app.services.mixed_content_analyzer import MixedContentAnalyzer
from app.services.security_configuration_analyzer import SecurityConfigurationAnalyzer
from app.services.security_headers_analyzer import SecurityHeadersAnalyzer
from app.services.tls_analyzer import TLSAnalyzer


class WebsiteSecurityAssessmentService:
    """Master orchestrator for passive, non-intrusive website security posture assessment."""

    CATEGORY_WEIGHTS = {
        "https_transport": 0.25,
        "security_headers": 0.25,
        "cookie_security": 0.20,
        "mixed_content": 0.15,
        "information_exposure": 0.05,
        "security_config": 0.10
    }

    def __init__(self):
        self.validator = URLValidator()
        self.tls_analyzer = TLSAnalyzer()
        self.headers_analyzer = SecurityHeadersAnalyzer()
        self.cookie_analyzer = CookieSecurityAnalyzer()
        self.mixed_analyzer = MixedContentAnalyzer()
        self.config_analyzer = SecurityConfigurationAnalyzer()

    async def assess_website(
        self,
        url: str,
        db: Session,
        include_headers: bool = True,
        include_cookies: bool = True,
        include_mixed_content: bool = True,
        include_public_files: bool = True,
        report_id: Optional[str] = None
    ) -> schemas.SecurityAssessmentResponse:
        """Executes a non-intrusive, passive assessment of website security configurations with strict SSRF defense."""

        # 1. Validate URL & Enforce SSRF Checks
        val_res = self.validator.validate_and_normalize(url)
        if not val_res.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid URL: {val_res.error_message or 'Invalid URL structure'}"
            )

        if val_res.scheme not in ("http", "https"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported scheme '{val_res.scheme}'. Only HTTP and HTTPS are permitted."
            )

        hostname = val_res.hostname
        if not hostname or hostname in ("localhost", "127.0.0.1", "::1"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access to localhost or loopback destinations is strictly prohibited (SSRF defense)."
            )

        # Resolve IP and check SSRF
        try:
            resolved_ip = socket.gethostbyname(hostname)
            if is_ip_private(resolved_ip):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Host '{hostname}' resolved to private/restricted IP '{resolved_ip}'. Access blocked (SSRF defense)."
                )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to resolve DNS for destination host '{hostname}': {str(e)}"
            )

        target_url = val_res.normalized_url or url.strip()
        is_target_https = target_url.startswith("https://")

        # Track checks coverage
        total_checks = 6
        completed_checks = 0
        unavailable_checks: List[str] = []

        all_findings: List[schemas.SecurityFindingSchema] = []
        category_score_schemas: List[schemas.CategoryScoreSchema] = []

        # ----------------------------------------------------
        # Dimension 1: HTTPS and Transport Security (Weight: 25%)
        # ----------------------------------------------------
        https_score, transport_findings, redirect_meta = await self._audit_transport_security(hostname, is_target_https)
        all_findings.extend(transport_findings)
        completed_checks += 1
        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="HTTPS and Transport Security",
                score=https_score,
                weight=self.CATEGORY_WEIGHTS["https_transport"],
                status="STRONG" if https_score >= 80 else ("ACCEPTABLE" if https_score >= 50 else "WEAK"),
                description="Audits HTTPS availability, TLS certificate validity, and HTTP-to-HTTPS redirection."
            )
        )

        # ----------------------------------------------------
        # Fetch Target Response Safely with SSRF & Size Bounds
        # ----------------------------------------------------
        response_headers: Dict[str, str] = {}
        set_cookie_headers: List[str] = []
        html_body: str = ""
        fetch_status = "COMPLETED"

        client_timeout = httpx.Timeout(4.0, connect=2.5)
        transport_limits = httpx.Limits(max_keepalive_connections=2, max_connections=4)

        try:
            async with httpx.AsyncClient(
                timeout=client_timeout,
                limits=transport_limits,
                verify=False,
                follow_redirects=True,
                max_redirects=4
            ) as client:
                req_headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 DigitalTrustIntel/1.0",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
                }
                resp = await client.get(target_url, headers=req_headers)
                response_headers = dict(resp.headers)
                # Safely extract Set-Cookie directives
                if hasattr(resp.headers, "get_list"):
                    set_cookie_headers = resp.headers.get_list("set-cookie")
                elif isinstance(resp.headers, dict) and "set-cookie" in resp.headers:
                    set_cookie_headers = [resp.headers["set-cookie"]]
                else:
                    set_cookie_headers = []
                html_body = resp.text[: 1_048_576]  # Max 1MB
        except Exception as e:
            fetch_status = "PARTIAL"
            unavailable_checks.append("HTTP Response Body Inspection")

        # ----------------------------------------------------
        # Dimension 2: HTTP Security Headers (Weight: 25%)
        # ----------------------------------------------------
        headers_evaluations: List[schemas.SecurityHeaderEvaluationSchema] = []
        if include_headers and response_headers:
            headers_score, headers_evaluations, h_findings = self.headers_analyzer.analyze(response_headers, is_target_https)
            all_findings.extend(h_findings)
            completed_checks += 1
        else:
            headers_score = 0.0
            unavailable_checks.append("HTTP Security Headers")

        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="HTTP Security Headers",
                score=headers_score,
                weight=self.CATEGORY_WEIGHTS["security_headers"],
                status="STRONG" if headers_score >= 80 else ("ACCEPTABLE" if headers_score >= 50 else "WEAK"),
                description="Evaluates presence and configuration of 9 defensive security headers (HSTS, CSP, X-Frame-Options, etc.)."
            )
        )

        # ----------------------------------------------------
        # Dimension 3: Cookie Security (Weight: 20%)
        # ----------------------------------------------------
        cookies_evaluations: List[schemas.CookieEvaluationSchema] = []
        if include_cookies:
            cookie_score, cookies_evaluations, c_findings = self.cookie_analyzer.analyze(set_cookie_headers, is_target_https)
            all_findings.extend(c_findings)
            completed_checks += 1
        else:
            cookie_score = 50.0
            unavailable_checks.append("Cookie Security")

        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="Cookie Security",
                score=cookie_score,
                weight=self.CATEGORY_WEIGHTS["cookie_security"],
                status="STRONG" if cookie_score >= 80 else ("ACCEPTABLE" if cookie_score >= 50 else "WEAK"),
                description="Audits Secure, HttpOnly, and SameSite attributes (values redacted for privacy)."
            )
        )

        # ----------------------------------------------------
        # Dimension 4: Mixed Content (Weight: 15%)
        # ----------------------------------------------------
        if include_mixed_content and html_body:
            mixed_score, m_findings, _ = self.mixed_analyzer.analyze(html_body, is_target_https)
            all_findings.extend(m_findings)
            completed_checks += 1
        else:
            mixed_score = 100.0 if not is_target_https else 50.0
            if not html_body:
                unavailable_checks.append("Mixed Content Analysis")
            else:
                completed_checks += 1

        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="Mixed Content",
                score=mixed_score,
                weight=self.CATEGORY_WEIGHTS["mixed_content"],
                status="STRONG" if mixed_score >= 80 else ("ACCEPTABLE" if mixed_score >= 50 else "WEAK"),
                description="Detects unencrypted HTTP resources embedded in HTTPS documents."
            )
        )

        # ----------------------------------------------------
        # Dimension 5: Information Exposure (Weight: 5%)
        # ----------------------------------------------------
        if response_headers:
            info_score, info_findings, _ = self.config_analyzer.analyze_information_exposure(response_headers)
            all_findings.extend(info_findings)
            completed_checks += 1
        else:
            info_score = 80.0
            unavailable_checks.append("Information Exposure")

        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="Information Exposure",
                score=info_score,
                weight=self.CATEGORY_WEIGHTS["information_exposure"],
                status="STRONG" if info_score >= 80 else "ACCEPTABLE",
                description="Monitors server banners, framework identifiers, and runtime leakage in response metadata."
            )
        )

        # ----------------------------------------------------
        # Dimension 6: Security Configuration Files (Weight: 10%)
        # ----------------------------------------------------
        if include_public_files:
            files_score, file_findings, _ = await self.config_analyzer.analyze_public_security_files(target_url)
            all_findings.extend(file_findings)
            completed_checks += 1
        else:
            files_score = 75.0
            unavailable_checks.append("Public Security Configuration Files")

        category_score_schemas.append(
            schemas.CategoryScoreSchema(
                category="Security Configuration Files",
                score=files_score,
                weight=self.CATEGORY_WEIGHTS["security_config"],
                status="STRONG" if files_score >= 80 else "ACCEPTABLE",
                description="Checks availability of standard public security files (/robots.txt, /.well-known/security.txt)."
            )
        )

        # ----------------------------------------------------
        # Calculate Weighted Overall Security Score (0 - 100)
        # ----------------------------------------------------
        weighted_score = (
            https_score * self.CATEGORY_WEIGHTS["https_transport"] +
            headers_score * self.CATEGORY_WEIGHTS["security_headers"] +
            cookie_score * self.CATEGORY_WEIGHTS["cookie_security"] +
            mixed_score * self.CATEGORY_WEIGHTS["mixed_content"] +
            info_score * self.CATEGORY_WEIGHTS["information_exposure"] +
            files_score * self.CATEGORY_WEIGHTS["security_config"]
        )
        final_score = round(max(0.0, min(100.0, weighted_score)), 1)

        # Assign Security Label
        if final_score >= 90.0:
            security_label = "Strong Configuration"
        elif final_score >= 75.0:
            security_label = "Good Configuration"
        elif final_score >= 50.0:
            security_label = "Needs Improvement"
        elif final_score >= 25.0:
            security_label = "Weak Configuration"
        else:
            security_label = "Poor Configuration"

        # Coverage Calculation
        coverage_pct = round((completed_checks / total_checks) * 100.0, 1)
        coverage_data = {
            "completed": completed_checks,
            "total": total_checks,
            "percentage": coverage_pct,
            "unavailable_checks": unavailable_checks
        }

        # Recommendations Synthesis
        recommendations: List[str] = []
        for f in all_findings:
            if f.recommendation and f.recommendation not in recommendations:
                recommendations.append(f.recommendation)

        summary_text = (
            f"Passive security assessment completed for '{hostname}'. Assessed overall security posture as "
            f"'{security_label}' with a score of {final_score}/100 across {completed_checks}/{total_checks} dimensions ({coverage_pct}% coverage)."
        )

        assessment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        # ----------------------------------------------------
        # Database Persistence
        # ----------------------------------------------------
        assessment_record = models.WebsiteSecurityAssessment(
            id=assessment_id,
            report_id=report_id or assessment_id,
            target_url=target_url,
            security_score=final_score,
            security_label=security_label,
            coverage=coverage_data,
            category_scores={c.category: c.score for c in category_score_schemas},
            summary=summary_text,
            recommendations=recommendations,
            assessment_status=fetch_status if not unavailable_checks else "PARTIAL",
            created_at=now
        )
        db.add(assessment_record)
        db.flush()

        for f in all_findings:
            f_record = models.WebsiteSecurityFinding(
                id=str(uuid.uuid4()),
                assessment_id=assessment_id,
                category=f.category,
                title=f.title,
                description=f.description,
                evidence=f.evidence or {},
                severity=f.severity,
                confidence=f.confidence,
                recommendation=f.recommendation,
                source=f.source or "SECURITY_ASSESSMENT_ENGINE",
                created_at=now
            )
            db.add(f_record)

        db.commit()

        return schemas.SecurityAssessmentResponse(
            report_id=assessment_record.report_id,
            target_url=target_url,
            security_score=final_score,
            security_label=security_label,
            coverage=schemas.CoverageSchema(**coverage_data),
            categories=category_score_schemas,
            headers_evaluation=headers_evaluations,
            cookies_evaluation=cookies_evaluations,
            findings=all_findings,
            recommendations=recommendations,
            status=assessment_record.assessment_status,
            summary=summary_text,
            created_at=now
        )

    async def _audit_transport_security(
        self,
        hostname: str,
        is_target_https: bool
    ) -> Tuple[float, List[schemas.SecurityFindingSchema], Dict[str, Any]]:
        """Audits HTTPS availability, TLS certificate validity, HTTP redirection, and downgrade risks."""
        findings: List[schemas.SecurityFindingSchema] = []
        meta: Dict[str, Any] = {}

        # 1. Reuse TLSAnalyzer (Module 2)
        try:
            tls_res = await self.tls_analyzer.analyze(hostname)
            https_available = tls_res.https_available
            cert_status = tls_res.certificate_status
            chain_status = tls_res.chain_status
            crypto_strength = tls_res.cryptographic_strength
            meta["tls_status"] = cert_status
            meta["chain_status"] = chain_status
        except Exception as e:
            https_available = False
            cert_status = "UNABLE_TO_DETERMINE"
            chain_status = "UNABLE_TO_VERIFY"
            crypto_strength = "UNKNOWN"
            meta["tls_error"] = str(e)

        # 2. Check HTTP to HTTPS Redirection & Downgrade
        http_redirects_to_https = False
        https_downgrades_to_http = False

        client_timeout = httpx.Timeout(3.0, connect=2.0)
        async with httpx.AsyncClient(timeout=client_timeout, verify=False, follow_redirects=False) as client:
            # Check http:// endpoint
            try:
                http_resp = await client.get(f"http://{hostname}/", headers={"User-Agent": "DigitalTrustIntel/1.0"})
                if http_resp.is_redirect:
                    loc = http_resp.headers.get("location", "")
                    if loc.startswith("https://"):
                        http_redirects_to_https = True
            except Exception:
                pass

            # Check if https:// ever downgrades to http://
            try:
                https_resp = await client.get(f"https://{hostname}/", headers={"User-Agent": "DigitalTrustIntel/1.0"})
                if https_resp.is_redirect:
                    loc = https_resp.headers.get("location", "")
                    if loc.startswith("http://"):
                        https_downgrades_to_http = True
            except Exception:
                pass

        score = 0.0

        if https_available:
            score += 60.0
            if cert_status == "VALID":
                score += 20.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="HTTPS_TRANSPORT",
                        title="Valid TLS Certificate Present",
                        description="The website serves a valid X.509 certificate matching its hostname. Note: A valid certificate encrypts transit but does not guarantee the operator is trustworthy.",
                        evidence={"certificate_status": cert_status, "chain_status": chain_status},
                        severity="Informational",
                        confidence=1.0,
                        recommendation="Continue maintaining automated certificate renewal."
                    )
                )
            elif cert_status in ("EXPIRED", "UNTRUSTED", "EXPIRING_SOON"):
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="HTTPS_TRANSPORT",
                        title=f"TLS Certificate Problem: {cert_status}",
                        description=f"The certificate status is '{cert_status}'. Browsers will present security warnings to visitors.",
                        evidence={"certificate_status": cert_status, "chain_status": chain_status},
                        severity="High" if cert_status in ("EXPIRED", "UNTRUSTED") else "Medium",
                        confidence=1.0,
                        recommendation="Replace expired or untrusted certificates with a valid certificate from a recognized Certificate Authority."
                    )
                )

            if http_redirects_to_https:
                score += 15.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="HTTPS_TRANSPORT",
                        title="Automatic HTTP to HTTPS Redirection Enforced",
                        description="Plaintext HTTP requests are automatically upgraded to encrypted HTTPS.",
                        evidence={"http_redirect": True},
                        severity="Informational",
                        confidence=1.0
                    )
                )
            else:
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="HTTPS_TRANSPORT",
                        title="Missing Automatic HTTP to HTTPS Redirection",
                        description="Plaintext HTTP requests are not automatically redirected to HTTPS, leaving users vulnerable to SSL stripping.",
                        evidence={"http_redirect": False},
                        severity="Medium",
                        confidence=0.9,
                        recommendation="Configure your web server to issue a 301 Permanent Redirect from http:// to https://."
                    )
                )

            if https_downgrades_to_http:
                score -= 30.0
                findings.append(
                    schemas.SecurityFindingSchema(
                        category="HTTPS_TRANSPORT",
                        title="HTTPS Downgrade Redirect Observed",
                        description="The HTTPS endpoint issues a redirect pointing to unencrypted plain HTTP. This completely negates transport encryption.",
                        evidence={"downgrade_detected": True},
                        severity="Critical",
                        confidence=1.0,
                        recommendation="Eliminate any redirect logic that forwards users from HTTPS to cleartext HTTP."
                    )
                )

            if crypto_strength == "STRONG":
                score += 5.0

        else:
            # No HTTPS at all
            score = 15.0
            findings.append(
                schemas.SecurityFindingSchema(
                    category="HTTPS_TRANSPORT",
                    title="HTTPS Is Not Supported or Available",
                    description="The server does not respond to HTTPS handshakes. All credentials, session cookies, and content travel unencrypted.",
                    evidence={"https_available": False},
                    severity="High",
                    confidence=1.0,
                    recommendation="Install and enable a TLS certificate immediately."
                )
            )

        final_score = round(max(0.0, min(100.0, score)), 1)
        return final_score, findings, meta

    def get_assessment_by_id(self, db: Session, report_id: str) -> Optional[schemas.SecurityAssessmentResponse]:
        """Retrieves previous security assessment by report_id or assessment UUID."""
        record = db.query(models.WebsiteSecurityAssessment).filter(
            (models.WebsiteSecurityAssessment.report_id == report_id) |
            (models.WebsiteSecurityAssessment.id == report_id)
        ).first()

        if not record:
            return None

        findings_records = db.query(models.WebsiteSecurityFinding).filter(
            models.WebsiteSecurityFinding.assessment_id == record.id
        ).all()

        category_schemas = [
            schemas.CategoryScoreSchema(
                category=cat,
                score=score,
                weight=self.CATEGORY_WEIGHTS.get(cat.lower().replace(" ", "_"), 0.15),
                status="STRONG" if score >= 80 else ("ACCEPTABLE" if score >= 50 else "WEAK"),
                description=f"Security configuration score for {cat}."
            )
            for cat, score in (record.category_scores or {}).items()
        ]

        coverage_data = record.coverage or {"completed": 6, "total": 6, "percentage": 100.0, "unavailable_checks": []}

        return schemas.SecurityAssessmentResponse(
            report_id=record.report_id or record.id,
            target_url=record.target_url,
            security_score=record.security_score,
            security_label=record.security_label,
            coverage=schemas.CoverageSchema(**coverage_data),
            categories=category_schemas,
            headers_evaluation=[],
            cookies_evaluation=[],
            findings=[schemas.SecurityFindingSchema.model_validate(f) for f in findings_records],
            recommendations=record.recommendations or [],
            status=record.assessment_status,
            summary=record.summary,
            created_at=record.created_at
        )

    def get_findings_filtered(
        self,
        db: Session,
        report_id: str,
        severity: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 50,
        skip: int = 0
    ) -> schemas.SecurityFindingsFilterResponse:
        """Queries granular findings with optional filtering by severity and category."""
        assessment = db.query(models.WebsiteSecurityAssessment).filter(
            (models.WebsiteSecurityAssessment.report_id == report_id) |
            (models.WebsiteSecurityAssessment.id == report_id)
        ).first()

        if not assessment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Security assessment '{report_id}' was not found."
            )

        query = db.query(models.WebsiteSecurityFinding).filter(
            models.WebsiteSecurityFinding.assessment_id == assessment.id
        )

        if severity:
            query = query.filter(models.WebsiteSecurityFinding.severity == severity.capitalize())
        if category:
            query = query.filter(models.WebsiteSecurityFinding.category == category.upper())

        total = query.count()
        findings = query.order_by(desc(models.WebsiteSecurityFinding.created_at)).offset(skip).limit(limit).all()

        return schemas.SecurityFindingsFilterResponse(
            total=total,
            findings=[schemas.SecurityFindingSchema.model_validate(f) for f in findings],
            limit=limit,
            skip=skip
        )
