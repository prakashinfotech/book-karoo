import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    // Backdrop — does NOT close on click (user must use × or Cancel)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-up">
      <div
        className={cn(
          'w-full bg-white border border-border-default rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden',
          maxWidth, className
        )}
        style={{ maxHeight: '90vh', transform: 'translateZ(0)' }}
      >
        {/* Sticky header — only rendered when title is provided */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default flex-shrink-0">
            <span className="font-sans font-semibold text-base text-text-primary">{title}</span>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="w-8 h-8 flex items-center justify-center rounded-full text-text-muted hover:text-text-primary hover:bg-bg-surface2 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {/* Scrollable content — scrollbar stays inside rounded corners */}
        <div className="overflow-y-auto flex-1 min-h-0">
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
