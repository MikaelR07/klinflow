import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@klinflow/core';

export default function ThemeToggleRow() {
  const { isDarkMode, toggleTheme } = useThemeStore();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleTheme();
      }}
      className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:border-primary/30 transition-colors shadow-sm">
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-500" />
        )}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold dark:text-slate-200">Appearance</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Switch to {isDarkMode ? 'Light' : 'Dark'} mode
        </p>
      </div>
      <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${isDarkMode ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}>
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
      </div>
    </button>
  );
}
