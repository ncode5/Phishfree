import uuid
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional, Any, Set
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import models, schemas
from app.services.indicator_normalizer import IndicatorNormalizer


class RelationshipBuilder:
    """Builds and manages indicators and their relational connections across analysis modules."""

    def __init__(self):
        self.normalizer = IndicatorNormalizer()

    def get_or_create_indicator(
        self,
        db: Session,
        indicator_type: str,
        raw_value: str,
        threat_category: str = "SUSPICIOUS",
        source: str = "CORRELATION_ENGINE",
        risk_score: float = 0.0,
        details: Optional[Dict[str, Any]] = None
    ) -> models.ThreatIndicator:
        """Finds an existing indicator by type and normalized value, or creates a new one with atomic counters."""
        normalized = self.normalizer.normalize(indicator_type, raw_value)
        if not normalized:
            normalized = raw_value.strip()

        # Query existing
        existing = db.query(models.ThreatIndicator).filter(
            models.ThreatIndicator.indicator_type == indicator_type.upper(),
            or_(
                models.ThreatIndicator.normalized_value == normalized,
                models.ThreatIndicator.indicator_value == normalized
            )
        ).first()

        now = datetime.now(timezone.utc)

        if existing:
            existing.occurrence_count = (existing.occurrence_count or 1) + 1
            existing.last_seen = now
            if risk_score > (existing.risk_score or 0.0):
                existing.risk_score = risk_score
            if threat_category and threat_category != "SUSPICIOUS" and existing.threat_category == "SUSPICIOUS":
                existing.threat_category = threat_category
            if details and not existing.details:
                existing.details = details
            db.flush()
            return existing

        new_ind = models.ThreatIndicator(
            id=str(uuid.uuid4()),
            indicator_type=indicator_type.upper(),
            indicator_value=normalized,
            normalized_value=normalized,
            raw_value=raw_value,
            threat_category=threat_category,
            source=source,
            occurrence_count=1,
            risk_score=risk_score,
            details=details or {},
            first_seen=now,
            last_seen=now,
            created_at=now
        )
        db.add(new_ind)
        db.flush()
        return new_ind

    def get_or_create_relationship(
        self,
        db: Session,
        source_indicator_id: str,
        target_indicator_id: str,
        relationship_type: str,
        evidence_source: str = "CORRELATION_ENGINE",
        confidence: float = 1.0,
        details: Optional[Dict[str, Any]] = None
    ) -> models.ThreatRelationship:
        """Ensures a directed relationship edge exists between two indicators."""
        existing = db.query(models.ThreatRelationship).filter(
            models.ThreatRelationship.source_indicator_id == source_indicator_id,
            models.ThreatRelationship.target_indicator_id == target_indicator_id,
            models.ThreatRelationship.relationship_type == relationship_type
        ).first()

        if existing:
            return existing

        rel = models.ThreatRelationship(
            id=str(uuid.uuid4()),
            source_indicator_id=source_indicator_id,
            target_indicator_id=target_indicator_id,
            relationship_type=relationship_type,
            evidence_source=evidence_source,
            confidence=confidence,
            details=details or {},
            created_at=datetime.now(timezone.utc)
        )
        db.add(rel)
        db.flush()
        return rel

    def extract_and_link_url_report(
        self,
        db: Session,
        report: models.AnalysisReport
    ) -> Tuple[List[models.ThreatIndicator], List[models.ThreatRelationship]]:
        """Extracts indicators from an AnalysisReport (Modules 1 & 2) and builds graph connections."""
        indicators: List[models.ThreatIndicator] = []
        relationships: List[models.ThreatRelationship] = []

        details = report.details or {}
        risk_score = report.risk_score or 0.0

        # 1. URL indicator
        url_ind = self.get_or_create_indicator(
            db=db,
            indicator_type="URL",
            raw_value=report.submitted_url,
            threat_category="PHISHING" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 30 else "BENIGN"),
            source="MODULE_1_URL_ANALYZER",
            risk_score=risk_score,
            details={"report_id": report.id, "risk_level": report.risk_level}
        )
        indicators.append(url_ind)

        # 2. Domain indicator
        domain_val = report.domain
        domain_ind = self.get_or_create_indicator(
            db=db,
            indicator_type="DOMAIN",
            raw_value=domain_val,
            threat_category="PHISHING" if risk_score >= 70 else ("SUSPICIOUS" if risk_score >= 30 else "BENIGN"),
            source="MODULE_1_DOMAIN_ANALYZER",
            risk_score=risk_score,
            details={"report_id": report.id}
        )
        indicators.append(domain_ind)

        # Link URL -> Domain
        rel = self.get_or_create_relationship(
            db=db,
            source_indicator_id=url_ind.id,
            target_indicator_id=domain_ind.id,
            relationship_type="RESOLVES_TO_DOMAIN",
            evidence_source="URL_STRUCTURE",
            confidence=1.0
        )
        relationships.append(rel)

        # 3. DNS IPs
        dns_data = details.get("dns", {})
        a_records = dns_data.get("a_records", [])
        for ip in a_records:
            if not ip:
                continue
            ip_ind = self.get_or_create_indicator(
                db=db,
                indicator_type="IP",
                raw_value=ip,
                threat_category="HOSTING_INFRASTRUCTURE",
                source="MODULE_1_DNS_ANALYSIS",
                risk_score=risk_score * 0.5,
                details={"resolved_from_domain": domain_val}
            )
            indicators.append(ip_ind)

            rel_ip = self.get_or_create_relationship(
                db=db,
                source_indicator_id=domain_ind.id,
                target_indicator_id=ip_ind.id,
                relationship_type="HOSTED_ON_IP",
                evidence_source="DNS_A_RECORD",
                confidence=0.9
            )
            relationships.append(rel_ip)

        # 4. Redirect Hops
        redirect_data = details.get("redirects", {})
        hops = redirect_data.get("hops", [])
        prev_url_ind = url_ind
        for hop in hops:
            hop_url = hop.get("url")
            if hop_url and hop_url != report.submitted_url:
                hop_ind = self.get_or_create_indicator(
                    db=db,
                    indicator_type="URL",
                    raw_value=hop_url,
                    threat_category="REDIRECT_HOP",
                    source="MODULE_1_REDIRECT_ANALYZER",
                    risk_score=risk_score * 0.7
                )
                indicators.append(hop_ind)

                rel_hop = self.get_or_create_relationship(
                    db=db,
                    source_indicator_id=prev_url_ind.id,
                    target_indicator_id=hop_ind.id,
                    relationship_type="REDIRECTS_TO",
                    evidence_source="HTTP_REDIRECT_CHAIN",
                    confidence=0.95
                )
                relationships.append(rel_hop)
                prev_url_ind = hop_ind

        # 5. TLS Certificate Info (Module 2)
        tls_data = details.get("tls_analysis") or {}
        cert_info = tls_data.get("certificate_info") or {}
        cert_serial = cert_info.get("serial_number") or ""
        cert_issuer_dict = cert_info.get("issuer") or {}
        cert_issuer_name = cert_issuer_dict.get("organization") or cert_issuer_dict.get("common_name") or ""

        if cert_serial:
            cert_fp = f"SERIAL-{cert_serial}"
            cert_ind = self.get_or_create_indicator(
                db=db,
                indicator_type="CERT_FINGERPRINT",
                raw_value=cert_fp,
                threat_category="TLS_CERTIFICATE",
                source="MODULE_2_TLS_ANALYSIS",
                risk_score=20.0 if tls_data.get("certificate_status") in ("EXPIRED", "UNTRUSTED") else 0.0,
                details={"serial_number": cert_serial, "domain": domain_val}
            )
            indicators.append(cert_ind)

            rel_cert = self.get_or_create_relationship(
                db=db,
                source_indicator_id=domain_ind.id,
                target_indicator_id=cert_ind.id,
                relationship_type="HAS_CERTIFICATE",
                evidence_source="TLS_X509_HANDSHAKE",
                confidence=1.0
            )
            relationships.append(rel_cert)

            if cert_issuer_name:
                issuer_ind = self.get_or_create_indicator(
                    db=db,
                    indicator_type="CERT_ISSUER",
                    raw_value=cert_issuer_name,
                    threat_category="CERTIFICATE_AUTHORITY",
                    source="MODULE_2_TLS_ANALYSIS",
                    risk_score=0.0
                )
                indicators.append(issuer_ind)

                rel_issuer = self.get_or_create_relationship(
                    db=db,
                    source_indicator_id=cert_ind.id,
                    target_indicator_id=issuer_ind.id,
                    relationship_type="ISSUED_BY_CA",
                    evidence_source="X509_AUTHORITY",
                    confidence=1.0
                )
                relationships.append(rel_issuer)

        return indicators, relationships

    def extract_and_link_message_report(
        self,
        db: Session,
        report: models.MessageAnalysisReport
    ) -> Tuple[List[models.ThreatIndicator], List[models.ThreatRelationship]]:
        """Extracts indicators from a MessageAnalysisReport (Module 3) and links them to the threat graph."""
        indicators: List[models.ThreatIndicator] = []
        relationships: List[models.ThreatRelationship] = []

        details = report.details or {}
        entities = details.get("entities") or {}
        risk_score = report.risk_score or 0.0

        # Message virtual indicator
        msg_id_label = f"MSG-{report.id[:8]}"
        msg_ind = self.get_or_create_indicator(
            db=db,
            indicator_type="MESSAGE",
            raw_value=msg_id_label,
            threat_category=report.primary_category or "SCAM_COMMUNICATION",
            source="MODULE_3_MESSAGE_ANALYZER",
            risk_score=risk_score,
            details={
                "report_id": report.id,
                "preview": report.message_preview,
                "categories": report.categories,
                "risk_level": report.risk_level
            }
        )
        indicators.append(msg_ind)

        # 1. Extracted URLs
        for url in entities.get("urls", []):
            if not url:
                continue
            url_ind = self.get_or_create_indicator(
                db=db,
                indicator_type="URL",
                raw_value=url,
                threat_category="MESSAGE_LURE_URL",
                source="MODULE_3_ENTITY_EXTRACTION",
                risk_score=risk_score * 0.8
            )
            indicators.append(url_ind)

            rel_url = self.get_or_create_relationship(
                db=db,
                source_indicator_id=msg_ind.id,
                target_indicator_id=url_ind.id,
                relationship_type="EXTRACTED_FROM_MESSAGE",
                evidence_source="NATURAL_LANGUAGE_PARSER",
                confidence=0.98
            )
            relationships.append(rel_url)

            # Link URL to its Domain
            domain = self.normalizer.normalize_domain(url)
            if domain:
                dom_ind = self.get_or_create_indicator(
                    db=db,
                    indicator_type="DOMAIN",
                    raw_value=domain,
                    threat_category="SUSPICIOUS_WEB_HOST",
                    source="MODULE_3_EXTRACTED_DOMAIN",
                    risk_score=risk_score * 0.8
                )
                indicators.append(dom_ind)

                rel_dom = self.get_or_create_relationship(
                    db=db,
                    source_indicator_id=url_ind.id,
                    target_indicator_id=dom_ind.id,
                    relationship_type="RESOLVES_TO_DOMAIN",
                    evidence_source="URL_STRUCTURE",
                    confidence=1.0
                )
                relationships.append(rel_dom)

        # 2. Extracted Emails
        for email in entities.get("emails", []):
            if not email:
                continue
            email_ind = self.get_or_create_indicator(
                db=db,
                indicator_type="EMAIL",
                raw_value=email,
                threat_category="SCAM_SENDER_CONTACT",
                source="MODULE_3_ENTITY_EXTRACTION",
                risk_score=risk_score * 0.6
            )
            indicators.append(email_ind)

            rel_email = self.get_or_create_relationship(
                db=db,
                source_indicator_id=msg_ind.id,
                target_indicator_id=email_ind.id,
                relationship_type="CONTAINS_SENDER_EMAIL",
                evidence_source="MESSAGE_BODY_EXTRACTION",
                confidence=0.9
            )
            relationships.append(rel_email)

        # 3. Extracted Phone Numbers
        for phone in entities.get("phone_numbers", []):
            if not phone:
                continue
            phone_ind = self.get_or_create_indicator(
                db=db,
                indicator_type="PHONE",
                raw_value=phone,
                threat_category="SCAM_CALLER_ID",
                source="MODULE_3_ENTITY_EXTRACTION",
                risk_score=risk_score * 0.6
            )
            indicators.append(phone_ind)

            rel_phone = self.get_or_create_relationship(
                db=db,
                source_indicator_id=msg_ind.id,
                target_indicator_id=phone_ind.id,
                relationship_type="CONTAINS_CONTACT_PHONE",
                evidence_source="MESSAGE_BODY_EXTRACTION",
                confidence=0.9
            )
            relationships.append(rel_phone)

        return indicators, relationships

    def build_graph_response(
        self,
        indicators: List[models.ThreatIndicator],
        relationships: List[models.ThreatRelationship]
    ) -> schemas.ThreatGraphResponse:
        """Converts database models into a structured node-and-edge response for UI visualization."""
        node_dict: Dict[str, schemas.ThreatGraphNodeSchema] = {}
        edge_list: List[schemas.ThreatGraphEdgeSchema] = []
        seen_edges: Set[str] = set()

        for ind in indicators:
            if ind.id in node_dict:
                continue

            r_score = ind.risk_score or 0.0
            if r_score >= 80:
                r_level = "CONFIRMED_MALICIOUS" if r_score >= 90 else "HIGH_RISK"
            elif r_score >= 30:
                r_level = "SUSPICIOUS"
            elif r_score > 0:
                r_level = "LOW_RISK"
            else:
                r_level = "INFO"

            node_dict[ind.id] = schemas.ThreatGraphNodeSchema(
                id=ind.id,
                label=ind.normalized_value or ind.indicator_value or ind.id[:8],
                indicator_type=ind.indicator_type,
                normalized_value=ind.normalized_value or ind.indicator_value or "",
                risk_level=r_level,
                risk_score=r_score,
                occurrence_count=ind.occurrence_count or 1,
                details=ind.details or {}
            )

        for rel in relationships:
            edge_key = f"{rel.source_indicator_id}->{rel.target_indicator_id}:{rel.relationship_type}"
            if edge_key in seen_edges:
                continue
            seen_edges.add(edge_key)

            edge_list.append(
                schemas.ThreatGraphEdgeSchema(
                    id=rel.id or edge_key,
                    source=rel.source_indicator_id,
                    target=rel.target_indicator_id,
                    relationship_type=rel.relationship_type,
                    label=rel.relationship_type.replace("_", " ").title(),
                    evidence_source=rel.evidence_source or "CORRELATION",
                    confidence=rel.confidence or 1.0
                )
            )

        return schemas.ThreatGraphResponse(
            nodes=list(node_dict.values()),
            edges=edge_list
        )

    def get_neighborhood_graph(
        self,
        db: Session,
        root_indicator: models.ThreatIndicator,
        depth: int = 1
    ) -> Tuple[List[models.ThreatIndicator], List[models.ThreatRelationship]]:
        """Traverses the threat graph up to depth hops starting from root_indicator."""
        all_indicators: Dict[str, models.ThreatIndicator] = {root_indicator.id: root_indicator}
        all_relationships: Dict[str, models.ThreatRelationship] = {}

        current_frontier = {root_indicator.id}

        for _ in range(depth):
            if not current_frontier:
                break
            next_frontier = set()

            # Find relationships where source or target in current_frontier
            rels = db.query(models.ThreatRelationship).filter(
                or_(
                    models.ThreatRelationship.source_indicator_id.in_(list(current_frontier)),
                    models.ThreatRelationship.target_indicator_id.in_(list(current_frontier))
                )
            ).all()

            for r in rels:
                all_relationships[r.id] = r
                if r.source_indicator_id not in all_indicators:
                    next_frontier.add(r.source_indicator_id)
                if r.target_indicator_id not in all_indicators:
                    next_frontier.add(r.target_indicator_id)

            if next_frontier:
                new_inds = db.query(models.ThreatIndicator).filter(
                    models.ThreatIndicator.id.in_(list(next_frontier))
                ).all()
                for ni in new_inds:
                    all_indicators[ni.id] = ni

            current_frontier = next_frontier

        return list(all_indicators.values()), list(all_relationships.values())

