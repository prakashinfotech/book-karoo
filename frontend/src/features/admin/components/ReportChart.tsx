import { useState } from 'react';

interface ChartDataPoint {
  label:          string;
  value:          number;
  secondaryValue?: number;
}

interface ReportChartProps {
  data:            ChartDataPoint[];
  primaryColor?:   string;
  secondaryColor?: string;
  primaryLabel?:   string;
  secondaryLabel?: string;
  height?:         number;
  formatValue?:    (v: number) => string;
  showLegend?:     boolean;
}

export function ReportChart({
  data,
  primaryColor   = '#E11D74',
  secondaryColor = '#4F46E5',
  primaryLabel   = 'Revenue',
  secondaryLabel = 'Bookings',
  height         = 200,
  formatValue    = (v) => v.toLocaleString(),
  showLegend     = true,
}: ReportChartProps) {
  const [tooltip, setTooltip] = useState<{ label: string; primary: number; secondary?: number; x: number; y: number } | null>(null);

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-text-muted text-sm font-sans"
        style={{ height }}
      >
        No data for selected period
      </div>
    );
  }

  const maxPrimary   = Math.max(...data.map((d) => d.value), 1);
  const maxSecondary = Math.max(...data.map((d) => d.secondaryValue ?? 0), 1);

  return (
    <div className="w-full">
      {showLegend && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: primaryColor }} />
            <span className="text-xs text-text-muted font-sans">{primaryLabel}</span>
          </div>
          {data.some((d) => d.secondaryValue !== undefined) && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: secondaryColor }} />
              <span className="text-xs text-text-muted font-sans">{secondaryLabel}</span>
            </div>
          )}
        </div>
      )}

      <div className="relative" style={{ height }}>
        {tooltip && (
          <div
            className="absolute z-10 px-2 py-1.5 rounded-lg bg-bg-surface border border-border-default text-xs font-sans shadow-lg pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%) translateY(-110%)' }}
          >
            <div className="font-semibold text-text-primary mb-0.5">{tooltip.label}</div>
            <div style={{ color: primaryColor }}>{primaryLabel}: {formatValue(tooltip.primary)}</div>
            {tooltip.secondary !== undefined && (
              <div style={{ color: secondaryColor }}>{secondaryLabel}: {tooltip.secondary.toLocaleString()}</div>
            )}
          </div>
        )}

        <div className="flex items-end gap-1 h-full">
          {data.map((d, i) => {
            const primaryH   = Math.max((d.value / maxPrimary) * (height - 24), 2);
            const secondaryH = d.secondaryValue !== undefined
              ? Math.max((d.secondaryValue / maxSecondary) * (height - 24), 2)
              : 0;
            const hasSecondary = d.secondaryValue !== undefined;

            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-0.5 cursor-pointer group"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parent = e.currentTarget.closest('.relative')!.getBoundingClientRect();
                  setTooltip({
                    label:     d.label,
                    primary:   d.value,
                    secondary: d.secondaryValue,
                    x: rect.left - parent.left + rect.width / 2,
                    y: rect.top  - parent.top,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <div className="flex items-end gap-px w-full" style={{ height: height - 24 }}>
                  <div
                    className="flex-1 rounded-t transition-opacity group-hover:opacity-100 opacity-80"
                    style={{ height: primaryH, backgroundColor: primaryColor }}
                  />
                  {hasSecondary && (
                    <div
                      className="flex-1 rounded-t transition-opacity group-hover:opacity-100 opacity-60"
                      style={{ height: secondaryH, backgroundColor: secondaryColor }}
                    />
                  )}
                </div>
                <span className="text-[9px] text-text-muted font-sans truncate w-full text-center leading-tight">
                  {d.label.length > 6 ? d.label.slice(0, 6) + '…' : d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
