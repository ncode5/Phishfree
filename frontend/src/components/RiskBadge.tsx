import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, ShieldAlert, HelpCircle } from 'lucide-react';
import { RiskLevel, SeverityLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', showIcon = true }) => {
  const configs: Record<
    RiskLevel,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    LOW_RISK: {
      label: 'Low Risk',
      bg: 'bg-emerald-50 dark:bg-[#064E3B]/70',
      text: 'text-emerald-950 dark:text-[#34D399]',
      border: 'border-emerald-300 dark:border-emerald-500/70',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-800 dark:text-[#34D399]" />,
    },
    SUSPICIOUS: {
      label: 'Suspicious',
      bg: 'bg-amber-50 dark:bg-[#451A03]/70',
      text: 'text-amber-950 dark:text-[#FBBF24]',
      border: 'border-amber-300 dark:border-amber-500/70',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-800 dark:text-[#FBBF24]" />,
    },
    HIGH_RISK: {
      label: 'High Risk',
      bg: 'bg-orange-50 dark:bg-[#431407]/70',
      text: 'text-orange-950 dark:text-[#FB923C]',
      border: 'border-orange-300 dark:border-orange-500/70',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-orange-800 dark:text-[#FB923C]" />,
    },
    CONFIRMED_MALICIOUS: {
      label: 'Confirmed Malicious',
      bg: 'bg-rose-50 dark:bg-[#450A0A]/80',
      text: 'text-rose-950 dark:text-[#F87171]',
      border: 'border-rose-300 dark:border-red-500/80',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-800 dark:text-[#F87171]" />,
    },
    INCONCLUSIVE: {
      label: 'Inconclusive',
      bg: 'bg-slate-100 dark:bg-[#131F37]',
      text: 'text-slate-900 dark:text-[#94A3B8]',
      border: 'border-slate-300 dark:border-slate-700',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-700 dark:text-slate-400" />,
    },
  };

  const config = configs[level] || configs.INCONCLUSIVE;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel | string }> = ({ severity }) => {
  const sevKey = ((severity || 'INFO').toUpperCase()) as SeverityLevel;

  const styles: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
    INFO: {
      bg: 'bg-blue-50 dark:bg-blue-950/70',
      text: 'text-blue-950 dark:text-blue-300',
      border: 'border-blue-300 dark:border-blue-500/70',
    },
    LOW: {
      bg: 'bg-emerald-50 dark:bg-[#064E3B]/70',
      text: 'text-emerald-950 dark:text-[#34D399]',
      border: 'border-emerald-300 dark:border-emerald-500/70',
    },
    MEDIUM: {
      bg: 'bg-amber-50 dark:bg-[#451A03]/70',
      text: 'text-amber-950 dark:text-[#FBBF24]',
      border: 'border-amber-300 dark:border-amber-500/70',
    },
    HIGH: {
      bg: 'bg-orange-50 dark:bg-[#431407]/70',
      text: 'text-orange-950 dark:text-[#FB923C]',
      border: 'border-orange-300 dark:border-orange-500/70',
    },
    CRITICAL: {
      bg: 'bg-rose-50 dark:bg-[#450A0A]/80',
      text: 'text-rose-950 dark:text-[#F87171]',
      border: 'border-rose-300 dark:border-red-500/80',
    },
  };

  const current = styles[sevKey] || styles.INFO;

  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider transition-colors ${current.bg} ${current.text} ${current.border}`}
    >
      {severity}
    </span>
  );
};
