import React, { useState } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [autoScan, setAutoScan] = useState(true);
  const [strictTls, setStrictTls] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
          Workspace Settings
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors">
          Configure security policy defaults, scan sensitivity, and SOC notification triggers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-5 shadow-card dark:shadow-none space-y-4 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Inspection Sensitivity & Defaults
          </h3>

          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Automatic Multi-Layer Passive Resolution</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Run DNS, WHOIS, and TLS checks simultaneously upon indicator input.</span>
            </div>
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
              className="rounded text-[#0d5c4d] dark:text-[#38d4b5] focus:ring-[#0d5c4d] dark:bg-slate-900 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">Strict TLS Certificate Revocation Enforcement</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Flag any domain whose CRL or OCSP endpoint times out as Suspicious.</span>
            </div>
            <input
              type="checkbox"
              checked={strictTls}
              onChange={(e) => setStrictTls(e.target.checked)}
              className="rounded text-[#0d5c4d] dark:text-[#38d4b5] focus:ring-[#0d5c4d] dark:bg-slate-900 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">SOC Email & Slack Dispatch</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Trigger immediate webhooks when Confirmed Malicious indicators are detected.</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded text-[#0d5c4d] dark:text-[#38d4b5] focus:ring-[#0d5c4d] dark:bg-slate-900 border-slate-300 dark:border-slate-700 w-4 h-4 cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0d5c4d] hover:bg-[#0a4b3e] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved successfully</span>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};
