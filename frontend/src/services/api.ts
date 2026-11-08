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
  SecurityFindingsFilterResponse,
  BlockchainNetworkStatus,
  BlockchainRegisterResponse,
  BlockchainVerifyResponse,
  BlockchainReportDetails,
  User,
  AuthResponse,
  ForgotPasswordResponse,
  AuthMessageResponse
} from '../types';

const getApiBase = (): string => {
  // Support both VITE_API_BASE_URL and VITE_API_URL environment variables
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    // Ensure /api/v1 prefix is preserved if user provided bare domain (e.g. https://phishfree-api.vercel.app)
    if (!trimmed.endsWith('/api/v1') && !trimmed.endsWith('/api')) {
      return `${trimmed}/api/v1`;
    }
    return trimmed;
  }
  // In production web environment (e.g. Vercel unified deploy), use relative /api/v1
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE = getApiBase();

export const TOKEN_STORAGE_KEY = 'phishfree_auth_token';

let inMemoryToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// Automatically inject Authorization header if token is present
apiClient.interceptors.request.use((config) => {
  const token = inMemoryToken || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

  // Module 6: Decentralized Threat Intelligence (Web3)
  async getBlockchainStatus(): Promise<BlockchainNetworkStatus> {
    const response = await apiClient.get<BlockchainNetworkStatus>('/blockchain/status');
    return response.data;
  },

  async registerReportOnChain(
    reportId: string,
    reportType: string = 'URL_ANALYSIS'
  ): Promise<BlockchainRegisterResponse> {
    const response = await apiClient.post<BlockchainRegisterResponse>(
      `/blockchain/register/${reportId}`,
      null,
      { params: { report_type: reportType } }
    );
    return response.data;
  },

  async verifyReportOnChain(reportId: string): Promise<BlockchainVerifyResponse> {
    const response = await apiClient.get<BlockchainVerifyResponse>(`/blockchain/verify/${reportId}`);
    return response.data;
  },

  async getBlockchainReportDetails(reportId: string): Promise<BlockchainReportDetails> {
    const response = await apiClient.get<BlockchainReportDetails>(`/blockchain/report/${reportId}`);
    return response.data;
  },

  // ==========================================
  // Authentication & User Management Endpoints
  // ==========================================

  async register(payload: { full_name: string; email: string; password: string; terms_accepted?: boolean }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', payload);
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  async login(payload: { email: string; password: string; remember_me?: boolean }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  async logout(): Promise<AuthMessageResponse> {
    try {
      const response = await apiClient.post<AuthMessageResponse>('/auth/logout');
      return response.data;
    } finally {
      setAuthToken(null);
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<AuthMessageResponse> {
    const response = await apiClient.post<AuthMessageResponse>('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

export const apiService = api;


