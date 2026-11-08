import React from 'react';
import { CheckCircle2, Clock, Link2, ExternalLink } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const CollaborativeIntel: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 gap-2">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Collaborative intelligence
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            94 validated reports · 8 awaiting review
          </span>
        </div>

        <NavLink
          to="/report-registry"
          className="text-xs font-semibold text-[#0d5c4d] dark:text-[#38d4b5] hover:text-[#094136] dark:hover:text-[#5fe5cb] flex items-center gap-1 transition-colors self-start sm:self-auto"
        >
          <span>View report registry</span>
          <ExternalLink className="w-3 h-3" />
        </NavLink>
      </div>

      {/* 3 Column Intelligence Cards */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Validated Intelligence */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-2 hover:bg-slate-50 dark:hover:bg-slate-950/90 transition-colors">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Validated intelligence</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono font-normal">· 14:30 UTC</span>
          </div>
          <div className="font-bold text-xs md:text-sm text-slate-900 dark:text-white font-mono truncate">
            auth1-sync.example
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
            Confirmed Malicious - credential harvesting
          </p>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            M. Chen · validated by Safe Browsing
          </div>
        </div>

        {/* Card 2: Pending Validation */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-2 hover:bg-slate-50 dark:hover:bg-slate-950/90 transition-colors">
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Pending validation</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono font-normal">· 14:18 UTC</span>
          </div>
          <div className="font-bold text-xs md:text-sm text-slate-900 dark:text-white font-mono truncate">
            parcel-reschedule.example
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
            Suspicious - delivery brand impersonation
          </p>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            J. Rivera · not yet assessed intelligence
          </div>
        </div>

        {/* Card 3: Report Integrity Verified (Sepolia) */}
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 rounded-xl space-y-2 hover:bg-slate-50 dark:hover:bg-slate-950/90 transition-colors">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-[11px] font-semibold">
            <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Report integrity verified</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono px-1.5 py-0.2 rounded font-bold">
              DEMO
            </span>
          </div>
          <div className="font-bold text-xs md:text-sm text-slate-900 dark:text-white font-mono truncate">
            0x8b3e...df1c · Sepolia Testnet
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
            On-chain commitments verify integrity and history. Sensitive report evidence stays off-chain.
          </p>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-0.5">
            Zero-knowledge cryptographic proof
          </div>
        </div>
      </div>
    </div>
  );
};
