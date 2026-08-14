import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface Category {
  name:  string;
  rows:  string;
  price: number;
  color: string;
}

interface LayoutBuilderProps {
  value:    string;
  onChange: (json: string) => void;
}

type ValidationState = 'idle' | 'valid' | 'invalid';

function calcSeats(cols: number, categories: Category[], blocked: string): number {
  const blockedCount = blocked.split(',').map((s) => s.trim()).filter(Boolean).length;
  const rowCount = categories.reduce((sum, c) => {
    const rows = c.rows.split(',').map((r) => r.trim()).filter(Boolean);
    return sum + rows.length;
  }, 0);
  return Math.max(0, rowCount * cols - blockedCount);
}

function buildJson(cols: number, aisles: string, categories: Category[], blocked: string): string {
  const aisleAfterCols = aisles.split(',').map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0);
  const cats = categories.map((c) => ({
    name:  c.name,
    rows:  c.rows.split(',').map((r) => r.trim()).filter(Boolean),
    price: c.price,
    color: c.color,
  }));
  const blockedSeats = blocked.split(',').map((s) => s.trim()).filter(Boolean);
  const totalRows = cats.reduce((sum, c) => sum + c.rows.length, 0);
  return JSON.stringify({ rows: totalRows, cols, categories: cats, blockedSeats, aisleAfterCols }, null, 2);
}

function validateLayout(cols: number, categories: Category[]): { valid: boolean; error?: string } {
  if (cols <= 0 || cols > 30) return { valid: false, error: 'Columns must be between 1 and 30.' };
  if (categories.length === 0) return { valid: false, error: 'At least one category is required.' };

  const usedRows = new Set<string>();
  for (const cat of categories) {
    if (!cat.name.trim()) return { valid: false, error: 'Each category needs a name.' };
    const rows = cat.rows.split(',').map((r) => r.trim()).filter(Boolean);
    if (rows.length === 0) return { valid: false, error: `Category "${cat.name}" has no rows.` };
    if (cat.price <= 0) return { valid: false, error: `Category "${cat.name}" price must be > 0.` };
    for (const r of rows) {
      if (!/^[A-Z]$/.test(r)) return { valid: false, error: `Row letter "${r}" must be a single A-Z letter.` };
      if (usedRows.has(r)) return { valid: false, error: `Duplicate row letter "${r}".` };
      usedRows.add(r);
    }
  }
  return { valid: true };
}

export function LayoutBuilder({ value, onChange }: LayoutBuilderProps) {
  const DEFAULT_CATS: Category[] = [
    { name: 'Executive', rows: 'C,D,E,F', price: 300, color: '#4169E1' },
    { name: 'Normal',    rows: 'G,H,I,J', price: 150, color: '#E4E4E7' },
  ];

  const parseInitial = (): { cols: number; aisles: string; cats: Category[]; blocked: string } => {
    try {
      const parsed = JSON.parse(value);
      return {
        cols:    parsed.cols ?? 10,
        aisles:  (parsed.aisleAfterCols ?? []).join(', '),
        cats:    (parsed.categories ?? DEFAULT_CATS).map((c: {name: string; rows: string[]; price: number; color: string}) => ({
          name:  c.name,
          rows:  Array.isArray(c.rows) ? c.rows.join(', ') : c.rows,
          price: c.price,
          color: c.color,
        })),
        blocked: (parsed.blockedSeats ?? []).join(', '),
      };
    } catch {
      return { cols: 10, aisles: '', cats: DEFAULT_CATS, blocked: '' };
    }
  };

  const init = parseInitial();
  const [cols, setCols]       = useState(init.cols);
  const [aisles, setAisles]   = useState(init.aisles);
  const [cats, setCats]       = useState<Category[]>(init.cats);
  const [blocked, setBlocked] = useState(init.blocked);
  const [showBlocked, setShowBlocked]   = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [validation, setValidation]     = useState<ValidationState>('idle');
  const [validationMsg, setValidationMsg] = useState('');

  useEffect(() => {
    const { valid, error } = validateLayout(cols, cats);
    if (valid) {
      const json = buildJson(cols, aisles, cats, blocked);
      const seats = calcSeats(cols, cats, blocked);
      const rowCount = cats.reduce((s, c) => s + c.rows.split(',').filter(Boolean).length, 0);
      setValidation('valid');
      setValidationMsg(`Layout valid — ${seats} seats across ${rowCount} rows`);
      onChange(json);
    } else {
      setValidation('invalid');
      setValidationMsg(error ?? 'Invalid layout');
    }
  }, [cols, aisles, cats, blocked]);

  const addCat = () => setCats((prev) => [...prev, { name: '', rows: '', price: 200, color: '#6366F1' }]);

  const removeCat = (i: number) => setCats((prev) => prev.filter((_, idx) => idx !== i));

  const updateCat = <K extends keyof Category>(i: number, key: K, val: Category[K]) =>
    setCats((prev) => prev.map((c, idx) => idx === i ? { ...c, [key]: val } : c));

  const currentJson = buildJson(cols, aisles, cats, blocked);
  const currentSeats = calcSeats(cols, cats, blocked);

  return (
    <div className="space-y-4">
      {/* Grid settings */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Number of Columns *</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCols((c) => Math.max(1, c - 1))} className="w-8 h-8 rounded-lg bg-bg-surface2 border border-border-default flex items-center justify-center text-text-primary hover:bg-bg-surface3">−</button>
            <input type="number" min={1} max={30} value={cols} onChange={(e) => setCols(parseInt(e.target.value) || 1)} className="w-16 text-center px-2 py-1.5 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
            <button type="button" onClick={() => setCols((c) => Math.min(30, c + 1))} className="w-8 h-8 rounded-lg bg-bg-surface2 border border-border-default flex items-center justify-center text-text-primary hover:bg-bg-surface3">+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">Aisle after columns</label>
          <input value={aisles} onChange={(e) => setAisles(e.target.value)} placeholder="e.g. 6, 12" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
          <p className="text-xs text-text-muted mt-1">Leave blank for no aisles</p>
        </div>
      </div>

      {/* Auto-calculated seats */}
      <p className="text-sm text-text-muted">Auto-calculated: <span className="text-text-primary font-medium">{currentSeats} seats</span></p>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text-primary">Seat Categories</span>
          <button type="button" onClick={addCat} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-accent-indigo text-accent-indigo hover:bg-accent-indigo/10 transition-colors">
            <Plus size={12} /> Add Category
          </button>
        </div>

        <div className="space-y-3">
          {cats.map((cat, i) => (
            <div key={i} className="rounded-lg border border-border-default bg-bg-surface2 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <input value={cat.name} onChange={(e) => updateCat(i, 'name', e.target.value)} placeholder="Category name" className="flex-1 px-2 py-1.5 rounded bg-bg-surface border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
                <input type="color" value={cat.color} onChange={(e) => updateCat(i, 'color', e.target.value)} className="w-10 h-8 rounded cursor-pointer border border-border-default" title="Category color" />
                {cats.length > 1 && (
                  <button type="button" onClick={() => removeCat(i)} className="text-semantic-error hover:opacity-80 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <input value={cat.rows} onChange={(e) => updateCat(i, 'rows', e.target.value)} placeholder="Row letters: A, B, C" className="w-full px-2 py-1.5 rounded bg-bg-surface border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
                  <p className="text-xs text-text-muted mt-0.5">Single A-Z letters, comma-separated</p>
                </div>
                <div className="w-28">
                  <div className="flex items-center gap-1">
                    <span className="text-text-muted text-sm">₹</span>
                    <input type="number" min={1} value={cat.price} onChange={(e) => updateCat(i, 'price', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded bg-bg-surface border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked seats */}
      <div>
        <button type="button" onClick={() => setShowBlocked((v) => !v)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
          {showBlocked ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Blocked/Unavailable Seats
        </button>
        {showBlocked && (
          <div className="mt-2">
            <textarea value={blocked} onChange={(e) => setBlocked(e.target.value)} rows={2} placeholder="A1, A18, L1, L18" className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-primary text-sm focus:outline-none focus:border-accent-indigo resize-none" />
            <p className="text-xs text-text-muted mt-1">Seats permanently unavailable (pillars, broken seats, etc.)</p>
          </div>
        )}
      </div>

      {/* JSON preview */}
      <div>
        <button type="button" onClick={() => setShowPreview((v) => !v)} className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors">
          {showPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          View Raw JSON
        </button>
        {showPreview && (
          <div className="mt-2 relative">
            <textarea readOnly value={currentJson} rows={6} className="w-full px-3 py-2 rounded-lg bg-bg-surface2 border border-border-default text-text-muted text-xs font-mono resize-none" />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(currentJson)}
              className="absolute top-2 right-2 p-1 rounded bg-bg-surface3 hover:bg-bg-surface2 text-text-muted"
            ><Copy size={12} /></button>
          </div>
        )}
      </div>

      {/* Validation */}
      <div className={cn(
        'text-sm font-sans',
        validation === 'valid'   && 'text-semantic-success',
        validation === 'invalid' && 'text-semantic-error',
        validation === 'idle'    && 'text-text-muted',
      )}>
        {validation === 'idle' && 'Validating…'}
        {validation === 'valid'   && `✅ ${validationMsg}`}
        {validation === 'invalid' && `❌ ${validationMsg}`}
      </div>
    </div>
  );
}
