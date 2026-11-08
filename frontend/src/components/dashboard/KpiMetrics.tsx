import React from 'react';
import {
  Globe,
  ShieldAlert,
  Search,
  Users,
  ArrowUpRight
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { kpiSparklines } from '../../data/mockData';

interface KpiMetricsProps {
  stats?: {
    scanned: number;
    highRisk: number;
    active: number;
    validated: number;
  };
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  stats = {
    scanned: 1284,
    highRisk: 186,
    active: 24,
    validated: 94
  }
}) => {
  const cards = [
    {
      id: 'scanned',
      label: 'Websites Analysed',
      value: stats.scanned.toLocaleString(),
      subtext: '+12.8% vs prior week',
      subtextColor: 'text-emerald-600 dark:text-emerald-400',
      icon: Globe,
      iconBg: 'bg-[#e8f5f1] dark:bg-[#0d5c4d]/25 text-[#0d5c4d] dark:text-[#38d4b5]',
      chartColor: '#108e70',
      data: kpiSparklines.scanned
    },
    {
      id: 'high-risk',
      label: 'High-Risk Websites',
      value: stats.highRisk.toLocaleString(),
      subtext: '14.5% of investigations',
      subtextColor: 'text-red-600 dark:text-red-400',
      icon: ShieldAlert,
      iconBg: 'bg-red-50 dark:bg-red-950/40 text-red-500 dark:text-red-400',
      chartColor: '#ef4444',
      data: kpiSparklines.highRisk
    },
    {
      id: 'active',
      label: 'Active Investigations',
      value: stats.active.toLocaleString(),
      subtext: '24 live',
      subtextColor: 'text-blue-600 dark:text-blue-400',
      icon: Search,
      iconBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400',
      chartColor: '#3b82f6',
      data: kpiSparklines.active
    },
    {
      id: 'validated',
      label: 'Validated Threat Reports',
      value: stats.validated.toLocaleString(),
      subtext: '8 pending validation',
      subtextColor: 'text-emerald-700 dark:text-emerald-400',
      icon: Users,
      iconBg: 'bg-[#e8f5f1] dark:bg-emerald-950/40 text-[#0d5c4d] dark:text-emerald-400',
      chartColor: '#10b981',
      data: kpiSparklines.validated
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          {/* Top Row: Label and Icon */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {card.label}
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.iconBg}`}>
              <card.icon className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Metric Value */}
          <div className="mt-2.5">
            <div className="text-2xl md:text-[28px] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
              {card.value}
            </div>
            <div className={`mt-1.5 text-[11px] font-medium flex items-center gap-0.5 ${card.subtextColor}`}>
              {card.id === 'scanned' && <ArrowUpRight className="w-3 h-3" />}
              <span>{card.subtext}</span>
            </div>
          </div>

          {/* Sparkline Curve at bottom */}
          <div className="h-9 w-full mt-2 -mb-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={card.data}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={card.chartColor}
                  strokeWidth={1.8}
                  dot={false}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
};
