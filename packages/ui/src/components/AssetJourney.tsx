/**
 * AssetJourney — Visual timeline of the waste-to-asset lifecycle
 */
import React from 'react';
import { CheckCircle2, Circle, Clock, Truck, Hammer, Factory, User } from 'lucide-react';

const STEPS = [
  { id: 'listed', label: 'Asset Listed', sub: 'Ready for collection', icon: User },
  { id: 'verified', label: 'Verified & Graded', sub: 'HygeneX Quality Check', icon: Truck },
  { id: 'matched', label: 'Weaver Matched', sub: 'Assigned to processing', icon: Hammer },
  { id: 'recycled', label: 'Final Recovery', sub: 'Circular loop complete', icon: Factory },
];

export default function AssetJourney({ currentStatus = 'listed' }: { currentStatus?: string }) {
  const getStatusIndex = (status: string) => {
    const map: Record<string, number> = { 'pending': 0, 'completed': 1, 'matched': 2, 'recycled': 3 };
    return map[status] || 0;
  };

  const currentIndex = getStatusIndex(currentStatus);

  return (
    <div className="py-4 px-2">
      <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6 px-2">Lifecycle Tracking</h4>
      <div className="space-y-0">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              {/* Connector Line */}
              {idx !== STEPS.length - 1 && (
                <div className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
              )}

              {/* Icon Circle */}
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${
                isCompleted ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 
                isCurrent ? 'bg-white dark:bg-slate-900 border-primary text-primary' : 
                'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              {/* Text */}
              <div className="flex-1 pt-0.5">
                <p className={`text-xs font-black tracking-tight ${isCompleted || isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {isCurrent ? 'Current Status' : step.sub}
                </p>
              </div>

              {isCurrent && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full h-fit mt-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs font-black uppercase text-primary tracking-widest">Active</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
