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
        'hub'
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
    <div className="space-y-6 animate-fade-in pb-10 pt-2">
      
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
      <div className="glass p-5 rounded-3xl border border-emerald-500/20 relative overflow-hidden group">
         <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl" />
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                     {profile?.agent_account_type === 'company_admin' ? (
                       <Warehouse className="w-6 h-6 text-emerald-600" />
                     ) : (
                       <Truck className="w-6 h-6 text-emerald-600" />
                     )}
                  </div>
                  <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                       {profile?.agent_account_type === 'company_admin' ? 'Total Incoming Cargo' : 'Current Truck Load'}
                     </h3>
                     <p className="text-xs text-slate-400 font-medium mt-1">
                       {profile?.agent_account_type === 'company_admin' ? 'Active across all drivers' : 'Ready for Drop-off'}
                     </p>
                  </div>
               </div>
            </div>

            <div className="columns-2 gap-3 mb-5 space-y-3">
               <div className="break-inside-avoid p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                     <Package className="w-4 h-4 text-emerald-600" />
                     <p className="text-xs font-semibold text-emerald-600">Private Stockpile</p>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">KSh {totalEstimatedValue.toLocaleString()}</p>
               </div>
               
               <div className="break-inside-avoid p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Live Weight</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{totalWeight.toFixed(1)} KG</p>
               </div>

               <div className="break-inside-avoid p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                  <p className="text-xs font-semibold text-slate-400 mb-1">Verified Pickups</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{realAssets.length}</p>
               </div>
            </div>

            {profile?.agent_account_type === 'fleet_driver' && (
              <>
                {profile?.hub_transfer_pin ? (
                  <div className="p-6 bg-emerald-500 rounded-[2rem] text-center shadow-xl shadow-emerald-500/20 animate-bounce-in">
                    <p className="text-xs font-semibold text-emerald-900 mb-2">Gate Verification PIN</p>
                    <div className="text-5xl font-semibold text-white">{profile.hub_transfer_pin}</div>
                    <p className="text-xs font-semibold text-emerald-100 mt-3">Show this code to the Hub Manager to transfer cargo.</p>
                  </div>
                ) : (
                  <button 
                    onClick={handleDispatch}
                    disabled={realAssets.length === 0}
                    className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:active:scale-100"
                  >
                    Notify hub and get check-in code
                  </button>
                )}
              </>
            )}
            
            {profile?.agent_account_type === 'company_admin' && (
               <button 
                 onClick={handleTransferInventory}
                 disabled={isTransferring || realAssets.length === 0}
                 className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                 <CheckCircle2 className="w-5 h-5" />
                 RECEIVE ALL FLEET CARGO
               </button>
            )}
         </div>
      </div>



      {/* ── DIRECT MARKETPLACE TRADE (NEW FEATURE) ── */}
      <div className="bg-indigo-600 rounded-3xl p-6 shadow-xl shadow-indigo-600/20 relative overflow-hidden group border border-indigo-400/30">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Sell Stock Terminal</h3>
              <p className="text-xs text-indigo-100 font-medium">Bypass the hub & sell to weavers</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/warehouse/sell')}
            className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-semibold text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            SELL STOCK DIRECTLY
          </button>
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
          <div className="grid grid-cols-2 gap-3">
            {dynamicInventory.map(item => (
              <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-colors shadow-sm">
                <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-500 mb-3`}>
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-1 capitalize">{item.type}</h4>
                <p className="text-2xl font-semibold text-primary mb-1">{item.weight.toFixed(1)}<span className="text-sm text-slate-400">kg</span></p>
                <p className="text-xs font-semibold text-slate-400">KSh {item.totalValue.toLocaleString()}</p>
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
