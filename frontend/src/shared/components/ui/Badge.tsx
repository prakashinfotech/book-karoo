import { cn } from '@/shared/lib/utils';

type BadgeColor = 'crimson' | 'indigo' | 'purple' | 'success' | 'warning' | 'error' | 'default';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

const colorClasses: Record<BadgeColor, string> = {
  default: 'bg-bg-surface2 text-text-secondary border border-border-default',
  crimson: 'bg-accent-crimson/12 text-[#FF6770] border border-accent-crimson/25',
  indigo: 'bg-accent-indigo/14 text-[#A5B4FC] border border-accent-indigo/28',
  purple: 'bg-accent-purple/14 text-[#C4A0FF] border border-accent-purple/28',
  success: 'bg-semantic-success/12 text-[#6EE7B7] border border-semantic-success/28',
  warning: 'bg-semantic-warning/12 text-[#FCD34D] border border-semantic-warning/28',
  error: 'bg-semantic-error/12 text-[#FCA5A5] border border-semantic-error/28',
};

export function Badge({ color = 'default', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide font-sans',
        colorClasses[color],
        className
      )}
      {...rest}
    />
  );
}
