import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Package, 
  ChevronRight, 
  ArrowRight,
  Navigation,
  Scale,
  Loader2
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { normalizeKeys, Asset, Profile } from '@klinflow/core/validation';

interface IncomingDrop {
  id: string;
  agent: string;
  material: string;
  weight: string;
  status: string;
  progress: number;
}

export default function IncomingDrops() {
  const [incoming, setIncoming] = useState<IncomingDrop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuthStore();

  const fetchIncoming = async () => {
    try {
      // 1. Fetch Agents who are en route
      let query = (supabase
        .from('profiles') as any)
        .select('id, name, is_en_route, agent_account_type, company_id')
        .eq('is_en_route', true);

      // Restrict to fleet drivers if logged in as Company Admin
      if (profile?.agentAccountType === 'company_admin') {
        query = query.eq('company_id', profile.id);
      }

      const { data: agents, error: agentError } = await query;

      if (agentError) throw agentError;

      // 2. For each agent, fetch their current truck load (verified assets)
      const enriched = await Promise.all((agents || []).map(async (agent: any) => {
        const { data: assets } = await supabase
          .from('assets')
          .select('weight_kg, material_type')
          .eq('verifier_id', agent.id)
          .eq('status', 'verified');

        const normalizedAssets = normalizeKeys(assets || []) as Asset[];
        const totalWeight = normalizedAssets.reduce((acc, a) => acc + (a.weightKg || 0), 0);
        const materials = Array.from(new Set(normalizedAssets.map(a => a.materialType))).join(', ');

        return {
          id: agent.id,
          agent: agent.name || 'Unknown Agent',
          material: materials || 'Mixed Loads',
          weight: `${totalWeight.toFixed(1)} KG`,
          status: 'En Route to Hub',
          progress: 80 
        };
      }));

      setIncoming(enriched);
    } catch (err) {
      console.error('[Radar] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncoming();

    // Listen for arrivals and state changes
    const channel = supabase
      .channel('hub-radar-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'is_en_route=eq.true' }, () => fetchIncoming())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => fetchIncoming())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">Live Logistics Radar</h1>
          <div className="text-xs text-slate-500 font-semibold mt-2 uppercase tracking-widest flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${incoming.length > 0 ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
            {incoming.length} Agents currently en route to Hub
          </div>
        </div>
        <button 
          onClick={fetchIncoming}
          className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 transition-colors"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
        </button>
      </div>

      {/* ── INCOMING LIST ── */}
      <div className="grid gap-4">
        {incoming.map((drop, i) => (
          <div key={i} className="glass p-6 rounded-[2.5rem] group hover:scale-[1.01] transition-all border border-slate-200 dark:border-white/5 relative overflow-hidden">
             
             {/* Progress Background */}
             <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-1000" style={{ width: `${drop.progress}%` }} />
             
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Agent & Material */}
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 dark:bg-white/5 flex items-center justify-center relative text-slate-400 group-hover:text-primary transition-colors">
                      <Truck className="w-8 h-8" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      </div>
                   </div>
                   <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">{drop.agent}</h3>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded-lg uppercase tracking-widest max-w-[150px] truncate">
                           {drop.material}
                         </span>
                         <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                           <Scale className="w-3 h-3" /> {drop.weight}
                         </span>
                      </div>
                   </div>
                </div>

                {/* ETA & Status */}
                <div className="flex items-center gap-8">
                   <div className="text-right hidden sm:block">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</p>
                      <p className="text-sm font-semibold text-primary mt-1">{drop.status}</p>
                   </div>
                   
                   <div className="flex items-center gap-3">
                      <button className="px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-xs uppercase tracking-widest flex items-center gap-2 group/btn active:scale-95 transition-all">
                         View Details
                         <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                   </div>
                </div>

             </div>
          </div>
        ))}

        {!isLoading && incoming.length === 0 && (
          <div className="p-20 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] text-center">
             <Clock className="w-12 h-12 text-slate-200 dark:text-white/5 mx-auto mb-4" />
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em]">No Incoming Agents Tracked</p>
          </div>
        )}
      </div>

    </div>
  );
}
