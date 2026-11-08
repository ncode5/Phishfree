import React, { useState } from 'react';
import { X, Flag, CheckCircle2, UploadCloud } from 'lucide-react';

interface ReportThreatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { url: string; category: string; description: string }) => void;
}

export const ReportThreatModal: React.FC<ReportThreatModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('credential_harvesting');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit({ url, category, description });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setUrl('');
      setDescription('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0b1329] rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Report Malicious Threat
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Submit an indicator to the collaborative intelligence feed
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
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Report Submitted!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              The threat indicator has been queued for verification and off-chain hash anchoring.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Suspicious URL or Domain <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://malicious-login-update.example/auth"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86] focus:ring-1 focus:ring-[#0d5c4d]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Threat Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86]"
              >
                <option value="credential_harvesting">Credential Harvesting (Phishing)</option>
                <option value="brand_impersonation">Brand Impersonation / Typosquatting</option>
                <option value="payment_fraud">Payment / Wire Fraud</option>
                <option value="malware_download">Malware Dropper / Payload</option>
                <option value="scam">Tech Support / Lottery Scam</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Evidence Details / Context
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g., Received via SMS claiming to be DHL package tracking with urgency..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0d5c4d] dark:focus:border-[#1e9b86] focus:ring-1 focus:ring-[#0d5c4d]"
              />
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
              <UploadCloud className="w-5 h-5 text-slate-400 dark:text-slate-500 mx-auto mb-1" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Attach email header or screenshot (optional)</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0d5c4d] hover:bg-[#0a4b3e] rounded-lg transition-colors shadow-xs"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
