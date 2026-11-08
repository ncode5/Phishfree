import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Folder,
  ChevronRight,
  Calendar,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

interface TopHeaderProps {
  themeMode?: 'light' | 'dim';
  onToggleTheme?: (mode: 'light' | 'dim') => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  themeMode = 'light',
  onToggleTheme
}) => {
  const location = useLocation();
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

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 select-none">
      {/* Left Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <Folder className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-700">Acme security</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900">{getPageTitle()}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3.5">
        {/* Light / Dim Switcher */}
        <div className="flex items-center p-0.5 rounded-full bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => onToggleTheme && onToggleTheme('light')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              themeMode === 'light'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => onToggleTheme && onToggleTheme('dim')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              themeMode === 'dim'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dim
          </button>
        </div>

        {/* Dashboard Pill Button */}
        <Link
          to="/"
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 hover:bg-emerald-100/70 transition-colors"
        >
          Dashboard
        </Link>

        {/* Live UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 font-medium px-2.5 py-1.5 rounded-lg border border-slate-200/70 bg-slate-50/50">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[11px]">{currentUtc || '08 Nov 2026 · 17:15 UTC'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 absolute top-2 right-2 ring-2 ring-white" />
        </div>
      </div>
    </header>
  );
};
