import { useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface StarRatingProps {
  value?: number;
  max?: 5 | 10;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

export function StarRating({ value = 0, max = 5, onChange, readOnly = false, size = 20, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <span className={cn('inline-flex gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < display;
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(i + 1)}
            onMouseEnter={() => !readOnly && setHovered(i + 1)}
            onMouseLeave={() => !readOnly && setHovered(null)}
            className={cn(
              'transition-colors duration-100 leading-none p-0.5',
              readOnly ? 'cursor-default' : 'cursor-pointer',
              filled ? 'text-seat-recliner' : 'text-border-strong'
            )}
            style={{ fontSize: size }}
            aria-label={`Rate ${i + 1} of ${max}`}
          >
            ★
          </button>
        );
      })}
    </span>
  );
}
