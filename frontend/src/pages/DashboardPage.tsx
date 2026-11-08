import React, { useState } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { HeroInvestigate } from '../components/dashboard/HeroInvestigate';
import { KpiMetrics } from '../components/dashboard/KpiMetrics';
import { ThreatActivityChart } from '../components/dashboard/ThreatActivityChart';
import { TlsTrustCard } from '../components/dashboard/TlsTrustCard';
import { RecentInvestigations } from '../components/dashboard/RecentInvestigations';
import { InvestigationSnapshot } from '../components/dashboard/InvestigationSnapshot';
import { ThreatDistributionChart } from '../components/dashboard/ThreatDistributionChart';
import { CollaborativeIntel } from '../components/dashboard/CollaborativeIntel';
import { DashboardFooter } from '../components/dashboard/DashboardFooter';
import { InvestigationDetailModal } from '../components/dashboard/InvestigationDetailModal';
import { ReportThreatModal } from '../components/dashboard/ReportThreatModal';
import { initialInvestigations, InvestigationItem } from '../data/mockData';

export const DashboardPage: React.FC = () => {
  const [investigations, setInvestigations] = useState<InvestigationItem[]>(initialInvestigations);
  const [selectedItem, setSelectedItem] = useState<InvestigationItem>(initialInvestigations[1]); // account-verify.example matching Figma
  const [modalItem, setModalItem] = useState<InvestigationItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<string>('Last 7 days');
  const [showDateDropdown, setShowDateDropdown] = useState<boolean>(false);

  const [stats, setStats] = useState({
    scanned: 1284,
    highRisk: 186,
    active: 24,
    validated: 94
  });

  const dateOptions = ['Last 24 hours', 'Last 7 days', 'Last 30 days', 'Last 90 days'];

  // Handle active investigation from search bar
  const handleInvestigate = (query: string) => {
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      // Clean query
      let domain = query.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0] || query;
      if (!domain) domain = 'scam-target.example';

      const isHighRisk =
        domain.includes('verify') ||
        domain.includes('auth') ||
        domain.includes('pay') ||
        domain.includes('login') ||
        domain.includes('invoice');

      const newItem: InvestigationItem = {
        id: `inv-${Date.now()}`,
        indicator: domain,
        type: 'Domain',
        category: isHighRisk ? 'credential harvesting' : 'passive trust check',
        riskAssessment: isHighRisk ? 'High Risk' : 'Low Risk',
        evidenceSources: 'AI + DNS + VT',
        status: 'Reviewed',
        time: 'Just now',
        checksAvailable: '8/8 evidence checks available',
        details: {
          domainReputation: isHighRisk
            ? 'Newly registered host · 5 threat feeds report active spoofing.'
            : 'Known trusted infrastructure · Standard enterprise reverse DNS verified.',
          websiteSignals: isHighRisk
            ? 'Form input mimics authentication endpoint without CSP protection.'
            : 'Valid TLS certificates and security headers present.',
          tlsChecks: 'TLS 1.3 negotiated · Let\'s Encrypt authority · Hostname matches SAN.',
          warningNotice: isHighRisk
            ? 'Caution: Heuristic threat pattern detected. Verify origin with internal team.'
            : undefined
        }
      };

      setInvestigations((prev) => [newItem, ...prev.slice(0, 4)]);
      setSelectedItem(newItem);
      setStats((prev) => ({
        ...prev,
        scanned: prev.scanned + 1,
        highRisk: isHighRisk ? prev.highRisk + 1 : prev.highRisk
      }));
    }, 800);
  };

  const handleReportSubmit = (data: { url: string; category: string; description: string }) => {
    setStats((prev) => ({
      ...prev,
      validated: prev.validated + 1
    }));
  };

  return (
    <div className="space-y-5">
      {/* Page Heading & Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-tight transition-colors">
            Security overview
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
            See the signals. Understand the risk. Investigate with confidence.
          </p>
        </div>

        {/* Date Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#0b1329] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-card dark:shadow-none transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>{dateRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          </button>

          {showDateDropdown && (
            <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateRange(opt);
                    setShowDateDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                    dateRange === opt
                      ? 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5] font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{opt}</span>
                  {dateRange === opt && (
                    <Check className="w-3.5 h-3.5 text-[#0d5c4d] dark:text-[#38d4b5]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hero Interactive Scanner Bar */}
      <HeroInvestigate
        onInvestigate={handleInvestigate}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        isScanning={isScanning}
      />

      {/* 4 KPI Metrics Cards */}
      <KpiMetrics stats={stats} />

      {/* Main Grid: Left 2/3 and Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 of 12 cols on desktop) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Threat Activity Chart */}
          <ThreatActivityChart />

          {/* Recent Investigations Table */}
          <RecentInvestigations
            investigations={investigations}
            selectedId={selectedItem.id}
            onSelect={(item) => setSelectedItem(item)}
            onOpenDetails={(item) => setModalItem(item)}
          />

          {/* Threat Distribution Donut Chart */}
          <ThreatDistributionChart />
        </div>

        {/* Right Column (4 of 12 cols on desktop) */}
        <div className="lg:col-span-4 space-y-5">
          {/* TLS & Certificate Trust Card */}
          <TlsTrustCard />

          {/* Investigation Snapshot Card */}
          <InvestigationSnapshot
            item={selectedItem}
            onOpenDetails={(item) => setModalItem(item)}
          />
        </div>
      </div>

      {/* Full-width Collaborative Intelligence Card */}
      <CollaborativeIntel />

      {/* Bottom Footer Notice */}
      <DashboardFooter />

      {/* Investigation Deep Dive Modal */}
      <InvestigationDetailModal
        item={modalItem}
        onClose={() => setModalItem(null)}
      />

      {/* Report Malicious Threat Modal */}
      <ReportThreatModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
};
