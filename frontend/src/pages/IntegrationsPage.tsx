import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const IntegrationsPage: React.FC = () => {
  const integrations = [
    { name: 'VirusTotal API v3', desc: 'Query 80+ antivirus and domain scan engines.', status: 'Connected', badge: 'Active' },
    { name: 'Google Safe Browsing Lookup v5', desc: 'Real-time client-side URL risk verification.', status: 'Connected', badge: 'Active' },
    { name: 'Certificate Transparency Logs (CertSpotter/Crt.sh)', desc: 'Monitor SAN additions and rogue wildcard issues.', status: 'Connected', badge: 'Active' },
    { name: 'Splunk / Datadog SIEM Webhook', desc: 'Forward high-risk investigation telemetry automatically.', status: 'Configured', badge: 'Active' },
    { name: 'Ethereum Sepolia RPC Provider (Infura/Alchemy)', desc: 'Notarize tamper-proof SHA-256 evidence digests.', status: 'Connected', badge: 'Active' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          Security Integrations
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Manage third-party threat feeds, enterprise SIEM connectors, and cryptographic oracles.
        </p>
      </div>

      <div className="space-y-3">
        {integrations.map((item) => (
          <div
            key={item.name}
            className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-lg bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                {item.status}
              </span>
              <button className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                Configure
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
