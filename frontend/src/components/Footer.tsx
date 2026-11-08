import React from 'react';
import { Shield, Lock, Cpu, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-slate-900 dark:text-white text-base">PhishFree Platform</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md leading-relaxed">
              AI-Powered Web Threat Detection & Digital Trust Intelligence. Investigates suspicious URLs,
              identifies brand typosquatting, performs DNS and safe redirect inspections, and aggregates
              explainable security evidence.
            </p>
            <div className="flex items-center gap-4 pt-2 text-xs text-slate-500 font-mono">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> Artificial Intelligence
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Cybersecurity
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Web3 Architecture
              </span>
            </div>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              System Modules
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Module 1: URL & Site Analysis
              </li>
              <li className="text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                Module 2: TLS Web Trust
              </li>
              <li className="text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                Module 3: AI Scam Detection
              </li>
              <li className="text-slate-500 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                Module 6: Web3 On-Chain Intel
              </li>
            </ul>
          </div>

          {/* Security Disclaimer */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Cybersecurity Notice
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated threat scoring provides evidence-based risk assessment. A clean result does not
              guarantee zero risk. Never submit private credentials, passwords, or seed phrases.
            </p>
            <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Enterprise Grade · Production Architecture
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© 2026 PhishFree · AI-Powered Web Threat Detection & Digital Trust Intelligence.</p>
          <p className="mt-2 sm:mt-0 font-mono">Passive checks only · Sensitive content stays off chain</p>
        </div>
      </div>
    </footer>
  );
};

