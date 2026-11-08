import React from 'react';
import { Flag, CheckCircle2, Clock, ThumbsUp, MessageSquare } from 'lucide-react';

export const CommunityReportsPage: React.FC = () => {
  const communityReports = [
    {
      id: 'rep-101',
      domain: 'auth1-sync.example',
      category: 'Credential Harvesting',
      reporter: 'M. Chen (SecOps Lead)',
      votes: 42,
      comments: 6,
      status: 'Validated',
      time: '14:30 UTC'
    },
    {
      id: 'rep-102',
      domain: 'parcel-reschedule.example',
      category: 'Delivery Brand Impersonation',
      reporter: 'J. Rivera (SOC Analyst)',
      votes: 18,
      comments: 3,
      status: 'Pending Review',
      time: '14:18 UTC'
    },
    {
      id: 'rep-103',
      domain: 'tax-refund-portal.example',
      category: 'Government Scam',
      reporter: 'A. Patel (Security Engineer)',
      votes: 89,
      comments: 12,
      status: 'Validated',
      time: '12:05 UTC'
    }
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
            Community Threat Reports
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
            Crowdsourced cyber indicators validated by security researchers and automated trust signals.
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0d5c4d] hover:bg-[#0a4b3e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto">
          <Flag className="w-3.5 h-3.5" />
          <span>Submit Community Report</span>
        </button>
      </div>

      <div className="space-y-3">
        {communityReports.map((rep) => (
          <div
            key={rep.id}
            className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{rep.domain}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60">
                  {rep.category}
                </span>
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                rep.status === 'Validated' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
              }`}>
                {rep.status === 'Validated' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
                <span>{rep.status} · {rep.time}</span>
              </span>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Reported by <strong className="text-slate-700 dark:text-slate-200">{rep.reporter}</strong></span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{rep.votes} confirmations</span>
                </span>
                <span className="flex items-center gap-1 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{rep.comments} notes</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
