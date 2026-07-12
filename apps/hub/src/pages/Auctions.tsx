import { useState, useEffect } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { OptimizedImage } from '@klinflow/ui';
import { 
  Gavel, Plus, Search, Filter, Clock, TrendingUp, DollarSign, 
  Package, ChevronRight, AlertCircle, Info, CheckCircle2 
} from 'lucide-react';

// --- Deterministic Mock Generators ---
const MOCK_AUCTIONS = [
  {
    id: 'AUC-2024-081',
    material: 'PET Flakes (Clear)',
    volume: '20 Tonnes',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
    startPrice: 45,
    currentBid: 52,
    bids: 14,
    status: 'active',
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 4 + 1000 * 60 * 15).toISOString(), // 4h 15m
  },
  {
    id: 'AUC-2024-082',
    material: 'OCC Paper (Baled)',
    volume: '50 Tonnes',
    image: 'https://images.unsplash.com/photo-1606189582101-7fa0d23c3473?auto=format&fit=crop&q=80&w=400',
    startPrice: 15,
    currentBid: 18,
    bids: 8,
    status: 'active',
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days
  },
  {
    id: 'AUC-2024-083',
    material: 'Aluminium Cans (Crushed)',
    volume: '5 Tonnes',
    image: 'https://images.unsplash.com/photo-1598284643714-d0233633887c?auto=format&fit=crop&q=80&w=400',
    startPrice: 120,
    currentBid: 145,
    bids: 22,
    status: 'active',
    endTime: new Date(Date.now() + 1000 * 60 * 45).toISOString(), // 45 mins (Ending soon)
  },
  {
    id: 'AUC-2024-079',
    material: 'Mixed Plastics (HDPE)',
    volume: '15 Tonnes',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400',
    startPrice: 30,
    currentBid: 30,
    bids: 0,
    status: 'draft',
    endTime: null,
  },
  {
    id: 'AUC-2024-070',
    material: 'Clear Glass Cullet',
    volume: '30 Tonnes',
    image: 'https://images.unsplash.com/photo-1622359858348-735f0962e879?auto=format&fit=crop&q=80&w=400',
    startPrice: 10,
    currentBid: 14,
    bids: 31,
    status: 'sold',
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    winner: 'EcoGlass Manufacturers Ltd'
  }
];

const MOCK_ACTIVITY = [
  { id: 1, text: 'Company X bid KES 52/kg on PET Flakes', time: '2 mins ago', icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 2, text: 'Auction AUC-2024-083 ending in 45 mins', time: '15 mins ago', icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { id: 3, text: 'New bidder registered for OCC Paper', time: '1 hour ago', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 4, text: 'EcoGlass paid invoice for AUC-2024-070', time: '3 hours ago', icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
];

// Helper for countdown
const getCountdown = (endTime: string | null) => {
  if (!endTime) return null;
  const total = Date.parse(endTime) - Date.now();
  if (total <= 0) return 'Ended';
  
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export default function Auctions() {
  const [activeTab, setActiveTab] = useState<'active' | 'draft' | 'sold'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Force re-render for countdown timers
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const filteredAuctions = MOCK_AUCTIONS.filter(a => {
    const matchesSearch = a.material.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.id.toLowerCase().includes(searchQuery.toLowerCase());
    return a.status === activeTab && matchesSearch;
  });

  // KPIs
  const activeCount = MOCK_AUCTIONS.filter(a => a.status === 'active').length;
  const estimatedValue = MOCK_AUCTIONS.filter(a => a.status === 'active')
    .reduce((sum, a) => sum + (a.currentBid * parseInt(a.volume) * 1000), 0);
  const endingSoon = MOCK_AUCTIONS.filter(a => a.status === 'active' && a.endTime && (Date.parse(a.endTime) - Date.now() < 86400000)).length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Material Auctions</h1>
              <span className="font-bold px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] uppercase tracking-widest">B2B Sales</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">List bulk processed materials to the highest bidder network.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> List New Auction
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main Content (Left 3 Columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Active Auctions', value: activeCount, icon: Gavel, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Est. Active Value', value: `KSh ${(estimatedValue / 1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Highest Bid Today', value: 'KSh 145/kg', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Ending < 24h', value: endingSoon, icon: Clock, color: 'text-rose-500', bg: 'bg-rose-500/10' },
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
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                {[
                  { id: 'active', label: 'Active (Live)' },
                  { id: 'draft', label: 'Drafts' },
                  { id: 'sold', label: 'Closed / Sold' },
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
                    placeholder="Search materials, IDs..." 
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

            {/* Auction Grid */}
            {filteredAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ">
                {filteredAuctions.map(auction => {
                  const isEndingSoon = auction.status === 'active' && auction.endTime && (Date.parse(auction.endTime) - Date.now() < 3600000 * 2); // < 2 hrs
                  const isEnded = auction.status === 'sold';
                  
                  return (
                    <div key={auction.id} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden group hover:border-emerald-500/50 transition-colors flex flex-col relative">
                      
                      {/* Image Area */}
                      <div className="h-48 relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                        <OptimizedImage src={auction.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        
                        {/* Status Badge overlays */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <div className={`px-2.5 py-1 backdrop-blur-md rounded-lg border text-[9px] font-bold uppercase tracking-widest ${
                            auction.status === 'active' ? 'bg-emerald-500/80 border-emerald-400 text-white' :
                            auction.status === 'sold' ? 'bg-indigo-500/80 border-indigo-400 text-white' :
                            'bg-slate-800/80 border-slate-600 text-slate-300'
                          }`}>
                            {auction.status}
                          </div>
                        </div>

                        {/* Timer Overlay */}
                        {auction.status === 'active' && (
                          <div className={`absolute bottom-3 right-3 px-3 py-1.5 backdrop-blur-md rounded-lg border text-[10px] font-bold tracking-widest flex items-center gap-1.5 ${
                            isEndingSoon ? 'bg-rose-500/90 border-rose-400 text-white animate-pulse' : 'bg-slate-900/80 border-slate-700 text-white'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {getCountdown(auction.endTime)}
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{auction.id}</p>
                        <h3 className="text-base font-bold text-[#131722] dark:text-white leading-tight mb-2">{auction.material}</h3>
                        
                        <div className="flex items-center gap-4 mb-4 mt-auto pt-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Package className="w-4 h-4 text-slate-400" /> {auction.volume}
                          </div>
                        </div>

                        {/* Financials Box */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-[#e0e3eb] dark:border-slate-700/50 flex justify-between items-center mb-4">
                          <div>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Start Price</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">KES {auction.startPrice}/kg</p>
                          </div>
                          <div className="w-px h-8 bg-[#e0e3eb] dark:bg-slate-700"></div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{isEnded ? 'Winning Bid' : 'Highest Bid'}</p>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">KES {auction.currentBid}/kg</p>
                          </div>
                        </div>

                        {/* Footer / Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-[#e0e3eb] dark:border-slate-700/50">
                          <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Gavel className="w-3.5 h-3.5" /> {auction.bids} Bids Placed
                          </p>
                          <button className={`text-xs font-bold transition-colors ${isEnded ? 'text-indigo-500 hover:text-indigo-600' : 'text-emerald-600 hover:text-emerald-700'}`}>
                            {isEnded ? 'View Details' : 'Manage Bids'}
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center text-center text-slate-500 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl">
                <Gavel className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="font-bold text-sm text-[#131722] dark:text-white">No auctions found</p>
                <p className="text-xs mt-1">Try adjusting your filters or create a new listing.</p>
              </div>
            )}

          </div>

          {/* Right Sidebar (Market Context) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Live Activity Feed */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-4">
                <Gavel className="w-4 h-4 text-blue-500" /> Live Bidding Activity
              </h3>
              <div className="space-y-4">
                {MOCK_ACTIVITY.map(act => (
                  <div key={act.id} className="flex gap-3">
                    <div className={`w-8 h-8 rounded-lg ${act.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                      <act.icon className={`w-4 h-4 ${act.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#131722] dark:text-slate-200 leading-snug">{act.text}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Selling Tip
                </h3>
                <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                  Auctions ending on Thursday mornings statistically receive 14% higher final bids from manufacturers.
                </p>
              </div>
              <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500/30" />
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
