import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Home,
  Search,
  BarChart3,
  ShieldCheck,
  Users,
  FileText,
  SlidersHorizontal,
  Settings,
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const workspaceNav = [
    { to: '/', label: 'Overview', icon: Home, badge: null },
    { to: '/scanner', label: 'Investigations', icon: Search, badge: '24' },
    { to: '/threat-intel', label: 'Threat intelligence', icon: BarChart3, badge: null },
    { to: '/security', label: 'Certificate trust', icon: ShieldCheck, badge: null },
    { to: '/scam-analyzer', label: 'Community reports', icon: Users, badge: '8' },
    { to: '/blockchain', label: 'Report registry', icon: FileText, badge: null },
  ];

  const manageNav = [
    { to: '/about', label: 'Integrations', icon: SlidersHorizontal },
    { to: '/history', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#070C18] border-r border-slate-200 dark:border-[#1A2844] flex flex-col justify-between shrink-0 min-h-screen select-none transition-colors duration-200">
      {/* Top Section */}
      <div className="p-5">
        {/* Brand: Yellow icon in Dim, Blue icon in Light */}
        <Link to="/" className="flex items-center gap-3 mb-6 group">
          <div className="w-10 h-10 rounded-xl bg-[#040915] border border-slate-300 dark:border-[#1A2844] flex items-center justify-center p-1 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:border-blue-500/60 dark:group-hover:border-yellow-400/60">
            <img
              src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
              alt="Phishfree Logo"
              className="w-full h-full object-contain filter drop-shadow-sm transition-all duration-200"
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

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-200 dark:border-[#1A2844] space-y-4">
        {/* Methodology Card */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844]">
          <p className="text-[11px] text-slate-800 dark:text-slate-300 leading-snug mb-2 font-medium">
            Evidence, not assumptions. Passive analysis. Explainable findings. A safer next step.
          </p>
          <Link
            to="/about"
            className="text-[11px] font-bold text-emerald-800 dark:text-[#00E5A3] hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>Our methodology</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="w-8 h-8 rounded-full bg-emerald-800 dark:bg-[#00D29E] text-white dark:text-slate-950 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            AG
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-950 dark:text-white truncate">Ankur Giri</div>
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">Security analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
