/**
 * AI Insight Card — Performance Coach card for Green Agent
 */
import { Sparkles, ChevronRight, AlertTriangle, TrendingUp, Lightbulb, LucideIcon } from 'lucide-react';

interface Insight {
  type: 'warning' | 'success' | 'tip' | string;
  title: string;
  message: string;
  action: string;
}

interface AIInsightCardProps {
  insight: Insight;
  onAction: () => void;
  onDismiss?: () => void;
}

const typeConfig: Record<string, { bg: string, border: string, icon: LucideIcon, iconColor: string }> = {
  warning: { bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'border-orange-200 dark:border-orange-800/50', icon: AlertTriangle, iconColor: 'text-orange-500 dark:text-orange-400' },
  success: { bg: 'bg-green-50 dark:bg-emerald-900/30', border: 'border-green-200 dark:border-emerald-800/50', icon: TrendingUp, iconColor: 'text-green-500 dark:text-emerald-400' },
  tip: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800/50', icon: Lightbulb, iconColor: 'text-blue-500 dark:text-blue-400' },
};

export default function AIInsightCard({ insight, onAction, onDismiss }: AIInsightCardProps) {
  const cfg = (typeConfig[insight.type] || typeConfig.tip) as { bg: string, border: string, icon: LucideIcon, iconColor: string };

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 animate-slide-up`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
          <cfg.icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="ai-badge"><Sparkles className="w-3 h-3" /> AI Coach</span>
          </div>
          <h4 className="font-semibold text-sm text-slate-800 dark:text-white">{insight.title}</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{insight.message}</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onAction}
              className="text-sm font-semibold text-primary flex items-center gap-1 hover:underline"
            >
              {insight.action} <ChevronRight className="w-4 h-4" />
            </button>
            {onDismiss && (
              <button onClick={onDismiss} className="text-xs text-slate-400 hover:text-slate-600">Dismiss</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
