import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { threatActivityData7D, threatActivityData30D } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';

export const ThreatActivityChart: React.FC = () => {
  const { isDark } = useTheme();
  const [range, setRange] = useState<'7D' | '30D'>('7D');
  const data = range === '7D' ? threatActivityData7D : threatActivityData30D;

  const totalInvestigations = range === '7D' ? '1,284' : '4,892';
  const totalHighRisk = range === '7D' ? '186' : '642';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-xl text-xs">
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-[#0d5c4d] dark:text-[#38d4b5]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-[#0d5c4d] dark:bg-[#38d4b5]" />
                Investigations:
              </span>
              <span className="font-mono font-bold">{payload[0]?.value}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-red-600 dark:text-red-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-red-500" />
                High-risk:
              </span>
              <span className="font-mono font-bold">{payload[1]?.value}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between transition-colors">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Threat activity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Investigation volume and high-risk findings over time
          </p>
        </div>

        {/* 7D / 30D Switcher */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200/60 dark:border-slate-700/80 self-start sm:self-auto text-xs font-semibold">
          <button
            onClick={() => setRange('7D')}
            className={`px-2.5 py-1 rounded-[4px] transition-all ${
              range === '7D'
                ? 'bg-[#0d5c4d] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            7D
          </button>
          <button
            onClick={() => setRange('30D')}
            className={`px-2.5 py-1 rounded-[4px] transition-all ${
              range === '30D'
                ? 'bg-[#0d5c4d] text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            30D
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-slate-600 dark:text-slate-400 pt-1 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-xs bg-[#0d5c4d] dark:bg-[#38d4b5]" />
          <span>
            Investigations{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalInvestigations}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-xs bg-red-500" />
          <span>
            High-risk findings{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalHighRisk}</strong>
          </span>
        </div>
      </div>

      {/* Area & Line Chart */}
      <div className="h-48 md:h-52 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorInvestigations" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isDark ? '#38d4b5' : '#14b8a6'} stopOpacity={isDark ? 0.35 : 0.25} />
                <stop offset="95%" stopColor={isDark ? '#38d4b5' : '#14b8a6'} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1e293b' : '#f1f5f9'} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: isDark ? '#64748b' : '#94a3b8' }}
              ticks={[0, 100, 200]}
              domain={[0, 250]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="investigations"
              stroke={isDark ? '#38d4b5' : '#0d5c4d'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInvestigations)"
            />
            <Line
              type="monotone"
              dataKey="highRisk"
              stroke="#ef4444"
              strokeWidth={1.8}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
