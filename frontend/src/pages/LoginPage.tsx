import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const isLightActive = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');
  const isDimActive = theme === 'dim' || (theme === 'system' && resolvedTheme === 'dark');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Read redirect destination if bounced from protected route
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Authentication failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('analyst@phishfree.io');
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#070C18] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Left Column: Brand & Security Intelligence Visual (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#030712] border-r border-slate-200 dark:border-[#1A2844] flex-col justify-between p-12 overflow-hidden select-none">
        {/* Subtle Cyber Grid Background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3B82F6 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Ambient Gradient Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Lockup */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-[#040915] border border-slate-800 flex items-center justify-center p-2 shadow-xl shadow-blue-500/10 group-hover:scale-105 transition-transform duration-200">
              <img
                src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
                alt="Phishfree"
                className="w-full h-full object-contain filter drop-shadow-md"
              />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight text-white flex items-center leading-none">
                Phish<span className={isDark ? "text-[#FFD000]" : "text-blue-500"}>free</span>
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-widest mt-1 block">
                Digital Trust Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Hero Narrative & Abstract Radar Visualization */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ENTERPRISE SOC 2 TYPE II COMPLIANT</span>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Your Digital Trust <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-yellow-400 bg-clip-text text-transparent">
              Starts Here.
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            PhishFree provides explainable cybersecurity intelligence. Inspect suspicious URLs,
            detect brand typosquatting, audit cryptographic TLS chains, and register tamper-evident
            threat records on the decentralized Sepolia ledger.
          </p>

          {/* Abstract Cybersecurity Radar SVG */}
          <div className="relative w-full h-56 rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 400 200" className="w-full h-full">
              {/* Concentric rings */}
              <circle cx="200" cy="100" r="85" fill="none" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="200" cy="100" r="55" fill="none" stroke="#334155" strokeWidth="1.2" />
              <circle cx="200" cy="100" r="25" fill="none" stroke="#3B82F6" strokeWidth="1.5" opacity="0.6" />
              {/* Crosshairs */}
              <line x1="90" y1="100" x2="310" y2="100" stroke="#1E293B" strokeWidth="1" />
              <line x1="200" y1="10" x2="200" y2="190" stroke="#1E293B" strokeWidth="1" />
              {/* Sweeping Radar Ray */}
              <line x1="200" y1="100" x2="280" y2="40" stroke="url(#radarGradient)" strokeWidth="2.5" />
              {/* Nodes */}
              <circle cx="150" cy="70" r="4" fill="#00D29E" />
              <circle cx="250" cy="130" r="4.5" fill="#EF4444" />
              <circle cx="270" cy="65" r="3.5" fill="#3B82F6" />
              <circle cx="140" cy="135" r="4" fill="#F59E0B" />
              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                  <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE THREAT SWEEP
              </span>
              <span>LATENCY: 12ms</span>
            </div>
          </div>
        </div>

        {/* Security & Cryptographic Guarantee */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Zero-Knowledge Telemetry · Argon2id Protection</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">v1.0.0 SECURE</span>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Header Controls (Theme Toggle & Mobile Brand) */}
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#040915] border border-slate-300 dark:border-[#1A2844] flex items-center justify-center p-1.5">
              <img
                src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
                alt="Phishfree"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Phish<span className={isDark ? "text-[#FFD000]" : "text-blue-600"}>free</span>
            </span>
          </Link>

          {/* Theme Selector */}
          <div className="flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844] ml-auto">
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

        {/* Center Container: Login Card */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Sign In to PhishFree
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Enter your credentials to access the digital trust intelligence workspace.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-900 dark:text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-0.5">Authentication Error</p>
                <p className="text-xs">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                Work Email Address
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

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-blue-600 dark:text-yellow-400 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
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
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-[#1A2844] text-blue-600 dark:text-yellow-400 focus:ring-blue-500 dark:focus:ring-yellow-400 bg-white dark:bg-[#0D1629]"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Keep me signed in for 7 days
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-slate-950 shadow-md shadow-blue-500/20 dark:shadow-yellow-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 border-t-transparent animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[#1A2844]">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-[#0D1629] dark:hover:bg-[#1A2844] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A2844] flex items-center justify-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
              <span>Fill Demo Analyst Credentials (Ankur Giri)</span>
            </button>
          </div>

          {/* Registration Link */}
          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Don't have an analyst account yet?{' '}
            <Link
              to="/register"
              className="font-bold text-blue-600 dark:text-yellow-400 hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-600 dark:text-slate-400">
          Protected by PhishFree Cryptographic Security & Anti-Brute-Force Safeguards.
        </div>
      </div>
    </div>
  );
};

