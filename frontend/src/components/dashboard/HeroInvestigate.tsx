import React, { useState } from 'react';
import {
  Search,
  Globe,
  Mail,
  Lock,
  Sparkles,
  Flag,
  Loader2,
  CheckCircle2
} from 'lucide-react';

interface HeroInvestigateProps {
  onInvestigate: (query: string) => void;
  onOpenReportModal: () => void;
  isScanning?: boolean;
}

export const HeroInvestigate: React.FC<HeroInvestigateProps> = ({
  onInvestigate,
  onOpenReportModal,
  isScanning = false
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'email'>('url');
  const [query, setQuery] = useState<string>('');
  const [selectedPills, setSelectedPills] = useState<string[]>([
    'Domain & redirects',
    'Threat reputation',
    'DNS & TLS',
    'Website security',
    'AI scam analysis'
  ]);

  const pills = [
    'Domain & redirects',
    'Threat reputation',
    'DNS & TLS',
    'Website security',
    'AI scam analysis'
  ];

  const togglePill = (pill: string) => {
    setSelectedPills((prev) =>
      prev.includes(pill) ? prev.filter((p) => p !== pill) : [...prev, pill]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      onInvestigate('account-verify.example');
      return;
    }
    onInvestigate(query.trim());
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none transition-colors">
      {/* Top Tabs & Passive checks label */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 gap-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>URL / Domain</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'email'
                ? 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Message / Email</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs">
          <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span>Passive, non-intrusive checks</span>
        </div>
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              activeTab === 'url'
                ? 'Paste a suspicious URL or domain to inspect its trust signals'
                : 'Paste email headers, raw message text, or sender domain'
            }
            className="w-full pl-10 pr-20 py-2.5 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs md:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86] focus:ring-1 focus:ring-[#0d5c4d] dark:focus:ring-[#1e9b86] transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={isScanning}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0d5c4d] hover:bg-[#0a4b3e] text-white text-xs md:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-70"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Investigate</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs md:text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Flag className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="whitespace-nowrap">Report a threat</span>
          </button>
        </div>
      </form>

      {/* Trust Signal Pills */}
      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-1">
        {pills.map((pill) => {
          const isSelected = selectedPills.includes(pill);
          return (
            <button
              key={pill}
              type="button"
              onClick={() => togglePill(pill)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                isSelected
                  ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700'
                  : 'bg-transparent text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <CheckCircle2
                className={`w-3 h-3 ${
                  isSelected ? 'text-[#0d5c4d] dark:text-[#38d4b5]' : 'text-slate-300 dark:text-slate-600'
                }`}
              />
              <span>{pill}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
