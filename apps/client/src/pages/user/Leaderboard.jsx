/**
 * Leaderboard — Gamified Estate Ranking hub (Dynamic)
 */
import { useEffect, useState } from 'react';
import { Crown, Medal, Info, ArrowLeft, Sparkles, Recycle, Trophy, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, supabase } from '@cleanflow/core';

function SellerLeaderboard() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [topSellers, setTopSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, wallet_balance, avatar_url')
          .eq('role', 'seller')
          .order('wallet_balance', { ascending: false })
          .limit(100);

        if (error) throw error;

        const formatted = (data || []).map((u, i) => ({
          id: u.id,
          name: u.id === profile?.id ? 'You' : (u.name || 'Anonymous'),
          revenue: u.wallet_balance || 0,
          rank: i + 1,
          isUser: u.id === profile?.id,
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
  }, [profile?.id]);

  const MerchantPodiumSlot = ({ user, height, bgClass, isFirst }) => (
    <div className="flex flex-col items-center flex-1">
      <div className={`${isFirst ? 'w-20 h-20' : 'w-14 h-14'} rounded-[2rem] border-2 ${user ? (isFirst ? 'border-amber-400 bg-slate-900 shadow-amber-500/20' : 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800') : 'border-dashed border-slate-300 dark:border-slate-600'} flex items-center justify-center mb-3 relative overflow-hidden shadow-xl`}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl">{user ? '👤' : '—'}</span>
        )}
        {isFirst && <Crown className={`w-8 h-8 ${user ? 'text-amber-400' : 'text-slate-300'} absolute -top-1 right-0 -rotate-12`} />}
      </div>
      <div className={`w-full ${user ? bgClass : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700'} rounded-2xl ${height} flex flex-col items-center justify-center relative shadow-2xl`}>
        {user ? (
          <>
            <p className={`text-[10px] font-black ${isFirst ? 'text-amber-400' : 'text-slate-400'} uppercase tracking-widest truncate w-20 text-center mt-2`}>{user.name}</p>
            <p className={`font-black tracking-tighter ${isFirst ? 'text-base text-white' : 'text-[11px] text-emerald-500'}`}>KSh {user.revenue.toLocaleString()}</p>
          </>
        ) : (
          <p className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Open</p>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = topSellers.length === 0;

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden bg-slate-50 dark:bg-slate-900 transition-colors -mx-2">
      {/* Header - Compensated for negative margin */}
      <div className="px-8 pt-8 flex items-center gap-4 relative z-20 mb-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-semibold dark:text-white leading-tight">Market Masters</h1>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Global Merchant Ranking</p>
        </div>
      </div>

      <div className="">
        {/* Hero Banner - Theme Adaptive */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-slate-900 dark:to-slate-900 p-8 rounded-[2rem] mx-2 text-white relative overflow-hidden shadow-2xl border border-emerald-500/20 dark:border-white/5 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 text-center">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2 italic tracking-tighter">Profit Dominance!</h2>
            <p className="text-[10px] font-semibold text-slate-400 leading-relaxed max-w-[280px] mx-auto uppercase tracking-widest">
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
            <div className="flex items-end justify-center gap-4 px-8 mt-12 mb-10 h-52">
              <MerchantPodiumSlot
                user={topSellers[1] || null}
                height="h-28"
                bgClass="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                isFirst={false}
              />
              <MerchantPodiumSlot
                user={topSellers[0] || null}
                height="h-40"
                bgClass="bg-slate-900 dark:bg-slate-900 border-x border-t border-amber-400/30 shadow-amber-500/10"
                isFirst={true}
              />
              <MerchantPodiumSlot
                user={topSellers[2] || null}
                height="h-24"
                bgClass="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                isFirst={false}
              />
            </div>

            {/* Explanation Card */}
            <div className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 p-8 flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-black dark:text-white uppercase tracking-[0.2em] leading-none mb-1">Elite Merchant Status</h4>
                <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                  Rankings are based on <span className="text-emerald-500">Net Revenue</span>.
                  Higher ranks get prioritized for bulk marketplace contracts.
                </p>
              </div>
            </div>

            {/* Full List - True Edge to Edge */}
            {topSellers.length > 3 && (
              <div className="flex flex-col pb-24">
                <div className="flex items-center justify-between mb-4 px-8">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Merchant Directory</span>
                </div>
                {topSellers.slice(3).map((user) => (
                  <div 
                    key={user.id} 
                    className={`px-8 py-5 border-b flex items-center justify-between transition-all ${
                      user.isUser
                        ? 'bg-slate-900 dark:bg-slate-900/50 border-emerald-500/30 shadow-2xl relative z-10'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <span className={`text-[10px] font-black w-6 ${user.isUser ? 'text-emerald-400' : 'text-slate-400'}`}>#{user.rank}</span>
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg overflow-hidden border border-slate-100 dark:border-white/5">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : '👤'}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${user.isUser ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {user.name} {user.isUser && '(You)'}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Top Merchant</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black font-mono ${user.isUser ? 'text-emerald-400' : 'text-emerald-600'}`}>KSh {user.revenue.toLocaleString()}</p>
                      <p className="text-[8px] font-semibold text-slate-400 uppercase tracking-widest">Revenue</p>
                    </div>
                  </div>
                ))}
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
  const { profile } = useAuthStore();
  
  if (profile?.role === 'seller') {
    return <SellerLeaderboard />;
  }

  const [topUsers, setTopUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
          .limit(100);

        if (error) throw error;

        const formatted = (data || []).map((u, i) => ({
          id: u.id,
          name: u.id === profile?.id ? 'You' : (u.name || 'Anonymous'),
          kg: Math.floor((Number(u.reward_points) || 0) / 2),
          rank: i + 1,
          isUser: u.id === profile?.id,
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
  }, [profile?.id]);

  const PodiumSlot = ({ user, height, bgClass, medalClass, isFirst }) => (
    <div className="flex flex-col items-center flex-1">
      <div className={`${isFirst ? 'w-16 h-16' : 'w-12 h-12'} rounded-full border-2 ${user ? (isFirst ? 'border-amber-400 bg-amber-100' : 'border-slate-300 bg-slate-200 dark:bg-slate-700') : 'border-dashed border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800'} flex items-center justify-center mb-2 relative overflow-hidden shadow-sm`}>
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">{user ? '👤' : '—'}</span>
        )}
        {isFirst && <Crown className={`w-6 h-6 ${user ? 'text-amber-400' : 'text-slate-300'} absolute -top-5 rotate-12`} />}
      </div>
      <div className={`w-full ${user ? bgClass : 'bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700'} rounded-t-2xl ${height} flex flex-col items-center justify-center relative shadow-lg`}>
        {!isFirst && user && <Medal className={`w-6 h-6 ${medalClass} absolute -top-3`} />}
        {user ? (
          <>
            <p className={`text-[10px] font-semibold ${isFirst ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-white'} truncate w-20 text-center mt-2`}>{user.name}</p>
            <p className={`font-semibold ${isFirst ? 'text-lg text-amber-600' : 'text-[12px] text-primary'}`}>{user.kg} KG</p>
          </>
        ) : (
          <p className="text-[9px] font-semibold text-slate-300 dark:bg-slate-600 uppercase tracking-widest">Open</p>
        )}
        {isFirst && user && (
          <div className="absolute -bottom-2 bg-amber-400 text-white text-[10px] font-semibold px-4 py-1 rounded-full uppercase shadow-md">Hero</div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const isEmpty = topUsers.length === 0;

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">

      {/* Header */}
      <div className="p-6 pt-8 flex items-center gap-4 relative z-20">
        <button onClick={() => navigate(-1)} className="p-3 bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <div>
          <h1 className="text-xl font-semibold dark:text-white leading-tight">Champions</h1>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-widest">Global Leaderboard</p>
        </div>
      </div>

      <div className="-mt-4">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 rounded-[2.5rem] mx-2 text-white relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 text-center">
            <Crown className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2 italic">Eco-Guardian!</h2>
            <p className="text-xs font-semibold text-white/80 leading-relaxed max-w-[280px] mx-auto">
              Every KG you recycle pushes you higher in the global ranks. Top champions win exclusive CleanFlow perks! 🎁
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
            <div className="flex items-end justify-center gap-3 px-6 mt-10 mb-8 h-48">
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
            <div className="bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-white/5 p-6 flex items-start gap-4 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-semibold dark:text-white uppercase tracking-widest leading-none mb-1">How to Rank Up</h4>
                <p className="text-[10px] font-semibold text-slate-400 leading-relaxed">
                  Rankings are based on your total <span className="text-primary">GFP Score</span>.
                  Earn 2 points for every KG of recyclables collected.
                </p>
              </div>
            </div>

            {/* Full List (rank 4+) */}
            {topUsers.length > 3 && (
              <div className="flex flex-col gap-2 px-1.5 pb-20">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-6 mb-2">Top Recyclers List</p>
                {topUsers.slice(3).map((user) => (
                  <div
                    key={user.id}
                    className={`p-6 py-5 rounded-2xl border flex items-center justify-between transition-all ${
                      user.isUser
                        ? 'bg-primary/10 border-primary/20 scale-[1.02] shadow-lg shadow-primary/5'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <span className={`text-xs font-semibold w-6 ${user.isUser ? 'text-primary' : 'text-slate-400'}`}>#{user.rank}</span>
                      <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg overflow-hidden border border-slate-100 dark:border-white/5">
                        {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : '👤'}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${user.isUser ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                          {user.name} {user.isUser && '(You)'}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{user.kg} KG Collected</p>
                      </div>
                    </div>
                    {user.isUser && <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
