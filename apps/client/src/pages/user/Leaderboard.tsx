import { useEffect, useState, useMemo, memo } from 'react';
import { Crown, Medal, Info, ArrowLeft, Sparkles, Recycle, Trophy, TrendingUp, User as UserIcon, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';

// ── PODIUM SLOT (Shared by both Resident & Seller) ─────────────────────────

const PodiumCard = memo(({ user, rank, metric, metricLabel }: { user: any; rank: number; metric: string; metricLabel: string }) => {
  const isFirst = rank === 1;

  const rankConfig: Record<number, { ring: string; bg: string; badge: string; badgeText: string; size: string }> = {
    1: {
      ring: 'ring-amber-400 ring-[3px]',
      bg: 'bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-900/10',
      badge: 'bg-amber-400 text-amber-950',
      badgeText: '🏆',
      size: 'w-[72px] h-[72px]',
    },
    2: {
      ring: 'ring-slate-300 dark:ring-slate-600 ring-2',
      bg: 'bg-slate-50 dark:bg-slate-800/60',
      badge: 'bg-slate-400 text-white',
      badgeText: '🥈',
      size: 'w-14 h-14',
    },
    3: {
      ring: 'ring-emerald-400 dark:ring-emerald-600 ring-2',
      bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
      badge: 'bg-emerald-500 text-white',
      badgeText: '🥉',
      size: 'w-14 h-14',
    },
  };

  const config = rankConfig[rank] || rankConfig[3];

  return (
    <div className={`flex flex-col items-center flex-1 ${isFirst ? '-mt-4' : 'mt-2'}`}>
      {/* Avatar */}
      <div className="relative mb-2">
        <div className={`relative ${config.size} rounded-full ${config.ring} overflow-hidden ${user ? config.bg : 'bg-slate-100 dark:bg-slate-800 ring-2 ring-dashed ring-slate-200 dark:ring-slate-700'} flex items-center justify-center shadow-sm`}>
          {user?.avatar_url ? (
            <OptimizedImage
              src={getThumbnailUrl(user.avatar_url, { width: isFirst ? 200 : 150 })}
              className="w-full h-full object-cover"
              wrapperClassName="relative w-full h-full"
              alt={user.name}
            />
          ) : (
            <UserIcon className={`${isFirst ? 'w-7 h-7' : 'w-5 h-5'} ${user ? 'text-slate-400' : 'text-slate-300 dark:text-slate-600'}`} />
          )}
        </div>
        {/* Rank badge */}
        <div className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${config.badge} text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md`}>
          {config.badgeText}
        </div>
      </div>

      {/* Info */}
      <div className={`w-full ${config.bg} border border-slate-100 dark:border-slate-700/40 rounded-xl ${isFirst ? 'p-3 pt-4' : 'p-2.5 pt-3'} text-center mt-1`}>
        <p className={`${isFirst ? 'text-[12px]' : 'text-[11px]'} font-bold text-slate-900 dark:text-white truncate leading-none mb-1`}>
          {user?.name || '—'}
        </p>
        {user ? (
          <p className={`${isFirst ? 'text-[13px]' : 'text-[11px]'} font-black ${rank === 1 ? 'text-amber-600 dark:text-amber-400' : rank === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'} leading-none`}>
            {metric}
          </p>
        ) : (
          <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600">Open</p>
        )}
        {user && (
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{metricLabel}</p>
        )}
      </div>
    </div>
  );
});

// ── LIST ITEM (Shared) ─────────────────────────

const RankListItem = memo(({ user, metric, metricLabel }: { user: any; metric: string; metricLabel: string }) => (
  <div
    className={`px-4 py-3.5 rounded-xl border flex items-center gap-3.5 transition-all ${user.isUser
      ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
      : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/40'
      }`}
  >
    {/* Rank */}
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-black ${user.isUser
      ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-600 dark:text-emerald-400'
      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
    }`}>
      {user.rank}
    </div>

    {/* Avatar */}
    <div className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700/50">
      {user.avatar_url ? (
        <OptimizedImage
          src={getThumbnailUrl(user.avatar_url, { width: 100 })}
          className="w-full h-full object-cover"
          wrapperClassName="relative w-full h-full"
          alt={user.name}
        />
      ) : (
        <UserIcon className="w-4.5 h-4.5 text-slate-400" />
      )}
    </div>

    {/* Name */}
    <div className="flex-1 min-w-0">
      <p className={`text-[13px] font-bold leading-none mb-0.5 truncate ${user.isUser ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
        {user.name} {user.isUser && <span className="text-[10px] font-medium text-emerald-500">(You)</span>}
      </p>
      <p className="text-[10px] font-medium text-slate-400 leading-none">{metricLabel}</p>
    </div>

    {/* Metric */}
    <div className="text-right shrink-0">
      <p className={`text-[13px] font-black leading-none ${user.isUser ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
        {metric}
      </p>
    </div>
  </div>
));

// ══════════════════════════════════════════════════
// SELLER LEADERBOARD
// ══════════════════════════════════════════════════

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
          .from('user_wallets')
          .select(`
            user_id,
            cash_balance,
            profiles!inner (
              name,
              role,
              avatar_url
            )
          `)
          .eq('profiles.role', 'seller')
          .order('cash_balance', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formatted = (data || []).map((w, i) => {
          const p = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
          return {
            id: w.user_id,
            name: w.user_id === profileId ? 'You' : (p?.name || 'Anonymous'),
            revenue: w.cash_balance || 0,
            rank: i + 1,
            isUser: w.user_id === profileId,
            avatar_url: p?.avatar_url || null,
          };
        });

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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-950 relative overflow-x-hidden">

      {/* ── TOP SECTION: PREMIUM FINTECH GRADIENT ── */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 pt-[calc(env(safe-area-inset-top,1.5rem)+5rem)] pb-8 rounded-b-[2.5rem] shadow-lg shadow-indigo-900/30 relative z-20 overflow-hidden">

        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.07] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        {/* Fixed Header — transparent, minimal */}
        <div className="fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 px-5 max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-all border border-white/15">
            <ArrowLeft className="w-4.5 h-4.5 text-white/90" />
          </button>
          <p className="text-[13px] font-semibold tracking-wide text-white/80">Market Masters</p>
          <div className="w-9 h-9" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-5">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 border border-white/10">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight mb-1">Profit Dominance</h2>
          <p className="text-[11px] font-medium text-white/60 leading-snug max-w-[260px] mx-auto">
            Top merchants unlock premium buyer access and zero-fee withdrawals.
          </p>
        </div>
      </div>

      <div className="px-3 mt-2 space-y-4 relative z-10 max-w-lg mx-auto pb-24">

        {isEmpty ? (
          <div className="px-6 mt-12 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">No Masters Yet</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                The market is wide open. Claim the <span className="text-indigo-500 font-bold">#1 spot</span>!
              </p>
            </div>
            <button
              onClick={() => navigate('/post-trade')}
              className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
            >
              Post First Trade
            </button>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="flex items-end justify-center gap-2.5 px-2 mt-8 mb-4">
              <PodiumCard user={topSellers[1] || null} rank={2} metric={`KSh ${(topSellers[1]?.revenue || 0).toLocaleString()}`} metricLabel="Revenue" />
              <PodiumCard user={topSellers[0] || null} rank={1} metric={`KSh ${(topSellers[0]?.revenue || 0).toLocaleString()}`} metricLabel="Revenue" />
              <PodiumCard user={topSellers[2] || null} rank={3} metric={`KSh ${(topSellers[2]?.revenue || 0).toLocaleString()}`} metricLabel="Revenue" />
            </div>

            {/* Info */}
            <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl p-4 flex items-start gap-3 border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Info className="w-4.5 h-4.5 text-indigo-500" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em] leading-none mb-1">Elite Merchant Status</h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Rankings are based on <span className="text-indigo-600 dark:text-indigo-400 font-bold">Net Revenue</span>. Higher ranks get prioritized for bulk marketplace contracts.
                </p>
              </div>
            </div>

            {/* Full List */}
            {topSellers.length > 3 && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 px-1 mb-1">All Rankings</span>
                {topSellers.slice(3, visibleCount).map((user) => (
                  <RankListItem key={user.id} user={user} metric={`KSh ${user.revenue.toLocaleString()}`} metricLabel="Revenue" />
                ))}

                {topSellers.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="mt-2 py-3.5 w-full bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl text-[11px] font-bold text-slate-500 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ChevronUp className="w-3.5 h-3.5 rotate-180" /> Load More
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

// ══════════════════════════════════════════════════
// RESIDENT LEADERBOARD (DEFAULT EXPORT)
// ══════════════════════════════════════════════════

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
        // Try the RPC first (if deployed), otherwise fall back to client-side aggregation
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('get_resident_leaderboard');

        if (!rpcError && rpcData && rpcData.length > 0) {
          const formatted = rpcData.map((user: any, i: number) => ({
            id: user.user_id,
            name: user.user_id === profileId ? 'You' : (user.name || 'Anonymous'),
            kg: Number(user.total_weight) || 0,
            rank: Number(user.rank) || (i + 1),
            isUser: user.user_id === profileId,
            avatar_url: user.avatar_url || null,
          }));
          setTopUsers(formatted);
          return;
        }

        // Fallback: fetch completed bookings and aggregate weights client-side
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            user_id,
            actual_weight_kg,
            weight_kg,
            profiles:user_id (
              name,
              role,
              avatar_url
            )
          `)
          .eq('status', 'completed');

        if (bookingsError) throw bookingsError;

        // Aggregate by user
        const userMap = new Map<string, { name: string; avatarUrl: string | null; totalWeight: number }>();

        (bookingsData || []).forEach((b: any) => {
          const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
          const role = p?.role || '';
          // Only include residents/users/clients
          if (!['user', 'resident', 'client'].includes(role)) return;

          const weight = Number(b.actual_weight_kg) || Number(b.weight_kg) || 0;
          const existing = userMap.get(b.user_id);
          if (existing) {
            existing.totalWeight += weight;
          } else {
            userMap.set(b.user_id, {
              name: p?.name || 'Anonymous',
              avatarUrl: p?.avatar_url || null,
              totalWeight: weight,
            });
          }
        });

        // Sort by weight descending and assign ranks
        const sorted = Array.from(userMap.entries())
          .filter(([_, v]) => v.totalWeight > 0)
          .sort((a, b) => b[1].totalWeight - a[1].totalWeight);

        const formatted = sorted.map(([userId, info], i) => ({
          id: userId,
          name: userId === profileId ? 'You' : info.name,
          kg: Math.round(info.totalWeight * 10) / 10,
          rank: i + 1,
          isUser: userId === profileId,
          avatar_url: info.avatarUrl,
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
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900  transition-colors">
      {/* ── GRADIENT TOP BACKGROUND ── */}
      <div className="absolute top-0 left-0 right-0 h-[420px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
        {/* Decorative circles */}
        <div className="absolute top-10 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-40 h-40 bg-indigo-300/15 rounded-full blur-3xl -translate-x-1/4 pointer-events-none" />
        {/* Bottom curve */}
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-slate-50 dark:bg-slate-900 rounded-t-[2.5rem]" />
      </div>

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-tr from-purple-400 to-indigo-500 dark:from-purple-600 dark:to-indigo-700 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 shrink-0 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all border border-white/10">
            <ArrowLeft className="w-4.5 h-4.5 text-white" />
          </button>
          <div>
            <h1 className="text-[15px] font-black text-white tracking-tight leading-none">Champions</h1>
            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-0.5">Eco Leaderboard</p>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4rem)] relative max-w-lg mx-auto w-full px-3 z-10">
        {/* Hero */}

        {isEmpty ? (
          <div className="px-6 mt-16 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Recycle className="w-8 h-8 text-primary/40" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">No Champions Yet</h3>
              <p className="text-[12px] font-medium text-slate-500 mt-1 max-w-[240px] mx-auto leading-relaxed">
                The leaderboard is waiting for its first eco-hero. Claim the <span className="text-primary font-bold">#1 spot</span>!
              </p>
            </div>
            <button
              onClick={() => navigate('/book-pickup')}
              className="px-6 py-3.5 bg-primary hover:bg-primary/90 text-white font-bold text-[13px] rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              Claim the Spot 🏆
            </button>
          </div>
        ) : (
          <>
           

            {/* Podium */}
            <div className="flex items-end justify-center gap-2.5 px-2 mb-6 relative z-10 mt-24">
              <PodiumCard user={topUsers[1] || null} rank={2} metric={`${(topUsers[1]?.kg || 0)} KG`} metricLabel="Collected" />
              <PodiumCard user={topUsers[0] || null} rank={1} metric={`${(topUsers[0]?.kg || 0)} KG`} metricLabel="Collected" />
              <PodiumCard user={topUsers[2] || null} rank={3} metric={`${(topUsers[2]?.kg || 0)} KG`} metricLabel="Collected" />
            </div>

            {/* Info */}
            <div className="bg-slate-100 dark:bg-slate-800/40 rounded-xl p-3.5 flex items-start gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mb-1">How to Rank Up</h4>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  Every KG recycled pushes you higher. Top champions get recognition and win exclusive Klinflow perks!
                </p>
              </div>
            </div>

            {/* Full List (rank 4+) */}
            {topUsers.length > 3 && (
              <div className="flex flex-col gap-2 pb-24">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-1 mb-1">All Rankings</span>
                {topUsers.slice(3, visibleCount).map((user) => (
                  <RankListItem key={user.id} user={user} metric={`${user.kg} KG`} metricLabel="Collected" />
                ))}

                {topUsers.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount(prev => prev + 20)}
                    className="mt-3 py-3.5 w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/40 rounded-xl text-[11px] font-bold text-slate-500 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                  >
                    <ChevronUp className="w-3.5 h-3.5 rotate-180" /> Load More
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
