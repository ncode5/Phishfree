import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Home,
  Search,
  BarChart3,
  ShieldCheck,
  Users,
  FileText,
  Settings,
  ChevronRight,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isDark = resolvedTheme === 'dark';

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const workspaceNav = [
    { to: '/', label: 'Overview', icon: Home, badge: null },
    { to: '/scanner', label: 'Investigations', icon: Search, badge: '24' },
    { to: '/threat-intel', label: 'Threat intelligence', icon: BarChart3, badge: null },
    { to: '/security', label: 'Certificate trust', icon: ShieldCheck, badge: null },
    { to: '/scam-analyzer', label: 'Community reports', icon: Users, badge: '8' },
    { to: '/blockchain', label: 'Report registry', icon: FileText, badge: null },
  ];

  const manageNav = [
    { to: '/history', label: 'Settings', icon: Settings },
  ];

  const renderNavContent = (isMobileDrawer: boolean = false) => (
    <>
      {/* Top Section */}
      <div className="p-5">
        {/* Brand Lockup + Mobile Close Button */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            onClick={() => {
              if (isMobileDrawer && onMobileClose) onMobileClose();
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#040915] border border-slate-300 dark:border-[#1A2844] flex items-center justify-center p-1 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-blue-500/60 dark:group-hover:border-yellow-400/60">
              <img
                src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
                alt="Phishfree Logo"
                className="w-full h-full object-contain filter drop-shadow-sm transition-all duration-200 -translate-y-0.5"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-slate-950 dark:text-white flex items-center leading-none">
                Phish<span className={isDark ? "text-[#FFD000]" : "text-blue-600"}>free</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-1">
                Trust Intel
              </span>
            </div>
          </Link>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close navigation menu"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Workspace Selector Pill */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-300 dark:border-[#1A2844] bg-slate-100/90 dark:bg-[#0D1629] mb-6 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-[#00D29E]/20 text-emerald-800 dark:text-[#00E5A3] flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-emerald-800 dark:text-[#00E5A3]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-950 dark:text-white truncate">Acme security</div>
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">Team workspace</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        </div>

        {/* WORKSPACE Nav Group */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider px-3 mb-2">
            WORKSPACE
          </div>
          <nav className="space-y-1">
            {workspaceNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    if (isMobileDrawer && onMobileClose) onMobileClose();
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-950 dark:bg-[#00D29E]/15 dark:text-[#00E5A3] font-bold border border-emerald-300/80 dark:border-[#00D29E]/30 shadow-sm'
                      : 'text-slate-800 dark:text-slate-300 font-semibold hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-800 dark:text-[#00E5A3]' : 'text-slate-600 dark:text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive 
                          ? 'bg-emerald-200 dark:bg-[#00D29E]/30 text-emerald-950 dark:text-[#00E5A3]' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* MANAGE Nav Group */}
        <div>
          <div className="text-[10px] font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider px-3 mb-2">
            MANAGE
          </div>
          <nav className="space-y-1">
            {manageNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => {
                    if (isMobileDrawer && onMobileClose) onMobileClose();
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-950 dark:bg-[#00D29E]/15 dark:text-[#00E5A3] font-bold border border-emerald-300/80 dark:border-[#00D29E]/30'
                      : 'text-slate-800 dark:text-slate-300 font-semibold hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: User Info */}
      <div className="p-4 border-t border-slate-200 dark:border-[#1A2844] mt-auto">
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-yellow-400 text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {getInitials(user?.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-950 dark:text-white truncate">
              {user?.full_name || 'Ankur Giri'}
            </div>
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
              {user?.role === 'admin' ? 'Platform Admin' : 'Security Analyst'}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Sidebar (lg and above: >= 1024px) */}
      <aside className="hidden lg:flex w-64 bg-white dark:bg-[#070C18] border-r border-slate-200 dark:border-[#1A2844] flex-col justify-between shrink-0 min-h-screen select-none transition-colors duration-200 sticky top-0 h-screen overflow-y-auto">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile & Tablet Drawer Modal (< lg: < 1024px) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={onMobileClose}
            aria-hidden="true"
          />

          {/* Off-Canvas Slide Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#070C18] border-r border-slate-200 dark:border-[#1A2844] flex flex-col justify-between z-50 select-none shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
};
