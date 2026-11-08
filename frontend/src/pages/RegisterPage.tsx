import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
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
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';
  const isLightActive = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');
  const isDimActive = theme === 'dim' || (theme === 'system' && resolvedTheme === 'dark');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const strengthScore = calculateStrength(password);
  const getStrengthMeta = () => {
    if (!password) return { label: 'Empty', color: 'bg-slate-300 dark:bg-slate-700', width: '0%' };
    if (strengthScore <= 2) return { label: 'Weak', color: 'bg-rose-500', width: '25%' };
    if (strengthScore === 3) return { label: 'Fair', color: 'bg-amber-500', width: '50%' };
    if (strengthScore === 4) return { label: 'Good', color: 'bg-blue-500', width: '75%' };
    return { label: 'Strong (Enterprise Ready)', color: 'bg-emerald-500', width: '100%' };
  };

  const strengthMeta = getStrengthMeta();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must accept the terms of service and security policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Registration failed. Please verify your details.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#070C18] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Left Column: Brand & Security Intelligence Visual */}
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

        {/* Hero Narrative */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>JOIN 10,000+ SECURITY ANALYSTS</span>
          </div>

          <h1 className="text-4xl font-black text-white tracking-tight leading-tight mb-4">
            Defend Against <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-yellow-400 bg-clip-text text-transparent">
              Zero-Day Threat Vectors.
            </span>
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Create an enterprise security analyst profile to track threat clusters, correlate
            multi-hop redirect indicators, and automate verified on-chain threat reporting.
          </p>

          {/* Feature Pillars */}
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>Multi-Engine VirusTotal & Safe Browsing Corroboration</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-yellow-400/20 text-yellow-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>X.509 Cryptographic TLS Chain & Certificate Transparency Audits</span>
            </div>
            <div className="flex items-center gap-3 text-slate-300">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <span>Sepolia Ethereum Immutable Threat Registry & Hash Verification</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Argon2id Salted Hashing · End-to-End TLS Security</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">SECURE REGISTRATION</span>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto">
        {/* Header Controls */}
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

        {/* Center Container: Registration Card */}
        <div className="my-auto max-w-md w-full mx-auto py-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Create Analyst Account
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Set up your PhishFree security workspace and credentials.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-900 dark:text-rose-200 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-0.5">Registration Issue</p>
                <p className="text-xs">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ankur Giri"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-white dark:bg-[#0D1629] text-slate-950 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              {/* Password Strength Meter */}
              {password && (
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
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

            {/* Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 dark:border-[#1A2844] text-blue-600 dark:text-yellow-400 focus:ring-blue-500 dark:focus:ring-yellow-400 bg-white dark:bg-[#0D1629]"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-normal">
                  I accept the PhishFree Cybersecurity Terms of Service, Acceptable Telemetry Use Policy, and Cryptographic Evidence Disclosure.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 dark:bg-yellow-400 dark:hover:bg-yellow-300 text-white dark:text-slate-950 shadow-md shadow-blue-500/20 dark:shadow-yellow-400/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white dark:border-slate-950 border-t-transparent animate-spin" />
                  <span>Provisioning account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Access Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
            Already have an active analyst account?{' '}
            <Link
              to="/login"
              className="font-bold text-blue-600 dark:text-yellow-400 hover:underline"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-600 dark:text-slate-400">
          Argon2id password hashing compliant with OWASP and NIST SP 800-63B standards.
        </div>
      </div>
    </div>
  );
};

