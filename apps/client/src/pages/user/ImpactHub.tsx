import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Flame,
  Trophy,
  Medal,
  Zap,
  Leaf,
  Loader2,
  Info,
  X,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Globe
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { supabase } from '@klinflow/supabase';
import { Booking } from '@klinflow/core/validation';

// Badge definitions — unlock conditions are checked dynamically
const BADGE_DEFS = [
  { id: 'first_pickup', name: 'First Step', icon: '🌱', description: 'Complete your first pickup', check: (stats: any) => stats.totalPickups >= 1 },
  { id: 'green_neighbor', name: 'Green Neighbor', icon: '🏠', description: '10 successful pickups', check: (stats: any) => stats.totalPickups >= 10 },
  { id: 'plastic_warrior', name: 'Plastic Warrior', icon: '♻️', description: 'Recycled 100+ kg of plastic', check: (stats: any) => stats.plasticKg >= 100 },
  { id: 'paper_pilot', name: 'Paper Pilot', icon: '📄', description: 'Recycled 50+ kg of paper', check: (stats: any) => stats.paperKg >= 50 },
  { id: 'metal_magnet', name: 'Metal Magnet', icon: '🏗️', description: 'Recycled 100+ kg of metal', check: (stats: any) => stats.metalKg >= 100 },
  { id: 'glass_guardian', name: 'Glass Guardian', icon: '🍾', description: 'Recycled 100+ kg of glass', check: (stats: any) => stats.glassKg >= 100 },
  { id: 'e_waste_expert', name: 'E-Waste Expert', icon: '💻', description: 'Recycled 50+ kg of e-waste', check: (stats: any) => stats.eWasteKg >= 50 },
  { id: 'eco_titan', name: 'Eco-Titan', icon: '🐘', description: 'Recovered 500+ kg total', check: (stats: any) => stats.totalKg >= 500 },
  { id: 'community_beacon', name: 'Community Beacon', icon: '🔦', description: '50 successful pickups', check: (stats: any) => stats.totalPickups >= 50 },
  { id: 'century_club', name: 'Century Club', icon: '💯', description: 'Earned 2,500+ GFP', check: (stats: any) => stats.gfp >= 2500 },
  { id: 'master_weeks', name: 'Master of Weeks', icon: '👑', description: '20-week recycling streak', check: (stats: any) => stats.streak >= 20 },
  { id: 'diamond_recycler', name: 'Diamond Recycler', icon: '💎', description: 'Recovered 2,500+ kg', check: (stats: any) => stats.totalKg >= 2500 },
  { id: 'eco_architect', name: 'Eco-Architect', icon: '🌍', description: 'Recycled all 5 categories', check: (stats: any) => stats.uniqueCategories >= 5 },
  { id: 'infinity_streak', name: 'Infinity Streak', icon: '♾️', description: '1 year perfect streak', check: (stats: any) => stats.streak >= 52 },
  { id: 'greenflow_legend', name: 'GreenFlow Legend', icon: '🏆', description: 'Earned 25,000+ GFP', check: (stats: any) => stats.gfp >= 25000 },
  { id: 'sustainomics_overlord', name: 'Sustainomics Overlord', icon: '🌌', description: 'Earned 100,000+ GFP', check: (stats: any) => stats.gfp >= 100000 },
];

function calculateStreak(bookings: Booking[]) {
  const completed = bookings
    .filter(b => b.status === 'completed')
    .map(b => {
      // Standardize date source (DB uses snake_case: updated_at, created_at)
      const dateVal = (b as any).updated_at || (b as any).created_at || (b as any).lastUpdated || (b as any).date;
      return new Date(dateVal);
    })
    .filter(d => !isNaN(d.getTime())); // Remove invalid dates

  if (completed.length === 0) return 0;

  // Group by ISO week
  const weeks = new Set<string>();
  completed.forEach(d => {
    const start = new Date(d);
    // Move to start of week (Sunday)
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay());
    weeks.add(start.toISOString().slice(0, 10));
  });

  const sortedWeeks = [...weeks].sort().reverse();

  // Count consecutive weeks from the most recent
  let streak = 0;
  const now = new Date();
  now.setDate(now.getDate() - now.getDay());
  const currentWeek = now.toISOString().slice(0, 10);

  // Check if the most recent week is this week or last week
  if (sortedWeeks[0] !== currentWeek) {
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    if (sortedWeeks[0] !== lastWeek.toISOString().slice(0, 10)) return 0;
  }

  for (let i = 0; i < sortedWeeks.length; i++) {
    const expected = new Date(now);
    expected.setDate(expected.getDate() - (i * 7));
    const expectedStr = expected.toISOString().slice(0, 10);
    if (sortedWeeks[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default function ImpactHub() {
  const navigate = useNavigate();
  const { profile, getGFPMetrics } = useAuthStore() as any;
  const { bookings, fetchBookings } = useBookingStore();
  const metrics = getGFPMetrics();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Calculate streak from bookings
  const streak = useMemo(() => calculateStreak(bookings), [bookings]);

  // Calculate kg recovered accurately from completed bookings
  const kgRecovered = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    return completed.reduce((sum, b) => sum + (Number((b as any).actualWeightKg) || Number((b as any).weightKg) || 0), 0);
  }, [bookings]);

  // Build badge unlock stats
  const badgeStats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const wasteTypes = completed.map(b => (b.wasteType || '').toLowerCase());

    return {
      totalPickups: completed.length,
      gfp: profile?.rewardPoints || 0,
      plasticKg: wasteTypes.filter(w => w.includes('plastic') || w.includes('recyclable')).length * 5,
      organicKg: wasteTypes.filter(w => w.includes('organic')).length * 5,
      paperKg: wasteTypes.filter(w => w.includes('paper') || w.includes('cardboard')).length * 5,
      metalKg: wasteTypes.filter(w => w.includes('metal') || w.includes('can')).length * 5,
      glassKg: wasteTypes.filter(w => w.includes('glass') || w.includes('bottle')).length * 5,
      eWasteKg: wasteTypes.filter(w => w.includes('e-waste') || w.includes('electronic')).length * 5,
      totalKg: completed.reduce((acc, b) => acc + (Number((b as any).actualWeightKg) || Number((b as any).weightKg) || 0), 0),
      uniqueCategories: [
        wasteTypes.some(w => w.includes('plastic') || w.includes('recyclable')),
        wasteTypes.some(w => w.includes('organic')),
        wasteTypes.some(w => w.includes('paper') || w.includes('cardboard')),
        wasteTypes.some(w => w.includes('glass') || w.includes('bottle')),
        wasteTypes.some(w => w.includes('e-waste') || w.includes('electronic') || w.includes('metal'))
      ].filter(Boolean).length,
      streak,
    };
  }, [bookings, profile?.rewardPoints, streak]);

  const badges = BADGE_DEFS.map(b => ({ ...b, unlocked: b.check(badgeStats) }));
  const unlockedCount = badges.filter(b => b.unlocked).length;


  // SVG ring dimensions
  const ringSize = 180;
  const strokeWidth = 12;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (metrics.progress / 100) * circumference;

  // Tier progression data
  const tiers = [
    { name: 'Seedling', icon: '🌱', minGfp: 0 },
    { name: 'Sprout', icon: '🌿', minGfp: 500 },
    { name: 'Sapling', icon: '🌳', minGfp: 1000 },
    { name: 'Guardian', icon: '🛡️', minGfp: 3000 },
    { name: 'Champion', icon: '🏆', minGfp: 7000 },
    { name: 'Legend', icon: '👑', minGfp: 15000 },
  ];
  const currentTierIdx = tiers.findIndex(t => t.name === metrics.tier);

  return (
    <div className="flex flex-col bg-white dark:bg-slate-950  transition-colors">
      {/* ── GRADIENT TOP BACKGROUND ── */}
      <div className="absolute top-0 left-0 right-0 h-[380px] z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-500 dark:from-purple-600 dark:via-purple-700 dark:to-indigo-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
        {/* Decorative circles */}
        <div className="absolute top-10 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-10 left-0 w-40 h-40 bg-indigo-300/15 rounded-full blur-3xl -translate-x-1/4 pointer-events-none" />
        {/* Bottom curve */}
        <div className="absolute -bottom-1 left-0 right-0 h-12 bg-white dark:bg-slate-950 rounded-t-[2.5rem]" />
      </div>

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-400 to-indigo-500 dark:from-purple-600 dark:to-indigo-700 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-9 h-9 shrink-0 rounded-full bg-white/15 border border-white/10 flex items-center justify-center active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <h1 className="text-[14px] font-black text-white tracking-tight">GreenFlow Hub</h1>
          <button onClick={() => setShowBadgeModal(true)} className="w-9 h-9 shrink-0 rounded-full bg-white/15 border border-white/10 flex items-center justify-center active:scale-95 transition-all">
            <Award className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] relative max-w-lg mx-auto w-full pb-12 z-10">

        {/* ── MAIN STATS CARD ── */}
        <div className="px-1.5 pt-4 pb-8">
          <div className="bg-slate-200 dark:bg-slate-800 backdrop-blur-md border border-white/20 dark:border-white/5 p-6 rounded-[2rem] shadow-xl shadow-indigo-900/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-4xl shadow-sm">
                {metrics.icon}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Current Rank</p>
                <h2 className="text-2xl font-black tracking-tight leading-none text-slate-900 dark:text-white drop-shadow-sm">{metrics.tier}</h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Impact Score</p>
                <p className="text-xl font-black text-slate-900 dark:text-white drop-shadow-sm">{profile?.rewardPoints || 0} <span className="text-xs text-emerald-500">GFP</span></p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Next: {metrics.nextTier}</span>
                <span className="text-[11px] font-black text-slate-900 dark:text-white">{Math.round(metrics.progress)}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden p-[2px]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${metrics.progress}%` }}
                />
              </div>
              <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 text-center mt-2 leading-relaxed">
                Your recycling efforts have recovered <strong className="text-emerald-600 dark:text-emerald-400">{kgRecovered}kg</strong> of waste from landfills.
              </p>
            </div>

            {/* Streak Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-3 flex items-center justify-between border border-slate-100 dark:border-slate-700 shadow-sm mt-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Streak</p>
                  <p className="text-[15px] font-black text-slate-900 dark:text-white leading-none">
                    {streak > 0 ? `${streak} Week${streak > 1 ? 's' : ''}` : 'No active streak'}
                  </p>
                </div>
              </div>
              {streak > 0 && (
                <div className="px-3 py-1 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">On Fire!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── BADGES ── */}
        <div className="px-1.5 mb-8">
          <div className="bg-slate-200 dark:bg-slate-800/80 rounded-[2rem] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5 px-1">
              <h3 className="text-[15px] font-black text-slate-900 dark:text-white tracking-tight">
                Achievements
              </h3>
              <button
                onClick={() => setShowBadgeModal(true)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 active:scale-95 transition-transform"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Beginner Badges */}
            <div className="mb-4">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">Starter Collection</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {badges.slice(0, 8).map(badge => (
                  <div
                    key={badge.id}
                    onClick={() => setShowBadgeModal(true)}
                    className={`shrink-0 w-[88px] flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all active:scale-95 ${
                      badge.unlocked
                        ? 'bg-white dark:bg-slate-900 shadow-sm border border-transparent'
                        : 'bg-white/50 dark:bg-slate-900/50 opacity-60 border border-transparent'
                    }`}
                  >
                    <div className={`text-[28px] mb-1.5 ${!badge.unlocked ? 'grayscale' : ''}`}>
                      {badge.icon}
                    </div>
                    <p className={`text-[10px] font-bold text-center leading-tight ${badge.unlocked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {badge.name}
                    </p>
                    {badge.unlocked && (
                      <div className="mt-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Master Badges */}
            <div className="mb-2">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 px-1">Mastery Collection</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {badges.slice(8).map(badge => (
                  <div
                    key={badge.id}
                    onClick={() => setShowBadgeModal(true)}
                    className={`shrink-0 w-[88px] flex flex-col items-center p-3 rounded-2xl cursor-pointer transition-all active:scale-95 ${
                      badge.unlocked
                        ? 'bg-white dark:bg-slate-900 shadow-sm border border-transparent'
                        : 'bg-white/50 dark:bg-slate-900/50 opacity-60 border border-transparent'
                    }`}
                  >
                    <div className={`text-[28px] mb-1.5 ${!badge.unlocked ? 'grayscale' : ''}`}>
                      {badge.icon}
                    </div>
                    <p className={`text-[10px] font-bold text-center leading-tight ${badge.unlocked ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {badge.name}
                    </p>
                    {badge.unlocked && (
                      <div className="mt-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5 bg-slate-300/50 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full transition-all duration-700"
                style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
              />
            </div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center mt-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{unlockedCount}</span> of {badges.length} unlocked
            </p>
          </div>
        </div>

        

        {/* ── CTA ── */}
        <div className="px-4">
          <button
            onClick={() => navigate('/book-pickup')}
            className="w-full py-4 bg-primary dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-[13px] active:scale-[0.98] transition-all shadow-lg shadow-slate-900/10"
          >
            Book a Pickup to Level Up
          </button>
          <p className="text-[10px] font-medium text-slate-400 text-center mt-3 leading-relaxed">
            Every KG recycled earns you <strong className="text-emerald-500">GFP points</strong> and pushes you closer to the next tier.
          </p>
        </div>

      </div>

      {/* ── BADGE GUIDE MODAL ── */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[90px]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
          <div className="relative w-full max-w-lg bg-slate-200 dark:bg-slate-950 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in slide-in-from-bottom duration-300">

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="px-5 pt-2 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-black text-[17px] text-slate-900 dark:text-white leading-none">Achievements</h3>
                <p className="text-[11px] font-semibold text-slate-400 mt-1">
                  {unlockedCount} of {badges.length} unlocked
                </p>
              </div>
              <button onClick={() => setShowBadgeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full active:scale-95 transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-3.5 rounded-2xl flex items-center gap-3.5 transition-all ${badge.unlocked
                    ? 'bg-emerald-50/60 dark:bg-emerald-500/5'
                    : 'bg-slate-50 dark:bg-slate-900/50'
                    }`}
                >
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                    badge.unlocked ? 'bg-white dark:bg-slate-800 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 grayscale opacity-50'
                  }`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-[13px] font-bold truncate ${badge.unlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      {badge.name}
                    </h4>
                    <p className={`text-[10px] font-medium leading-snug mt-0.5 ${badge.unlocked ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
                      {badge.description}
                    </p>
                  </div>
                  {badge.unlocked ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

