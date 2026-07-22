import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyIcon,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Chưa có bản ghi nào để hiển thị',
  className
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={cn('w-full border border-border-default rounded-xl bg-surface overflow-hidden', className)}>
        <div className="flex justify-center items-center p-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('w-full border border-border-default rounded-xl bg-surface overflow-hidden', className)}>
        <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} className="border-none" />
      </div>
    );
  }

  return (
    <div className={cn('w-full border border-border-default rounded-xl bg-surface overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse min-w-max">
        <thead>
          <tr className="bg-surface-elevated border-b border-border-default">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {data.map((item) => (
            <tr key={keyExtractor(item)} className="hover:bg-surface-elevated/50 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3 text-sm text-text-primary whitespace-nowrap', col.className)}>
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
