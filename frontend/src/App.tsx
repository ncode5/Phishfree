import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { CertificateTrustPage } from './pages/CertificateTrustPage';
import { CommunityReportsPage } from './pages/CommunityReportsPage';
import { ReportRegistryPage } from './pages/ReportRegistryPage';
import { IntegrationsPage } from './pages/IntegrationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ScannerPage } from './pages/ScannerPage';
import { ReportPage } from './pages/ReportPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="threat-intelligence" element={<ThreatIntelPage />} />
            <Route path="certificate-trust" element={<CertificateTrustPage />} />
            <Route path="community-reports" element={<CommunityReportsPage />} />
            <Route path="report-registry" element={<ReportRegistryPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="scanner" element={<ScannerPage />} />
            <Route path="reports/:id" element={<ReportPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
