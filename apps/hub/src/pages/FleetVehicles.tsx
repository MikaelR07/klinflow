import { useState } from 'react';
import { 
  Truck, Settings, Wrench, Search, Filter, AlertCircle,
  MoreVertical, FileText, CheckCircle2,Clock, Navigation, MapPin,
  Calendar, Zap, ShieldCheck
} from 'lucide-react';

const MOCK_VEHICLES = [
  {
    id: 'KCA 123G',
    type: 'TukTuk',
    make: 'Piaggio Ape',
    agent: 'John Doe',
    status: 'active',
    health: 'Good',
    lastService: '12 Sep 2024',
    nextService: '12 Oct 2024',
    location: 'Westlands, Nairobi',
    fuelLevel: 85
  },
  {
    id: 'KCB 456T',
    type: 'Pick-up',
    make: 'Toyota Hilux',
    agent: 'Peter Kamau',
    status: 'in_shop',
    health: 'Needs Attention',
    lastService: '05 Aug 2024',
    nextService: '05 Sep 2024 (Overdue)',
    location: 'Hub Garage',
    fuelLevel: 30
  },
  {
    id: 'KCD 789P',
    type: 'Lorry',
    make: 'Isuzu FRR',
    agent: 'Sarah Wanjiru',
    status: 'active',
    health: 'Fair',
    lastService: '20 Aug 2024',
    nextService: '20 Nov 2024',
    location: 'Industrial Area',
    fuelLevel: 60
  },
  {
    id: 'KCE 321X',
    type: 'Bike',
    make: 'TVS HLX',
    agent: 'Michael Ochieng',
    status: 'idle',
    health: 'Good',
    lastService: '01 Sep 2024',
    nextService: '01 Nov 2024',
    location: 'Hub Depot',
    fuelLevel: 95
  },
  {
    id: 'KCF 654Y',
    type: 'TukTuk',
    make: 'TVS King',
    agent: 'Jane Smith',
    status: 'active',
    health: 'Good',
    lastService: '15 Sep 2024',
    nextService: '15 Oct 2024',
    location: 'South B, Nairobi',
    fuelLevel: 45
  },
  {
    id: 'KCG 987Z',
    type: 'Lorry',
    make: 'Mitsubishi Fuso',
    agent: 'Unassigned',
    status: 'in_shop',
    health: 'Critical',
    lastService: '10 Jul 2024',
    nextService: '10 Aug 2024 (Overdue)',
    location: 'Hub Garage',
    fuelLevel: 15
  }
];

export default function FleetVehicles() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'idle' | 'in_shop'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const filteredVehicles = MOCK_VEHICLES.filter(v => {
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || v.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'idle': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
      case 'in_shop': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Navigation;
      case 'idle': return Clock;
      case 'in_shop': return Wrench;
      default: return Truck;
    }
  };

  const getHealthColor = (health: string) => {
    if (health === 'Good') return 'text-emerald-500';
    if (health === 'Fair') return 'text-amber-500';
    return 'text-rose-500';
  };

  const activeCount = MOCK_VEHICLES.filter(v => v.status === 'active').length;
  const inShopCount = MOCK_VEHICLES.filter(v => v.status === 'in_shop').length;
  const criticalCount = MOCK_VEHICLES.filter(v => v.health === 'Critical' || v.health === 'Needs Attention').length;
  
  const selectedData = MOCK_VEHICLES.find(v => v.id === selectedVehicle);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Vehicles Directory</h1>
              <span className="font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] uppercase tracking-widest">Asset Management</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Track fleet vehicles, assignments, and maintenance health.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" /> Manage Policies
            </button>
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Truck className="w-4 h-4" /> Add Vehicle
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Fleet</p>
                  <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                    <Truck className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{MOCK_VEHICLES.length}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Registered vehicles</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Now</p>
                  <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                    <Navigation className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{activeCount}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">On the road</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">In Maintenance</p>
                  <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                    <Wrench className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{inShopCount}</h3>
                <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Currently in shop</p>
              </div>

              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Critical Alerts</p>
                  <div className={`w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0`}>
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-rose-700 dark:text-rose-300 leading-none">{criticalCount}</h3>
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">Needs immediate attention</p>
              </div>
            </div>

            {/* Controls & Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Vehicles' },
                    { id: 'active', label: 'Active' },
                    { id: 'idle', label: 'Idle' },
                    { id: 'in_shop', label: 'In Shop' },
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
                      placeholder="Search plate, agent or type..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
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
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Plate & Type</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Assigned Agent</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Health & Service</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map(vehicle => {
                        const StatusIcon = getStatusIcon(vehicle.status);
                        return (
                          <tr 
                            key={vehicle.id} 
                            onClick={() => setSelectedVehicle(vehicle.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-[#e0e3eb] dark:border-slate-700/50">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{vehicle.id}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="uppercase tracking-widest">{vehicle.make} ({vehicle.type})</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm text-[#131722] dark:text-white leading-none">{vehicle.agent}</p>
                              {vehicle.agent !== 'Unassigned' && (
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Driver License Valid</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(vehicle.status)}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {vehicle.status.replace('_', ' ')}
                              </div>
                              <div className="flex items-center gap-1 mt-2 w-24">
                                <Zap className="w-3 h-3 text-slate-400" />
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${vehicle.fuelLevel < 20 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${vehicle.fuelLevel}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className={`font-bold text-xs flex items-center gap-1 ${getHealthColor(vehicle.health)}`}>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {vehicle.health}
                              </p>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">Next: {vehicle.nextService}</p>
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
                          <Truck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No vehicles found</p>
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
                     <h3 className="font-bold text-sm text-[#131722] dark:text-white">Vehicle Details</h3>
                     <button onClick={() => setSelectedVehicle(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:bg-slate-800 text-slate-400">
                        <MoreVertical className="w-4 h-4"/>
                     </button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">License Plate</p>
                      <div className="flex items-center gap-1 text-[12px] font-black text-[#131722] dark:text-white">
                         {selectedData.id}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Make / Model</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                         {selectedData.make}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Assignment</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedData.agent}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Location</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedData.location}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Maintenance Schedule</p>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-[#131722] dark:text-white">Last: {selectedData.lastService}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className={`text-xs font-bold ${selectedData.health === 'Critical' || selectedData.health === 'Needs Attention' ? 'text-rose-500' : 'text-[#131722] dark:text-white'}`}>Next: {selectedData.nextService}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <button className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                    Reassign Driver
                  </button>
                  {selectedData.status !== 'in_shop' && (
                    <button className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-slate-500/10">
                      Log Maintenance
                    </button>
                  )}
                  {selectedData.status === 'in_shop' && (
                    <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-emerald-500/20">
                      Mark as Fixed
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Truck className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-xs">Select a vehicle to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
