import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Globe,
  Mail,
  HelpCircle,
  FileText,
  Layers,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  ChevronDown,
  Info,
  Link2,
  Shield,
  Lock,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Calendar,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { useTheme } from '../context/ThemeContext';

// Mathematical SVG Arc Helpers for rock-solid zero-dependency Donut Chart
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number,
  padAngle = 1.8
) {
  const effectiveStart = startAngle + padAngle;
  const effectiveEnd = endAngle - padAngle;

  let sweepAngle = effectiveEnd - effectiveStart;
  while (sweepAngle < 0) sweepAngle += 360;
  while (sweepAngle >= 360) sweepAngle -= 360;

  const startOuter = polarToCartesian(cx, cy, outerR, effectiveStart);
  const endOuter = polarToCartesian(cx, cy, outerR, effectiveEnd);
  const startInner = polarToCartesian(cx, cy, innerR, effectiveEnd);
  const endInner = polarToCartesian(cx, cy, innerR, effectiveStart);

  const largeArcFlag = sweepAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x.toFixed(2)} ${startOuter.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${endOuter.x.toFixed(2)} ${endOuter.y.toFixed(2)}`,
    `L ${startInner.x.toFixed(2)} ${startInner.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${endInner.x.toFixed(2)} ${endInner.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'url' | 'message'>('url');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'7D' | '30D' | '90D'>('7D');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [hoveredThreat, setHoveredThreat] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const timeFilterLabels: Record<'7D' | '30D' | '90D', string> = {
    '7D': 'Last 7 days',
    '30D': 'Last 30 days',
    '90D': 'Last 90 days',
  };

  // Selected investigation row for the live snapshot preview
  const [selectedSnapshot, setSelectedSnapshot] = useState({
    indicator: 'account-verify.example',
    riskLevel: 'High Risk',
    badgeClass: 'bg-orange-50 text-orange-950 border-orange-300 dark:bg-[#431407]/70 dark:text-[#FB923C] dark:border-orange-500/70',
    evidenceCount: '8 / 10',
    time: 'Today, 14:24 UTC',
    domainNote: '2-day-old domain · 3 redirects · 7/94 VT engines flag it. DNS links to a reported indicator.',
    signalNote: 'CSP absent. AI flags urgent credential requests; correlated with an impersonation report.',
    tlsNote: 'Hostname, expiry, chain & key strength pass. Revocation and CT lookups unavailable.'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.warn('Dashboard stats fallback to simulated telemetry:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleInvestigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (activeTab === 'url') {
      navigate(`/scanner?url=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/scam-analyzer?message=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Dynamic multi-range investigation activity data (7D, 30D, 90D)
  const activityDataMap: Record<'7D' | '30D' | '90D', {
    totalInvestigations: string;
    totalHighRisk: string;
    ticks: number[];
    domain: [number, number];
    data: Array<{ day: string; investigations: number; highRisk: number }>;
  }> = {
    '7D': {
      totalInvestigations: stats?.total_analyzed ? Number(stats.total_analyzed).toLocaleString() : '1,284',
      totalHighRisk: stats ? String((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) : '186',
      ticks: [0, 125, 250],
      domain: [0, 250],
      data: [
        { day: '01 Nov', investigations: 145, highRisk: 22 },
        { day: '02 Nov', investigations: 160, highRisk: 28 },
        { day: '03 Nov', investigations: 152, highRisk: 24 },
        { day: '04 Nov', investigations: 178, highRisk: 31 },
        { day: '05 Nov', investigations: 195, highRisk: 36 },
        { day: '06 Nov', investigations: 215, highRisk: 42 },
        { day: '07 Nov', investigations: 232, highRisk: 48 },
      ],
    },
    '30D': {
      totalInvestigations: stats?.total_analyzed ? Number(stats.total_analyzed * 4).toLocaleString() : '5,420',
      totalHighRisk: stats ? String(Math.round(((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) * 4.2)) : '792',
      ticks: [0, 500, 1000],
      domain: [0, 1000],
      data: [
        { day: '09 Oct', investigations: 680, highRisk: 95 },
        { day: '14 Oct', investigations: 720, highRisk: 104 },
        { day: '19 Oct', investigations: 710, highRisk: 98 },
        { day: '24 Oct', investigations: 760, highRisk: 112 },
        { day: '29 Oct', investigations: 810, highRisk: 122 },
        { day: '03 Nov', investigations: 860, highRisk: 128 },
        { day: '07 Nov', investigations: 880, highRisk: 133 },
      ],
    },
    '90D': {
      totalInvestigations: stats?.total_analyzed ? Number(stats.total_analyzed * 12).toLocaleString() : '16,850',
      totalHighRisk: stats ? String(Math.round(((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) * 12.8)) : '2,410',
      ticks: [0, 1500, 3000],
      domain: [0, 3000],
      data: [
        { day: '15 Aug', investigations: 1820, highRisk: 240 },
        { day: '01 Sep', investigations: 2100, highRisk: 290 },
        { day: '15 Sep', investigations: 2280, highRisk: 315 },
        { day: '01 Oct', investigations: 2450, highRisk: 345 },
        { day: '15 Oct', investigations: 2600, highRisk: 380 },
        { day: '01 Nov', investigations: 2780, highRisk: 410 },
        { day: '07 Nov', investigations: 2820, highRisk: 430 },
      ],
    },
  };

  // Dynamic metrics data for top 4 cards
  const metricsDataMap: Record<'7D' | '30D' | '90D', {
    totalAnalyzed: string;
    analyzedChange: string;
    highRiskCount: string;
    highRiskPercent: string;
    activeCount: string;
    activeToday: string;
    validatedCount: string;
    pendingValidation: string;
  }> = {
    '7D': {
      totalAnalyzed: stats?.total_analyzed ? Number(stats.total_analyzed).toLocaleString() : '1,284',
      analyzedChange: '↑ 18.6% vs prior week',
      highRiskCount: stats ? String((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) : '186',
      highRiskPercent: '14.5% of investigations',
      activeCount: '24',
      activeToday: '24 today',
      validatedCount: '94',
      pendingValidation: '8 pending validation',
    },
    '30D': {
      totalAnalyzed: stats?.total_analyzed ? Number(stats.total_analyzed * 4).toLocaleString() : '5,420',
      analyzedChange: '↑ 24.2% vs prior month',
      highRiskCount: stats ? String(Math.round(((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) * 4.2)) : '792',
      highRiskPercent: '14.6% of investigations',
      activeCount: '118',
      activeToday: '14 today',
      validatedCount: '412',
      pendingValidation: '22 pending validation',
    },
    '90D': {
      totalAnalyzed: stats?.total_analyzed ? Number(stats.total_analyzed * 12).toLocaleString() : '16,850',
      analyzedChange: '↑ 31.5% vs prior quarter',
      highRiskCount: stats ? String(Math.round(((stats.high_risk_count ?? 0) + (stats.confirmed_malicious_count ?? 0)) * 12.8)) : '2,410',
      highRiskPercent: '14.3% of investigations',
      activeCount: '342',
      activeToday: '28 today',
      validatedCount: '1,180',
      pendingValidation: '45 pending validation',
    },
  };

  const currentActivity = activityDataMap[timeFilter];
  const currentMetrics = metricsDataMap[timeFilter];

  // Threat Distribution categories matching exact dashboard design reference
  const threatCategories = [
    {
      id: 'safe',
      name: 'Safe Websites',
      percent: 20,
      count: '2,000',
      color: '#00D29E',
      startAngle: 38,
      endAngle: 110,
    },
    {
      id: 'phishing',
      name: 'Phishing Websites',
      percent: 18,
      count: '1,800',
      color: '#3B82F6',
      startAngle: 333.2,
      endAngle: 398,
    },
    {
      id: 'suspicious',
      name: 'Suspicious Websites',
      percent: 14,
      count: '1,400',
      color: '#F59E0B',
      startAngle: 282.8,
      endAngle: 333.2,
    },
    {
      id: 'malicious',
      name: 'Malicious URLs',
      percent: 48,
      count: '4,800',
      color: '#EF4444',
      startAngle: 110,
      endAngle: 282.8,
    },
  ];

  const activeThreat = threatCategories.find((c) => c.id === hoveredThreat);

  // Recent investigation sample rows
  const recentRows = [
    {
      indicator: 'wallet-sync.example',
      risk: 'Confirmed Malicious',
      badgeClass: 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-[#450A0A]/80 dark:text-[#F87171] dark:border-red-500/80',
      evidence: 'VT / Safe Browsing',
      status: 'Reviewed',
      statusDot: 'bg-emerald-500',
      utc: '14:29',
      snapshot: {
        indicator: 'wallet-sync.example',
        riskLevel: 'Confirmed Malicious',
        badgeClass: 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-[#450A0A]/80 dark:text-[#F87171] dark:border-red-500/80',
        evidenceCount: '10 / 10',
        time: 'Today, 14:29 UTC',
        domainNote: 'Known phishing kit target. Matches active Web3 seed phrase drainer campaigns.',
        signalNote: 'Impersonates MetaMask / TrustWallet. Urgent private key intake form detected.',
        tlsNote: 'Self-signed certificate with invalid SAN. Cryptographic trust completely absent.'
      }
    },
    {
      indicator: 'account-verify.example',
      risk: 'High Risk',
      badgeClass: 'bg-orange-50 text-orange-950 border-orange-300 dark:bg-[#431407]/70 dark:text-[#FB923C] dark:border-orange-500/70',
      evidence: 'AI + DNS + VT',
      status: 'In review',
      statusDot: 'bg-amber-500',
      utc: '14:24',
      snapshot: {
        indicator: 'account-verify.example',
        riskLevel: 'High Risk',
        badgeClass: 'bg-orange-50 text-orange-950 border-orange-300 dark:bg-[#431407]/70 dark:text-[#FB923C] dark:border-orange-500/70',
        evidenceCount: '8 / 10',
        time: 'Today, 14:24 UTC',
        domainNote: '2-day-old domain · 3 redirects · 7/94 VT engines flag it. DNS links to a reported indicator.',
        signalNote: 'CSP absent. AI flags urgent credential requests; correlated with an impersonation report.',
        tlsNote: 'Hostname, expiry, chain & key strength pass. Revocation and CT lookups unavailable.'
      }
    },
    {
      indicator: '"Your invoice is overdue"',
      risk: 'Suspicious',
      badgeClass: 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-[#451A03]/70 dark:text-[#FBBF24] dark:border-amber-500/70',
      evidence: 'AI + Community',
      status: 'Pending',
      statusDot: 'bg-amber-500',
      utc: '14:18',
      snapshot: {
        indicator: '"Your invoice is overdue"',
        riskLevel: 'Suspicious',
        badgeClass: 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-[#451A03]/70 dark:text-[#FBBF24] dark:border-amber-500/70',
        evidenceCount: '6 / 10',
        time: 'Today, 14:18 UTC',
        domainNote: 'Unverified SMS lure text claiming immediate banking legal action.',
        signalNote: 'AI detects extreme urgency manipulation and malicious link redirection.',
        tlsNote: 'Embedded shortlink redirects to unencrypted target endpoint.'
      }
    },
    {
      indicator: 'docs.acme.example',
      risk: 'Low Risk',
      badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-[#064E3B]/70 dark:text-[#34D399] dark:border-emerald-500/70',
      evidence: 'DNS + TLS + GSB',
      status: 'Reviewed',
      statusDot: 'bg-emerald-500',
      utc: '14:12',
      snapshot: {
        indicator: 'docs.acme.example',
        riskLevel: 'Low Risk',
        badgeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-[#064E3B]/70 dark:text-[#34D399] dark:border-emerald-500/70',
        evidenceCount: '10 / 10',
        time: 'Today, 14:12 UTC',
        domainNote: 'Clean enterprise sub-domain. Valid DNS MX/SPF/DKIM records active.',
        signalNote: 'Zero credential harvesting traps or deceptive forms detected.',
        tlsNote: 'Modern TLS 1.3 encryption with 2048-bit RSA key and valid SAN.'
      }
    },
    {
      indicator: 'cdn-update.example',
      risk: 'Inconclusive',
      badgeClass: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#131F37] dark:text-[#94A3B8] dark:border-slate-700',
      evidence: 'TLS / CT',
      status: 'Partial',
      statusDot: 'bg-slate-400',
      utc: '14:06',
      snapshot: {
        indicator: 'cdn-update.example',
        riskLevel: 'Inconclusive',
        badgeClass: 'bg-slate-100 text-slate-900 border-slate-300 dark:bg-[#131F37] dark:text-[#94A3B8] dark:border-slate-700',
        evidenceCount: '4 / 10',
        time: 'Today, 14:06 UTC',
        domainNote: 'Endpoint timed out during zone transfer probe. Insufficient telemetry.',
        signalNote: 'Public reputation records not yet indexed in external databases.',
        tlsNote: 'Certificate Transparency logs show issuance 12 hours ago.'
      }
    }
  ];

  const isDark = resolvedTheme === 'dark';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Page Title & Date Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">Security overview</h1>
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5 font-medium">
            See the signals. Understand the risk. Investigate with confidence.
          </p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-xs font-bold text-slate-900 dark:text-slate-200 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />
            <span>{timeFilterLabels[timeFilter]}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844] shadow-xl py-1.5 z-50 animate-fadeIn">
              {(['7D', '30D', '90D'] as const).map((period) => {
                const isSelected = timeFilter === period;
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => {
                      setTimeFilter(period);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-bold flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-yellow-400/15 text-blue-700 dark:text-yellow-300'
                        : 'text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{timeFilterLabels[period]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Hero Interactive Investigation Card */}
      <div className="phish-card p-5">
        {/* Top Tab Bar & Helper */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'url'
                  ? 'bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-950 dark:text-[#00E5A3] border border-emerald-300 dark:border-[#00D29E]/40 shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
              <span>URL / Domain</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('message')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'message'
                  ? 'bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-950 dark:text-[#00E5A3] border border-emerald-300 dark:border-[#00D29E]/40 shadow-sm'
                  : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-semibold'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
              <span>Message / Email</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowHelper(!showHelper)}
            className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors font-medium"
          >
            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>How to use the scanner?</span>
          </button>
        </div>

        {/* Modal / Helper Accordion */}
        {showHelper && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-[#00D29E]/10 border border-emerald-300 dark:border-[#00D29E]/30 text-xs text-emerald-950 dark:text-[#00E5A3] flex items-start gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-emerald-800 dark:text-[#00E5A3] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Safe, Multi-Vector Inspection Protocol:</p>
              <p className="text-slate-800 dark:text-slate-300 text-[11px] mt-0.5 font-medium">
                Paste any suspicious link, domain, or SMS message. PhishFree inspects typosquatting, X.509 TLS certificates, DNS zones, and safe redirect hops without downloading malware or running scripts.
              </p>
            </div>
          </div>
        )}

        {/* Search Input & Action Buttons */}
        <form onSubmit={handleInvestigate} className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'url'
                  ? 'Paste a suspicious URL or domain to inspect its trust signals'
                  : 'Paste suspicious message, SMS text, or email body to evaluate phishing lures'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] rounded-lg text-xs font-mono text-slate-950 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-700 dark:focus:border-[#00D29E] focus:ring-1 focus:ring-emerald-700 dark:focus:ring-[#00D29E] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs font-bold text-white dark:text-slate-950 bg-emerald-800 hover:bg-emerald-700 dark:bg-[#00D29E] dark:hover:bg-[#00b887] shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Investigate</span>
            </button>
            <Link
              to="/blockchain"
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-200 bg-white dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Report a threat</span>
            </Link>
          </div>
        </form>

        {/* Capability Tags */}
        <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-700 dark:text-slate-300 pt-3 flex-wrap">
          <span>Domain & redirects</span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span>Threat reputation</span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span>DNS & TLS</span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span>Website security</span>
          <span className="text-slate-400 dark:text-slate-600">·</span>
          <span>AI scan analysis</span>
        </div>
      </div>

      {/* 3. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Websites Analysed */}
        <div className="phish-card p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Websites Analysed</div>
              <div className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white mt-1">
                {currentMetrics.totalAnalyzed}
              </div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-[#00E5A3] mt-1 flex items-center gap-1">
                <span>{currentMetrics.analyzedChange}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-800 dark:text-[#00E5A3] border border-emerald-300 dark:border-[#00D29E]/40 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          {/* Sparkline wave */}
          <div className="mt-2 h-7 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full preserve-3d" fill="none">
              <path
                d="M0 20 C20 18, 35 12, 50 16 C65 20, 80 8, 100 12"
                stroke={isDark ? "#00D29E" : "#047857"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: High-Risk Websites */}
        <div className="phish-card p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300">High-Risk Websites</div>
              <div className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white mt-1">
                {currentMetrics.highRiskCount}
              </div>
              <div className="text-[11px] font-bold text-red-700 dark:text-rose-400 mt-1">
                <span>{currentMetrics.highRiskPercent}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-rose-950/70 text-red-700 dark:text-rose-400 border border-red-300 dark:border-rose-800 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          {/* Sparkline wave */}
          <div className="mt-2 h-7 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full preserve-3d" fill="none">
              <path
                d="M0 18 C25 22, 45 10, 65 14 C80 18, 90 6, 100 10"
                stroke="#EF4444"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Active Investigations */}
        <div className="phish-card p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Active Investigations</div>
              <div className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white mt-1">
                {currentMetrics.activeCount}
              </div>
              <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mt-1">
                <span>{currentMetrics.activeToday}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
          </div>
          {/* Sparkline wave */}
          <div className="mt-2 h-7 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full preserve-3d" fill="none">
              <path
                d="M0 16 C20 12, 40 22, 60 14 C75 8, 90 18, 100 12"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Validated Threat Reports */}
        <div className="phish-card p-4 relative overflow-hidden">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Validated Threat Reports</div>
              <div className="text-2xl font-extrabold font-mono text-slate-950 dark:text-white mt-1">
                {currentMetrics.validatedCount}
              </div>
              <div className="text-[11px] font-bold text-emerald-800 dark:text-[#00E5A3] mt-1">
                <span>{currentMetrics.pendingValidation}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-800 dark:text-[#00E5A3] border border-emerald-300 dark:border-[#00D29E]/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          {/* Sparkline wave */}
          <div className="mt-2 h-7 w-full">
            <svg viewBox="0 0 100 25" className="w-full h-full preserve-3d" fill="none">
              <path
                d="M0 22 C30 18, 50 14, 70 8 C85 6, 95 14, 100 10"
                stroke={isDark ? "#00D29E" : "#047857"}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Row 2: Threat Activity & TLS Certificate Trust */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Threat Activity Area Chart */}
        <div className="lg:col-span-2 phish-card p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Threat activity</h2>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">Investigation volume and high-risk findings over time</p>
            </div>
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844]">
              {(['7D', '30D', '90D'] as const).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setTimeFilter(period)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    timeFilter === period
                      ? 'bg-emerald-800 dark:bg-[#00D29E] text-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#00D29E]" />
              <span className="font-bold text-slate-800 dark:text-slate-300">Investigations</span>
              <span className="font-extrabold text-slate-950 dark:text-white font-mono text-sm">{currentActivity.totalInvestigations}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#EF4444]" />
              <span className="font-bold text-slate-800 dark:text-slate-300">High-risk findings</span>
              <span className="font-extrabold text-slate-950 dark:text-white font-mono text-sm">{currentActivity.totalHighRisk}</span>
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentActivity.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInvestigations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isDark ? "#00D29E" : "#10B981"} stopOpacity={isDark ? 0.75 : 0.25} />
                    <stop offset="95%" stopColor={isDark ? "#00D29E" : "#10B981"} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={isDark ? '#94A3B8' : '#334155'} fontSize={11} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#1E293B', fontWeight: 600 }} />
                <YAxis stroke={isDark ? '#94A3B8' : '#334155'} fontSize={11} tickLine={false} ticks={currentActivity.ticks} domain={currentActivity.domain} tick={{ fill: isDark ? '#94A3B8' : '#1E293B', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0D1629' : '#FFFFFF',
                    borderColor: isDark ? '#1A2844' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="investigations"
                  stroke={isDark ? "#00E5FF" : "#047857"}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorInvestigations)"
                />
                <Area
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right (1/3): TLS & Certificate Trust Card */}
        <div className="phish-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">TLS & certificate trust</h2>
              <Link
                to="/security"
                className="text-xs font-bold text-emerald-800 dark:text-[#00E5A3] hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Explore</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-extrabold font-mono text-slate-950 dark:text-white">412</span>
              <span className="text-xs text-slate-700 dark:text-slate-400 font-bold">TLS assessments</span>
            </div>

            {/* Stacked Segmented Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#070C18] flex overflow-hidden mb-2">
              <div style={{ width: '88%' }} className="bg-[#00D29E] h-full" title="364 checks passed" />
              <div style={{ width: '8%' }} className="bg-[#F59E0B] h-full" title="32 issues" />
              <div style={{ width: '4%' }} className="bg-slate-400 dark:bg-slate-700 h-full" title="16 unavailable" />
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-300 mb-5">
              <span className="text-emerald-950 dark:text-[#00E5A3]">364 checks passed</span>
              <span className="text-amber-950 dark:text-[#FBBF24]">32 issues</span>
              <span className="text-slate-700 dark:text-slate-400">16 unavailable</span>
            </div>

            {/* Bulleted Metric List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Expired / hostname mismatch</span>
                </div>
                <span className="font-extrabold font-mono text-slate-950 dark:text-white">18</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Chain / revocation / weak key</span>
                </div>
                <span className="font-extrabold font-mono text-slate-950 dark:text-white">14</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  <span>Revocation or CT lookup unavailable</span>
                </div>
                <span className="font-extrabold font-mono text-slate-950 dark:text-white">16</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#1A2844] text-[11px] text-slate-700 dark:text-slate-400 flex items-center gap-1.5 mt-4 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>A valid certificate does not mean a website is safe.</span>
          </div>
        </div>
      </div>

      {/* 5. Row 3: Recent Investigations & Investigation Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): Recent Investigations Table */}
        <div className="lg:col-span-2 phish-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Recent investigations</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#070C18] text-slate-900 dark:text-slate-300">
                24 today
              </span>
            </div>
            <Link
              to="/history"
              className="text-xs font-bold text-emerald-800 dark:text-[#00E5A3] hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 dark:border-[#1A2844] text-[11px] font-bold text-slate-800 dark:text-slate-400 uppercase tracking-wider">
                  <th className="pb-2.5 font-bold">INDICATOR</th>
                  <th className="pb-2.5 font-bold">RISK ASSESSMENT</th>
                  <th className="pb-2.5 font-bold">EVIDENCE SOURCE</th>
                  <th className="pb-2.5 font-bold">STATUS</th>
                  <th className="pb-2.5 font-bold text-right">UTC ↓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1A2844]">
                {recentRows.map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedSnapshot(row.snapshot)}
                    className="hover:bg-slate-100/80 dark:hover:bg-[#070C18] transition-colors cursor-pointer group"
                  >
                    <td className="py-3 font-mono font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-[#00E5A3] transition-colors">
                      {row.indicator}
                    </td>
                    <td className="py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${row.badgeClass}`}>
                        {row.risk}
                      </span>
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-300 font-semibold">
                      {row.evidence}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${row.statusDot}`} />
                        <span className="text-slate-950 dark:text-slate-200 font-bold">{row.status}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-slate-800 dark:text-slate-300 font-mono font-bold">
                      <div className="flex items-center justify-end gap-1">
                        <span>{row.utc}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3.5 text-[11px] text-slate-700 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-200 dark:border-[#1A2844] mt-2 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span>Risk reflects available evidence. Low Risk is not a guarantee of safety.</span>
          </div>
        </div>

        {/* Right (1/3): Investigation Snapshot Panel */}
        <div className="phish-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                INVESTIGATION SNAPSHOT
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${selectedSnapshot.badgeClass}`}>
                {selectedSnapshot.riskLevel}
              </span>
            </div>

            <h3 className="text-base font-extrabold font-mono text-slate-950 dark:text-white break-all mb-1">
              {selectedSnapshot.indicator}
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-400 mb-4 font-semibold">
              <span>{selectedSnapshot.evidenceCount} evidence checks available</span>
              <span className="mx-1.5">·</span>
              <span>{selectedSnapshot.time}</span>
            </p>

            {/* Structured Insights Cards */}
            <div className="space-y-3">
              {/* Insight 1 */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white mb-1">
                  <Link2 className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
                  <span>Domain & reputation</span>
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedSnapshot.domainNote}
                </p>
              </div>

              {/* Insight 2 */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white mb-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
                  <span>Website & message signals</span>
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedSnapshot.signalNote}
                </p>
              </div>

              {/* Insight 3 */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950 dark:text-white mb-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
                  <span>TLS checks</span>
                </div>
                <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedSnapshot.tlsNote}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-[#1A2844] flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => navigate(`/scanner?url=${encodeURIComponent(selectedSnapshot.indicator)}`)}
              className="text-xs font-bold text-emerald-800 dark:text-[#00E5A3] hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1"
            >
              <span>Inspect full report</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Row 4: Threat Distribution Donut Section */}
      <div className="phish-card p-5 sm:p-6 transition-all duration-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white tracking-tight">
              Threat Distribution
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-normal mt-0.5">
              Percentage breakdown of scanned websites and URLs
            </p>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100/90 dark:bg-[#070C18] px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#1A2844]">
            Example data
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 lg:gap-8 pt-3">
          {/* Donut Chart with Centered Metric - 100% Zero-Collapse SVG Precision */}
          <div className="md:col-span-5 flex items-center justify-center py-2">
            <div className="relative flex items-center justify-center">
              <svg
                viewBox="0 0 240 240"
                className="w-44 h-44 sm:w-52 sm:h-52 md:w-56 md:h-56 select-none"
                style={{ overflow: 'visible' }}
              >
                <g>
                  {threatCategories.map((slice) => {
                    const isHovered = hoveredThreat === slice.id;
                    const isMuted = hoveredThreat !== null && !isHovered;
                    const d = describeDonutSlice(
                      120,
                      120,
                      68,
                      95,
                      slice.startAngle,
                      slice.endAngle,
                      1.8
                    );
                    return (
                      <path
                        key={slice.id}
                        d={d}
                        fill={slice.color}
                        stroke={isDark ? '#0D1629' : '#FFFFFF'}
                        strokeWidth={3}
                        strokeLinejoin="round"
                        className="cursor-pointer transition-all duration-200"
                        style={{
                          opacity: isMuted ? 0.45 : 1,
                          transform: isHovered ? 'scale(1.035)' : 'scale(1)',
                          transformOrigin: '120px 120px',
                          filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}90)` : 'none',
                        }}
                        onMouseEnter={() => setHoveredThreat(slice.id)}
                        onMouseLeave={() => setHoveredThreat(null)}
                      />
                    );
                  })}
                </g>

                {/* Mathematical Center Metric - Guaranteed Center in all viewports */}
                {activeThreat ? (
                  <g className="transition-all duration-200">
                    <text
                      x="120"
                      y="108"
                      textAnchor="middle"
                      className="text-[10px] font-bold tracking-wider fill-slate-600 dark:fill-[#94A3B8] uppercase"
                    >
                      {activeThreat.name}
                    </text>
                    <text
                      x="120"
                      y="132"
                      textAnchor="middle"
                      className="text-xl font-extrabold font-mono fill-slate-950 dark:fill-white"
                    >
                      {activeThreat.percent}%
                    </text>
                    <text
                      x="120"
                      y="147"
                      textAnchor="middle"
                      className="text-[10px] font-bold font-mono fill-slate-700 dark:fill-slate-300"
                    >
                      {activeThreat.count}
                    </text>
                  </g>
                ) : (
                  <g className="transition-all duration-200">
                    <text
                      x="120"
                      y="112"
                      textAnchor="middle"
                      className="text-[10px] font-bold tracking-wider fill-slate-600 dark:fill-[#8FA2B7] uppercase"
                    >
                      TOTAL SCANS
                    </text>
                    <text
                      x="120"
                      y="137"
                      textAnchor="middle"
                      className="text-2xl font-extrabold font-mono fill-slate-950 dark:fill-white"
                    >
                      10,000
                    </text>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Legend Rows - Precision Spacing matching Screenshot */}
          <div className="md:col-span-7 flex justify-center md:justify-start">
            <div className="flex flex-col justify-center space-y-3.5 w-full max-w-md">
              {threatCategories.map((item) => {
                const isHovered = hoveredThreat === item.id;
                const isMuted = hoveredThreat !== null && !isHovered;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-2 px-3 -mx-3 rounded-lg cursor-pointer transition-all duration-150 ${
                      isHovered
                        ? 'bg-slate-100 dark:bg-white/[0.06]'
                        : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                    }`}
                    style={{ opacity: isMuted ? 0.5 : 1 }}
                    onMouseEnter={() => setHoveredThreat(item.id)}
                    onMouseLeave={() => setHoveredThreat(null)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-[4px] shadow-sm transition-transform duration-150"
                        style={{
                          backgroundColor: item.color,
                          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                          boxShadow: isHovered ? `0 0 10px ${item.color}80` : 'none',
                        }}
                      />
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold font-mono text-slate-950 dark:text-white">
                      {item.percent}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 7. Row 5: Collaborative Intelligence (Module 6 Web3) */}
      <div className="phish-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Collaborative intelligence</h2>
            <span className="text-xs text-slate-700 dark:text-slate-300 font-bold">
              94 validated reports · 8 awaiting review
            </span>
          </div>
          <Link
            to="/blockchain"
            className="text-xs font-bold text-emerald-800 dark:text-[#00E5A3] hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1"
          >
            <span>View report registry</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Side-by-Side Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Validated Intelligence */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-950 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-800 dark:text-[#00E5A3] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Validated intelligence</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-400">14:28 UTC</span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-950 dark:text-white mb-1">
                wallet-sync.example
              </div>
              <p className="text-[11px] text-slate-800 dark:text-slate-300 font-medium">
                Confirmed Malicious · credential harvesting
              </p>
            </div>
            <div className="text-[10px] text-slate-700 dark:text-slate-400 font-medium mt-3 pt-2 border-t border-slate-300 dark:border-[#1A2844]">
              M. Chen · corroborated by Safe Browsing
            </div>
          </div>

          {/* Card 2: Pending Validation */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-950 dark:text-white">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-[#F59E0B]/20 text-amber-800 dark:text-[#FBBF24] flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <span>Pending validation</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-400">14:16 UTC</span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-950 dark:text-white mb-1">
                parcel-reschedule.example
              </div>
              <p className="text-[11px] text-slate-800 dark:text-slate-300 font-medium">
                Suspicious · delivery-brand impersonation
              </p>
            </div>
            <div className="text-[10px] text-slate-700 dark:text-slate-400 font-medium mt-3 pt-2 border-t border-slate-300 dark:border-[#1A2844]">
              A. Rivera · not yet validated intelligence
            </div>
          </div>

          {/* Card 3: Report Integrity Verified (Sepolia) */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#00D29E]/10 border border-emerald-300 dark:border-[#00D29E]/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 dark:text-[#00E5A3]">
                  <div className="w-5 h-5 rounded-full bg-emerald-700 dark:bg-[#00D29E] text-white dark:text-slate-950 flex items-center justify-center">
                    <Link2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Report integrity verified</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-200 dark:bg-[#00D29E]/30 text-emerald-950 dark:text-[#00E5A3] font-mono">
                  LIVE
                </span>
              </div>
              <a
                href="https://sepolia.etherscan.io/address/0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs font-bold text-emerald-900 dark:text-[#00E5A3] hover:underline flex items-center gap-1 mb-1"
              >
                <span>0x535D...f3F8</span>
                <span className="text-slate-700 dark:text-slate-300 font-sans text-[11px]">· Sepolia testnet</span>
                <ExternalLink className="w-3 h-3 text-emerald-800 dark:text-[#00E5A3]" />
              </a>
              <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-snug font-medium">
                On-chain commitments verify integrity and history, not truth. Sensitive report evidence stays off chain.
              </p>
            </div>
            <div className="text-[10px] text-emerald-900 dark:text-[#00E5A3] font-bold mt-3 pt-2 border-t border-emerald-300 dark:border-[#00D29E]/20">
              Report ID: synth-audit-1794122121 (Verified on-chain)
            </div>
          </div>
        </div>
      </div>

      {/* 8. Footer Disclaimers */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-400 font-medium pb-6 pt-2">
        <span>Illustrative demo data only. No live threat results or active website scanning.</span>
        <span>Passive checks only · Sensitive content stays off chain.</span>
      </div>
    </div>
  );
};
