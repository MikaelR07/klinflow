import { useEffect, useState, useMemo, useCallback } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Scale, TrendingUp, Truck,
  Store, CheckCircle2, Clock, Package, Lightbulb,
  Info, User, Users, X, DollarSign, Filter, MessageSquare,
  ShoppingCart, Bell, Box, ArrowDown, ArrowUp, ChevronDown, CheckCircle, ShieldCheck, Activity, LineChart as LineChartIcon, LayoutGrid, List, FileText
} from 'lucide-react';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { OptimizedImage } from '@klinflow/ui';
import FleetRecommendations from './FleetRecommendations';

// Category badge color map
const CATEGORY_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  plastic: { bg: 'bg-blue-200', text: 'text-blue-700', darkBg: 'dark:bg-blue-500/15', darkText: 'dark:text-blue-400' },
  metal: { bg: 'bg-amber-200', text: 'text-amber-700', darkBg: 'dark:bg-amber-500/15', darkText: 'dark:text-amber-400' },
  paper: { bg: 'bg-indigo-200', text: 'text-indigo-700', darkBg: 'dark:bg-indigo-500/15', darkText: 'dark:text-indigo-400' },
  organic: { bg: 'bg-green-200', text: 'text-green-700', darkBg: 'dark:bg-green-500/15', darkText: 'dark:text-green-400' },
  glass: { bg: 'bg-cyan-200', text: 'text-cyan-700', darkBg: 'dark:bg-cyan-500/15', darkText: 'dark:text-cyan-400' },
  'e-waste': { bg: 'bg-red-200', text: 'text-red-700', darkBg: 'dark:bg-red-500/15', darkText: 'dark:text-red-400' },
  textile: { bg: 'bg-purple-200', text: 'text-purple-700', darkBg: 'dark:bg-purple-500/15', darkText: 'dark:text-purple-400' },
};

const getCategoryStyle = (category: string) => {
  const key = category?.toLowerCase() || '';
  return CATEGORY_COLORS[key] || { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-700', darkText: 'dark:text-slate-400' };
};

export default function KlinMarket() {
  const { isDarkMode } = useThemeStore();
  const profile = useAuthStore(s => s.profile);
  const currentCompanyId = useAuthStore(s => s.currentCompanyId);


  // --- Core State ---
  const [activeMainTab, setActiveMainTab] = useState<'discover' | 'bids' | 'purchases' | 'recommendations'>('discover');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // --- Discover Tab State ---
  const listings = useMarketplaceStore(s => s.listings);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);
  const sentOffers = useMarketplaceStore(s => s.sentOffers);
  const fetchSentOffers = useMarketplaceStore(s => s.fetchSentOffers);
  const isLoadingListings = useMarketplaceStore(s => s.isLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const territoryFilter = useMarketplaceStore(s => s.territoryFilter);
  const setTerritoryFilter = useMarketplaceStore(s => s.setTerritoryFilter);
  const [selectedListingType, setSelectedListingType] = useState<'All' | 'Individual' | 'Bulk Sells'>('All');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All Materials');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState<number>(1);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  // --- Bids Tab State ---
  const [bids, setBids] = useState<any[]>([]);
  const [isLoadingBids, setIsLoadingBids] = useState(false);
  const [bidsTab, setBidsTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  // --- Purchases Tab State ---
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [purchasesTab, setPurchasesTab] = useState<'pending' | 'processing' | 'completed'>('processing');

  const fetchBids = useCallback(async () => {
    try {
      if (!currentCompanyId) return;
      const { data, error } = await supabase
        .from('marketplace_offers')
        .select(`
          *,
          listing:marketplace_listings(*),
          seller:profiles!marketplace_offers_seller_id_fkey(id, name, company_name)
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Backfill listing data for sold listings (RLS blocks buyer from reading sold listings via join)
      const bidsWithNullListing = (data || []).filter(b => !b.listing && b.listing_id);
      if (bidsWithNullListing.length > 0) {
        const listingIds = bidsWithNullListing.map(b => b.listing_id);
        const { data: photos } = await supabase.rpc('get_listing_photos', { p_listing_ids: listingIds });
        if (photos && photos.length > 0) {
          const photoMap = new Map(photos.map((p: any) => [p.id, p]));
          const enriched = (data || []).map(b => {
            if (!b.listing && b.listing_id && photoMap.has(b.listing_id)) {
              const info = photoMap.get(b.listing_id)!;
              return { ...b, listing: { photo_url: info.photo_url, location: info.location, material: info.material, quantity: info.quantity, price_per_kg: info.price_per_kg, pickup_mode: info.pickup_mode } };
            }
            return b;
          });
          setBids(enriched);
          return;
        }
      }

      setBids(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load bids');
    } finally {
      setIsLoadingBids(false);
    }
  }, [currentCompanyId]);

  // --- Initialize ---
  useEffect(() => {
    fetchListings();
    fetchBids();
    fetchOrders();
  }, [profile?.id, currentCompanyId, fetchBids]);

  // Realtime Listings
  useEffect(() => {
    const mapListing = (l: any) => ({
      id: l.id,
      sellerId: l.seller_id,
      material: l.material,
      quantity: l.quantity,
      pricePerKg: l.price_per_kg,
      location: l.location,
      latitude: l.latitude,
      longitude: l.longitude,
      status: l.status,
      photo: l.photo_url,
      photoUrl: l.photo_url,
      grade: l.grade,
      sellerName: l.seller_id,
      createdAt: l.created_at || new Date().toISOString()
    });

    const channelName = `admin-sourcing-radar-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_listings' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const mapped = mapListing(payload.new);
            useMarketplaceStore.setState(s => ({ listings: [mapped, ...s.listings] }));
          } else if (payload.eventType === 'UPDATE') {
            const mapped = mapListing(payload.new);
            useMarketplaceStore.setState(s => ({
              listings: s.listings.map(l => l.id === payload.new.id ? { ...l, ...mapped } : l)
            }));
          } else if (payload.eventType === 'DELETE') {
            useMarketplaceStore.setState(s => ({
              listings: s.listings.filter(l => l.id !== payload.old.id)
            }));
          }
        }
      ).subscribe();

      const offersSub = supabase.channel('hub-offers-changes')
        .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_offers', filter: `company_id=eq.${currentCompanyId}` },
        () => fetchBids()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(offersSub);
    };
  }, [fetchListings, fetchBids, currentCompanyId]);

  // Reset selected ID when changing main tabs
  useEffect(() => {
    setSelectedId(null);
  }, [activeMainTab]);

  // --- Fetch Logic for Orders ---
  const fetchOrders = async () => {
    if (!profile?.id) return;
    setIsLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select(`
          *,
          listing:marketplace_listings!listing_id(
            id, location, photo_url, latitude, longitude, pickup_mode
          ),
          seller:profiles!seller_id(name, is_verified)
        `)
        .or(`company_id.eq.${currentCompanyId},buyer_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Backfill listing data for sold listings (RLS blocks buyer from reading sold listings via join)
      const ordersWithNullListing = (data || []).filter(o => !o.listing && o.listing_id);
      if (ordersWithNullListing.length > 0) {
        const listingIds = ordersWithNullListing.map(o => o.listing_id);
        const { data: photos } = await supabase.rpc('get_listing_photos', { p_listing_ids: listingIds });
        if (photos && photos.length > 0) {
          const photoMap = new Map(photos.map((p: any) => [p.id, p]));
          const enriched = (data || []).map(o => {
            if (!o.listing && o.listing_id && photoMap.has(o.listing_id)) {
              const info = photoMap.get(o.listing_id)!;
              return { ...o, listing: { photo_url: info.photo_url, location: info.location, pickup_mode: info.pickup_mode } };
            }
            return o;
          });
          setOrders(enriched);
          return;
        }
      }

      setOrders(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load purchases');
    } finally {
      setIsLoadingOrders(false);
    }
  };



  // --- Discover Logic ---
  const selectedListing = useMemo(() => listings.find(l => l.id === selectedId), [listings, selectedId]);
  
  useEffect(() => {
    if (selectedListing && activeMainTab === 'discover') {
      setOfferPrice(selectedListing.pricePerKg?.toString() || '');
      setOfferQty(selectedListing.quantity || 1);
    }
  }, [selectedId, selectedListing, activeMainTab]);

  const handleMakeOffer = async () => {
    if (!selectedListing) return;
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    if (offerQty <= 0 || offerQty > selectedListing.quantity) {
      toast.error('Invalid quantity');
      return;
    }

    setIsSendingOffer(true);
    try {
      await makeOffer(selectedListing, parseFloat(offerPrice), offerQty);
      toast.success('Offer Sent! 🚀', { description: 'The seller will be notified of your bid.' });
      fetchBids(); // refresh bids list implicitly
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSendingOffer(false);
    }
  };

  const getHasOffer = (listingId: string) => sentOffers.some(o => o.listingId === listingId);

  // --- KPI Stats Logic ---
  const kpiStats = useMemo(() => {
    let activeListings = 0;
    let totalVolume = 0;
    let totalValue = 0;
    const uniqueSellers = new Set();

    listings.forEach(listing => {
      activeListings++;
      totalVolume += listing.quantity || 0;
      totalValue += (listing.quantity || 0) * (listing.pricePerKg || 0);
      if (listing.sellerId) uniqueSellers.add(listing.sellerId);
    });

    const formatVolume = (kg: number) => {
      if (kg >= 1000) return (kg / 1000).toFixed(1) + ' t';
      return kg.toLocaleString() + ' kg';
    };

    const formatValue = (val: number) => {
      if (val >= 1000000) return 'KES ' + (val / 1000000).toFixed(2) + 'M';
      if (val >= 1000) return 'KES ' + (val / 1000).toFixed(1) + 'k';
      return 'KES ' + val.toLocaleString();
    };

    return {
      activeListings: activeListings.toLocaleString(),
      totalVolume: formatVolume(totalVolume),
      totalValue: formatValue(totalValue),
      sellers: uniqueSellers.size.toLocaleString()
    };
  }, [listings]);

  const filteredListings = useMemo(() => {
    // Filter out listings that the user has already bid on
    let result = listings.filter(l => !bids.some(b => b.listing_id === l.id) && !getHasOffer(l.id));
    
    if (selectedListingType === 'Individual') result = result.filter(l => !l.isBulkDrive);
    else if (selectedListingType === 'Bulk Sells') result = result.filter(l => l.isBulkDrive);

    if (selectedCategoryTab !== 'All Materials') {
       result = result.filter(l => {
         const cat = (l.materialCategory || l.material || '').toLowerCase();
         if (selectedCategoryTab === 'Plastics' && cat.includes('plastic')) return true;
         if (selectedCategoryTab === 'Paper & Cardboard' && (cat.includes('paper') || cat.includes('cardboard') || cat.includes('occ'))) return true;
         if (selectedCategoryTab === 'Metals' && (cat.includes('metal') || cat.includes('aluminium') || cat.includes('steel'))) return true;
         if (selectedCategoryTab === 'Glass' && cat.includes('glass')) return true;
         if (selectedCategoryTab === 'Textiles' && (cat.includes('textile') || cat.includes('clothes'))) return true;
         if (selectedCategoryTab === 'Organic' && (cat.includes('organic') || cat.includes('food'))) return true;
         if (selectedCategoryTab === 'E-Waste' && (cat.includes('e-waste') || cat.includes('electronic') || cat.includes('appliance'))) return true;
         return false;
       });
    }

    if (!searchTerm) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(l => (l.material && l.material.toLowerCase().includes(term)) || (l.location && l.location.toLowerCase().includes(term)));
  }, [listings, searchTerm, selectedListingType, selectedCategoryTab, bids, sentOffers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedListingType, selectedCategoryTab]);

  // --- Bids Logic ---
  const displayedBids = useMemo(() => {
    return bids.filter(b => {
       if (bidsTab === 'rejected') return b.status === 'rejected' || b.status === 'countered';
       return b.status === bidsTab;
    });
  }, [bids, bidsTab]);
  const selectedBid = useMemo(() => bids.find(b => b.id === selectedId), [bids, selectedId]);

  // --- Purchases Logic ---
  const displayedOrders = useMemo(() => {
    return orders.filter(o => o.status === purchasesTab);
  }, [orders, purchasesTab]);
  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedId), [orders, selectedId]);



  const handleDeleteBid = async (offerId: string) => {
    if (!window.confirm("Are you sure you want to withdraw this bid?")) return;
    try {
      const { error } = await supabase.from('marketplace_offers').delete().eq('id', offerId);
      if (error) throw error;
      toast.success("Bid deleted successfully.");
      setSelectedId(null);
      fetchBids();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete bid.");
    }
  };

  // --- Render ---
  return (
    <div className="font-medium space-y-6 animate-fade-in w-full pb-10 p-2 sm:p-6 rounded-xl min-h-screen">
      
      {/* ── HEADER & MASTER TABS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Klin Market Command Center</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Discover materials, negotiate bids, and manage dispatch logistics all in one place.</p>
        </div>
        
        {/* ── KPI CARDS ── */}
        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: 'Active Listings', value: kpiStats.activeListings, icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Total Volume', value: kpiStats.totalVolume, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Total Value', value: kpiStats.totalValue, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Sellers', value: kpiStats.sellers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          ].map((kpi, i) => (
            <div key={i} className={`bg-white dark:bg-slate-800 border ${isDarkMode ? 'border-slate-800' : 'border-[#e0e3eb]'} rounded-xl p-3 flex items-center gap-3 min-w-[140px] shadow-sm`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                 <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1">{kpi.label}</p>
                 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`inline-flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
        {[
          { id: 'discover', label: 'Market Board', icon: Search, tooltip: 'Browse available material listings from verified sellers' },
          { id: 'bids', label: 'My Active Bids', icon: MessageSquare, tooltip: 'Track your pending offers and negotiate with sellers' },
          { id: 'purchases', label: 'Purchases & Logistics', icon: Truck, tooltip: 'Manage your purchased materials and dispatch collection agents' },
          { id: 'recommendations', label: 'Field Recommendations', icon: Lightbulb, tooltip: 'Review material purchase leads submitted by your field agents' },
        ].map(tab => (
          <div key={tab.id} className="relative group">
            <button
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`px-6 py-2.5 text-sm font-semibold capitalize transition-all rounded-lg flex items-center gap-2 ${
                activeMainTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : (isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700')
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
            
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99] shadow-xl pointer-events-none text-center border border-slate-700">
              {tab.tooltip}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
            </div>
          </div>
        ))}
      </div>

      {activeMainTab === 'recommendations' ? (
        <div className="w-full mt-4 h-[calc(100vh-220px)]">
           <FleetRecommendations isEmbedded={true} />
        </div>
      ) : (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 !mt-4">
        
        {/* ── MAIN COLUMN (LEFT) ── */}
        <div className="xl:col-span-8 flex flex-col gap-4">
          
          {/* ----- MARKET BOARD VIEW ----- */}
          {activeMainTab === 'discover' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  <div className="relative w-full lg:max-w-md shrink-0">
                    <Search className="font-medium absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text" placeholder="Search materials..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-5 shrink-0 overflow-visible w-full lg:w-auto justify-start lg:justify-end">
                    {['All Materials', 'Plastics', 'Paper & Cardboard', 'Metals'].map(tab => (
                      <button key={tab} onClick={() => setSelectedCategoryTab(tab)} className={`text-[14px] whitespace-nowrap flex items-center gap-1.5 pb-1 border-b-2 transition-all ${selectedCategoryTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-slate-200'}`}>
                        {tab === 'All Materials' && <CheckCircle2 className="w-3.5 h-3.5" />} {tab}
                      </button>
                    ))}
                    
                    <div className="relative group">
                      <button className={`text-[14px] whitespace-nowrap flex items-center gap-1.5 pb-1 border-b-2 transition-all ${['Glass', 'Textiles', 'Organic', 'E-Waste'].includes(selectedCategoryTab) ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-slate-200'}`}>
                        {['Glass', 'Textiles', 'Organic', 'E-Waste'].includes(selectedCategoryTab) ? selectedCategoryTab : 'More'} <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      
                      {/* Dropdown menu */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-[#e0e3eb] dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] flex flex-col py-2">
                        {['Glass', 'Textiles', 'Organic', 'E-Waste'].map(tab => (
                          <button 
                            key={tab} 
                            onClick={() => setSelectedCategoryTab(tab)} 
                            className={`text-left px-4 py-2.5 text-[14px] hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedCategoryTab === tab ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/50 dark:bg-indigo-900/20' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-t border-[#e0e3eb] dark:border-slate-700/50 pt-3 mt-2 w-full">
                   <div className="flex items-center gap-4 w-max lg:w-full">
                       {/* Territory Filter */}
                       <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                          <div className="relative group">
                            <button 
                              onClick={() => setTerritoryFilter('global')}
                              className={`px-3 py-1.5 rounded-lg text-[14px] transition-all flex items-center gap-1 ${territoryFilter === 'global' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              🌍 Global Commercial
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99] shadow-xl pointer-events-none text-center border border-slate-700">
                              View materials across all regions
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
                            </div>
                          </div>
                          
                          <div className="relative group">
                            <button 
                              onClick={() => setTerritoryFilter('local')}
                              className={`px-3 py-1.5 rounded-lg text-[14px] transition-all flex items-center gap-1 ${territoryFilter === 'local' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                              📍 Local Territory
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99] shadow-xl pointer-events-none text-center border border-slate-700">
                              View materials within your service territory
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
                            </div>
                          </div>
                       </div>

                       <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden lg:block" />

                       {/* Listing Types (All, Individual, Bulk) */}
                       <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
                          {(['All', 'Individual', 'Bulk Sells'] as const).map(type => (
                             <div key={type} className="relative group">
                               <button 
                                 onClick={() => setSelectedListingType(type)}
                                 className={`px-3 py-1.5 rounded-lg text-[14px] transition-all ${selectedListingType === type ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                               >
                                 {type}
                               </button>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 p-2 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[99] shadow-xl pointer-events-none text-center border border-slate-700">
                                 {type === 'All' ? 'Show all listings' : type === 'Individual' ? 'Show individual seller listings' : 'Show community bulk drive listings'}
                                 <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-b border-r border-slate-700 rotate-45" />
                               </div>
                             </div>
                          ))}
                       </div>
                   </div>
                </div>
              </div>

              {filteredListings.length === 0 ? (
                <div className="py-24 text-center bg-white dark:bg-slate-800 rounded-xl border border-[#e0e3eb] dark:border-slate-800 shadow-none">
                  <div className="font-medium w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Search className="w-10 h-10" />
                  </div>
                  <h3 className="text-base font-semibold text-[#131722] dark:text-white">No materials found</h3>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {filteredListings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((listing: any) => {
                      const hasBid = getHasOffer(listing.id);
                      const category = listing.materialCategory || (listing.materialSubcategory ? listing.material : null) || 'Material';
                      const isSelected = selectedId === listing.id;

                      return (
                        <div key={listing.id} onClick={() => setSelectedId(listing.id)} className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden border transition-all flex flex-col group cursor-pointer ${isSelected ? 'border-emerald-600 ring-2 ring-indigo-500/20' : 'border-[#e0e3eb] dark:border-slate-800 hover:border-indigo-500/30'}`}>
                          <div className="relative h-[200px] bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
                            {(listing.photoUrl || listing.photo) ? (
                              <img src={getThumbnailUrl(listing.photoUrl || listing.photo, { width: 600 })} alt={listing.material} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-slate-400" /></div>
                            )}
                            {category !== 'Material' && (
                              <div className="absolute top-3 left-3">
                                <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">{category}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="mb-3">
                              <h3 className="text-base font-semibold text-[#131722] dark:text-white capitalize leading-tight truncate mb-2">{listing.materialSubcategory || listing.material}</h3>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <p className="font-bold text-[11px] text-slate-500 flex items-center gap-1 capitalize truncate"><MapPin className="w-3 h-3 text-slate-400" /> {listing.location || 'Nairobi'}</p>
                                <p className="font-bold text-[11px] text-slate-500 flex items-center gap-1 capitalize truncate text-right">
                                  <User className="w-3 h-3 text-emerald-500" /> {listing.isBulkDrive ? 'Community Bulk' : (listing.sellerName || 'Verified Seller')}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-2 text-center">
                                <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Price</p>
                                <p className="font-bold text-xs text-emerald-600 dark:text-emerald-400">KES {listing.pricePerKg}</p>
                              </div>
                              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-2 text-center">
                                <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Available</p>
                                <p className="font-bold text-xs text-[#131722] dark:text-white">{listing.quantity} kg</p>
                              </div>
                            </div>
                            <div className="font-medium flex items-center justify-between text-[10px] text-slate-500 mb-4 px-1">
                               <span className="flex items-center gap-1 font-bold"><Truck className="w-3 h-3"/> Pickup</span>
                               <span className="font-bold uppercase tracking-wider">POSTED {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d, p') : '2h ago'}</span>
                            </div>
                            <div className="mt-auto">
                              {hasBid ? (
                                <button className="w-full py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Bid Placed</button>
                              ) : (
                                <button className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20">View & Bid</button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {filteredListings.length > itemsPerPage && (
                    <div className="flex items-center justify-between border-t border-[#e0e3eb] dark:border-slate-800 pt-4 mt-2">
                      <p className="text-xs font-medium text-slate-500">
                        Showing <span className="font-bold text-slate-900 dark:text-white">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredListings.length)}</span> of <span className="font-bold text-slate-900 dark:text-white">{filteredListings.length}</span> results
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          Previous
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.ceil(filteredListings.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors ${
                                currentPage === page 
                                  ? 'bg-indigo-600 text-white shadow-sm' 
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredListings.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(filteredListings.length / itemsPerPage)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ----- MY BIDS VIEW ----- */}
          {activeMainTab === 'bids' && (
            <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="px-5 pt-4 pb-3">
                 <div className={`flex rounded-xl p-1 gap-1 ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                   {([
                     { key: 'pending' as const, label: 'Pending', icon: <Clock className="w-3.5 h-3.5" />, color: 'amber' },
                     { key: 'accepted' as const, label: 'Accepted', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'emerald' },
                     { key: 'rejected' as const, label: 'Rejected', icon: <X className="w-3.5 h-3.5" />, color: 'rose' },
                   ]).map(tab => {
                     const count = bids.filter(b => {
                       if (tab.key === 'rejected') return b.status === 'rejected' || b.status === 'countered';
                       return b.status === tab.key;
                     }).length;
                     const isActive = bidsTab === tab.key;
                     const colorMap: Record<string, { active: string; badge: string }> = {
                       amber: { active: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
                       emerald: { active: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
                       rose: { active: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400' },
                     };
                     const colors = colorMap[tab.color];
                     return (
                       <button
                         key={tab.key}
                         onClick={() => { setBidsTab(tab.key); setSelectedId(null); }}
                         className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                           isActive
                             ? `bg-white dark:bg-slate-700 shadow-sm ${colors.active} ring-1 ring-black/5 dark:ring-white/10`
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                         }`}
                       >
                         {tab.icon}
                         <span className="hidden sm:inline">{tab.label}</span>
                         {count > 0 && (
                           <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                             isActive ? colors.badge : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                           }`}>
                             {count}
                           </span>
                         )}
                       </button>
                     );
                   })}
                 </div>
               </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    <tr>
                      <th className="px-6 py-4">Material</th>
                      <th className="px-4 py-4">Seller & Location</th>
                      <th className="px-4 py-4">Seller Asking</th>
                      <th className="px-4 py-4">Hub Bid</th>
                      <th className="px-4 py-4">Quantity (Bid/Total)</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {displayedBids.length === 0 ? (
                      <tr><td colSpan={6} className="py-16 text-center text-slate-500 text-sm">No {bidsTab} bids found.</td></tr>
                    ) : displayedBids.map(bid => {
                      const sellerTotal = (bid.listing?.price_per_kg || 0) * (bid.listing?.quantity || 0);
                      const hubTotal = (bid.offered_price || 0) * (bid.quantity || 0);
                      
                      return (
                        <tr key={bid.id} onClick={() => setSelectedId(bid.id)} className={`cursor-pointer transition-all ${selectedId === bid.id ? (isDarkMode ? 'bg-indigo-900/20 border-l-2 border-indigo-500' : 'bg-indigo-50 border-l-2 border-indigo-500') : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02] border-l-2 border-transparent'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                {bid.listing?.photoUrl || bid.listing?.photo_url || bid.listing?.photo ? (
                                  <img src={getThumbnailUrl(bid.listing.photoUrl || bid.listing.photo_url || bid.listing.photo, { width: 100 })} className="w-full h-full object-cover" alt="Material" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-400" /></div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white capitalize">{bid.listing?.material}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{bid.seller?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {bid.listing?.location || 'Nairobi'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">KES {bid.listing?.price_per_kg}<span className="font-medium text-[10px]">/kg</span></p>
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Total: KES {sellerTotal.toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">KES {bid.offered_price}<span className="font-medium text-[10px]">/kg</span></p>
                              <p className="text-[10px] font-semibold text-indigo-500/80 mt-0.5">Total: KES {hubTotal.toLocaleString()}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{bid.quantity} kg <span className="text-[10px] font-medium text-slate-400">bid</span></p>
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">out of {bid.listing?.quantity || 0} kg</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${bid.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : bid.status === 'rejected' || bid.status === 'countered' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>{bid.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ----- PURCHASES VIEW ----- */}
          {activeMainTab === 'purchases' && (
             <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
               <div className="px-5 pt-4 pb-3">
                 <div className={`flex rounded-xl p-1 gap-1 ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-100'}`}>
                   {([
                     { key: 'processing' as const, label: 'Awaiting Dispatch', icon: <Clock className="w-3.5 h-3.5" />, color: 'amber' },
                     { key: 'pending' as const, label: 'Agent Assigned', icon: <Truck className="w-3.5 h-3.5" />, color: 'blue' },
                     { key: 'completed' as const, label: 'Completed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'emerald' },
                   ]).map(tab => {
                     const count = orders.filter(o => o.status === tab.key).length;
                     const isActive = purchasesTab === tab.key;
                     const colorMap: Record<string, { active: string; badge: string }> = {
                       amber: { active: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' },
                       blue: { active: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-500/15 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' },
                       emerald: { active: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' },
                     };
                     const colors = colorMap[tab.color];
                     return (
                       <button
                         key={tab.key}
                         onClick={() => { setPurchasesTab(tab.key); setSelectedId(null); }}
                         className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                           isActive
                             ? `bg-white dark:bg-slate-700 shadow-sm ${colors.active} ring-1 ring-black/5 dark:ring-white/10`
                             : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'
                         }`}
                       >
                         {tab.icon}
                         <span className="hidden sm:inline">{tab.label}</span>
                         {count > 0 && (
                           <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                             isActive ? colors.badge : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                           }`}>
                             {count}
                           </span>
                         )}
                       </button>
                     );
                   })}
                 </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className={`text-[10px] uppercase tracking-wider font-semibold ${isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                     <tr>
                       <th className="px-6 py-4">Material</th>
                       <th className="px-4 py-4">Seller & Location</th>
                       <th className="px-4 py-4">Unit Price</th>
                       <th className="px-4 py-4">Total Cost</th>
                       <th className="px-4 py-4">Quantity</th>
                       <th className="px-6 py-4 text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                     {displayedOrders.length === 0 ? (
                       <tr><td colSpan={6} className="py-16 text-center text-slate-500 text-sm">No {purchasesTab === 'processing' ? 'awaiting dispatch' : purchasesTab === 'pending' ? 'agent assigned' : 'completed'} purchases found.</td></tr>
                     ) : displayedOrders.map(order => {
                       const photoUrl = order.listing?.photo_url || order.listing?.photoUrl;
                       return (
                         <tr key={order.id} onClick={() => setSelectedId(order.id)} className={`cursor-pointer transition-all ${selectedId === order.id ? (isDarkMode ? 'bg-emerald-900/20 border-l-2 border-emerald-500' : 'bg-emerald-50 border-l-2 border-emerald-500') : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02] border-l-2 border-transparent'}`}>
                           <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                                 {photoUrl ? (
                                   <img src={getThumbnailUrl(photoUrl, { width: 100 })} className="w-full h-full object-cover" alt="Material" />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-400" /></div>
                                 )}
                               </div>
                               <div>
                                 <p className="font-bold text-slate-900 dark:text-white capitalize">{order.material}</p>
                                 <p className="text-[10px] text-slate-400 font-medium mt-0.5">{order.tracking_id || order.id.substring(0, 8).toUpperCase()}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-4 py-4">
                             <div className="flex flex-col">
                               <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">{order.seller?.name || 'Unknown'}</p>
                               <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {order.listing?.location || 'Nairobi'}</p>
                             </div>
                           </td>
                           <td className="px-4 py-4">
                             <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">KES {order.unit_price}<span className="font-medium text-[10px]">/kg</span></p>
                           </td>
                           <td className="px-4 py-4">
                             <p className="text-xs font-black text-slate-900 dark:text-white">KES {order.total_price?.toLocaleString()}</p>
                           </td>
                           <td className="px-4 py-4">
                             <p className="text-xs font-bold text-slate-900 dark:text-white">{order.quantity} kg</p>
                           </td>
                           <td className="px-6 py-4 text-center">
                             <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : order.status === 'processing' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>
                               {order.status === 'processing' ? 'Awaiting Dispatch' : order.status === 'pending' ? 'Dispatched' : 'Completed'}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

        </div>

        {/* ── RIGHT COLUMN (MASTER DETAIL) ── */}
        <div className="xl:col-span-4 flex flex-col">
          <div className={`sticky top-6 rounded-3xl border overflow-hidden shadow-xl ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            
            {/* -- HEADER -- */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <h3 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {activeMainTab === 'discover' && 'Listing Details'}
                {activeMainTab === 'bids' && 'Bid Details'}
                {activeMainTab === 'purchases' && 'Order Dispatch'}
              </h3>
              {selectedId && (
                <button onClick={() => setSelectedId(null)} className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* -- CONTENT -- */}
            {activeMainTab === 'discover' && selectedListing ? (
              <div className="flex flex-col h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                <div className="p-5 pb-0">
                  <div className="relative h-56 w-11/12 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 flex shadow-sm border border-[#e0e3eb] dark:border-slate-800">
                    {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photoUrl || selectedListing.photo]).map((imgUrl: string, idx: number) => (
                      <div key={idx} className="w-full h-full shrink-0">
                        {imgUrl ? <img src={getThumbnailUrl(imgUrl, { width: 600 })} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-slate-400" /></div>}
                      </div>
                    ))}
                    {selectedListing.materialCategory && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm backdrop-blur-md ${getCategoryStyle(selectedListing.materialCategory).bg} ${getCategoryStyle(selectedListing.materialCategory).text}`}>{selectedListing.materialCategory}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 space-y-5">
                  {/* Merged Snapshot Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl overflow-hidden shadow-sm">
                     <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 text-white flex justify-between items-center">
                        <div>
                           <p className="text-[9px] font-bold uppercase text-emerald-100 mb-0.5">Asking Price</p>
                           <p className="text-xl font-black leading-none">KSh {selectedListing.pricePerKg}<span className="text-sm font-medium text-emerald-200">/kg</span></p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-bold uppercase text-emerald-100 mb-0.5">Total Value</p>
                           <p className="text-base font-black leading-none">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700/50 border-b border-slate-200 dark:border-slate-700/50">
                        <div className="p-3">
                           <p className="font-bold text-[9px] text-slate-400 uppercase flex items-center gap-1.5 mb-1"><Scale className="w-3 h-3" /> Available Qty</p>
                           <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedListing.quantity} KG</p>
                        </div>
                        <div className="p-3">
                           <p className="font-bold text-[9px] text-slate-400 uppercase flex items-center gap-1.5 mb-1"><User className="w-3 h-3" /> Seller</p>
                           <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{selectedListing.isBulkDrive ? 'Community Bulk' : (selectedListing.sellerName || 'Verified Seller')}</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3 p-4">
                       <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                       <div><p className="font-bold text-[9px] text-slate-400 uppercase">Pickup Location</p><p className="font-bold text-xs text-slate-700 dark:text-slate-300">{selectedListing.location}</p></div>
                     </div>
                     {selectedListing.description && (
                       <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border-t border-amber-100 dark:border-amber-900/20">
                         <p className="font-bold text-[9px] text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MessageSquare className="w-3 h-3" /> Seller Note</p>
                         <p className="italic text-xs text-slate-600 dark:text-slate-400">{selectedListing.description}</p>
                       </div>
                     )}
                  </div>

                  {/* Material Details Table */}
                  <div className="bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setIsSpecsOpen(!isSpecsOpen)}
                      className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/80 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Info className="w-3 h-3" /> Material Specifications
                      </h4>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isSpecsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isSpecsOpen ? 'max-h-[500px] border-t border-[#e0e3eb] dark:border-slate-700/50' : 'max-h-0'}`}>
                      <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {[
                          { label: 'Material Type', value: selectedListing.material || '—' },
                          { label: 'Category', value: selectedListing.materialCategory || '—' },
                          { label: 'Sub-Category', value: selectedListing.materialSubcategory || '—' },
                          { label: 'Grade / Quality', value: selectedListing.grade || selectedListing.quality || 'Standard' },
                          { label: 'Listing Status', value: selectedListing.status === 'active' ? 'Live' : selectedListing.status || '—' },
                          { label: 'Posted On', value: selectedListing.createdAt ? new Date(selectedListing.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
                        ].map((row, idx) => (
                          <div key={idx} className="flex justify-between items-center px-4 py-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.label}</span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">{row.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Community Bulk Drive Info */}
                  {selectedListing.isBulkDrive && selectedListing.groupMetadata && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-[9px] font-semibold text-indigo-900 dark:text-indigo-300 uppercase tracking-widest">Community Contribution</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="font-medium text-[8px] text-indigo-400/80 capitalize tracking-widest mb-0.5">Contributors</p>
                          <p className="font-medium text-xs text-indigo-700 dark:text-indigo-300">{selectedListing.groupMetadata.contributorCount || 0} Members</p>
                        </div>
                        <div>
                          <p className="font-medium text-[8px] text-indigo-400/80 capitalize tracking-widest mb-0.5">Top Members</p>
                          <p className="font-medium text-[9px] text-indigo-600 dark:text-indigo-400 leading-tight">
                            {(selectedListing.groupMetadata.topContributors || []).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bidding UI */}
                  <div className="shrink-0 pt-2 border-t border-[#e0e3eb] dark:border-slate-700/50">
                    <div className={`${getHasOffer(selectedListing.id) ? 'bg-indigo-600' : 'bg-emerald-700'} p-4 rounded-xl border border-white/10 space-y-4 transition-colors duration-500 shadow-xl`}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          {getHasOffer(selectedListing.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">
                          {getHasOffer(selectedListing.id) ? 'Bid Active' : 'Ready to negotiate?'}
                        </h3>
                      </div>

                      {getHasOffer(selectedListing.id) ? (
                        <div className="text-center py-3 space-y-2">
                          <p className="font-medium text-xs text-white/90 leading-relaxed italic px-4">
                            "Your offer for this material has been sent to the merchant. You'll be notified if they accept your bid."
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                            <p className="font-bold text-[9px] text-white/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5" /> Seller's Asking Price
                            </p>
                            
                            <div className="flex items-end justify-between mb-1">
                               <div>
                                 <p className="text-[10px] text-white/60 font-semibold mb-0.5">Price Per KG</p>
                                 <p className="text-base font-black text-white">KSh {selectedListing.pricePerKg}</p>
                               </div>
                               <div className="text-white/40 pb-1 font-black text-sm">×</div>
                               <div className="text-right">
                                 <p className="text-[10px] text-white/60 font-semibold mb-0.5">Total Quantity</p>
                                 <p className="text-base font-black text-white">{selectedListing.quantity} KG</p>
                               </div>
                            </div>
                            
                            <div className="h-px bg-white/20 my-2" />
                            
                            <div className="flex items-center justify-between">
                               <p className="text-xs font-bold text-white/80">Total Asking Price</p>
                               <p className="text-xl font-black text-green-400">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="font-bold text-[9px] text-white uppercase tracking-widest ml-1">My Price Offer</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={offerPrice}
                                  onChange={(e) => setOfferPrice(e.target.value)}
                                  className="font-bold w-full bg-black/20 border border-white/20 h-12 rounded-xl px-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white focus:bg-black/40"
                                  placeholder="e.g. 35"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="font-bold text-[9px] text-white uppercase tracking-widest ml-1">Requested Qty (KG)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={offerQty}
                                  onChange={(e) => setOfferQty(Number(e.target.value))}
                                  className="font-bold w-full bg-black/20 border border-white/20 h-12 rounded-xl px-4 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-white focus:bg-black/40"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={handleMakeOffer}
                            disabled={isSendingOffer}
                            className="relative w-full h-14 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-xl disabled:opacity-80 disabled:cursor-not-allowed group overflow-hidden mt-2"
                          >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                              {isSendingOffer ? (
                                'Sending Offer...'
                              ) : (
                                <>Submit Final Bid <CheckCircle className="w-4 h-4 transition-transform group-hover:scale-110" /></>
                              )}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeMainTab === 'bids' && selectedBid ? (
              <div className="flex flex-col h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                <div className="p-5 pb-0">
                  <div className="relative h-56 w-11/12 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 flex shadow-sm border border-[#e0e3eb] dark:border-slate-800">
                    {selectedBid.listing?.photoUrl || selectedBid.listing?.photo_url || selectedBid.listing?.photo ? (
                      <img src={getThumbnailUrl(selectedBid.listing.photoUrl || selectedBid.listing.photo_url || selectedBid.listing.photo, { width: 600 })} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-slate-400" /></div>
                    )}
                  </div>
                </div>
                <div className="p-5 flex-1 space-y-5">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${selectedBid.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : selectedBid.status === 'rejected' || selectedBid.status === 'countered' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                        {selectedBid.status}
                      </span>
                      <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-white mt-1">{selectedBid.listing?.material}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Bid Sent On</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(selectedBid.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedBid.seller?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedBid.listing?.location || 'Nairobi'}</span>
                    </div>
                  </div>

                  {/* Negotiation Comparison Card */}
                  <div className={`${selectedBid.status === 'accepted' ? 'bg-emerald-700' : selectedBid.status === 'rejected' || selectedBid.status === 'countered' ? 'bg-rose-700' : 'bg-amber-600'} p-4 rounded-xl border border-white/10 space-y-4 shadow-xl`}>
                    <div className="flex items-center justify-center gap-3 mb-2">
                       <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                         <MessageSquare className="w-4 h-4 text-white" />
                       </div>
                       <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Bid Comparison</h3>
                    </div>

                    {/* Original Listing */}
                    <div className="bg-black/20 rounded-xl p-3 border border-white/10">
                      <p className="font-bold text-[9px] text-white/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Seller's Asking Price
                      </p>
                      <div className="flex items-end justify-between mb-1">
                         <div>
                           <p className="text-[10px] text-white/60 font-semibold mb-0.5">Price Per KG</p>
                           <p className="text-base font-black text-white">KSh {selectedBid.listing?.price_per_kg}</p>
                         </div>
                         <div className="text-white/40 pb-1 font-black text-sm">×</div>
                         <div className="text-right">
                           <p className="text-[10px] text-white/60 font-semibold mb-0.5">Available Qty</p>
                           <p className="text-base font-black text-white">{selectedBid.listing?.quantity} KG</p>
                         </div>
                      </div>
                      <div className="h-px bg-white/20 my-2" />
                      <div className="flex items-center justify-between">
                         <p className="text-xs font-bold text-white/80">Total Asking Price</p>
                         <p className="text-xl font-black text-white/90">KSh {((selectedBid.listing?.price_per_kg || 0) * (selectedBid.listing?.quantity || 0)).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Our Bid */}
                    <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                      <p className="font-bold text-[9px] text-white/90 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" /> Our Bid Offer
                      </p>
                      <div className="flex items-end justify-between mb-1">
                         <div>
                           <p className="text-[10px] text-white/80 font-semibold mb-0.5">Price Per KG</p>
                           <p className="text-base font-black text-white">KSh {selectedBid.offered_price}</p>
                         </div>
                         <div className="text-white/60 pb-1 font-black text-sm">×</div>
                         <div className="text-right">
                           <p className="text-[10px] text-white/80 font-semibold mb-0.5">Bid Qty</p>
                           <p className="text-base font-black text-white">{selectedBid.quantity} KG</p>
                         </div>
                      </div>
                      <div className="h-px bg-white/30 my-2" />
                      <div className="flex items-center justify-between">
                         <p className="text-xs font-bold text-white">Total Bid Value</p>
                         <p className="text-xl font-black text-white">KSh {((selectedBid.offered_price || 0) * (selectedBid.quantity || 0)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {selectedBid.status === 'pending' && (
                    <div className="mt-auto pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                       <button
                         onClick={() => handleDeleteBid(selectedBid.id)}
                         className="w-full py-3.5 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 font-bold uppercase tracking-widest text-[11px] rounded-xl flex items-center justify-center gap-2 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/20"
                       >
                         <X className="w-4 h-4" /> Withdraw Bid
                       </button>
                    </div>
                  )}
                </div>
              </div>
            ) : activeMainTab === 'purchases' && selectedOrder ? (
              <div className="flex flex-col h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                {/* Photo Header */}
                <div className="p-5 pb-0">
                  <div className="relative h-48 w-11/12 rounded-2xl overflow-hidden shrink-0 bg-slate-100 dark:bg-slate-900 flex shadow-sm border border-[#e0e3eb] dark:border-slate-800">
                    {selectedOrder.listing?.photo_url || selectedOrder.listing?.photoUrl ? (
                      <img src={getThumbnailUrl(selectedOrder.listing.photo_url || selectedOrder.listing.photoUrl, { width: 600 })} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-12 h-12 text-slate-400" /></div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${selectedOrder.status === 'completed' ? 'bg-emerald-500/90 text-white' : selectedOrder.status === 'processing' ? 'bg-amber-500/90 text-white' : 'bg-blue-500/90 text-white'}`}>
                        {selectedOrder.status === 'processing' ? 'Awaiting Dispatch' : selectedOrder.status === 'pending' ? 'Agent Assigned' : 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-5">
                  {/* Title & Meta */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold capitalize text-slate-900 dark:text-white">{selectedOrder.material}</h2>
                      <p className="text-[10px] font-semibold text-slate-400 mt-0.5 tracking-wide">{selectedOrder.tracking_id || `ORD-${selectedOrder.id.substring(0, 8).toUpperCase()}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">Ordered On</p>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(selectedOrder.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Seller & Location Chips */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedOrder.seller?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{selectedOrder.listing?.location || 'Nairobi'}</span>
                    </div>
                  </div>

                  {/* Transaction Summary Card */}
                  <div className={`${selectedOrder.status === 'completed' ? 'bg-emerald-700' : selectedOrder.status === 'processing' ? 'bg-gradient-to-br from-amber-600 to-amber-700' : 'bg-gradient-to-br from-blue-600 to-blue-700'} p-4 rounded-xl border border-white/10 space-y-4 shadow-xl`}>
                    <p className="font-bold text-[9px] text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-white" /> Transaction Summary
                    </p>
                    <div className="flex items-end justify-between mb-1">
                      <div>
                        <p className="text-[10px] text-white/60 font-semibold mb-0.5">Agreed Price</p>
                        <p className="text-base font-black text-white">KSh {selectedOrder.unit_price}<span className="text-sm font-medium text-white/70">/kg</span></p>
                      </div>
                      <div className="text-white/40 pb-1 font-black text-sm">×</div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/60 font-semibold mb-0.5">Quantity</p>
                        <p className="text-base font-black text-white">{selectedOrder.quantity} KG</p>
                      </div>
                    </div>
                    <div className="h-px bg-white/20 my-2" />
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white/80">Total Cost</p>
                      <p className="text-xl font-black text-white">KSh {selectedOrder.total_price?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Order Status */}
                  {selectedOrder.status === 'processing' ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                      <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Awaiting Dispatch</p>
                        <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60 mt-0.5">The operations team will assign a fleet agent to pick up this material.</p>
                      </div>
                    </div>
                  ) : selectedOrder.status === 'pending' ? (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
                      <Truck className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Agent Dispatched</p>
                        <p className="text-[10px] text-blue-600/80 dark:text-blue-400/60 mt-0.5">A fleet agent has been assigned and is en route to pick up this material.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Material Collected</p>
                        <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/60 mt-0.5">This order has been completed and material delivered to your hub.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={`h-[calc(100vh-120px)] flex flex-col items-center justify-center border-dashed border-0 text-slate-400 dark:text-slate-500`}>
                <Store className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium">Select an item from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
