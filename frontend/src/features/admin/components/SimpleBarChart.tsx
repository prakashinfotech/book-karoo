import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface DataPoint {
  label: string;
  value: number;
}

interface SimpleBarChartProps {
  data:         DataPoint[];
  color?:       string;
  height?:      number;
  showValues?:  boolean;
}

export function SimpleBarChart({
  data,
  color = '#E11D48',
  height = 160,
  showValues = false,
}: SimpleBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
        const isHovered = hoveredIdx === i;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 h-full"
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <div className="flex-1 flex items-end w-full relative">
              {isHovered && d.value > 0 && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-10
                  px-2 py-0.5 rounded text-[10px] font-semibold font-sans
                  bg-bg-base border border-border-default text-text-primary whitespace-nowrap">
                  {d.value}
                </div>
              )}
              <div
                className={cn(
                  'w-full rounded-t-sm transition-all duration-300',
                  isHovered ? 'opacity-100' : 'opacity-75',
                )}
                style={{
                  height: `${pct}%`,
                  minHeight: d.value > 0 ? 4 : 0,
                  backgroundColor: color,
                }}
              />
            </div>
            {showValues && (
              <span className="text-[10px] text-text-muted font-sans">{d.value}</span>
            )}
            <span className="text-[10px] text-text-muted font-sans">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
