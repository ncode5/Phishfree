import asyncio
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.database import models, schemas
from app.analyzers.url_validator import URLValidator, ValidationResult
from app.analyzers.domain_analyzer import DomainAnalyzer
from app.analyzers.url_pattern_analyzer import URLPatternAnalyzer
from app.analyzers.dns_analyzer import DNSAnalyzer
from app.analyzers.redirect_analyzer import RedirectAnalyzer
from app.intelligence.virustotal import VirusTotalProvider
from app.risk_engine.scoring import RiskAssessmentEngine
from app.ai.explanation import AIExplanationEngine
from app.services.tls_analyzer import TLSAnalyzer


class AnalysisService:
    """Orchestrates end-to-end evidence collection, risk evaluation, and report persistence."""

    def __init__(self):
        self.validator = URLValidator()
        self.domain_analyzer = DomainAnalyzer()
        self.pattern_analyzer = URLPatternAnalyzer()
        self.dns_analyzer = DNSAnalyzer(timeout=3.0)
        self.redirect_analyzer = RedirectAnalyzer(max_hops=5, timeout=6.0)
        self.threat_intel_provider = VirusTotalProvider()
        self.risk_engine = RiskAssessmentEngine()
        self.ai_engine = AIExplanationEngine()
        self.tls_analyzer = TLSAnalyzer()

    async def analyze_url(self, raw_url: str, db: Session, include_tls: bool = True) -> schemas.AnalysisReportResponse:
        """Executes full security analysis pipeline for submitted URL."""
        # 1. URL Validation and Normalization
        val_result: ValidationResult = self.validator.validate_and_normalize(raw_url)
        if not val_result.is_valid:
            # If invalid due to SSRF private IP, we still record a critical finding
            if val_result.is_private_ip:
                finding_evidence = {
                    "category": "SSRF",
                    "indicator": "SSRF_PRIVATE_IP_BLOCKED",
                    "severity": "CRITICAL",
                    "description": val_result.error_message or "Blocked private/loopback destination.",
                    "source": "URLValidator",
                    "confidence": 1.0,
                    "evidence": {"hostname": val_result.hostname}
                }
                # Create report for the blocked attempt
                report = models.AnalysisReport(
                    submitted_url=raw_url,
                    normalized_url=raw_url,
                    domain=val_result.hostname or "private-ip",
                    risk_level="CONFIRMED_MALICIOUS",
                    risk_score=95.0,
                    confidence=1.0,
                    summary="Access to internal or private IP address was blocked to protect internal infrastructure (SSRF).",
                    analysis_status="COMPLETED",
                    details={"error": val_result.error_message}
                )
                db.add(report)
                db.flush()
                f_model = models.Finding(
                    report_id=report.id,
                    category=finding_evidence["category"],
                    indicator=finding_evidence["indicator"],
                    severity=finding_evidence["severity"],
                    description=finding_evidence["description"],
                    source=finding_evidence["source"],
                    confidence=finding_evidence["confidence"],
                    evidence=finding_evidence["evidence"],
                )
                db.add(f_model)
                db.commit()
                db.refresh(report)
                return self._build_report_response(report, [finding_evidence], unavailable_checks=[])

            raise HTTPException(status_code=400, detail=val_result.error_message or "Malformed or disallowed URL.")

        normalized_url = val_result.normalized_url
        hostname = val_result.hostname
        is_ip = val_result.is_ip_address
        unavailable_checks: List[str] = []
        aggregated_findings: List[Dict[str, Any]] = []

        # 2. Domain & Homoglyph Analysis
        domain_res = self.domain_analyzer.analyze(hostname)
        aggregated_findings.extend(domain_res.findings)

        # 3. URL Pattern & Phishing Tokens Analysis
        pattern_findings = self.pattern_analyzer.analyze(
            url=normalized_url,
            is_ip_host=is_ip,
            raw_input=raw_url
        )
        aggregated_findings.extend(pattern_findings)

        # 4. Async Execution: DNS & Redirect Inspection & Threat Intel & TLS Analysis
        # Run independent network checks concurrently within serverless execution budget
        dns_task = self.dns_analyzer.analyze(hostname, is_ip=is_ip)
        redirect_task = self.redirect_analyzer.analyze(normalized_url)
        intel_task = self.threat_intel_provider.analyze_url(normalized_url)

        tasks = [dns_task, redirect_task, intel_task]
        if include_tls:
            tls_task = self.tls_analyzer.analyze(hostname)
            tasks.append(tls_task)

        results = await asyncio.gather(*tasks, return_exceptions=True)
        dns_res = results[0]
        redirect_res = results[1]
        intel_res = results[2]
        tls_res = results[3] if include_tls else None

        # Process DNS results
        if isinstance(dns_res, Exception):
            dns_status = "UNAVAILABLE"
            dns_schema = schemas.DNSRecordsSchema(status="UNAVAILABLE", error_message=str(dns_res))
            unavailable_checks.append("DNS record resolution (unexpected query error)")
        else:
            dns_status = dns_res.status
            dns_schema = schemas.DNSRecordsSchema(
                a_records=dns_res.a_records,
                aaaa_records=dns_res.aaaa_records,
                mx_records=dns_res.mx_records,
                ns_records=dns_res.ns_records,
                txt_records=dns_res.txt_records,
                status=dns_res.status,
                error_message=dns_res.error_message
            )
            aggregated_findings.extend(dns_res.findings)
            if dns_res.status in ("UNAVAILABLE", "TIMEOUT"):
                unavailable_checks.append(f"DNS verification ({dns_res.status.lower()})")

        # Process Redirect results
        if isinstance(redirect_res, Exception):
            redirect_status = "ERROR"
            redirect_schema = schemas.RedirectAnalysisSchema(
                original_url=normalized_url,
                final_url=normalized_url,
                status="ERROR",
                error_message=str(redirect_res)
            )
            unavailable_checks.append("HTTP redirect trace (network connection failed)")
        else:
            redirect_status = redirect_res.status
            redirect_schema = schemas.RedirectAnalysisSchema(
                original_url=redirect_res.original_url,
                final_url=redirect_res.final_url,
                hops=[
                    schemas.RedirectHopSchema(
                        hop_number=h.hop_number,
                        url=h.url,
                        status_code=h.status_code,
                        domain=h.domain,
                        ip=h.ip,
                        is_cross_domain=h.is_cross_domain
                    ) for h in redirect_res.hops
                ],
                redirect_count=redirect_res.redirect_count,
                cross_domain_redirects=redirect_res.cross_domain_redirects,
                status=redirect_res.status,
                error_message=redirect_res.error_message
            )
            aggregated_findings.extend(redirect_res.findings)
            if redirect_res.status in ("TIMEOUT", "ERROR"):
                unavailable_checks.append(f"Live website response ({redirect_res.status.lower()})")

        # Process Threat Intel results
        if isinstance(intel_res, Exception):
            threat_intel_status = "ERROR"
            threat_intel_schema = schemas.ThreatIntelSchema(
                provider="VirusTotal",
                status="ERROR",
                message="Threat intelligence lookup unavailable."
            )
            unavailable_checks.append("External threat intelligence (API query error)")
        else:
            threat_intel_status = intel_res.get("status", "UNAVAILABLE")
            threat_intel_schema = schemas.ThreatIntelSchema(
                provider=intel_res.get("provider", "VirusTotal"),
                status=intel_res.get("status", "UNAVAILABLE"),
                is_malicious=intel_res.get("is_malicious", False),
                malicious_count=intel_res.get("malicious_count", 0),
                suspicious_count=intel_res.get("suspicious_count", 0),
                harmless_count=intel_res.get("harmless_count", 0),
                total_engines=intel_res.get("total_engines", 0),
                scan_date=intel_res.get("scan_date"),
                permalink=intel_res.get("permalink"),
                message=intel_res.get("message")
            )
            aggregated_findings.extend(intel_res.get("findings", []))
            if threat_intel_status == "UNAVAILABLE":
                unavailable_checks.append("VirusTotal threat intelligence (API key not configured)")
            elif threat_intel_status == "ERROR":
                unavailable_checks.append("VirusTotal threat intelligence (rate limit or network error)")

        # Process TLS & Digital Trust results (Module 2)
        tls_analysis_data = None
        if include_tls and tls_res is not None:
            if isinstance(tls_res, Exception):
                tls_analysis_data = schemas.TLSAnalysisResponse(
                    target=hostname,
                    hostname=hostname,
                    port=443,
                    https_available=False,
                    certificate_status="ERROR",
                    hostname_match=False,
                    chain_status="UNKNOWN",
                    cryptographic_strength="UNKNOWN",
                    findings=[],
                    recommendations=["TLS analysis could not be completed."],
                    error_message=str(tls_res)
                ).model_dump(mode="json")
                unavailable_checks.append("TLS certificate verification (analysis error)")
            else:
                tls_analysis_data = tls_res.model_dump(mode="json")
                # Aggregate high-priority TLS findings into report evidence
                for tf in tls_res.findings:
                    if tf.severity in ("Medium", "High", "Critical"):
                        aggregated_findings.append({
                            "category": "TLS_SECURITY",
                            "indicator": tf.finding_id,
                            "severity": tf.severity.upper(),
                            "description": tf.description,
                            "source": "TLSAnalyzer",
                            "confidence": tf.confidence,
                            "evidence": tf.evidence
                        })
                if not tls_res.https_available:
                    unavailable_checks.append(f"HTTPS connection ({tls_res.error_message or 'not available'})")

        # 5. Risk Assessment Engine
        risk_result = self.risk_engine.evaluate(
            findings=aggregated_findings,
            dns_status=dns_status,
            redirect_status=redirect_status,
            threat_intel_status=threat_intel_status,
            is_ip_destination=is_ip
        )

        # 6. AI Explanation Generation
        ai_exp = await self.ai_engine.generate_explanation(
            url=normalized_url,
            domain=hostname,
            risk_level=risk_result.risk_level,
            risk_score=risk_result.risk_score,
            findings=aggregated_findings,
            dns_status=dns_status,
            redirect_status=redirect_status,
            threat_intel_status=threat_intel_status,
            unavailable_checks=unavailable_checks
        )

        domain_schema = schemas.DomainAnalysisSchema(
            subdomain=domain_res.subdomain,
            registered_domain=domain_res.registered_domain,
            tld=domain_res.suffix,
            full_domain=domain_res.full_domain,
            is_punycode=domain_res.is_punycode,
            unicode_domain=domain_res.unicode_domain,
            domain_length=domain_res.domain_length,
            subdomain_count=domain_res.subdomain_count,
            has_hyphens=domain_res.has_hyphens,
            hyphen_count=domain_res.hyphen_count,
            is_brand_impersonation=domain_res.is_brand_impersonation,
            target_brand=domain_res.target_brand,
            similarity_score=round(domain_res.similarity_score, 3),
            suspicious_patterns=[f["indicator"] for f in domain_res.findings]
        )

        ai_schema = schemas.AIExplanationSchema(
            summary=ai_exp.summary,
            risk_level=ai_exp.risk_level,
            explanation=ai_exp.explanation,
            recommendations=ai_exp.recommendations,
            is_deterministic_fallback=ai_exp.is_deterministic_fallback
        )

        # 7. Persist to Database
        db_details = {
            "dns": dns_schema.model_dump(),
            "redirects": redirect_schema.model_dump(),
            "domain_analysis": domain_schema.model_dump(),
            "threat_intel": threat_intel_schema.model_dump(),
            "ai_explanation": ai_schema.model_dump(),
            "tls_analysis": tls_analysis_data,
            "unavailable_checks": unavailable_checks,
            "category_scores": risk_result.category_scores
        }

        report = models.AnalysisReport(
            submitted_url=raw_url,
            normalized_url=normalized_url,
            domain=hostname,
            risk_level=risk_result.risk_level,
            risk_score=risk_result.risk_score,
            confidence=risk_result.confidence,
            summary=ai_exp.summary,
            analysis_status="COMPLETED",
            details=db_details
        )
        db.add(report)
        db.flush()

        # Save individual Findings
        for f in aggregated_findings:
            f_record = models.Finding(
                report_id=report.id,
                category=f.get("category", "GENERAL"),
                indicator=f.get("indicator", "UNKNOWN"),
                severity=f.get("severity", "LOW"),
                description=f.get("description", ""),
                source=f.get("source", "System"),
                confidence=f.get("confidence", 1.0),
                evidence=f.get("evidence", {})
            )
            db.add(f_record)

        # If confirmed malicious or high risk, track in ThreatIndicator registry
        if risk_result.risk_level in ("CONFIRMED_MALICIOUS", "HIGH_RISK"):
            threat_indicator = models.ThreatIndicator(
                indicator_type="DOMAIN" if not is_ip else "IP",
                indicator_value=hostname,
                threat_category="PHISHING" if domain_res.is_brand_impersonation else "SUSPICIOUS_WEB_HOST",
                source="AI-Cybersecurity-Engine",
            )
            db.add(threat_indicator)

        db.commit()
        db.refresh(report)

        return self._build_report_response(report, aggregated_findings, unavailable_checks)

    def _build_report_response(
        self,
        report: models.AnalysisReport,
        findings: List[Dict[str, Any]],
        unavailable_checks: List[str]
    ) -> schemas.AnalysisReportResponse:
        details = report.details or {}
        dns_data = details.get("dns")
        redirect_data = details.get("redirects")
        domain_data = details.get("domain_analysis")
        threat_data = details.get("threat_intel")
        ai_data = details.get("ai_explanation")
        tls_data = details.get("tls_analysis")

        findings_schemas = []
        if report.findings:
            for f in report.findings:
                findings_schemas.append(schemas.FindingSchema.model_validate(f))
        else:
            for f in findings:
                findings_schemas.append(schemas.FindingSchema(
                    category=f.get("category", "GENERAL"),
                    indicator=f.get("indicator", "UNKNOWN"),
                    severity=f.get("severity", "LOW"),
                    description=f.get("description", ""),
                    source=f.get("source", "System"),
                    confidence=f.get("confidence", 1.0),
                    evidence=f.get("evidence", {})
                ))

        return schemas.AnalysisReportResponse(
            id=report.id,
            submitted_url=report.submitted_url,
            normalized_url=report.normalized_url,
            domain=report.domain,
            risk_level=report.risk_level,
            risk_score=report.risk_score,
            confidence=report.confidence,
            summary=report.summary,
            analysis_status=report.analysis_status,
            created_at=report.created_at,
            findings=findings_schemas,
            dns=schemas.DNSRecordsSchema(**dns_data) if dns_data else None,
            redirects=schemas.RedirectAnalysisSchema(**redirect_data) if redirect_data else None,
            domain_analysis=schemas.DomainAnalysisSchema(**domain_data) if domain_data else None,
            threat_intel=schemas.ThreatIntelSchema(**threat_data) if threat_data else None,
            ai_explanation=schemas.AIExplanationSchema(**ai_data) if ai_data else None,
            tls_analysis=schemas.TLSAnalysisResponse(**tls_data) if tls_data else None,
            unavailable_checks=details.get("unavailable_checks", unavailable_checks)
        )

    def get_report_by_id(self, report_id: str, db: Session) -> Optional[schemas.AnalysisReportResponse]:
        report = db.query(models.AnalysisReport).filter(models.AnalysisReport.id == report_id).first()
        if not report:
            return None
        return self._build_report_response(report, [], [])

    def get_all_reports(self, db: Session, limit: int = 50, skip: int = 0) -> List[schemas.AnalysisReportListItem]:
        reports = (
            db.query(models.AnalysisReport)
            .order_by(models.AnalysisReport.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
        items = []
        for r in reports:
            items.append(schemas.AnalysisReportListItem(
                id=r.id,
                submitted_url=r.submitted_url,
                domain=r.domain,
                risk_level=r.risk_level,
                risk_score=r.risk_score,
                confidence=r.confidence,
                summary=r.summary,
                created_at=r.created_at,
                findings_count=len(r.findings) if r.findings else 0
            ))
        return items

    def get_dashboard_stats(self, db: Session) -> schemas.DashboardStatsResponse:
        total = db.query(models.AnalysisReport).count()
        low_risk = db.query(models.AnalysisReport).filter(models.AnalysisReport.risk_level == "LOW_RISK").count()
        suspicious = db.query(models.AnalysisReport).filter(models.AnalysisReport.risk_level == "SUSPICIOUS").count()
        high_risk = db.query(models.AnalysisReport).filter(models.AnalysisReport.risk_level == "HIGH_RISK").count()
        confirmed_malicious = db.query(models.AnalysisReport).filter(models.AnalysisReport.risk_level == "CONFIRMED_MALICIOUS").count()
        inconclusive = db.query(models.AnalysisReport).filter(models.AnalysisReport.risk_level == "INCONCLUSIVE").count()

        recent = self.get_all_reports(db, limit=8)

        risk_distribution = [
            {"name": "Low Risk", "count": low_risk, "color": "#10B981"},
            {"name": "Suspicious", "count": suspicious, "color": "#F59E0B"},
            {"name": "High Risk", "count": high_risk, "color": "#F97316"},
            {"name": "Confirmed Malicious", "count": confirmed_malicious, "color": "#EF4444"},
            {"name": "Inconclusive", "count": inconclusive, "color": "#6B7280"},
        ]

        return schemas.DashboardStatsResponse(
            total_analyzed=total,
            low_risk_count=low_risk,
            suspicious_count=suspicious,
            high_risk_count=high_risk,
            confirmed_malicious_count=confirmed_malicious,
            inconclusive_count=inconclusive,
            recent_reports=recent,
            risk_distribution=risk_distribution
        )

