import React from 'react';
import { cn } from '../../lib/utils';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export const Spinner = ({ className, size = 'md', ...props }: SpinnerProps) => {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' };
  return (
    <div 
      role="status" 
      aria-label="Loading"
      className={cn('border-primary border-t-transparent rounded-full animate-spin', sizes[size], className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
