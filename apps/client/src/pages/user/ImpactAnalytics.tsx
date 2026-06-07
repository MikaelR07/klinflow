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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { supabase } from "@klinflow/supabase";
import { normalizeKeys } from "@klinflow/core/validation";
import { toast } from "sonner";
import { OptimizedImage } from "@klinflow/ui";

export default function ImpactAnalytics() {
  const { profile } = useAuthStore() as any;
  const { bookings, fetchBookings } = useBookingStore();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalType, setGoalType] = useState("weekly"); // 'weekly' or 'monthly'

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

        // Fetch Global Rank
        const { count: rankCount } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "user")
          .gt("reward_points", profile.reward_points || 0);

        const globalRank = (rankCount || 0) + 1;

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#F8F8FF] dark:bg-slate-800">
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
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
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
        <div className="bg-gradient-to-br from-emerald-900 via-green-900 to-[#022c22] rounded-[1rem] p-4 sm:p-5  relative overflow-hidden">
          {/* Earth background image with gradient overlays */}
          <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-[#022c22] via-[#022c22]/10 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#022c22]/10 to-[#022c22] z-10" />
            <OptimizedImage src="/vectors/earth.webp" alt="Earth" className="w-full h-full object-cover object-right-top mix-blend-screen opacity-80 relative z-0" wrapperClassName="absolute inset-0 z-0" />
          </div>

          <div className="relative z-10 flex justify-between items-start mb-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-700 text-emerald-100 rounded-lg text-[10px] font-bold mb-2  border border-white/10">
                <Leaf className="w-3.5 h-3.5" /> Your Impact
              </div>
              <p className="text-[11px] font-medium text-emerald-100/80 ">Total Waste Recycled</p>
              <div className="flex items-baseline gap-1.5 mb-1">
                <h2 className="text-5xl font-black text-white tracking-tighter leading-none">{stats.totalWeight}</h2>
                <span className="text-sm font-bold text-emerald-400">KG</span>
              </div>
              <p className="text-[11px] text-emerald-100/80 max-w-[150px] leading-relaxed">
                Your action creates Impact!
              </p>
            </div>

            <div className={`inline-flex flex-col items-end gap-1 px-3 py-2 rounded-xl backdrop-blur-md border border-white/10 ${stats.monthlyGrowth >= 0 ? 'bg-emerald-800/60' : 'bg-red-800/60'}`}>
              <span className={`text-[11px] font-bold flex items-center gap-1 ${stats.monthlyGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                <TrendingUp className={`w-3.5 h-3.5 ${stats.monthlyGrowth < 0 ? 'rotate-180' : ''}`} /> {Math.abs(stats.monthlyGrowth)}%
              </span>
              <span className="text-[9px] text-emerald-50">vs last month</span>
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
                  <p className="text-[9px] text-emerald-100/70">Trees saved</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-0.5">{Math.round(stats.totalWeight * 2.5)}</p>
                  <p className="text-[9px] text-emerald-100/70">KWh Saved</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center border border-white/5">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white leading-none mb-0.5">{Math.round(stats.totalWeight * 1.8)}</p>
                  <p className="text-[9px] text-emerald-100/70">CO₂ Offset</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FOUR STATS GRID ── */}
        <div className="grid grid-cols-4 gap-1">
          {/* Lifetime Earnings */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800  flex flex-col justify-between min-h-[90px]">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Revenue</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">KSh {stats.totalEarnings.toLocaleString()}</p>

          </div>
          {/* Global Rank */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800  flex flex-col justify-between min-h-[90px]">
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-1">
              <Trophy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Global Rank</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">#{stats.globalRank || '—'}</p>

          </div>
          {/* Total Pickups */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800  flex flex-col justify-between min-h-[90px]">
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-1">
              <Truck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-500" />
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Total Pickups</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{stats.totalPickups}</p>

          </div>
          {/* GFP Points */}
          <div className="bg-white dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800  flex flex-col justify-between min-h-[90px]">
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-1">
              <Star className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">GFP Points</p>
            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{profile?.reward_points?.toLocaleString() || 0}</p>

          </div>
        </div>

        {/* ── GOAL TRACKING (CIRCULAR) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Your Goals</h3>

          </div>

          <div className="grid grid-cols-2 gap-1">
            {/* Weekly Goal */}
            <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-4 border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> <span className="text-[10px] font-semibold">Weekly Goal</span>
                </div>
                <button
                  onClick={() => { setGoalType("weekly"); setShowGoalModal(true); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-full">
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                    <span className="text-emerald-600 dark:text-emerald-500">{stats.currentWeekWeight}</span> <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ {goals.weekly}</span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1">KG</span>
                  </p>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${weeklyProgress}%` }}></div>
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">{Math.round(weeklyProgress)}% Completed</p>
                </div>
              </div>
            </div>

            {/* Monthly Goal */}
            <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-4 border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> <span className="text-[10px] font-semibold">Monthly Goal</span>
                </div>
                <button
                  onClick={() => { setGoalType("monthly"); setShowGoalModal(true); }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="w-full">
                  <p className="text-xl font-black text-slate-900 dark:text-white leading-none mb-1">
                    <span className="text-emerald-600 dark:text-emerald-500">{stats.currentMonthWeight}</span> <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">/ {goals.monthly}</span>
                    <span className="text-[9px] font-bold text-slate-400 ml-1">KG</span>
                  </p>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${monthlyProgress}%` }}></div>
                  </div>
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">{Math.round(monthlyProgress)}% Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RECYCLING TRENDS (KEPT EXISTING GRAPH AS REQUESTED) ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Weekly Trends</h3>
            <button className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              This Week <ChevronRight className="w-3 h-3 rotate-90" />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900/60 rounded-[1.5rem] p-5 border border-slate-200 dark:border-slate-800 ">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BarChart className="w-4 h-4 text-emerald-500" /> Recovered Weight
              </h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest">
                  KG
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between h-40 gap-3 px-1">
              {stats.weeklyData.map((day: any, i: number) => {
                const maxWeight = Math.max(
                  ...stats.weeklyData.map((d: any) => d.weight),
                  5,
                );
                const height = (day.weight / maxWeight) * 100;
                const dayName = new Date(day.date)
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .charAt(0);

                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-2"
                  >
                    <div className="w-full relative h-full flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className={`w-full rounded-t-xl ${day.weight > 0 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-slate-50 dark:bg-slate-800/50"}`}
                      />
                      {day.weight > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-1.5 py-0.5 rounded  opacity-100 z-10">
                          {day.weight}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 capitalize tracking-tighter">
                      {dayName}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── ACHIEVEMENTS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Achievements</h3>
            <button
              onClick={() => navigate('/impact-hub')}
              className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div onClick={() => navigate('/impact-hub')} className={`cursor-pointer transition-all hover:scale-105 bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 ${stats.totalPickups >= 1 ? '' : 'opacity-50 grayscale'}`}>
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl rotate-45 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-500 -rotate-45" />
              </div>
              <div className="text-center mt-1">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">First Step</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">1 Pickup {stats.totalPickups >= 1 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px]">✓</span>}</p>
              </div>
            </div>

            <div onClick={() => navigate('/impact-hub')} className={`cursor-pointer transition-all hover:scale-105 bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 ${stats.totalPickups >= 10 ? '' : 'opacity-50 grayscale'}`}>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl rotate-45 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                <Recycle className="w-4 h-4 text-blue-600 dark:text-blue-500 -rotate-45" />
              </div>
              <div className="text-center mt-1">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Green Neighbor</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">10 Pickups {stats.totalPickups >= 10 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px]">✓</span>}</p>
              </div>
            </div>

            <div onClick={() => navigate('/impact-hub')} className={`cursor-pointer transition-all hover:scale-105 bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 ${stats.plasticKg >= 100 ? '' : 'opacity-50 grayscale'}`}>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl rotate-45 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-500 -rotate-45" />
              </div>
              <div className="text-center mt-1">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Plastic Warrior</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">100 KG {stats.plasticKg >= 100 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px]">✓</span>}</p>
              </div>
            </div>

            <div onClick={() => navigate('/impact-hub')} className={`cursor-pointer transition-all hover:scale-105 bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 ${stats.totalWeight >= 500 ? '' : 'opacity-50 grayscale'}`}>
              <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl rotate-45 flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                <Star className="w-4 h-4 text-amber-600 dark:text-amber-500 -rotate-45" />
              </div>
              <div className="text-center mt-1">
                <p className="text-[9px] font-bold text-slate-900 dark:text-white leading-tight mb-0.5">Eco-Titan</p>
                <p className="text-[7px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-0.5">500 KG {(stats.totalWeight >= 500) && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[6px]">✓</span>}</p>
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
