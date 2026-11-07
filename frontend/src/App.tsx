import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ScannerPage } from './pages/ScannerPage';
import { ScamAnalyzerPage } from './pages/ScamAnalyzerPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { WebsiteSecurityPage } from './pages/WebsiteSecurityPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="scanner" element={<ScannerPage />} />
          <Route path="scam-analyzer" element={<ScamAnalyzerPage />} />
          <Route path="security" element={<WebsiteSecurityPage />} />
          <Route path="security-assessment" element={<WebsiteSecurityPage />} />
          <Route path="threat-intel" element={<ThreatIntelPage />} />
          <Route path="correlation" element={<ThreatIntelPage />} />
          <Route path="reports/:id" element={<ReportPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;

