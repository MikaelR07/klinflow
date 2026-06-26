import React, { useState } from 'react';
import { 
  Truck, 
  Clock, 
  MapPin, 
  Activity, 
  Search, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Navigation,
  Loader2,
  ListFilter
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

type VehicleStatus = 'Waiting' | 'Weighing' | 'Unloading' | 'Complete';
type BayStatus = 'Available' | 'Occupied' | 'Maintenance';

interface QueueItem {
  id: string;
  driver: string;
  registration: string;
  type: 'Fleet' | 'Individual' | 'Walk-in';
  expectedTonnage: number;
  arrivalTime: string;
  status: VehicleStatus;
  bayAssigned?: number;
  material: string;
}

interface ReceivingBay {
  id: number;
  name: string;
  materialFocus: string;
  status: BayStatus;
  currentVehicleId?: string;
  estimatedTimeLeft?: number; // minutes
}

export default function QueueManagement() {
  const { isDarkMode } = useThemeStore();

  const [activeTab, setActiveTab] = useState<'queue' | 'bays'>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [bays] = useState<ReceivingBay[]>([
    { id: 1, name: 'Bay 1', materialFocus: 'Plastics (PET/HDPE)', status: 'Occupied', currentVehicleId: 'Q-1042', estimatedTimeLeft: 12 },
    { id: 2, name: 'Bay 2', materialFocus: 'Paper & OCC', status: 'Available' },
    { id: 3, name: 'Bay 3', materialFocus: 'Metals & Glass', status: 'Occupied', currentVehicleId: 'Q-1040', estimatedTimeLeft: 5 },
    { id: 4, name: 'Bay 4', materialFocus: 'Mixed Loads', status: 'Maintenance' },
  ]);

  const [queue] = useState<QueueItem[]>([
    { id: 'Q-1045', driver: 'Samuel Kamau', registration: 'KCD 452G', type: 'Fleet', expectedTonnage: 4.2, arrivalTime: '10:15 AM', status: 'Waiting', material: 'Mixed Plastics' },
    { id: 'Q-1044', driver: 'Grace Njoroge', registration: 'Handcart', type: 'Walk-in', expectedTonnage: 0.1, arrivalTime: '10:20 AM', status: 'Waiting', material: 'PET Clear' },
    { id: 'Q-1043', driver: 'David Ochieng', registration: 'KBN 992P', type: 'Individual', expectedTonnage: 1.5, arrivalTime: '09:55 AM', status: 'Weighing', material: 'Scrap Metal' },
    { id: 'Q-1042', driver: 'John Doe', registration: 'KCQ 112L', type: 'Fleet', expectedTonnage: 5.0, arrivalTime: '09:30 AM', status: 'Unloading', bayAssigned: 1, material: 'HDPE Rigid' },
    { id: 'Q-1040', driver: 'Mary Wanjiku', registration: 'KCA 771B', type: 'Fleet', expectedTonnage: 3.2, arrivalTime: '09:10 AM', status: 'Unloading', bayAssigned: 3, material: 'Aluminium Cans' },
  ]);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'Waiting': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'Weighing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Unloading': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'Complete': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getBayStatusColor = (status: BayStatus) => {
    switch (status) {
      case 'Available': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Occupied': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Maintenance': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Queue Management</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monitor inbound traffic, assign drop-off bays, and reduce idling times.</p>
        </div>
        <div className="flex gap-3">
          <button className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 border transition-colors ${
            isDarkMode ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
          }`}>
            <ListFilter className="w-4 h-4" /> Export Log
          </button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Manual Bay Override
          </button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 xl:gap-2">
        {[
          { label: 'Vehicles in Queue', value: '5', trend: '+2 since last hour', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Avg Wait Time', value: '18m', trend: '-4m vs yesterday', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Active Bays', value: '2 / 4', trend: 'Bay 4 under maintenance', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Expected Inbound', value: '14.0t', trend: 'Across waiting vehicles', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
            </div>
            <div className="flex items-end justify-between truncate">
              <p className={`text-xl lg:text-lg xl:text-3xl font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>{stat.value}</p>
              <p className={`text-xs font-medium truncate ml-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Column: Queue List */}
        <div className={`flex-1 rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
              <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Truck className="font-medium w-5 h-5 text-blue-500" /> Active Gate Queue
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{queue.length}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search registration..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-9 pr-4 py-2 rounded-xl text-sm font-medium border outline-none transition-colors w-full md:w-64 ${
                    isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                  style={{ color: isDarkMode ? 'white' : 'black' }}
                />
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
              <button className={`p-2 rounded-xl border transition-colors ${
                isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
              }`}>
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="font-medium w-full text-left text-sm min-w-[800px]">
              <thead className={`text-[10px] uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <tr>
                  <th className="px-6 py-4">Ref ID</th>
                  <th className="px-4 py-4">Vehicle / Driver</th>
                  <th className="px-4 py-4">Load Details</th>
                  <th className="px-4 py-4">Arrival</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {queue.filter(q => q.registration.toLowerCase().includes(searchQuery.toLowerCase()) || q.driver.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                  <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.registration}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.driver}</span>
                        <span className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                          {item.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.material}</p>
                      <p className={`text-xs font-mono font-medium mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.expectedTonnage.toFixed(1)}t <span className="font-normal uppercase text-[9px]">Est</span></p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-medium font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.arrivalTime}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
                          {item.status === 'Weighing' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {item.status}
                        </span>
                        {item.bayAssigned && (
                          <span className={`text-[10px] font-medium flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <MapPin className="w-3 h-3" /> Bay {item.bayAssigned}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {item.status === 'Waiting' ? (
                        <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-1">
                          Assign Bay <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Bay Status */}
        <div className={`w-full xl:w-96 rounded-3xl border flex flex-col shrink-0 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className={`p-6 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <MapPin className="font-medium w-5 h-5 text-emerald-500" /> Facility Drop-off Bays
            </h2>
          </div>
          <div className="p-6 space-y-4 flex-1">
            {bays.map((bay) => (
              <div key={bay.id} className={`p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{bay.name}</h3>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{bay.materialFocus}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${getBayStatusColor(bay.status)}`}>
                    {bay.status}
                  </span>
                </div>
                
                {bay.status === 'Occupied' && bay.currentVehicleId ? (
                  <div className={`p-3 rounded-xl border mt-3 flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100'}`}>
                    <div>
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Current Vehicle</p>
                      <p className={`text-sm font-medium font-mono mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{bay.currentVehicleId}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Est. Clear</p>
                      <p className={`text-sm font-medium text-blue-500 mt-0.5 flex items-center justify-end gap-1`}>
                        <Clock className="w-3 h-3" /> {bay.estimatedTimeLeft}m
                      </p>
                    </div>
                  </div>
                ) : bay.status === 'Available' ? (
                  <div className={`mt-3 p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 ${isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <CheckCircle2 className="font-medium w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium uppercase tracking-wider">Ready for Assignment</span>
                  </div>
                ) : (
                  <div className={`mt-3 p-3 rounded-xl border border-dashed flex items-center justify-center gap-2 ${isDarkMode ? 'border-rose-500/20 text-rose-500' : 'border-rose-200 text-rose-600'}`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Scheduled Maintenance</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
