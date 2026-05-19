/**
 * AssetBadge — UI component for waste grading and material identification
 */
import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, LucideIcon } from 'lucide-react';

interface GradeStyle {
  icon: LucideIcon;
  color: string;
  label: string;
}

const GRADE_STYLES: Record<string, GradeStyle> = {
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

interface AssetBadgeProps {
  grade?: 'A' | 'B' | 'C' | string;
  showLabel?: boolean;
  className?: string;
}

export default function AssetBadge({ grade = 'B', showLabel = true, className = '' }: AssetBadgeProps) {
  const style = (GRADE_STYLES[grade as string] || GRADE_STYLES['B']) as GradeStyle;
  const Icon = style.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-black uppercase tracking-wider ${style.color} ${className}`}>
      <Icon className="w-3 h-3" />
      {showLabel && <span>{style.label}</span>}
    </div>
  );
}
