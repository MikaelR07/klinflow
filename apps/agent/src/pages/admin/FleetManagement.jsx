import { useEffect, useState } from 'react';
import { useAuthStore, useAgentStore, getThumbnailUrl } from '@cleanflow/core';
import { Users, Search, Filter, Mail, Phone, MoreVertical, ShieldCheck, UserMinus, UserPlus, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function FleetManagement() {
  const profile = useAuthStore(s => s.profile);
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const isLoadingFleet = useAgentStore(s => s.isLoadingFleet);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, online, offline

  useEffect(() => {
    fetchFleetDrivers();
  }, []);

  const handleCopyCode = () => {
    if (profile?.fleet_invite_code) {
      navigator.clipboard.writeText(profile.fleet_invite_code);
      toast.success('Code Copied!', { description: 'Share this with your new drivers.' });
    }
  };

  const filteredDrivers = fleetDrivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         driver.phone.includes(searchQuery);
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'online' && driver.is_online) || 
                         (filterStatus === 'offline' && !driver.is_online);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">Agent Roster</h1>
            <button 
              onClick={() => fetchFleetDrivers()}
              className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-primary hover:text-white transition-all"
              title="Refresh Roster"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingFleet ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Complete personnel management for {profile?.company_name}.</p>
        </div>

        {/* Invite Code Quick Access */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-6 shadow-sm">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <UserPlus className="w-5 h-5" />
              </div>
              <div>
                 <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fleet Invite Code</p>
                 <p className="text-sm font-semibold font-mono tracking-tighter text-slate-900 dark:text-white">{profile?.fleet_invite_code || '---'}</p>
              </div>
           </div>
           <button 
             onClick={handleCopyCode}
             className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95"
           >
              <Copy className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER BAR ── */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
           <input 
             type="text" 
             placeholder="Search by name or phone..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
           />
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
           {['all', 'online', 'offline'].map((status) => (
             <button
               key={status}
               onClick={() => setFilterStatus(status)}
               className={`px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all ${
                 filterStatus === status 
                   ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                   : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
               }`}
             >
               {status}
             </button>
           ))}
        </div>
      </div>

      {/* ── AGENTS TABLE / GRID ── */}
      <div className="glass rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/5">
        {isLoadingFleet ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">Syncing Roster...</p>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="py-20 text-center">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest">No matching agents found</p>
             <p className="text-xs text-slate-500 font-semibold mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/5">
                  <th className="p-6 text-xs font-semibold text-slate-400 uppercase tracking-widest">Agent Detail</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 uppercase tracking-widest text-center">Performance</th>
                  <th className="p-6 text-xs font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredDrivers.map((agent) => (
                  <tr key={agent.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="p-6">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-semibold border-2 overflow-hidden shadow-sm ${
                            agent.is_online ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                          }`}>
                            {agent.avatar_url ? (
                              <img src={getThumbnailUrl(agent.avatar_url, { width: 150 })} className="w-full h-full object-cover" />
                            ) : (
                              agent.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{agent.name}</p>
                             <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-tighter">{agent.phone}</p>
                          </div>
                       </div>
                    </td>
                    <td className="p-6">
                       <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest ${
                         agent.is_online ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                       }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${agent.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          {agent.is_online ? 'Online' : 'Off-Duty'}
                       </div>
                    </td>
                    <td className="p-6">
                       <div className="flex flex-col items-center">
                          <p className="text-sm font-semibold text-primary">{agent.reward_points || 0}</p>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Track Points</p>
                       </div>
                    </td>
                    <td className="p-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => window.location.href = `tel:${agent.phone}`}
                            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-primary hover:border-primary transition-all"
                            title="Call Agent"
                          >
                             <Phone className="w-4 h-4" />
                          </button>
                          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-all" title="Remove from Fleet">
                             <UserMinus className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
