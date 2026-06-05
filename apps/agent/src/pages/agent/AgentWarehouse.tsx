import { useState, useEffect } from 'react';
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
  Warehouse,
  Scale,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

const CLAIM_STATUS = {
  held_in_escrow: { label: 'In Escrow', color: 'text-indigo-600 bg-indigo-50 border-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20' },
  funds_released: { label: 'Paid Out', color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20' },
  pending: { label: 'Pending', color: 'text-amber-600 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
};

export default function AgentWarehouse() {
  const navigate = useNavigate();
  const { profile, subscribeToProfileChanges } = useAuthStore();
  const { assets } = useAssetStore();
  const { addNotification } = useNotificationStore();
  const [realAssets, setRealAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [materialSales, setMaterialSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  const isCompanyOwner = profile?.agentAccountType === 'company_admin';

  // 1. Fetch real cargo from DB (Includes "God View" for Company Admins)
  const fetchCargo = async () => {
    if (!profile?.id) return;
    try {
      let query = supabase.from('assets').select('*').eq('status', 'verified');

      if (profile.agentAccountType === 'company_admin') {
        const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', profile.id);
        const driverIds = drivers?.map(d => d.id) || [];
        query = query.in('verifier_id', [profile.id, ...driverIds]);
      } else {
        query = query.eq('verifier_id', profile.id);
      }

      const { data, error } = await query;
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
  }, [profile?.id, profile?.hubTransferPin]);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to asset changes for this agent to keep the list fresh
    const channel = supabase
      .channel(`agent-assets-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: profile.agentAccountType === 'company_admin' ? undefined : `verifier_id=eq.${profile.id}`
      }, () => {
        fetchCargo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.agentAccountType]);

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
  const totalWeight = realAssets.reduce((acc, asset) => acc + (parseFloat(asset.weight_kg) || 0), 0);
  const totalEstimatedValue = realAssets.reduce((acc, asset) => acc + (parseFloat(asset.estimated_value) || 0), 0);

  // Dynamically Group Inventory by Material Type
  const groupedInventoryMap = realAssets.reduce((acc, asset) => {
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
      const pin = Math.floor(1000 + Math.random() * 9000).toString();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_en_route: true,
          hub_transfer_pin: pin
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      addNotification(
        "Incoming Bulk Drop! 🚚",
        `Agent ${profile.name} is heading to the Hub with a full truck (~${totalWeight.toFixed(1)}kg).`,
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

  const handleTransferInventory = async () => {
    if (realAssets.length === 0) return;
    setIsTransferring(true);
    try {
      const assetIds = realAssets.map(a => a.id);

      const { error } = await supabase
        .from('assets')
        .update({ status: 'transferred_to_hub' })
        .in('id', assetIds);

      if (error) throw error;

      if (profile.agentAccountType === 'fleet_driver') {
        await supabase.from('profiles').update({ is_en_route: false }).eq('id', profile.id);
      }

      toast.success("Inventory Transferred! 📦", { description: "Assets successfully moved to the hub." });
      fetchCargo();
    } catch (err) {
      toast.error("Failed to transfer inventory");
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className={isCompanyOwner ? "space-y-8 animate-slide-up pb-20" : "space-y-6 pt-[calc(env(safe-area-inset-top,1rem)+2rem)] px-1.5 pb-24"}>

      {/* ── HEADER ── */}
      {isCompanyOwner ? (
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold dark:text-white tracking-tighter">Fleet Warehouse</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Live Inventory & Dispatches</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
                <Warehouse className="w-4 h-4" /> Hub Portal
             </div>
          </div>
        </header>
      ) : (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto transition-colors">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-[1rem] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Warehouse Portal</h1>
              <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Truck Load & Inventory</p>
            </div>
            <div className="w-10" />
          </div>
        </div>
      )}

      {/* ── GRID WRAPPER FOR ADMINS ── */}
      <div className={isCompanyOwner ? "grid lg:grid-cols-12 gap-8" : "space-y-6"}>
        
        {/* LEFT COLUMN */}
        <div className={isCompanyOwner ? "lg:col-span-5 space-y-8 h-fit" : "space-y-6 h-fit"}>
          
          {/* ── CURRENT TRUCK LOAD (BULK DISPATCH) ── */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-[1rem] relative overflow-hidden group shadow-xl shadow-emerald-500/20">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  {isCompanyOwner ? (
                    <Warehouse className="w-6 h-6 text-white" />
                  ) : (
                    <Truck className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white capitalize tracking-wider">
                    {isCompanyOwner ? 'Total Fleet Inventory' : 'Current Truck Load'}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium opacity-80 capitalize tracking-tight">
                    Verified Assets
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-white/10 backdrop-blur-md rounded-[1rem] border border-white/10">
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Value</p>
                  <p className="text-base font-bold text-white tracking-tight">KSh {totalEstimatedValue.toLocaleString()}</p>
                </div>

                <div className="p-4 bg-white/10 backdrop-blur-md rounded-[1rem] border border-white/10">
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-base font-bold text-white tracking-tight">{totalWeight.toFixed(1)} KG</p>
                </div>

                <div className="p-4 bg-white/10 backdrop-blur-md rounded-[1rem] border border-white/10">
                  <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Assets</p>
                  <p className="text-base font-bold text-white tracking-tight">{realAssets.length}</p>
                </div>
              </div>

              {profile?.agentAccountType === 'independent' && (
                <button
                  onClick={() => navigate('/warehouse/sell')}
                  className="mt-6 w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-700 rounded-[1rem] active:scale-95 transition-all shadow-lg text-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xs font-bold capitalize tracking-wider">Sell Stock Terminal</h3>
                      <p className="text-[10px] text-indigo-100 font-medium capitalize tracking-tight">Direct-to-Weaver Trade</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              )}

              {profile?.agentAccountType === 'fleet_driver' && (
                <div className="mt-6">
                  {profile?.hubTransferPin ? (
                    <div className="p-4 bg-emerald-500 rounded-[1rem] text-center shadow-lg border border-white/20 animate-bounce-in">
                      <p className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest mb-1">Gate PIN</p>
                      <div className="text-3xl font-black text-white tracking-widest">{profile.hubTransferPin}</div>
                    </div>
                  ) : (
                    <button
                      onClick={handleDispatch}
                      disabled={realAssets.length === 0}
                      className="w-full py-4 bg-white hover:bg-slate-50 text-emerald-700 rounded-[1rem] font-bold text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      Get Check-In Code
                    </button>
                  )}
                </div>
              )}

              {isCompanyOwner && (
                <button
                  onClick={handleTransferInventory}
                  disabled={isTransferring || realAssets.length === 0}
                  className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[1rem] font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 text-white disabled:opacity-50 backdrop-blur-md"
                >
                  {isTransferring ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  Receive Fleet Cargo
                </button>
              )}
            </div>
          </div>

          {/* ── CONSOLIDATION GOAL ── */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dispatch Goal</h3>
                <p className="text-sm font-bold dark:text-white">Next Factory Shipment</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-emerald-500">{(totalWeight / 500 * 100).toFixed(0)}%</p>
                <p className="text-[10px] font-bold text-slate-400 capitalize">{totalWeight.toFixed(1)} / 500 KG</p>
              </div>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalWeight / 500 * 100))}%` }}
                className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              />
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Bulk logistics unlocked at 500 KG
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={isCompanyOwner ? "lg:col-span-7 space-y-8 h-fit" : "space-y-6 h-fit"}>
          
          {/* ── DYNAMIC INVENTORY GRID ── */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-widest uppercase">Material Ledger</h3>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full uppercase tracking-widest hidden sm:block">Digital Traceability Active</span>
            </div>

            {realAssets.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[1rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-xs font-semibold text-slate-500 leading-relaxed uppercase tracking-widest">
                  Inventory Empty.<br />No verified assets found.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {realAssets.map(asset => (
                  <div key={asset.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[1rem] border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-all shadow-sm group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-xl shadow-sm border border-slate-100 dark:border-slate-700">
                          {asset.material_type?.toLowerCase().includes('plastic') ? '🥤' : '📦'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm capitalize tracking-tight">{asset.material_type} · Grade {asset.grade || 'B'}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-mono font-bold text-primary tracking-widest capitalize">{asset.digital_batch_id || `CF-${asset.id.substring(0, 8).toUpperCase()}`}</p>
                            <ShieldCheck className="w-3 h-3 text-emerald-500" />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-slate-900 dark:text-white">{asset.weight_kg}kg</p>
                        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">KSh {asset.estimated_value?.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── MATERIAL SALES (WEAVER CLAIMS) ── */}
          <div className="bg-white dark:bg-slate-900 rounded-[1rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white tracking-widest uppercase">Material Sales</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Weaver Payouts</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            {salesLoading ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <div className="w-8 h-8 border-4 border-indigo-100 dark:border-indigo-900 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syncing Orders...</p>
              </div>
            ) : materialSales.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-[1rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
                <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-xs font-semibold text-slate-500 leading-relaxed px-10 uppercase tracking-widest">
                  No material sales yet.<br />Verify recyclables to attract Weavers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {materialSales.map(sale => {
                  const statusCfg = CLAIM_STATUS[sale.status] || CLAIM_STATUS.pending;
                  return (
                    <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1rem] border border-slate-200 dark:border-slate-700 group active:scale-[0.98] transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-100 dark:border-slate-700">
                          📦
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{sale.quantity}kg Claimed</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                            <p className="text-[10px] font-bold text-slate-400">
                              {new Date(sale.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">KSh {Number(sale.total_price).toLocaleString()}</p>
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto mt-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
