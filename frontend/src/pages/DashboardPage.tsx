import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Search,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  MessageSquare
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quickUrl, setQuickUrl] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load security metrics from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleQuickScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    navigate(`/scanner?url=${encodeURIComponent(quickUrl.trim())}`);
  };

  return (
    <div className="space-y-8">
      {/* Hero Quick Scanner Card */}
      <div className="cyber-card p-6 md:p-8 bg-gradient-to-br from-cyber-900 via-cyber-900/90 to-blue-950/30 border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-400 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            Modules 1, 2 & 3 Active · Web, TLS & AI Scam Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-2">
            AI-Powered Web Threat Detection & Digital Trust Intelligence
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
            Investigate suspicious links, discover typosquatting campaigns, inspect DNS records,
            audit safe redirects, and obtain explainable, evidence-backed security risk assessments.
          </p>

          <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Enter URL to investigate (e.g. paypa1-security.com, https://github.com)"
                className="w-full pl-11 pr-4 py-3 bg-cyber-950/80 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg text-sm shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Investigate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-400">
            <span className="font-mono text-slate-500">Quick tests:</span>
            <button
              type="button"
              onClick={() => setQuickUrl('https://github.com')}
              className="px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 font-mono transition-colors"
            >
              github.com (Safe)
            </button>
            <button
              type="button"
              onClick={() => setQuickUrl('http://paypa1-security-update.com/login')}
              className="px-2.5 py-1 rounded bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 font-mono transition-colors"
            >
              paypa1-security.com (Typosquat)
            </button>
            <button
              type="button"
              onClick={() => setQuickUrl('http://198.51.100.4/verify-wallet')}
              className="px-2.5 py-1 rounded bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 font-mono transition-colors"
            >
              IP Host (Suspicious)
            </button>
          </div>
        </div>
      </div>

      {/* Module 3 Feature Callout Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-blue-950/30 to-cyber-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>New: Module 3 AI Scam & Message Analyzer</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                LIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste suspicious SMS, KYC suspension notices, parcel texts, or job offers to detect social engineering lures & scam entities.
            </p>
          </div>
        </div>
        <Link
          to="/scam-analyzer"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium shadow-md shadow-indigo-900/40 transition-colors shrink-0"
        >
          <span>Analyze a Message</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Metrics Row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="cyber-card p-5 animate-pulse h-28 bg-cyber-900/50" />
          ))}
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total */}
          <div className="cyber-card p-4 sm:p-5">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Total URLs Analysed</span>
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats.total_analyzed}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Multi-vector telemetry</div>
          </div>

          {/* Confirmed Malicious */}
          <div className="cyber-card p-4 sm:p-5 border-rose-900/30 bg-rose-950/10">
            <div className="flex items-center justify-between text-rose-400 text-xs font-medium mb-2">
              <span>Confirmed Malicious</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-400">
              {stats.confirmed_malicious_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">High-confidence threats</div>
          </div>

          {/* High Risk */}
          <div className="cyber-card p-4 sm:p-5 border-orange-900/30 bg-orange-950/10">
            <div className="flex items-center justify-between text-orange-400 text-xs font-medium mb-2">
              <span>High Risk</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-orange-400">
              {stats.high_risk_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Multiple severe anomalies</div>
          </div>

          {/* Suspicious */}
          <div className="cyber-card p-4 sm:p-5 border-amber-900/30 bg-amber-950/10">
            <div className="flex items-center justify-between text-amber-400 text-xs font-medium mb-2">
              <span>Suspicious</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {stats.suspicious_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Anomalous indicators</div>
          </div>

          {/* Low Risk */}
          <div className="cyber-card p-4 sm:p-5 border-emerald-900/30 bg-emerald-950/10">
            <div className="flex items-center justify-between text-emerald-400 text-xs font-medium mb-2">
              <span>Low Risk</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {stats.low_risk_count}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">No severe flags observed</div>
          </div>
        </div>
      ) : null}

      {/* Analytics and Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Risk Distribution</h2>
              <p className="text-xs text-slate-400">Classification breakdown of scanned targets</p>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>

          {stats && stats.risk_distribution && stats.total_analyzed > 0 ? (
            <div className="flex flex-col items-center">
              <div className="w-full h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.risk_distribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {stats.risk_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#070b14" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0b1329',
                        borderColor: '#1e293b',
                        borderRadius: '0.5rem',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                      }}
                      formatter={(value: any, name: any) => [`${value} URLs`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-2 w-full mt-2 text-xs">
                {stats.risk_distribution.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-400 truncate">{item.name}:</span>
                    <span className="font-mono font-semibold text-white ml-auto">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-slate-500 text-xs">
              <HelpCircle className="w-8 h-8 mb-2 opacity-50" />
              <span>No scan records available yet.</span>
              <span className="text-slate-600 mt-1">Submit your first URL above to view metrics.</span>
            </div>
          )}
        </div>

        {/* Security Capabilities Architecture Card */}
        <div className="cyber-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Active Defense Capabilities</h2>
              <p className="text-xs text-slate-400">Module 1 Multi-Vector Verification Pillars</p>
            </div>
            <Link
              to="/about"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              Architecture <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg bg-cyber-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 font-medium text-sm text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Linguistic & Homoglyph Engine
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Profiles Punycode IDN domains, Cyrillic character substitutions, and computes fuzzy
                Levenshtein similarity to detect typosquatting against high-value target brands.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-cyber-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 font-medium text-sm text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Safe Redirect & SSRF Shield
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pre-resolves destination IPs at every hop to block private IPs, loopback, and cloud
                metadata addresses (169.254.169.254), guarding backend infrastructure from SSRF.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-cyber-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 font-medium text-sm text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                DNS Hierarchy Audit
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Collects A, AAAA, MX, NS, and TXT records using dnspython. Unreachable resolvers are
                classified as UNKNOWN/UNAVAILABLE without generating false malicious alerts.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-cyber-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2 font-medium text-sm text-slate-200 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Grounded AI Explanation
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Synthesizes hard verified technical findings into plain-language summaries and
                safety recommendations, strictly isolated against prompt injection.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Investigations Table */}
      <div className="cyber-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Recent Investigations</h2>
            <p className="text-xs text-slate-400">Recently submitted URLs and classification results</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats && stats.recent_reports && stats.recent_reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cyber-950/80 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Target Domain / URL</th>
                  <th className="py-3 px-4">Risk Classification</th>
                  <th className="py-3 px-4">Risk Score</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.recent_reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-semibold text-slate-200">{report.domain}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{report.submitted_url}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={report.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-200">
                      {report.risk_score.toFixed(0)}/100
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">
                      {(report.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-xs">
                      {report.findings_count} items
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No investigations logged yet.</p>
            <Link to="/scanner" className="text-blue-400 hover:underline mt-1 inline-block text-xs">
              Run your first investigation in the URL Scanner →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

