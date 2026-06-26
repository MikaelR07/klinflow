import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  TrendingDown, 
  Medal,
  Award,
  ShieldAlert
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function SupplierIntelligence() {
  const { isDarkMode } = useThemeStore();

  const leaderboards = [
    { rank: 1, name: 'Eco-Klect Logistics', score: 98, change: '+2', tier: 'Gold', badgeColor: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { rank: 2, name: 'Pioneer Waste', score: 96, change: '-', tier: 'Gold', badgeColor: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { rank: 3, name: 'GreenCity Recyclers', score: 88, change: '+5', tier: 'Silver', badgeColor: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30' },
    { rank: 4, name: 'Jane Doe Collections', score: 85, change: '-1', tier: 'Silver', badgeColor: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/30' },
    { rank: 5, name: 'Kamau & Sons', score: 72, change: '+1', tier: 'Bronze', badgeColor: 'text-amber-600', bg: 'bg-amber-600/10 border-amber-600/30' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Supplier Performance Intelligence</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gamified rankings, quality leaderboards, and tier analytics.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
         
         {/* Left Column: Leaderboard */}
         <div className={`lg:col-span-2 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
               <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <Trophy className="font-medium w-5 h-5 text-amber-500" />
                 Top Performing Suppliers
               </h2>
               <select className={`text-xs font-medium px-3 py-1.5 rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <option>This Month</option>
                  <option>This Quarter</option>
                  <option>All Time</option>
               </select>
            </div>
            
            <div className="p-6">
               <div className="space-y-4">
                  {leaderboards.map((supplier) => (
                    <div key={supplier.rank} className={`p-4 rounded-2xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-lg border ${supplier.bg} ${supplier.badgeColor}`}>
                             #{supplier.rank}
                          </div>
                          <div>
                             <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{supplier.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded ${supplier.bg} ${supplier.badgeColor}`}>
                                  {supplier.tier} Tier
                                </span>
                                <span className={`text-xs font-medium flex items-center gap-1 ${supplier.change.startsWith('+') ? 'text-emerald-500' : supplier.change.startsWith('-') && supplier.change.length > 1 ? 'text-rose-500' : 'text-slate-500'}`}>
                                   {supplier.change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : supplier.change.startsWith('-') && supplier.change.length > 1 ? <TrendingDown className="w-3 h-3" /> : null}
                                   {supplier.change !== '-' ? `${supplier.change} positions` : 'No Change'}
                                </span>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={`text-3xl font-medium tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{supplier.score}</p>
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Klin Score</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Right Column: Analytics & Tiers */}
         <div className="space-y-6">
            
            {/* Tier Distribution */}
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
               <h3 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Supplier Tier Distribution</h3>
               <div className="space-y-4">
                  <div>
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1 text-yellow-500"><Medal className="w-4 h-4" /> Gold (Top 10%)</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>124 Suppliers</span>
                     </div>
                     <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[10%]" />
                     </div>
                  </div>
                  <div>
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1 text-slate-400"><Medal className="w-4 h-4" /> Silver (Top 30%)</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>374 Suppliers</span>
                     </div>
                     <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-slate-400 w-[30%]" />
                     </div>
                  </div>
                  <div>
                     <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1 text-amber-600"><Medal className="w-4 h-4" /> Bronze (Top 60%)</span>
                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>750 Suppliers</span>
                     </div>
                     <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-amber-600 w-[60%]" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Quality Alerts */}
            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
               <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <ShieldAlert className="font-medium w-5 h-5 text-rose-500" />
                 Quality Drop Alerts
               </h3>
               <div className="space-y-3">
                  <div className={`p-3 rounded-xl border border-rose-500/20 bg-rose-500/5`}>
                     <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">Kibera Recyclers Co.</p>
                     <p className="font-medium text-xs text-rose-600/80 dark:text-rose-400/80">Contamination increased by 18% over the last 3 deliveries. Grade downgraded to C.</p>
                  </div>
                  <div className={`p-3 rounded-xl border border-rose-500/20 bg-rose-500/5`}>
                     <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">J&J Waste Management</p>
                     <p className="font-medium text-xs text-rose-600/80 dark:text-rose-400/80">Moisture levels exceeding 15% threshold consistently. Flagged for review.</p>
                  </div>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
