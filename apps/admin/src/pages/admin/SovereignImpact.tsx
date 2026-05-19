/**
 * SovereignImpact.jsx — The Macro-Level ESG & Municipal Dashboard.
 * High-level reporting for Government bodies and Enterprise partners.
 */
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  TrendingUp, 
  Users, 
  Leaf, 
  ShieldCheck, 
  BarChart3, 
  ArrowUpRight,
  Download,
  Building2,
  PieChart,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MACRO_METRICS = [
  { id: 'carbon', label: 'Net CO2 Avoided', value: '14,280 Tons', change: '+12%', icon: <Leaf className="w-5 h-5" />, color: 'emerald' },
  { id: 'jobs', label: 'Informal Jobs Formalized', value: '3,420', change: '+8%', icon: <Users className="w-5 h-5" />, color: 'blue' },
  { id: 'diversion', label: 'Landfill Diversion Rate', value: '68%', change: '+15%', icon: <TrendingUp className="w-5 h-5" />, color: 'indigo' },
  { id: 'liquidity', label: 'Financial Liquidity Created', value: 'KSh 12.4M', change: '+22%', icon: <BarChart3 className="w-5 h-5" />, color: 'amber' }
];

export default function SovereignImpact() {
  const navigate = useNavigate();
  const [activeRegion, setActiveRegion] = useState('Nairobi Central');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8 space-y-8">
      {/* ── TOP NAV / EXPORT ── */}
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sovereign Impact Hub</h1>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional ESG & Circularity Reporting</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex items-center gap-2">
              <select 
                value={activeRegion}
                onChange={(e) => setActiveRegion(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest outline-none px-2"
              >
                 <option>Nairobi Central</option>
                 <option>Mombasa Coast</option>
                 <option>Kisumu West</option>
              </select>
           </div>
           <button className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl active:scale-95 transition-all">
              <Download className="w-4 h-4" /> Export ESG Report
           </button>
        </div>
      </div>

      {/* ── MACRO METRICS GRID ── */}
      <div className="grid grid-cols-4 gap-6">
         {MACRO_METRICS.map(metric => (
            <motion.div 
              key={metric.id}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
            >
               <div className={`absolute top-0 right-0 w-24 h-24 bg-${metric.color}-500/5 rounded-full blur-2xl -mr-8 -mt-8`} />
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`w-12 h-12 bg-${metric.color}-500/10 rounded-2xl flex items-center justify-center text-${metric.color}-500 shadow-inner`}>
                     {metric.icon}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                     <ArrowUpRight className="w-3 h-3" />
                     <span className="text-[10px] font-black">{metric.change}</span>
                  </div>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metric.label}</p>
               <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{metric.value}</p>
            </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-3 gap-8">
         {/* ── MATERIAL DIVERSION CHART ── */}
         <div className="col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Material Diversion Velocity</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time throughput from informal to formal sector</p>
               </div>
               <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-emerald-500" />
                     <span className="text-slate-600 dark:text-slate-300">Recycled</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                     <span className="text-slate-400">Target</span>
                  </div>
               </div>
            </div>
            
            <div className="h-64 flex items-end gap-4">
               {[45, 65, 85, 35, 95, 75, 80, 60, 90, 100, 85, 70].map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                     <div className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl relative overflow-hidden flex flex-col justify-end" style={{ height: '100%' }}>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        />
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase">M{i+1}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* ── ESG SCORECARD ── */}
         <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -mr-20 -mt-20" />
            <div className="relative z-10">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl">
                     <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black uppercase tracking-widest leading-none">Net Impact Score</h3>
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Verified Audit Engine</p>
                  </div>
               </div>

               <div className="text-center py-6">
                  <span className="text-7xl font-black text-white italic tracking-tighter">AA+</span>
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">Institutional Prime</p>
               </div>

               <div className="space-y-4 mt-8">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                     <span className="text-slate-500">Traceability</span>
                     <span className="text-white">98.4%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[98.4%]" />
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest">
                     <span className="text-slate-500">Social Equity</span>
                     <span className="text-white">92.1%</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[92.1%]" />
                  </div>
               </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 relative z-10">
               <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Integrity: Cryptographic</p>
               </div>
            </div>
         </div>
      </div>

      {/* ── SECTOR ANALYSIS ── */}
      <div className="grid grid-cols-2 gap-8">
         <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
               <Building2 className="w-6 h-6 text-indigo-500" />
               <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Enterprise Diversion Partners</h3>
            </div>
            <div className="space-y-4">
               {[
                  { name: 'Global Beverage Co', weight: '240 Tons', impact: 'A+', progress: 85 },
                  { name: 'Industrial Pack Ltd', weight: '180 Tons', impact: 'A', progress: 70 },
                  { name: 'E-Waste Solutions', weight: '45 Tons', impact: 'B+', progress: 45 }
               ].map((partner, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                     <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-xs text-indigo-600 shadow-sm">{partner.impact}</div>
                     <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none mb-1">{partner.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{partner.weight} Recovered</p>
                     </div>
                     <div className="text-right">
                        <ArrowUpRight className="w-4 h-4 text-emerald-500 ml-auto" />
                     </div>
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <PieChart className="w-6 h-6 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Material Category Breakdown</h3>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total: 4.2k Tons</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
               <div className="w-48 h-48 rounded-full border-[16px] border-emerald-500 relative flex items-center justify-center">
                  <div className="absolute inset-[-16px] border-[16px] border-indigo-500 rounded-full" style={{ clipPath: 'polygon(50% 50%, 0 0, 100% 0, 100% 100%, 0 100%)', transform: 'rotate(120deg)' }} />
                  <div className="text-center">
                     <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">62%</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Plastics</p>
                  </div>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Plastics (62%)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Metals (24%)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Paper (10%)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Other (4%)</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
