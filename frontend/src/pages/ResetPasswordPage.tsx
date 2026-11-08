import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  KeyRound
} from 'lucide-react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const isLightActive = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');
  const isDimActive = theme === 'dim' || (theme === 'system' && resolvedTheme === 'dark');

  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  // Compute password strength metrics
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/\d/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    return score;
  };

  const strengthScore = calculateStrength(newPassword);
  const getStrengthMeta = () => {
    if (!newPassword) return { label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700', width: '0%' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (strengthScore === 3) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (strengthScore === 4) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong (Enterprise Ready)', color: 'bg-emerald-500', width: '100%' };
  };

  const strengthMeta = getStrengthMeta();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage('Missing password reset token. Please request a new recovery link.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(token.trim(), newPassword);
      setSuccess(true);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Unable to update password. Your token may have expired.';
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
            Set New Password
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
            Create a strong, unique password for your PhishFree security analyst account.
          </p>

          {/* Success State */}
          {success ? (
            <div className="mt-6 space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3 text-emerald-950 dark:text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase tracking-wider mb-1">Password Successfully Updated</p>
                  <p className="text-xs leading-relaxed">
                    Your password has been securely updated using Argon2id. You can now log into your security operations workspace.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-slate-950 shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-rose-900 dark:text-rose-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Recovery Token Field (Auto-populated if present) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Recovery Token
                </label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste single-use token"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Security strength:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{strengthMeta.label}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthMeta.color}`}
                        style={{ width: strengthMeta.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-slate-950 shadow-md shadow-blue-500/20 dark:shadow-yellow-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 border-t-transparent animate-spin" />
                    <span>Updating credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Commit New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-slate-500 mt-8">
        PhishFree Cryptographic Recovery System · Tokens Single-Use Only
      </div>
    </div>
  );
};

