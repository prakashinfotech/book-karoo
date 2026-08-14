import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/components/ui/Skeleton';

export interface Column<T> {
  key:      string;
  header:   string;
  width?:   string;
  render:   (row: T) => ReactNode;
}

interface AdminTableProps<T> {
  columns:       Column<T>[];
  data:          T[];
  isLoading:     boolean;
  emptyMessage?: string;
  onRowClick?:   (row: T) => void;
}

export function AdminTable<T>({
  columns, data, isLoading, emptyMessage = 'No data found.', onRowClick,
}: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border-default">
      <table className="w-full text-sm font-sans border-collapse">
        <thead className="bg-bg-surface2 border-b border-border-default sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className="px-4 py-3 text-left text-[11px] font-semibold text-text-muted uppercase tracking-wider whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }, (_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-bg-base' : 'bg-bg-surface'}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton height={14} width="80%" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-16 text-center text-text-muted font-sans">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-border-default/50 transition-colors',
                  onRowClick ? 'cursor-pointer hover:bg-bg-surface2' : '',
                  i % 2 === 0 ? 'bg-bg-base' : 'bg-bg-surface',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
