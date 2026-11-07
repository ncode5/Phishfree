import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Globe,
  Cookie,
  Layers,
  FileCode,
  Server,
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { SecurityAssessmentResponse, SecurityFinding } from '../types';

export const WebsiteSecurityPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';

  const [urlInput, setUrlInput] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Configuration options
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [includeCookies, setIncludeCookies] = useState(true);
  const [includeMixedContent, setIncludeMixedContent] = useState(true);
  const [includePublicFiles, setIncludePublicFiles] = useState(true);

  const [assessment, setAssessment] = useState<SecurityAssessmentResponse | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<number, boolean>>({});

  const handleRunAssessment = async (target: string) => {
    if (!target || !target.trim()) {
      setError('Please provide a valid website URL or domain.');
      return;
    }
    setLoading(true);
    setError(null);
    setExpandedFindings({});

    try {
      const data = await apiService.assessWebsiteSecurity(target.trim(), {
        includeHeaders,
        includeCookies,
        includeMixedContent,
        includePublicFiles,
      });
      setAssessment(data);
      setSearchParams({ url: target.trim() });
    } catch (err: any) {
      console.error('Assessment failed', err);
      setError(err?.response?.data?.detail || 'Unable to complete website security assessment. Ensure destination host is publicly reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialUrl) {
      handleRunAssessment(initialUrl);
    }
  }, [initialUrl]);

  const toggleFinding = (idx: number) => {
    setExpandedFindings(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Filter findings
  const filteredFindings = (assessment?.findings || []).filter(f => {
    if (severityFilter !== 'ALL' && f.severity.toUpperCase() !== severityFilter.toUpperCase()) {
      return false;
    }
    if (categoryFilter !== 'ALL' && f.category.toUpperCase() !== categoryFilter.toUpperCase()) {
      return false;
    }
    return true;
  });

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'Strong Configuration': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Good Configuration': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Needs Improvement': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Weak Configuration': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default: return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Module 5: Website Security Assessment
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
          Passive Website Security Posture & Configuration Audit
        </h1>
        <p className="text-slate-400 mt-2 max-w-3xl text-sm md:text-base leading-relaxed">
          Evaluates observable security configurations including TLS transport integrity, 9 defensive HTTP response headers, cookie flags, mixed HTTP content, banner information leakage, and public security files.
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Input Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" /> Target Website Audit
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Enter a destination website to perform non-intrusive, passive configuration auditing with strict SSRF defenses.
          </p>

          <form
            onSubmit={(e) => { e.preventDefault(); handleRunAssessment(urlInput); }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="https://example.com or domain.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !urlInput.trim()}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {loading ? 'Auditing...' : 'Start Security Audit'}
              </button>
            </div>

            {/* Scope checkboxes */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeHeaders}
                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                HTTP Security Headers
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeCookies}
                  onChange={(e) => setIncludeCookies(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                Cookie Security Attributes
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={includeMixedContent}
                  onChange={(e) => setIncludeMixedContent(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                Mixed Content Inclusions
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-200">
                <input
                  type="checkbox"
                  checked={includePublicFiles}
                  onChange={(e) => setIncludePublicFiles(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                Public Files (security.txt, robots.txt)
              </label>
            </div>
          </form>

          {/* Quick example pills */}
          <div className="mt-4 pt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Quick Test:</span>
            {['https://github.com', 'https://cloudflare.com', 'http://insecure-bank-demo.org'].map((demo) => (
              <button
                key={demo}
                onClick={() => { setUrlInput(demo); handleRunAssessment(demo); }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {demo}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700/50 text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Assessment Results Dossier */}
        {assessment && (
          <div className="space-y-8 animate-fadeIn">
            {/* Score & Posture Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getLabelColor(assessment.security_label)}`}>
                      {assessment.security_label}
                    </span>
                    <span className="text-xs text-slate-400 font-mono break-all">{assessment.target_url}</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-2">
                    Observed Website Security Score
                  </h2>
                  <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
                    {assessment.summary}
                  </p>
                </div>

                {/* Score Dial & Coverage */}
                <div className="flex items-center gap-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Security Score</div>
                    <div className={`text-4xl font-extrabold ${
                      assessment.security_score >= 80 ? 'text-emerald-400' :
                      assessment.security_score >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {assessment.security_score}
                      <span className="text-sm text-slate-500 font-normal">/100</span>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-slate-800" />
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Inspection Coverage</div>
                    <div className="text-2xl font-bold text-indigo-400">
                      {assessment.coverage.percentage}%
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {assessment.coverage.completed}/{assessment.coverage.total} checks
                    </div>
                  </div>
                </div>
              </div>

              {/* Crucial Educational Distinction Callout */}
              <div className="mt-6 p-4 rounded-lg bg-indigo-950/20 border border-indigo-800/40 text-xs text-indigo-200 leading-relaxed flex items-start gap-3">
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300 block mb-0.5">Critical Distinction: Security Configuration vs. Phishing Risk</span>
                  {assessment.distinction_note}
                </div>
              </div>
            </div>

            {/* Category Scores Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessment.categories.map((cat, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        {cat.category}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        cat.status === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400' :
                        cat.status === 'ACCEPTABLE' ? 'bg-blue-500/20 text-blue-400' :
                        cat.status === 'WEAK' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {cat.status}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-extrabold text-white">{cat.score}</span>
                      <span className="text-xs text-slate-500">/ 100 (Weight: {Math.round(cat.weight * 100)}%)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{cat.description}</p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 rounded-full h-1.5 mt-4 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cat.score >= 80 ? 'bg-emerald-500' :
                        cat.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* HTTP Security Headers Matrix */}
            {assessment.headers_evaluation.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-indigo-400" />
                  HTTP Defensive Headers Audit Matrix (9 Headers Evaluated)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Header Name</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Observed Value</th>
                        <th className="py-2.5 px-3">Security Purpose</th>
                        <th className="py-2.5 px-3">Recommended Hardening</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {assessment.headers_evaluation.map((h, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-200">{h.header_name}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              h.assessment === 'STRONG' ? 'bg-emerald-500/20 text-emerald-400' :
                              h.assessment === 'ACCEPTABLE' ? 'bg-blue-500/20 text-blue-400' :
                              h.assessment === 'WEAK' ? 'bg-amber-500/20 text-amber-400' :
                              h.assessment === 'INSECURE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {h.assessment}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs" title={h.observed_value || 'None'}>
                            {h.observed_value || <span className="text-slate-600 italic">Not Present</span>}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs">{h.security_purpose}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-300 max-w-xs">
                            {h.recommended_improvement || <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Optimal</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cookie Security Matrix (if any cookies observed) */}
            {assessment.cookies_evaluation.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-amber-400" />
                  Cookie Security Directives (Privacy Preserved: Values Redacted)
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Actual cookie contents and session tokens are never stored or displayed to safeguard user privacy.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Cookie Identifier</th>
                        <th className="py-2.5 px-3">Secure</th>
                        <th className="py-2.5 px-3">HttpOnly</th>
                        <th className="py-2.5 px-3">SameSite</th>
                        <th className="py-2.5 px-3">Path / Domain</th>
                        <th className="py-2.5 px-3">Posture Assessment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {assessment.cookies_evaluation.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition">
                          <td className="py-2.5 px-3 font-bold text-slate-200">{c.cookie_name}</td>
                          <td className="py-2.5 px-3">
                            {c.secure ? <span className="text-emerald-400 font-bold">YES</span> : <span className="text-red-400 font-bold">NO</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            {c.http_only ? <span className="text-emerald-400 font-bold">YES</span> : <span className="text-amber-400 font-bold">NO</span>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">{c.same_site || <span className="text-slate-600 italic">None</span>}</td>
                          <td className="py-2.5 px-3 text-slate-400">{c.path || '/'} {c.domain ? `(${c.domain})` : ''}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              c.assessment === 'SECURE' ? 'bg-emerald-500/20 text-emerald-400' :
                              c.assessment === 'POTENTIALLY_VULNERABLE' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {c.assessment}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Granular Observable Findings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Observed Findings & Anomalies ({filteredFindings.length} of {assessment.findings.length})
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Granular evidence-based observations across transport, headers, cookies, and public configuration files.
                  </p>
                </div>

                {/* Severity & Category Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Severity:</span>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Severities</option>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                      <option value="INFORMATIONAL">Informational</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-500">Category:</span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="HTTPS_TRANSPORT">HTTPS Transport</option>
                      <option value="SECURITY_HEADERS">Headers</option>
                      <option value="COOKIE_SECURITY">Cookies</option>
                      <option value="MIXED_CONTENT">Mixed Content</option>
                      <option value="INFORMATION_EXPOSURE">Information Exposure</option>
                      <option value="SECURITY_CONFIG">Public Files</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-sm">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No security findings matched the selected filter criteria.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFindings.map((finding, idx) => {
                    const isExpanded = !!expandedFindings[idx];
                    return (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden transition"
                      >
                        <button
                          onClick={() => toggleFinding(idx)}
                          className="w-full text-left p-4 flex items-center justify-between hover:bg-slate-900/50 transition"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getSeverityBadge(finding.severity)}`}>
                              {finding.severity}
                            </span>
                            <span className="text-xs font-mono text-slate-500 uppercase">{finding.category.replace('_', ' ')}</span>
                            <span className="text-sm font-semibold text-slate-200">{finding.title}</span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </button>

                        {isExpanded && (
                          <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs space-y-3">
                            <p className="text-slate-300 leading-relaxed">{finding.description}</p>

                            {finding.evidence && Object.keys(finding.evidence).length > 0 && (
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto">
                                <span className="text-slate-500 font-sans font-semibold block mb-1">Observed Telemetry Evidence:</span>
                                <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
                              </div>
                            )}

                            {finding.recommendation && (
                              <div className="p-3 rounded bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-emerald-200 block mb-0.5">Remediation Recommendation:</span>
                                  {finding.recommendation}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prescriptive Remediation & Actionable Recommendations */}
            {assessment.recommendations.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Consolidated Hardening Recommendations ({assessment.recommendations.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assessment.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{rec}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(rec, i)}
                        title="Copy recommendation"
                        className="text-slate-500 hover:text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteSecurityPage;

