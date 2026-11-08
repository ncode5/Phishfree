import React from 'react';
import { ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { InvestigationItem } from '../../data/mockData';

interface RecentInvestigationsProps {
  investigations: InvestigationItem[];
  selectedId: string;
  onSelect: (item: InvestigationItem) => void;
  onOpenDetails: (item: InvestigationItem) => void;
}

export const RecentInvestigations: React.FC<RecentInvestigationsProps> = ({
  investigations,
  selectedId,
  onSelect,
  onOpenDetails
}) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Confirmed Malicious':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
            Confirmed Malicious
          </span>
        );
      case 'High Risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
            High Risk
          </span>
        );
      case 'Suspicious':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            Suspicious
          </span>
        );
      case 'Low Risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            Low Risk
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Inconclusive
          </span>
        );
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Reviewed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Reviewed</span>
          </span>
        );
      case 'In review':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>In review</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Parked</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Recent investigations
          </h2>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/80">
            24 today
          </span>
        </div>

        <NavLink
          to="/investigations"
          className="text-xs font-medium text-[#0d5c4d] dark:text-[#38d4b5] hover:text-[#094136] dark:hover:text-[#5fe5cb] flex items-center gap-1 transition-colors"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </NavLink>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 md:-mx-5">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead>
            <tr className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
              <th className="py-2.5 px-4 md:px-5">INDICATOR</th>
              <th className="py-2.5 px-3">RISK ASSESSMENT</th>
              <th className="py-2.5 px-3">EVIDENCE SOURCES</th>
              <th className="py-2.5 px-3">STATUS</th>
              <th className="py-2.5 px-3">TIME</th>
              <th className="py-2.5 px-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {investigations.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <tr
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className={`group cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#e8f5f1]/40 dark:bg-[#0d5c4d]/15 hover:bg-[#e8f5f1]/60 dark:hover:bg-[#0d5c4d]/25'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Indicator */}
                  <td className="py-2.5 px-4 md:px-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0d5c4d] dark:group-hover:text-[#38d4b5] transition-colors">
                        {item.indicator}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {item.type} · {item.category}
                      </span>
                    </div>
                  </td>

                  {/* Risk Assessment */}
                  <td className="py-2.5 px-3">
                    {getRiskBadge(item.riskAssessment)}
                  </td>

                  {/* Evidence Sources */}
                  <td className="py-2.5 px-3">
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {item.evidenceSources}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3">
                    {getStatusDot(item.status)}
                  </td>

                  {/* Time */}
                  <td className="py-2.5 px-3">
                    <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {item.time}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetails(item);
                      }}
                      className="p-1 text-slate-400 dark:text-slate-500 hover:text-[#0d5c4d] dark:hover:text-[#38d4b5] rounded transition-colors"
                      title="Inspect full details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
        <input
          type="checkbox"
          id="disclaimer-check"
          defaultChecked={false}
          className="rounded border-slate-300 dark:border-slate-700 text-[#0d5c4d] dark:text-[#38d4b5] focus:ring-[#0d5c4d] dark:bg-slate-900 w-3 h-3"
        />
        <label htmlFor="disclaimer-check" className="cursor-pointer">
          Risk reflects available evidence. Low Risk is not a guarantee of safety.
        </label>
      </div>
    </div>
  );
};
