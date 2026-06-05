/**
 * MarketHub Reference Rates
 * Extracted from MarketHub.tsx
 */
import { Activity, Plus, Coins, TrendingUp, RefreshCcw, Save } from 'lucide-react';
import type { MarketHubMaterial } from './marketHub.types';

interface MarketHubReferenceRatesProps {
  prices: any[];
  editingId: string | null;
  editValue: string;
  setEditingId: (id: string | null) => void;
  setEditValue: (val: string) => void;
  handleSavePrice: (id: string) => void;
  setShowAddMaterial: (show: boolean) => void;
}

export default function MarketHubReferenceRates({
  prices, editingId, editValue,
  setEditingId, setEditValue, handleSavePrice, setShowAddMaterial
}: MarketHubReferenceRatesProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5 text-emerald-500" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Reference Market Rates</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <button
          onClick={() => setShowAddMaterial(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> Add Material
        </button>
      </div>
      <p className="text-xs text-slate-400 font-medium px-4 -mt-6">
        The platform's suggested prices. Individual companies can override these in their own service profiles.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
        {prices.map((item, index) => (
          <div key={item.id || index} className="glass p-6 rounded-[1rem] border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-[1rem] bg-primary/10 text-primary flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold tracking-tighter uppercase">STABLE</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{item.label}</h3>

            <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-[1rem] border border-slate-100 dark:border-slate-800">
              {editingId === item.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-400">KES</span>
                  <input
                    autoFocus
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xl font-semibold text-primary"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                    KSh {item.price_per_kg.toLocaleString()}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">SUGGESTED / KG</p>
                </div>
              )}

              <button
                onClick={() => {
                  if (editingId === item.id) {
                    handleSavePrice(item.id);
                  } else {
                    setEditingId(item.id);
                    setEditValue(item.price_per_kg.toString());
                  }
                }}
                className={`p-3 rounded-xl transition-all ${editingId === item.id
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary'
                  }`}
              >
                {editingId === item.id ? <Save className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
