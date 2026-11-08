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

export const Sidebar: React.FC = () => {
  const location = useLocation();

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
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen select-none">
      {/* Top Section */}
      <div className="p-5">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 mb-6 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-sm">
            <Shield className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
            Phishfree
          </span>
        </Link>

        {/* Workspace Selector Pill */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/90 bg-slate-50/70 mb-6 hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
            <Home className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-900 truncate">Acme security</div>
            <div className="text-[11px] text-slate-500 truncate">Team workspace</div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* WORKSPACE Nav Group */}
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
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
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-800' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-600'
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
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-slate-100 space-y-4">
        {/* Methodology Card */}
        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
          <p className="text-[11px] text-slate-600 leading-snug mb-2 font-normal">
            Evidence, not assumptions. Passive analysis. Explainable findings. A safer next step.
          </p>
          <Link
            to="/about"
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            <span>Our methodology</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            AG
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">Ankur Giri</div>
            <div className="text-[11px] text-slate-500 truncate">Security analyst</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
