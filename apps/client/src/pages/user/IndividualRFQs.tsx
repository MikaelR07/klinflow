/**
 * IndividualRFQs — Dedicated page for individual (non-group) RFQ browsing.
 * Lifted from MarketIntelligenceHub's Live RFQs tab with its own nav, search, and filters.
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Target, Search, SlidersHorizontal, X, ChevronDown,
  ArrowUpRight, ShieldCheck, MapPin, Bookmark, CircleCheck,
  Package, Flame, Scale, Clock, User, Recycle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

interface IndividualRFQ {
  id: string;
  company: string;
  material: string;
  quantity: string;
  price: number;
  deadline: string;
  verified: boolean;
  region: string;
  category: string;
  delivery: string;
  offersSubmitted: number;
  avatar?: string;
  postedAt?: string;
}

export default function IndividualRFQs() {
  const navigate = useNavigate();
  const [rfqsList, setRfqsList] = useState<IndividualRFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedQuantity, setSelectedQuantity] = useState('All');
  const [selectedUrgency, setSelectedUrgency] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchRFQs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rfqs')
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(company_name, name, avatar_url),
          rfq_offers(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const storeMaterials = useServiceStore.getState().materialPrices;
        const storeCategories = useServiceStore.getState().categories;

        const mapped = data
          .filter((r: any) => !r.is_group_collection) // Only individual RFQs
          .map((r: any) => {
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

            const materialRecord = storeMaterials.find(m => m.id === r.material_grade || `${r.category}_${m.id}` === r.material_grade);
            const materialName = materialRecord ? materialRecord.material_name : r.material_grade;

            const categoryRecord = storeCategories.find(c => c.id === r.category);
            const categoryName = categoryRecord ? categoryRecord.label : r.category;

            return {
              id: r.id,
              company: r.buyer?.company_name || r.buyer?.name || 'Unknown Buyer',
              material: materialName,
              quantity: `${r.requested_weight}kg`,
              price: r.target_price || 0,
              deadline: deadlineText,
              verified: true,
              region: r.pickup_area,
              category: categoryName,
              delivery: deliveryText,
              offersSubmitted: r.rfq_offers?.[0]?.count || 0,
              avatar: r.buyer?.avatar_url || null,
              postedAt: r.created_at ? (() => {
                const diffMs = new Date().getTime() - new Date(r.created_at).getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffHours / 24);
                if (diffDays > 0) return `${diffDays} days ago`;
                if (diffHours > 0) return `${diffHours} hrs ago`;
                return 'Just now';
              })() : undefined,
            };
          });
        setRfqsList(mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch RFQs:', err);
      toast.error('Failed to load RFQs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      useServiceStore.getState().fetchMaterialPrices(),
      useServiceStore.getState().fetchCategories()
    ]).then(() => {
      fetchRFQs();
    });

    const channel = supabase.channel('public:individual-rfqs-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rfqs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success('New Request!', { description: 'A buyer just posted a new material request.' });
          }
          fetchRFQs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filtered List
  const filteredRFQs = rfqsList.filter(rfq => {
    const matchesSearch = rfq.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.material.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || rfq.region === selectedRegion;
    const matchesCategory = selectedCategory === 'All' || rfq.category === selectedCategory;

    let matchesQuantity = true;
    if (selectedQuantity !== 'All') {
      const qtyNum = parseInt(rfq.quantity.replace(/[^0-9]/g, ''));
      if (selectedQuantity === 'small') matchesQuantity = qtyNum < 500;
      else if (selectedQuantity === 'medium') matchesQuantity = qtyNum >= 500 && qtyNum <= 1000;
      else if (selectedQuantity === 'large') matchesQuantity = qtyNum > 1000;
    }

    let matchesUrgency = true;
    if (selectedUrgency !== 'All') {
      const deadlineLower = rfq.deadline.toLowerCase();
      const isUrgent = deadlineLower.includes('tomorrow') ||
        deadlineLower.includes('1 day') ||
        deadlineLower.includes('2 days');
      if (selectedUrgency === 'urgent') matchesUrgency = isUrgent;
      else if (selectedUrgency === 'normal') matchesUrgency = !isUrgent;
    }

    return matchesSearch && matchesRegion && matchesCategory && matchesQuantity && matchesUrgency;
  });

  const hasActiveFilters = selectedCategory !== 'All' || selectedRegion !== 'All' || selectedQuantity !== 'All' || selectedUrgency !== 'All';

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Individual RFQs</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Buy Requests
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2 px-4 pb-2">
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

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all shrink-0 ${isFilterOpen || hasActiveFilters
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-750'
              }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </button>
        </div>

        {/* Dropdown Filters Expandable Panel */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
            >
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

              {hasActiveFilters && (
                <div className="px-4 pb-3 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedCategory('All');
                      setSelectedRegion('All');
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
      <main className={`flex-1 pb-5 max-w-lg mx-auto w-full space-y-0.5 transition-all duration-300 ${isFilterOpen ? 'pt-[calc(env(safe-area-inset-top,1rem)+15rem)]' : 'pt-[calc(env(safe-area-inset-top,1rem)+6rem)]'}`}>
        {/* Active Buy Requests Header */}
        <div className="flex items-center justify-between px-3.5 pb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Buy Requests</h3>
            <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 ml-0.5 bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded">Live</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            {filteredRFQs.length} Open <ArrowUpRight className="w-3 h-3 inline" />
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading requests...</p>
          </div>
        ) : filteredRFQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 mx-1.5">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">No RFQs Found</h3>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto font-medium">There are currently no active buyer requests matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredRFQs.map((rfq) => (
              <div key={rfq.id} className="bg-white dark:bg-slate-900 p-2 px-3 border-y border-slate-100 dark:border-slate-800 shadow-sm transition-colors group">
                {/* Row 1: Tags & Price */}
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-wrap gap-1.5 items-center mt-1">
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded text-[9px] font-bold">
                      <Recycle className="w-3 h-3" />
                      {rfq.material}
                    </span>
                    {rfq.price > 50 && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded text-[9px] font-bold">
                        <Flame className="w-3 h-3" />
                        High Value
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2 mt-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-emerald-500 leading-none">
                        KSh {rfq.price} <span className="text-[10px] text-slate-400 font-semibold">/kg</span>
                      </p>
                    </div>
                    <button className="text-slate-300 hover:text-slate-400 dark:text-slate-600 transition-colors">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Buyer Profile */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    {rfq.avatar ? (
                      <img src={getThumbnailUrl(rfq.avatar, { width: 150 })} className="w-full h-full object-cover" alt={rfq.company} />
                    ) : (
                      <User className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-none">{rfq.company}</h4>
                      {rfq.verified && <CircleCheck className="w-4 h-4 text-blue-500" fill="currentColor" stroke="white" strokeWidth={2} />}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                      {rfq.verified && (
                        <span className="flex items-center gap-0.5 ">
                          <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Verified Buyer
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Row 3: Key Details */}
                <div className="flex items-center gap-6 border-t border-slate-200 dark:border-slate-800 pt-2 pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                      <Scale className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.quantity}</p>
                      <p className="text-[9px] font-semibold text-slate-400 leading-none">Quantity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.region}</p>
                      <p className="text-[9px] font-semibold text-slate-400 leading-none">Location</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-rose-500 leading-none mb-0.5">{rfq.deadline}</p>
                      <p className="text-[9px] font-semibold text-slate-400 leading-none">Deadline</p>
                    </div>
                  </div>
                </div>

                {/* Row 4: Footer Actions */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                    {rfq.postedAt ? `Posted ${rfq.postedAt}` : 'Posted 3 hrs ago'}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => navigate(`/rfq/${rfq.id}`)}
                      className="px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Respond <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
