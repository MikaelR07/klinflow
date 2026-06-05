import React from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
  variant?: 'solid' | 'underline';
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'solid'
}: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide ${className}`}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId={`tab-indicator-underline`}
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
              />
            )}
          </button>
        ))}
      </div>
    );
  }

  // Solid variant
  return (
    <div className={`flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl overflow-x-auto scrollbar-hide gap-1 ${className}`}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative flex-1 py-2.5 px-4 rounded-xl text-xs font-bold capitalize tracking-widest transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
            activeTab === tab.id 
              ? 'text-emerald-700 dark:text-emerald-300' 
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId={`tab-indicator-solid`}
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-600/50"
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
