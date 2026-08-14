import { useState } from 'react';
import { X } from 'lucide-react';
import { Modal } from '@/shared/components/ui/Modal';
import { useCreatePartnerScreen, useUpdatePartnerScreen } from '../api/usePartner';
import type { PartnerScreenInfo } from '../types';

// ── Category configuration ────────────────────────────────────────────────────

interface CategoryConfig {
  name: 'Normal' | 'Executive' | 'Recliner';
  rowCount: number;
  price: number;
  enabled: boolean;
}

const CATEGORY_META: Record<string, { color: string; defaultPrice: number }> = {
  Normal:    { color: '#71717A', defaultPrice: 150 },
  Executive: { color: '#E11D74', defaultPrice: 250 },
  Recliner:  { color: '#6366F1', defaultPrice: 400 },
};

function defaultCategories(): CategoryConfig[] {
  return [
    { name: 'Recliner',  rowCount: 2, price: 400, enabled: false },
    { name: 'Executive', rowCount: 3, price: 250, enabled: true  },
    { name: 'Normal',    rowCount: 6, price: 150, enabled: true  },
  ];
}

function buildBookingLayout(cols: number, categories: CategoryConfig[]) {
  const enabled = categories.filter((c) => c.enabled && c.rowCount > 0);

  let rowIdx = 0;
  const catEntries = enabled.map((c) => {
    const rows: string[] = [];
    for (let i = 0; i < c.rowCount; i++) {
      rows.push(String.fromCharCode(65 + rowIdx));
      rowIdx++;
    }
    return {
      name: c.name,
      rows,
      price: c.price,
      color: CATEGORY_META[c.name]?.color ?? '#71717A',
    };
  });

  return JSON.stringify({
    rows:           rowIdx,
    cols,
    categories:     catEntries,
    blockedSeats:   [],
    aisleAfterCols: [],
  });
}

function parseExistingLayout(layout: string | null): { cols: number; categories: CategoryConfig[] } {
  const defaults = { cols: 12, categories: defaultCategories() };
  if (!layout) return defaults;

  try {
    const obj = JSON.parse(layout) as {
      cols?: number;
      categories?: Array<{ name: string; rows: string[]; price: number }>;
    };

    if (!obj.categories) return defaults;

    const cats = defaultCategories();
    cats.forEach((c) => {
      const found = obj.categories!.find((x) => x.name === c.name);
      if (found) {
        c.enabled   = true;
        c.rowCount  = found.rows.length;
        c.price     = found.price;
      } else {
        c.enabled  = false;
      }
    });

    return { cols: obj.cols ?? 12, categories: cats };
  } catch {
    return defaults;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  venueId: string;
  screen?: PartnerScreenInfo;
  onClose: () => void;
}

export function PartnerScreenFormModal({ venueId, screen, onClose }: Props) {
  const isEdit = !!screen;
  const create = useCreatePartnerScreen(venueId);
  const update = useUpdatePartnerScreen(screen?.id ?? '', venueId);

  const existing = parseExistingLayout(screen?.layout ?? null);

  const [name,       setName]       = useState(screen?.name ?? '');
  const [cols,       setCols]       = useState(existing.cols);
  const [categories, setCategories] = useState<CategoryConfig[]>(existing.categories);
  const [error,      setError]      = useState('');

  const enabledCats  = categories.filter((c) => c.enabled && c.rowCount > 0);
  const totalRows    = enabledCats.reduce((s, c) => s + c.rowCount, 0);
  const totalSeats   = totalRows * cols;

  function updateCat(name: string, field: keyof CategoryConfig, value: number | boolean) {
    setCategories((prev) =>
      prev.map((c) => (c.name === name ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim())         { setError('Screen name is required.'); return; }
    if (cols < 1 || cols > 100) { setError('Seats per row must be between 1 and 100.'); return; }
    if (enabledCats.length === 0) { setError('Enable at least one seating category.'); return; }
    if (enabledCats.some((c) => c.price <= 0)) { setError('All enabled categories must have a price > ₹0.'); return; }

    const layout = buildBookingLayout(cols, categories);

    if (isEdit) {
      await update.mutateAsync({ name: name.trim(), totalSeats, layout });
    } else {
      await create.mutateAsync({ name: name.trim(), totalSeats, layout });
    }
    onClose();
  }

  const isPending    = create.isPending || update.isPending;
  const isServerErr  = create.isError   || update.isError;
  const inputCls     = 'px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo w-full';

  // Row labels preview
  let idx = 0;
  const rowLabels = enabledCats.flatMap((c) =>
    Array.from({ length: c.rowCount }, () => String.fromCharCode(65 + idx++))
  );

  return (
    <Modal open onClose={onClose} maxWidth="max-w-lg">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-text-primary">
          {isEdit ? 'Edit Screen' : 'Add Screen'}
        </h2>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Screen Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AUDI 1" className={inputCls} />
        </div>

        {/* Cols */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">
            Seats per Row *
            <span className="ml-1 text-text-muted font-normal text-xs">(same for all rows)</span>
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={cols}
            onChange={(e) => setCols(Math.max(1, Number(e.target.value)))}
            className={inputCls}
          />
        </div>

        {/* Category sections */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Seating Categories *
          </label>
          <div className="rounded-xl border border-border-default overflow-hidden">
            <div className="grid grid-cols-[auto_80px_90px_1fr] gap-0 text-[11px] font-semibold text-text-muted uppercase tracking-wide bg-bg-surface2 px-3 py-2 border-b border-border-default">
              <span>Category</span>
              <span className="text-center">Rows</span>
              <span className="text-center">Price (₹)</span>
              <span className="text-center">Enable</span>
            </div>

            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.name];
              return (
                <div
                  key={cat.name}
                  className={`grid grid-cols-[auto_80px_90px_1fr] items-center gap-3 px-3 py-3 border-b border-border-default/50 last:border-0 transition-opacity ${cat.enabled ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: meta?.color }} />
                    <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={cat.rowCount}
                    disabled={!cat.enabled}
                    onChange={(e) => updateCat(cat.name, 'rowCount', Math.max(0, Number(e.target.value)))}
                    className="px-2 py-1.5 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo w-full text-center disabled:opacity-50"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-text-muted text-xs">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={cat.price}
                      disabled={!cat.enabled}
                      onChange={(e) => updateCat(cat.name, 'price', Math.max(1, Number(e.target.value)))}
                      className="px-2 py-1.5 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo w-full disabled:opacity-50"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={cat.enabled}
                      onChange={(e) => updateCat(cat.name, 'enabled', e.target.checked)}
                      className="w-4 h-4 accent-[#E11D74] cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {enabledCats.length > 0 && (
          <div className="rounded-lg bg-bg-surface2 border border-border-default/50 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Total rows: <strong className="text-text-primary">{totalRows}</strong></span>
              <span>Seats/row: <strong className="text-text-primary">{cols}</strong></span>
              <span>Total seats: <strong className="text-text-primary">{totalSeats}</strong></span>
            </div>
            <div className="flex flex-wrap gap-1">
              {rowLabels.map((lbl) => (
                <span key={lbl} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-surface border border-border-default text-text-secondary">{lbl}</span>
              ))}
            </div>
          </div>
        )}

        {(error || isServerErr) && (
          <p className="text-xs text-semantic-error">{error || 'Server error. Please try again.'}</p>
        )}

        <div className="flex gap-3 pt-2 border-t border-border-default">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border-default text-text-secondary text-sm hover:bg-bg-surface2 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50 transition-opacity"
            style={{ background: '#E11D74' }}
          >
            {isPending ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save Changes' : 'Create Screen')}
          </button>
        </div>
      </form>
    </Modal>
  );
}
