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
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    SUSPICIOUS: {
      label: 'Suspicious',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    },
    HIGH_RISK: {
      label: 'High Risk',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      border: 'border-orange-500/30',
      icon: <AlertOctagon className="w-4 h-4 text-orange-400" />,
    },
    CONFIRMED_MALICIOUS: {
      label: 'Confirmed Malicious',
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/40',
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    },
    INCONCLUSIVE: {
      label: 'Inconclusive',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
    },
  };

  const config = configs[level] || configs.INCONCLUSIVE;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel }> = ({ severity }) => {
  const styles: Record<SeverityLevel, { bg: string; text: string; border: string }> = {
    INFO: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    LOW: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    MEDIUM: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
    CRITICAL: { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/50' },
  };

  const current = styles[severity] || styles.INFO;

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${current.bg} ${current.text} ${current.border}`}
    >
      {severity}
    </span>
  );
};

