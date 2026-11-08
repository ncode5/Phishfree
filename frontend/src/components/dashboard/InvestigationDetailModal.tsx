import React, { useState } from 'react';
import {
  X,
  Globe,
  Lock,
  Cpu,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { InvestigationItem } from '../../data/mockData';

interface InvestigationDetailModalProps {
  item: InvestigationItem | null;
  onClose: () => void;
}

export const InvestigationDetailModal: React.FC<InvestigationDetailModalProps> = ({
  item,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dns' | 'tls' | 'ai'>('overview');

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 dark:text-slate-500">
                Full Investigation Dossier
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/60">
                {item.riskAssessment}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5 truncate">
              {item.indicator}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-[#0d5c4d] dark:border-[#38d4b5] text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Signals & Risk
          </button>
          <button
            onClick={() => setActiveTab('dns')}
            className={`py-2.5 border-b-2 transition-all ${
              activeTab === 'dns'
                ? 'border-[#0d5c4d] dark:border-[#38d4b5] text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            DNS & Routing
          </button>
          <button
            onClick={() => setActiveTab('tls')}
            className={`py-2.5 border-b-2 transition-all ${
              activeTab === 'tls'
                ? 'border-[#0d5c4d] dark:border-[#38d4b5] text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            TLS & Certificate
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 border-b-2 transition-all ${
              activeTab === 'ai'
                ? 'border-[#0d5c4d] dark:border-[#38d4b5] text-[#0d5c4d] dark:text-[#38d4b5]'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AI Heuristics
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 dark:text-slate-300">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Indicator Classification
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Type:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Threat Pattern:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Evidence Feeds:</span>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">{item.evidenceSources}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Verification Status:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{item.status}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#0d5c4d] dark:text-[#38d4b5]" />
                    Domain & Reputation Breakdown
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.details.domainReputation}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Website & Message Signals
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.details.websiteSignals}
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Cryptographic & TLS Audit
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.details.tlsChecks}
                  </p>
                </div>
              </div>

              {item.details.warningNotice && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{item.details.warningNotice}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dns' && (
            <div className="space-y-3 font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs space-y-1.5">
                <div className="text-slate-400 text-[11px]">;; QUESTION SECTION:</div>
                <div className="text-emerald-400">;{item.indicator}. IN A</div>
                <div className="text-slate-400 text-[11px] pt-1">;; ANSWER SECTION:</div>
                <div>{item.indicator}. 300 IN A 192.0.2.148</div>
                <div>{item.indicator}. 300 IN A 198.51.100.22</div>
                <div className="text-slate-400 text-[11px] pt-1">;; AUTHORITY SECTION:</div>
                <div className="text-amber-400">ns1.malicious-fastflux.org. 172800 IN NS</div>
                <div className="text-amber-400">ns2.malicious-fastflux.org. 172800 IN NS</div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-sans text-xs">
                Nameserver matches known bulletproof hosting ASN with rapid TTL churn (300s).
              </p>
            </div>
          )}

          {activeTab === 'tls' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">Subject CN:</span>
                  <p className="font-mono font-semibold text-slate-900 dark:text-white">{item.indicator}</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">Issuer:</span>
                  <p className="font-semibold text-slate-900 dark:text-white">Let's Encrypt Authority X3</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">Key Exchange:</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200">ECDHE-RSA-AES128-GCM-SHA256</p>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">CT Log Status:</span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">2 SCTs embedded</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="p-4 rounded-xl bg-[#e8f5f1]/40 dark:bg-[#0d5c4d]/20 border border-[#0d5c4d]/20 dark:border-[#0d5c4d]/40 space-y-2">
              <div className="flex items-center gap-2 text-[#0d5c4d] dark:text-[#38d4b5] font-bold text-xs uppercase tracking-wide">
                <Cpu className="w-4 h-4" />
                <span>AI Scam & Impersonation Engine</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                The visual entropy and brand asset distribution indicates a 94.2% match against corporate single sign-on portals. Typosquatting distance algorithm calculated Damerau-Levenshtein distance of 1 from authorized organizational root.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Passive verification record #{item.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0d5c4d] hover:bg-[#0a4b3e] text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
