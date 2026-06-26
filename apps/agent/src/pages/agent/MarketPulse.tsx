/**
 * MarketIntelligenceHub.jsx — The "Bloomberg Terminal" for the Circular Economy.
 * Provides price transparency, buy requests (RFQs), and community operational intelligence.
 */
import { useState, useEffect } from 'react';
import {
  TrendingUp, ArrowLeft, Target, Handshake,
  AlertCircle, Zap, BarChart3, ShieldCheck, Calendar,
  ChevronRight, ArrowUpRight, ArrowDownRight, Clock,
  Sparkles, Search, SlidersHorizontal, X, ChevronDown,
  Bell, MapPin, Award, GitGraph, Users, ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

import MarketPulsePricesTab from './components/MarketPulse/MarketPulsePricesTab';
import MarketPulseTrendsTab from './components/MarketPulse/MarketPulseTrendsTab';
import MarketPulseRFQsTab from './components/MarketPulse/MarketPulseRFQsTab';
import MarketPulseTipsTab from './components/MarketPulse/MarketPulseTipsTab';
import { RFQ, MarketData, CommodityTrend } from './types/marketPulse.types';

export default function MarketPulse() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);

  const prices = usePriceStore(s => s.prices);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const [activeTab, setActiveTab] = useState('prices');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedDemand, setSelectedDemand] = useState('All');
  const [selectedQuantity, setSelectedQuantity] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [rfqsList, setRfqsList] = useState<RFQ[]>([]);
  const [marketData, setMarketData] = useState<MarketData>({ commodity_trends: [] });

  const fetchRFQs = async () => {
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(company_name, name),
          rfq_offers(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mapped = data.map((r: any) => {
          let deadlineText = 'Open';
          if (r.deadline) {
            const daysLeft = Math.ceil((new Date(r.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            if (daysLeft < 0) deadlineText = 'Expired';
            else if (daysLeft === 0) deadlineText = 'Today';
            else if (daysLeft === 1) deadlineText = 'Tomorrow';
            else deadlineText = `${daysLeft} days`;
          }

          let deliveryText = 'Flexible';
          if (r.delivery_method === 'agent_pickup') deliveryText = 'Agent Pickup';
          else if (r.delivery_method === 'self_drop') deliveryText = 'Self Drop-off';

          return {
            id: r.id,
            company: r.buyer?.company_name || r.buyer?.name || 'Unknown Buyer',
            material: r.material_grade,
            quantity: `${r.requested_weight}kg`,
            price: r.target_price || 0,
            deadline: deadlineText,
            verified: true, // Assuming true for now
            region: r.pickup_area,
            category: r.category,
            delivery: deliveryText,
            offersSubmitted: r.rfq_offers?.[0]?.count || 0,
          };
        });
        setRfqsList(mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch RFQs:', err);
    }
  };

  const fetchIntelligence = async () => {
    try {
      const { data, error } = await supabase.rpc('get_market_intelligence');
      if (!error && data) {
        let dataStr = JSON.stringify(data);
        const { usePriceStore } = await import('@klinflow/core/stores/priceStore');
        const materials = usePriceStore.getState().prices || [];
        materials.forEach(m => {
          if (m.id && dataStr.includes(m.id)) {
            dataStr = dataStr.replace(new RegExp(m.id, 'g'), m.label);
          }
        });
        setMarketData(JSON.parse(dataStr));
      }
    } catch (err) {
      console.error('Failed to fetch market intelligence:', err);
    }
  };

  useEffect(() => {
    fetchPrices();
    fetchRFQs();
    fetchIntelligence();

    const channel = supabase.channel('public:rfqs-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('New Market Request!', { description: 'A buyer just posted a new material request.' });
          }
          fetchRFQs();
          fetchIntelligence();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_offers' },
        () => {
          fetchRFQs();
          fetchIntelligence();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered Lists
  const commodityTrends = marketData?.commodity_trends || [];
  const filteredTrends = commodityTrends.filter((item: CommodityTrend) => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topBuyer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || item.region === selectedRegion;
    const matchesDemand = selectedDemand === 'All' || item.demand === selectedDemand;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesRegion && matchesDemand && matchesCategory;
  });

  const filteredRFQs = rfqsList.filter(rfq => {
    const matchesSearch = rfq.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.material.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || rfq.region === selectedRegion;
    const matchesCategory = selectedCategory === 'All' || rfq.category === selectedCategory;

    // Quantity filter logic
    let matchesQuantity = true;
    if (selectedQuantity !== 'All') {
      const qtyNum = parseInt(rfq.quantity.replace(/[^0-9]/g, ''));
      if (selectedQuantity === 'small') {
        matchesQuantity = qtyNum < 500;
      } else if (selectedQuantity === 'medium') {
        matchesQuantity = qtyNum >= 500 && qtyNum <= 1000;
      } else if (selectedQuantity === 'large') {
        matchesQuantity = qtyNum > 1000;
      }
    }

    // Urgency filter logic
    let matchesUrgency = true;
    if (selectedUrgency !== 'All') {
      const deadlineLower = rfq.deadline.toLowerCase();
      const isUrgent = deadlineLower.includes('tomorrow') ||
        deadlineLower.includes('1 day') ||
        deadlineLower.includes('2 days');
      if (selectedUrgency === 'urgent') {
        matchesUrgency = isUrgent;
      } else if (selectedUrgency === 'normal') {
        matchesUrgency = !isUrgent;
      }
    }

    return matchesSearch && matchesRegion && matchesCategory && matchesQuantity && matchesUrgency;
  });

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Market Intelligence</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Price Ticker & RFQs
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-4 pb-3 gap-1.5 overflow-x-auto no-scrollbar">
          {([
            { id: 'prices', label: 'Prices', icon: TrendingUp },

            { id: 'trends', label: 'AI Trends', icon: Sparkles },
            { id: 'tips', label: 'Insights', icon: Zap },
          ].filter(Boolean) as Array<{ id: string, label: string, icon: any }>).map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                // Clear search/filters on tab change to avoid confusing user state
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedRegion('All');
                setSelectedDemand('All');
                setSelectedQuantity('All');
                setSelectedUrgency('All');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all border shrink-0 ${activeTab === tab.id
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm font-bold'
                : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                }`}
            >
              <tab.icon className={`w-3.5 h-3.5 shrink-0 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
              <span className="text-[10px] font-bold capitalize tracking-widest leading-none">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        {activeTab !== 'trends' && activeTab !== 'tips' && (
          <div className="flex items-center gap-2 px-4 pb-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials or buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-3 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* Filter Panel Toggle */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all shrink-0 ${isFilterOpen || selectedRegion !== 'All' || selectedDemand !== 'All' || selectedCategory !== 'All' || selectedQuantity !== 'All' || selectedUrgency !== 'All'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-750'
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {(selectedRegion !== 'All' || selectedDemand !== 'All' || selectedCategory !== 'All' || selectedQuantity !== 'All' || selectedUrgency !== 'All') && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          </div>
        )}

        {/* Dropdown Filters Expandable Panel */}
        <AnimatePresence>
          {activeTab !== 'trends' && isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
            >
              {activeTab === 'prices' && (
                <div className="p-4 grid grid-cols-3 gap-3">
                  {/* Category Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Categories</option>
                        <option value="Plastic">Plastic</option>
                        <option value="Metal">Metal</option>
                        <option value="Paper">Paper</option>
                        <option value="Organic">Organic</option>
                        <option value="Glass">Glass</option>
                        <option value="E-waste">E-waste</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Region Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Region</label>
                    <div className="relative">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Regions</option>
                        <option value="Nairobi">Nairobi</option>
                        <option value="Western">Western</option>
                        <option value="Coast">Coast</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Demand Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Demand</label>
                    <div className="relative">
                      <select
                        value={selectedDemand}
                        onChange={(e) => setSelectedDemand(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Demand</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                        <option value="Stable">Stable</option>
                        <option value="Low">Low</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'rfqs' && (
                <div className="p-4 grid grid-cols-2 gap-3">
                  {/* Category Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category</label>
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Categories</option>
                        <option value="Plastic">Plastic</option>
                        <option value="Metal">Metal</option>
                        <option value="Paper">Paper</option>
                        <option value="Organic">Organic</option>
                        <option value="Glass">Glass</option>
                        <option value="E-waste">E-waste</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Region Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Region</label>
                    <div className="relative">
                      <select
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Regions</option>
                        <option value="Nairobi">Nairobi</option>
                        <option value="Western">Western</option>
                        <option value="Coast">Coast</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Quantity Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quantity Goal</label>
                    <div className="relative">
                      <select
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Quantities</option>
                        <option value="small">&lt; 500kg</option>
                        <option value="medium">500kg - 1,000kg</option>
                        <option value="large">&gt; 1,000kg</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Urgency Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Urgency</label>
                    <div className="relative">
                      <select
                        value={selectedUrgency}
                        onChange={(e) => setSelectedUrgency(e.target.value)}
                        className="w-full py-1.5 pl-2 pr-6 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-750 dark:text-slate-200 appearance-none focus:outline-none focus:border-emerald-500"
                      >
                        <option value="All">All Urgency</option>
                        <option value="urgent">Urgent (&lt;= 2 days)</option>
                        <option value="normal">Normal</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* Clear filters bar */}
              {(selectedCategory !== 'All' || selectedRegion !== 'All' || selectedDemand !== 'All' || selectedQuantity !== 'All' || selectedUrgency !== 'All') && (
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedRegion('All');
                      setSelectedDemand('All');
                      setSelectedQuantity('All');
                      setSelectedUrgency('All');
                    }}
                    className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 uppercase tracking-wider flex items-center gap-1"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── CONTENT AREA ── */}
      <main className={`flex-1 pb-5 max-w-lg mx-auto w-full px-1.5 space-y-0.5 transition-all duration-300 ${activeTab === 'trends' || activeTab === 'tips'
        ? 'pt-[calc(env(safe-area-inset-top,1rem)+8rem)]'
        : 'pt-[calc(env(safe-area-inset-top,1rem)+11rem)]'
        }`}>
        <AnimatePresence mode="wait">
          {activeTab === 'prices' && (
            <MarketPulsePricesTab marketData={marketData} filteredTrends={filteredTrends} />
          )}

          {activeTab === 'trends' && (
            <MarketPulseTrendsTab marketData={marketData} />
          )}

          {activeTab === 'rfqs' && (
            <MarketPulseRFQsTab filteredRFQs={filteredRFQs} navigate={navigate} />
          )}

          {activeTab === 'tips' && (
            <MarketPulseTipsTab marketData={marketData} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
