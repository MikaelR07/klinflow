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
    <>
      {/* Fixed Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left: Avatar + Greeting + Location */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-all overflow-hidden">
                {profile?.avatarUrl ? (
                  <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  profile?.avatar || '👤'
                )}
              </div>
            </div>
            <div className="min-w-0">
              <h1 className="text-[17px] font-black tracking-tight text-slate-900 dark:text-white leading-none truncate">
                Hello, {profile?.name?.split(' ')[0]}! 👋
              </h1>
              {/* Location pill - greenish card style */}
              <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold capitalize tracking-wider bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-[3px] rounded-full border border-emerald-200 dark:border-emerald-800/50 w-fit">
                <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[90px]">{profile?.location?.estate || profile?.estate || 'searching...'}</span>
              </div>
            </div>
          </div>

          {/* Right: Status Toggle + Bell */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ── Status Toggle Pill ── */}
            <button
              onClick={handleToggle}
              disabled={isToggling}
              aria-label={profile?.isOnline ? 'Go offline' : 'Go online'}
              className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full border transition-all duration-300 active:scale-95 ${
                profile?.isOnline
                  ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
                  : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
              }`}
            >
              <span className={`text-[12px] font-black tracking-wider capitalize transition-colors duration-300 ${
                profile?.isOnline
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {profile?.isOnline ? 'Online' : 'Offline'}
              </span>

              {/* Mini toggle track */}
              <div className={`relative w-9 h-[20px] rounded-full transition-all duration-300 shrink-0 ${
                profile?.isOnline ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin absolute top-[3.5px] left-1/2 -translate-x-1/2 text-white" />
                ) : (
                  <div className={`absolute top-[2px] w-[16px] h-[16px] bg-white rounded-full transition-all duration-300 shadow-sm ${
                    profile?.isOnline ? 'left-[19px]' : 'left-[2px]'
                  }`} />
                )}
              </div>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative w-[38px] h-[38px] rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
