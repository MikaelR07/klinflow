import { useState } from 'react';
import { 
  PackageSearch, MapPin, Truck, CheckCircle2, Clock, 
  Search, Filter, XCircle, MoreVertical, Navigation,
  User, Building2, Phone, Box, ArrowUpRight, ClipboardCheck, Factory
} from 'lucide-react';

const MOCK_PICKUPS = [
  {
    id: 'PKP-2024-089',
    agent: 'John Doe',
    vehicle: 'KCA 123G (TukTuk)',
    source: 'Resident',
    clientName: 'Alice Wanjiku',
    location: 'Kileleshwa, Nairobi',
    materials: ['PET Bottles', 'Cardboard'],
    estWeight: 15,
    status: 'en_route',
    timeAccepted: '10:30 AM',
    eta: '10:45 AM'
  },
  {
    id: 'PKP-2024-088',
    agent: 'Peter Kamau',
    vehicle: 'KCB 456T (Pick-up)',
    source: 'Seller',
    clientName: 'Naivas Supermarket',
    location: 'Westlands, Nairobi',
    materials: ['OCC Cardboard', 'Clear Plastics'],
    estWeight: 120,
    status: 'arrived',
    timeAccepted: '09:15 AM',
    eta: 'Arrived'
  },
  {
    id: 'PKP-2024-087',
    agent: 'Sarah Wanjiru',
    vehicle: 'KCD 789P (Lorry)',
    source: 'Seller',
    clientName: 'Industrial Area Godown',
    location: 'Industrial Area',
    materials: ['Mixed Scrap Metal', 'Aluminium'],
    estWeight: 450,
    status: 'collected',
    timeAccepted: '08:00 AM',
    eta: 'En-route to Hub'
  },
  {
    id: 'PKP-2024-086',
    agent: 'Michael Ochieng',
    vehicle: 'KCE 321X (Bike)',
    source: 'Resident',
    clientName: 'David Odhiambo',
    location: 'Kilimani, Nairobi',
    materials: ['Glass Bottles'],
    estWeight: 5,
    status: 'cancelled',
    timeAccepted: '07:30 AM',
    eta: 'Cancelled'
  },
  {
    id: 'PKP-2024-085',
    agent: 'Jane Smith',
    vehicle: 'KCF 654Y (TukTuk)',
    source: 'Resident',
    clientName: 'Mary Atieno',
    location: 'South B, Nairobi',
    materials: ['HDPE Plastics'],
    estWeight: 25,
    status: 'assigned',
    timeAccepted: '10:40 AM',
    eta: 'Pending Departure'
  },
  {
    id: 'PKP-2024-084',
    agent: 'John Doe',
    vehicle: 'KCA 123G (TukTuk)',
    source: 'Resident',
    clientName: 'Wanjiku Mwangi',
    location: 'Lavington, Nairobi',
    materials: ['Glass Bottles'],
    estWeight: 10,
    status: 'delivered_to_hub',
    timeAccepted: '06:00 AM',
    eta: 'Delivered'
  }
];

export default function AgentPickups() {
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'en_route' | 'arrived' | 'collected' | 'delivered_to_hub' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null);

  const filteredPickups = MOCK_PICKUPS.filter(p => {
    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.agent.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'en_route': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'arrived': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'collected': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'delivered_to_hub': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned': return ClipboardCheck;
      case 'en_route': return Navigation;
      case 'arrived': return MapPin;
      case 'collected': return CheckCircle2;
      case 'delivered_to_hub': return Factory;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const activeCount = MOCK_PICKUPS.filter(p => ['assigned', 'en_route', 'arrived', 'collected'].includes(p.status)).length;
  const completedCount = MOCK_PICKUPS.filter(p => p.status === 'delivered_to_hub').length;
  const totalWeight = MOCK_PICKUPS.reduce((sum, p) => p.status !== 'cancelled' ? sum + p.estWeight : sum, 0);
  
  const selectedData = MOCK_PICKUPS.find(p => p.id === selectedPickup);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Agent Pickups</h1>
              <span className="font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] uppercase tracking-widest">Live Feed</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Track live collections from residents and commercial sellers.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Live Map
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Pickups</p>
                  <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                    <Navigation className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{activeCount}</h3>
                <p className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1">Agents en route or arrived</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Completed Today</p>
                  <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{completedCount}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12 from yesterday</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Estimated Weight</p>
                  <div className={`w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0`}>
                    <Box className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{totalWeight} kg</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Inbound volume</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Avg Pickup Time</p>
                  <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">24 min</h3>
                <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Acceptance to completion</p>
              </div>
            </div>

            {/* Controls & Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Pickups' },
                    { id: 'assigned', label: 'Assigned' },
                    { id: 'en_route', label: 'En-Route' },
                    { id: 'arrived', label: 'Arrived' },
                    { id: 'collected', label: 'Collected' },
                    { id: 'delivered_to_hub', label: 'Delivered' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search pickup ID, agent or client..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>
                  <button className="p-2 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Feed Table */}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Agent & ID</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Client & Location</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Materials</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {filteredPickups.length > 0 ? (
                      filteredPickups.map(pickup => {
                        const StatusIcon = getStatusIcon(pickup.status);
                        return (
                          <tr 
                            key={pickup.id} 
                            onClick={() => setSelectedPickup(pickup.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-[#e0e3eb] dark:border-slate-700/50">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{pickup.agent}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="uppercase tracking-widest">{pickup.id}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 mb-1">
                                {pickup.source === 'Resident' ? <User className="w-3.5 h-3.5 text-slate-400" /> : <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                                <p className="font-bold text-sm text-[#131722] dark:text-white leading-none">{pickup.clientName}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5">{pickup.location}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 mb-1 flex-wrap max-w-[200px]">
                                {pickup.materials.map((m, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                    {m}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Est. {pickup.estWeight} kg</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(pickup.status)}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {pickup.status.replace(/_/g, ' ')}
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1.5">{pickup.timeAccepted}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors ml-auto">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No pickups found</p>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (Details Panel) */}
          <div className="lg:col-span-1 border-l border-[#e0e3eb] dark:border-slate-700/50 pl-0 lg:pl-6 hidden lg:block">
            {selectedData ? (
              <div className="animate-fade-in flex flex-col h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#131722] dark:text-white">Pickup Details</h3>
                    <button onClick={() => setSelectedPickup(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><XCircle className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#131722] dark:text-white">{selectedData.agent}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{selectedData.vehicle}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-white dark:bg-slate-700 border border-[#e0e3eb] dark:border-slate-600 rounded-lg text-[10px] font-bold text-[#131722] dark:text-white flex items-center justify-center gap-1">
                        <Phone className="w-3 h-3" /> Call Agent
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Client Info</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedData.clientName}</p>
                      <p className="text-xs text-slate-500">{selectedData.source}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400" /> {selectedData.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Materials Expected</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedData.materials.map((m, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Accepted: {selectedData.timeAccepted}</p>
                      <p className="text-xs text-slate-500">ETA / Status: {selectedData.eta}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  {['assigned', 'en_route'].includes(selectedData.status) && (
                    <button className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-widest transition-colors">
                      Reassign Pickup
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <PackageSearch className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-xs">Select a pickup to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
