import React, { useState } from 'react';
import { Search, Download, ChevronRight } from 'lucide-react';
import { initialInvestigations, InvestigationItem } from '../data/mockData';
import { InvestigationDetailModal } from '../components/dashboard/InvestigationDetailModal';

export const InvestigationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<InvestigationItem | null>(null);

  const filtered = initialInvestigations.filter((item) => {
    const matchesSearch =
      item.indicator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || item.riskAssessment === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
            Security Investigations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
            Active and archived multi-engine threat investigations and audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 shadow-card dark:shadow-none transition-colors">
            <Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-card dark:shadow-none flex flex-col sm:flex-row items-center gap-3 transition-colors">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search indicator, threat pattern, or evidence source..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86]"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="Confirmed Malicious">Confirmed Malicious</option>
            <option value="High Risk">High Risk</option>
            <option value="Suspicious">Suspicious</option>
            <option value="Low Risk">Low Risk</option>
            <option value="Inconclusive">Inconclusive</option>
          </select>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card dark:shadow-none overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                <th className="py-3 px-5">INDICATOR</th>
                <th className="py-3 px-4">RISK ASSESSMENT</th>
                <th className="py-3 px-4">TYPE & CATEGORY</th>
                <th className="py-3 px-4">EVIDENCE SOURCES</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">TIME</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-5 font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {item.indicator}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.riskAssessment}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.type} · {item.category}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {item.evidenceSources}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {item.status}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                    Today, {item.time}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-xs font-semibold text-[#0d5c4d] dark:text-[#38d4b5] hover:underline flex items-center gap-0.5 ml-auto">
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <InvestigationDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
};
