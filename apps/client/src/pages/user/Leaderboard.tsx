import { useEffect, useState, useMemo, memo } from 'react';
import { Crown, Medal, Info, ArrowLeft, Sparkles, Recycle, Trophy, TrendingUp, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, supabase, getThumbnailUrl } from '@klinflow/core';

// ── SUB-COMPONENTS (DEFINED OUTSIDE TO PREVENT RE-MOUNTS) ─────────────────────────

const MerchantPodiumSlot = memo(({ user, height, isFirst, rank }: { user: any, height: string, isFirst: boolean, rank: number }) => {
  const getRankTheme = () => {
    if (rank === 1) return { 
      podium: 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 shadow-amber-500/40',
      avatar: 'border-amber-400 bg-amber-50',
      name: 'text-amber-950',
      revenue: 'text-white'
    };
    if (rank === 2) return { 
      podium: 'bg-gradient-to-b from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-800 border-slate-300 dark:border-slate-600 shadow-slate-500/20',
      avatar: 'border-slate-300 bg-slate-50 dark:bg-slate-800',
      name: 'text-slate-900 dark:text-slate-200',
      revenue: 'text-slate-900 dark:text-white'
    };
    if (rank === 3) return { 
      podium: 'bg-gradient-to-b from-emerald-400 to-emerald-600 border-emerald-300 shadow-emerald-500/20',
      avatar: 'border-emerald-300 bg-emerald-50 dark:bg-emerald-800',
      name: 'text-emerald-950 dark:text-emerald-100',
      revenue: 'text-white'
    };
    return { podium: 'bg-white', avatar: 'border-slate-200', name: 'text-slate-400', revenue: 'text-slate-600' };
  };

  const theme = getRankTheme();

  return (
    <div className="flex flex-col items-center flex-1">
      <div className={`${isFirst ? 'w-20 h-20' : 'w-14 h-14'} rounded-[2rem] border-2 ${user ? `${theme.avatar} shadow-xl` : 'border-dashed border-slate-300 dark:border-slate-600'} flex items-center justify-center mb-3 relative overflow-hidden shadow-xl`}>
        {user?.avatar_url ? (
          <img 
            src={getThumbnailUrl(user.avatar_url, { width: isFirst ? 200 : 150 })} 
            className="w-full h-full object-cover" 
            alt={user.name}
            loading={isFirst ? "eager" : "lazy"}
            fetchPriority={isFirst ? "high" : "auto"}
          />
        ) : (
          <span className="text-xl">{user ? '👤' : '—'}</span>
        )}
        {isFirst && <Crown className={`w-8 h-8 ${user ? 'text-amber-500' : 'text-slate-300'} absolute -top-1 right-0 -rotate-12`} />}
      </div>
      <div className={`w-full ${user ? `${theme.podium} border` : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700'} rounded-2xl ${height} flex flex-col items-center justify-center relative shadow-2xl transition-all duration-500`}>
        {user ? (
          <>
            <p className={`text-[10px] font-black ${theme.name} uppercase tracking-widest truncate w-20 text-center mt-2`}>{user.name}</p>
            <p className={`font-black tracking-tighter ${isFirst ? 'text-sm' : 'text-[10px]'} ${theme.revenue}`}>KSh {user.revenue.toLocaleString()}</p>
          </>
        ) : (
          <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Open</p>
        )}
      </div>
    </div>
  );
});

const PodiumSlot = memo(({ user, height, bgClass, medalClass, isFirst }: { user: any, height: string, bgClass: string, medalClass: string, isFirst: boolean }) => (
  <div className="flex flex-col items-center flex-1">
    <div className={`${isFirst ? 'w-16 h-16' : 'w-12 h-12'} rounded-full border-2 ${user ? (isFirst ? 'border-amber-400 bg-amber-100' : 'border-slate-300 bg-slate-200 dark:bg-slate-700') : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'} flex items-center justify-center mb-2 relative overflow-hidden shadow-sm`}>
      {user?.avatar_url ? (
        <img 
          src={getThumbnailUrl(user.avatar_url, { width: isFirst ? 150 : 100 })} 
          className="w-full h-full object-cover" 
          alt={user.name}
          loading={isFirst ? "eager" : "lazy"}
          fetchPriority={isFirst ? "high" : "auto"}
        />
      ) : (
        <span className="text-lg">{user ? '👤' : '—'}</span>
      )}
      {isFirst && <Crown className={`w-6 h-6 ${user ? 'text-amber-400' : 'text-slate-300'} absolute -top-5 rotate-12`} />}
    </div>
    <div className={`w-full ${user ? bgClass : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700'} rounded-t-2xl ${height} flex flex-col items-center justify-center relative shadow-lg transition-all duration-500`}>
      {!isFirst && user && <Medal className={`w-6 h-6 ${medalClass} absolute -top-3`} />}
      {user ? (
        <>
          <p className={`text-[10px] font-semibold ${isFirst ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'} truncate w-20 text-center mt-2`}>{user.name}</p>
          <p className={`font-bold ${isFirst ? 'text-base text-amber-600' : 'text-[11px] text-primary'}`}>{user.kg} KG</p>
        </>
      ) : (
        <p className="text-[10px] font-semibold text-slate-300 dark:bg-slate-600 uppercase tracking-widest">Open</p>
      )}
      {isFirst && user && (
        <div className="absolute -bottom-2 bg-amber-400 text-white text-[10px] font-semibold px-4 py-0.5 rounded-full uppercase shadow-md">Hero</div>
      )}
    </div>
  </div>
));

const SellerListItem = memo(({ user }: { user: any }) => (
  <div 
    className={`p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
      user.isUser
        ? 'bg-slate-900 dark:bg-slate-900/50 border-emerald-500/30 shadow-2xl relative z-10'
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'
    }`}
  >
    <div className="flex items-center gap-5">
      <span className={`text-xs font-black w-6 ${user.isUser ? 'text-emerald-400' : 'text-slate-400'}`}>#{user.rank}</span>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg overflow-hidden border border-slate-100 dark:border-white/5">
        {user.avatar_url ? (
          <img 
            src={getThumbnailUrl(user.avatar_url, { width: 100 })} 
            className="w-full h-full object-cover" 
            alt={user.name}
            loading="lazy"
          />
        ) : '👤'}
      </div>
      <div>
        <p className={`text-sm font-bold ${user.isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          {user.name} {user.isUser && '(You)'}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Top Merchant</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`text-sm font-black font-mono ${user.isUser ? 'text-emerald-400' : 'text-emerald-600'}`}>KSh {user.revenue.toLocaleString()}</p>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Revenue</p>
    </div>
  </div>
));

const ResidentListItem = memo(({ user }: { user: any }) => (
  <div
    className={`p-6 py-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
      user.isUser
        ? 'bg-primary/10 border-primary/20 scale-[1.02] shadow-lg shadow-primary/5 relative z-10'
        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'
    }`}
  >
    <div className="flex items-center gap-5">
      <span className={`text-xs font-black w-6 ${user.isUser ? 'text-primary' : 'text-slate-400'}`}>#{user.rank}</span>
      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg overflow-hidden border border-slate-100 dark:border-white/5">
        {user.avatar_url ? (
          <img 
            src={getThumbnailUrl(user.avatar_url, { width: 100 })} 
            className="w-full h-full object-cover" 
            alt={user.name}
            loading="lazy"
          />
        ) : '👤'}
      </div>
      <div>
        <p className={`text-sm font-bold ${user.isUser ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
          {user.name} {user.isUser && '(You)'}
        </p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{user.kg} KG Collected</p>
      </div>
    </div>
    {user.isUser && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
  </div>
));

function SellerLeaderboard() {
  const navigate = useNavigate();
  const profileId = useAuthStore(s => (s as any).profile?.id);
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, wallet_balance, avatar_url')
          .eq('role', 'seller')
          .order('wallet_balance', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formatted = (data || []).map((u, i) => ({
          id: u.id,
          name: u.id === profileId ? 'You' : (u.name || 'Anonymous'),
          revenue: u.wallet_balance || 0,
          rank: i + 1,
          isUser: u.id === profileId,
          avatarUrl: u.avatar_url || null,
        }));

        setTopSellers(formatted);
      } catch (err) {
        console.error('[Leaderboard] Catch Block Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = topSellers.length === 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── FIXED TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm z-50 transition-colors max-w-lg mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Market Masters</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em] mt-1">Global Merchant Ranking</p>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)] relative max-w-lg mx-auto w-full px-2">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-slate-900 dark:to-slate-900 p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl border border-emerald-500/20 dark:border-white/5">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 text-center">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2 italic tracking-tighter">Profit Dominance!</h2>
            <p className="text-[11px] font-semibold text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">
              Dominate the market to unlock premium buyer access and zero-fee withdrawals! 🚀
            </p>
          </div>
        </div>

        {isEmpty ? (
          <div className="px-6 mt-12 flex flex-col items-center text-center gap-6">
            <div className="w-28 h-28 rounded-full bg-emerald-500/10 border-2 border-dashed border-emerald-500/30 flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-emerald-500/40" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Masters Yet!</h3>
              <p className="text-xs font-semibold text-slate-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
                The market is wide open. Claim the <span className="text-emerald-500 font-semibold">#1 spot!</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/post-trade')}
              className="px-8 py-4 bg-emerald-600 text-white font-semibold text-sm rounded-2xl shadow-xl shadow-emerald-500/30 uppercase tracking-widest active:scale-95 transition-all"
            >
              Post First Trade 📈
            </button>
          </div>
        ) : (
          <>
            {/* Merchant Podium */}
            <div className="flex items-end justify-center gap-2 px-1 mt-12 mb-10 h-52">
              <MerchantPodiumSlot
                user={topSellers[1] || null}
                height="h-28"
                rank={2}
                isFirst={false}
              />
              <MerchantPodiumSlot
                user={topSellers[0] || null}
                height="h-40"
                rank={1}
                isFirst={true}
              />
              <MerchantPodiumSlot
                user={topSellers[2] || null}
                height="h-24"
                rank={3}
                isFirst={false}
              />
            </div>

            {/* Explanation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-5 flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Elite Merchant Status</h4>
                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                  Rankings are based on <span className="text-emerald-500 font-bold">Net Revenue</span>.
                  Higher ranks get prioritized for bulk marketplace contracts.
                </p>
              </div>
            </div>

            {/* Full List */}
            {topSellers.length > 3 && (
              <div className="flex flex-col gap-2 pb-24">
                <div className="flex items-center justify-between mb-2 px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Directory</span>
                </div>
                {topSellers.slice(3, visibleCount).map((user) => (
                  <SellerListItem key={user.id} user={user} />
                ))}
                
                {topSellers.length > visibleCount && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="mt-4 py-4 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 active:scale-95 transition-all"
                  >
                    Load More Rankings
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const profileId = useAuthStore(s => (s as any).profile?.id);
  const profileRole = useAuthStore(s => (s as any).profile?.role);
  
  if (profileRole === 'seller') {
    return <SellerLeaderboard />;
  }

  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, reward_points, avatar_url')
          .in('role', ['user', 'resident', 'client'])
          .gt('reward_points', 0)
          .order('reward_points', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formatted = (data || []).map((u, i) => ({
          id: u.id,
          name: u.id === profileId ? 'You' : (u.name || 'Anonymous'),
          kg: Math.floor((Number(u.reward_points) || 0) / 2),
          rank: i + 1,
          isUser: u.id === profileId,
          avatarUrl: u.avatar_url || null,
        }));

        setTopUsers(formatted);
      } catch (err) {
        console.error('[Leaderboard] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = topUsers.length === 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="pt-4 flex items-center gap-4 relative z-20 mb-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-semibold dark:text-white leading-tight">Champions</h1>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Global Leaderboard</p>
        </div>
      </div>

      <div className="mt-2">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-2xl text-white relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 text-center">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 italic tracking-tighter">Eco-Guardian!</h2>
            <p className="text-[11px] font-semibold text-white/80 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">
              Every KG you recycle pushes you higher in the global ranks. Top champions win exclusive Klinflow perks! 🎁
            </p>
          </div>
        </div>

        {isEmpty ? (
          <div className="px-6 mt-12 flex flex-col items-center text-center gap-6">
            <div className="w-28 h-28 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center">
              <Recycle className="w-12 h-12 text-primary/40" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No Champions Yet!</h3>
              <p className="text-xs font-semibold text-slate-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
                The leaderboard is waiting for its first eco-hero. claim the <span className="text-primary font-semibold">#1 spot!</span>
              </p>
            </div>
            <button
              onClick={() => navigate('/book-pickup')}
              className="px-8 py-4 bg-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-primary/30 uppercase tracking-widest active:scale-95 transition-all"
            >
              Claim the spot 🏆
            </button>
          </div>
        ) : (
          <>
            {/* Podium (Top 3) */}
            <div className="flex items-end justify-center gap-2 px-1 mt-10 mb-8 h-48">
              <PodiumSlot
                user={topUsers[1] || null}
                height="h-24"
                bgClass="bg-slate-200 dark:bg-slate-800"
                medalClass="text-slate-400"
                isFirst={false}
              />
              <PodiumSlot
                user={topUsers[0] || null}
                height="h-32"
                bgClass="bg-amber-100 dark:bg-amber-900/30 border-x border-t border-amber-200 dark:border-amber-700/50"
                medalClass=""
                isFirst={true}
              />
              <PodiumSlot
                user={topUsers[2] || null}
                height="h-20"
                bgClass="bg-orange-100 dark:bg-orange-900/20"
                medalClass="text-orange-400"
                isFirst={false}
              />
            </div>

            {/* Explanation Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 p-5 flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black dark:text-white uppercase tracking-widest leading-none mb-1">How to Rank Up</h4>
                <p className="text-[11px] font-semibold text-slate-400 leading-relaxed">
                  Rankings are based on your total <span className="text-primary font-bold">GFP Score</span>.
                  Earn 2 points for every KG of recyclables collected.
                </p>
              </div>
            </div>

            {/* Full List (rank 4+) */}
            {topUsers.length > 3 && (
              <div className="flex flex-col gap-2 pb-20">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 mb-2">Top Recyclers List</p>
                {topUsers.slice(3, visibleCount).map((user) => (
                  <ResidentListItem key={user.id} user={user} />
                ))}

                {topUsers.length > visibleCount && (
                  <button 
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="mt-4 py-4 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 active:scale-95 transition-all"
                  >
                    Load More Rankings
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
