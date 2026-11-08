import React from 'react';

export const ThreatIntelPage: React.FC = () => {
  const feeds = [
    { name: 'Google Safe Browsing v5', status: 'Operational', latency: '42ms', threatsToday: '4,120' },
    { name: 'VirusTotal Multi-Engine (84 Engines)', status: 'Operational', latency: '120ms', threatsToday: '12,980' },
    { name: 'Certificate Transparency Monitor', status: 'Operational', latency: '68ms', threatsToday: '840' },
    { name: 'PhishTank Community Feed', status: 'Operational', latency: '85ms', threatsToday: '1,450' },
    { name: 'Sepolia Testnet Hash Notarization', status: 'Operational', latency: '2.1s', threatsToday: '94 commits' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          Threat Intelligence
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Real-time global feeds, reputation aggregators, and zero-day threat correlation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none transition-colors">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Connected Intel Sources</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">5 Active</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">100% feed uptime</span>
        </div>
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none transition-colors">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Global Threat Signatures</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">18.4M+</div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mt-1 block">Updated 3 mins ago</span>
        </div>
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none transition-colors">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Correlation Speed</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">84 ms</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">Sub-second passive lookups</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card dark:shadow-none overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Intelligence Feeds Status
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">Real-time sync</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {feeds.map((feed) => (
            <div key={feed.name} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{feed.name}</h4>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Response latency: {feed.latency}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-semibold text-slate-900 dark:text-white">{feed.threatsToday}</span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block">ingested today</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
