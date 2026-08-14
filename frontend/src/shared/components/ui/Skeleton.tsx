import { cn } from '@/shared/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ width, height, className, style, ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-md bg-gradient-to-r from-bg-surface via-bg-surface3 to-bg-surface bg-[length:600px_100%] animate-[shimmer_1.4s_ease-in-out_infinite]',
        className
      )}
      style={{ width, height, ...style }}
      {...rest}
    />
  );
}
