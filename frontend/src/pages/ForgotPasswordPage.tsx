import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const ForgotPasswordPage: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const isLightActive = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');
  const isDimActive = theme === 'dim' || (theme === 'system' && resolvedTheme === 'dark');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(email.trim());
      setSuccess(true);
      if (res.dev_reset_url) {
        setDevResetUrl(res.dev_reset_url);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Unable to submit request. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#070C18] text-slate-900 dark:text-white transition-colors duration-200 p-6 sm:p-12">
      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between mb-8">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#040915] border border-slate-300 dark:border-[#1A2844] flex items-center justify-center p-1.5 shadow-sm">
            <img
              src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
              alt="Phishfree"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-950 dark:text-white">
            Phish<span className={isDark ? "text-[#FFD000]" : "text-blue-600"}>free</span>
          </span>
        </Link>

        {/* Theme Selector */}
        <div className="flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844]">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLightActive
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dim')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              isDimActive
                ? 'bg-[#FFD000] text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Dim</span>
          </button>
        </div>
      </div>

      {/* Main Centered Card */}
      <div className="my-auto max-w-md w-full mx-auto">
        <div className="phish-card p-8 border border-slate-200 dark:border-[#1A2844] shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-yellow-400/10 border border-blue-200 dark:border-yellow-400/30 text-blue-600 dark:text-yellow-400 flex items-center justify-center mb-6 shadow-sm">
            <KeyRound className="w-6 h-6" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Enter your verified security analyst email address. We will generate a secure single-use recovery token.
          </p>

          {/* Success Notification */}
          {success ? (
            <div className="mt-6 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3 text-emerald-950 dark:text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider mb-1">Recovery Token Generated</p>
                  <p className="text-xs leading-relaxed">
                    If an account with this email exists in our registry, instructions have been dispatched. The recovery token expires in 60 minutes.
                  </p>
                </div>
              </div>

              {/* Dev Mode Reset Link (if email provider unconfigured) */}
              {devResetUrl && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 text-amber-950 dark:text-amber-200 text-xs">
                  <p className="font-bold uppercase tracking-wider mb-1">Development Workflow Assistant</p>
                  <p className="mb-3 text-[11px] leading-relaxed">
                    External SMTP email delivery is unconfigured in this local development environment. You may proceed directly via this single-use token link:
                  </p>
                  <Link
                    to={devResetUrl.replace(/^https?:\/\/[^\/]+/, '')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Proceed to Reset Password Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Account Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="analyst@phishfree.io"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-slate-950 shadow-md shadow-blue-500/20 dark:shadow-yellow-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 border-t-transparent animate-spin" />
                    <span>Generating token...</span>
                  </>
                ) : (
                  <>
                    <span>Request Recovery Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 mt-8">
        PhishFree Cryptographic Recovery System · Single-Use Tokens Expire in 60 Minutes
      </div>
    </div>
  );
};

