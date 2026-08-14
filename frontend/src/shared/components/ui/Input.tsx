import { forwardRef, useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, value, defaultValue, onChange, onFocus, onBlur, rightElement, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    const [internalValue, setInternalValue] = useState<string>(
      typeof defaultValue === 'string' ? defaultValue : String(defaultValue ?? ''),
    );
    const localRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const isControlled = value !== undefined;
    const hasValue = isControlled
      ? String(value ?? '').length > 0
      : internalValue.length > 0;
    // date inputs always show browser format hint (mm/dd/yyyy) so keep label floated
    const { placeholder, type, ...inputRest } = rest;
    const isDate = type === 'date';
    const floated = focused || hasValue || isDate;

    // Merge forwarded ref (used by react-hook-form) with our local ref for DOM reads
    const setRef = useCallback(
      (el: HTMLInputElement | null) => {
        (localRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      },
      [ref],
    );

    // When uncontrolled, sync internalValue with the actual DOM value after every commit.
    // react-hook-form's reset() sets the DOM value directly via ref without firing onChange,
    // so we detect the change here to keep the floating label accurate and prevent React
    // from forcing the input back to '' on the next render.
    useLayoutEffect(() => {
      if (!isControlled && localRef.current && localRef.current.value !== internalValue) {
        setInternalValue(localRef.current.value);
      }
    });

    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="relative h-12">
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'absolute left-3.5 z-10 pointer-events-none font-sans transition-all duration-150',
                floated
                  ? 'top-1.5 text-[10px] font-semibold tracking-wider uppercase'
                  : 'top-1/2 -translate-y-1/2 text-sm font-normal',
                error
                  ? 'text-semantic-error'
                  : focused
                  ? 'text-[#4F46E5]'
                  : 'text-text-muted'
              )}
            >
              {label}
            </label>
          )}
          <input
            ref={setRef}
            id={inputId}
            type={type}
            {...(isControlled
              ? { value }
              : { defaultValue: typeof defaultValue === 'string' ? defaultValue : '' }
            )}
            placeholder={floated ? placeholder : ''}
            onChange={(e) => {
              if (!isControlled) setInternalValue(e.target.value);
              onChange?.(e);
            }}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cn(
              'absolute inset-0 w-full h-full bg-bg-surface rounded-md font-sans text-sm text-text-primary outline-none transition-all duration-150',
              label ? 'pt-5 pb-1.5 px-3.5' : 'px-3.5',
              rightElement && 'pr-10',
              error
                ? 'border border-semantic-error focus:ring-2 focus:ring-semantic-error/10'
                : 'border border-border-default focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/12'
            )}
            {...inputRest}
          />
          {rightElement && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-semantic-error font-sans">{error}</p>}
        {hint && !error && <p className="text-xs text-text-muted font-sans">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
