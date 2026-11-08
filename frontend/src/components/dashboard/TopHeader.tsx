import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bell,
  Menu,
  Moon,
  Sun,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface TopHeaderProps {
  onOpenMobileMenu?: () => void;
  currentPageTitle?: string;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
  currentPageTitle = 'Overview'
}) => {
  const { theme, setTheme } = useTheme();
  const [utcTime, setUtcTime] = useState<string>('07 Nov 2026 · 14:32 UTC');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  // Live UTC Clock formatted to match the screenshot "07 Nov 2026 · 14:32 UTC"
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getUTCDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[now.getUTCMonth()];
      const year = now.getUTCFullYear();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      setUtcTime(`${day} ${month} ${year} · ${hours}:${mins} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    {
      id: 1,
      title: 'High-risk domain detected',
      desc: 'account-verify.example flagged by 7 engines',
      time: '2m ago',
      type: 'warning'
    },
    {
      id: 2,
      title: 'New report anchored on Sepolia',
      desc: 'Tx 0x8b3e...df1c confirmed',
      time: '18m ago',
      type: 'success'
    },
    {
      id: 3,
      title: 'TLS Certificate mismatch',
      desc: 'auth1-sync.example SAN validation failed',
      time: '1h ago',
      type: 'info'
    }
  ];

  return (
    <header className="sticky top-0 z-10 bg-white/95 dark:bg-[#0b1329]/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800 px-4 md:px-8 py-2.5 transition-colors duration-150">
      <div className="flex items-center justify-between">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-2 text-xs md:text-[13px] text-slate-500 dark:text-slate-400 font-medium">
            <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <span className="hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors">
              Acme security
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-900 dark:text-white font-semibold">
              {currentPageTitle}
            </span>
          </nav>
        </div>

        {/* Right: Theme Toggle, Dashboard Button, Time, Notifications, User */}
        <div className="flex items-center gap-2.5 md:gap-3.5">
          {/* Light / Dark segmented toggle */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/80 rounded-md text-xs font-medium">
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Switch to light mode"
              className={`px-2.5 py-1 rounded-[4px] transition-all flex items-center gap-1.5 ${
                theme === 'light'
                  ? 'bg-[#0d5c4d] text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Switch to dark mode"
              className={`px-2.5 py-1 rounded-[4px] transition-all flex items-center gap-1.5 ${
                theme === 'dark'
                  ? 'bg-[#0d5c4d] text-white font-semibold shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
          </div>

          {/* Dashboard pill button */}
          <button className="hidden sm:inline-flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
            Dashboard
          </button>

          {/* Time badge */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200/60 dark:border-slate-700/60">
            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            <span>{utcTime}</span>
          </div>

          {/* Notification Icon */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0b1329]" />
            </button>

            {/* Notifications Popover */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#0b1329] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Notifications
                  </span>
                  <span className="text-[11px] text-[#0d5c4d] dark:text-[#38d4b5] cursor-pointer hover:underline">
                    Mark all read
                  </span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-1 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="py-2.5 px-1 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        {n.type === 'warning' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        )}
                        {n.type === 'success' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        )}
                        {n.type === 'info' && (
                          <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {n.desc}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {n.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Header Profile Circle */}
          <div className="w-7 h-7 rounded-full bg-[#0d5c4d] text-white flex items-center justify-center text-xs font-semibold ring-1 ring-slate-200 dark:ring-slate-700 cursor-pointer hover:ring-2 hover:ring-[#0d5c4d] transition-all">
            AG
          </div>
        </div>
      </div>
    </header>
  );
};
