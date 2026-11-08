import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  ShieldAlert,
  Lock,
  Users,
  Database,
  Sliders,
  Settings,
  Shield,
  ChevronDown,
  ExternalLink,
  X
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenMethodology?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mobileOpen = false,
  onCloseMobile,
  onOpenMethodology
}) => {
  const workspacesNav = [
    { name: 'Overview', to: '/', icon: LayoutDashboard, badge: null },
    { name: 'Investigations', to: '/investigations', icon: Search, badge: '14' },
    { name: 'Threat intelligence', to: '/threat-intelligence', icon: ShieldAlert, badge: null },
    { name: 'Certificate trust', to: '/certificate-trust', icon: Lock, badge: null },
    { name: 'Community reports', to: '/community-reports', icon: Users, badge: '8' },
    { name: 'Report registry', to: '/report-registry', icon: Database, badge: null },
  ];

  const manageNav = [
    { name: 'Integrations', to: '/integrations', icon: Sliders },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b1329] border-r border-slate-200/80 dark:border-slate-800 w-64 select-none transition-colors duration-150">
      {/* Brand Header */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <NavLink to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#0d5c4d] flex items-center justify-center text-white shadow-xs group-hover:bg-[#0a4b3e] transition-colors">
            <Shield className="w-4 h-4 fill-white/20 stroke-white stroke-[2.2]" />
          </div>
          <span className="text-[19px] font-bold tracking-tight text-slate-900 dark:text-white font-sans transition-colors">
            Phishfree
          </span>
        </NavLink>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Workspace Switcher */}
      <div className="p-3">
        <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 rounded-lg transition-colors cursor-pointer flex items-center justify-between group">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
              <span>Acme security</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Team: Acme-SecOps
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* WORKSPACES */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Workspaces
          </div>
          <nav className="space-y-0.5">
            {workspacesNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5] font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5 truncate">
                      <item.icon
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive
                            ? 'text-[#0d5c4d] dark:text-[#38d4b5]'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                          isActive
                            ? 'bg-[#0d5c4d]/15 dark:bg-[#0d5c4d]/40 text-[#0d5c4d] dark:text-[#38d4b5]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* MANAGE */}
        <div>
          <div className="px-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Manage
          </div>
          <nav className="space-y-0.5">
            {manageNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive
                      ? 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5] font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? 'text-[#0d5c4d] dark:text-[#38d4b5]'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Methodology Box */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 rounded-xl space-y-1.5 text-left">
          <div className="text-[12px] font-semibold text-slate-800 dark:text-slate-200">
            Evidence, not assumptions
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Passive analysis. Explainable findings. A safer web view.
          </p>
          <button
            onClick={onOpenMethodology}
            className="text-[11px] font-medium text-[#0d5c4d] dark:text-[#38d4b5] hover:text-[#094136] dark:hover:text-[#5fe5cb] inline-flex items-center gap-1 transition-colors pt-0.5"
          >
            <span>Our methodology</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0b1329] flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-[#0d5c4d] text-white flex items-center justify-center text-xs font-semibold shadow-2xs">
              AG
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0b1329]" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-slate-900 dark:text-white truncate">
              Ankur Giri
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
              Security Analyst
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:block flex-shrink-0 sticky top-0 h-screen z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-[#0b1329] z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
