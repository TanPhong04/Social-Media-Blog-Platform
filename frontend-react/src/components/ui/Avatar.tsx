import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', ...props }, ref) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-xl',
    };

    return (
      <div
        ref={ref}
        role="img"
        aria-label={alt || fallback}
        className={cn(
          'relative flex shrink-0 overflow-hidden rounded-full bg-surface-elevated border border-border-subtle items-center justify-center font-bold text-text-primary',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt || ''} loading="lazy" decoding="async" className="aspect-square h-full w-full object-cover" />
        ) : (
          <span className="uppercase" aria-hidden="true">{fallback.substring(0, 2)}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
