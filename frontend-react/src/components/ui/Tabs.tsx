import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; content?: React.ReactNode }[];
  defaultTab?: string;
  onTabChange?: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab, onTabChange, className }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (onTabChange) onTabChange(id);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    }

    if (newIndex !== index) {
      e.preventDefault();
      tabRefs.current[newIndex]?.focus();
      handleTabClick(tabs[newIndex].id);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div 
        role="tablist" 
        aria-orientation="horizontal"
        className="flex border-b border-border-default"
      >
        {tabs.map((tab, index) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[index] = el; }}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex-1 py-3 text-center font-bold text-sm relative transition-colors cursor-pointer hover:bg-surface-elevated',
                'focus-visible:outline-none focus-visible:bg-surface-elevated focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                isActive ? 'text-text-primary' : 'text-text-secondary'
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
      <div className="pt-4">
        {tabs.map(tab => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeTab !== tab.id}
            tabIndex={0}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
          >
            {activeTab === tab.id && tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};
