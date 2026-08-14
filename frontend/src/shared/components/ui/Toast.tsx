import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const icons = { success: CheckCircle, error: XCircle, info: Info };
const accentClass = {
  success: 'border-l-semantic-success text-semantic-success',
  error: 'border-l-semantic-error text-semantic-error',
  info: 'border-l-accent-indigo text-accent-indigo',
};

export function Toast({ message, variant = 'info', onClose }: ToastProps) {
  const Icon = icons[variant];

  useEffect(() => {
    const id = setTimeout(() => onClose?.(), 4000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div className={cn(
      'flex items-center gap-3 p-3 pl-4 bg-bg-surface2 border border-border-default border-l-4 rounded-md shadow-lg min-w-[260px] max-w-[420px] animate-fade-up font-sans',
      accentClass[variant]
    )}>
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1 text-sm text-text-primary">{message}</span>
      {onClose && (
        <button onClick={onClose} className="text-text-muted hover:text-text-primary flex-shrink-0">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ─── Toast container + simple hook ───────────────────────────────────────────

interface ToastItem { id: string; message: string; variant: ToastVariant; }

let _addToast: ((item: Omit<ToastItem, 'id'>) => void) | null = null;

export function toast(message: string, variant: ToastVariant = 'info') {
  _addToast?.({ message, variant });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    _addToast = (item) =>
      setToasts((prev) => [...prev, { ...item, id: Math.random().toString(36).slice(2) }]);
    return () => { _addToast = null; };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} variant={t.variant} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
}
