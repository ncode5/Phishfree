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
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300 dark:border-[#1A2844] pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-800 dark:text-[#00E5A3]" />
            <span>Investigation History</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-800 dark:text-slate-300 mt-0.5 font-medium">
            Archived security investigations and forensic audit records
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#0D1629] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-[#1A2844] rounded-xl text-xs font-bold text-slate-900 dark:text-slate-200 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-700' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="phish-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by domain or submitted URL..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#070C18] border border-slate-300 dark:border-[#1A2844] rounded-xl text-xs text-slate-950 dark:text-white placeholder-slate-500 font-bold focus:outline-none focus:border-emerald-700 dark:focus:border-[#00D29E] font-mono transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          <span className="text-slate-800 dark:text-slate-300 font-bold mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Risk:
          </span>
          {['ALL', 'CONFIRMED_MALICIOUS', 'HIGH_RISK', 'SUSPICIOUS', 'LOW_RISK', 'INCONCLUSIVE'].map(
            (lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors font-bold ${
                  selectedFilter === lvl
                    ? 'bg-emerald-800 dark:bg-[#00D29E] text-white dark:text-slate-950 shadow-sm'
                    : 'bg-slate-200 dark:bg-[#070C18] text-slate-900 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {lvl === 'ALL' ? 'ALL' : lvl.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="phish-card p-6">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-400 font-mono font-bold">Loading investigation log...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 text-sm flex items-center gap-3 font-medium">
            <AlertCircle className="w-5 h-5 text-rose-700 dark:text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-[#070C18] text-slate-800 dark:text-slate-400 text-xs font-mono uppercase tracking-wider border-b border-slate-300 dark:border-[#1A2844]">
                <tr>
                  <th className="py-3 px-4 font-bold">Domain / Destination</th>
                  <th className="py-3 px-4 font-bold">Risk Level</th>
                  <th className="py-3 px-4 font-bold">Score</th>
                  <th className="py-3 px-4 font-bold">Confidence</th>
                  <th className="py-3 px-4 font-bold">Findings</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 text-right font-bold">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#1A2844] font-mono">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-100/80 dark:hover:bg-[#070C18] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-950 dark:text-white text-xs">{report.domain}</div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-400 truncate max-w-xs font-medium">{report.submitted_url}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge level={report.risk_level} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs font-extrabold text-slate-950 dark:text-white">
                      {report.risk_score.toFixed(0)}/100
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-800 dark:text-slate-300 font-bold">
                      {(report.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-900 dark:text-slate-200 font-bold">
                      {report.findings_count}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 dark:text-slate-300 font-sans font-medium">
                      {new Date(report.created_at).toLocaleDateString()} {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/reports/${report.id}`}
                        className="inline-flex items-center gap-1 text-xs text-emerald-950 dark:text-[#00E5A3] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-[#00D29E]/20 border border-emerald-300 dark:border-[#00D29E]/40 hover:bg-emerald-200 dark:hover:bg-[#00D29E]/30 transition-colors"
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
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No investigations match the current filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
