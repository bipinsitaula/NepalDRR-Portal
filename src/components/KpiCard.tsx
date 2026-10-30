'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Kept for compatibility with existing callers; ignored by the neutral design. */
  color?: string;
  bgGradient?: string;
  trend?: {
    value: string;
    isUp: boolean;
    label: string;
  };
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, trend }) => {
  return (
    <div className="panel px-4 py-3.5">
      <p className="text-[13px] text-muted">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-text tabular leading-tight">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      {(subtitle || trend) && (
        <p className="mt-1 text-xs text-muted">
          {trend && (
            <span className={trend.isUp ? 'text-crimson' : 'text-emerald-700'}>
              {trend.isUp ? '↑' : '↓'} {trend.value} {trend.label}{' '}
            </span>
          )}
          {subtitle}
        </p>
      )}
    </div>
  );
};
