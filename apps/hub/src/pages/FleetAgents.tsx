import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, ChevronDown, User, Truck, Star, MapPin, 
  Calendar, Phone, Mail, ShieldAlert, CheckCircle2, AlertTriangle,
  X, MessageSquare, Activity, FileText,Users, Settings, ShieldCheck,
  TrendingUp, CreditCard, ChevronRight, Ban
} from 'lucide-react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { AgentProfile } from '@klinflow/core/stores/agentStore.types';

export default function FleetAgents() {
  const { fleetDrivers, fetchFleetDrivers } = useAgentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);

  useEffect(() => {
    fetchFleetDrivers();
  }, [fetchFleetDrivers]);

  // Mock extended data per agent
  const getExtendedData = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      klinId: `KFL-${id.substring(0, 4).toUpperCase()}`,
      status: hash % 10 === 0 ? 'Suspended' : hash % 7 === 0 ? 'On Leave' : 'Active',
      vehicleType: hash % 2 === 0 ? '3-Ton Truck' : '1.5-Ton Pick-up',
      plate: `KCG ${100 + (hash % 899)}${String.fromCharCode(65 + (hash % 26))}`,
      totalKg: (2000 + (hash * 15)).toLocaleString(),
      rating: ((hash % 15) / 10 + 3.5).toFixed(1), // 3.5 to 5.0
      completion: 85 + (hash % 15),
      dateJoined: new Date(2023, hash % 12, (hash % 28) + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      trips: 120 + (hash % 50),
      payouts: `KES ${(150000 + (hash * 2500)).toLocaleString()}`
    };
  };

  const filteredAgents = fleetDrivers.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getExtendedData(a.id).klinId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Fleet Agents Directory</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Comprehensive CRM for all active, suspended, and onboarded fleet drivers.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20">
              + Invite Agent
            </button>
          </div>
        </div>

        {/* Toolbar (Search & Filter) */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-2 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-96 pl-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by agent name or KLIN-ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-transparent text-sm outline-none text-[#131722] dark:text-white placeholder:text-slate-400 font-medium"
            />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar px-2">
            {[
              { label: 'Status', value: 'All' },
              { label: 'Vehicle', value: 'All Types' },
              { label: 'Rating', value: 'Any' },
            ].map(filter => (
              <button key={filter.label} className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:border-emerald-500/50 transition-colors whitespace-nowrap">
                {filter.label}: <span className="text-[#131722] dark:text-white">{filter.value}</span>
                <ChevronDown className="w-3 h-3 text-slate-400"/>
              </button>
            ))}
            <button className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:text-[#131722] dark:hover:text-white transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 w-64">Agent</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">KLIN-ID</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Vehicle</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Total KG</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Performance</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Joined</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredAgents.map(agent => {
                  const ext = getExtendedData(agent.id);
                  const isSuspended = ext.status === 'Suspended';
                  return (
                    <tr 
                      key={agent.id} 
                      onClick={() => setSelectedAgent(agent)}
                      className="hover:bg-emerald-50/30 dark:hover:bg-emerald-500/5 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${isSuspended ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20'}`}>
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#131722] dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{agent.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-0.5">{agent.phone || '+254 7XX XXX XXX'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">{ext.klinId}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest ${
                          ext.status === 'Active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          ext.status === 'Suspended' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                          'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {ext.status === 'Active' && <CheckCircle2 className="w-3 h-3"/>}
                          {ext.status === 'Suspended' && <Ban className="w-3 h-3"/>}
                          {ext.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#131722] dark:text-white flex items-center gap-1.5"><Truck className="w-3 h-3 text-slate-400"/> {ext.vehicleType}</span>
                          <span className="text-[10px] font-bold text-slate-500 mt-0.5">{ext.plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-sm text-[#131722] dark:text-white">{ext.totalKg}</span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Kgs</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-[#131722] dark:text-white">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> {ext.rating}
                          </div>
                          <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${ext.completion}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-xs text-slate-500">{ext.dateJoined}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredAgents.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-slate-300 mb-4" />
                <p className="font-bold text-base text-[#131722] dark:text-white">No agents found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Slide-over Deep Dive Panel */}
      <AnimatePresence>
        {selectedAgent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAgent(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] z-40"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 shadow-2xl z-50 flex flex-col"
            >
              {(() => {
                const ext = getExtendedData(selectedAgent.id);
                return (
                  <>
                    {/* Panel Header */}
                    <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900/50">
                      <div className="flex items-start justify-between w-full mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-emerald-100 border border-emerald-200 dark:border-emerald-500/30 dark:bg-emerald-500/20 shrink-0 flex items-center justify-center text-emerald-600 text-2xl font-black shadow-inner">
                            {selectedAgent.name.charAt(0)}
                          </div>
                          <div>
                            <h2 className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.name}</h2>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500"><Star className="w-3 h-3 fill-amber-500"/> {ext.rating}</span>
                              <span className="font-bold text-[10px] text-slate-500 dark:text-slate-400">• {ext.status}</span>
                            </div>
                            <p className="font-bold text-[10px] text-slate-400 mt-1 uppercase tracking-widest">KLIN-ID: {ext.klinId}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedAgent(null)} className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors rounded-full">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/20">
                          <MessageSquare className="w-3.5 h-3.5"/> Message
                        </button>
                        <button className="flex-1 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                          <Settings className="w-3.5 h-3.5"/> Manage
                        </button>
                        <button className={`flex-1 py-2 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-sm ${ext.status === 'Suspended' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                          {ext.status === 'Suspended' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Ban className="w-3.5 h-3.5"/>}
                          {ext.status === 'Suspended' ? 'Activate' : 'Suspend'}
                        </button>
                      </div>
                    </div>

                    {/* Panel Content (All Info Visible) */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/20 custom-scrollbar space-y-8">
                      
                      {/* Profile & Contact Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                          <User className="w-4 h-4"/> Contact & Identity
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Phone className="w-4 h-4 text-slate-500"/></div>
                            <div><p className="text-[10px] font-bold text-slate-500">Phone Number</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.phone || '+254 712 345 678'}</p></div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><Mail className="w-4 h-4 text-slate-500"/></div>
                            <div><p className="text-[10px] font-bold text-slate-500">Email Address</p><p className="text-sm font-bold text-[#131722] dark:text-white">{selectedAgent.name.split(' ')[0].toLowerCase()}@klinfleet.com</p></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                            <div><p className="text-[10px] font-bold text-slate-500">National ID</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verified</p></div>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3">
                            <ShieldCheck className="w-5 h-5 text-emerald-500"/>
                            <div><p className="text-[10px] font-bold text-slate-500">Driving License</p><p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Verified</p></div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                          <TrendingUp className="w-4 h-4"/> Performance Analytics
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 p-4 rounded-xl">
                            <TrendingUp className="w-4 h-4 text-emerald-500 mb-2"/>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total KG</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-white mt-1">{ext.totalKg}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 p-4 rounded-xl">
                            <Activity className="w-4 h-4 text-blue-500 mb-2"/>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trips Completed</p>
                            <p className="text-xl font-black text-slate-700 dark:text-white mt-1">{ext.trips}</p>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Earnings Lifetime</h4>
                            <CreditCard className="w-4 h-4 text-emerald-500"/>
                          </div>
                          <p className="text-xl font-black text-slate-700 dark:text-white">{ext.payouts}</p>
                          <p className="text-xs font-bold text-emerald-500 mt-2">↑ Top 15% of fleet</p>
                        </div>
                      </div>

                      {/* Vehicle Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pb-2 border-b border-[#e0e3eb] dark:border-slate-700">
                          <Truck className="w-4 h-4"/> Assigned Vehicle
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800 rounded-xl h-24 flex items-center justify-center border border-[#e0e3eb] dark:border-slate-700/50">
                          <Truck className="w-10 h-10 text-slate-300 dark:text-slate-600"/>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 space-y-4">
                          <div className="flex justify-between items-center border-b border-[#e0e3eb] dark:border-slate-700/50 pb-3">
                            <p className="text-xs font-bold text-slate-500">Vehicle Type</p>
                            <p className="text-sm font-bold text-[#131722] dark:text-white">{ext.vehicleType}</p>
                          </div>
                          <div className="flex justify-between items-center border-b border-[#e0e3eb] dark:border-slate-700/50 pb-3">
                            <p className="text-xs font-bold text-slate-500">License Plate</p>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">{ext.plate}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs font-bold text-slate-500">Insurance Expiry</p>
                            <p className="text-sm font-bold text-[#131722] dark:text-white">Oct 12, 2026</p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
