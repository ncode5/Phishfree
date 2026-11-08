import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Trash2,
  Check,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X
} from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  category: 'critical' | 'warning' | 'success' | 'info';
  read: boolean;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'High-Risk Campaign Correlated',
    message: 'paypa1-security-update.com flagged with 94.9 risk score across DNS and multi-vector infrastructure.',
    time: '12m ago',
    category: 'critical',
    read: false,
    link: '/threat-intel?reportId=26b7366b-6726-49fa-87f0-480779bf54e9'
  },
  {
    id: 'notif-2',
    title: 'On-Chain Registry Confirmed',
    message: 'Report 0x8b2e...a91c verified and permanently anchored to Sepolia testnet.',
    time: '42m ago',
    category: 'success',
    read: false,
    link: '/blockchain'
  },
  {
    id: 'notif-3',
    title: 'TLS Trust Discrepancy Flagged',
    message: 'Certificate hostname mismatch and missing CT logs detected for account-verify.example.',
    time: '2h ago',
    category: 'warning',
    read: false,
    link: '/scanner'
  },
  {
    id: 'notif-4',
    title: 'Security Posture Audit Complete',
    message: 'Passive audit for parcel-reschedule.example identified missing Content-Security-Policy (CSP).',
    time: '5h ago',
    category: 'info',
    read: true,
    link: '/security'
  }
];

export const NotificationsMenu: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const displayedNotifications = notifications.filter((n) =>
    filter === 'unread' ? !n.read : true
  );

  const getCategoryIcon = (category: NotificationItem['category']) => {
    switch (category) {
      case 'critical':
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-600 dark:text-yellow-400" />;
    }
  };

  const getCategoryBadgeClass = (category: NotificationItem['category']) => {
    switch (category) {
      case 'critical':
        return 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
      case 'warning':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
      case 'success':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 dark:bg-yellow-400/10 dark:text-yellow-300 border-blue-200 dark:border-yellow-400/30';
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-yellow-400/40"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#00E5A3] absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-[#070C18] animate-pulse" />
        )}
      </button>

      {/* Notifications Popover - Fully Responsive and Safe on Mobile */}
      {isOpen && (
        <div className="fixed sm:absolute inset-x-3 sm:inset-auto sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 w-auto sm:w-96 max-w-sm mx-auto sm:mx-0 rounded-2xl bg-white dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-[#1A2844] flex items-center justify-between bg-slate-50/70 dark:bg-[#0A1020]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Security Alerts</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-yellow-400/20 dark:text-yellow-300 border border-blue-200 dark:border-yellow-400/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-blue-600 dark:text-yellow-400 hover:underline px-1.5 py-1"
                  title="Mark all notifications as read"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2 border-b border-slate-200 dark:border-[#1A2844] flex items-center gap-2 bg-white dark:bg-[#0D1629]">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${
                filter === 'unread'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-950 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#1A2844]">
            {displayedNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">All clear</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  No active threat notifications or unread alerts.
                </p>
              </div>
            ) : (
              displayedNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    !n.read
                      ? 'bg-blue-50/40 dark:bg-yellow-400/[0.04] hover:bg-blue-50/70 dark:hover:bg-yellow-400/[0.08]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`p-2 rounded-xl border shrink-0 mt-0.5 ${getCategoryBadgeClass(
                      n.category
                    )}`}
                  >
                    {getCategoryIcon(n.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-slate-950 dark:text-white truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 font-medium font-mono">
                        {n.time}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 leading-snug line-clamp-2">
                      {n.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between">
                      {n.link && (
                        <span className="text-[11px] font-bold text-blue-600 dark:text-yellow-400 flex items-center gap-1 hover:underline">
                          <span>Inspect details</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => deleteNotification(n.id, e)}
                        className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded transition ml-auto"
                        title="Dismiss notification"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-[#1A2844] bg-slate-50/50 dark:bg-[#0A1020] text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/history');
              }}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center gap-1.5 transition"
            >
              <span>View full investigation audit logs</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

