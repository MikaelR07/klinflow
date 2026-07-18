/**
 * AgentHome Active Pickup & Market Intelligence
 * Extracted from AgentHome.tsx
 */
import { ChevronRight, Package, MapPin, Clock, Navigation, BarChart2, ArrowRight } from 'lucide-react';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getSubcategoryLabel } from '@klinflow/core/data/wasteDefinitions';
import type { AgentPickupOrder } from './agentHome.types';

interface AgentHomeActivePickupProps {
  activePickup: AgentPickupOrder | null;
  navigate: (path: string) => void;
}

import { useEffect } from 'react';

export default function AgentHomeActivePickup({ activePickup, navigate }: AgentHomeActivePickupProps) {
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();

  useEffect(() => {
    fetchMaterialPrices();
    fetchCategories();
  }, [fetchMaterialPrices, fetchCategories]);

  const resolveMaterialName = (rfq: any) => {
    if (!rfq) return 'Collect materials';
    return materialPrices?.find(m => m.id === rfq.material_grade)?.material_name
      || getSubcategoryLabel(rfq.category, rfq.material_grade)
      || categories?.find(c => c.id === rfq.category)?.label
      || rfq.category
      || 'Collect materials';
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 !mt-2 rounded-[1rem] p-2 border border-slate-200/60 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2 mt-1 px-1">
        <p className="text-[12px] font-semibold text-emerald-500 dark:text-slate-400 tracking-wide">
          Active Quotes Pickups
        </p>

        <button
          onClick={() => navigate('/pickups')}
          className="flex items-center gap-1 text-amber-500 dark:text-emerald-400 group"
        >
          <span className="text-[10px] font-bold tracking-wide">
            View all
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>

      {activePickup ? (
        <button onClick={() => navigate(`/pickups`)} className="w-full bg-slate-200 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-800 rounded-xl p-2 flex items-center justify-between group active:scale-[0.98] transition-all mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="text-[12px] font-bold text-slate-900 dark:text-white mb-0.5 capitalize truncate">{resolveMaterialName(activePickup.rfq)}</h4>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
               Weight: {activePickup.actual_weight || activePickup.rfq?.requested_weight || 0} KG
              </p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                ORDER REF: {activePickup.id.slice(0, 8)}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 truncate max-w-[100px]">
                  <MapPin className="w-2.5 h-2.5 shrink-0" /> {activePickup.pickup_address || 'TBD'}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600 shrink-0">
                  <Clock className="w-3 h-3 shrink-0" /> {new Date(activePickup.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[9px] font-bold capitalize">
              {activePickup.status.replace(/_/g, ' ')}
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-emerald-500" />
          </div>
        </button>
      ) : (
        <div className="w-full bg-slate-200 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-5 flex items-center justify-center mb-1">
          <p className="text-xs text-slate-400 font-medium">No active pickups assigned yet</p>
        </div>
      )}

      <button
        onClick={() => navigate('/routes')}
        className="w-full bg-emerald-700 !mt-3 dark:bg-gradient-to-br from-primary to-[#064e3b] border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/50 rounded-xl flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-blue-600 dark:text-white" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-white dark:text-blue-100 tracking-wide leading-none mb-1">
              Route Optimizer
            </p>              <p className="text-[10px] font-bold text-amber-300 dark:text-slate-100/80">Logistics Terminal</p>
            <p className="text-[10px] text-slate-50 dark:text-slate-300 font-medium mt-0.5">Live Multi-Stop Tracking</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-500 group-hover:text-blue-500" />
      </button>

      {/* ── MARKET INTELLIGENCE (NEW OS LAYER) ── */}
      <div
        onClick={() => navigate('/market-pulse')}
        className="bg-gradient-to-br from-indigo-600 to-blue-700 mt-2 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-5 flex items-center justify-between group active:scale-[0.98] transition-all relative overflow-hidden"
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 dark:text-white capitalize tracking-tight leading-none mb-1">Market Intelligence</h3>
            <p className="text-[9px] font-bold text-slate-300 capitalize tracking-widest flex items-center gap-1.5">
              View Material Prices in the Market
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded-lg shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all relative z-10">
          <ArrowRight className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}
