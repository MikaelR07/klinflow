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
  Sparkles
} from 'lucide-react';
import { useAuthStore, useBookingStore, supabase } from '@cleanflow/core';

// Badge definitions — unlock conditions are checked dynamically
const BADGE_DEFS = [
  { id: 'first_pickup', name: 'First Step', icon: '🌱', description: 'Complete your first pickup', check: (stats) => stats.totalPickups >= 1 },
  { id: 'green_neighbor', name: 'Green Neighbor', icon: '🏠', description: '10 successful pickups', check: (stats) => stats.totalPickups >= 10 },
  { id: 'plastic_warrior', name: 'Plastic Warrior', icon: '♻️', description: 'Recycled 100+ kg of plastic', check: (stats) => stats.plasticKg >= 100 },
  { id: 'paper_pilot', name: 'Paper Pilot', icon: '📄', description: 'Recycled 50+ kg of paper', check: (stats) => stats.paperKg >= 50 },
  { id: 'metal_magnet', name: 'Metal Magnet', icon: '🏗️', description: 'Recycled 100+ kg of metal', check: (stats) => stats.metalKg >= 100 },
  { id: 'glass_guardian', name: 'Glass Guardian', icon: '🍾', description: 'Recycled 100+ kg of glass', check: (stats) => stats.glassKg >= 100 },
  { id: 'e_waste_expert', name: 'E-Waste Expert', icon: '💻', description: 'Recycled 50+ kg of e-waste', check: (stats) => stats.eWasteKg >= 50 },
  { id: 'eco_titan', name: 'Eco-Titan', icon: '🐘', description: 'Recovered 500+ kg total', check: (stats) => stats.totalKg >= 500 },
  { id: 'community_beacon', name: 'Community Beacon', icon: '🔦', description: '50 successful pickups', check: (stats) => stats.totalPickups >= 50 },
  { id: 'century_club', name: 'Century Club', icon: '💯', description: 'Earned 2,500+ GFP', check: (stats) => stats.gfp >= 2500 },
  { id: 'master_weeks', name: 'Master of Weeks', icon: '👑', description: '20-week recycling streak', check: (stats) => stats.streak >= 20 },
  { id: 'diamond_recycler', name: 'Diamond Recycler', icon: '💎', description: 'Recovered 2,500+ kg', check: (stats) => stats.totalKg >= 2500 },
  { id: 'eco_architect', name: 'Eco-Architect', icon: '🌍', description: 'Recycled all 5 categories', check: (stats) => stats.uniqueCategories >= 5 },
  { id: 'infinity_streak', name: 'Infinity Streak', icon: '♾️', description: '1 year perfect streak', check: (stats) => stats.streak >= 52 },
  { id: 'greenflow_legend', name: 'GreenFlow Legend', icon: '🏆', description: 'Earned 25,000+ GFP', check: (stats) => stats.gfp >= 25000 },
  { id: 'sustainomics_overlord', name: 'Sustainomics Overlord', icon: '🌌', description: 'Earned 100,000+ GFP', check: (stats) => stats.gfp >= 100000 },
];

function calculateStreak(bookings) {
  const completed = bookings
    .filter(b => b.status === 'completed')
    .map(b => {
      // Standardize date source (DB uses snake_case: updated_at, created_at)
      const dateVal = b.updated_at || b.created_at || b.lastUpdated || b.date;
      return new Date(dateVal);
    })
    .filter(d => !isNaN(d.getTime())); // Remove invalid dates

  if (completed.length === 0) return 0;

  // Group by ISO week
  const weeks = new Set();
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
  const { profile, getGFPMetrics } = useAuthStore();
  const { bookings } = useBookingStore();
  const metrics = getGFPMetrics();

  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Calculate streak from bookings
  const streak = useMemo(() => calculateStreak(bookings), [bookings]);

  // Calculate kg recovered from GFP
  const kgRecovered = Math.floor((profile?.rewardPoints || 0) / 2);

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
      totalKg: completed.reduce((acc, b) => acc + (b.weight || 0), 0) || Math.floor((profile?.rewardPoints || 0) / 2),
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


  return (
    <div className="space-y-6 animate-fade-in pb-10 px-2">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">GreenFlow Hub</h1>
          <p className="text-xs text-primary font-semibold uppercase tracking-widest">Sustainability Dashboard</p>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className="card bg-gradient-to-br from-primary to-emerald-600 p-6 text-white border-0 shadow-xl shadow-primary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div className="flex items-center gap-4 mb-6 relative">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl shadow-inner">
            {metrics.icon}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Current Rank</p>
            <h2 className="text-2xl font-semibold">{metrics.tier}</h2>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Impact Score</p>
            <p className="text-2xl font-mono font-semibold">{profile?.rewardPoints || 0} GFP</p>
          </div>
        </div>

        <div className="space-y-1.5 relative">
          <div className="flex justify-between items-end text-xs font-semibold uppercase tracking-widest">
            <span>Progress to {metrics.nextTier}</span>
            <span>{Math.round(metrics.progress)}%</span>
          </div>
          <div className="h-3 w-full bg-black/20 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
              style={{ width: `${metrics.progress}%` }}
            ></div>
          </div>
          <p className="text-xs font-semibold text-center opacity-70 italic mt-1">
            Your recycling efforts have recovered {kgRecovered}kg of waste from landfills
          </p>
        </div>
      </div>

      {/* Streaks & Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`card p-4 flex items-center gap-3 ${streak > 0 ? 'border-orange-100 bg-orange-50/30' : 'border-slate-100 bg-slate-50/30'}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${streak > 0 ? 'bg-orange-100' : 'bg-slate-100'}`}>
            <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase leading-none mb-1 ${streak > 0 ? 'text-orange-600/60' : 'text-slate-400'}`}>Streak</p>
            <p className={`text-lg font-semibold leading-none ${streak > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
              {streak > 0 ? `${streak} Week${streak > 1 ? 's' : ''}` : 'None'}
            </p>
          </div>
        </div>
        <div className="card p-4 border-blue-100 bg-blue-50/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-blue-500 fill-blue-500" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-blue-600/60 leading-none mb-1">Recovered</p>
            <p className="text-lg font-semibold text-blue-600 leading-none">{kgRecovered}kg</p>
          </div>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold flex items-center gap-2">
            <Medal className="w-4 h-4 text-amber-500" /> Badges
          </h3>
          <button 
            onClick={() => setShowBadgeModal(true)}
            className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
          >
            How to earn <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {badges.map(badge => (
            <div 
              key={badge.id} 
              onClick={() => setShowBadgeModal(true)}
              className={`card p-3 text-center transition-all cursor-pointer ${!badge.unlocked ? 'grayscale opacity-40' : 'shadow-md border-amber-100 bg-amber-50/10'}`}
            >
              <div className={`text-3xl mb-1.5 ${badge.unlocked ? 'transform hover:scale-110 transition-transform' : ''}`}>
                {badge.icon}
              </div>
              <p className="text-xs font-semibold leading-tight uppercase tracking-tighter text-slate-700 dark:text-slate-300">
                {badge.name}
              </p>
            </div>
          ))}
        </div>
      </div>



      {/* Badge Guide Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowBadgeModal(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm uppercase tracking-widest">Badge Guide</h3>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">How to earn badges</p>
                </div>
              </div>
              <button onClick={() => setShowBadgeModal(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {badges.map(badge => (
                <div 
                  key={badge.id}
                  className={`p-4 rounded-3xl border flex items-center gap-4 transition-all ${
                    badge.unlocked 
                    ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30' 
                    : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800'
                  }`}
                >
                  <div className={`text-3xl ${!badge.unlocked && 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold uppercase tracking-tight">{badge.name}</h4>
                      {badge.unlocked ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Lock className="w-3 h-3 text-slate-300" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                      {badge.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={() => setShowBadgeModal(false)}
                className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-xl active:scale-[0.98] transition-all"
              >
                Got it, Captain!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* The Path to Mastery */}
      <div className="card bg-slate-900 text-white p-6 rounded-[2.5rem] relative overflow-hidden shadow-2xl mt-8">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-20 h-20 text-primary" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-semibold tracking-tight mb-2">The Path to Mastery 🏆</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            You've unlocked <span className="text-primary font-semibold">{unlockedCount} of {badges.length}</span> badges. 
            Keep recycling to become a <span className="text-white font-semibold italic">Certified Sustainability Hero</span> and unlock exclusive M-Pesa reward multipliers!
          </p>
          <button 
            onClick={() => navigate('/book-pickup')}
            className="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Level Up Now
          </button>
        </div>
      </div>
    </div>
  );
}
