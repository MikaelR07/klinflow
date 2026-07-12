import { useState } from 'react';
import { 
  Truck, CheckCircle2, Clock, Search, Filter, 
  MapPin, PackageCheck, MoreVertical, FileText,
  Calendar, Building2, User, ArrowUpRight, ShieldCheck,
  Package, XCircle
} from 'lucide-react';

const MOCK_DELIVERIES = [
  {
    id: 'DEL-2024-112',
    salesRef: 'PO-2024-089',
    driver: 'Kamau (KCD 789P)',
    buyer: 'East Africa Packaging Ltd',
    destination: 'Mombasa Road, Nairobi',
    materials: ['PET Clear Flakes'],
    volume: 12000,
    status: 'in_transit',
    timeScheduled: 'Today, 08:00 AM',
    eta: '11:30 AM'
  },
  {
    id: 'DEL-2024-111',
    salesRef: 'AUC-2024-042',
    driver: 'Ochieng (KCE 321X)',
    buyer: 'Nairobi Bottlers',
    destination: 'Industrial Area',
    materials: ['HDPE Natural Bales'],
    volume: 5000,
    status: 'loading',
    timeScheduled: 'Today, 10:00 AM',
    eta: 'Pending Departure'
  },
  {
    id: 'DEL-2024-110',
    salesRef: 'PO-2024-088',
    driver: 'Wanjiru (KCF 654Y)',
    buyer: 'Mombasa Steel Corp',
    destination: 'Syokimau',
    materials: ['Aluminium Scrap'],
    volume: 25000,
    status: 'delivered',
    timeScheduled: 'Yesterday, 07:00 AM',
    eta: 'Delivered'
  },
  {
    id: 'DEL-2024-109',
    salesRef: 'PO-2024-087',
    driver: 'Unassigned',
    buyer: 'Kamau & Sons Plastics',
    destination: 'Thika',
    materials: ['Mixed Plastics'],
    volume: 8000,
    status: 'scheduled',
    timeScheduled: 'Tomorrow, 09:00 AM',
    eta: 'Scheduled'
  }
];

export default function SalesDelivery() {
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'loading' | 'in_transit' | 'delivered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<string | null>(null);

  const filteredDeliveries = MOCK_DELIVERIES.filter(d => {
    const matchesSearch = d.buyer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.salesRef.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || d.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
      case 'loading': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'in_transit': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return Calendar;
      case 'loading': return PackageCheck;
      case 'in_transit': return Truck;
      case 'delivered': return CheckCircle2;
      default: return Clock;
    }
  };

  const scheduledCount = MOCK_DELIVERIES.filter(d => d.status === 'scheduled').length;
  const inTransitCount = MOCK_DELIVERIES.filter(d => d.status === 'in_transit').length;
  const deliveredCount = MOCK_DELIVERIES.filter(d => d.status === 'delivered').length;
  const totalVolume = MOCK_DELIVERIES.filter(d => ['loading', 'in_transit', 'delivered'].includes(d.status)).reduce((sum, d) => sum + d.volume, 0);
  
  const selectedData = MOCK_DELIVERIES.find(d => d.id === selectedDelivery);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Sales Delivery</h1>
              <span className="font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] uppercase tracking-widest">Outbound Logistics</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage and track heavy vehicle deliveries to corporate buyers.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <MapPin className="w-4 h-4" /> Live Tracking
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Scheduled</p>
                  <div className={`w-8 h-8 rounded-lg bg-slate-500/10 flex items-center justify-center shrink-0`}>
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{scheduledCount}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Pending dispatch</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">In Transit</p>
                  <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                    <Truck className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{inTransitCount}</h3>
                <p className="text-[10px] font-bold text-blue-600 mt-2 flex items-center gap-1">On the road</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Delivered Today</p>
                  <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{deliveredCount}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +2 from yesterday</p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Total Volume</p>
                  <div className={`w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0`}>
                    <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-300 leading-none">{(totalVolume / 1000).toFixed(1)}t</h3>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">Tonnes shipped</p>
              </div>
            </div>

            {/* Controls & Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Deliveries' },
                    { id: 'scheduled', label: 'Scheduled' },
                    { id: 'loading', label: 'Loading' },
                    { id: 'in_transit', label: 'In Transit' },
                    { id: 'delivered', label: 'Delivered' },
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
                      placeholder="Search delivery or buyer..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
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
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Delivery ID & Driver</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Buyer & Destination</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Materials</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {filteredDeliveries.length > 0 ? (
                      filteredDeliveries.map(delivery => {
                        const StatusIcon = getStatusIcon(delivery.status);
                        return (
                          <tr 
                            key={delivery.id} 
                            onClick={() => setSelectedDelivery(delivery.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                  <Truck className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{delivery.id}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    <span className="uppercase tracking-widest">{delivery.driver}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <p className="font-bold text-sm text-[#131722] dark:text-white leading-none">{delivery.buyer}</p>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5">{delivery.destination}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1 mb-1 flex-wrap max-w-[200px]">
                                {delivery.materials.map((m, i) => (
                                  <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                    {m}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{(delivery.volume / 1000).toFixed(1)}t</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(delivery.status)}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {delivery.status.replace('_', ' ')}
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1.5">{delivery.timeScheduled}</p>
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
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No deliveries found</p>
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
                    <h3 className="font-bold text-sm text-[#131722] dark:text-white">Delivery Details</h3>
                    <button onClick={() => setSelectedDelivery(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:bg-slate-800 text-slate-400"><XCircle className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sales Reference</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <FileText className="w-3 h-3" /> {selectedData.salesRef}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance Status</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3 h-3" /> Verified
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Assigned Driver</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {selectedData.driver}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Buyer Info</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedData.buyer}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {selectedData.destination}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Payload</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedData.materials.map((m, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Total Volume: {selectedData.volume} kg</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Timeline</p>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">Scheduled: {selectedData.timeScheduled}</p>
                      <p className="text-xs text-slate-500">ETA: {selectedData.eta}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  {selectedData.status === 'scheduled' && (
                    <button className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors">
                      Assign Vehicle
                    </button>
                  )}
                  {selectedData.status === 'in_transit' && (
                    <button className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-slate-500/10">
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Truck className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-xs">Select a delivery to view details</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
