import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { threatDistributionData } from '../../data/mockData';

export const ThreatDistributionChart: React.FC = () => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-lg p-2 shadow-xl text-xs">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{data.name}:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{data.value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#0b1329] border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 md:p-5 shadow-card dark:shadow-none flex flex-col justify-between transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
            Threat Distribution
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Percentage breakdown of scanned websites and URLs
          </p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/80">
          Example data
        </span>
      </div>

      {/* Donut Chart & Legend Row */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
        {/* Donut Chart with Center Text */}
        <div className="relative h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={threatDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={84}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {threatDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Total scans</span>
            <span className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              10,000
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-3 sm:pl-4">
          {threatDistributionData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
