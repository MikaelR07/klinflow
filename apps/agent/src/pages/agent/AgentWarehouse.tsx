import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  TrendingUp,
  Tag,
  Truck,
  Scale,
  ChevronRight,
  Wallet,
  Warehouse
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
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
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories, allCategories, fetchAllCategories } = useServiceStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [realAssets, setRealAssets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [materialSales, setMaterialSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(true);

  const resolveMaterialName = (asset: any) => {
    const rawType = asset.material_type;
    if (!rawType) return 'Unknown Material';
    
    // If it's a UUID, try to resolve it from our stores
    if (rawType.length > 20 && rawType.includes('-')) {
      const subcat = materialPrices?.find((m: any) => m.id === rawType);
      if (subcat?.material_name) return subcat.material_name;
      
      const cat = categories?.find((c: any) => c.id === rawType);
      if (cat?.label) {
        // If material_type is exactly the category UUID, but we have a grade, the grade is probably the specific material!
        if (asset.grade && asset.grade !== 'Standard' && asset.grade !== 'Premium' && asset.grade !== 'Low Grade') {
          return asset.grade;
        }
        return cat.label; // Fallback to category if no specific material
      }
      
      const allCat = allCategories?.find((c: any) => c.id === rawType);
      if (allCat?.label) return allCat.label;
      
      // If it's an unresolved UUID (e.g., legacy data), show a clean fallback instead of the full UUID
      return asset.grade && asset.grade.length > 2 ? asset.grade : `Legacy Material`;
    }
    
    // If it's just a regular string slug (e.g., 'plastic', 'HDPE')
    // If it's a category slug like 'plastic' but we have a specific grade, show the grade!
    if (['plastic', 'metal', 'paper', 'glass', 'e_waste'].includes(rawType.toLowerCase())) {
        if (asset.grade && asset.grade !== 'Standard' && asset.grade !== 'Premium' && asset.grade !== 'Low Grade') {
            return asset.grade;
        }
    }

    return rawType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

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
    fetchAllCategories();
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

      /* addNotification removed for v3 migration */

      toast.success("Check-In Requested! 🏢", {
        description: "Please show your secure PIN at the gate."
      });
    } catch (err) {
      toast.error("Failed to request check-in");
      console.error(err);
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
            <p className="text-[9px] text-emerald-100 font-medium tracking-wider uppercase mt-0.5">Estimated Cargo & Analytics</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="relative z-10 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] px-1.5 max-w-lg mx-auto space-y-6">
        
        {/* ── TOP SECTION ── */}
        {profile?.agentAccountType === 'independent' ? (
          // --- INDEPENDENT AGENT VIEW: SELLER STOREFRONT ---
          <div className="space-y-4 px-1 pb-2">
             <div className="mb-2">
                <h2 className="text-[17px] font-black text-slate-900 dark:text-white capitalize tracking-wide">Seller Storefront</h2>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">Connect directly with large recyclers and hubs. List your materials and manage your business.</p>
             </div>

             {/* Banner 1: Sell Collection */}
             <div 
               onClick={() => navigate('/warehouse/sell')}
               className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-800 p-6 shadow-xl shadow-blue-500/20 border border-blue-500/30 cursor-pointer active:scale-[0.98] transition-all group"
             >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-0 duration-300"></div>
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full min-h-[140px]">
                   <div className="w-12 h-12 rounded-[1rem] bg-white/20 flex items-center justify-center backdrop-blur-md mb-auto border border-white/20 shadow-inner">
                      <Tag className="w-6 h-6 text-white" />
                   </div>
                   <div className="mt-5">
                     <h3 className="text-xl font-black text-white tracking-wide">Sell New Collection</h3>
                     <p className="text-[11px] text-blue-100/90 mt-1.5 leading-relaxed font-medium max-w-[85%]">
                       Ready to offload? Create a new listing and offer your collected materials to the highest bidders in the network.
                     </p>
                   </div>
                   <div className="absolute right-0 bottom-2 bg-white/20 p-2.5 rounded-full backdrop-blur-xl border border-white/20 group-hover:bg-white/30 transition-colors">
                     <ChevronRight className="w-5 h-5 text-white" />
                   </div>
                </div>
             </div>

             {/* Banner 2: B2B Trade Hub */}
             <div 
               onClick={() => navigate('/warehouse/trade')}
               className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-800 p-6 shadow-xl shadow-emerald-500/20 border border-emerald-500/30 cursor-pointer active:scale-[0.98] transition-all group mt-4"
             >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors z-0 duration-300"></div>
                <div className="absolute -left-10 top-0 w-40 h-40 bg-white/10 rounded-full blur-3xl z-0"></div>
                
                <div className="relative z-10 flex flex-col h-full min-h-[140px]">
                   <div className="flex justify-between items-start">
                     <div className="w-12 h-12 rounded-[1rem] bg-white/20 flex items-center justify-center backdrop-blur-md mb-auto border border-white/20 shadow-inner">
                        <TrendingUp className="w-6 h-6 text-white" />
                     </div>
                     <div className="px-3.5 py-1.5 bg-white/20 rounded-full backdrop-blur-xl border border-white/20 shadow-inner">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{materialSales.filter((s:any) => s.status === 'open').length} Active</span>
                     </div>
                   </div>
                   <div className="mt-5">
                     <h3 className="text-xl font-black text-white tracking-wide">B2B Trade Hub</h3>
                     <p className="text-[11px] text-emerald-100/90 mt-1.5 leading-relaxed font-medium max-w-[85%]">
                       Manage your active listings, track pending orders from recyclers, and view your sales history.
                     </p>
                   </div>
                   <div className="absolute right-0 bottom-2 bg-white/20 p-2.5 rounded-full backdrop-blur-xl border border-white/20 group-hover:bg-white/30 transition-colors">
                     <ChevronRight className="w-5 h-5 text-white" />
                   </div>
                </div>
             </div>
          </div>
        ) : (
          // --- FLEET DRIVER VIEW ---
          <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 pb-2 -mx-1.5 px-1.5">
            <div className="snap-center shrink-0 w-full">
              <div className="bg-blue-600 p-4 rounded-xl relative overflow-hidden group border border-blue-500/50 h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[60px] -mr-16 -mt-16" />
                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Top Estimated Weight */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Warehouse className="w-4 h-4 text-white opacity-70" />
                        <p className="text-[12px] font-bold text-white capitalize tracking-widest opacity-80">Estimated Collection</p>
                      </div>
                      <div className="flex items-baseline gap-1.5 text-white">
                        <h3 className="text-3xl text-white font-bold">{(totalVerifiedWeight + totalOfflineWeight).toFixed(1)}</h3>
                        <span className="text-xs font-bold opacity-70">KG</span>
                      </div>
                    </div>
                  </div>

                  {/* 3 Metrics Row */}
                  <div className="grid grid-cols-3 gap-1 mb-4">
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
                      <p className="text-[8px] font-bold text-blue-100 uppercase tracking-widest">Verified</p>
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
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  const displayName = resolveMaterialName(asset);
                  
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-400/50 transition-all group">
                      
                      {/* Left: Name + Date + ID */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <h4 className="font-bold text-[13px] text-slate-900 dark:text-white capitalize truncate leading-tight">
                            {displayName}
                          </h4>
                          {asset.material_category && (
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              {asset.material_category.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
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
                          KSh {asset.estimated_value ? asset.estimated_value.toLocaleString() : (parseFloat(asset.weight_kg) * getPrice(asset.material_type)).toLocaleString()}
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



    </div>
  );
}
