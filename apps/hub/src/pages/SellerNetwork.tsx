import { useState } from 'react';
import { 
  Users, Plus, Search, Filter, ShieldCheck, 
  TrendingUp, Star, Package, ChevronRight, Activity, Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const MOCK_SELLERS = [
  {
    id: 'SUP-001',
    name: 'Nairobi Central Aggregators',
    type: 'Aggregator Yard',
    status: 'verified',
    primaryMaterial: 'PET Plastic',
    monthlyVolume: 45000,
    qualityScore: 4.8,
    lastDelivery: 'Today, 10:30 AM',
  },
  {
    id: 'SUP-002',
    name: 'Kibera Youth Collectors',
    type: 'Community Group',
    status: 'verified',
    primaryMaterial: 'OCC Paper',
    monthlyVolume: 12000,
    qualityScore: 4.2,
    lastDelivery: 'Yesterday',
  },
  {
    id: 'SUP-003',
    name: 'Eastlands Scrap Dealers',
    type: 'Independent Business',
    status: 'pending',
    primaryMaterial: 'Aluminium',
    monthlyVolume: 5000,
    qualityScore: 3.5,
    lastDelivery: '3 days ago',
  },
  {
    id: 'SUP-004',
    name: 'Green City Waste Management',
    type: 'Corporate Supplier',
    status: 'verified',
    primaryMaterial: 'Mixed Glass',
    monthlyVolume: 85000,
    qualityScore: 4.9,
    lastDelivery: 'Today, 08:15 AM',
  },
  {
    id: 'SUP-005',
    name: 'Mombasa Road Traders',
    type: 'Aggregator Yard',
    status: 'suspended',
    primaryMaterial: 'HDPE Plastics',
    monthlyVolume: 0,
    qualityScore: 2.1,
    lastDelivery: '2 months ago',
  }
];

const PERFORMANCE_DATA = [
  { name: 'Week 1', volume: 24000 },
  { name: 'Week 2', volume: 35000 },
  { name: 'Week 3', volume: 28000 },
  { name: 'Week 4', volume: 45000 },
];

export default function SellerNetwork() {
  const [activeTab, setActiveTab] = useState<'all' | 'verified' | 'pending' | 'suspended'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSellers = MOCK_SELLERS.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || s.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalVerified = MOCK_SELLERS.filter(s => s.status === 'verified').length;
  const avgQuality = (MOCK_SELLERS.reduce((sum, s) => sum + s.qualityScore, 0) / MOCK_SELLERS.length).toFixed(1);
  const totalVolume = MOCK_SELLERS.reduce((sum, s) => sum + s.monthlyVolume, 0);
  const pendingCount = MOCK_SELLERS.filter(s => s.status === 'pending').length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Supplier Network</h1>
              <span className="font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] uppercase tracking-widest">Sourcing CRM</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage aggregators, community groups, and independent material suppliers.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> Invite Supplier
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content (Left 3 Columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Verified Suppliers', value: totalVerified, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Avg Quality Score', value: `${avgQuality} / 5.0`, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Monthly Volume', value: `${(totalVolume / 1000).toFixed(1)} Tonnes`, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Pending Verification', value: pendingCount, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{kpi.label}</p>
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{kpi.value}</h3>
                </div>
              ))}
            </div>

            {/* Controls & Tabs */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Suppliers' },
                    { id: 'verified', label: 'Verified' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'suspended', label: 'Suspended' },
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
                      placeholder="Search name or type..." 
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

              {/* Directory Table */}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Supplier Info</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Primary Material</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Quality Rating</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Monthly Vol.</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {filteredSellers.length > 0 ? (
                      filteredSellers.map(seller => (
                        <tr key={seller.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                <Users className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{seller.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{seller.type}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                                    seller.status === 'verified' ? 'bg-emerald-500/10 text-emerald-600' :
                                    seller.status === 'pending' ? 'bg-orange-500/10 text-orange-600' :
                                    'bg-rose-500/10 text-rose-600'
                                  }`}>
                                    {seller.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap">
                              {seller.primaryMaterial}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(seller.qualityScore) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                                ))}
                              </div>
                              <span className="font-bold text-xs text-[#131722] dark:text-white">{seller.qualityScore.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-black text-sm text-[#131722] dark:text-white">{seller.monthlyVolume.toLocaleString()} kg</p>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-1">Last: {seller.lastDelivery}</p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors ml-auto">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No suppliers found</p>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Sidebar (Insights) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Performance Chart */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5 flex flex-col h-64">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Network Growth
              </h3>
              <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest">Total Sourcing Volume (kg)</p>
              <div className="flex-1 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PERFORMANCE_DATA} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(value) => `${value/1000}k`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Alert */}
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
              <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-amber-200/50 dark:text-amber-500/10" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-2">Quality Alert</p>
                <p className="text-xs font-medium text-amber-800 dark:text-amber-400 leading-relaxed mb-3">
                  Average contamination rates in PET supplies have increased by 4% this week. Consider sending a broadcast alert to your verified network.
                </p>
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors">
                  Notify Suppliers
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
