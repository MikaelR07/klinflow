/**
 * Earnings Page — Premium Financial Hub
 * Handles both Company Owner (Fleet Hub) and Individual Agent/Driver (Personal Wallet) views.
 * Restored the individual view to match the previously working JSX version.
 */
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Target,
  Star,
  Sparkles,
  Calendar,
  Package,
  ShieldCheck,
  Clock,
  ArrowLeft,
  ArrowUpRight,
  Truck,
  ChevronRight,
  MoreVertical,
  Download,
  AlertCircle,
  Briefcase,
  Scale,
  Zap,
  Plus,
  ArrowDownLeft,
  Banknote,
  History,
  Handshake
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function EarningsPage() {
  const navigate = useNavigate();
  const { earnings, jobHistory, fetchEarnings } = useAgentStore();
  const { profile, withdrawRewards } = useAuthStore();
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  const isOwner = profile?.agentAccountType === 'company_admin' || profile?.agentAccountType === 'owner';

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem(`agent_goals_${profile?.id}`);
    return saved ? JSON.parse(saved) : { weekly: 500, monthly: 2000 };
  });

  const handleGoalChange = (type: string, value: string) => {
    const val = value === '' ? '' : Number(value);
    const newGoals = { ...goals, [type]: val };
    setGoals(newGoals);
    localStorage.setItem(`agent_goals_${profile?.id}`, JSON.stringify(newGoals));
  };

  useEffect(() => {
    fetchEarnings();
    const timer = setTimeout(() => setIsChartReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleWithdraw = async () => {
    const balance = isOwner ? (profile?.walletBalance || 0) : (earnings.todayPayout || 0);
    if (balance < 100) {
      toast.warning("Minimum Withdrawal: KSh 100");
      return;
    }
    setIsWithdrawing(true);
    try {
      await withdrawRewards(balance);
      toast.success("Payout sent to M-Pesa! 💸");
    } catch (err) {
      toast.error("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isOwner) {
    return <OwnerView
      navigate={navigate}
      earnings={earnings}
      profile={profile}
      handleWithdraw={handleWithdraw}
      isWithdrawing={isWithdrawing}
      goals={goals}
      handleGoalChange={handleGoalChange}
      jobHistory={jobHistory}
      isChartReady={isChartReady}
    />;
  }

  return <IndividualView
    navigate={navigate}
    earnings={earnings}
    profile={profile}
    handleWithdraw={handleWithdraw}
    isWithdrawing={isWithdrawing}
    goals={goals}
    handleGoalChange={handleGoalChange}
    jobHistory={jobHistory}
    isChartReady={isChartReady}
  />;
}

/**
 * ── INDIVIDUAL AGENT / FLEET DRIVER VIEW ──
 * EXACT RESTORATION OF THE ORIGINAL JSX VERSION
 */
function IndividualView({ navigate, earnings, profile, handleWithdraw, isWithdrawing, goals, handleGoalChange, isChartReady }: any) {
  return (
    <div className="space-y-6 animate-fade-in pb-24 pt-[calc(env(safe-area-inset-top,1rem)+2rem)]">

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Dashboard</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Performance Overview</p>
          </div>
          <button className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all">
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* ── DASHBOARD HERO: PERFORMANCE HUD ── */}
      <div className="relative group px-1">
        <div className="relative bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-[1rem] p-3 overflow-hidden  transition-all duration-500">

          <div className="relative z-10">
            <div className="grid grid-cols-3 gap-3">

              {/* 1. Main Stock Value (Bento Anchor - 2x2) */}
              <div className="col-span-2 row-span-2 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">

                <div>
                  <p className="text-[12px] font-black text-emerald-300/80 uppercase tracking-widest mb-2.5 leading-none">
                    Total Stock Value
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-emerald-400">KSh</span>
                    <h2 className="text-2xl font-black text-white">{(profile?.walletBalance || 0).toLocaleString()}</h2>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-100 text-[9px] font-black px-2 py-1 rounded-full w-fit tracking-wide">
                    ↑ 12% from last week
                  </div>
                </div>

              </div>

              {/* 2. Rating (1x1) */}
              <div className="col-span-1 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-300/60 capitalize tracking-widest">Rating</p>
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                </div>
                <h4 className="text-lg font-black text-white leading-none">{Number(profile?.rating ?? 0).toFixed(1)}</h4>
              </div>

              {/* 3. Points (1x1) */}
              <div className="col-span-1 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-emerald-300/60 capitalize tracking-widest">Points</p>
                  <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                </div>
                <h4 className="text-lg font-black text-emerald-400 leading-none">{profile?.rewardPoints || 0}</h4>
              </div>

              {/* 4. Total Weight (1x1) */}
              <div className="col-span-1 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <Scale className="w-4 h-4 text-emerald-400" />
                <div className="mt-1">
                  <h3 className="text-base font-black text-white leading-none">{(earnings.totalKg || 0).toFixed(1)}</h3>
                  <p className="text-[9px] font-black text-emerald-300/60 capitalize tracking-widest mt-1">Total KGs</p>
                </div>
              </div>

              {/* 5. Total Bids (1x1) */}
              <div className="col-span-1 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <Handshake className="w-4 h-4 text-emerald-400" />
                <div className="mt-1">
                  <h3 className="text-base font-black text-white leading-none">{earnings.marketTrades || 0}</h3>
                  <p className="text-[9px] font-black text-emerald-300/60 capitalize tracking-widest mt-1">Total Bids</p>
                </div>
              </div>

              {/* 6. Total Pickups (1x1) */}
              <div className="col-span-1 bg-emerald-950/40 rounded-2xl p-4 flex flex-col justify-between">
                <Truck className="w-4 h-4 text-emerald-400" />
                <div className="mt-1">
                  <h3 className="text-base font-black text-white leading-none">{earnings.totalJobs || 0}</h3>
                  <p className="text-[9px] font-black text-emerald-300/60 capitalize tracking-widest mt-1">Pickups</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── ACQUISITION GOALS ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400">Acquisition Targets</h3>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Goal Tracker (KG)</p>
          </div>
          <Target className="w-6 h-6 text-emerald-500 opacity-20" />
        </div>

        <div className="space-y-6 px-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Weekly Target</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                <span className="text-xs font-semibold text-slate-400 capitalize">/</span>
                <input
                  type="number"
                  value={goals.weekly}
                  onChange={(e) => handleGoalChange('weekly', e.target.value)}
                  className="w-14 bg-transparent text-xs font-semibold text-slate-400 text-right outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:text-emerald-500 transition-colors"
                />
                <span className="text-xs font-semibold text-slate-400 capitalize">KG</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.weekly, 1)) * 100, 100)}%` }} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Target</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                <span className="text-xs font-semibold text-slate-400 capitalize">/</span>
                <input
                  type="number"
                  value={goals.monthly}
                  onChange={(e) => handleGoalChange('monthly', e.target.value)}
                  className="w-14 bg-transparent text-xs font-semibold text-slate-400 text-right outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:text-emerald-500 transition-colors"
                />
                <span className="text-xs font-semibold text-slate-400 capitalize">KG</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.monthly, 1)) * 100, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── WEEKLY PERFORMANCE GRAPH ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400">Collection Volume</h3>
            <p className="text-sm font-black text-slate-900 dark:text-white capitalize tracking-tight">Weekly Recovery</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-500">{(earnings.thisWeekKg || 0).toFixed(0)} KG This Week</span>
          </div>
        </div>

        <div className="w-full mt-4">
          {earnings?.weeklyData?.length > 0 && (() => {
            const weeklyData = earnings.weeklyData;

            const maxWeight = Math.max(
              ...weeklyData.map((item: any) => item.weight),
              1
            );

            const todayIndex = (new Date().getDay() + 6) % 7;

            return (
              <div className="flex items-end justify-between gap-3 h-[190px] px-1">
                {weeklyData.map((item: any, index: number) => {
                  const barHeight =
                    (item.weight / maxWeight) * 120;

                  const isToday = index === todayIndex;

                  return (
                    <div
                      key={item.day}
                      className="flex flex-col items-center flex-1 group"
                    >
                      {/* Chart Area */}
                      <div className="relative flex items-end h-[130px]">

                        {/* Tooltip */}
                        <div className="
                  absolute
                  -top-8
                  opacity-0
                  group-hover:opacity-100
                  transition-all
                  duration-300
                  bg-slate-900
                  text-white
                  text-[10px]
                  font-semibold
                  px-2.5
                  py-1
                  rounded-lg
                  shadow-xl
                  pointer-events-none
                  whitespace-nowrap
                ">
                          {item.weight.toFixed(1)} KG
                        </div>

                        {/* Bar */}
                        <div
                          className={`
                    w-7
                    rounded-[14px]
                    transition-all
                    duration-700
                    ease-out
                    shadow-sm
                    ${isToday
                              ? "bg-emerald-500 shadow-emerald-200"
                              : "bg-slate-200"
                            }
                  `}
                          style={{
                            height: `${barHeight}px`,
                            minHeight: "14px",
                          }}
                        />
                      </div>

                      {/* Day Label */}
                      <p className="
                text-[11px]
                font-medium
                text-slate-400
                mt-3
              ">
                        {item.day}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/**
 * ── COMPANY OWNER VIEW ──
 * Focuses on fleet-wide financial liquidity and stock value.
 */
function OwnerView({ navigate, earnings, profile, handleWithdraw, isWithdrawing, goals, handleGoalChange, jobHistory, isChartReady }: any) {
  return (
    <div className="space-y-8 animate-fade-in pb-20 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Financial Hub</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Fleet Revenue & Liquidity</p>
          </div>
          <button className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all">
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative group perspective-1000 h-full">
          <div className="relative bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-[2rem] p-6 shadow-xl shadow-emerald-900/20 overflow-hidden flex flex-col justify-between h-full min-h-[200px]">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-emerald-200/80 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                  <Package className="w-3.5 h-3.5" />
                </div>
                Stock Value
              </div>
              <h2 className="text-4xl font-bold text-white tracking-tighter">
                KSh {Number(earnings.inventoryValue || 0).toLocaleString()}
              </h2>
              <div className="mt-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-200 capitalize tracking-widest">Liquid Assets</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group h-full">
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-full min-h-[200px] transition-all hover:border-emerald-500/50">
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Total Fleet Payout
              </div>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
                KSh {Number(earnings.total || 0).toLocaleString()}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-2">Fleet Total Volume</p>
            </div>
          </div>
        </div>

        <div className="relative group h-full">
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-full min-h-[200px] transition-all hover:border-amber-500/50">
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-50 dark:bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  Settlement Wallet
                </div>
                <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
                  KSh {Number(profile?.walletBalance || 0).toLocaleString()}
                </h2>
              </div>
              <button onClick={handleWithdraw} disabled={isWithdrawing} className="px-4 py-2 bg-amber-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50">
                {isWithdrawing ? <Clock className="w-4 h-4 animate-spin" /> : <ArrowDownLeft className="w-4 h-4" />}
                <span className="text-[10px] font-bold capitalize tracking-widest">Withdraw</span>
              </button>
            </div>
            <div className="mt-4 flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-amber-500 capitalize tracking-widest">M-Pesa Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 capitalize tracking-widest">Collection Volume</h3>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">Weekly Fleet Recovery (KG)</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-emerald-500 capitalize tracking-widest">{(earnings.thisWeekKg || 0).toFixed(0)} KG</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            {isChartReady && (
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <BarChart data={earnings.weeklyData || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(v) => `${v}kg`} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} content={({ active, payload }) => active && payload && (
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-bold">{payload[0].value.toFixed(1)} KG</div>
                  )} />
                  <Bar dataKey="weight" radius={[6, 6, 6, 6]} barSize={32}>
                    {(earnings.weeklyData || []).map((entry: any, index: number) => {
                      const todayIndex = (new Date().getDay() + 6) % 7;
                      return <Cell key={`cell-${index}`} fill={index === todayIndex ? '#10b981' : '#334155'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-sm space-y-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 capitalize tracking-widest mb-1">Fleet Targets</h3>
            <p className="text-lg font-bold text-slate-900 dark:text-white">Active Goals</p>
          </div>
          <div className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 capitalize tracking-widest">Weekly (KG)</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                  <span className="text-slate-300">/</span>
                  <input type="number" value={goals.weekly} onChange={(e) => handleGoalChange('weekly', e.target.value)} className="w-12 bg-transparent text-sm font-bold text-slate-400 text-right outline-none border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.weekly, 1)) * 100, 100)}%` }} className="h-full bg-emerald-500 rounded-full" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 capitalize tracking-widest">Monthly (KG)</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                  <span className="text-slate-300">/</span>
                  <input type="number" value={goals.monthly} onChange={(e) => handleGoalChange('monthly', e.target.value)} className="w-12 bg-transparent text-sm font-bold text-slate-400 text-right outline-none border-b border-dashed border-slate-200 dark:border-slate-700 focus:border-emerald-500 transition-colors" />
                </div>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.monthly, 1)) * 100, 100)}%` }} className="h-full bg-blue-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
