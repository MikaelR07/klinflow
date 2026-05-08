import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  User, 
  Package, 
  Scale, 
  ArrowRight,
  Clock,
  Search,
  CheckCircle2,
  ChevronRight,
  Truck,
  Loader2,
  Sparkles
} from 'lucide-react';
import { supabase } from '@cleanflow/core';

export default function ManualAudits() {
  const [audits, setAudits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAudits = async () => {
    if (!supabase) return;

    try {
      // Fetch en-route agents who have at least one manual asset
      const { data: agents, error } = await supabase
        .from('profiles')
        .select('id, name, held_balance, assets:assets!verifier_id(*)')
        .eq('is_en_route', true);

      if (error) throw error;

      // Filter for those with manual assets that haven't been deposited yet
      const needingAudit = (agents || []).filter(agent => 
        agent.assets?.some(asset => asset.is_manual && asset.status === 'verified')
      ).map(agent => {
        const manualAssets = (agent.assets || []).filter(a => a.is_manual && a.status === 'verified');
        const totalWeight = manualAssets.reduce((acc, a) => acc + (a.weight_kg || 0), 0);
        const materials = Array.from(new Set(manualAssets.map(a => a.material_type))).join(', ');

        return {
          id: agent.id,
          name: agent.name,
          heldBalance: agent.held_balance,
          weight: totalWeight,
          materials: materials,
          assetCount: manualAssets.length,
          manualAssets: manualAssets // Keep the full list for detail view
        };
      });

      setAudits(needingAudit);
    } catch (err) {
      console.error('[Audits] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();

    const timer = setTimeout(() => {
      if (!isLoading && audits.length === 0) fetchAudits();
    }, 1000);

    if (!supabase) return () => clearTimeout(timer);

    // Listen for arrivals/deposits
    const channel = supabase
      .channel('audit-sync-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchAudits())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => fetchAudits())
      .subscribe();

    return () => { 
      clearTimeout(timer);
      supabase.removeChannel(channel); 
    };
  }, [supabase]);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">Manual Audit Queue</h1>
          <div className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-widest flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${audits.length > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
            {audits.length} Agents requiring physical verification
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Filter queue..." className="bg-transparent border-none text-xs focus:ring-0" />
           </div>
        </div>
      </div>

      {/* ── AUDIT LIST ── */}
      <div className="grid gap-6">
        {audits.map((audit) => (
          <div key={audit.id} className="glass p-8 rounded-[3rem] group hover:border-red-500/30 transition-all border border-slate-200 dark:border-white/5 relative overflow-hidden">
             
             {/* Warning Indicator */}
             <div className="absolute top-0 left-0 w-2 h-full bg-red-500/50" />
             
             <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                
                <div className="flex-1 space-y-6">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 border border-red-100 dark:border-red-900/30">
                         <ShieldAlert className="w-8 h-8" />
                      </div>
                      <div>
                         <h3 className="text-xl font-semibold text-slate-900 dark:text-white leading-none">{audit.name}</h3>
                         <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-2 flex items-center gap-2">
                           <Truck className="w-3 h-3 text-primary" /> Incoming Cargo Audit Required
                         </p>
                      </div>
                   </div>

                   {/* 📜 List of Manual Bags */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {audit.manualAssets.map((asset) => (
                        <div key={asset.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10 flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-[10px] font-semibold">
                                 {asset.material_type.slice(0, 2)}
                              </div>
                              <div>
                                 <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none">{asset.material_type}</p>
                                 <p className="text-[9px] text-slate-500 font-semibold uppercase mt-1">{asset.weight_kg} KG</p>
                              </div>
                           </div>
                           <span className="text-[8px] font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md uppercase tracking-tighter">Needs Audit</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col items-end gap-6 min-w-[200px]">
                   <div className="text-right">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Locked Payment</p>
                      <p className="text-2xl font-semibold text-primary">KSh {audit.heldBalance.toLocaleString()}</p>
                   </div>
                   
                   <button 
                     onClick={() => {
                        window.alert(`Instruct the driver to pull over for physical audit of ${audit.weight}kg cargo.`);
                     }}
                     className="w-full px-6 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 group/btn active:scale-95 transition-all shadow-xl"
                   >
                      READY INSPECTION
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>

             </div>
          </div>
        ))}

        {!isLoading && audits.length === 0 && (
          <div className="p-24 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3.5rem] text-center">
             <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
             </div>
             <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Audit Queue Clear</h2>
             <p className="text-sm text-slate-500 font-semibold max-w-xs mx-auto">All current en-route agents have been verified by HygeneX AI.</p>
          </div>
        )}

        {isLoading && (
          <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        )}
      </div>

    </div>
  );
}
