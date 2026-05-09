/**
 * AssetBadge — UI component for waste grading and material identification
 */
import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const GRADE_STYLES = {
  A: {
    icon: ShieldCheck,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
    label: 'Industrial Grade A'
  },
  B: {
    icon: Shield,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20',
    label: 'Market Grade B'
  },
  C: {
    icon: ShieldAlert,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
    label: 'Standard Grade C'
  }
};

export default function AssetBadge({ grade = 'B', showLabel = true, className = '' }) {
  const style = GRADE_STYLES[grade] || GRADE_STYLES.B;
  const Icon = style.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${style.color} ${className}`}>
      <Icon className="w-3 h-3" />
      {showLabel && <span>{style.label}</span>}
    </div>
  );
}
