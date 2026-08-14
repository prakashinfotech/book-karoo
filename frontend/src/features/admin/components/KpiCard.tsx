import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { cn } from '@/shared/lib/utils';

export function formatIndianCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return formatted;
}

interface Trend {
  value:    number;
  label:    string;
  positive: boolean;
}

interface KpiCardProps {
  title:      string;
  value:      string | number;
  subtitle?:  string;
  icon:       LucideIcon;
  iconColor?: string;
  trend?:     Trend;
  isLoading?: boolean;
}

export function KpiCard({
  title, value, subtitle, icon: Icon, iconColor = '#E11D48', trend, isLoading,
}: KpiCardProps) {
  if (isLoading) {
    return (
      <div className="p-5 rounded-xl bg-bg-surface border border-border-default space-y-3">
        <Skeleton height={11} width="55%" />
        <Skeleton height={28} width="70%" />
        <Skeleton height={11} width="40%" />
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-bg-surface border border-border-default">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-text-muted tracking-widest uppercase font-sans">
          {title}
        </p>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${iconColor}22` }}
        >
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>

      <p className="font-display font-black text-[28px] text-text-primary leading-none">
        {value}
      </p>

      {subtitle && (
        <p className="text-xs text-text-muted font-sans mt-1">{subtitle}</p>
      )}

      {trend && (
        <div className={cn('flex items-center gap-1 mt-2 text-xs font-sans font-semibold',
          trend.positive ? 'text-semantic-success' : 'text-semantic-error')}>
          {trend.positive
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />}
          {trend.value}% {trend.label}
        </div>
      )}
    </div>
  );
}
