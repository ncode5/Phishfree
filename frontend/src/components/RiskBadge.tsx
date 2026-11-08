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
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />,
    },
    SUSPICIOUS: {
      label: 'Suspicious',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />,
    },
    HIGH_RISK: {
      label: 'High Risk',
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
      icon: <AlertOctagon className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" />,
    },
    CONFIRMED_MALICIOUS: {
      label: 'Confirmed Malicious',
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />,
    },
    INCONCLUSIVE: {
      label: 'Inconclusive',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />,
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
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      text: 'text-blue-800 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    LOW: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
    MEDIUM: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
    },
    HIGH: {
      bg: 'bg-orange-50 dark:bg-orange-950/50',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-800',
    },
    CRITICAL: {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
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
