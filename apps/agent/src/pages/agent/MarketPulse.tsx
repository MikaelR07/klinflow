/**
 * MarketIntelligenceHub.jsx — The "Bloomberg Terminal" for the Circular Economy.
 * Provides price transparency, buy requests (RFQs), and community operational intelligence.
 */
import { useState, useEffect } from 'react';
import {
  TrendingUp, ArrowLeft, Target, Handshake,
  AlertCircle, Zap, BarChart3,
  ChevronRight, ArrowUpRight, ArrowDownRight, Clock,
  Sparkles, Search, SlidersHorizontal, X, ChevronDown,
  Bell, MapPin, Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';
const COMMODITY_TRENDS = [
  { id: 'pet', label: 'PET Plastic', price: 22, change: '+5.4%', trend: 'up', demand: 'High', supply: 'Moderate', topBuyer: 'EcoPlast Industries', region: 'Nairobi', category: 'Plastic' },
  { id: 'hdpe', label: 'HDPE Plastic', price: 18, change: '-2.1%', trend: 'down', demand: 'Stable', supply: 'High', topBuyer: 'KenPoly Manufacturers', region: 'Western', category: 'Plastic' },
  { id: 'alu', label: 'Aluminium', price: 45, change: '+12.0%', trend: 'up', demand: 'Critical', supply: 'Low', topBuyer: 'Devki Steel & Alloys', region: 'Nairobi', category: 'Metal' },
  { id: 'copper', label: 'Copper', price: 120, change: '+1.5%', trend: 'up', demand: 'High', supply: 'Critically Low', topBuyer: 'Nairobi Metal Refiners', region: 'Coast', category: 'Metal' },
  { id: 'paper', label: 'Cardboard', price: 8, change: '0%', trend: 'stable', demand: 'Low', supply: 'Abundant', topBuyer: 'Chandaria Paper Mills', region: 'Western', category: 'Paper' },
];

const AI_TRENDS_SECTIONS = [
  {
    title: "Rising Prices",
    tagline: "Materials that are selling for more money",
    color: "emerald",
    items: [
      {
        material: "Copper Scrap",
        status: "Selling for more this week",
        text: "Copper prices are trending upward due to lower supply.",
        badge: "+ KSh 6.20/kg"
      },
      {
        material: "Hard Plastic (HDPE)",
        status: "Higher demand in factories",
        text: "Factories are paying more for hard plastic bottles and containers this week.",
        badge: "+ KSh 3.10/kg"
      }
    ]
  },
  {
    title: "Regional Hotspots",
    tagline: "Places where buyers are looking to buy now",
    color: "indigo",
    items: [
      {
        material: "Clear PET Bottles",
        status: "High demand in Eastlands",
        text: "PET bottle demand has increased 22% in Eastlands this week.",
        badge: "Eastlands"
      },
      {
        material: "Organic Waste",
        status: "More buyers in Western",
        text: "Compost makers and organic hubs in Western are actively buying waste.",
        badge: "Western"
      }
    ]
  },
  {
    title: "Most Wanted Today",
    tagline: "What buyers are searching for on the hub",
    color: "amber",
    items: [
      {
        material: "Clean Cardboard",
        status: "Highly popular today",
        text: "Industrial Area recyclers are actively buying clean cardboard.",
        badge: "Cardboard"
      },
      {
        material: "Aluminum Soda Cans",
        status: "Very high interest",
        text: "Local recycling centers are looking for soda and beverage cans.",
        badge: "Soda Cans"
      }
    ]
  },
  {
    title: "Quick Price Jumps",
    tagline: "Sudden changes in normal buying prices",
    color: "rose",
    items: [
      {
        material: "Soft Plastic Wraps (LDPE)",
        status: "Price jumped recently",
        text: "Plastic wrap rates went up because packaging companies need sheets.",
        badge: "+ KSh 4.50/kg"
      },
      {
        material: "Electronic Boards (E-Waste)",
        status: "Big payout increase",
        text: "Electronic scrap buyers are offering a much higher payout this week.",
        badge: "+ KSh 45.00/kg"
      }
    ]
  }
];

const ACTIONABLE_INSIGHTS = [
  {
    category: 'Market Alert',
    title: 'Copper Scrap on the Rise',
    text: 'Copper demand expected to rise this weekend.',
    iconName: 'bell',
    color: 'rose',
    badge: 'Alert'
  },
  {
    category: 'Regional Opportunity',
    title: 'Cardboard Surge in Westlands',
    text: 'Westlands hotels generating high cardboard supply this week.',
    iconName: 'mappin',
    color: 'indigo',
    badge: 'Hotspot'
  },
  {
    category: 'Pricing Education',
    title: 'Sort to Earn More',
    text: 'Clean sorted plastics sell 18% higher than mixed plastics.',
    iconName: 'trendingup',
    color: 'emerald',
    badge: 'Better Deals'
  },
  {
    category: 'Grade A Purity',
    title: 'Perfect PET Sorting',
    text: 'Cleaning your PET bottles and removing labels can increase your payout value by up to 20%. Factories pay more for ready-to-process material.',
    iconName: 'award',
    color: 'purple',
    badge: 'Quality Tip'
  },
  {
    category: 'Market Timing',
    title: 'Optimal Sell Windows',
    text: 'Prices for Scrap Metal usually peak in the first week of the month when industrial demand is high. Try to hold stock until then.',
    iconName: 'clock',
    color: 'amber',
    badge: 'Best Time'
  }
];

// MOCK_RFQS removed, using real data from Supabase

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
  const [rfqsList, setRfqsList] = useState<any[]>([]);

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

  useEffect(() => {
    fetchPrices();
    fetchRFQs();

    const channel = supabase.channel('public:rfqs-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('New Market Request!', { description: 'A buyer just posted a new material request.' });
          }
          fetchRFQs();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfq_offers' },
        () => {
          fetchRFQs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered Lists
  const filteredTrends = COMMODITY_TRENDS.filter(item => {
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
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
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
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
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
                className="w-full pl-9 pr-8 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
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
      <main className={`flex-1 pb-10 max-w-lg mx-auto w-full px-1.5 space-y-0.5 transition-all duration-300 ${activeTab === 'trends' || activeTab === 'tips'
        ? 'pt-[calc(env(safe-area-inset-top,1rem)+6.5rem)]'
        : 'pt-[calc(env(safe-area-inset-top,1rem)+9.25rem)]'
        }`}>
        <AnimatePresence mode="wait">
          {activeTab === 'prices' && (
            <motion.div
              key="prices-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-0.5"
            >
              {/* Market Insight Banner */}
              <div className="bg-gradient-to-br from-emerald-700 to-indigo-900 rounded-2xl p-5 text-white relative overflow-hidden">

                <div className="relative z-10 space-y-4">
                  {/* Title */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-[10px] font-bold capitalize tracking-[0.2em] text-white">Today's Market</h3>
                    <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Price
                    </div>
                  </div>

                  {/* Grid metrics in a row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Top Rising</span>
                      <span className="text-[12px] font-semibold text-white mt-0.5 flex items-center gap-0.5">
                        Copper <span className="text-emerald-400 font-bold">↑ 12%</span>
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-2">
                      <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Highest Demand</span>
                      <span className="text-[12px] font-semibold text-white mt-0.5 truncate" title="PET Plastic">
                        PET Plastic
                      </span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-2">
                      <span className="text-[10px] font-semibold text-indigo-200 uppercase tracking-wider">Oversupplied</span>
                      <span className="text-[12px] font-semibold text-indigo-100 mt-0.5 truncate" title="Mixed Paper">
                        Mixed Paper
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Grid */}
              <div className="flex flex-col space-y-px">
                {filteredTrends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Commodities Found</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Try adjusting your filters or search keywords.</p>
                  </div>
                ) : (
                  filteredTrends.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-slate-800 rounded-none p-4 border-b border-slate-100 dark:border-slate-800/40 flex flex-col gap-3 group active:bg-slate-50 dark:active:bg-slate-800/60 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.trend === 'up' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                            item.trend === 'down' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'
                            }`}>
                            {item.trend === 'up' ? <TrendingUp className="w-5 h-5" /> : item.trend === 'down' ? <TrendingUp className="w-5 h-5 rotate-180" /> : <BarChart3 className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize tracking-tight leading-tight">{item.label}</h4>
                            <p className="text-[10px] font-semibold text-slate-405 dark:text-slate-400 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                              Demand: <span className={item.demand === 'High' || item.demand === 'Critical' ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{item.demand}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">KSh {item.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                          <div className={`text-[10px] font-semibold capitalize flex items-center justify-end gap-0.5 ${item.trend === 'up' ? 'text-emerald-500' : item.trend === 'down' ? 'text-rose-500' : 'text-slate-400'
                            }`}>
                            {item.change} {item.trend === 'up' ? '▲' : item.trend === 'down' ? '▼' : '•'}
                          </div>
                        </div>
                      </div>

                      {/* Supply & Top Buyer info */}
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-50 dark:border-slate-700/30 text-[10px] font-semibold capitalize tracking-widest text-slate-400 dark:border-slate-800/40 text-slate-500">
                        <div>
                          Supply: <span className={`font-semibold normal-case ml-1 ${item.supply.toLowerCase().includes('high') || item.supply.toLowerCase().includes('abundant')
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : item.supply.toLowerCase().includes('low') || item.supply.toLowerCase().includes('critical')
                              ? 'text-rose-500 font-bold'
                              : 'text-slate-600 dark:text-slate-300'
                            }`}>{item.supply}</span>
                        </div>
                        <div className="text-right truncate">
                          Top Buyer: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-1 truncate max-w-[100px] sm:max-w-[140px]" title={item.topBuyer}>{item.topBuyer}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-3">
                <p className="text-center text-[10px] font-bold text-slate-400 capitalize tracking-widest italic">
                  Prices updated every 3 hours based on hub data.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'trends' && (
            <motion.div
              key="trends-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 px-1.5 pb-5"
            >
              {/* AI Forecast Overview Banner */}
              <div className="bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900 dark:to-emerald-950/20 rounded-2xl p-4 text-slate-900 dark:text-white relative overflow-hidden shadow-sm border border-emerald-100 dark:border-emerald-500/10 space-y-3">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-750 dark:text-emerald-350 border border-emerald-500/20 dark:border-emerald-500/30">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold capitalize tracking-tight leading-none mb-1.5">AI Assistant</h3>
                    <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 capitalize tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Helps you sell for more
                    </p>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-550 dark:text-slate-405 leading-relaxed relative z-10 pt-2 border-t border-emerald-100/50 dark:border-slate-800/60">
                  Our AI Assistant looks at what buyers are searching for and buying this week. It helps you see which materials are hot, where you can get the best deals, and how to make the most money from your collected waste.
                </p>
              </div>

              {/* Sections list */}
              <div className="space-y-4">
                {AI_TRENDS_SECTIONS.map((section, idx) => {
                  const accentColorClass =
                    section.color === 'emerald' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                      section.color === 'indigo' ? 'text-indigo-500 border-indigo-500/20 bg-indigo-500/5' :
                        section.color === 'amber' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                          'text-rose-500 border-rose-500/20 bg-rose-500/5';

                  const badgeColorClass =
                    section.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold' :
                      section.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold' :
                        section.color === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' :
                          'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold';

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4"
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{section.title}</h4>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 capitalize tracking-wide leading-none">{section.tagline}</p>
                        </div>
                        <span className={`w-2.5 h-2.5 rounded-full ${section.color === 'emerald' ? 'bg-emerald-500' :
                          section.color === 'indigo' ? 'bg-indigo-500' :
                            section.color === 'amber' ? 'bg-amber-500' :
                              'bg-rose-500'
                          }`} />
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {section.items.map((item, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/20 space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{item.material}</h5>
                                <span className={`text-[10px] font-semibold uppercase tracking-wider leading-none mt-1.5 inline-block ${accentColorClass.split(' ')[0]}`}>
                                  {item.status}
                                </span>
                              </div>
                              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg ${badgeColorClass}`}>
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs font-normal text-slate-655 dark:text-slate-350 leading-relaxed">
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <div className="pt-2">
                <p className="text-center text-[10px] font-semibold text-slate-400 capitalize tracking-widest italic">
                  AI tips updated every 5 minutes based on active local buyers.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'rfqs' && (
            <motion.div
              key="rfqs-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-0.5"
            >
              {/* Discovery Entry */}
              <div className="px-4 py-2">
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Global Buy Requests</p>
                <p className="text-xs font-semibold text-slate-500">Businesses actively looking for materials right now.</p>
              </div>

              <div className="flex flex-col space-y-0.5">
                {filteredRFQs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800">
                    <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Requests Found</h3>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Try adjusting your filters or search keywords.</p>
                  </div>
                ) : (
                  filteredRFQs.map((rfq) => (
                    <div key={rfq.id} className="bg-white dark:bg-slate-800 rounded-none p-4 border-b border-slate-100 dark:border-slate-800/40 flex flex-col gap-3.5 group active:bg-slate-50 dark:active:bg-slate-850 transition-all">
                      {/* Top Row: Company & Price */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mb-1.5 leading-none">Client Name:</p>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize tracking-tight leading-none">{rfq.company}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mb-1.5 leading-none">Offered Price</p>
                          <p className="text-base font-bold text-emerald-600 dark:text-emerald-500 leading-none">KSh {rfq.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                        </div>
                      </div>

                      {/* Middle row: Material, Quantity, and Deadline */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40">
                        <div>
                          <p className="text-xs text-slate-900 dark:text-white capitalize leading-none mb-1.5">
                            <span className="text-slate-400 font-bold mr-1">Material:</span>{rfq.material}
                          </p>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 capitalize tracking-wide">
                            <span className="text-slate-400 mr-1">Required Weight:</span>{rfq.quantity}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                          {rfq.deadline === 'Open' ? 'No Deadline' : `${rfq.deadline} Left`}
                        </span>
                      </div>

                      {/* Meta details: Delivery, Offers */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold capitalize tracking-widest text-slate-400 dark:text-slate-500 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Delivery: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-0.5">{rfq.delivery}</span></span>
                        </div>
                        <div className="text-right">
                          Offers Submitted: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-0.5">{rfq.offersSubmitted}</span>
                        </div>
                      </div>

                      {/* Button */}
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => navigate(`/rfq/${rfq.id}`)}
                          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                        >
                          Fulfill Request <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'tips' && (
            <motion.div
              key="tips-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-0.5 pb-10"
            >
              <div className="bg-white dark:bg-slate-800 rounded-none p-4 border-b border-slate-100 dark:border-slate-800/40 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none mb-1.5">Intelligence Coach</h3>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Actionable tips to earn more</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {ACTIONABLE_INSIGHTS.map((tip, i) => {
                    const IconComponent = tip.iconName === 'bell' ? Bell :
                      tip.iconName === 'mappin' ? MapPin :
                        tip.iconName === 'trendingup' ? TrendingUp :
                          tip.iconName === 'award' ? Award : Clock;

                    const colorClasses = tip.color === 'rose' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600' :
                      tip.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600' :
                        tip.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                          tip.color === 'purple' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' :
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600';

                    const badgeClasses = tip.color === 'rose' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400' :
                      tip.color === 'indigo' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                        tip.color === 'emerald' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          tip.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';

                    return (
                      <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-semibold text-slate-405 dark:text-slate-500 capitalize tracking-wider">{tip.category}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${badgeClasses}`}>
                              {tip.badge}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize mb-1">{tip.title}</h4>
                          <p className="text-xs font-normal text-slate-600 dark:text-slate-350 leading-relaxed">{tip.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all">
                  Join Community Forum
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
  );
}
