interface DataPoint {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data:          DataPoint[];
  color?:        string;
  formatValue?:  (v: number) => string;
}

export function HorizontalBarChart({
  data,
  color = '#6366F1',
  formatValue = (v) => String(v),
}: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-[13px] text-text-secondary font-sans w-24 truncate flex-shrink-0">
              {d.label}
            </span>
            <div className="flex-1 h-2 bg-bg-surface3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-[13px] text-text-muted font-sans w-20 text-right flex-shrink-0">
              {formatValue(d.value)}
            </span>
          </div>
        );
      })}
      {data.length === 0 && (
        <p className="text-text-muted text-sm font-sans text-center py-4">No data yet</p>
      )}
    </div>
  );
}
