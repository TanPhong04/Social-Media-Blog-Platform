import React from 'react';
import { cn } from '../../lib/utils';
import { FileText } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, icon, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-12 text-center border border-border-default border-dashed rounded-lg bg-base', className)}>
      <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary mb-4">
        {icon || <FileText className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-heading font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-sm text-text-secondary mt-2 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
