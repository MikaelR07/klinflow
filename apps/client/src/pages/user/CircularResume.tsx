/**
 * CircularResume.jsx — The Professional Economic Identity for Informal Operators.
 * Transforms trade history and impact data into a 'Bankable' reputation asset.
 */
import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, ArrowLeft, Download, Award, 
  BarChart3, Globe, Zap, Clock, TrendingUp,
  BadgeCheck, Briefcase, FileText, Share2, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore, useBookingStore, useMarketplaceStore } from '@klinflow/core';

export default function CircularResume() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);
  const bookings = useBookingStore(s => s.bookings);
  const receivedOrders = useMarketplaceStore(s => s.receivedOrders);
  const getCalculatedScore = useMarketplaceStore(s => s.getCalculatedScore);

  const trustScore = getCalculatedScore(receivedOrders, profile);

  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalKg = completed.reduce((sum, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
    const uniqueMaterials = [...new Set(completed.map((b: any) => b.wasteType || b.wasteType))].length;
    const reliability = completed.length > 0 ? 100 : 0; 

    // Carbon Factors (Match core/assetStore)
    const carbonFactors: Record<string, number> = {
      'plastics': 1.5, 'pet': 1.5, 'hdpe': 1.7, 'metals': 1.5,
      'aluminium': 9.0, 'paper': 0.9, 'glass': 0.3, 'ewaste': 2.0,
      'organic': 0.5, 'default': 0.8
    };
    
    const totalCarbon = completed.reduce((sum: number, b: any) => {
      const type = (b.wasteType || '').toLowerCase();
      const factor = (carbonFactors[type] || carbonFactors.default || 0.8) as number;
      return sum + ((Number(b.actualWeightKg) || Number(b.weightKg) || 0) * factor);
    }, 0);
    
    // Material Breakdown
    const breakdown = completed.reduce((acc: Record<string, number>, b: any) => {
      const type = b.wasteType || b.wasteType || 'General';
      acc[type] = (acc[type] || 0) + (Number(b.actualWeightKg) || Number(b.weightKg) || 0);
      return acc;
    }, {});

    return { totalKg, uniqueMaterials, reliability, breakdown, count: completed.length, totalCarbon };
  }, [bookings]);

  const operatorLevel = useMemo(() => {
    if (stats.count >= 100) return 'Master Environmentalist';
    if (stats.count >= 50) return 'Senior Circular Operator';
    if (stats.count >= 10) return 'Professional Collector';
    return 'Certified Associate';
  }, [stats.count]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] dark:bg-slate-900 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Circular Resume</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Professional Identity</p>
            </div>
          </div>
          <button className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center active:scale-95 transition-all border border-primary/20">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main className="flex-1 px-1 pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-24 max-w-lg mx-auto w-full space-y-4">
        
        {/* ── THE PROFESSIONAL ID CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
          
          <div className="flex flex-col items-center text-center relative z-10 space-y-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl">
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} className="w-full h-full object-cover" />
                ) : (
                  profile?.avatar || '👤'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-4 border-white dark:border-slate-900 shadow-lg">
                <BadgeCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{profile?.name}</h2>
              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">{operatorLevel}</p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Verified Circular ID: CF-{String(profile?.id).slice(0, 6).toUpperCase()}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-center">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trust Integrity</p>
              <p className="text-xl font-black text-emerald-600 italic leading-none">{trustScore}%</p>
              <div className="w-10 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto mt-1.5 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${trustScore}%` }} />
              </div>
            </div>
            <div className="text-center border-l border-slate-100 dark:border-slate-800">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Impact</p>
              <p className="text-xl font-black text-slate-900 dark:text-white italic leading-none">{stats.totalKg}kg</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Recovered Asset</p>
            </div>
          </div>
        </div>

        {/* ── ECONOMIC PERFORMANCE ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Economic Performance</h3>
            <TrendingUp className="w-3.5 h-3.5 text-slate-300" />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none mb-0.5">Trade Reliability</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Settlement Accuracy</p>
                </div>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white">{stats.reliability}%</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none mb-0.5">Carbon Offset</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Net CO2 Saved</p>
                </div>
              </div>
              <p className="text-sm font-black text-emerald-600">-{stats.totalCarbon.toFixed(1)}kg</p>
            </div>
          </div>
        </div>

        {/* ── CAPITAL ACCESS (PHASE 3) ── */}
        <div 
          onClick={() => navigate('/financing')}
          className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
        >
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/20 transition-colors" />
           <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white">
                    <Zap className="w-5 h-5 fill-current" />
                 </div>
                 <div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest leading-tight">Unlock Equipment Financing</h3>
                    <p className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest opacity-80 mt-0.5">Based on your Trust Score</p>
                 </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
           </div>
        </div>

        {/* ── ASSET BREAKDOWN ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Material Inventory Ledger</h3>
          </div>
          
          <div className="space-y-3">
            {Object.entries(stats.breakdown).length > 0 ? Object.entries(stats.breakdown).map(([type, weight]) => (
              <div key={type} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{type}</p>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white italic">{weight} KG</p>
                </div>
                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(weight / stats.totalKg) * 100}%` }} />
                </div>
              </div>
            )) : (
              <div className="text-center py-3 italic text-slate-400 text-[10px] uppercase tracking-widest">No verified assets yet</div>
            )}
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="grid grid-cols-2 gap-2 pb-6">
          <button className="py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="py-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all">
            <FileText className="w-4 h-4" /> Certification
          </button>
        </div>
      </main>
    </div>
  );
}
