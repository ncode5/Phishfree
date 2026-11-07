from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import schemas
from app.services.analysis_service import AnalysisService
from app.services.message_analyzer import MessageAnalyzer
from app.services.threat_correlation import ThreatCorrelationService
from app.web3.sepolia import SepoliaRegistryService

router = APIRouter(tags=["Security Analysis"])
analysis_service = AnalysisService()
message_analyzer = MessageAnalyzer(analysis_service)
correlation_service = ThreatCorrelationService()
sepolia_service = SepoliaRegistryService()


@router.post(
    "/analyze/url",
    response_model=schemas.AnalysisReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit URL for comprehensive security analysis",
    description="Inspects URL structure, domain characteristics, DNS records, redirects, threat intelligence, and TLS certificates."
)
async def analyze_url(
    payload: schemas.URLAnalyzeRequest,
    db: Session = Depends(get_db)
):
    try:
        report = await analysis_service.analyze_url(payload.url, db, include_tls=payload.include_tls)
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected internal error occurred during analysis: {str(e)}"
        )


@router.post(
    "/analyze/tls",
    response_model=schemas.TLSAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Dedicated TLS certificate and digital trust analysis",
    description="Inspects HTTPS availability, X.509 certificate metadata, validity, SAN match, chain trust, crypto strength, and crt.sh logs."
)
async def analyze_tls(
    payload: schemas.TLSAnalyzeRequest
):
    try:
        return await analysis_service.tls_analyzer.analyze(payload.target)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"TLS analysis error: {str(e)}"
        )


@router.post(
    "/analyze/message",
    response_model=schemas.MessageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Submit message for scam and social engineering analysis",
    description="Inspects suspicious messages, emails, SMS, or chats for fraud patterns, urgency lures, impersonation, prompt injection, and embedded URLs."
)
async def analyze_message(
    payload: schemas.MessageAnalyzeRequest,
    db: Session = Depends(get_db)
):
    try:
        report = await message_analyzer.analyze(
            message=payload.message,
            db=db,
            analyze_urls=payload.analyze_urls
        )
        return report
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Message analysis error: {str(e)}"
        )


@router.get(
    "/analyze/message/{report_id}",
    response_model=schemas.MessageAnalysisResponse,
    summary="Retrieve message analysis report by ID",
    description="Returns detailed scam findings, extracted entities, suspicious indicators, embedded URL checks, and AI explanations."
)
async def get_message_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = message_analyzer.get_report_by_id(report_id, db)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Message analysis report '{report_id}' was not found."
        )
    return report


@router.get(
    "/messages",
    response_model=List[schemas.MessageAnalysisListItem],
    summary="Retrieve message analysis history",
    description="Returns a paginated list of previous message analysis sessions."
)
async def list_messages(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return message_analyzer.list_reports(db, limit=limit, skip=skip)


@router.get(
    "/reports/{report_id}",
    response_model=schemas.AnalysisReportResponse,
    summary="Retrieve complete analysis report by ID",
    description="Returns detailed findings, DNS records, redirect hops, domain analysis, and AI explanation."
)
async def get_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = analysis_service.get_report_by_id(report_id, db)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report '{report_id}' was not found."
        )
    return report


@router.get(
    "/reports",
    response_model=List[schemas.AnalysisReportListItem],
    summary="Retrieve analysis history",
    description="Returns a paginated list of previous URL investigations."
)
async def list_reports(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return analysis_service.get_all_reports(db, limit=limit, skip=skip)


@router.get(
    "/dashboard/stats",
    response_model=schemas.DashboardStatsResponse,
    summary="Retrieve dashboard statistics",
    description="Returns total scans, risk counts, risk distribution chart data, and recent reports."
)
async def get_dashboard_stats(
    db: Session = Depends(get_db)
):
    return analysis_service.get_dashboard_stats(db)


@router.get(
    "/health",
    response_model=schemas.HealthResponse,
    summary="Health check",
    description="Returns system operational status, active database backend, and timestamp."
)
async def health_check(
    db: Session = Depends(get_db)
):
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "operational"

    return schemas.HealthResponse(
        status="healthy",
        database=db_status,
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
        active_module="Module 1 (URL Analysis) + Module 2 (TLS & Digital Trust Analysis) + Module 3 (AI Scam & Message Analysis) + Module 4 (Intelligent Threat Correlation)"
    )


# ====================================================
# MODULE 4: Intelligent Threat Correlation Endpoints
# ====================================================

@router.post(
    "/correlate",
    response_model=schemas.CorrelationReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Correlate findings and generate threat relationship network",
    description="Cross-references findings from Modules 1, 2, and 3 across historical reports, maps infrastructure relationships, and detects campaign patterns."
)
async def correlate_report(
    payload: schemas.CorrelateRequest,
    db: Session = Depends(get_db)
):
    try:
        return correlation_service.correlate_report(
            db=db,
            report_id=payload.report_id,
            report_type=payload.report_type or "AUTO"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Threat correlation error: {str(e)}"
        )


@router.get(
    "/correlations/{report_id}",
    response_model=schemas.CorrelationReportResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve cross-module correlation report",
    description="Returns persistent or on-demand correlation intelligence, threat graph, and detected campaign patterns for a report."
)
async def get_correlation(
    report_id: str,
    db: Session = Depends(get_db)
):
    try:
        return correlation_service.get_correlation_by_report_id(db=db, report_id=report_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving correlation: {str(e)}"
        )


@router.get(
    "/threats/{indicator_id}/related",
    response_model=schemas.RelatedThreatsResponse,
    status_code=status.HTTP_200_OK,
    summary="Query connected threat indicator neighborhood",
    description="Returns 1-hop and 2-hop connected graph nodes and edges for a specific threat indicator."
)
async def get_related_threats(
    indicator_id: str,
    db: Session = Depends(get_db)
):
    try:
        return correlation_service.get_related_threats(db=db, indicator_id=indicator_id)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving related threats: {str(e)}"
        )


@router.get(
    "/threat-intelligence/overview",
    response_model=schemas.ThreatIntelOverviewResponse,
    status_code=status.HTTP_200_OK,
    summary="Platform-wide threat intelligence overview",
    description="Returns system-wide indicator metrics, relationship densities, top detected attack patterns, and recent correlations."
)
async def get_threat_intelligence_overview(
    db: Session = Depends(get_db)
):
    try:
        return correlation_service.get_threat_intel_overview(db=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving threat intelligence overview: {str(e)}"
        )


@router.get(
    "/blockchain/status",
    summary="Check Sepolia Testnet connectivity",
    description="Queries current Ethereum Sepolia block height and registry smart contract status."
)
async def get_blockchain_status():
    return await sepolia_service.get_network_status()


@router.post(
    "/blockchain/anchor/{report_id}",
    summary="Anchor report cryptographic commitment on Sepolia Testnet",
    description="Generates SHA-256 report commitment and anchors it to the Sepolia threat registry."
)
async def anchor_report_on_chain(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = analysis_service.get_report_by_id(report_id, db)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis report '{report_id}' was not found."
        )
    return await sepolia_service.anchor_report(
        report_id=report.id,
        url=report.submitted_url,
        domain=report.domain,
        risk_level=report.risk_level,
        risk_score=report.risk_score
    )
