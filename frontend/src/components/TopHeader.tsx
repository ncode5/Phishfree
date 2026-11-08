import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown,
  Menu
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { NotificationsMenu } from './NotificationsMenu';

interface TopHeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onToggleMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/scanner':
        return 'URL Scanner & Phishing Forensics';
      case '/scam-analyzer':
        return 'AI Scam & Message Analysis';
      case '/threat-intel':
        return 'Threat Intelligence & Correlation';
      case '/security':
        return 'Website Security & Posture Audit';
      case '/blockchain':
        return 'Decentralized Blockchain Registry';
      case '/history':
        return 'Investigation History';
      case '/about':
        return 'Architecture & Methodology';
      default:
        if (location.pathname.startsWith('/reports/')) return 'Investigation Report';
        return 'Overview';
    }
  };

  const isDimActive = theme === 'dim' || (theme === 'system' && resolvedTheme === 'dark');
  const isLightActive = theme === 'light' || (theme === 'system' && resolvedTheme === 'light');

  return (
    <header className="h-16 bg-white dark:bg-[#070C18] border-b border-slate-200 dark:border-[#1A2844] px-3 sm:px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200 gap-2">
      {/* Left: Mobile Hamburger & Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Mobile Hamburger Toggle (< lg) */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Open navigation sidebar"
          className="lg:hidden p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Hierarchy */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-300 min-w-0">
          <Folder className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0 hidden sm:inline" />
          <span className="text-slate-800 dark:text-slate-300 hidden sm:inline truncate">Acme security</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline" />
          <span className="font-bold text-slate-950 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md">
            {getPageTitle()}
          </span>
        </div>
      </div>

      {/* Right Controls: Adaptive on Small Displays */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Light (Blue) / Dim (Yellow) Segmented Switcher */}
        <div 
          role="radiogroup" 
          aria-label="Theme preference selector" 
          className="flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844]"
        >
          <button
            type="button"
            role="radio"
            aria-checked={isLightActive}
            aria-label="Switch to Light Theme"
            onClick={() => setTheme('light')}
            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              isLightActive
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sun className={`w-3.5 h-3.5 ${isLightActive ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isDimActive}
            aria-label="Switch to Dim Theme"
            onClick={() => setTheme('dim')}
            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              isDimActive
                ? 'bg-[#FFD000] text-slate-950 shadow-sm shadow-yellow-500/25 font-extrabold'
                : 'text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Moon className={`w-3.5 h-3.5 ${isDimActive ? 'text-slate-950 fill-slate-950' : 'text-yellow-500 dark:text-yellow-400'}`} />
            <span className="hidden sm:inline">Dim</span>
          </button>
        </div>

        {/* Dashboard Pill Button (Desktop & Tablet) */}
        <Link
          to="/"
          className="hidden sm:inline-flex px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-[#00D29E]/15 text-emerald-950 dark:text-[#00E5A3] border border-emerald-300 dark:border-[#00D29E]/30 hover:bg-emerald-100 dark:hover:bg-[#00D29E]/25 transition-colors"
        >
          Dashboard
        </Link>

        {/* Notifications Menu with real-time cybersecurity alerts */}
        <NotificationsMenu />

        {/* Top Header User Profile & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-yellow-400/40"
            aria-label="User Account Menu"
            aria-expanded={userMenuOpen}
          >
            <div 
              className="w-8 h-8 rounded-full bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
              title={user?.full_name || 'Ankur Giri'}
            >
              {getInitials(user?.full_name)}
            </div>
            <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400 hidden sm:block" />
          </button>

          {/* User Dropdown Menu - Viewport Safe Positioning */}
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-[#0D1629] border border-slate-200 dark:border-[#1A2844] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-[#1A2844]">
                <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
                  {user?.full_name || 'Ankur Giri'}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || 'analyst@phishfree.io'}
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-yellow-400/10 border border-blue-200 dark:border-yellow-400/20 text-blue-700 dark:text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{user?.role === 'admin' ? 'Administrator' : 'Security Analyst'}</span>
                </div>
              </div>

              {/* Navigation Actions */}
              <div className="py-1">
                <Link
                  to="/history"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Investigation History & Activity</span>
                </Link>
                <Link
                  to="/about"
                  onClick={() => setUserMenuOpen(false)}
                  className="w-full px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] flex items-center gap-2.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Architecture & Methodology</span>
                </Link>
              </div>

              {/* Sign Out Action */}
              <div className="border-t border-slate-100 dark:border-[#1A2844] pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Platform</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
