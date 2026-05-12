import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuthStore, useNotificationStore, useAssetStore, supabase } from '@cleanflow/core';
import { toast } from 'sonner';

const CLAIM_STATUS = {
  held_in_escrow: { label: 'In Escrow', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  funds_released: { label: 'Paid Out', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  pending:        { label: 'Pending',   color: 'text-amber-600 bg-amber-50 border-amber-100' },
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

  // 1. Fetch real cargo from DB (Includes "God View" for Company Admins)
  const fetchCargo = async () => {
    if (!profile?.id) return;
    try {
      let query = supabase.from('assets').select('*').eq('status', 'verified');
      
      if (profile.agent_account_type === 'company_admin') {
        // God View: Fetch assets for all fleet drivers belonging to this company
        const { data: drivers } = await supabase.from('profiles').select('id').eq('company_id', profile.id);
        const driverIds = drivers?.map(d => d.id) || [];
        query = query.in('verifier_id', [profile.id, ...driverIds]);
      } else {
        // Normal View: Just this agent's assets
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
  }, [profile?.id, profile?.hub_transfer_pin]);

  useEffect(() => {
    if (!profile?.id) return;
    
    // Subscribe to asset changes for this agent to keep the list fresh
    const channel = supabase
      .channel(`agent-assets-${profile.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'assets',
        filter: profile.agent_account_type === 'company_admin' ? undefined : `verifier_id=eq.${profile.id}`
      }, () => {
        fetchCargo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.agent_account_type]);

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
        profile.company_id || null // Targeted Hub Manager if available
      );
      
      toast.success("Check-In Requested! 🏢", {
        description: "Please show your secure PIN at the gate."
      });
    } catch (err) {
      toast.error("Failed to request check-in");
      console.error(err);
    }
  };

  // Empty Truck / Receive Cargo Workflow
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
      
      if (profile.agent_account_type === 'fleet_driver') {
        await supabase.from('profiles').update({ is_en_route: false }).eq('id', profile.id);
      }
      
      toast.success("Inventory Transferred! 📦", { description: "Assets successfully moved to the hub." });
      fetchCargo(); // Refresh the list to 0
    } catch (err) {
      toast.error("Failed to transfer inventory");
      console.error(err);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 active:scale-95 transition-transform">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Warehouse Portal</h1>
            <p className="text-xs text-primary font-semibold">
              {profile?.agent_account_type === 'company_admin' ? 'Total Fleet Inventory' : 'Truck Load & Inventory'}
            </p>
          </div>
        </div>
      </div>

      {/* ── CURRENT TRUCK LOAD (BULK DISPATCH) ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-4 rounded-2xl relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    {profile?.agent_account_type === 'company_admin' ? (
                    <Warehouse className="w-5 h-5 text-white" />
                    ) : (
                    <Truck className="w-5 h-5 text-white" />
                    )}
                </div>
                <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {profile?.agent_account_type === 'company_admin' ? 'Fleet Inventory' : 'Current Truck Load'}
                    </h3>
                    <p className="text-[10px] text-emerald-100 font-medium opacity-80 uppercase tracking-tight">
                    Verified for Dispatch
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
               <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Value</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">KSh {totalEstimatedValue.toLocaleString()}</p>
               </div>
               
               <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Weight</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{totalWeight.toFixed(1)} KG</p>
               </div>

               <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Assets</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{realAssets.length}</p>
               </div>
            </div>

            {profile?.agent_account_type === 'independent' && (
               <button 
                 onClick={() => navigate('/warehouse/sell')}
                 className="mt-3 w-full flex items-center justify-between p-3 bg-indigo-600 rounded-xl active:scale-95 transition-all group shadow-sm text-white"
               >
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
                     <Tag className="w-4 h-4" />
                   </div>
                   <div className="text-left">
                     <h3 className="text-[10px] font-bold uppercase tracking-wider">Sell Stock Terminal</h3>
                     <p className="text-[8px] text-indigo-100 font-medium uppercase tracking-tight">Direct-to-Weaver Trade</p>
                   </div>
                 </div>
                 <ChevronRight className="w-4 h-4 text-white" />
               </button>
            )}

            {profile?.agent_account_type === 'fleet_driver' && (
              <div className="mt-3">
                {profile?.hub_transfer_pin ? (
                  <div className="p-3 bg-emerald-500 rounded-xl text-center shadow-lg border border-white/10 animate-bounce-in">
                    <p className="text-[9px] font-bold text-emerald-900 uppercase tracking-widest mb-1">Gate PIN</p>
                    <div className="text-2xl font-black text-white tracking-widest">{profile.hub_transfer_pin}</div>
                  </div>
                ) : (
                  <button 
                    onClick={handleDispatch}
                    disabled={realAssets.length === 0}
                    className="w-full py-2.5 bg-white text-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all disabled:opacity-50"
                  >
                    Get Check-In Code
                  </button>
                )}
              </div>
            )}
            
            {profile?.agent_account_type === 'company_admin' && (
               <button 
                 onClick={handleTransferInventory}
                 disabled={isTransferring || realAssets.length === 0}
                 className="mt-3 w-full py-3 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 text-slate-900 dark:text-white disabled:opacity-50"
               >
                 <CheckCircle2 className="w-4 h-4" />
                 Receive Fleet Cargo
               </button>
            )}
         </div>
      </div>

      {/* ── DYNAMIC INVENTORY GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Stocked Materials</h3>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Real-Time DB</span>
        </div>

        {dynamicInventory.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              Inventory Empty.<br/>No verified assets found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {dynamicInventory.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className={`w-7 h-7 rounded-lg bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500 shrink-0`}>
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-[10px] uppercase tracking-tighter truncate">{item.type}</h4>
                </div>
                <div className="flex items-baseline gap-0.5">
                  <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{item.weight.toFixed(1)}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">kg</span>
                </div>
                <p className="text-[9px] font-semibold text-primary truncate">KSh {item.totalValue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MATERIAL SALES (WEAVER CLAIMS) ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-8 px-2">
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Material Sales</h3>
            <p className="text-xs text-slate-500">Weaver Payouts</p>
          </div>
          <Package className="w-5 h-5 text-indigo-400" />
        </div>

        {salesLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Syncing Orders...</p>
          </div>
        ) : materialSales.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400 leading-relaxed px-10">
              No material sales yet.<br/>Verify recyclables to attract Weavers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {materialSales.map(sale => {
              const statusCfg = CLAIM_STATUS[sale.status] || CLAIM_STATUS.pending;
              return (
                <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm">
                      📦
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{sale.quantity}kg Claimed</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <p className="text-xs font-semibold text-slate-400">
                          {new Date(sale.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">KSh {Number(sale.total_price).toLocaleString()}</p>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
