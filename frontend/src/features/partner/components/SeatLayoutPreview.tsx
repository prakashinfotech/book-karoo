import { LayoutGrid } from 'lucide-react';

const LEGACY_COLORS: Record<string, string> = {
  recliner: '#6366F1', executive: '#E11D74', normal: '#71717A',
};

interface Props { layout: string | null; totalSeats: number }

export function SeatLayoutPreview({ layout, totalSeats }: Props) {
  if (!layout) {
    return (
      <div className="rounded-lg bg-bg-surface2 border border-border-default/50 p-4 flex flex-col items-center justify-center gap-2 h-28">
        <LayoutGrid size={20} className="text-text-muted" />
        <p className="text-xs text-text-muted">No layout defined</p>
        <p className="text-xs text-text-muted">{totalSeats} seats total</p>
      </div>
    );
  }

  type Row = { label: string; seats: number; color: string };
  let rows: Row[] = [];

  try {
    const obj = JSON.parse(layout) as Record<string, unknown>;
    if (Array.isArray(obj.categories)) {
      const cols = (obj.cols as number) ?? 10;
      (obj.categories as Array<{ name: string; rows: string[]; color: string }>)
        .forEach((cat) => cat.rows.forEach((r) => rows.push({ label: r, seats: cols, color: cat.color })));
    } else if (Array.isArray(obj.rows)) {
      (obj.rows as Array<{ row: string; seats: number; category: string }>)
        .forEach((r) => rows.push({ label: r.row, seats: r.seats, color: LEGACY_COLORS[r.category] ?? '#71717A' }));
    }
  } catch { /* leave empty */ }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg bg-bg-surface2 border border-border-default/50 p-4 text-xs text-text-muted text-center h-28 flex items-center justify-center">
        {totalSeats} seats
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-bg-surface2 border border-border-default/50 p-3 space-y-1 max-h-40 overflow-y-auto">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-text-muted w-4 flex-shrink-0">{r.label}</span>
          <div className="flex gap-0.5 flex-wrap">
            {Array.from({ length: Math.min(r.seats, 30) }, (_, i) => (
              <span key={i} className="w-2.5 h-2.5 rounded-sm opacity-70" style={{ background: r.color }} />
            ))}
            {r.seats > 30 && <span className="text-[9px] text-text-muted ml-1">+{r.seats - 30}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
