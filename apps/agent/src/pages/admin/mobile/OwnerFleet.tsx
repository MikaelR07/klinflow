import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { 
  Search, MapPin, Star, Truck, ArrowLeft, SlidersHorizontal, Package, 
  CircleCheck, Activity, Users, AlertTriangle, UserX, ChevronRight,
  TrendingUp, Scale, DollarSign
} from 'lucide-react';

export default function OwnerFleet() {
  const navigate = useNavigate();
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const isLoading = useAgentStore(s => s.isLoadingFleet);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    fetchFleetDrivers();
  }, [fetchFleetDrivers]);

  const filteredDrivers = useMemo(() => {
    return fleetDrivers.filter((p: any) => {
      const matchSearch = !searchQuery || 
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.klinflow_id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchStatus = true;
      if (activeStatus === 'active') matchStatus = p.is_online;
      if (activeStatus === 'offline') matchStatus = !p.is_online;
      if (activeStatus === 'suspended') matchStatus = p.status === 'suspended';

      return matchSearch && matchStatus;
    });
  }, [fleetDrivers, searchQuery, activeStatus]);

  const onlineDrivers = fleetDrivers.filter(d => d.is_online);
  const offlineDrivers = fleetDrivers.filter(d => !d.is_online);
  const suspendedDrivers = fleetDrivers.filter((d: any) => d.status === 'suspended');
  const totalCollections = fleetDrivers.reduce((sum, d) => sum + Number(d.collected_kg || 0), 0);
  const totalEarnings = totalCollections * 40;
  const avgRating = fleetDrivers.length > 0 
    ? (fleetDrivers.reduce((sum, d) => sum + Number(d.rating || 0), 0) / fleetDrivers.length).toFixed(1) 
    : '0.0';

  // Summary cards (no "Completed Today" as requested)
  const summaryCards = [
    { label: 'Total Agents', value: fleetDrivers.length, icon: Users, color: 'text-emerald-600', borderColor: 'border-emerald-200 dark:border-slate-800', bg: 'bg-emerald-50 dark:bg-slate-800',},
    { label: 'Active Now', value: onlineDrivers.length, icon: Activity, color: 'text-blue-600', borderColor: 'border-blue-200 dark:border-blue-800', bg: 'bg-blue-50 dark:bg-blue-500/10',},
    { label: 'Disputes', value: 3, icon: AlertTriangle, color: 'text-amber-600', borderColor: 'border-amber-200 dark:border-amber-800', bg: 'bg-amber-50 dark:bg-amber-500/10' },
    { label: 'Suspended', value: suspendedDrivers.length, icon: UserX, color: 'text-rose-600', borderColor: 'border-rose-200 dark:border-rose-800', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  ];

  const statusFilters = [
    { key: 'all', label: `All (${fleetDrivers.length})`, dot: '' },
    { key: 'active', label: `Active (${onlineDrivers.length})`, dot: 'bg-emerald-500' },
    { key: 'offline', label: `Offline (${offlineDrivers.length})`, dot: 'bg-slate-400' },
    { key: 'suspended', label: `Suspended (${suspendedDrivers.length})`, dot: 'bg-rose-500' },
  ];

  return (
    <div className="animate-in fade-in duration-300">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="p-2 -ml-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Fleet Management</h1>
                <p className="text-[11px] font-medium text-slate-500 ">Monitor your agents and fleet performance in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+6rem)] pb-4 space-y-4 px-1.5">
         {/* ── FLEET OVERVIEW ── */}
        <div className="bg-gradient-to-br from-blue-800 to-blue-500 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 dark:text-white">Fleet Overview</h3>
            <span className="text-[10px] font-medium text-slate-200">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-100  uppercase tracking-widest mb-1">Collections</p>
              <p className="text-base font-bold text-slate-300 dark:text-white">{(totalCollections / 1000).toFixed(2)}KG</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-300">+18% vs yesterday</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-100 uppercase tracking-widest mb-1">Earnings</p>
              <p className="text-base font-bold text-slate-300 dark:text-white">KES {totalEarnings.toLocaleString()}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-300">+12% vs yesterday</span>
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-100 uppercase tracking-widest mb-1">Avg. Rating</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <p className="text-base font-bold text-slate-300 dark:text-white">{avgRating}/5</p>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-300">+0.3 vs last week</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SUMMARY CARDS ── */}
        <div className="flex gap-1">
          {summaryCards.map((card, i) => (
            <div 
              key={i} 
              className={`flex-1 min-w-0 rounded-xl border ${card.borderColor} ${card.bg} p-3 flex flex-col gap-1.5`}
            >
              <div className="flex items-start justify-between">
                <span className="text-base font-bold text-slate-600 dark:text-white leading-none">{card.value}</span>
                <card.icon className={`w-4 h-4 ${card.color} opacity-60 shrink-0`} />
              </div>
              <span className={`text-[8px] font-bold uppercase tracking-widest ${card.color}`}>{card.label}</span>
            </div>
          ))}
        </div>

        

        {/* ── AGENT STATUS SECTION ── */}
        <div className="space-y-3">
        

          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Search agents by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F8F8FF] dark:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar ">
            {statusFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveStatus(f.key)}
                className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all shrink-0 border ${
                  activeStatus === f.key
                    ? 'bg-primary dark:bg-white border-primary dark:border-white text-white dark:text-slate-600 shadow-sm'
                    : 'bg-[#F8F8FF] dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-800'
                }`}
              >
                {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── AGENTS LIST ── */}
        <div className="space-y-0.5">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-[#F8F8FF] dark:bg-slate-900 rounded-xl animate-pulse border border-slate-100 dark:border-slate-800" />)}
            </div>
          ) : filteredDrivers.length > 0 ? (
            filteredDrivers.map((agent: any) => (
              <div
                key={agent.id}
                className="w-full bg-[#F8F8FF] dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                onClick={() => navigate(`/fleet/${agent.id}`, { state: { agent } })}
              >
                <div className="p-3 flex gap-3">
                  
                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg relative overflow-hidden bg-slate-100 dark:bg-slate-200">
                      {agent.avatar_url ? (
                        <OptimizedImage src={getThumbnailUrl(agent.avatar_url, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                      ) : (
                        <span className="text-lg font-bold text-slate-600">{agent.name?.charAt(0) || '?'}</span>
                      )}
                      <div className={`absolute bottom-1 right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${agent.is_online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name & Verified Badge */}
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h4 className="text-[14px] font-bold text-slate-600 dark:text-white truncate">
                        {agent.name}
                      </h4>
                      <CircleCheck className="w-4 h-4 text-emerald-500 fill-emerald-500/20 shrink-0" />
                    </div>
                    
                    <p className="text-[10px] font-medium text-slate-400 mb-2">Agent ID: {agent.klinflow_id || 'AGT-XXXX'}</p>

                    {/* Meta info */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-slate-700 dark:text-white">{(agent.rating || 0).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-500">{Number(agent.completed_jobs || 0)} Pickups</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-500 truncate max-w-[70px]">{(agent.location as any)?.estate || 'Nairobi'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex flex-col items-end justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] font-bold px-2 py-1 rounded-md capitalize ${agent.is_online ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {agent.is_online ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="text-right mt-auto">
                      <p className="text-[9px] text-slate-400 font-medium">Collected </p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">{(agent.collected_kg || 0).toLocaleString()} kg</p>
                    </div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-slate-300 shrink-0 self-center" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-[#F8F8FF] dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">No agents found</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adjust your search or filters.</p>
            </div>
          )}
        </div>
      
      </div>
    </div>
  );
}
