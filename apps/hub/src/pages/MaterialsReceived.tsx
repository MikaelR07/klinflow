import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  Search, 
  ListFilter,
  Loader2,
  Calendar,
  Box,
  Scale,
  User,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { normalizeKeys, Asset } from '@klinflow/core/validation';

interface ReceivedMaterial {
  id: string;
  digitalBatchId: string;
  agentName: string;
  agentAvatar?: string;
  sellerName: string;
  materialType: string;
  grade: string;
  weightKg: number;
  amountPaid: number;
  isManual: boolean;
  timeReceived: string;
  dateReceived: string;
}

export default function MaterialsReceived() {
  const { isDarkMode } = useThemeStore();
  const { profile } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [materials, setMaterials] = useState<ReceivedMaterial[]>([]);
  const [stats, setStats] = useState({
    totalReceivedToday: 0,
    totalWeight: 0,
    uniqueAgents: 0,
    pendingInspection: 0
  });

  const fetchReceivedMaterials = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await ((supabase
        .from('assets') as any)
        .select('*, profiles:verifier_id(name, avatar_url), booking:bookings(client:profiles!user_id(name))')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub')
        .order('updated_at', { ascending: false }));

      if (error) throw error;

      const normalized = (data || []).map((raw: any) => {
        const item = normalizeKeys(raw) as Asset & { profiles: any, booking: any };
        return {
          id: item.id,
          digitalBatchId: item.digitalBatchId || item.id.slice(0, 8).toUpperCase(),
          agentName: item.profiles?.name || 'Unknown Agent',
          agentAvatar: item.profiles?.avatar_url,
          sellerName: item.booking?.client?.name || 'Unknown Seller',
          materialType: item.materialType || 'Other',
          grade: item.grade || 'N/A',
          weightKg: Number(item.weightKg) || 0,
          amountPaid: Number(item.estimatedValue) || 0,
          isManual: !!item.isManual,
          timeReceived: new Date(item.updatedAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateReceived: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
        };
      });

      setMaterials(normalized);

      // Calculate Stats
      const uniqueAgentSet = new Set(normalized.map(m => m.agentName));
      setStats({
        totalReceivedToday: normalized.length,
        totalWeight: normalized.reduce((acc, curr) => acc + curr.weightKg, 0),
        uniqueAgents: uniqueAgentSet.size,
        pendingInspection: normalized.filter(m => m.isManual).length
      });

    } catch (err) {
      console.error('[MaterialsReceived] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceivedMaterials();

    const channel = supabase.channel('hub-received-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `hub_manager_id=eq.${profile?.id}`
      }, () => fetchReceivedMaterials())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const filteredMaterials = materials.filter(m => 
    m.agentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.materialType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>Materials Received</h1>
            <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Track and review all cargo received at the hub.</p>
          </div>
          <div className="flex gap-3">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Search logs..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className={`pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-colors w-full md:w-56 ${
                   isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500'
                 }`}
               />
               <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
             </div>
             <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-colors ${
               isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-[#e0e3eb] text-slate-900 hover:bg-slate-50'
             }`}>
               <ListFilter className="w-4 h-4" /> Filter
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-blue-500" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Received</p>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{stats.totalReceivedToday} <span className="text-sm font-medium text-slate-400">items</span></h2>
          </div>
          
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <Scale className="w-5 h-5 text-emerald-500" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Weight</p>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{stats.totalWeight.toFixed(1)} <span className="text-sm font-medium text-slate-400">KG</span></h2>
          </div>

          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Unique Agents</p>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{stats.uniqueAgents} <span className="text-sm font-medium text-slate-400">drivers</span></h2>
          </div>

          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pending Inspection</p>
            </div>
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{stats.pendingInspection} <span className="text-sm font-medium text-slate-400">manual logs</span></h2>
          </div>
        </div>

        {/* Table */}
        <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
          <div className="overflow-x-auto">
            {isLoading ? (
               <div className="p-10 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
               </div>
            ) : filteredMaterials.length === 0 ? (
               <div className="p-10 text-center">
                 <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                 <p className="text-sm font-bold text-slate-400">No received materials found</p>
               </div>
            ) : (
               <table className="font-medium w-full text-left text-sm">
                 <thead className={`text-[10px] uppercase tracking-widest font-bold ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50/50 text-slate-500'}`}>
                   <tr>
                     <th className="px-5 py-4">Agent Name</th>
                     <th className="px-5 py-4">Seller / Source</th>
                     <th className="px-5 py-4">Material Details</th>
                     <th className="px-5 py-4">Weight</th>
                     <th className="px-5 py-4">Paid</th>
                     <th className="px-5 py-4">Verification</th>
                     <th className="px-5 py-4">Time Received</th>
                     <th className="px-5 py-4 text-right">Waybill</th>
                   </tr>
                 </thead>
                 <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-[#e0e3eb]'}`}>
                   {filteredMaterials.map((m) => (
                     <tr key={m.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                       <td className="px-5 py-4">
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-100'}`}>
                              {m.agentAvatar ? (
                                <img src={m.agentAvatar} alt={m.agentName} className="w-full h-full object-cover" />
                              ) : (
                                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{m.agentName.charAt(0)}</span>
                              )}
                           </div>
                           <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{m.agentName}</p>
                         </div>
                       </td>
                       <td className="px-5 py-4">
                         <div className="flex items-center gap-1.5">
                           <User className="font-medium w-3 h-3 text-slate-400 shrink-0" />
                           <span className={`text-xs font-medium truncate max-w-[120px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} title={m.sellerName}>{m.sellerName}</span>
                         </div>
                       </td>
                       <td className="px-5 py-4">
                         <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{m.materialType}</p>
                         <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Grade {m.grade}</p>
                       </td>
                       <td className="px-5 py-4">
                         <span className={`text-sm font-mono font-medium ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{m.weightKg.toFixed(1)} KG</span>
                       </td>
                       <td className="px-5 py-4">
                         <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KES {m.amountPaid.toLocaleString()}</p>
                       </td>
                       <td className="px-5 py-4">
                         {m.isManual ? (
                            <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center gap-1 w-max">
                              <ShieldAlert className="w-3 h-3" /> Manual
                            </span>
                         ) : (
                            <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center gap-1 w-max">
                              <ShieldCheck className="w-3 h-3" /> AI Verified
                            </span>
                         )}
                       </td>
                       <td className="px-5 py-4">
                         <div className="flex items-center gap-2">
                            <Clock className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                            <div>
                               <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{m.timeReceived}</p>
                               <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.dateReceived}</p>
                            </div>
                         </div>
                       </td>
                       <td className="px-5 py-4 text-right">
                         <button className={`text-xs font-bold flex items-center justify-end gap-1 w-full uppercase tracking-widest transition-colors ${isDarkMode ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-500'}`}>
                           {m.digitalBatchId} <ArrowRight className="w-3 h-3" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
