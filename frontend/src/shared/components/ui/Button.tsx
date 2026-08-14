import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'gradient' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  // BMS-style: solid fill, no heavy shadows, clean hover
  primary:
    'bg-accent-crimson hover:bg-accent-crimson-dark active:bg-accent-crimson-dark text-white transition-colors',
  secondary:
    'bg-accent-indigo hover:bg-[#4338CA] active:bg-[#4338CA] text-white transition-colors',
  ghost:
    'bg-transparent border border-border-strong text-text-primary hover:bg-bg-surface2 transition-colors',
  gradient:
    'bg-accent-crimson hover:bg-accent-crimson-dark text-white transition-colors',
  destructive:
    'bg-semantic-error hover:bg-[#C0392B] active:bg-[#C0392B] text-white transition-colors',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-4 text-xs rounded-md',
  md: 'h-10 px-5 text-sm rounded-md',
  lg: 'h-11 px-7 text-sm rounded-md',
  xl: 'h-12 px-9 text-base rounded-md',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, fullWidth = false, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold font-sans transition-all duration-[220ms] ease-in-out whitespace-nowrap select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = 'Button';
