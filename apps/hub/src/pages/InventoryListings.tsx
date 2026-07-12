import { useState } from 'react';
import { 
  Package, Search, Filter, Box, ShieldCheck, 
  Gavel, ArrowUpRight, AlertCircle, Plus, CheckCircle2,
  Calendar, Layers, Eye, Activity
} from 'lucide-react';

const MOCK_INVENTORY = [
  {
    id: 'BATCH-4021',
    material: 'PET Clear Flakes',
    grade: 'A-Grade',
    quantity: 5000,
    location: 'Nairobi Hub - Zone A',
    status: 'available',
    dateAdded: 'Today, 08:00 AM',
    qualityScore: 98,
    estimatedValue: 360000
  },
  {
    id: 'BATCH-4020',
    material: 'HDPE Natural Bales',
    grade: 'Premium',
    quantity: 12000,
    location: 'Mombasa Hub - Zone B',
    status: 'in_auction',
    dateAdded: 'Yesterday',
    qualityScore: 95,
    estimatedValue: 1020000
  },
  {
    id: 'BATCH-4019',
    material: 'OCC Cardboard Bales',
    grade: 'Standard',
    quantity: 25000,
    location: 'Nairobi Hub - Zone C',
    status: 'available',
    dateAdded: 'Oct 18, 2024',
    qualityScore: 92,
    estimatedValue: 562500
  },
  {
    id: 'BATCH-4018',
    material: 'Aluminium Cans (Crushed)',
    grade: 'Premium',
    quantity: 3500,
    location: 'Nakuru Hub - Zone A',
    status: 'sold',
    dateAdded: 'Oct 15, 2024',
    qualityScore: 99,
    estimatedValue: 507500
  },
  {
    id: 'BATCH-4017',
    material: 'Mixed Plastics Bales',
    grade: 'B-Grade',
    quantity: 8000,
    location: 'Nairobi Hub - Zone D',
    status: 'available',
    dateAdded: 'Oct 12, 2024',
    qualityScore: 85,
    estimatedValue: 360000
  }
];

export default function InventoryListings() {
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'in_auction' | 'sold'>('available');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInventory = MOCK_INVENTORY.filter(item => {
    const matchesSearch = item.material.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || item.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'in_auction': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'sold': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Ready to Sell';
      case 'in_auction': return 'In Auction';
      case 'sold': return 'Sold & Pending Dispatch';
      default: return status;
    }
  };

  const totalAvailable = MOCK_INVENTORY.filter(i => i.status === 'available').reduce((sum, i) => sum + i.quantity, 0);
  const totalValueAvailable = MOCK_INVENTORY.filter(i => i.status === 'available').reduce((sum, i) => sum + i.estimatedValue, 0);
  const inAuctionCount = MOCK_INVENTORY.filter(i => i.status === 'in_auction').length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Inventory Listings</h1>
              <span className="font-bold px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-[10px] uppercase tracking-widest">Sales Catalog</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">View processed batches ready for direct sale or auction.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> Request Processing
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Value of Available Inventory</p>
              <div className={`w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0`}>
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <h3 className="text-xl font-black text-emerald-700 dark:text-emerald-300 leading-none">KES {(totalValueAvailable / 1000000).toFixed(2)}M</h3>
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-2">Ready to be monetized</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Volume Available</p>
              <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                <Layers className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{(totalAvailable / 1000).toFixed(1)} Tonnes</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2">Across all hubs</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Currently in Auction</p>
              <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                <Gavel className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{inAuctionCount} Batches</h3>
            <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Receiving live bids</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Quality Index</p>
              <div className={`w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0`}>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">94.5%</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +1.2% average</p>
          </div>
        </div>

        {/* Controls & Tabs */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
              {[
                { id: 'available', label: 'Available' },
                { id: 'in_auction', label: 'In Auction' },
                { id: 'sold', label: 'Sold' },
                { id: 'all', label: 'All History' },
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
                  placeholder="Search batch ID or material..." 
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

          {/* Inventory Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-900/50 min-h-[400px]">
            {filteredInventory.length > 0 ? (
              filteredInventory.map(item => (
                <div key={item.id} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                  {/* Card Header */}
                  <div className="p-5 border-b border-[#e0e3eb] dark:border-slate-700/50 relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-widest ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </div>
                      <span className="text-xs font-bold text-slate-400">{item.id}</span>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-[#e0e3eb] dark:border-slate-700">
                        <Box className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#131722] dark:text-white mb-1 leading-tight">{item.material}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{item.grade} Grade</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-y-4 mb-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Quantity</p>
                        <p className="text-sm font-black text-[#131722] dark:text-white">{item.quantity.toLocaleString()} kg</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Est. Value</p>
                        <p className="text-sm font-black text-[#131722] dark:text-white">KES {(item.estimatedValue / 1000).toFixed(1)}k</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Location</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.location}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Quality Score</p>
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-[#131722] dark:text-white">{item.qualityScore}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex gap-2 mt-auto">
                      {item.status === 'available' ? (
                        <>
                          <button className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                            <Gavel className="w-3.5 h-3.5" /> Send to Auction
                          </button>
                          <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      ) : item.status === 'in_auction' ? (
                        <button className="w-full px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-500/20 cursor-default">
                          <Activity className="w-3.5 h-3.5 animate-pulse" /> Live in Market
                        </button>
                      ) : (
                        <button className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-[#e0e3eb] dark:border-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> View Order details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="font-bold text-sm text-[#131722] dark:text-white">No inventory matches your search</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
