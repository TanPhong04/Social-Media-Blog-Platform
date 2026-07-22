import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;
    const errorId = `${inputId}-error`;

    return (
      <div className="w-full">
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'flex w-full rounded-md border border-border-default bg-base px-3 py-2 text-sm text-text-primary placeholder:text-text-muted',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error focus-visible:border-error',
            className
          )}
          {...props}
        />
        {error && (
          <span id={errorId} className="text-error text-xs mt-1 block font-medium" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
