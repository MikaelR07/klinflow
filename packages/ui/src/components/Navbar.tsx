import React from 'react';
import { Recycle, Moon, Sun, Bell, Smartphone } from 'lucide-react';
import { useThemeStore, useNotificationStore } from '@klinflow/core';

interface NavbarProps {
  onShowNotifications: () => void;
  canInstall?: boolean;
  onInstall?: () => void;
}

export default function Navbar({ onShowNotifications, canInstall, onInstall }: NavbarProps) {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { notifications } = useNotificationStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white flex items-center">
            Klin<span className="text-primary">flow</span>
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md ml-1.5 font-black text-slate-500 uppercase tracking-widest">v1</span>
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 ml-3">
          {canInstall && (
            <button 
              onClick={onInstall}
              className="p-2.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-pulse-slow active:scale-95 transition-all shadow-sm"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          <button 
            onClick={onShowNotifications}
            className="relative p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900 animate-pulse" />
            )}
          </button>

          <button 
            onClick={toggleTheme} 
            className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shadow-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}
