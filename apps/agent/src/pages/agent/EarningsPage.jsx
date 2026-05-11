/**
 * Earnings Page — Premium Financial Hub for CleanFlow Agents
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
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAgentStore, useAuthStore, supabase } from '@cleanflow/core';
import { toast } from 'sonner';



export default function EarningsPage() {
  const navigate = useNavigate();
  const { earnings, coachInsights, currentInsightIndex, nextInsight, jobHistory, fetchEarnings } = useAgentStore();
  const { profile, userId, withdrawRewards } = useAuthStore();
  const currentInsight = coachInsights[currentInsightIndex];
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem(`agent_goals_${profile?.id}`);
    return saved ? JSON.parse(saved) : { weekly: 500, monthly: 2000 };
  });

  const handleGoalChange = (type, value) => {
    const val = value === '' ? '' : Number(value);
    const newGoals = { ...goals, [type]: val };
    setGoals(newGoals);
    localStorage.setItem(`agent_goals_${profile?.id}`, JSON.stringify(newGoals));
  };
  useEffect(() => {
    fetchEarnings();
    // Wait for the CSS animation to complete before rendering the chart
    const timer = setTimeout(() => setIsChartReady(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  const lastWeek = earnings?.lastWeek || 0;
  const thisWeek = earnings?.thisWeek || 0;
  const weekChange = lastWeek > 0 
    ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(1) 
    : '0.0';

  const handleWithdraw = async () => {
    const balance = earnings.today || 0;
    if (balance < 100) {
      toast.warning("Minimum Withdrawal: KSh 100");
      return;
    }
    setIsWithdrawing(true);
    try {
      await withdrawRewards(balance);
      toast.success("Payout sent to M-Pesa!");
    } catch (err) {
      toast.error("Withdrawal failed");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10 pt-10 px-4">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">My Wallet</h1>
            <p className="text-xs text-emerald-500 font-semibold uppercase tracking-widest">Money & Stats</p>
          </div>
        </div>
        <button className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Download className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* ── DASHBOARD HERO: PERFORMANCE HUD ── */}
      <div className="relative group">

        <div className="relative bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 dark:from-orange-800 dark:via-amber-800 dark:to-rose-950 rounded-3xl border border-slate-200 dark:border-white/10 pt-4 pb-6 px-6 dark:shadow-2xl overflow-hidden text-white transition-all duration-500">
          {/* Glassmorphism Accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 dark:bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            {/* Top Row: Stock Value Emphasis */}
            <div className="flex items-end justify-between mb-8 px-2">
              <div>
                <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Stock Value</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-bold text-white/30">KSh</span>
                  <h2 className="text-4xl font-black tracking-tighter text-white">
                    {Number(earnings.inventoryValue || 0).toLocaleString()}
                  </h2>
                </div>
              </div>
              <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-full">
                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Live Inventory</p>
              </div>
            </div>

            {/* Metrics Grid: Masonry-style layout */}
            <div className="grid grid-cols-4 gap-3">
              {/* 1. Rating (Top Left) */}
              <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mb-1">Agent Rating</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{profile?.rating || '5.0'}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-2 h-2 ${i <= Math.round(profile?.rating || 5) ? 'text-amber-500 fill-amber-500' : 'text-slate-100 dark:text-white/10'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-white/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
              </div>

              {/* 2. Resident Pickups (Top Right) */}
              <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{earnings.residentPickups || 0}</span>
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest">Total Pickups</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* 3. Total Weight (Bottom Left) */}
              <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm transition-colors">
                <div>
                  <h4 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">{(earnings.totalKg || 0).toFixed(1)}</h4>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Total KGs</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-white/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-emerald-600 dark:text-amber-300" />
                </div>
              </div>

              {/* 4. Marketplace Accepted Bids */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 flex flex-col justify-center items-center text-center shadow-sm transition-colors">
                <span className="text-xl font-black text-slate-900 dark:text-white">{earnings.marketTrades || 0}</span>
                <span className="text-[8px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Bids</span>
              </div>

              {/* 5. Points */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-white/20 dark:border-white/10 flex flex-col justify-center items-center text-center shadow-sm transition-colors">
                <span className="text-xl font-black text-emerald-600 dark:text-amber-400">{profile?.rewardPoints || 0}</span>
                <span className="text-[8px] font-black text-slate-400 dark:text-white/50 uppercase tracking-widest mt-1">Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ACQUISITION GOALS ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6 px-2">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-400">Acquisition Targets</h3>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Goal Tracker (KG)</p>
          </div>
          <Target className="w-6 h-6 text-emerald-500 opacity-20" />
        </div>

        <div className="space-y-6 px-2">
          {/* Weekly Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Weekly Target</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase">/</span>
                <input 
                  type="number" 
                  value={goals.weekly} 
                  onChange={(e) => handleGoalChange('weekly', e.target.value)}
                  className="w-14 bg-transparent text-xs font-semibold text-slate-400 text-right outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:text-emerald-500 transition-colors"
                />
                <span className="text-xs font-semibold text-slate-400 uppercase">KG</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 relative overflow-hidden" 
                style={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.weekly, 1)) * 100, 100)}%` }} 
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Monthly Goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Monthly Target</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)}</span>
                <span className="text-xs font-semibold text-slate-400 uppercase">/</span>
                <input 
                  type="number" 
                  value={goals.monthly} 
                  onChange={(e) => handleGoalChange('monthly', e.target.value)}
                  className="w-14 bg-transparent text-xs font-semibold text-slate-400 text-right outline-none border-b border-dashed border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:text-emerald-500 transition-colors"
                />
                <span className="text-xs font-semibold text-slate-400 uppercase">KG</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-1000 relative overflow-hidden" 
                style={{ width: `${Math.min(((earnings.totalKg || 0) / Math.max(goals.monthly, 1)) * 100, 100)}%` }} 
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── WEEKLY PERFORMANCE GRAPH ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h3 className="font-semibold text-xs uppercase tracking-widest text-slate-400">Collection Volume</h3>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">This Week's Recovery (KG)</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
             <ArrowUpRight className="w-3 h-3 text-emerald-500" />
             <span className="text-xs font-semibold text-emerald-500">{(earnings.totalKg || 0).toFixed(0)} KG Total</span>
          </div>
        </div>
        
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
          <div style={{ width: '450px', height: '220px' }}>
            <BarChart width={450} height={220} data={earnings.weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fontWeight: 'bold', fill: '#94a3b8' }}
                tickFormatter={(v) => `${v}kg`}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-2xl">
                        {payload[0].value.toFixed(1)} KG Collected
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="weight" radius={[8, 8, 8, 8]} barSize={24}>
                {earnings.weeklyData.map((entry, index) => {
                  const todayIndex = (new Date().getDay() + 6) % 7; 
                  return (
                    <Cell key={`cell-${entry.day}`} fill={index === todayIndex ? '#10b981' : '#e2e8f0'} />
                  );
                })}
              </Bar>
            </BarChart>
          </div>
        </div>
      </div>



    </div>
  );
}
