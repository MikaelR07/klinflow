import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, Plus, TrendingUp, ShieldCheck, 
  Search, ArrowRight, Layers, Sparkles,
  Info, AlertCircle, CheckCircle2, Loader2, X, Brain
} from 'lucide-react';
import { useAssetStore, MATERIAL_TYPES, ASSET_SOURCES } from '@klinflow/core/stores/assetStore';
import { useAuthStore, getBusinessLabel } from '@klinflow/core/stores/authStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import AssetBadge from '@klinflow/ui/components/AssetBadge';
import { toast } from 'sonner';

export default function WeaverWarehouse() {
  const assets = useAssetStore(s => s.assets);
  const fetchAssets = useAssetStore(s => s.fetchAssets);
  const addSideCollection = useAssetStore(s => s.addSideCollection);
  const isLoading = useAssetStore(s => s.isLoading);

  const getFinancialSummary = useMarketplaceStore(s => s.getFinancialSummary);
  const myOrders = useMarketplaceStore(s => s.myOrders);
  const fetchMyActivity = useMarketplaceStore(s => s.fetchMyActivity);

  const userId = useAuthStore(s => s.userId);
  const profile = useAuthStore(s => s.profile);
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [financials, setFinancials] = useState(null);
  const [newSideAsset, setNewSideAsset] = useState({ materialType: 'PET', weightKg: 10 });

  const isWeaver = profile?.business_type === 'weaver';

  useEffect(() => {
    fetchAssets();
    fetchMyActivity();
    getFinancialSummary().then(setFinancials);
  }, []);

  const agentStock = assets.filter(a => a.weaver_id === userId);
  const peerStock = myOrders.filter(o => o.status === 'funds_released' || o.status === 'held_in_escrow');

  const myAssets = isWeaver 
    ? [...agentStock, ...peerStock]
    : peerStock;

  const agentWeight = agentStock.reduce((sum, a) => sum + (Number(a.weight_kg) || 0), 0);
  const peerWeight = peerStock.reduce((sum, o) => sum + (Number(o.quantity) || 0), 0);

  const totalWeight = myAssets.reduce((sum, item) => {
    // If it's an asset, use weight_kg. If it's an order, use quantity.
    return sum + (Number(item.weight_kg) || Number(item.quantity) || 0);
  }, 0);

  const totalValue = myAssets.reduce((sum, item) => {
    // If it's an asset, use estimated_value. If it's an order, use totalPrice.
    return sum + (Number(item.estimated_value) || Number(item.totalPrice) || 0);
  }, 0);

  const handleAddSideCollection = async (e) => {
    e.preventDefault();
    try {
      await addSideCollection(newSideAsset);
      toast.success('Inventory Updated', { description: 'Your side collection has been added to your warehouse.' });
      setShowAddModal(false);
    } catch (err) {
      toast.error('Failed to add', { description: err.message });
    }
  };

  const handleBulkSell = () => {
    if (myAssets.length === 0) return toast.error('Empty Warehouse', { description: 'You need assets to create a bulk listing.' });
    
    // We navigate to the Sell page and pass the warehouse totals as defaults
    const materials = [...new Set(myAssets.map(a => a.material_type))];
    const primaryMaterial = materials[0] || 'Plastic';

    navigate('/sell', { 
      state: { 
        material: primaryMaterial,
        quantity: totalWeight,
        description: `Bulk lot aggregated from ${myAssets.length} verified pickups.`
      } 
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* 💎 EXECUTIVE HERO DASHBOARD */}
      <div className="relative group overflow-hidden rounded-[2.5rem] bg-slate-900 dark:bg-black p-8 text-white shadow-2xl transition-all border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] -ml-16 -mb-16" />
        
        <div className="relative z-10 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Current Yard Assets</p>
            <div className="flex items-baseline gap-2">
              <h1 className="text-5xl font-semibold tracking-tighter">{totalWeight.toLocaleString()}</h1>
              <span className="text-xl font-semibold text-slate-500 uppercase">KG</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Market Valuation</p>
             <p className="text-2xl font-semibold text-primary">KSh {totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* 📊 THE TRADE PULSE BAR */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
           <div className="flex justify-between items-end">
              <div className="flex gap-6">
                 <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{getBusinessLabel(profile?.business_type, 'sourceA')}</p>
                    <p className="text-sm font-semibold text-white">{agentWeight.toLocaleString()} <span className="text-xs opacity-40">KG</span></p>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">{getBusinessLabel(profile?.business_type, 'sourceB')}</p>
                    <p className="text-sm font-semibold text-white">
                       {isWeaver ? peerWeight.toLocaleString() : (financials?.totalEarnings || 0).toLocaleString()} 
                       <span className="text-xs opacity-40 ml-1">{isWeaver ? 'KG' : 'KES'}</span>
                    </p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest mb-1">Actual Earnings</p>
                 <p className="text-lg font-semibold text-emerald-400">KSh {(financials?.totalEarnings || 0).toLocaleString()}</p>
              </div>
           </div>
           
           {/* Visual Split Bar */}
           <div className="h-1.5 w-full bg-white/5 rounded-full flex overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000" 
                style={{ width: `${(agentWeight / (totalWeight || 1)) * 100}%` }} 
              />
              <div 
                className="h-full bg-secondary transition-all duration-1000" 
                style={{ width: `${(peerWeight / (totalWeight || 1)) * 100}%` }} 
              />
           </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-between p-5 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary/30 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
             </div>
             <span className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">
               {getBusinessLabel(profile?.business_type, 'actionAdd')}
             </span>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300" />
        </button>
        <button 
          onClick={handleBulkSell}
          className="flex items-center justify-between p-5 rounded-[2rem] bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all group"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
             </div>
             <span className="text-xs font-semibold uppercase tracking-widest">Bulk Sell Lot</span>
          </div>
          <ArrowRight className="w-4 h-4 opacity-50" />
        </button>
      </div>

      {/* Inventory Tabs/List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Current Inventory
          </h3>
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
             <span className="px-3 py-1 bg-white dark:bg-slate-900 text-xs font-semibold uppercase rounded-lg shadow-sm">All</span>
             <span className="px-3 py-1 text-xs font-semibold uppercase text-slate-400">Lots</span>
          </div>
        </div>

        <div className="space-y-3">
          {myAssets.length > 0 ? myAssets.map((asset) => (
            <div 
              key={asset.id}
              onClick={() => navigate(`/arrivals/${asset.id}`)}
              className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${asset.source === ASSET_SOURCES.SELF ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary/10'}`}>
                    {MATERIAL_TYPES[asset.material_type?.toUpperCase()]?.icon || '📦'}
                 </div>
                 <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                       {asset.weight_kg}kg {asset.material_type}
                       {asset.source === ASSET_SOURCES.SELF && <span className="ml-2 text-xs font-semibold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">Self-Declared</span>}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       {asset.source !== ASSET_SOURCES.SELF ? (
                         <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500 uppercase">
                            <ShieldCheck className="w-3 h-3" /> Agent Verified
                         </div>
                       ) : (
                         <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase">
                            <Info className="w-3 h-3" /> Pending Verification
                         </div>
                       )}
                    </div>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">KES {asset.estimated_value?.toLocaleString()}</p>
                 <p className="text-xs font-semibold text-slate-400 uppercase mt-1">Grade {asset.grade || 'B'}</p>
              </div>
            </div>
          )) : (
            <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Your warehouse is empty.</p>
               <button onClick={() => navigate('/')} className="text-primary text-xs font-semibold uppercase tracking-widest mt-4">Claim Assets Now <ArrowRight className="w-3 h-3 inline ml-1" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Input Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
           <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tighter">Add Side Collection</h3>
                 <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-8 flex gap-3">
                 <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                 <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    Manual collections are marked as <b>"Self-Declared"</b> until you aggregate them into a bulk lot. Be as accurate as possible with weight.
                 </p>
              </div>

              <form onSubmit={handleAddSideCollection} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Material Type</label>
                       <select 
                         value={newSideAsset.materialType}
                         onChange={(e) => setNewSideAsset({...newSideAsset, materialType: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:border-primary transition-all appearance-none"
                       >
                          <option value="PET">PET Plastic</option>
                          <option value="HDPE">HDPE Plastic</option>
                          <option value="Metal">Scrap Metal</option>
                          <option value="Paper">Paper / Box</option>
                          <option value="Glass">Glass</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Weight (KG)</label>
                       <input 
                         type="number"
                         value={newSideAsset.weightKg}
                         onChange={(e) => setNewSideAsset({...newSideAsset, weightKg: Number(e.target.value)})}
                         className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold outline-none focus:border-primary transition-all"
                       />
                    </div>
                 </div>

                 <button 
                   type="submit"
                   disabled={isLoading}
                   className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-semibold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                 >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Add to Warehouse</>}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
