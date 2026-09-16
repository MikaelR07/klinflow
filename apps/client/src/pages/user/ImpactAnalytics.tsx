import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Target,
  Recycle,
  Trophy,
  Calendar,
  ArrowLeft,
  ChevronRight,
  Zap,
  BarChart,
  Package,
  Scale,
  Sparkles,
  PieChart,
  Edit3,
  Cloud,
  Bell,
  Truck,
  Wallet,
  Star,
  Leaf,
  Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { supabase } from "@klinflow/supabase";
import { normalizeKeys } from "@klinflow/core/validation";
import { toast } from "sonner";
import { OptimizedImage } from "@klinflow/ui";
import { walletService } from "@klinflow/core";

export default function ImpactAnalytics() {
  const { profile } = useAuthStore() as any;
  const { bookings, fetchBookings } = useBookingStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalType, setGoalType] = useState("weekly"); // 'weekly' or 'monthly'
  const [gfpPoints, setGfpPoints] = useState(0);

  // Goals State (Persisted in localStorage for now)
  const [goals, setGoals] = useState({ weekly: 10, monthly: 50 });

  useEffect(() => {
    if (profile?.id) {
      const saved = localStorage.getItem(`user_goals_${profile.id}`);
      if (saved) {
        setGoals(JSON.parse(saved));
      }
    }
  }, [profile?.id]);

  const [lifetimeStats, setLifetimeStats] = useState<any>({
    totalWeight: 0,
    totalPickups: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    globalRank: null,
    topMaterial: "None",
    weeklyData: [],
    currentWeekWeight: 0,
    currentMonthWeight: 0,
    monthlyGrowth: 0,
    activeStreak: 0,
    consistencyTier: "Getting Started",
    plasticKg: 0,
  });

  useEffect(() => {
    const fetchLifetimeData = async () => {
      if (!profile?.id) return;
      setIsLoading(true);

      // Fetch ALL completed bookings
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", profile.id)
        .eq("status", "completed");

      if (!error && data) {
        const now = new Date();
        const completed = (data as any[]).map((b) => normalizeKeys(b));

        const totalWeight = completed.reduce(
          (sum: number, b: any) =>
            sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0),
          0,
        );
        const totalPickups = completed.length;
        const totalEarnings = completed.reduce(
          (sum: number, b: any) =>
            sum + (Number(b.totalPrice) || Number(b.fee) || 0),
          0,
        );

        // Most Sold Material
        const materialCounts: Record<string, number> = {};
        completed.forEach((b: any) => {
          const type = b.wasteType || "General";
          materialCounts[type] =
            (materialCounts[type] || 0) +
            (Number(b.actualWeightKg) || Number(b.weightKg) || 1);
        });

        const topMaterial = Object.entries(materialCounts).sort(
          (a, b) => b[1] - a[1],
        )[0] || ["None", 0];

        const plasticKg = Object.entries(materialCounts)
          .filter(([type]) => type.toLowerCase().includes("plastic") || type.toLowerCase().includes("recyclable"))
          .reduce((sum, [_, weight]) => sum + weight, 0);

        // Weekly progress (Current Week: Mon-Sun)
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMonday =
          today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diffToMonday));
        monday.setHours(0, 0, 0, 0);

        const currentWeekDays = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return d.toLocaleDateString("en-CA");
        });

        const weeklyData = currentWeekDays.map((dateStr) => {
          const weightOnDay = completed
            .filter((b: any) => {
              const bDate = new Date(
                (b.updatedAt || b.createdAt) as string,
              ).toLocaleDateString("en-CA");
              return bDate === dateStr;
            })
            .reduce(
              (sum: number, b: any) =>
                sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0),
              0,
            );
          return { date: dateStr, weight: weightOnDay };
        });

        const currentWeekWeight = weeklyData.reduce(
          (sum, d) => sum + d.weight,
          0,
        );

        const currentMonthWeight = completed
          .filter((b: any) => {
            const d = new Date((b.updatedAt || b.createdAt) as string);
            return (
              d.getMonth() === now.getMonth() &&
              d.getFullYear() === now.getFullYear()
            );
          })
          .reduce(
            (sum: number, b: any) =>
              sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0),
            0,
          );

        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const lastMonthWeight = completed
          .filter((b: any) => {
            const d = new Date((b.updatedAt || b.createdAt) as string);
            return (
              d.getMonth() === lastMonth.getMonth() &&
              d.getFullYear() === lastMonth.getFullYear()
            );
          })
          .reduce(
            (sum: number, b: any) =>
              sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0),
            0,
          );

        const monthlyGrowth = lastMonthWeight > 0
          ? Math.round(((currentMonthWeight - lastMonthWeight) / lastMonthWeight) * 100)
          : currentMonthWeight > 0 ? 100 : 0;

        // Global rank will be computed later after walletData is fetched
        let globalRank = 0;

        // Fetch Total Withdrawn
        const { data: withdrawals } = await supabase
          .from("rewards_ledger")
          .select("amount_cashback")
          .eq("profile_id", profile.id)
          .eq("transaction_type", "withdrawal");

        const totalWithdrawn = Math.abs(
          withdrawals?.reduce(
            (sum: number, w: any) => sum + (Number(w.amount_cashback) || 0),
            0,
          ) || 0,
        );

        // Calculate Daily Streak
        const completedDates = [
          ...new Set(
            completed.map((b: any) =>
              new Date(
                (b.updatedAt || b.createdAt) as string,
              ).toLocaleDateString("en-CA"),
            ),
          ),
        ]
          .sort()
          .reverse();
        let activeStreak = 0;
        if (completedDates.length > 0) {
          const today = new Date().toLocaleDateString("en-CA");
          const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
            "en-CA",
          );

          if (completedDates[0] === today || completedDates[0] === yesterday) {
            activeStreak = 1;
            for (let i = 0; i < completedDates.length - 1; i++) {
              const current = new Date(completedDates[i] as string);
              const prev = new Date(completedDates[i + 1] as string);
              const diffTime = Math.abs(current.getTime() - prev.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 1) {
                activeStreak++;
              } else {
                break;
              }
            }
          }
        }

        const consistencyTier =
          activeStreak >= 7
            ? "Elite Recycler"
            : activeStreak >= 3
              ? "Eco Warrior"
              : "Rising Star";

        setLifetimeStats({
          totalWeight,
          totalPickups,
          totalEarnings,
          totalWithdrawn,
          globalRank,
          topMaterial: topMaterial[0],
          weeklyData,
          currentWeekWeight,
          currentMonthWeight,
          monthlyGrowth,
          activeStreak,
          consistencyTier,
          plasticKg,
        });
      }

      // Fetch actual GFP points and correct rank from wallet
      const walletData = await walletService.getWalletDetails(profile.id);
      if (walletData) {
        setGfpPoints(walletData.available_points);
        
        // Compute correct global rank based on the true resident leaderboard
        let userRank = 1;
        const { data: leaderboard, error: rpcErr } = await supabase.rpc("get_resident_leaderboard");
        if (!rpcErr && leaderboard && leaderboard.length > 0) {
          userRank = leaderboard.find((u: any) => u.user_id === profile.id)?.rank || 1;
        } else {
          // Fallback: fetch all completed bookings and compute rank client-side
          const { data: allBookings } = await supabase
            .from("bookings")
            .select("user_id, actual_weight_kg, weight_kg, profiles:user_id(role)")
            .eq("status", "completed");

          if (allBookings) {
            const weightByUser = new Map<string, number>();
            allBookings.forEach((b: any) => {
              const p = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
              const role = p?.role || '';
              if (!['user', 'resident', 'client'].includes(role)) return;
              const w = Number(b.actual_weight_kg) || Number(b.weight_kg) || 0;
              weightByUser.set(b.user_id, (weightByUser.get(b.user_id) || 0) + w);
            });
            // Count how many residents have more weight than current user
            const myWeight = weightByUser.get(profile.id) || 0;
            let ahead = 0;
            weightByUser.forEach((w) => { if (w > myWeight) ahead++; });
            userRank = ahead + 1;
          }
        }
          
        setLifetimeStats(prev => ({
          ...prev,
          globalRank: userRank
        }));
      }

      setIsLoading(false);
    };

    fetchLifetimeData();
  }, [profile?.id]);

  const stats = lifetimeStats;

  const handleUpdateGoal = (value: any) => {
    const newGoals: any = { ...goals, [goalType]: Number(value) };
    setGoals(newGoals);
    localStorage.setItem(`user_goals_${profile?.id}`, JSON.stringify(newGoals));
    setShowGoalModal(false);
    toast.success(
      `${goalType.charAt(0).toUpperCase() + goalType.slice(1)} goal updated!`,
    );
  };

  const weeklyProgress = Math.min(
    (stats.currentWeekWeight / goals.weekly) * 100,
    100,
  );
  const monthlyProgress = Math.min(
    (stats.currentMonthWeight / goals.monthly) * 100,
    100,
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">
            Crunching Impact Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-slate-50 dark:bg-slate-800 transition-colors pb-10">
      
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-slate-50/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight leading-none mb-1">
                Impact Analytics
              </h1>
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500">
                Your recycling. Your impact.
              </p>
            </div>
          </div>

        </div>
      </div>

      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)]">

        {/* ── HERO CARD (EARTHY GREEN) ── */}
        <div className="bg-[#00563B] rounded-[1rem] p-4 sm:p-5 relative overflow-hidden">
          {/* Earth background image */}
          <div className="absolute inset-0 pointer-events-none">
            <img src="/vectors/earth.webp" alt="Earth" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#00563B]/80 via-[#00563B]/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#00563B]/90 via-[#00563B]/10 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col items-start mb-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-700 text-emerald-100 rounded-lg text-[10px] font-bold mb-2 border border-white/10">
              <Leaf className="w-3.5 h-3.5" /> Your Impact
            </div>
            <p className="text-[11px] font-medium text-emerald-100/80 mb-1">Total Waste Recycled</p>
            <div className="flex items-end gap-3 mb-1">
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none">{stats.totalWeight}</h2>
                <span className="text-sm font-bold text-emerald-400">KG</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 pt-4 border-t border-white/10">
            <p className="text-[9px] font-medium text-emerald-100/70 mb-3">This is equivalent to:</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                  <Leaf className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-0.5">{Math.round(stats.totalWeight * 0.15)}</p>
                  <p className="text-[10px] text-emerald-100">Trees saved</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-0.5">{Math.round(stats.totalWeight * 2.5)}</p>
                  <p className="text-[10px] text-emerald-100">KWh Saved</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-0.5">{Math.round(stats.totalWeight * 1.8)}</p>
                  <p className="text-[10px] text-emerald-100">CO₂ Offset</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS STRIP (Horizontal Scroll) ── */}
        <div className="!mt-3">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1 mb-2">Your Stats at a Glance</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1.5 px-1.5 pb-1">
            {[
              { label: 'Total Earned', value: `KSh ${stats.totalEarnings.toLocaleString()}`, icon: Wallet, bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
              { label: 'Rank', value: `#${stats.globalRank || '—'}`, icon: Trophy, bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { label: 'Total Pickups', value: `${stats.totalPickups}`, icon: Truck, bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { label: 'Total GFP', value: `${gfpPoints.toLocaleString()}`, icon: Star, bg: 'bg-amber-100 dark:bg-amber-900/30' },
            ].map((stat, i) => (
              <div key={i} className={`shrink-0 w-[110px] ${stat.bg} rounded-xl p-2.5 border-none`}>
                <stat.icon className="w-5 h-5 text-slate-900 dark:text-white mb-2" />
                <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECYCLING GOALS (UNIFIED CARD) ── */}
        <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800/60 !mt-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <h3 className="text-[13px] font-bold text-slate-900 dark:text-white">Recycling Goals</h3>
            </div>
          </div>

          {/* Weekly */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Weekly</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-900 dark:text-white">
                  {stats.currentWeekWeight}<span className="text-slate-400 font-semibold"> / {goals.weekly} KG</span>
                </span>
                <button
                  onClick={() => { setGoalType("weekly"); setShowGoalModal(true); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${weeklyProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
              />
            </div>
            <p className="text-[9px] font-semibold text-slate-400 mt-1 text-right">{Math.round(weeklyProgress)}% complete</p>
          </div>

          {/* Monthly */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Monthly</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-slate-900 dark:text-white">
                  {stats.currentMonthWeight}<span className="text-slate-400 font-semibold"> / {goals.monthly} KG</span>
                </span>
                <button
                  onClick={() => { setGoalType("monthly"); setShowGoalModal(true); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${monthlyProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
            <p className="text-[9px] font-semibold text-slate-400 mt-1 text-right">{Math.round(monthlyProgress)}% complete</p>
          </div>
        </div>

        {/* ── WEEKLY TRENDS ── */}
        <div className="!mt-3">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-[#12141c] dark:to-[#0a0c10] rounded-2xl overflow-hidden border border-slate-700/30 dark:border-slate-800/60 shadow-sm">
            {/* Summary header */}
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">This Week</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white tracking-tight">{stats.currentWeekWeight} KG</span>
                  {stats.monthlyGrowth !== 0 && (
                    <span className={`text-[10px] font-bold ${stats.monthlyGrowth > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {stats.monthlyGrowth > 0 ? '▲' : '▼'} {Math.abs(stats.monthlyGrowth)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/5">
                <BarChart className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400">Weekly</span>
              </div>
            </div>

            {/* Chart */}
            <div className="px-4 pt-6 pb-4">
              <div className="flex items-end justify-between h-36 gap-2">
                {stats.weeklyData.map((day: any, i: number) => {
                  const maxWeight = Math.max(
                    ...stats.weeklyData.map((d: any) => d.weight),
                    5,
                  );
                  const height = (day.weight / maxWeight) * 100;
                  const dayName = new Date(day.date)
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .charAt(0);
                  const isToday = day.date === new Date().toLocaleDateString("en-CA");

                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-1.5"
                    >
                      <div className="w-full relative h-full flex items-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(height, 4)}%` }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          className={`w-full rounded-lg ${
                            day.weight > 0
                              ? isToday
                                ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                : "bg-emerald-500/60"
                              : "bg-white/5"
                          }`}
                        />
                        {day.weight > 0 && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-400">
                            {day.weight}
                          </div>
                        )}
                      </div>
                      <p className={`text-[10px] font-bold ${isToday ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {dayName}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        

      </div>

      {/* ── GOAL EDIT MODAL ── */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center pb-16">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoalModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md  bg-white dark:bg-slate-800 rounded-t-[2rem] p-4  sm:p-8 border-t border-slate-200 dark:border-slate-800"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6" />

              <div className="flex flex-col items-center mb-6">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                  <Target className="w-7 h-7 text-emerald-600 dark:text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-1.5 tracking-tight capitalize">
                  {goalType} Target
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[260px] leading-relaxed">
                  Challenge yourself to recycle more! Choose a target weight to track your impact.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[10, 20, 50, 100, 200, 500].map((val) => {
                  const isCurrent = goals[goalType as 'weekly' | 'monthly'] === val;
                  return (
                    <button
                      key={val}
                      onClick={() => handleUpdateGoal(val)}
                      className={`relative py-4 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 overflow-hidden ${isCurrent ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}
                    >
                      <span className="text-xl font-black leading-none mb-1">{val}</span>
                      <span className={`text-[10px] font-bold tracking-wider ${isCurrent ? 'text-emerald-100' : 'text-slate-400'}`}>KG</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setShowGoalModal(false)}
                className="w-full py-3.5 rounded-xl bg-amber-600 dark:bg-amber-600 text-sm font-bold text-white dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
