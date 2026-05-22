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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { supabase } from "@klinflow/supabase";
import { normalizeKeys } from "@klinflow/core/validation";
import { toast } from "sonner";

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
    activeStreak: 0,
    consistencyTier: "Getting Started",
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
          activeStreak,
          consistencyTier,
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
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-700 ">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all"
          >
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">
              Impact Analytics
            </h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">
              Performance Tracking
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-2 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
        {/* ── IMPACT HERO CARD: COMMAND CENTER ── */}
        <div className="relative -mt-2 px-1">
          <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-[1rem] p-2">
            <div>
              <div className="grid grid-cols-3 gap-3">
                {/* 1. Primary: Lifetime Revenue (Horizontal 2x1 Card) */}
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest leading-none">
                      Lifetime Revenue
                    </p>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mt-1 flex items-baseline gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mr-0.5 capitalize">
                        KSh
                      </span>
                      {stats.totalEarnings.toLocaleString()}
                    </h2>
                  </div>
                </div>

                {/* 2. Recyclables Recovered (1x1 Square Card) */}
                <div className="col-span-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800/50">
                  <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mb-1" />
                  <span className="text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">
                    {stats.totalWeight}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mt-0.5">
                    KG
                  </span>
                </div>

                {/* 3. Withdrawn (Horizontal 2x1 Card) */}
                <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3 border border-slate-100 dark:border-slate-800/50">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest leading-none">
                      Withdrawn
                    </p>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mt-1 flex items-baseline gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block mr-0.5 capitalize">
                        KSh
                      </span>
                      {stats.totalWithdrawn.toLocaleString()}
                    </h2>
                  </div>
                </div>

                {/* 4. Global Rank (1x1 Square Card) */}
                <div className="col-span-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-800/50">
                  <Trophy className="w-4 h-4 text-amber-500 mb-1" />
                  <span className="text-base font-black text-slate-900 dark:text-white leading-none mt-0.5">
                    #{stats.globalRank || "—"}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mt-0.5">
                    Rank
                  </span>
                </div>

                {/* 5. Metrics Strip (Bottom Row 3x1 Card) */}
                <div className="col-span-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 grid grid-cols-3 gap-1 border border-slate-100 dark:border-slate-800/50">
                  <div className="text-center">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {stats.totalPickups}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mt-1.5">
                      Pickups
                    </p>
                  </div>

                  <div className="text-center border-l border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {profile?.reward_points || 0}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mt-1.5">
                      GFP
                    </p>
                  </div>

                  <div className="text-center border-l border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">
                      Most Recycled
                    </p>
                    <p className="text-xs font-black text-slate-900 dark:text-white capitalize truncate max-w-[100px] mx-auto leading-none mt-1">
                      {stats.topMaterial}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── GOAL TRACKING ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Goal Targets
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-0.5">
                    Weekly Target
                  </p>
                  <p className="text-lg font-black dark:text-white tracking-tight">
                    {stats.currentWeekWeight} / {goals.weekly}{" "}
                    <span className="text-xs font-bold text-slate-400">KG</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGoalType("weekly");
                    setShowGoalModal(true);
                  }}
                  className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center active:bg-primary active:text-white transition-all shadow-inner"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="h-3 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weeklyProgress}%` }}
                  className={`h-full rounded-full ${weeklyProgress >= 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : "bg-primary"}`}
                />
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em]">
                  {Math.round(weeklyProgress)}% Completed
                </p>
                {weeklyProgress >= 100 && (
                  <span className="text-[10px] font-black text-emerald-500 capitalize tracking-[0.2em]">
                    Goal Reached! 🚀
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-0.5">
                    Monthly Target
                  </p>
                  <p className="text-lg font-black dark:text-white tracking-tight">
                    {stats.currentMonthWeight} / {goals.monthly}{" "}
                    <span className="text-xs font-bold text-slate-400">KG</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGoalType("monthly");
                    setShowGoalModal(true);
                  }}
                  className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center active:bg-emerald-500 active:text-white transition-all shadow-inner"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="h-3 w-full bg-slate-50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-slate-100 dark:border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${monthlyProgress}%` }}
                  className={`h-full rounded-full ${monthlyProgress >= 100 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" : "bg-emerald-500"}`}
                />
              </div>
              <div className="flex justify-between mt-3">
                <p className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em]">
                  {Math.round(monthlyProgress)}% Completed
                </p>
                {monthlyProgress >= 100 && (
                  <span className="text-[10px] font-black text-amber-500 capitalize tracking-[0.2em]">
                    Elite Status! 🏆
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RECYCLING TRENDS (BAR CHART) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-semibold text-xs capitalize tracking-widest text-slate-400 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-indigo-500" /> Weekly Trends
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <p className="text-[10px] font-black text-slate-400 capitalize tracking-widest">
                KG Recovered
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
                      className={`w-full rounded-t-xl ${day.weight > 0 ? "bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]" : "bg-slate-50 dark:bg-slate-800/50"}`}
                    />
                    {day.weight > 0 && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-1 py-0.5 rounded opacity-100">
                        {day.weight}kg
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 capitalize tracking-tighter">
                    {dayName}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MATERIAL DIVERSITY ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <PieChart className="w-5 h-5 text-amber-500 mb-3" />
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-1">
              Most Recycled
            </p>
            <p className="text-base font-black dark:text-white capitalize tracking-tight leading-tight">
              {stats.topMaterial}
            </p>
            <p className="text-[10px] font-black text-emerald-500 mt-2 capitalize tracking-widest">
              Preferred Partner
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <Trophy className="w-5 h-5 text-indigo-500 mb-3" />
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-1">
              Consistency
            </p>
            <p className="text-base font-black dark:text-white capitalize tracking-tight leading-tight">
              {stats.consistencyTier}
            </p>
            <p className="text-[10px] font-black text-indigo-500 mt-2 capitalize tracking-widest">
              Streak: {stats.activeStreak} Days
            </p>
          </div>
        </div>
      </div>

      {/* ── GOAL EDIT MODAL ── */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
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
              className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-[2.5rem] p-8 shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2 tracking-tight">
                Set {goalType} Target
              </h3>
              <p className="text-xs font-bold text-slate-400 text-center mb-8 capitalize tracking-[0.2em]">
                KG Goal
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {[10, 20, 50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    onClick={() => handleUpdateGoal(val)}
                    className="py-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-lg font-black text-slate-900 dark:text-white hover:bg-primary hover:text-white transition-all active:scale-95 shadow-inner"
                  >
                    {val}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowGoalModal(false)}
                className="w-full py-5 text-slate-400 font-black text-[10px] capitalize tracking-[0.3em]"
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
