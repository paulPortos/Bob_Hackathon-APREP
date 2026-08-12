'use client';

import { ReactNode, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: LucideIcon;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
}

export default function Tabs({ tabs, defaultTab, activeTab, onChange }: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id);
  const selectedTab = activeTab ?? internalActiveTab;

  const handleTabChange = (tabId: string) => {
    setInternalActiveTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-900/[0.03]">
        <nav className="flex min-w-max gap-1" aria-label="Project sections" role="tablist">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                role="tab"
                data-project-guide={tab.id}
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                className={cn(
                  'inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-1',
                  isActive
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                )}
              >
                {Icon && <Icon className="h-4 w-4" strokeWidth={1.8} />}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 sm:mt-6">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`${tab.id}-panel`}
            role="tabpanel"
            className={cn(selectedTab === tab.id ? 'block' : 'hidden')}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}

// Made with Bob
