import { forwardRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-bg-surface border border-border-default rounded-lg transition-all duration-[220ms]',
        hover && 'hover:-translate-y-1 hover:border-border-strong hover:shadow-lg cursor-pointer',
        className
      )}
      {...rest}
    />
  )
);
Card.displayName = 'Card';

export const GlassCard = forwardRef<HTMLDivElement, CardProps>(
  ({ hover = false, className, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'bg-bg-surface border border-border-default rounded-xl backdrop-blur-lg',
        'shadow-[0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.04)]',
        'transition-all duration-[220ms]',
        hover && 'hover:-translate-y-1 hover:bg-bg-surface2 hover:border-border-strong',
        className
      )}
      {...rest}
    />
  )
);
GlassCard.displayName = 'GlassCard';
