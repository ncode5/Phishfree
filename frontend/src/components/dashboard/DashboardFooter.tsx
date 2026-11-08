import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="pt-2 pb-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 gap-2 border-t border-slate-200/60 dark:border-slate-800 transition-colors">
      <div className="flex items-center gap-1.5 text-center sm:text-left">
        <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
        <span>
          Illustrative demo data only. For live threat results or active website scanning.
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-center sm:text-right font-medium text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-[#0d5c4d] dark:text-[#38d4b5]" />
        <span>Passive checks only · Sensitive content stays off-chain</span>
      </div>
    </footer>
  );
};
