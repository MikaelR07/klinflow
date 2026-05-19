/**
 * Empty state component with icon, title, and optional CTA
 */
import React from 'react';
import { Inbox, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

export default function EmptyState({ 
  icon: Icon = Inbox, 
  title = 'Nothing here yet', 
  subtitle, 
  action, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      {subtitle && <p className="text-sm text-slate-400 max-w-xs">{subtitle}</p>}
      {action && (
        <button onClick={onAction} className="btn-primary mt-6">{action}</button>
      )}
    </div>
  );
}
