import React from 'react';
import { RiskLevel } from '../types';

interface ScoreGaugeProps {
  score: number;
  level: RiskLevel;
  confidence: number;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, level, confidence }) => {
  // Determine color based on level
  const getColor = () => {
    switch (level) {
      case 'CONFIRMED_MALICIOUS':
        return '#ef4444'; // rose-500
      case 'HIGH_RISK':
        return '#f97316'; // orange-500
      case 'SUSPICIOUS':
        return '#f59e0b'; // amber-500
      case 'LOW_RISK':
        return '#10b981'; // emerald-500
      case 'INCONCLUSIVE':
      default:
        return '#64748b'; // slate-500
    }
  };

  const color = getColor();
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            className="stroke-slate-200 dark:stroke-[#1A2844] transition-colors"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Score */}
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-bold font-mono text-slate-950 dark:text-white tracking-tight">
            {score.toFixed(0)}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-slate-400 tracking-wider">
            / 100 Risk
          </span>
        </div>
      </div>

      {/* Confidence Pill */}
      <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-slate-200/90 dark:bg-[#0D1629] border border-slate-300 dark:border-[#1A2844] rounded-full text-xs text-slate-800 dark:text-slate-300 font-medium">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        <span>Confidence:</span>
        <span className="font-bold text-slate-950 dark:text-white">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
};
