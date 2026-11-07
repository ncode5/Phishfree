import axios from 'axios';
import {
  AnalysisReport,
  AnalysisReportListItem,
  DashboardStats,
  TLSAnalysis,
  MessageAnalysisReport,
  MessageAnalysisListItem,
  CorrelationReport,
  RelatedThreatsResponse,
  ThreatIntelOverview,
  SecurityAssessmentResponse,
  SecurityFindingsFilterResponse
} from '../types';

const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // In production web environment (e.g. Vercel unified deploy), use relative /api/v1
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE = getApiBase();

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  async analyzeUrl(url: string, includeTls: boolean = true): Promise<AnalysisReport> {
    const response = await apiClient.post<AnalysisReport>('/analyze/url', { url, include_tls: includeTls });
    return response.data;
  },

  async analyzeTls(target: string): Promise<TLSAnalysis> {
    const response = await apiClient.post<TLSAnalysis>('/analyze/tls', { target });
    return response.data;
  },

  async getReport(reportId: string): Promise<AnalysisReport> {
    const response = await apiClient.get<AnalysisReport>(`/reports/${reportId}`);
    return response.data;
  },

  async getReports(limit: number = 50, skip: number = 0): Promise<AnalysisReportListItem[]> {
    const response = await apiClient.get<AnalysisReportListItem[]>('/reports', {
      params: { limit, skip },
    });
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/stats');
    return response.data;
  },

  async getHealth(): Promise<{ status: string; database: string; version: string }> {
    const response = await apiClient.get('/health');
    return response.data;
  },

  async getBlockchainStatus(): Promise<any> {
    const response = await apiClient.get('/blockchain/status');
    return response.data;
  },

  async anchorReport(reportId: string): Promise<any> {
    const response = await apiClient.post(`/blockchain/anchor/${reportId}`);
    return response.data;
  },

  async analyzeMessage(message: string, analyzeUrls: boolean = true): Promise<MessageAnalysisReport> {
    const response = await apiClient.post<MessageAnalysisReport>('/analyze/message', {
      message,
      analyze_urls: analyzeUrls,
    });
    return response.data;
  },

  async getMessageReport(reportId: string): Promise<MessageAnalysisReport> {
    const response = await apiClient.get<MessageAnalysisReport>(`/analyze/message/${reportId}`);
    return response.data;
  },

  async getMessageReports(limit: number = 50, skip: number = 0): Promise<MessageAnalysisListItem[]> {
    const response = await apiClient.get<MessageAnalysisListItem[]>('/messages', {
      params: { limit, skip },
    });
    return response.data;
  },

  // Module 4: Threat Correlation & Intelligence
  async correlateReport(reportId: string, reportType: string = 'AUTO'): Promise<CorrelationReport> {
    const response = await apiClient.post<CorrelationReport>('/correlate', {
      report_id: reportId,
      report_type: reportType,
    });
    return response.data;
  },

  async getCorrelation(reportId: string): Promise<CorrelationReport> {
    const response = await apiClient.get<CorrelationReport>(`/correlations/${reportId}`);
    return response.data;
  },

  async getRelatedThreats(indicatorId: string): Promise<RelatedThreatsResponse> {
    const response = await apiClient.get<RelatedThreatsResponse>(`/threats/${indicatorId}/related`);
    return response.data;
  },

  async getThreatIntelOverview(): Promise<ThreatIntelOverview> {
    const response = await apiClient.get<ThreatIntelOverview>('/threat-intelligence/overview');
    return response.data;
  },

  // Module 5: Website Security Assessment
  async assessWebsiteSecurity(
    url: string,
    options: {
      includeHeaders?: boolean;
      includeCookies?: boolean;
      includeMixedContent?: boolean;
      includePublicFiles?: boolean;
      reportId?: string;
    } = {}
  ): Promise<SecurityAssessmentResponse> {
    const response = await apiClient.post<SecurityAssessmentResponse>('/analyze/security', {
      url,
      include_headers: options.includeHeaders ?? true,
      include_cookies: options.includeCookies ?? true,
      include_mixed_content: options.includeMixedContent ?? true,
      include_public_files: options.includePublicFiles ?? true,
      report_id: options.reportId,
    });
    return response.data;
  },

  async getSecurityAssessment(reportId: string): Promise<SecurityAssessmentResponse> {
    const response = await apiClient.get<SecurityAssessmentResponse>(`/security/${reportId}`);
    return response.data;
  },

  async getSecurityFindingsFiltered(
    reportId: string,
    severity?: string,
    category?: string,
    limit: number = 50,
    skip: number = 0
  ): Promise<SecurityFindingsFilterResponse> {
    const response = await apiClient.get<SecurityFindingsFilterResponse>(`/security/${reportId}/findings`, {
      params: { severity, category, limit, skip },
    });
    return response.data;
  },
};

export const apiService = api;


