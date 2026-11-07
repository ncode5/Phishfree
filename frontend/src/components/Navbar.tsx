import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Activity, Search, History, Info, ExternalLink, MessageSquare, Network } from 'lucide-react';
import { api } from '../services/api';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'offline'>('checking');

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        await api.getHealth();
        if (mounted) setBackendStatus('healthy');
      } catch {
        if (mounted) setBackendStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: Activity },
    { to: '/scanner', label: 'URL Scanner', icon: Search },
    { to: '/scam-analyzer', label: 'Scam Analyzer', icon: MessageSquare },
    { to: '/threat-intel', label: 'Threat Intel', icon: Network },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/about', label: 'About & Arch', icon: Info },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-cyber-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center group-hover:border-blue-500/60 transition-colors">
              <Shield className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                Trust<span className="text-blue-500">Intel</span>
              </span>
              <span className="text-[10px] block text-slate-400 -mt-1 font-mono uppercase tracking-wider">
                Digital Trust Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action / System Status */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-cyber-900 border border-slate-800 rounded-full text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'healthy'
                    ? 'bg-emerald-400'
                    : backendStatus === 'offline'
                    ? 'bg-rose-500'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                {backendStatus === 'healthy'
                  ? 'Core Online'
                  : backendStatus === 'offline'
                  ? 'API Offline'
                  : 'Connecting...'}
              </span>
            </div>

            <Link
              to="/scanner"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-sm font-medium shadow-md shadow-blue-900/30 transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Scan URL</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

