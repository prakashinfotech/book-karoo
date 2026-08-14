import { cn } from '@/shared/lib/utils';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  onToggle?: (active: boolean) => void;
}

export function Chip({ active = false, onToggle, className, onClick, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center gap-1 px-3 h-[30px] rounded-full text-sm font-sans transition-all duration-150 cursor-pointer select-none shrink-0',
        active
          ? 'bg-accent-indigo border-2 border-white/70 text-white font-semibold shadow-[0_0_0_3px_rgba(99,102,241,0.35)]'
          : 'bg-bg-surface2 border border-border-strong text-text-secondary hover:border-accent-indigo/70 hover:text-text-primary hover:bg-bg-surface3',
        className
      )}
      onClick={(e) => {
        onToggle?.(!active);
        onClick?.(e);
      }}
      {...rest}
    >
      {active && <span className="text-[11px] leading-none">✓</span>}
      {children}
    </button>
  );
}
