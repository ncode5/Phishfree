import React from 'react';
import { X, ShieldCheck, Lock, Globe, Cpu, Database } from 'lucide-react';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0d5c4d] text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                PhishFree Security Methodology
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Evidence, not assumptions: Zero-touch passive analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 bg-[#e8f5f1]/50 dark:bg-[#0d5c4d]/20 border border-[#0d5c4d]/20 dark:border-[#0d5c4d]/40 rounded-xl space-y-1">
            <h4 className="font-bold text-[#0d5c4d] dark:text-[#38d4b5] text-xs">Core Philosophy</h4>
            <p className="leading-relaxed">
              PhishFree operates on a passive intelligence model. We evaluate web indicators through observable trust signals without alerting adversaries or triggering defense evasion mechanics.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Globe className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">DNS & Routing Hygiene</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Inspection of authoritative nameservers, MX records, DMARC/SPF/DKIM policies, and fast-flux TTL anomalies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Cryptographic & TLS Assurance</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Validation of Subject Alternative Names (SAN), issuer trust chains, public key curves, and Certificate Transparency (CT) logs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Multi-Engine AI Threat Correlation</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Real-time correlation with 80+ threat intelligence engines, typosquatting distance metrics, and explainable AI summaries.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Database className="w-3.5 h-3.5" />
              </div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Sepolia Testnet Integrity Anchoring</h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  Every validated finding generates an on-chain SHA-256 cryptographic digest ensuring tamper-proof historical audit trails while protecting sensitive client payloads.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0d5c4d] hover:bg-[#0a4b3e] text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
