/**
 * AgentHome Header & Controls
 * Extracted from AgentHome.tsx
 */
import { Bell, MapPin, Power, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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
  isToggling, handleToggle, lastSynced
}: AgentHomeHeaderProps) {
  const isCompanyAdmin = profile?.agentAccountType === 'company_admin' || profile?.companyName || profile?.fleetInviteCode;

  return (
    <div className="space-y-3 pt-[calc(env(safe-area-inset-top,1rem)+2.5rem)]">
      {/* Header Section - Edge to Edge - FIXED TOPNAV */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 border-b border-slate-200 dark:border-slate-900 ">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            {/* Profile Avatar */}
            <div className="shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-2xl shadow-lg border-2 border-white dark:border-slate-700 transition-all overflow-hidden">
                {profile?.avatarUrl ? (
                  <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 300 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  profile?.avatar || '👤'
                )}
              </div>
            </div>
            <div>
              <h1 className="text-lg font-normal italic tracking-wide text-slate-900 dark:text-white leading-tight">Hello {profile?.name?.split(' ')[0]}👋</h1>
              <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold capitalize tracking-wide bg-primary/10 px-0.5 py-0.5 rounded-full border border-primary/20 w-fit">
                <MapPin className="w-3 h-3" /> {profile?.location?.estate || profile?.estate || 'searching...'}
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all active:scale-95 group"
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

      <div className="bg-white dark:bg-slate-900/50 rounded-[1rem] p-1 border border-slate-200/60 dark:border-slate-700 space-y-4">
        {/* ── CORE CONTROLS GROUP ── */}
        <div className="space-y-3">
          {/* ── AGENT ONLINE STATUS TOGGLE (Unified Logic) ── */}
          {!isCompanyAdmin ? (
            <div className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-none">
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-3xl flex items-center justify-center transition-colors ${profile?.isOnline
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                  : 'bg-slate-200/50 dark:bg-slate-900 text-slate-400'
                  }`}>
                  {isToggling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Power className="w-5 h-5" />
                  )}
                </div>

                <div className="text-left">
                  <p className="text-[11px] font-semibold capitalize tracking-wide leading-none mb-1.5 text-slate-600">
                    System Status
                  </p>

                  <p
                    className={`text-sm font-bold ${profile?.isOnline
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-900 dark:text-white'
                      }`}
                  >
                    {profile?.isOnline ? 'Online' : 'Offline'}
                  </p>

                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Last sync: {formatDistanceToNow(lastSynced, { addSuffix: true })}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`relative w-16 h-9 rounded-full transition-all duration-300 ${profile?.isOnline
                  ? 'bg-emerald-500 '
                  : 'bg-slate-300 dark:bg-slate-900'
                  }`}
              >
                <div
                  className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-sm ${profile?.isOnline ? 'left-[32px]' : 'left-[4px]'
                    }`}
                />
              </button>
            </div>
          ) : (
            <div className="w-full p-1 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-150 dark:border-slate-800/30 flex items-center justify-between shadow-none text-slate-900 dark:text-white">
              <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${profile?.isOnline ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200/50 dark:bg-slate-800 text-slate-400'
                  }`}>
                  {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black capitalize tracking-[0.2em] leading-none mb-1.5 text-primary">Company Control</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{profile?.isOnline ? 'Radar Active' : 'System Offline'}</p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                disabled={isToggling}
                className={`relative w-16 h-9 rounded-full transition-all duration-300 ${profile?.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
              >
                <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all duration-300 shadow-sm ${profile?.isOnline ? 'left-[32px]' : 'left-[4px]'
                  }`} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
