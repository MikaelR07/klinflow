/**
 * AgentHome Header & Controls
 * Compact top nav with inline status toggle pill
 */
import { Bell, MapPin, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@klinflow/ui';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';

interface AgentHomeHeaderProps {
  profile: any;
  unreadCount: number;
  navigate: (path: string) => void;
  isToggling: boolean;
  handleToggle: () => void;
  lastSynced: Date;
}

export default function AgentHomeHeader({
  profile, unreadCount, navigate,
  isToggling, handleToggle,
}: AgentHomeHeaderProps) {

  return (
    <div className="pt-[calc(env(safe-area-inset-top,1rem)+4rem)]">
      {/* Fixed Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900">
        <div className="flex items-center justify-between px-1">
          {/* Left: Avatar + Greeting */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-lg shadow-lg border-2 border-white dark:border-slate-700 transition-all overflow-hidden">
                {profile?.avatarUrl ? (
                  <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  profile?.avatar || '👤'
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-normal italic tracking-wide text-slate-900 dark:text-white leading-tight truncate">
                Hello {profile?.name?.split(' ')[0]}👋
              </h1>
              <div className="flex items-center gap-1 text-[9px] text-primary font-bold capitalize tracking-wide bg-primary/10 px-1.5 py-0.5 rounded-full border border-primary/20 w-fit">
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[80px]">{profile?.location?.estate || profile?.estate || 'searching...'}</span>
              </div>
            </div>
          </div>

          {/* Right: Status Pill + Bell */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ── Status Toggle Pill ── */}
            <button
              onClick={handleToggle}
              disabled={isToggling}
              aria-label={profile?.isOnline ? 'Go offline' : 'Go online'}
              className={`flex items-center gap-1 pl-2.5 pr-1 py-1.5 rounded-full border transition-all duration-300 active:scale-95 ${
                profile?.isOnline
                  ? 'bg-white border-emerald-400 dark:bg-slate-800 dark:border-emerald-400'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600'
              }`}
            >
              {/* Animated status dot */}
              <span className="relative flex h-2 w-2 shrink-0">
                {profile?.isOnline && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 transition-colors duration-300 ${
                  profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                }`} />
              </span>

              {/* Label */}
              <span className={`text-[11px] font-bold transition-colors duration-300 ${
                profile?.isOnline
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {profile?.isOnline ? 'Online' : 'Offline'}
              </span>

              {/* Mini toggle track */}
              <div className={`relative w-9 h-[20px] rounded-full transition-all duration-300 shrink-0 ${
                profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin absolute top-[4px] left-1/2 -translate-x-1/2 text-white" />
                ) : (
                  <div className={`absolute top-[2px] w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm ${
                    profile?.isOnline ? 'left-[18px]' : 'left-[2px]'
                  }`} />
                )}
              </div>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
