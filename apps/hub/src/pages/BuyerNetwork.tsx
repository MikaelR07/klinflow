import { useState } from 'react';
import { 
  Building2, Plus, Search, Filter, ShieldCheck, 
  TrendingUp, FileText, Package, ChevronRight, Activity, DollarSign
} from 'lucide-react';

const MOCK_BUYERS = [
  {
    id: 'BYR-001',
    name: 'EcoGlass Manufacturers',
    industry: 'Glass Production',
    logo: 'E',
    status: 'active',
    materials: ['Clear Glass', 'Mixed Glass'],
    ytdSpend: 12500000,
    creditScore: 98,
    activeContracts: 2,
    lastPurchase: '2 days ago',
  },
  {
    id: 'BYR-002',
    name: 'Kenya Paper Mills',
    industry: 'Paper Processing',
    logo: 'K',
    status: 'active',
    materials: ['OCC Paper', 'White Paper'],
    ytdSpend: 8400000,
    creditScore: 92,
    activeContracts: 1,
    lastPurchase: '5 days ago',
  },
  {
    id: 'BYR-003',
    name: 'Apex Plastics Ltd',
    industry: 'Plastic Extrusion',
    logo: 'A',
    status: 'paused',
    materials: ['PET Flakes', 'HDPE'],
    ytdSpend: 3200000,
    creditScore: 75,
    activeContracts: 0,
    lastPurchase: '1 month ago',
  },
  {
    id: 'BYR-004',
    name: 'Global Metals Exporters',
    industry: 'Metal Export',
    logo: 'G',
    status: 'active',
    materials: ['Aluminium', 'Copper'],
    ytdSpend: 45000000,
    creditScore: 99,
    activeContracts: 4,
    lastPurchase: '1 day ago',
  },
  {
    id: 'BYR-005',
    name: 'Sustainable Textiles',
    industry: 'Fabric Recycling',
    logo: 'S',
    status: 'onboarding',
    materials: ['Textile Waste', 'PET Bottles'],
    ytdSpend: 0,
    creditScore: null,
    activeContracts: 0,
    lastPurchase: 'N/A',
  }
];

const MOCK_INSIGHTS = [
  { material: 'PET Flakes', demand: '+14%', buyers: 12 },
  { material: 'Aluminium', demand: '+8%', buyers: 5 },
  { material: 'OCC Paper', demand: '-2%', buyers: 8 },
];

export default function BuyerNetwork() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'onboarding'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBuyers = MOCK_BUYERS.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || b.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalSpend = MOCK_BUYERS.reduce((sum, b) => sum + b.ytdSpend, 0);
  const activeContracts = MOCK_BUYERS.reduce((sum, b) => sum + b.activeContracts, 0);
  const avgScore = Math.round(MOCK_BUYERS.filter(b => b.creditScore).reduce((sum, b) => sum + b.creditScore!, 0) / MOCK_BUYERS.filter(b => b.creditScore).length);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Buyer Network</h1>
              <span className="font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] uppercase tracking-widest">B2B CRM</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage corporate buyers, manufacturers, and export partners.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" /> Add Corporate Buyer
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          
          {/* Main Content (Left 3 Columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Verified Buyers', value: MOCK_BUYERS.filter(b => b.status === 'active').length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Active Contracts', value: activeContracts, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'YTD Sales Volume', value: `KSh ${(totalSpend / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { label: 'Avg Credit Score', value: avgScore, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden ">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Buyers' },
                    { id: 'active', label: 'Active' },
                    { id: 'paused', label: 'Paused' },
                    { id: 'onboarding', label: 'Onboarding' },
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
                      placeholder="Search company or industry..." 
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

              {/* Directory Table */}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Company Details</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material Interests</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">YTD Spend</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Trust Score</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {filteredBuyers.length > 0 ? (
                      filteredBuyers.map(buyer => (
                        <tr key={buyer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm border border-blue-200 dark:border-blue-800 shrink-0">
                                {buyer.logo}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{buyer.name}</p>
                                <div className="flex items-center gap-2">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">{buyer.industry}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                                    buyer.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                                    buyer.status === 'paused' ? 'bg-amber-500/10 text-amber-600' :
                                    'bg-slate-500/10 text-slate-600'
                                  }`}>
                                    {buyer.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {buyer.materials.map((mat, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
                                  {mat}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-black text-sm text-[#131722] dark:text-white">KES {(buyer.ytdSpend / 1000000).toFixed(1)}M</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{buyer.activeContracts} Active Contracts</p>
                          </td>
                          <td className="px-6 py-4">
                            {buyer.creditScore ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${buyer.creditScore > 90 ? 'bg-emerald-500' : buyer.creditScore > 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${buyer.creditScore}%` }}></div>
                                </div>
                                <span className="font-bold text-xs text-[#131722] dark:text-white">{buyer.creditScore}/100</span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluating</span>
                            )}
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
                          <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No buyers found</p>
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
            
            {/* Demand Insights */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Demand
              </h3>
              <div className="space-y-4">
                {MOCK_INSIGHTS.map((insight, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-4 border-b border-[#e0e3eb] dark:border-slate-700/50 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-[#131722] dark:text-white">{insight.material}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{insight.buyers} Active Buyers</p>
                    </div>
                    <div className={`text-xs font-black ${insight.demand.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {insight.demand}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5 relative overflow-hidden">
              <Activity className="absolute -right-4 -bottom-4 w-24 h-24 text-slate-200 dark:text-slate-800/50" />
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg Response Time</p>
                <p className="text-2xl font-black text-[#131722] dark:text-white">2.4 <span className="text-sm text-slate-400 font-bold">Hours</span></p>
                <p className="text-[10px] text-emerald-500 font-bold mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Improved by 12%
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
