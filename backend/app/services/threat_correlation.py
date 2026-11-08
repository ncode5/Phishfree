import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.database import models, schemas
from app.core.config import settings
from app.services.indicator_normalizer import IndicatorNormalizer
from app.services.relationship_builder import RelationshipBuilder
from app.services.threat_pattern_detector import ThreatPatternDetector
from app.services.correlation_risk_engine import CorrelationRiskEngine


class ThreatCorrelationService:
    """Master orchestrator for Cross-Module Threat Correlation and Campaign Intelligence."""

    def __init__(self):
        self.normalizer = IndicatorNormalizer()
        self.builder = RelationshipBuilder()
        self.detector = ThreatPatternDetector()
        self.risk_engine = CorrelationRiskEngine()

    def correlate_report(
        self,
        db: Session,
        report_id: str,
        report_type: str = "AUTO"
    ) -> schemas.CorrelationReportResponse:
        """Collects cross-module findings, builds graph topology, runs pattern detection, and derives correlated risk."""

        # 1. Fetch source report
        url_report = db.query(models.AnalysisReport).filter(models.AnalysisReport.id == report_id).first()
        msg_report = db.query(models.MessageAnalysisReport).filter(models.MessageAnalysisReport.id == report_id).first()

        resolved_type = "URL"
        current_report = None

        if report_type.upper() == "URL":
            if url_report:
                current_report = url_report
                resolved_type = "URL"
        elif report_type.upper() == "MESSAGE":
            if msg_report:
                current_report = msg_report
                resolved_type = "MESSAGE"
        else:
            # AUTO resolution: check exact ID first
            if url_report:
                current_report = url_report
                resolved_type = "URL"
            elif msg_report:
                current_report = msg_report
                resolved_type = "MESSAGE"

        # If not matched by exact UUID, smartly resolve by domain, URL, indicator value, or message preview
        if not current_report:
            clean_target = report_id.strip()
            # 1. Exact match on AnalysisReport domain or URLs
            url_match = (
                db.query(models.AnalysisReport)
                .filter(
                    (models.AnalysisReport.domain == clean_target)
                    | (models.AnalysisReport.submitted_url == clean_target)
                    | (models.AnalysisReport.normalized_url == clean_target)
                )
                .order_by(desc(models.AnalysisReport.created_at))
                .first()
            )
            # 2. Substring match on domain or submitted_url
            if not url_match:
                url_match = (
                    db.query(models.AnalysisReport)
                    .filter(
                        (models.AnalysisReport.domain.ilike(f"%{clean_target}%"))
                        | (models.AnalysisReport.submitted_url.ilike(f"%{clean_target}%"))
                    )
                    .order_by(desc(models.AnalysisReport.created_at))
                    .first()
                )
            if url_match:
                current_report = url_match
                resolved_type = "URL"
                report_id = current_report.id

        if not current_report:
            clean_target = report_id.strip()
            # 3. Match on ThreatIndicator value to find associated analysis report
            ind_match = (
                db.query(models.ThreatIndicator)
                .filter(
                    (models.ThreatIndicator.normalized_value == clean_target)
                    | (models.ThreatIndicator.indicator_value == clean_target)
                    | (models.ThreatIndicator.normalized_value.ilike(f"%{clean_target}%"))
                    | (models.ThreatIndicator.indicator_value.ilike(f"%{clean_target}%"))
                )
                .first()
            )
            if ind_match:
                url_match = (
                    db.query(models.AnalysisReport)
                    .filter(
                        (models.AnalysisReport.domain == ind_match.indicator_value)
                        | (models.AnalysisReport.submitted_url.ilike(f"%{ind_match.indicator_value}%"))
                    )
                    .order_by(desc(models.AnalysisReport.created_at))
                    .first()
                )
                if url_match:
                    current_report = url_match
                    resolved_type = "URL"
                    report_id = current_report.id

        if not current_report:
            clean_target = report_id.strip()
            # 4. Message preview match
            msg_match = (
                db.query(models.MessageAnalysisReport)
                .filter(models.MessageAnalysisReport.message_preview.ilike(f"%{clean_target}%"))
                .order_by(desc(models.MessageAnalysisReport.created_at))
                .first()
            )
            if msg_match:
                current_report = msg_match
                resolved_type = "MESSAGE"
                report_id = current_report.id

        if not current_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report or entity '{report_id}' was not found. Please select an active investigation from the list below or search by domain (e.g. paypa1-security-update.com)."
            )

        # 2. Extract and link indicators
        if resolved_type == "URL":
            indicators, relationships = self.builder.extract_and_link_url_report(db, current_report)
            base_score = current_report.risk_score or 0.0
            raw_details = current_report.details or {}
            ti_data = raw_details.get("threat_intel") or {}
            has_authoritative_intel = bool(ti_data.get("is_malicious"))
            is_missing_checks = bool(current_report.analysis_status != "COMPLETED")
        else:
            indicators, relationships = self.builder.extract_and_link_message_report(db, current_report)
            base_score = current_report.risk_score or 0.0
            has_authoritative_intel = False
            is_missing_checks = bool(current_report.analysis_status != "COMPLETED")

        # 3. Detect multi-module patterns
        patterns = self.detector.detect_patterns(
            db=db,
            report_id=report_id,
            report_type=resolved_type,
            current_report=current_report,
            indicators=indicators,
            relationships=relationships
        )

        # 4. Compute correlation risk
        final_score, risk_level, confidence, transparency = self.risk_engine.compute_correlation_risk(
            base_score=base_score,
            patterns=patterns,
            has_authoritative_intel=has_authoritative_intel,
            is_missing_checks=is_missing_checks
        )

        # 5. Populate verified and technical observations
        if resolved_type == "URL":
            details = current_report.details or {}
            dns = details.get("dns", {})
            if dns.get("a_records"):
                transparency.technical_observations.append({
                    "category": "DNS_RESOLUTION",
                    "observation": f"Resolved {len(dns['a_records'])} A records: {', '.join(dns['a_records'][:3])}"
                })
            tls = details.get("tls_analysis", {})
            if tls.get("certificate_status"):
                transparency.technical_observations.append({
                    "category": "TLS_HANDSHAKE",
                    "observation": f"HTTPS negotiated ({tls.get('tls_version') or 'TLS'}). Status: {tls.get('certificate_status')}"
                })
            ti = details.get("threat_intel", {})
            if ti.get("is_malicious"):
                transparency.verified_external_evidence.append({
                    "provider": ti.get("provider", "VirusTotal"),
                    "verdict": "MALICIOUS",
                    "detections": f"{ti.get('malicious_count')}/{ti.get('total_engines')} engines flagged this indicator"
                })
        else:
            details = current_report.details or {}
            entities = details.get("entities", {})
            transparency.technical_observations.append({
                "category": "ENTITY_EXTRACTION",
                "observation": f"Extracted {len(entities.get('urls', []))} URLs, {len(entities.get('emails', []))} emails, {len(entities.get('phone_numbers', []))} phone numbers."
            })

        # 6. Generate explainable AI narrative
        explanation = self._generate_correlation_explanation(
            report_type=resolved_type,
            final_score=final_score,
            risk_level=risk_level,
            patterns=patterns,
            indicators=indicators
        )

        # Add AI insights to transparency
        transparency.ai_generated_insights = explanation.reasoning

        # 7. Convert in-memory graph to schema
        graph_response = self.builder.build_graph_response(indicators, relationships)

        # 8. Persist ThreatCorrelation pattern entries
        for p in patterns:
            corr_entry = models.ThreatCorrelation(
                id=str(uuid.uuid4()),
                report_id=report_id,
                pattern_name=p.pattern_name,
                description=p.description,
                severity=p.severity,
                confidence=p.confidence,
                supporting_evidence=p.supporting_evidence,
                related_reports=p.related_reports,
                created_at=datetime.now(timezone.utc)
            )
            db.add(corr_entry)

        # 9. Persist or Update CorrelationReport record
        existing_cr = db.query(models.CorrelationReport).filter(
            models.CorrelationReport.report_id == report_id
        ).first()

        now = datetime.now(timezone.utc)
        summary_text = (
            f"Correlation analysis complete. Evaluated {len(indicators)} indicators and identified "
            f"{len(patterns)} threat patterns. Assessed overall risk as {risk_level} (Score: {final_score}/100)."
        )

        if existing_cr:
            existing_cr.correlation_score = final_score
            existing_cr.risk_level = risk_level
            existing_cr.confidence = confidence
            existing_cr.summary = summary_text
            existing_cr.graph_data = graph_response.model_dump()
            existing_cr.patterns = [p.model_dump() for p in patterns]
            existing_cr.explanation = explanation.model_dump()
            existing_cr.evidence_breakdown = transparency.model_dump()
            db.commit()
            report_record_id = existing_cr.id
        else:
            new_cr = models.CorrelationReport(
                id=str(uuid.uuid4()),
                report_id=report_id,
                report_type=resolved_type,
                correlation_score=final_score,
                risk_level=risk_level,
                confidence=confidence,
                summary=summary_text,
                graph_data=graph_response.model_dump(),
                patterns=[p.model_dump() for p in patterns],
                explanation=explanation.model_dump(),
                evidence_breakdown=transparency.model_dump(),
                created_at=now
            )
            db.add(new_cr)
            db.commit()
            report_record_id = new_cr.id

        return schemas.CorrelationReportResponse(
            id=report_record_id,
            report_id=report_id,
            report_type=resolved_type,
            correlation_score=final_score,
            risk_level=risk_level,
            confidence=confidence,
            summary=summary_text,
            graph=graph_response,
            patterns=patterns,
            explanation=explanation,
            evidence_transparency=transparency,
            created_at=now
        )

    def get_correlation_by_report_id(self, db: Session, report_id: str) -> schemas.CorrelationReportResponse:
        """Retrieves existing correlation report, or dynamically generates one if not yet computed."""
        cr = db.query(models.CorrelationReport).filter(models.CorrelationReport.report_id == report_id).first()
        if cr:
            # Reconstruct response from stored JSON
            graph_data = cr.graph_data or {"nodes": [], "edges": []}
            return schemas.CorrelationReportResponse(
                id=cr.id,
                report_id=cr.report_id,
                report_type=cr.report_type,
                correlation_score=cr.correlation_score,
                risk_level=cr.risk_level,
                confidence=cr.confidence,
                summary=cr.summary,
                graph=schemas.ThreatGraphResponse(**graph_data),
                patterns=[schemas.ThreatPatternSchema(**p) for p in (cr.patterns or [])],
                explanation=schemas.CorrelationExplanationSchema(**(cr.explanation or {
                    "summary": cr.summary,
                    "risk_level": cr.risk_level,
                    "reasoning": [],
                    "corroborating_factors": [],
                    "mitigating_factors": [],
                    "recommendations": []
                })),
                evidence_transparency=schemas.EvidenceTransparencySchema(**(cr.evidence_breakdown or {
                    "verified_external_evidence": [],
                    "technical_observations": [],
                    "rule_based_correlations": [],
                    "ai_generated_insights": []
                })),
                created_at=cr.created_at
            )

        # If not already persisted, run correlation
        return self.correlate_report(db=db, report_id=report_id)

    def get_related_threats(self, db: Session, indicator_id: str) -> schemas.RelatedThreatsResponse:
        """Queries 1-hop and 2-hop graph neighborhood for an indicator."""
        root_ind = db.query(models.ThreatIndicator).filter(models.ThreatIndicator.id == indicator_id).first()
        if not root_ind:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Threat indicator '{indicator_id}' not found."
            )

        connected_inds, connected_rels = self.builder.get_neighborhood_graph(db, root_ind, depth=2)
        graph = self.builder.build_graph_response(connected_inds, connected_rels)

        direct_rels = [
            r for r in connected_rels
            if r.source_indicator_id == root_ind.id or r.target_indicator_id == root_ind.id
        ]

        return schemas.RelatedThreatsResponse(
            root_indicator=schemas.ThreatIndicatorSchema.model_validate(root_ind),
            direct_connections=[schemas.ThreatRelationshipSchema.model_validate(r) for r in direct_rels],
            connected_indicators=[schemas.ThreatIndicatorSchema.model_validate(i) for i in connected_inds if i.id != root_ind.id],
            graph=graph
        )

    def get_threat_intel_overview(self, db: Session) -> schemas.ThreatIntelOverviewResponse:
        """Returns aggregated telemetry and recent campaign patterns across the platform."""
        total_indicators = db.query(models.ThreatIndicator).count()
        unique_domains = db.query(models.ThreatIndicator).filter(models.ThreatIndicator.indicator_type == "DOMAIN").count()
        unique_ips = db.query(models.ThreatIndicator).filter(models.ThreatIndicator.indicator_type == "IP").count()
        unique_certs = db.query(models.ThreatIndicator).filter(models.ThreatIndicator.indicator_type == "CERT_FINGERPRINT").count()
        suspicious_rels = db.query(models.ThreatRelationship).count()
        detected_patterns = db.query(models.ThreatCorrelation).count()
        total_correlations = db.query(models.CorrelationReport).count()

        # Recent correlations with human-readable target labels
        recent_crs = db.query(models.CorrelationReport).order_by(desc(models.CorrelationReport.created_at)).limit(6).all()
        recent_list = []
        for cr in recent_crs:
            label = cr.report_id[:8]
            if cr.report_type == "URL":
                u = db.query(models.AnalysisReport).filter(models.AnalysisReport.id == cr.report_id).first()
                if u and (u.domain or u.submitted_url):
                    label = u.domain or u.submitted_url
            elif cr.report_type == "MESSAGE":
                m = db.query(models.MessageAnalysisReport).filter(models.MessageAnalysisReport.id == cr.report_id).first()
                if m and m.message_preview:
                    label = m.message_preview[:28] + ("..." if len(m.message_preview) > 28 else "")

            recent_list.append({
                "id": cr.id,
                "report_id": cr.report_id,
                "report_type": cr.report_type,
                "risk_level": cr.risk_level,
                "score": cr.correlation_score,
                "patterns_count": len(cr.patterns or []),
                "target_label": label,
                "created_at": cr.created_at.isoformat() if cr.created_at else None
            })

        # Fallback if no CorrelationReports yet: populate from top AnalysisReports
        if not recent_list:
            top_reports = db.query(models.AnalysisReport).order_by(desc(models.AnalysisReport.created_at)).limit(6).all()
            for tr in top_reports:
                recent_list.append({
                    "id": tr.id,
                    "report_id": tr.id,
                    "report_type": "URL",
                    "risk_level": tr.risk_level,
                    "score": tr.risk_score or 0.0,
                    "patterns_count": 0,
                    "target_label": tr.domain or tr.submitted_url or tr.id[:8],
                    "created_at": tr.created_at.isoformat() if tr.created_at else None
                })

        # Top patterns
        pattern_counts = db.query(
            models.ThreatCorrelation.pattern_name,
            func.count(models.ThreatCorrelation.id).label("count")
        ).group_by(models.ThreatCorrelation.pattern_name).order_by(desc("count")).limit(5).all()

        top_patterns = [{"pattern_name": p[0], "occurrences": p[1]} for p in pattern_counts]

        return schemas.ThreatIntelOverviewResponse(
            total_indicators=total_indicators,
            unique_domains=unique_domains,
            unique_ips=unique_ips,
            unique_certificates=unique_certs,
            suspicious_relationships=suspicious_rels,
            detected_threat_patterns=detected_patterns,
            total_correlations=total_correlations,
            recent_correlations=recent_list,
            top_patterns=top_patterns
        )

    def _generate_correlation_explanation(
        self,
        report_type: str,
        final_score: float,
        risk_level: str,
        patterns: List[schemas.ThreatPatternSchema],
        indicators: List[models.ThreatIndicator]
    ) -> schemas.CorrelationExplanationSchema:
        """Generates evidence-grounded reasoning without fabricating unverified associations."""

        reasoning: List[str] = []
        corroborating: List[str] = []
        mitigating: List[str] = []
        recommendations: List[str] = []

        if not patterns:
            reasoning.append("No multi-module malicious correlation patterns were detected for this submission.")
            mitigating.append("Target indicators do not appear in active campaign clusters or repeated scam lures.")
            recommendations.append("Continue monitoring indicator; exercise standard verification practices.")
            return schemas.CorrelationExplanationSchema(
                summary=f"Isolated findings evaluation: Risk assessed as {risk_level} based on individual technical metrics.",
                risk_level=risk_level,
                reasoning=reasoning,
                corroborating_factors=[],
                mitigating_factors=mitigating,
                recommendations=recommendations,
                is_deterministic_fallback=True
            )

        for p in patterns:
            reasoning.append(f"{p.pattern_name}: {p.description}")
            if p.severity in ("CRITICAL", "HIGH"):
                corroborating.append(p.reason or p.description)
            elif p.severity == "INFO":
                mitigating.append(p.description)

        if final_score >= 70.0:
            recommendations.append("Block traffic to this destination at the firewall/gateway level.")
            recommendations.append("Investigate connected hosting infrastructure for secondary command & control endpoints.")
            recommendations.append("Alert users who interacted with related message lures.")
        elif final_score >= 30.0:
            recommendations.append("Enforce heightened authentication and avoid entering credentials.")
            recommendations.append("Verify sender identity via independent out-of-band channels.")
        else:
            recommendations.append("Low immediate risk identified; standard cyber hygiene applies.")

        summary_text = (
            f"Correlation analysis identified {len(patterns)} pattern(s) across {len(indicators)} indicators. "
            f"Cross-module telemetry corroborates an overall risk rating of {risk_level}."
        )

        return schemas.CorrelationExplanationSchema(
            summary=summary_text,
            risk_level=risk_level,
            reasoning=reasoning,
            corroborating_factors=corroborating,
            mitigating_factors=mitigating,
            recommendations=recommendations,
            is_deterministic_fallback=True
        )

