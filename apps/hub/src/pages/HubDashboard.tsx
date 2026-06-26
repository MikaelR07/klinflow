import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  Users, 
  ArrowUpRight, 
  Zap, 
  Box, 
  ArrowRight,
  AlertCircle,
  MapPin,
  Loader2,
  ShieldCheck,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { normalizeKeys, Asset, Profile } from '@klinflow/core/validation';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface HubAlert {
  id: string;
  agent: string;
  profile_picture_url?: string;
  weight: string;
  status: string;
}

interface AgentVisit {
  id: string;
  agentId: string;
  agentName: string;
  agentAvatar?: string;
  totalWeight: number;
  time: string;
  date: string;
  materials: {
    id: string;
    type: string;
    weight: number;
    grade?: string;
  }[];
}

interface HubDashboardProps {
  onNavigate?: (tab: string) => void;
}

export default function HubDashboard({ onNavigate }: HubDashboardProps) {
  const { profile } = useAuthStore();
  
  // Real-Time Data States
  const [isLoading, setIsLoading] = useState(true);
  const [inventoryWeight, setInventoryWeight] = useState(0);
  const [activePersonnel, setActivePersonnel] = useState(0);
  const [recentArrivals, setRecentArrivals] = useState<AgentVisit[]>([]);
  const [incomingAlerts, setIncomingAlerts] = useState<HubAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const fetchDashboardData = async () => {
    if (!profile?.id) return;

    try {
      // 1. Get relevant driver IDs for this specific company
      let driverIds: string[] = [profile.id];
      if (profile.agentAccountType === 'company_admin') {
        const { data: drivers } = await ((supabase
          .from('profiles') as any)
          .select('id')
          .eq('company_id', profile.id));
        driverIds = [profile.id, ...(drivers?.map((d: any) => d.id) || [])];
      }
      
      // Ensure driverIds only contains valid UUID strings
      driverIds = [...new Set(driverIds)].filter(id => id && id.length > 20);

      if (driverIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // 2. Fetch Actual Inventory
      const { data: hubAssets } = await ((supabase
        .from('assets') as any)
        .select('weight_kg')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub'));
        
      const normalizedHubAssets = normalizeKeys(hubAssets || []) as Asset[];
      const totalInventory = normalizedHubAssets.reduce((acc, curr) => acc + (Number(curr.weightKg) || 0), 0) || 0;
      setInventoryWeight(totalInventory);

      // 3. Fetch Recent Logistics
      const { data: recent, error: recentError } = await ((supabase
        .from('assets') as any)
        .select('*, profiles:verifier_id(name, avatar_url)')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub')
        .order('created_at', { ascending: false })
        .limit(20));

      if (recentError) throw recentError;

      if (recent && recent.length > 0) {
        const groups = (recent as any[]).reduce<Record<string, AgentVisit>>((acc, rawAsset) => {
          const asset = normalizeKeys(rawAsset) as Asset & { profiles: any };
          const agentId = asset.verifierId || 'unknown';
          const timeKey = new Date(asset.createdAt).setSeconds(0,0);
          const key = `${agentId}-${timeKey}`;
          
          if (!acc[key]) {
            acc[key] = {
              id: key,
              agentId: agentId,
              agentName: asset.profiles?.name || 'Unknown Agent',
              agentAvatar: asset.profiles?.avatar_url,
              totalWeight: 0,
              time: new Date(asset.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              date: new Date(asset.createdAt).toLocaleDateString(),
              materials: []
            };
          }
          acc[key].totalWeight += Number(asset.weightKg) || 0;
          acc[key].materials.push({
            id: asset.id,
            type: asset.materialType || 'Other',
            weight: Number(asset.weightKg) || 0,
            grade: asset.grade
          });
          return acc;
        }, {});

        setRecentArrivals(Object.values(groups).slice(0, 5));
      } else {
        setRecentArrivals([]);
      }

      // 4. Fetch Active Personnel
      const { data: activeDrivers } = await ((supabase
        .from('profiles') as any)
        .select('id, name, is_en_route, avatar_url')
        .in('id', driverIds)
        .eq('is_en_route', true));
        
      const normalizedActive = normalizeKeys(activeDrivers || []) as Profile[];
      setActivePersonnel(normalizedActive.length);

      if (normalizedActive.length > 0) {
        const alerts = await Promise.all(normalizedActive.map(async (d) => {
          const { data: driverLoad } = await ((supabase
             .from('assets') as any)
             .select('weight_kg')
             .eq('verifier_id', d.id)
             .eq('status', 'verified'));
          
          const normalizedLoad = normalizeKeys(driverLoad || []) as Asset[];
          const incomingWeight = normalizedLoad.reduce((acc, curr) => acc + (Number(curr.weightKg) || 0), 0) || 0;

          return {
            id: d.id,
            agent: d.name || 'Agent',
            profile_picture_url: d.avatarUrl || undefined,
            weight: `${incomingWeight.toFixed(1)} KG`,
            status: 'En Route to Hub'
          };
        }));
        setIncomingAlerts(alerts);
      } else {
        setIncomingAlerts([]);
      }

    } catch (error: any) {
      console.error('[Hub Dashboard] Error:', error);
      toast.error(`Dashboard Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // ── REAL-TIME RADAR ──
    const radarChannel = supabase.channel('hub-radar-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: profile?.agentAccountType === 'company_admin' ? `company_id=eq.${profile?.id}` : `id=eq.${profile?.id}`
      }, (payload) => {
        console.log('[Radar] Incoming change detected:', payload.new.name);
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `hub_manager_id=eq.${profile?.id}`
      }, () => {
        console.log('[Inventory] Warehouse update detected.');
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(radarChannel);
    };
  }, [profile?.id, profile?.agentAccountType]);

  // ── AGENT VISIT CARD SUB-COMPONENT ──
  interface AgentVisitCardProps {
    visit: AgentVisit;
    defaultOpen?: boolean;
  }

  const AgentVisitCard = ({ visit, defaultOpen = false }: AgentVisitCardProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div className={`glass rounded-[2rem] overflow-hidden transition-all duration-500 border ${isOpen ? 'border-primary/20 shadow-xl' : 'border-slate-100 dark:border-white/5'}`}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 dark:active:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center shrink-0 border border-slate-200 dark:border-white/10 overflow-hidden">
               {visit.agentAvatar ? (
                 <img src={visit.agentAvatar} alt={visit.agentName} className="w-full h-full object-cover" />
               ) : (
                 <span className="text-lg font-semibold text-slate-400">{visit.agentName.charAt(0)}</span>
               )}
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{visit.agentName}</h3>
                 <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-md uppercase tracking-widest">Received</span>
               </div>
               <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">{visit.time} · {visit.date}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Payload</p>
                <p className="text-lg font-semibold text-primary leading-none">{visit.totalWeight.toFixed(1)} <span className="text-xs">KG</span></p>
             </div>
             <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown className="font-medium w-5 h-5 text-slate-300" />
             </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <div className="px-5 pb-5 pt-0 overflow-hidden">
              <div className="bg-slate-50/50 dark:bg-white/5 rounded-2xl p-4 space-y-3">
                 <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">Cargo Breakdown</span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">{visit.materials.length} Items</span>
                 </div>
                 
                 <div className="space-y-2">
                   {visit.materials.map((m, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Box className="w-4 h-4" />
                           </div>
                           <div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.type}</p>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Grade {m.grade || 'A'}</p>
                           </div>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{m.weight.toFixed(1)} KG</p>
                     </div>
                   ))}
                 </div>
                 
                 <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-white/10 mt-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Audit ID: #{visit.id.slice(-6).toUpperCase()}</span>
                    <button className="text-xs font-semibold text-primary uppercase tracking-widest hover:underline">View Waybill</button>
                 </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Derived Stats Array
  const LIVE_STATS = [
    { label: 'Current Inventory', value: `${inventoryWeight.toFixed(1)} KG`, icon: Package, color: 'text-primary' },
    { label: 'Completed Drop-offs', value: `${recentArrivals.length} Trips`, icon: Truck, color: 'text-accent' },
    { label: 'Processed Stock', value: '0.0 KG', icon: Zap, color: 'text-amber-500' }, // Placeholder for future processing engine
    { label: 'Incoming Agent Drops', value: `${activePersonnel} Online`, icon: Users, color: 'text-slate-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {profile?.agentAccountType === 'company_admin' ? `${profile?.name}'s Fleet Hub` : 'Global Verification Hub'}
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1 uppercase tracking-widest flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> {profile?.location?.estate || 'Regional Operations Center'}
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={fetchDashboardData}
             className="px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-500 rounded-2xl text-xs font-semibold uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2"
           >
             {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Sync Data'}
           </button>
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest">Hub Online</span>
           </div>
        </div>
      </div>

      {/* ── INCOMING LIVE ALERTS ── */}
      {incomingAlerts.filter(a => !dismissedAlerts.includes(a.id)).length > 0 && (
        <div className="space-y-3">
          {incomingAlerts.filter(a => !dismissedAlerts.includes(a.id)).map((alert) => (
            <div key={alert.id} className="font-medium relative bg-emerald-600 rounded-[2rem] p-4 text-white shadow-xl shadow-emerald-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce-in">
               {/* Dismiss Button - Badge Style */}
               <button 
                 onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                 className="font-medium absolute -top-2 -right-2 w-7 h-7 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-50 transition-all z-50 border-2 border-emerald-600"
                 title="Dismiss Alert"
               >
                 <X className="w-4 h-4" />
               </button>

               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                     {alert.profile_picture_url ? (
                        <img src={alert.profile_picture_url} alt={alert.agent} className="w-full h-full object-cover" />
                     ) : (
                        <span className="text-lg font-semibold text-white">{alert.agent.charAt(0)}</span>
                     )}
                  </div>
                  <div>
                     <h3 className="text-sm font-semibold leading-none">Incoming Fleet</h3>
                     <p className="text-xs font-semibold text-emerald-100 mt-1 uppercase tracking-widest">
                       {alert.agent} · {alert.weight}
                     </p>
                  </div>
               </div>
               <button 
                 onClick={() => onNavigate?.('checkin')}
                 className="px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap"
               >
                 Prepare Gate
               </button>
            </div>
          ))}
        </div>
      )}

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {LIVE_STATS.map((stat, i) => (
          <div key={i} className="glass p-5 rounded-[2.5rem] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
             <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
             <stat.icon className={`w-8 h-8 ${stat.color} mb-4`} />
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mt-1">
               {isLoading ? <Loader2 className="font-medium w-6 h-6 animate-spin text-slate-300" /> : stat.value}
             </h3>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* ── RECENT LOGISTICS (AGENT-CENTRIC COLLAPSIBLE) ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Logistics</h2>
             <span className="text-xs font-semibold text-slate-400">Showing last 5 truck arrivals</span>
          </div>
          
          <div className="space-y-3">
             {isLoading ? (
                <div className="glass p-10 flex justify-center rounded-[2rem]">
                   <Loader2 className="font-medium w-8 h-8 animate-spin text-slate-300" />
                </div>
             ) : recentArrivals.length === 0 ? (
                <div className="glass p-10 text-center rounded-[2rem]">
                   <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">No Cargo Received Yet</p>
                </div>
             ) : (
                recentArrivals.map((visit, idx) => (
                  <AgentVisitCard key={visit.id} visit={visit} defaultOpen={idx === 0} />
                ))
             )}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="space-y-4">
           <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest px-2">Operator Actions</h2>
           <div className="flex flex-col gap-3">
              {/* Note: Ideally we use setActiveTab('checkin') if this was inside App.jsx, but since it's a child component, we'll keep it as a UI button for now or pass props */}
              <button 
                onClick={() => onNavigate?.('checkin')}
                className="font-medium w-full p-6 bg-primary text-white rounded-[2rem] flex items-center justify-between group hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                       <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                       <p className="font-semibold text-sm">Gate Check-In</p>
                       <p className="font-medium text-xs opacity-70">Verify Agent Secure PIN</p>
                    </div>
                 </div>
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="font-medium w-full p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] flex items-center justify-between group hover:shadow-xl transition-all active:scale-95">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 dark:bg-slate-100 flex items-center justify-center">
                       <Box className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                       <p className="font-semibold text-sm">B2B Outbound</p>
                       <p className="font-medium text-xs opacity-70">Log shipment to factory</p>
                    </div>
                 </div>
                 <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>

              <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] flex items-start gap-4">
                 <AlertCircle className="font-medium w-5 h-5 text-amber-500 mt-1 shrink-0" />
                 <div>
                    <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest">Storage Monitoring</p>
                    <p className="font-medium text-xs text-amber-700/70 mt-1">
                      Current physical inventory is at {inventoryWeight.toFixed(1)} KG. Manage processing soon.
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>

    </div>
  );
}
