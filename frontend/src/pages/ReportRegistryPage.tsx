import React from 'react';
import { Link2, ShieldCheck, ExternalLink } from 'lucide-react';

export const ReportRegistryPage: React.FC = () => {
  const onChainRecords = [
    {
      hash: '0x8b3e...df1c',
      fullHash: '0x8b3ec489d21ab509eef48b92bcf19114d56711a9f02931201cb4901f486edf1c',
      target: 'auth1-sync.example',
      verdict: 'Confirmed Malicious',
      block: 6942081,
      network: 'Ethereum Sepolia Testnet',
      timestamp: 'Today, 14:30:12 UTC'
    },
    {
      hash: '0x4f1a...99e2',
      fullHash: '0x4f1a89c20140d39e80209abf2849c71a39b94091fe501239aaef4899182399e2',
      target: 'tax-refund-portal.example',
      verdict: 'Confirmed Malicious',
      block: 6941950,
      network: 'Ethereum Sepolia Testnet',
      timestamp: 'Today, 12:05:44 UTC'
    },
    {
      hash: '0x12c9...b630',
      fullHash: '0x12c9748b0124fead78990391cb4f901cb478128479bbfe89012480112341b630',
      target: 'docs.acme.example',
      verdict: 'Low Risk',
      block: 6940822,
      network: 'Ethereum Sepolia Testnet',
      timestamp: 'Today, 08:14:02 UTC'
    }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          Immutable Report Registry
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Cryptographically committed report digests anchored to Sepolia Testnet. Sensitive payload content remains strictly off-chain.
        </p>
      </div>

      <div className="bg-[#e8f5f1]/40 dark:bg-[#0d5c4d]/20 border border-[#0d5c4d]/20 dark:border-[#0d5c4d]/40 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0d5c4d] dark:text-[#38d4b5] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>Proof of Investigation:</strong> Each security audit creates a deterministic SHA-256 state tree hash signed by the PhishFree oracle and anchored in Ethereum testnet smart contracts. This allows enterprise clients and forensic teams to independently verify report provenance without leaking private corporate domains.
        </div>
      </div>

      <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-card dark:shadow-none overflow-hidden transition-colors">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#0d5c4d] dark:text-[#38d4b5]" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
              Sepolia Testnet Ledger
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Oracle In Sync
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {onChainRecords.map((r) => (
            <div key={r.hash} className="p-4 md:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs md:text-sm text-slate-900 dark:text-white">
                    {r.target}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    r.verdict === 'Confirmed Malicious'
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {r.verdict}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">{r.timestamp}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span>Commit Hash: <strong className="text-slate-700 dark:text-slate-300">{r.hash}</strong></span>
                <span>Block: #{r.block}</span>
                <span className="text-slate-400 dark:text-slate-500">{r.network}</span>
                <span className="text-[#0d5c4d] dark:text-[#38d4b5] hover:underline cursor-pointer flex items-center gap-1">
                  <span>Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
