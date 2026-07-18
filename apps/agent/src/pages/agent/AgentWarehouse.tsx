import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ArrowLeft,
  TrendingUp,
  Tag,
  PlusCircle,
  Activity,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Scale,
  ChevronRight,
  Wallet,
  SlidersHorizontal,
  X,
  Trash2,
  Save,
  Warehouse
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { WASTE_CATEGORIES } from '@klinflow/core/data/wasteDefinitions';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

const CLAIM_STATUS = {
  held_in_escrow: { label: 'In Escrow', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  funds_released: { label: 'Paid Out', color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
};

export default function AgentWarehouse() {
  const navigate = useNavigate();
  const { profile, subscribeToProfileChanges } = useAuthStore() as any;
  const { assets } = useAssetStore();
  const { addNotification } = useNotificationStore();
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories } = useServiceStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [realAssets, setRealAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [materialSales, setMaterialSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);

  // Removed materialNameMap and resolveMaterialName in favor of plain-english material_type strings

  // Stock Adjustment State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingWeights, setAdjustingWeights] = useState<Record<string, string>>({});
  const [offlineForm, setOfflineForm] = useState({ category: '', type: '', weight: '' });
  const [isSavingAdjustments, setIsSavingAdjustments] = useState(false);
  const fetchCargo = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['verified', 'offline'])
        .eq('verifier_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRealAssets(data || []);
    } catch (err) {
      console.error('[Warehouse] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCargo();
    fetchMaterialPrices();
    fetchCategories();
    if (!agentConfig) {
      fetchAgentConfig();
    }
  }, [profile?.id, profile?.hubTransferPin]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`agent-assets-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `verifier_id=eq.${profile.id}`
      }, () => {
        fetchCargo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      const sub = subscribeToProfileChanges(profile.id);
      return () => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;
    setSalesLoading(true);
    supabase
      .from('marketplace_orders')
      .select('*')
      .eq('seller_id', profile.id)
      .eq('order_type', 'agent_claim')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setMaterialSales(data || []);
        setSalesLoading(false);
      });
  }, [profile?.id]);

  // Calculate true live metrics from real assets
  const getPrice = (typeOrSlug: string) => {
    // 1. Direct match on custom_rates (e.g. 'plastic' → 30)
    if (agentConfig?.custom_rates?.[typeOrSlug]) {
      return parseFloat(agentConfig.custom_rates[typeOrSlug]);
    }
    // 2. If typeOrSlug is a subcategory ID, find its parent category slug in materialPrices
    const subcat = materialPrices.find((m: any) => m.id === typeOrSlug);
    if (subcat?.category) {
      // subcat.category is the parent slug (e.g. 'plastic')
      const parentSlug = subcat.category.toLowerCase();
      if (agentConfig?.custom_rates?.[parentSlug]) {
        return parseFloat(agentConfig.custom_rates[parentSlug]);
      }
      // Fallback to the subcategory's own DB price
      if (subcat.price_per_kg) return parseFloat(subcat.price_per_kg);
    }
    return 0;
  };

  const verifiedAssets = realAssets.filter((a: any) => a.status === 'verified');
  const offlineAssets = realAssets.filter((a: any) => a.status === 'offline');

  const totalVerifiedWeight = verifiedAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.weight_kg) || 0), 0);
  const totalOfflineWeight = offlineAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.weight_kg) || 0), 0);
  const totalEstimatedValue = verifiedAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.estimated_value) || 0), 0);

  // Dynamically Group Inventory by Material Type
  const groupedInventoryMap = verifiedAssets.reduce((acc: any, asset: any) => {
    const type = asset.material_type || 'Unknown';
    if (!acc[type]) {
      acc[type] = { id: type, type, weight: 0, totalValue: 0, color: 'slate' };
    }
    acc[type].weight += parseFloat(asset.weight_kg) || 0;
    acc[type].totalValue += parseFloat(asset.estimated_value) || 0;

    // Assign dynamic colors based on material type
    const lowerType = type.toLowerCase();
    if (lowerType.includes('plastic')) acc[type].color = 'emerald';
    else if (lowerType.includes('metal')) acc[type].color = 'slate';
    else if (lowerType.includes('e-waste') || lowerType.includes('electronic')) acc[type].color = 'indigo';
    else if (lowerType.includes('cardboard') || lowerType.includes('paper')) acc[type].color = 'amber';
    else if (lowerType.includes('glass')) acc[type].color = 'cyan';
    else acc[type].color = 'blue';

    return acc;
  }, {});

  const dynamicInventory = Object.values(groupedInventoryMap);

  const handleDispatch = async () => {
    if (realAssets.length === 0) {
      toast.error("Your truck is empty!", { description: "You need to complete some pickups first." });
      return;
    }

    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_en_route: true,
          hub_transfer_pin: pin
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { updateProfile } = useAuthStore.getState() as any;
      await updateProfile({ hubTransferPin: pin, isEnRoute: true });

      addNotification(
        "Incoming Bulk Drop! 🚚",
        `Agent ${profile.name} is heading to the Hub with a full truck (~${totalVerifiedWeight.toFixed(1)}kg).`,
        'info',
        'hub',
        profile.companyId || null
      );

      toast.success("Check-In Requested! 🏢", {
        description: "Please show your secure PIN at the gate."
      });
    } catch (err) {
      toast.error("Failed to request check-in");
      console.error(err);
    }
  };

  const handleClearAllInventory = async () => {
    if (!window.confirm("Are you sure you want to clear ALL your verified assets? This cannot be undone.")) return;
    setIsSavingAdjustments(true);
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('verifier_id', profile.id)
        .eq('status', 'verified');
      if (error) throw error;
      toast.success("Inventory cleared successfully");
      setIsAdjustModalOpen(false);
      fetchCargo();
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear inventory");
    } finally {
      setIsSavingAdjustments(false);
    }
  };

  const handleSaveAdjustments = async () => {
    setIsSavingAdjustments(true);
    try {
      for (const assetId in adjustingWeights) {
        const newWeight = parseFloat(adjustingWeights[assetId]);
        if (isNaN(newWeight)) continue;
        
        if (newWeight <= 0) {
          await supabase.from('assets').delete().eq('id', assetId);
        } else {
          const asset = realAssets.find((a: any) => a.id === assetId);
          const price = asset ? getPrice(asset.material_type) : 0;
          await supabase.from('assets').update({ 
            weight_kg: newWeight,
            estimated_value: newWeight * price
          }).eq('id', assetId);
        }
      }

      if (offlineForm.type && offlineForm.weight) {
        const weightNum = parseFloat(offlineForm.weight);
        if (weightNum > 0) {
          const price = getPrice(offlineForm.type);
          await supabase.from('assets').insert({
            verifier_id: profile.id,
            material_type: offlineForm.type,
            weight_kg: weightNum,
            estimated_value: weightNum * price,
            status: 'verified',
            source: 'offline_adjustment'
          } as any);
        }
      }

      toast.success("Inventory adjusted successfully");
      setIsAdjustModalOpen(false);
      setAdjustingWeights({});
      setOfflineForm({ category: '', type: '', weight: '' });
      fetchCargo();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save adjustments");
    } finally {
      setIsSavingAdjustments(false);
    }
  };

  return (
    <div className="-mx-1 px-1 bg-[#F8F9FF] dark:bg-slate-800 text-slate-900 dark:text-white pb-6 relative overflow-x-hidden">

      {/* ── EMERALD TOP BACKGROUND ── */}
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-emerald-600 z-0" />

      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-emerald-600 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Warehouse Portal</h1>
            <p className="text-[9px] text-emerald-100 font-medium tracking-wider uppercase mt-0.5">Current Load & Inventory</p>
          </div>
        </div>

        {profile?.agentAccountType === 'independent' && (
          <button 
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 rounded-full border border-emerald-600 text-white transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Adjust Data</span>
          </button>
        )}
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] px-1.5 max-w-lg mx-auto space-y-6">
        
        {/* ── TOP CAROUSEL ── */}
        <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 -mx-1.5 px-1.5">
          {/* HERO CARD */}
          <div className={`snap-center shrink-0 ${profile?.agentAccountType === 'independent' ? 'w-[94%]' : 'w-full'}`}>
            <div className="bg-blue-600 p-4 rounded-xl relative overflow-hidden group shadow-lg border border-blue-500/50 h-full flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px] -mr-16 -mt-16" />
              <div className="relative z-10 flex-1 flex flex-col">
                {/* Top Split: Verified vs Offline */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse className="w-4 h-4 text-white opacity-70" />
                      <p className="text-[12px] font-bold text-white capitalize tracking-widest opacity-80">Total Collection Weight</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 text-white">
                      <h3 className="text-3xl font-bold">{totalVerifiedWeight.toFixed(1)}</h3>
                      <span className="text-xs font-bold opacity-70">KG</span>
                    </div>
                    <p className="text-[9px] font-semibold mt-1 text-blue-100 uppercase tracking-widest">
                      Available to list
                    </p>
                  </div>
                  
                  <div className="text-right border-l border-white/20 pl-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Offline Stock</p>
                    <p className="text-xl font-bold">{totalOfflineWeight.toFixed(1)} <span className="text-[10px] opacity-70">KG</span></p>
                    <p className="text-[9px] font-medium mt-1 opacity-80 max-w-[80px] leading-tight ml-auto text-blue-100">
                      Material collected Offline
                    </p>
                  </div>
                </div>

                {/* 3 Metrics Row */}
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  <div className="p-2 bg-blue-700 backdrop-blur-sm rounded-xl border border-blue-600 flex flex-col items-center justify-center text-center gap-1">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center mb-0.5">
                      <Wallet className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-black text-white tracking-tight whitespace-nowrap">KSh {totalEstimatedValue.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">Value</p>
                  </div>

                  <div className="p-2 bg-blue-700 backdrop-blur-sm rounded-xl border border-blue-600 flex flex-col items-center justify-center text-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                      <Scale className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-black text-white tracking-tight whitespace-nowrap">{totalVerifiedWeight.toFixed(1)} KG</p>
                    <p className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">Online Verified</p>
                  </div>

                  <div className="p-2 bg-blue-700 backdrop-blur-sm rounded-xl border border-blue-600 flex flex-col items-center justify-center text-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                      <Package className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-black text-white tracking-tight">{verifiedAssets.length}</p>
                    <p className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">Assets</p>
                  </div>
                </div>

                <div className="mt-auto">
                {profile?.agentAccountType === 'independent' && (
                  <button
                    onClick={() => navigate('/warehouse/sell')}
                    className="w-full flex items-center justify-between p-3.5 bg-white text-blue-600 rounded-[1rem] active:scale-95 transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Tag className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xs font-bold uppercase dark:text-slate-600 tracking-wide">Sell Collection</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Direct-to-Recycler Trade</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {profile?.agentAccountType === 'fleet_driver' && (
                  <div className="mt-4">
                    {profile?.hubTransferPin ? (
                      <div className="p-4 bg-white/20 rounded-[1rem] text-center shadow-lg border border-white/30 backdrop-blur-sm animate-bounce-in">
                        <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1">Gate PIN</p>
                        <div className="text-3xl font-black text-white tracking-widest">{profile.hubTransferPin}</div>
                      </div>
                    ) : (
                      <button
                        onClick={handleDispatch}
                        disabled={verifiedAssets.length === 0}
                        className="w-full py-3.5 bg-white text-blue-600 rounded-[1rem] font-black text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all disabled:opacity-50"
                      >
                        Get Check-In Code
                      </button>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* MARKET OVERVIEW (TRADE HUB REDIRECT) */}
          {profile?.agentAccountType === 'independent' && (
            <div className="snap-center shrink-0 w-[92%]">
              <div className="bg-indigo-600 rounded-xl p-5 border border-indigo-500/50 relative overflow-hidden group h-full flex flex-col justify-between">
                <div className="relative z-10 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-black text-sm text-white uppercase tracking-widest">B2B Trade Hub</h3>
                      <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest mt-1">Manage Outbound Sales</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                      <p className="text-2xl font-black text-white">{materialSales.filter((s:any) => s.status === 'open').length || 0}</p>
                      <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">Active Listings</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                      <p className="text-2xl font-black text-white">{materialSales.filter((s:any) => s.status !== 'open').length || 0}</p>
                      <p className="text-[8px] font-bold text-indigo-200 uppercase tracking-widest">Orders</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button 
                      onClick={() => navigate('/warehouse/trade')}
                      className="w-full py-3.5 bg-white text-indigo-700 font-black rounded-[1rem] text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
                    >
                      Manage B2B Sales <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6 h-fit">
          
          {/* ── DYNAMIC INVENTORY GRID ── */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-wide capitalize">Material Ledger</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest hidden sm:block">Recent Pickups</span>
            </div>

            {verifiedAssets.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-[10px] font-semibold text-slate-500 leading-relaxed uppercase tracking-widest">
                  Inventory Empty.<br />No verified assets found.
                </p>
              </div>
            ) : (
              <div className="space-y-2 pr-1">
                {verifiedAssets.slice(0, 4).map((asset: any) => {
                  const rawType = asset.material_type || 'Unknown';
                  // Resolve UUID-style material_type to a human name from materialPrices
                  const isUUID = rawType.length > 20 && rawType.includes('-');
                  const resolved = isUUID 
                    ? materialPrices.find((m: any) => m.id === rawType)?.material_name 
                    : null;
                  const displayName = (resolved || rawType).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                  
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 transition-all group">
                      
                      {/* Left: Name + Date + ID */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[13px] text-slate-900 dark:text-white capitalize truncate leading-tight">
                          {displayName}
                        </h4>
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {new Date(asset.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-1.5 self-start px-1.5 py-0.5 bg-white dark:bg-slate-800/80 rounded border border-slate-200/60 dark:border-slate-700/60">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tracking ID</span>
                            <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                              {asset.tracking_id || asset.origin_tracking_id || asset.id.substring(0,8).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Weight & Value */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                          <p className="text-sm font-black tracking-tight whitespace-nowrap">{asset.weight_kg}<span className="text-[10px] font-bold ml-0.5">kg</span></p>
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 tracking-wider">
                          KSh {asset.estimated_value ? asset.estimated_value.toLocaleString() : (parseFloat(asset.weight_kg) * getPrice(rawType)).toLocaleString()}
                        </p>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Market Overview moved to Top Carousel */}
        </div>
      </div>

      {/* ── ADJUST STOCK MODAL ── */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            {/* Trick to center modal on desktop but full width on mobile */}
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-slate-900 shadow-xl rounded-2xl relative">
              
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Inventory</h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">Manual stock correction & cleanup</p>
                </div>
                <button 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Clear All Section */}
              <div className="p-4 bg-rose-100 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0">
                    <Trash2 className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">Clear All Inventory</h4>
                    <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-1 mb-3">
                      Completely wipes your current warehouse. Use this if you sold everything offline or lost your cargo.
                    </p>
                    <button 
                      onClick={handleClearAllInventory}
                      disabled={isSavingAdjustments || realAssets.length === 0}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      Wipe Warehouse Now
                    </button>
                  </div>
                </div>
              </div>

              {/* Adjust Individual Items */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Edit Existing Items</h4>
                {verifiedAssets.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">No assets to edit.</p>
                ) : (
                  <div className="space-y-3">
                    {verifiedAssets.map((asset: any) => {
                      const rawType = asset.material_type || 'Unknown';
                      // Resolve UUID-style material_type to a human name from materialPrices
                      const isUUID = rawType.length > 20 && rawType.includes('-');
                      const resolved = isUUID 
                        ? materialPrices.find((m: any) => m.id === rawType)?.material_name 
                        : null;
                      const displayName = (resolved || rawType).replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                      const currentVal = adjustingWeights[asset.id] !== undefined ? adjustingWeights[asset.id] : asset.weight_kg;
                      
                      return (
                        <div key={asset.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800/80 rounded border border-slate-200/60 dark:border-slate-700/60">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Tracking ID</span>
                                <span className="text-[9px] font-mono font-bold text-slate-600 dark:text-slate-300">
                                  {asset.tracking_id || asset.origin_tracking_id || asset.id.substring(0,8).toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <input 
                              type="number"
                              min="0"
                              step="0.1"
                              value={currentVal}
                              onChange={(e) => setAdjustingWeights(prev => ({ ...prev, [asset.id]: e.target.value }))}
                              className="w-20 px-2 py-1.5 text-sm font-bold text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="text-[10px] font-bold text-slate-400">KG</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Offline Collection */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Add Offline Collection</h4>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Material Category</label>
                      <select 
                        value={offlineForm.category}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, category: e.target.value, type: '' }))}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-emerald-500"
                      >
                        <option value="">Select Category</option>
                        {(agentConfig?.accepted_materials || []).map((slug: string) => (
                          <option key={slug} value={slug}>
                            {slug.charAt(0).toUpperCase() + slug.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Specific Material</label>
                      <select 
                        value={offlineForm.type}
                        onChange={(e) => setOfflineForm(prev => ({ ...prev, type: e.target.value }))}
                        disabled={!offlineForm.category}
                        className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-emerald-500 disabled:opacity-50"
                      >
                        <option value="">Select Material</option>
                        {materialPrices
                          .filter((m: any) => {
                            const cat = offlineForm.category;
                            return m.category === cat || m.category?.toLowerCase() === cat;
                          })
                          .map((m: any) => (
                            <option key={m.id} value={m.id}>{m.material_name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Estimated Weight (KG)</label>
                    <input 
                      type="number"
                      min="0"
                      step="0.1"
                      value={offlineForm.weight}
                      onChange={(e) => setOfflineForm(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="e.g. 50"
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white outline-none focus:border-emerald-500"
                    />
                    {offlineForm.type && offlineForm.weight && !isNaN(parseFloat(offlineForm.weight)) && (
                      <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Estimated Value</p>
                          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-medium">
                            {offlineForm.weight} kg × KSh {getPrice(offlineForm.type)}/kg
                            <span className="text-emerald-500/50 ml-1">({offlineForm.category} rate)</span>
                          </p>
                        </div>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          KSh {(parseFloat(offlineForm.weight) * getPrice(offlineForm.type)).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <button 
                onClick={handleSaveAdjustments}
                disabled={isSavingAdjustments || (Object.keys(adjustingWeights).length === 0 && (!offlineForm.type || !offlineForm.weight))}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSavingAdjustments ? 'Saving...' : 'Save Adjustments'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
