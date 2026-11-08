import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Shield,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Globe,
  Radio,
  FileCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

const PIPELINE_STEPS = [
  { id: 'validate', label: 'URL Validation & Safe Normalization', icon: Lock },
  { id: 'domain', label: 'Domain, Punycode & Typosquatting Profiling', icon: Globe },
  { id: 'dns', label: 'DNS Resolution (A, AAAA, MX, NS, TXT)', icon: Radio },
  { id: 'redirect', label: 'Safe Redirect Hop Tracing & SSRF Guard', icon: Layers },
  { id: 'intel', label: 'External Threat Intelligence Verification', icon: Shield },
  { id: 'engine', label: 'Risk Calculation & Grounded AI Explanation', icon: Sparkles },
];

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Check if a URL was passed via query params from Dashboard
  useEffect(() => {
    const queryUrl = searchParams.get('url');
    if (queryUrl) {
      setUrl(queryUrl);
      executeAnalysis(queryUrl);
    }
  }, [searchParams]);

  const executeAnalysis = async (targetUrl: string) => {
    if (!targetUrl.trim()) {
      setError('Please provide a valid URL or domain string.');
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStepIndex(0);

    // Simulated animated step progression while backend processes the multi-stage scan
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < PIPELINE_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    try {
      const report = await api.analyzeUrl(targetUrl.trim());
      clearInterval(stepInterval);
      navigate(`/reports/${report.id}`);
    } catch (err: any) {
      clearInterval(stepInterval);
      setLoading(false);
      const detail = err?.response?.data?.detail || err?.message || 'Failed to complete URL analysis.';
      setError(detail);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnalysis(url);
  };

  const sampleTargets = [
    { label: 'Benign Official Site', url: 'https://github.com', type: 'safe' },
    { label: 'Brand Typosquatting', url: 'http://paypa1-security-update.com/login', type: 'phish' },
    { label: 'Punycode Homoglyph', url: 'http://xn--pple-43d.com/support', type: 'phish' },
    { label: 'IP as Hostname', url: 'http://198.51.100.4/verify-wallet', type: 'suspicious' },
    { label: 'SSRF Attack (Blocked)', url: 'http://127.0.0.1:8080/internal', type: 'attack' },
    { label: 'Credential @ Trick', url: 'http://google.com@evil-phishing.org/login', type: 'attack' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-[#00D29E]/20 border border-emerald-300 dark:border-[#00D29E]/40 text-xs font-bold text-emerald-950 dark:text-[#00E5A3]">
          <Shield className="w-3.5 h-3.5 text-emerald-800 dark:text-[#00E5A3]" />
          <span>Module 1 · URL Security Scanner</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
          Investigate Website & URL Threats
        </h1>
        <p className="text-slate-800 dark:text-slate-300 text-sm max-w-xl mx-auto font-medium">
          Submit any website address, shortened link, or suspicious domain. Our engine collects evidence,
          measures risk, and provides human-readable recommendations.
        </p>
      </div>

      {/* Main Scanner Input Box */}
      <div className="phish-card p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
              Target URL or Domain
            </label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                placeholder="https://example.com/login or bare domain paypal-security.com"
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] rounded-xl text-sm text-slate-950 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 font-bold focus:outline-none focus:border-emerald-700 dark:focus:border-[#00D29E] focus:ring-1 focus:ring-emerald-700 dark:focus:ring-[#00D29E] font-mono disabled:opacity-50 transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-400 mt-1.5 font-medium">
              Protocol defaults to http:// if omitted. Only HTTP and HTTPS destinations are permitted.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="font-bold text-rose-950 dark:text-rose-200">Analysis Halted</div>
                <div className="text-rose-800 dark:text-rose-300 text-xs font-medium">{error}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3.5 px-6 bg-emerald-800 hover:bg-emerald-700 dark:bg-[#00D29E] dark:hover:bg-[#00b887] text-white dark:text-slate-950 font-bold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Scanning Pipeline Active...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Execute In-Depth Security Assessment</span>
              </>
            )}
          </button>
        </form>

        {/* Loading Pipeline State Progression */}
        {loading && (
          <div className="mt-8 border-t border-slate-200 dark:border-[#1A2844] pt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-400 font-mono font-bold">
              <span>SCAN PIPELINE IN PROGRESS</span>
              <span className="text-emerald-800 dark:text-[#00E5A3] font-bold animate-pulse">
                STEP {currentStepIndex + 1} OF {PIPELINE_STEPS.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {PIPELINE_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${
                      isCurrent
                        ? 'bg-emerald-100 dark:bg-[#00D29E]/20 border-emerald-300 dark:border-[#00D29E]/40 text-emerald-950 dark:text-[#00E5A3] shadow-sm font-bold'
                        : isDone
                        ? 'bg-slate-100 dark:bg-[#070C18] border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-[#34D399] font-semibold'
                        : 'bg-slate-50 dark:bg-[#070C18]/60 border-slate-200 dark:border-[#1A2844] text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-[#00E5A3] shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-emerald-700/30 border-t-emerald-700 dark:border-[#00D29E]/30 dark:border-t-[#00D29E] rounded-full animate-spin shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-500 shrink-0" />
                    )}
                    <span className="font-mono">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preset Test Case Scenarios */}
      <div className="phish-card p-6">
        <h3 className="text-sm font-bold text-slate-950 dark:text-white mb-1.5 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-emerald-800 dark:text-[#00E5A3]" />
          <span>Curated Demonstration Test Cases</span>
        </h3>
        <p className="text-xs text-slate-800 dark:text-slate-300 mb-4 font-medium">
          Click on any benchmark target to populate the scanner and explore how the engine detects each threat vector:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sampleTargets.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(item.url);
                setError(null);
              }}
              className="text-left p-3.5 rounded-xl bg-slate-100 dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-200/70 dark:hover:bg-slate-800/50 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-950 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-[#00E5A3] transition-colors">
                  {item.label}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                    item.type === 'safe'
                      ? 'bg-emerald-100 dark:bg-[#064E3B]/70 text-emerald-950 dark:text-[#34D399] border border-emerald-300 dark:border-emerald-500/70'
                      : item.type === 'phish'
                      ? 'bg-rose-100 dark:bg-[#450A0A]/80 text-rose-950 dark:text-[#F87171] border border-rose-300 dark:border-red-500/80'
                      : item.type === 'attack'
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      : 'bg-amber-100 dark:bg-[#451A03]/70 text-amber-950 dark:text-[#FBBF24] border border-amber-300 dark:border-amber-500/70'
                  }`}
                >
                  {item.type}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium truncate">{item.url}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
