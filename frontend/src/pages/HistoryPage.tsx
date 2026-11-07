import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { History, Search, Filter, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { AnalysisReportListItem, RiskLevel } from '../types';
import { RiskBadge } from '../components/RiskBadge';

export const HistoryPage: React.FC = () => {
  const [reports, setReports] = useState<AnalysisReportListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReports(100, 0);
      setReports(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch analysis history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.submitted_url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || r.risk_level === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <History className="w-6 h-6 text-blue-400" />
            <span>Investigation History</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Archived security investigations and forensic audit records
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="cyber-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by domain or submitted URL..."
            className="w-full pl-9 pr-4 py-2 bg-cyber-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          <span className="text-slate-500 font-mono mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Risk:
          </span>
          {['ALL', 'CONFIRMED_MALICIOUS', 'HIGH_RISK', 'SUSPICIOUS', 'LOW_RISK', 'INCONCLUSIVE'].map(
            (lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedFilter(lvl)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  selectedFilter === lvl
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'ALL' : lvl.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="cyber-card p-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-mono">Loading investigation log...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cyber-950/80 text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Domain / Destination</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Findings</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200 text-xs">{report.domain}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{report.submitted_url}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={report.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-white">
                      {report.risk_score.toFixed(0)}/100
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {(report.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {report.findings_count}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-sans">
                      {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium px-2.5 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-sm">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No investigations match the current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

