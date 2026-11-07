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

    // Simulate animated step progression while backend processes the multi-stage scan
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400">
          <Shield className="w-3.5 h-3.5" />
          <span>Module 1 URL Security Scanner</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Investigate Website & URL Threats</h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Submit any website address, shortened link, or suspicious domain. Our engine collects evidence,
          measures risk, and provides human-readable recommendations.
        </p>
      </div>

      {/* Main Scanner Input Box */}
      <div className="cyber-card p-6 md:p-8 bg-cyber-900/90 border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase tracking-wider mb-2">
              Target URL or Domain
            </label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
                placeholder="https://example.com/login or bare domain paypal-security.com"
                className="w-full pl-11 pr-4 py-3.5 bg-cyber-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono disabled:opacity-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Protocol defaults to http:// if omitted. Only HTTP and HTTPS destinations are permitted.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-rose-300">Analysis Halted</div>
                <div className="text-rose-400 text-xs">{error}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-8 border-t border-slate-800/80 pt-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>SCAN PIPELINE IN PROGRESS</span>
              <span className="text-blue-400 animate-pulse font-semibold">
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
                    className={`flex items-center gap-3 p-3 rounded-lg border text-xs transition-all ${
                      isCurrent
                        ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm'
                        : isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                        : 'bg-cyber-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin shrink-0" />
                    ) : (
                      <Icon className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span className="font-medium font-mono">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Preset Test Case Scenarios */}
      <div className="cyber-card p-6">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span>Curated Demonstration Test Cases</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
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
              className="text-left p-3 rounded-lg bg-cyber-950/80 border border-slate-800 hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                  {item.label}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                    item.type === 'safe'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.type === 'phish'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : item.type === 'attack'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {item.type}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 truncate">{item.url}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

