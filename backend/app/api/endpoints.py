from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import models, schemas
from app.services.analysis_service import AnalysisService
from app.services.message_analyzer import MessageAnalyzer
from app.services.threat_correlation import ThreatCorrelationService
from app.services.website_security_assessment import WebsiteSecurityAssessmentService
from app.services.blockchain_service import BlockchainService
from app.services.report_verification_service import ReportVerificationService
from app.api.auth import router as auth_router

router = APIRouter(tags=["Security Analysis"])
router.include_router(auth_router)

analysis_service = AnalysisService()
message_analyzer = MessageAnalyzer(analysis_service)
correlation_service = ThreatCorrelationService()
security_service = WebsiteSecurityAssessmentService()
blockchain_service = BlockchainService()
verification_service = ReportVerificationService(blockchain_service)


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
        active_module="Module 1 (URL Analysis) + Module 2 (TLS & Digital Trust Analysis) + Module 3 (AI Scam & Message Analysis) + Module 4 (Intelligent Threat Correlation) + Module 5 (Website Security Assessment) + Module 6 (Decentralized Threat Intelligence Blockchain Registry)"
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


# ====================================================
# MODULE 5: Website Security Assessment Endpoints
# ====================================================

@router.post(
    "/analyze/security",
    response_model=schemas.SecurityAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Run passive website security configuration assessment",
    description="Evaluates publicly observable HTTPS/TLS transport security, defensive HTTP headers, cookie security flags, mixed content, information exposure, and standard public security files."
)
async def assess_website_security(
    payload: schemas.SecurityAssessRequest,
    db: Session = Depends(get_db)
):
    try:
        return await security_service.assess_website(
            url=payload.url,
            db=db,
            include_headers=payload.include_headers,
            include_cookies=payload.include_cookies,
            include_mixed_content=payload.include_mixed_content,
            include_public_files=payload.include_public_files,
            report_id=payload.report_id
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Website security assessment error: {str(e)}"
        )


@router.get(
    "/security/{report_id}",
    response_model=schemas.SecurityAssessmentResponse,
    status_code=status.HTTP_200_OK,
    summary="Retrieve website security assessment report",
    description="Returns full security assessment score, category breakdown, and findings for a given report ID."
)
async def get_security_assessment(
    report_id: str,
    db: Session = Depends(get_db)
):
    res = security_service.get_assessment_by_id(db=db, report_id=report_id)
    if not res:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security assessment report '{report_id}' was not found."
        )
    return res


@router.get(
    "/security/{report_id}/findings",
    response_model=schemas.SecurityFindingsFilterResponse,
    status_code=status.HTTP_200_OK,
    summary="Filter findings for a website security assessment",
    description="Returns paginated security findings filtered optionally by severity (Informational, Low, Medium, High, Critical) and category."
)
async def get_security_findings_filtered(
    report_id: str,
    severity: Optional[str] = Query(None, description="Filter by severity level (Informational, Low, Medium, High, Critical)"),
    category: Optional[str] = Query(None, description="Filter by category (HTTPS_TRANSPORT, SECURITY_HEADERS, COOKIE_SECURITY, MIXED_CONTENT, INFORMATION_EXPOSURE, SECURITY_CONFIG)"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    try:
        return security_service.get_findings_filtered(
            db=db,
            report_id=report_id,
            severity=severity,
            category=category,
            limit=limit,
            skip=skip
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error filtering security findings: {str(e)}"
        )


# ====================================================
# MODULE 6: Decentralized Threat Intelligence Endpoints
# ====================================================

@router.get(
    "/blockchain/status",
    response_model=schemas.BlockchainNetworkStatusResponse,
    status_code=status.HTTP_200_OK,
    summary="Check blockchain network and registry status",
    description="Queries Ethereum Sepolia Testnet connectivity, latest block number, wallet status, and ThreatReportRegistry smart contract availability."
)
async def get_blockchain_status():
    try:
        return blockchain_service.get_network_status()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking blockchain status: {str(e)}"
        )


@router.post(
    "/blockchain/register/{report_id}",
    response_model=schemas.BlockchainRegisterResponse,
    status_code=status.HTTP_200_OK,
    summary="Register threat report on Ethereum blockchain",
    description="Computes deterministic Keccak-256 report fingerprint and broadcasts an immutable on-chain registration to ThreatReportRegistry.sol."
)
async def register_threat_report_on_chain(
    report_id: str,
    report_type: Optional[str] = Query("URL_ANALYSIS", description="URL_ANALYSIS, MESSAGE_ANALYSIS, or WEBSITE_SECURITY"),
    db: Session = Depends(get_db)
):
    try:
        result = verification_service.register_report(
            report_id=report_id,
            db=db,
            report_type=report_type
        )
        if result.get("registration_status") == "FAILED" and "not found" in str(result.get("message", "")).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result["message"]
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering report on blockchain: {str(e)}"
        )


@router.get(
    "/blockchain/verify/{report_id}",
    response_model=schemas.BlockchainVerifyResponse,
    status_code=status.HTTP_200_OK,
    summary="Verify threat report integrity against blockchain",
    description="Recomputes canonical Keccak-256 fingerprint from stored database report and independently audits on-chain registry for evidence of tampering or confirmed provenance."
)
async def verify_threat_report_integrity(
    report_id: str,
    db: Session = Depends(get_db)
):
    try:
        result = verification_service.verify_report(report_id=report_id, db=db)
        if result.get("verification_status") == "NOT_REGISTERED" and not result.get("current_report_hash"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Report '{report_id}' not found in database."
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying report integrity: {str(e)}"
        )


@router.get(
    "/blockchain/report/{report_id}",
    response_model=schemas.BlockchainReportDetailsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get blockchain registration details for a report",
    description="Retrieves persisted transaction hash, block number, Keccak-256 hash, and on-chain status from database."
)
async def get_blockchain_report_details(
    report_id: str,
    db: Session = Depends(get_db)
):
    reg = db.query(models.BlockchainReportRegistration).filter(
        models.BlockchainReportRegistration.report_id == report_id
    ).first()
    if not reg:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No blockchain registration record found for report '{report_id}'."
        )
    return reg


@router.post(
    "/blockchain/anchor/{report_id}",
    summary="Anchor report cryptographic commitment on Sepolia Testnet (Compatibility Alias)",
    description="Maintains backward compatibility with earlier client calls by invoking the Keccak-256 registration pipeline."
)
async def anchor_report_on_chain_legacy(
    report_id: str,
    db: Session = Depends(get_db)
):
    result = verification_service.register_report(report_id=report_id, db=db)
    if result.get("registration_status") == "FAILED" and "not found" in str(result.get("message", "")).lower():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["message"]
        )
    return result

