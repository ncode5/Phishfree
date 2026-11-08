import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Folder,
  ChevronRight,
  Calendar,
  Bell,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const TopHeader: React.FC = () => {
  const location = useLocation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [currentUtc, setCurrentUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = now.getUTCDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getUTCMonth()];
      const year = now.getUTCFullYear();
      const hours = now.getUTCHours().toString().padStart(2, '0');
      const minutes = now.getUTCMinutes().toString().padStart(2, '0');
      setCurrentUtc(`${day} ${month} ${year} · ${hours}:${minutes} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

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
    <header className="h-16 bg-white dark:bg-[#0B1120] border-b border-slate-200/80 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 select-none transition-colors duration-200">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="text-slate-700 dark:text-slate-300">Acme security</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <span className="font-semibold text-slate-900 dark:text-slate-100">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Light / Dim Segmented Switcher */}
        <div 
          role="radiogroup" 
          aria-label="Theme preference selector" 
          className="flex items-center p-0.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800"
        >
          <button
            type="button"
            role="radio"
            aria-checked={isLightActive}
            aria-label="Switch to Light Theme"
            onClick={() => setTheme('light')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              isLightActive
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Light</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={isDimActive}
            aria-label="Switch to Dim / Dark Theme"
            onClick={() => setTheme('dim')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              isDimActive
                ? 'bg-slate-800 dark:bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className="w-3 h-3" />
            <span>Dim</span>
          </button>
        </div>

        {/* Dashboard Pill Button */}
        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 transition-colors"
        >
          Dashboard
        </Link>

        {/* Live UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60">
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="font-mono text-[11px]">{currentUtc || '08 Nov 2026 · 17:15 UTC'}</span>
        </div>

        {/* Notification Bell */}
        <div 
          tabIndex={0}
          role="button"
          aria-label="Notifications"
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute top-2 right-2 ring-2 ring-white dark:ring-[#0B1120]" />
        </div>
      </div>
    </header>
  );
};
