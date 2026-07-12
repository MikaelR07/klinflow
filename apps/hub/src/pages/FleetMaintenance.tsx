import { useState, useMemo } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import {
  Wrench, CalendarClock, History, Plus, Search, Filter, 
  AlertTriangle, CheckCircle2, Clock, Car, User, FileText
} from 'lucide-react';
import { OptimizedImage } from '@klinflow/ui';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';

// --- Deterministic Mock Generators ---
const getStableHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const generateMockVehicle = (id: string) => {
  const hash = getStableHash(id);
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const plate = `K${letters[hash % 26]}${letters[(hash >> 1) % 26]} ${(hash % 999).toString().padStart(3, '0')}${letters[(hash >> 2) % 26]}`;
  const types = ['Truck', 'Motorbike', 'Tricycle', 'Van'];
  return `${plate} - ${types[hash % types.length]}`;
};

export default function FleetMaintenance() {
  const [activeTab, setActiveTab] = useState<'Active' | 'Scheduled' | 'History'>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);

  // Generate Mock Maintenance Records based on drivers
  const maintenanceRecords = useMemo(() => {
    return fleetDrivers.flatMap((driver, index) => {
      const hash = getStableHash(driver.id || String(index));
      const vehicle = generateMockVehicle(driver.id || String(index));
      
      const records = [];
      
      // Active Maintenance (approx 10% of fleet)
      if (hash % 10 === 0) {
        records.push({
          id: `maint-${hash}-act`,
          driver,
          vehicle,
          type: 'Active',
          issue: ['Engine Overhaul', 'Transmission Repair', 'Brake Pad Replacement'][hash % 3],
          status: 'In Shop',
          date: new Date(Date.now() + 86400000 * ((hash % 5) + 1)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), // Est Completion
          cost: (hash % 50000) + 15000,
        });
      }

      // Scheduled Maintenance (approx 20% of fleet)
      if (hash % 5 === 0) {
        records.push({
          id: `maint-${hash}-sch`,
          driver,
          vehicle,
          type: 'Scheduled',
          issue: ['Routine Oil Change', 'Tire Rotation', 'Annual Inspection', 'Filter Replacement'][hash % 4],
          status: 'Scheduled',
          date: new Date(Date.now() + 86400000 * ((hash % 14) + 1)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), // Scheduled Date
          cost: (hash % 10000) + 2000,
        });
      }

      // History (Everyone has some history)
      records.push({
        id: `maint-${hash}-hist1`,
        driver,
        vehicle,
        type: 'History',
        issue: ['Battery Replacement', 'Flat Tire Repair', 'Wiper Fluid Fill', 'Headlight Replacement'][hash % 4],
        status: 'Completed',
        date: new Date(Date.now() - 86400000 * ((hash % 60) + 5)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), // Completed Date
        cost: (hash % 8000) + 1000,
      });

      return records;
    });
  }, [fleetDrivers]);

  const filteredRecords = useMemo(() => {
    return maintenanceRecords.filter(record => {
      const matchesSearch = record.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            record.driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            record.issue.toLowerCase().includes(searchQuery.toLowerCase());
      return record.type === activeTab && matchesSearch;
    });
  }, [maintenanceRecords, activeTab, searchQuery]);

  // KPI Calculations
  const activeCount = maintenanceRecords.filter(r => r.type === 'Active').length;
  const scheduledCount = maintenanceRecords.filter(r => r.type === 'Scheduled').length;
  const historyRecords = maintenanceRecords.filter(r => r.type === 'History');
  const ytdCost = historyRecords.reduce((sum, r) => sum + r.cost, 0);
  const healthyPercentage = fleetDrivers.length > 0 
    ? Math.round(((fleetDrivers.length - activeCount) / fleetDrivers.length) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-transparent pb-10">
      <div className="p-4 sm:p-6 lg:p-6 mx-auto space-y-6 animate-fade-in w-full">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-[#e0e3eb] dark:border-slate-700/50">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#131722] dark:text-white">Fleet Maintenance</h1>
            <p className="text-[10px] mt-1 text-slate-500 dark:text-slate-400">Manage vehicle health, service schedules, and repair history.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 transition-all font-bold text-xs shadow-sm shadow-emerald-500/20">
              <Plus className="w-4 h-4" />
              Log Service
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: AlertTriangle, label: 'Vehicles In Shop', value: activeCount, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { icon: CalendarClock, label: 'Upcoming Services', value: scheduledCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: CheckCircle2, label: 'Healthy Fleet', value: `${healthyPercentage}%`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: FileText, label: 'YTD Repair Costs', value: `KES ${ytdCost.toLocaleString()}`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label}
                </p>
                <h3 className="text-lg font-black text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col relative">
          
          {/* Tabs & Search */}
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {[
                { id: 'Active', icon: Wrench, label: 'Active Repairs' },
                { id: 'Scheduled', icon: Clock, label: 'Service Schedule' },
                { id: 'History', icon: History, label: 'Service History' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab.id ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search vehicles, agents..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-[#131722] dark:text-white transition-all"
                />
              </div>
              <button className="bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg p-2 text-slate-500 hover:text-emerald-500 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Vehicle</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Assigned Agent</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Issue / Service</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    {activeTab === 'Active' ? 'Est. Completion' : activeTab === 'Scheduled' ? 'Scheduled For' : 'Completed On'}
                  </th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">
                    {activeTab === 'Scheduled' ? 'Est. Cost' : 'Final Cost'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredRecords.length > 0 ? (
                  filteredRecords.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-[#e0e3eb] dark:border-slate-700 shrink-0">
                            <Car className="w-4 h-4 text-slate-500" />
                          </div>
                          <span className="font-bold text-xs text-[#131722] dark:text-white">{record.vehicle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 shrink-0">
                            {record.driver.avatar_url ? (
                              <OptimizedImage src={getThumbnailUrl(record.driver.avatar_url, { width: 100 })} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-slate-400">
                                {record.driver.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-xs text-slate-600 dark:text-slate-300">{record.driver.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-xs text-[#131722] dark:text-white">{record.issue}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          record.status === 'In Shop' ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                          record.status === 'Scheduled' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' :
                          'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                        }`}>
                          {record.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-xs text-slate-600 dark:text-slate-400">{record.date}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-xs text-[#131722] dark:text-white">KES {record.cost.toLocaleString()}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Wrench className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-3" />
                        <p className="font-bold text-sm text-[#131722] dark:text-white">No maintenance records found</p>
                        <p className="text-xs text-slate-500 mt-1">There are no vehicles matching your current filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
