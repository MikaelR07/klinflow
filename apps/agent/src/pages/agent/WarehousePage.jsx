import React from 'react';
import { 
  Warehouse, 
  Truck, 
  Package, 
  Scale, 
  Clock, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuthStore, useNotificationStore, useAssetStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function WarehousePage() {
  const { profile } = useAuthStore();
  const { assets } = useAssetStore();
  const { addNotification } = useNotificationStore();

  const totalWeight = assets.reduce((acc, asset) => acc + (parseFloat(asset.weight) || 0), 0);

  const handleDispatch = () => {
    addNotification(
      "Incoming Bulk Drop! 🚚",
      `Agent ${profile.name} is heading to the Hub with a full truck (~${totalWeight.toFixed(1)}kg).`,
      'info',
      'hub',
      profile.company_id || null // Targeted Hub Manager if available
    );
    toast.success("Dispatch Notification Sent! 🏢", {
      description: "The Hub Manager has been notified of your arrival."
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── HEADER ── */}
      <div className="px-1">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">Warehouse Portal</h1>
        <p className="text-xs text-slate-400 font-semibold mt-2 uppercase tracking-widest">Manage your drop-offs & logistics</p>
      </div>

      {/* ── CURRENT TRUCK LOAD CARD ── */}
      <div className="glass p-6 rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden group">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                     <Truck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">Current Truck Load</h3>
                     <p className="text-xs text-slate-400 font-semibold mt-1 uppercase tracking-widest">In Transit to Hub</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Live Weight</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{totalWeight.toFixed(1)} KG</p>
               </div>
               <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Items</p>
                  <p className="text-xl font-semibold text-slate-900 dark:text-white">{assets.length} Units</p>
               </div>
            </div>

            <button 
              onClick={handleDispatch}
              className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs uppercase tracking-[0.1em] shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Warehouse className="w-5 h-5" />
              NOTIFY HUB OF ARRIVAL
            </button>
         </div>
      </div>

      {/* ── DROP-OFF INSTRUCTIONS ── */}
      <div className="space-y-4">
         <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-1">Drop-off Guide</h2>
         
         <div className="grid gap-3">
            <div className="p-5 bg-slate-100/50 dark:bg-slate-800 rounded-[2rem] flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-500" />
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Route to Hub</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Head to the Nairobi Industrial Area warehouse. Check current traffic in Route Optimizer.</p>
               </div>
            </div>

            <div className="p-5 bg-slate-100/50 dark:bg-slate-800 rounded-[2rem] flex items-start gap-4">
               <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
               </div>
               <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Security Check</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Ensure your QR code is ready for the Gate Manager to scan upon arrival.</p>
               </div>
            </div>
         </div>
      </div>

      {/* ── SYSTEM STATUS ── */}
      <div className="p-5 bg-primary/5 border border-primary/10 rounded-[2rem] flex items-center justify-between">
         <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Hub Status: Operational</span>
         </div>
         <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>

    </div>
  );
}
