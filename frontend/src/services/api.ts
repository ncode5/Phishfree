import axios from 'axios';
import { AnalysisReport, AnalysisReportListItem, DashboardStats, TLSAnalysis } from '../types';

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
  timeout: 15000,
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
};

