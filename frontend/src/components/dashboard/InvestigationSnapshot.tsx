import React from 'react';
import { ExternalLink, AlertTriangle, Globe, Lock, ShieldAlert } from 'lucide-react';
import { InvestigationItem } from '../../data/mockData';

interface InvestigationSnapshotProps {
  item: InvestigationItem;
  onOpenDetails: (item: InvestigationItem) => void;
}

export const InvestigationSnapshot: React.FC<InvestigationSnapshotProps> = ({
  item,
  onOpenDetails
}) => {
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Confirmed Malicious':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
            Confirmed Malicious
          </span>
        );
      case 'High Risk':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
            High Risk
          </span>
        );
      case 'Suspicious':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
            Suspicious
          </span>
        );
      case 'Low Risk':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
            Low Risk
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Inconclusive
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between transition-colors">
      {/* Top Tag & Risk Badge */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            INVESTIGATION SNAPSHOT
          </span>
          {getRiskBadge(item.riskAssessment)}
        </div>

        {/* Primary Target Title & Subtitle */}
        <div className="mt-3">
          <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight break-all">
            {item.indicator}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {item.checksAvailable} · Today, {item.time} UTC
          </p>
        </div>

        {/* Structured Evidence Signals */}
        <div className="mt-4 space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
          {/* Signal 1: Domain & reputation */}
          <div className="flex items-start gap-2.5">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wide">
                Domain & reputation
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                {item.details.domainReputation}
              </p>
            </div>
          </div>

          {/* Signal 2: Website & message signals */}
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wide">
                Website & message signals
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                {item.details.websiteSignals}
              </p>
            </div>
          </div>

          {/* Signal 3: TLS checks */}
          <div className="flex items-start gap-2.5">
            <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block text-[11px] uppercase tracking-wide">
                TLS checks
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5 leading-relaxed">
                {item.details.tlsChecks}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Callout Box */}
        {item.details.warningNotice && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2 text-amber-900 dark:text-amber-300 text-xs leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>{item.details.warningNotice}</span>
          </div>
        )}
      </div>

      {/* Card Action Link */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => onOpenDetails(item)}
          className="text-xs font-semibold text-[#0d5c4d] dark:text-[#38d4b5] hover:text-[#094136] dark:hover:text-[#5fe5cb] flex items-center gap-1.5 transition-colors group"
        >
          <span>Open full evidence & sources</span>
          <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
