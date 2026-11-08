import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const TlsTrustCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
          TLS & certificate trust
        </h2>
        <NavLink
          to="/certificate-trust"
          className="text-xs font-medium text-[#0d5c4d] dark:text-[#38d4b5] hover:text-[#094136] dark:hover:text-[#5fe5cb] flex items-center gap-1 transition-colors"
        >
          <span>Explore</span>
          <ExternalLink className="w-3 h-3" />
        </NavLink>
      </div>

      {/* Big Number */}
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
          412
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          TLS assessments
        </span>
      </div>

      {/* Segmented Progress Bar */}
      <div className="mt-3.5">
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden gap-[1px]">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: '93%' }}
            title="384 checks passed (93%)"
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: '4.5%' }}
            title="18 issues (4.5%)"
          />
          <div
            className="h-full bg-slate-300 dark:bg-slate-600 rounded-r-full transition-all duration-500"
            style={{ width: '2.5%' }}
            title="10 unavailable (2.5%)"
          />
        </div>

        {/* Labels under progress bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            384 checks passed
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            18 issues
          </span>
          <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            10 unavailable
          </span>
        </div>
      </div>

      {/* Detailed Issue List */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span>Expired / hostname mismatch</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">18</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span>Chain / revocation / weak key</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">14</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 flex-shrink-0" />
            <span>Revocation or CT lookup unavailable</span>
          </div>
          <span className="font-mono font-bold text-slate-900 dark:text-white">10</span>
        </div>
      </div>

      {/* Disclaimer / Callout */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 leading-tight">
        <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
        <span>A valid certificate does not mean a website is safe.</span>
      </div>
    </div>
  );
};
