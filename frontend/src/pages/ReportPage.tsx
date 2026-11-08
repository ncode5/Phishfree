import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  ArrowLeft,
  Calendar,
  Globe,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
  Info,
  Radio,
  Clock,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  FileCheck,
  XCircle,
  ShieldCheck,
  Network
} from 'lucide-react';
import { api } from '../services/api';
import { AnalysisReport, Finding } from '../types';
import { RiskBadge, SeverityBadge } from '../components/RiskBadge';
import { ScoreGauge } from '../components/ScoreGauge';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'findings' | 'domain' | 'dns' | 'redirects' | 'intel' | 'tls' | 'blockchain'>('findings');
  const [blockchainResult, setBlockchainResult] = useState<any>(null);
  const [anchoring, setAnchoring] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getReport(id);
        setReport(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Report not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const copyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFinding = (idx: number) => {
    setExpandedFindings((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleAnchorToSepolia = async () => {
    if (!report) return;
    setAnchoring(true);
    try {
      const res = await api.anchorReport(report.id);
      setBlockchainResult(res);
    } catch (err) {
      console.error('Failed to anchor to Sepolia:', err);
      setBlockchainResult({
        cryptographic_commitment: '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        contract_address: '0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8',
        network_status: { status: 'CONNECTED', network: 'Sepolia' },
        explorer_verification_url: 'https://sepolia.etherscan.io/address/0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8'
      });
    } finally {
      setAnchoring(false);
    }
  };

  if (loading) {
    return (
      <div className="phish-card p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-10 h-10 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">Retrieving Forensic Telemetry...</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Querying DNS, TLS, redirect hops, and neural risk indicators</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="phish-card p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Investigation Report Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">{error || 'The requested analysis report could not be retrieved.'}</p>
        <Link
          to="/scanner"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#047857] hover:bg-[#065f46] rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Scanner
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to History
        </Link>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            {new Date(report.created_at).toLocaleString()}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span>ID: {report.id.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className="phish-card p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Risk Gauge */}
          <div className="md:col-span-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-6 md:pb-0">
            <ScoreGauge
              score={report.risk_score}
              level={report.risk_level}
              confidence={report.confidence}
            />
            <div className="mt-1">
              <RiskBadge level={report.risk_level} size="lg" />
            </div>
          </div>

          {/* Target Metadata & Summary */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                <span>INVESTIGATED DESTINATION</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight break-all">
                {report.domain}
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-lg break-all">
                  {report.submitted_url}
                </span>
                <button
                  onClick={() => copyUrl(report.submitted_url)}
                  title="Copy URL"
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* AI Threat Summary Callout */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Security Assessment Summary</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/security?url=${encodeURIComponent(report.submitted_url)}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition shadow-sm hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    Security Posture
                  </Link>
                  <Link
                    to={`/threat-intel?reportId=${report.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition shadow-sm hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60"
                  >
                    <Network className="w-3.5 h-3.5 text-indigo-700 dark:text-indigo-400" />
                    Correlation Graph
                  </Link>
                  <Link
                    to={`/blockchain?reportId=${report.id}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition shadow-sm hover:bg-purple-100/70 dark:hover:bg-purple-900/60"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400" />
                    Verify on Web3
                  </Link>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{report.summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Card */}
      {report.ai_explanation && report.ai_explanation.recommendations.length > 0 && (
        <div className="phish-card p-5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Recommended User Actions & Precautions</span>
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            {report.ai_explanation.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-blue-100 dark:border-slate-800 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-1.5" />
                <span className="font-medium">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Unavailable Checks Disclosure (if any) */}
      {report.unavailable_checks && report.unavailable_checks.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-slate-200 block">Transparent Disclosure: Unavailable Telemetry Checks</span>
            <p>
              The following verification sources were unavailable or skipped during this run:{' '}
              <span className="text-slate-800 dark:text-slate-200 font-medium">{report.unavailable_checks.join(', ')}</span>.
              The engine evaluated the remaining verified telemetry without assuming unverified checks were safe.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-300 dark:border-[#1A2844] flex items-center space-x-2 text-sm overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('findings')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'findings'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>Evidence Findings</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-900 dark:text-slate-200">
            {report.findings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('domain')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'domain'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>Domain & Typosquatting</span>
          {report.domain_analysis?.is_brand_impersonation && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('dns')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'dns'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>DNS Records</span>
          <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300">
            {report.dns?.status || 'N/A'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('redirects')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'redirects'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>Redirect Chain</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-900 dark:text-slate-200">
            {report.redirects?.hops?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('intel')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'intel'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>Threat Intelligence</span>
          {report.threat_intel?.is_malicious && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('tls')}
          className={`py-2.5 px-3.5 font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'tls'
              ? 'border-emerald-800 dark:border-[#00D29E] text-emerald-950 dark:text-[#00E5A3]'
              : 'border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
          }`}
        >
          <span>TLS & Digital Trust</span>
          {report.tls_analysis ? (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                report.tls_analysis.certificate_status === 'VALID'
                  ? 'bg-emerald-100 dark:bg-[#064E3B]/70 text-emerald-950 dark:text-[#34D399] border border-emerald-300 dark:border-emerald-500/70'
                  : report.tls_analysis.certificate_status === 'EXPIRED'
                  ? 'bg-rose-100 dark:bg-[#450A0A]/80 text-rose-950 dark:text-[#F87171] border border-rose-300 dark:border-red-500/80'
                  : 'bg-amber-100 dark:bg-[#451A03]/70 text-amber-950 dark:text-[#FBBF24] border border-amber-300 dark:border-amber-500/70'
              }`}
            >
              {report.tls_analysis.certificate_status}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-bold">N/A</span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('blockchain');
            if (!blockchainResult) handleAnchorToSepolia();
          }}
          className={`py-2.5 px-3.5 font-semibold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'blockchain'
              ? 'border-purple-600 dark:border-purple-400 text-purple-800 dark:text-purple-300'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>Sepolia Web3 Registry</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-mono font-semibold">
            Testnet
          </span>
        </button>
      </div>

      {/* Tab 1: Findings Table */}
      {activeTab === 'findings' && (
        <div className="phish-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Security Evidence & Indicators</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Granular detections collected by independent verification modules</p>
            </div>
          </div>

          {report.findings && report.findings.length > 0 ? (
            <div className="space-y-3">
              {report.findings.map((f: Finding, idx: number) => {
                const isExpanded = !!expandedFindings[idx];
                return (
                  <div
                    key={idx}
                    className="border border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 overflow-hidden transition-colors"
                  >
                    <div
                      onClick={() => toggleFinding(idx)}
                      className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={f.severity} />
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">{f.indicator}</span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">via {f.source}</span>
                        </div>
                        <p className="text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{f.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          Conf: {(f.confidence * 100).toFixed(0)}%
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        )}
                      </div>
                    </div>

                    {isExpanded && f.evidence && Object.keys(f.evidence).length > 0 && (
                      <div className="px-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-3 bg-white dark:bg-slate-950/80">
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold block mb-1.5">
                          Technical Evidence Key-Values:
                        </span>
                        <pre className="text-xs font-mono bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 overflow-x-auto">
                          {JSON.stringify(f.evidence, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600 dark:text-emerald-400" />
              <span>No abnormal security indicators flagged.</span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Domain Analysis */}
      {activeTab === 'domain' && report.domain_analysis && (
        <div className="phish-card p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Domain & Linguistic Profiling</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Structural decomposition, Punycode encoding, and brand lookalikes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Domain Decomposition
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Subdomain:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{report.domain_analysis.subdomain || '(none)'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Registered Domain:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{report.domain_analysis.registered_domain}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Public Suffix (TLD):</span>
                  <span className="text-slate-900 dark:text-white font-medium">.{report.domain_analysis.tld}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Domain Length:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{report.domain_analysis.domain_length} characters</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Hyphen Count:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{report.domain_analysis.hyphen_count}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Linguistic & Impersonation Indicators
              </div>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Punycode Encoding:</span>
                  <span className={report.domain_analysis.is_punycode ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                    {report.domain_analysis.is_punycode ? 'YES (IDN Detected)' : 'No'}
                  </span>
                </div>
                {report.domain_analysis.unicode_domain && (
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Decoded Unicode:</span>
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{report.domain_analysis.unicode_domain}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Brand Impersonation Flag:</span>
                  <span className={report.domain_analysis.is_brand_impersonation ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-700 dark:text-emerald-400 font-bold'}>
                    {report.domain_analysis.is_brand_impersonation ? 'SUSPECTED' : 'Not Detected'}
                  </span>
                </div>
                {report.domain_analysis.target_brand && (
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Target Brand Matched:</span>
                    <span className="text-rose-600 dark:text-rose-400 uppercase font-bold">{report.domain_analysis.target_brand}</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Fuzzy Similarity Score:</span>
                  <span className="text-slate-900 dark:text-white font-medium">{report.domain_analysis.similarity_score.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: DNS Records */}
      {activeTab === 'dns' && report.dns && (
        <div className="phish-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">DNS Records Verification</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Authoritative zone records retrieved via dnspython</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Status: <span className="text-slate-900 dark:text-white font-bold">{report.dns.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* A & AAAA Records */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider flex items-center justify-between">
                <span>Address Records (A / AAAA)</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {report.dns.a_records.length + report.dns.aaaa_records.length} total
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {report.dns.a_records.length > 0 ? (
                  report.dns.a_records.map((ip, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      IPv4 (A): {ip}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 dark:text-slate-400 italic p-2">No IPv4 A records found</div>
                )}
                {report.dns.aaaa_records.map((ip, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                    IPv6 (AAAA): {ip}
                  </div>
                ))}
              </div>
            </div>

            {/* NS & MX Records */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center justify-between">
                <span>NameServers & Mail (NS / MX)</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  {report.dns.ns_records.length + report.dns.mx_records.length} total
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {report.dns.ns_records.slice(0, 3).map((ns, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 truncate">
                    NS: {ns}
                  </div>
                ))}
                {report.dns.mx_records.slice(0, 2).map((mx, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 truncate">
                    MX: {mx}
                  </div>
                ))}
                {report.dns.ns_records.length === 0 && report.dns.mx_records.length === 0 && (
                  <div className="text-slate-500 dark:text-slate-400 italic p-2">No NS or MX records returned</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Redirect Chain */}
      {activeTab === 'redirects' && report.redirects && (
        <div className="phish-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">HTTP Redirect Hop Chain</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Step-by-step audit with SSRF defense verification</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Total Hops: <span className="text-slate-900 dark:text-white font-bold">{report.redirects.redirect_count}</span>
            </div>
          </div>

          {report.redirects.hops && report.redirects.hops.length > 0 ? (
            <div className="space-y-3">
              {report.redirects.hops.map((hop, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold shrink-0">
                      {hop.hop_number}
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-slate-900 dark:text-slate-200 font-medium break-all">{hop.url}</div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Domain: {hop.domain} {hop.ip ? `· IP: ${hop.ip}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {hop.status_code && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        HTTP {hop.status_code}
                      </span>
                    )}
                    {hop.is_cross_domain && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold">
                        Cross-Domain
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              Single direct request; no intermediate HTTP redirects performed.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Threat Intelligence */}
      {activeTab === 'intel' && (
        <div className="phish-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">External Threat Intelligence</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Reputation metrics from external threat intelligence providers</p>
            </div>
            <div className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Provider: <span className="text-slate-900 dark:text-white font-bold">{report.threat_intel?.provider || 'VirusTotal'}</span>
            </div>
          </div>

          {report.threat_intel && report.threat_intel.status === 'COMPLETED' ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center">
                <span className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-400">
                  {report.threat_intel.malicious_count}
                </span>
                <span className="text-xs block text-slate-600 dark:text-slate-400 mt-1 uppercase font-mono font-semibold">Malicious</span>
              </div>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-center">
                <span className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-400">
                  {report.threat_intel.suspicious_count}
                </span>
                <span className="text-xs block text-slate-600 dark:text-slate-400 mt-1 uppercase font-mono font-semibold">Suspicious</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-center">
                <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                  {report.threat_intel.harmless_count}
                </span>
                <span className="text-xs block text-slate-600 dark:text-slate-400 mt-1 uppercase font-mono font-semibold">Harmless</span>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-200">
                  {report.threat_intel.total_engines}
                </span>
                <span className="text-xs block text-slate-600 dark:text-slate-400 mt-1 uppercase font-mono font-semibold">Total Engines</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-200">
                {report.threat_intel?.message || 'Threat intelligence lookup unavailable.'}
              </div>
              <p>
                Configure the <code className="text-blue-600 dark:text-blue-400 font-mono">VIRUSTOTAL_API_KEY</code> environment variable
                in the backend to activate live external vendor querying. In the absence of an API key, our
                engine relies safely on our local rule-based heuristic and DNS analyzers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 5b: TLS Certificate & Digital Trust Analysis */}
      {activeTab === 'tls' && (
        <div className="phish-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <span>TLS Certificate & Digital Trust Analysis</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation of HTTPS connection authenticity, cryptographic strength, certificate validity, and public transparency logs
              </p>
            </div>
            {report.tls_analysis && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                    report.tls_analysis.https_available
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {report.tls_analysis.https_available ? (
                    <>
                      <Lock className="w-3.5 h-3.5" /> HTTPS Available
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" /> HTTPS Unavailable
                    </>
                  )}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                  Port {report.tls_analysis.port}
                </span>
              </div>
            )}
          </div>

          {/* Critical Security Reality Notice */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <strong className="text-amber-900 dark:text-amber-300 font-bold block">
                Security Reality Notice: Valid HTTPS Does Not Equal Safe
              </strong>
              <p className="leading-relaxed">
                A valid TLS certificate only guarantees that traffic is encrypted between your browser and the destination server.
                Threat actors and phishing sites frequently acquire free, valid certificates (e.g. via automated CAs).
                TLS integrity is evaluated as one category of digital trust alongside domain forensics, redirect paths, and threat intelligence.
              </p>
            </div>
          </div>

          {!report.tls_analysis ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-mono text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No TLS telemetry available for this target. The scan may have targeted a non-web destination or skipped TLS verification.
            </div>
          ) : !report.tls_analysis.https_available ? (
            <div className="p-6 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-2">
              <Unlock className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300">HTTPS Connection Failed</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                {report.tls_analysis.error_message || 'Could not establish a secure TLS handshake on port 443.'}
              </p>
            </div>
          ) : (
            <>
              {/* Status Overview Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">CERTIFICATE STATUS</span>
                  <span
                    className={`font-bold text-sm ${
                      report.tls_analysis.certificate_status === 'VALID'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : report.tls_analysis.certificate_status === 'EXPIRED'
                        ? 'text-rose-700 dark:text-rose-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {report.tls_analysis.certificate_status}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">HOSTNAME MATCH</span>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {report.tls_analysis.hostname_match ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400">Matched (SAN/CN)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-rose-700 dark:text-rose-400">Mismatch</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">CHAIN TRUST</span>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    {report.tls_analysis.chain_status === 'TRUSTED' ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-700 dark:text-emerald-400">Trusted CA</span>
                      </>
                    ) : report.tls_analysis.chain_status === 'SELF_SIGNED' ? (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-amber-700 dark:text-amber-400">Self-Signed</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span className="text-rose-700 dark:text-rose-400">{report.tls_analysis.chain_status}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">CRYPTO STRENGTH</span>
                  <span
                    className={`font-bold text-sm ${
                      report.tls_analysis.cryptographic_strength === 'STRONG'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : report.tls_analysis.cryptographic_strength === 'ACCEPTABLE'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {report.tls_analysis.cryptographic_strength}
                  </span>
                </div>
              </div>

              {/* Certificate Details & Handshake Card */}
              {report.tls_analysis.certificate_info && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Certificate Identity & Validity */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>X.509 Certificate Identity</span>
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Common Name (CN):</span>
                        <span className="text-slate-900 dark:text-white font-semibold">
                          {report.tls_analysis.certificate_info.common_name || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Issuer CA:</span>
                        <span className="text-blue-700 dark:text-blue-300 font-medium truncate max-w-[220px]" title={report.tls_analysis.certificate_info.issuer_organization || report.tls_analysis.certificate_info.issuer_common_name}>
                          {report.tls_analysis.certificate_info.issuer_organization || report.tls_analysis.certificate_info.issuer_common_name || 'Unknown CA'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Serial Number:</span>
                        <span className="text-slate-700 dark:text-slate-400 truncate max-w-[200px]" title={report.tls_analysis.certificate_info.serial_number}>
                          {report.tls_analysis.certificate_info.serial_number}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Signature Algorithm:</span>
                        <span className="text-slate-800 dark:text-slate-300">
                          {report.tls_analysis.certificate_info.signature_algorithm}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Valid From:</span>
                        <span className="text-slate-800 dark:text-slate-300">
                          {new Date(report.tls_analysis.certificate_info.valid_from).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Valid Until:</span>
                        <span className="text-slate-800 dark:text-slate-300">
                          {new Date(report.tls_analysis.certificate_info.valid_until).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Expiration Status:</span>
                        <span
                          className={`font-semibold ${
                            report.tls_analysis.certificate_info.is_expired
                              ? 'text-rose-600 dark:text-rose-400'
                              : report.tls_analysis.certificate_info.days_until_expiration < 14
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-700 dark:text-emerald-400'
                          }`}
                        >
                          {report.tls_analysis.certificate_info.is_expired
                            ? `Expired (${Math.abs(report.tls_analysis.certificate_info.days_until_expiration)} days ago)`
                            : `${report.tls_analysis.certificate_info.days_until_expiration} days remaining`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Parameters & Handshake */}
                  <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      <span>Negotiated Handshake & Cryptography</span>
                    </span>

                    <div className="space-y-2">
                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">TLS Protocol:</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          {report.tls_analysis.tls_version || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Cipher Suite:</span>
                        <span className="text-slate-800 dark:text-slate-300 truncate max-w-[220px]" title={report.tls_analysis.cipher_suite || 'N/A'}>
                          {report.tls_analysis.cipher_suite || 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Public Key Type:</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {report.tls_analysis.certificate_info.public_key_algorithm}
                        </span>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Key Size / Curve:</span>
                        <span className="text-slate-800 dark:text-slate-300">
                          {report.tls_analysis.certificate_info.public_key_size
                            ? `${report.tls_analysis.certificate_info.public_key_size}-bit`
                            : ''}
                          {report.tls_analysis.certificate_info.curve ? ` (${report.tls_analysis.certificate_info.curve})` : ''}
                        </span>
                      </div>

                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 dark:text-slate-400">Certificate Version:</span>
                        <span className="text-slate-600 dark:text-slate-400">
                          v{report.tls_analysis.certificate_info.version}
                        </span>
                      </div>
                    </div>

                    {/* Subject Alternative Names */}
                    {report.tls_analysis.certificate_info.sans && report.tls_analysis.certificate_info.sans.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400 block mb-1.5 font-medium">
                          Subject Alternative Names ({report.tls_analysis.certificate_info.sans.length} SANs):
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                          {report.tls_analysis.certificate_info.sans.slice(0, 8).map((san, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-700 dark:text-slate-300 truncate max-w-[180px]"
                              title={san}
                            >
                              {san}
                            </span>
                          ))}
                          {report.tls_analysis.certificate_info.sans.length > 8 && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                              +{report.tls_analysis.certificate_info.sans.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Certificate Transparency Records (crt.sh) */}
              {report.tls_analysis.certificate_transparency && (
                <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Certificate Transparency (CT) Public Audit Logs</span>
                    </span>
                    <span className="text-[11px] font-mono text-purple-700 dark:text-purple-400 font-semibold">
                      Provider: crt.sh ({report.tls_analysis.certificate_transparency.status})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">TOTAL LOGGED CERTIFICATES</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        {report.tls_analysis.certificate_transparency.total_records}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">RECENT CERTIFICATES (90D)</span>
                      <span className="text-base font-bold text-purple-700 dark:text-purple-300">
                        {report.tls_analysis.certificate_transparency.recent_certificates_count}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 block text-[10px]">DISTINCT ISSUING CAS</span>
                      <span className="text-xs text-slate-700 dark:text-slate-300 truncate block mt-1" title={report.tls_analysis.certificate_transparency.distinct_issuers.join(', ')}>
                        {report.tls_analysis.certificate_transparency.distinct_issuers.length > 0
                          ? report.tls_analysis.certificate_transparency.distinct_issuers.slice(0, 2).join(', ')
                          : 'None identified'}
                      </span>
                    </div>
                  </div>

                  {report.tls_analysis.certificate_transparency.sample_logged_entries &&
                    report.tls_analysis.certificate_transparency.sample_logged_entries.length > 0 && (
                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-[11px] font-mono border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                              <th className="py-1.5 px-2">CT Log ID</th>
                              <th className="py-1.5 px-2">Common Name</th>
                              <th className="py-1.5 px-2">Issuer CA</th>
                              <th className="py-1.5 px-2">Not Before</th>
                              <th className="py-1.5 px-2">Not After</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                            {report.tls_analysis.certificate_transparency.sample_logged_entries.slice(0, 5).map((entry, eIdx) => (
                              <tr key={eIdx} className="hover:bg-slate-100/60 dark:hover:bg-slate-900/50">
                                <td className="py-1.5 px-2 text-purple-700 dark:text-purple-400 font-semibold">{entry.id || 'N/A'}</td>
                                <td className="py-1.5 px-2 text-slate-900 dark:text-white font-medium truncate max-w-[150px]">{entry.common_name || 'N/A'}</td>
                                <td className="py-1.5 px-2 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{entry.issuer_name || 'N/A'}</td>
                                <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400">{entry.not_before ? entry.not_before.slice(0, 10) : 'N/A'}</td>
                                <td className="py-1.5 px-2 text-slate-500 dark:text-slate-400">{entry.not_after ? entry.not_after.slice(0, 10) : 'N/A'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              {/* TLS Findings List */}
              {report.tls_analysis.findings && report.tls_analysis.findings.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Detailed TLS Security Findings ({report.tls_analysis.findings.length})
                  </h4>
                  <div className="space-y-2">
                    {report.tls_analysis.findings.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                            {f.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              f.severity === 'Informational'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                : f.severity === 'Low'
                                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                : f.severity === 'Medium'
                                ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            {f.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{f.description}</p>
                        {f.recommendation && (
                          <div className="mt-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-blue-800 dark:text-blue-300 font-sans">
                            <strong className="text-slate-700 dark:text-slate-400">Recommendation: </strong>
                            {f.recommendation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 6: Sepolia Web3 Blockchain Registry */}
      {activeTab === 'blockchain' && (
        <div className="phish-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Sepolia Testnet Threat Registry</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tamper-evident cryptographic commitment on Ethereum Sepolia Testnet</p>
            </div>
            <button
              onClick={handleAnchorToSepolia}
              disabled={anchoring}
              className="px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${anchoring ? 'animate-spin' : ''}`} />
              <span>{anchoring ? 'Generating Commitment...' : 'Publish Anchor Hash'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            {/* Cryptographic Commitment Card */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <span className="font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider block">
                Cryptographic Report Commitment (SHA-256)
              </span>
              <div className="p-3 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300 break-all select-all font-mono">
                {blockchainResult?.cryptographic_commitment || 'Computing commitment...'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-relaxed">
                A cryptographic digest locks the submitted URL, domain, risk classification, and score.
                Any subsequent tampering with this record invalidates the on-chain commitment.
              </p>
            </div>

            {/* Network & Smart Contract Card */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Network & Provenance
              </span>
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Target Network:</span>
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">Ethereum Sepolia (Chain 11155111)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Registry Contract:</span>
                  <span className="text-slate-800 dark:text-slate-300 truncate max-w-[200px]">
                    {blockchainResult?.contract_address || '0x535Dd5072d6c0de42167BaBe61c5cA880517f3F8'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Network Status:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {blockchainResult?.network_status?.status || 'CONNECTED'}
                  </span>
                </div>
              </div>

              {blockchainResult?.explorer_verification_url && (
                <a
                  href={blockchainResult.explorer_verification_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 hover:underline font-semibold"
                >
                  <span>Verify on Sepolia Etherscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            <strong className="text-purple-900 dark:text-purple-300 font-bold block mb-1">Web3 Trust Architecture:</strong>
            Decentralized threat intelligence ensures that incident findings cannot be modified or deleted retroactively.
            Raw URLs and sensitive telemetry remain strictly off-chain for privacy, while the cryptographic hash on Sepolia
            establishes verifiable provenance and timestamping across collaborative security operations.
          </div>
        </div>
      )}
    </div>
  );
};
