import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Scale, TrendingUp,Truck,
  Store, CheckCircle2, Clock, Package,Lightbulb,
  Info, User, Users, X, DollarSign, Filter, MessageSquare,
  ShoppingCart, Bell, Box, ArrowDown, ArrowUp, ChevronDown, CheckCircle, ShieldCheck, Activity, LineChart as LineChartIcon, LayoutGrid, List
} from 'lucide-react';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Category badge color map for the modal (keeping it for the modal)
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

const priceTrendData = [
  { date: '1', HDPE: 40, MixedPaper: 20, Aluminium: 60, OCC: 18 },
  { date: '5', HDPE: 42, MixedPaper: 19, Aluminium: 62, OCC: 17 },
  { date: '10', HDPE: 41, MixedPaper: 21, Aluminium: 65, OCC: 19 },
  { date: '15', HDPE: 45, MixedPaper: 20, Aluminium: 64, OCC: 18 },
  { date: '20', HDPE: 44, MixedPaper: 22, Aluminium: 66, OCC: 20 },
  { date: '25', HDPE: 46, MixedPaper: 21, Aluminium: 68, OCC: 21 },
  { date: '30', HDPE: 48, MixedPaper: 20, Aluminium: 65, OCC: 20 },
];

const miniSparklineData = [
  { val: 18 }, { val: 20 }, { val: 19 }, { val: 22 }, { val: 20 }, { val: 21 }, { val: 20 }
];

export default function KlinMarket() {
  const listings = useMarketplaceStore(s => s.listings);
  const fetchListings = useMarketplaceStore(s => s.fetchListings);
  const makeOffer = useMarketplaceStore(s => s.makeOffer);
  const sentOffers = useMarketplaceStore(s => s.sentOffers);
  const fetchSentOffers = useMarketplaceStore(s => s.fetchSentOffers);
  const isLoading = useMarketplaceStore(s => s.isLoading);

  const profile = useAuthStore(s => s.profile);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedListingType, setSelectedListingType] = useState<'All' | 'Individual' | 'Bulk Sells'>('All');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('All Materials');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState<number>(1);

  useEffect(() => {
    fetchListings();
    fetchSentOffers();

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
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_offers', filter: `buyer_id=eq.${profile?.id}` },
        () => fetchSentOffers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings, fetchSentOffers, profile?.id]);

  const selectedListing = useMemo(() => listings.find(l => l.id === selectedId), [listings, selectedId]);

  useEffect(() => {
    if (selectedListing) {
      setOfferPrice(selectedListing.pricePerKg?.toString() || '');
      setOfferQty(selectedListing.quantity || 1);
    }
  }, [selectedId, selectedListing]);

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

    try {
      await makeOffer(selectedListing, parseFloat(offerPrice), offerQty);
      setSelectedId(null);
      setOfferPrice('');
      toast.success('Offer Sent! 🚀', { description: 'The seller will be notified of your bid.' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getHasOffer = (listingId: string) => {
    return sentOffers.some(o => o.listingId === listingId);
  };

  const filteredListings = useMemo(() => {
    let result = listings;

    if (selectedListingType === 'Individual') {
      result = result.filter(l => !l.isBulkDrive);
    } else if (selectedListingType === 'Bulk Sells') {
      result = result.filter(l => l.isBulkDrive);
    }

    if (selectedCategoryTab !== 'All Materials') {
       result = result.filter(l => {
         const cat = (l.materialCategory || l.material || '').toLowerCase();
         if (selectedCategoryTab === 'Plastics' && cat.includes('plastic')) return true;
         if (selectedCategoryTab === 'Paper & Cardboard' && (cat.includes('paper') || cat.includes('cardboard') || cat.includes('occ'))) return true;
         if (selectedCategoryTab === 'Metals' && (cat.includes('metal') || cat.includes('aluminium') || cat.includes('steel'))) return true;
         if (selectedCategoryTab === 'Glass' && cat.includes('glass')) return true;
         if (selectedCategoryTab === 'Textiles' && cat.includes('textile')) return true;
         if (selectedCategoryTab === 'Organic' && cat.includes('organic')) return true;
         return false;
       });
    }

    if (!searchTerm) return result;
    const term = searchTerm.toLowerCase();
    return result.filter(l =>
      (l.material && l.material.toLowerCase().includes(term)) ||
      (l.location && l.location.toLowerCase().includes(term))
    );
  }, [listings, searchTerm, selectedListingType, selectedCategoryTab]);

  return (
    <div className="font-medium space-y-6 animate-fade-in w-full pb-10 p-2 sm:p-6 rounded-xl min-h-screen">
      {/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Manage public orders, accept RFQs, and fulfill on-demand pickups.</p>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Active Listings', value: '1,246', icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20', trend: '↑ 14%', trendLabel: 'vs last week', trendColor: 'text-emerald-500' },
          { label: 'Total Volume', value: '482.6 t', icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', trend: '↑ 18%', trendLabel: 'vs last week', trendColor: 'text-emerald-500' },
          { label: 'Total Value', value: 'KES 18.64M', icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', trend: '↑ 22%', trendLabel: 'vs last week', trendColor: 'text-emerald-500' },
          { label: 'Sellers', value: '318', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', trend: '↑ 9%', trendLabel: 'vs last week', trendColor: 'text-emerald-500' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-3 shadow-none flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="font-medium text-[12px] text-slate-500 dark:text-slate-400">{kpi.label}</p>
              </div>
              <div className="flex flex-col items-end">
                 <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 leading-none">{kpi.value}</h3>
                 <span className={`text-[10px] mt-1 ${kpi.trendColor}`}>{kpi.trend}</span>
              </div>
            </div>
          </div>
        ))}

        {/* 5th Card: Price Trend */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-3 shadow-none flex flex-col justify-center col-span-1 md:col-span-2 lg:col-span-1">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <p className="font-medium text-[12px] text-slate-500 dark:text-slate-400">Price Trend</p>
                 <span className="font-medium text-[10px] text-rose-500">↓ 4%</span>
              </div>
              <div className="flex flex-col items-end">
                 <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">Mixed Paper</h4>
                 <p className="font-medium text-[10px] text-slate-500 mt-1">KES 20/kg avg</p>
              </div>
           </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* ── MAIN COLUMN (LEFT) ── */}
        <div className="xl:col-span-3 space-y-6">
{/* ── SEARCH & FILTERS ROW ── */}
      <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-4 shadow-none flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="relative w-full lg:max-w-md shrink-0">
            <Search className="font-medium absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="font-medium w-full bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 rounded-xl pl-11 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          {/* Material Category Tabs moved to top right */}
          <div className="flex items-center gap-4 shrink-0 overflow-x-auto w-full lg:w-auto justify-start lg:justify-end">
              {['All Materials', 'Plastics', 'Paper & Cardboard', 'Metals'].map(tab => (
                 <button
                   key={tab}
                   onClick={() => setSelectedCategoryTab(tab)}
                   className={`text-[11px] whitespace-nowrap flex items-center gap-1 pb-1 border-b-2 transition-all ${selectedCategoryTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-slate-200'}`}
                 >
                    {tab === 'All Materials' && <CheckCircle2 className="w-3 h-3" />}
                    {tab}
                 </button>
              ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-t border-[#e0e3eb] dark:border-slate-800 pt-1 overflow-x-auto w-full pb-1 custom-scrollbar">
           <div className="flex items-center gap-4 w-max lg:w-full">
               {/* Listing Types (All, Individual, Bulk) */}
               <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                  {(['All', 'Individual', 'Bulk Sells'] as const).map(type => (
                     <button 
                       key={type}
                       onClick={() => setSelectedListingType(type)}
                       className={`px-3 py-1.5 rounded-lg text-[12px] transition-all ${selectedListingType === type ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                     >
                       {type}
                     </button>
                  ))}
               </div>
               
               {/* Right side dropdowns */}
               <div className="flex items-center gap-2 lg:ml-auto shrink-0">
                  <button className="font-medium flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 px-3 py-1.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Category <ChevronDown className="font-medium w-3 h-3 text-slate-400" />
                  </button>
                  <button className="font-medium flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 px-3 py-1.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    Location <ChevronDown className="font-medium w-3 h-3 text-slate-400" />
                  </button>
                  <button className="font-medium flex items-center gap-1.5 bg-white dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700 px-3 py-1.5 rounded-lg text-[12px] text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    <span className="font-medium text-slate-400">Sort by</span> Newest <ChevronDown className="font-medium w-3 h-3 text-slate-400" />
                  </button>
               </div>
           </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
         <p className="font-medium text-xs font-medium text-slate-500">{filteredListings.length} listings found</p>
         <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 p-1 rounded-lg">
            <button className="p-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded"><LayoutGrid className="w-4 h-4"/></button>
            <button className="font-medium p-1.5 text-slate-400 hover:text-slate-600"><List className="font-medium w-4 h-4"/></button>
         </div>
      </div>

      {/* ── GRID OF LISTINGS ── */}
      {filteredListings.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-800 rounded-xl border border-[#e0e3eb] dark:border-slate-800 shadow-none">
          <div className="font-medium w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search className="w-10 h-10" />
          </div>
          <h3 className="text-base font-semibold text-[#131722] dark:text-white">No materials found</h3>
          <p className="font-medium text-xs font-medium text-slate-500 mt-2">Try adjusting your filters or search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-3">
          {filteredListings.map((listing: any) => {
            const hasBid = getHasOffer(listing.id);
            const category = listing.materialCategory || (listing.materialSubcategory ? listing.material : null) || 'Material';

            return (
              <div
                key={listing.id}
                className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-[#e0e3eb] dark:border-slate-800 shadow-none hover:shadow-none hover:border-indigo-500/30 transition-all flex flex-col group"
              >
                {/* Image Header */}
                <div className="relative h-[200px] bg-slate-100 dark:bg-slate-800 w-full overflow-hidden cursor-pointer" onClick={() => setSelectedId(listing.id)}>
                  {(listing.photoUrl || listing.photo) ? (
                    <img
                      src={getThumbnailUrl(listing.photoUrl || listing.photo, { width: 600 })}
                      alt={listing.material}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                      <Package className="font-medium w-12 h-12 text-slate-400 dark:text-slate-600" />
                    </div>
                  )}
                  {/* Category Badge Top Left */}
                  {category && category !== 'Material' && (
                    <div className="absolute top-3 left-3">
                       <span className="font-medium px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-lg text-[10px] text-indigo-700 dark:text-indigo-400 shadow-none uppercase tracking-widest">
                         {category}
                       </span>
                    </div>
                  )}
                  {/* Likes Top Right (Mock) */}
                  <button className="font-medium absolute top-3 right-3 w-8 h-8 rounded-full bg-white/50 hover:bg-white backdrop-blur-md flex items-center justify-center transition-colors text-slate-600">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  {/* Title & Location */}
                  <div className="mb-3">
                     <div className="flex items-center gap-2 mb-2">
                       <h3 className="text-base font-semibold text-[#131722] dark:text-white capitalize leading-tight truncate cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setSelectedId(listing.id)}>
                         {listing.materialSubcategory || listing.material}
                       </h3>
                       <span className="font-medium px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-[9px] text-emerald-600 dark:text-emerald-500 flex items-center gap-1 shrink-0">
                         <ShieldCheck className="w-3 h-3" /> Verified
                       </span>
                     </div>
                     <div className="flex items-center justify-between gap-2 mt-1">
                       <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 capitalize truncate">
                         <MapPin className="font-medium w-3 h-3 text-slate-400" />
                         {listing.location || 'Nairobi'}
                       </p>
                       <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 capitalize truncate text-right">
                         <User className="font-medium w-3 h-3 text-emerald-500" />
                         {listing.isBulkDrive ? 'Community Bulk' : (listing.sellerName || 'GreenCycle Ltd')}
                       </p>
                     </div>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center bg-slate-200 dark:bg-slate-800/80 rounded-lg p-2">
                      <p className="font-medium text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Price</p>
                      <p className="font-medium text-xs text-emerald-600 dark:text-emerald-400">KES {listing.pricePerKg}</p>
                    </div>
                    <div className="text-center bg-slate-200 dark:bg-slate-800/80 rounded-lg p-2">
                      <p className="font-medium text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Available</p>
                      <p className="font-medium text-xs text-[#131722] dark:text-white">{listing.quantity?.toLocaleString() || 0} kg</p>
                    </div>
                    <div className="text-center bg-slate-200 dark:bg-slate-800/80 rounded-lg p-2">
                      <p className="font-medium text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Quality</p>
                      <p className="font-medium text-xs text-[#131722] dark:text-white">{listing.grade || 'Grade A'}</p>
                    </div>
                  </div>

                  {/* Footer Meta */}
                  <div className="font-medium flex items-center justify-between text-[10px] text-slate-500 mb-4">
                     <span className="flex items-center gap-1"><Truck className="w-3 h-3"/> Pickup</span>
                     <span>POSTED {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d') : '2h ago'}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                     <button onClick={() => setSelectedId(listing.id)} className="font-medium w-full py-2.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 hover:border-indigo-500 text-[#131722] dark:text-white text-xs rounded-xl transition-all shadow-none">
                       View Details
                     </button>
                     {hasBid ? (
                        <button className="font-medium w-full py-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl cursor-default flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Bid Placed
                        </button>
                     ) : (
                        <button onClick={() => setSelectedId(listing.id)} className="font-medium w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl transition-all shadow-none">
                          Buy Now
                        </button>
                     )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>


        {/* ── SIDEBAR (RIGHT) ── */}
        <div className="xl:col-span-1 space-y-6">
{/* Market Insights */}
         <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><Lightbulb className="w-4 h-4 text-indigo-500"/> Market Insights</h3>
               <button className="font-medium text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1">30 Days <ChevronDown className="font-medium w-3 h-3"/></button>
            </div>
            
            <div className="space-y-6 flex-1">
               <div className="flex items-center justify-between border-b border-[#e0e3eb] dark:border-slate-800 pb-4">
                  <p className="font-medium text-xs text-slate-500">Highest Demand</p>
                  <div className="text-right">
                     <p className="font-medium text-sm text-[#131722] dark:text-white">PET Plastic</p>
                  </div>
                  <span className="font-medium text-xs text-emerald-500">↑ 24%</span>
               </div>
               <div className="flex items-center justify-between border-b border-[#e0e3eb] dark:border-slate-800 pb-4">
                  <p className="font-medium text-xs text-slate-500">Most Traded</p>
                  <div className="text-right">
                     <p className="font-medium text-sm text-[#131722] dark:text-white">Cardboard (OCC)</p>
                  </div>
                  <span className="font-medium text-xs text-[#131722] dark:text-white">482.6 t</span>
               </div>
               <div className="flex items-center justify-between">
                  <p className="font-medium text-xs text-slate-500">Avg. Price Change (30d)</p>
                  <div className="text-right">
                     <p className="font-medium text-sm text-rose-500">-4%</p>
                  </div>
                  <span className="font-medium text-xs text-rose-500">↓</span>
               </div>
            </div>
         </div>

         {/* Top Buyers */}
         <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg shadow-none p-6 flex flex-col">
            <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-5">
              <Users className="font-medium w-4 h-4 text-emerald-500" /> Active Buyers
            </h3>
            <div className="space-y-4">
              {[
                { name: 'EcoPlastics Inc.', type: 'Recycler', qty: '12.4t needed' },
                { name: 'GreenMetal Co.', type: 'Smelter', qty: '8.2t needed' },
                { name: 'PaperMills Ltd', type: 'Manufacturer', qty: '24.5t needed' },
                { name: 'GlassWorks', type: 'Manufacturer', qty: '5.0t needed' }
              ].map((buyer, i) => (
                <div key={i} className="flex items-center justify-between border-b border-[#e0e3eb] dark:border-slate-800 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-xs text-[#131722] dark:text-white">{buyer.name}</p>
                    <p className="font-medium text-[10px] text-slate-500">{buyer.type}</p>
                  </div>
                  <span className="font-medium text-[10px] text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400 px-2 py-1 rounded-md">{buyer.qty}</span>
                </div>
              ))}
            </div>
         </div>

        </div>


      </div>


      {/* ── LISTING MODAL (PRESERVED EXACTLY) ── */}
      <AnimatePresence>
        {selectedId && selectedListing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedId(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-[#e0e3eb] dark:border-slate-700/50"
            >
              {/* Left Side: Images */}
              <div className="md:w-1/2 bg-slate-100 dark:bg-slate-950 relative h-64 md:h-auto border-r border-[#e0e3eb] dark:border-slate-800">
                <div className="absolute inset-0">
                   {(selectedListing.photos?.length > 0 ? selectedListing.photos : [selectedListing.photoUrl || selectedListing.photo]).map((imgUrl: string, idx: number) => (
                      <div key={idx} className="w-full h-full">
                        {imgUrl ? (
                          <img src={getThumbnailUrl(imgUrl, { width: 800 })} className="w-full h-full object-cover" alt={`${selectedListing.material} - View ${idx + 1}`} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="font-medium w-24 h-24 text-slate-300 dark:text-slate-700" />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                {/* Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  {selectedListing.materialCategory && (
                    <span className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shadow-none backdrop-blur-md ${getCategoryStyle(selectedListing.materialCategory).bg} ${getCategoryStyle(selectedListing.materialCategory).text}`}>
                      {selectedListing.materialCategory}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setSelectedId(null)}
                  className="font-medium absolute top-6 right-6 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors z-10 md:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Right Side: Details & Bidding */}
              <div className="md:w-1/2 flex flex-col h-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-[#e0e3eb] dark:border-slate-800 p-6 flex items-center justify-between z-10">
                  <h2 className="text-xl font-bold text-[#131722] dark:text-white capitalize tracking-tight">
                    {selectedListing.materialSubcategory || selectedListing.material}
                  </h2>
                  <button
                    onClick={() => setSelectedId(null)}
                    className="font-medium w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 transition-colors hidden md:flex"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-[#e0e3eb] dark:border-slate-700/50">
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Scale className="w-3 h-3" /> Total Stock
                      </p>
                      <p className="font-medium text-sm text-[#131722] dark:text-white">
                        {selectedListing.quantity} KG
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-3 rounded-xl border border-[#e0e3eb] dark:border-slate-700/50">
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Posted By
                      </p>
                      <p className="font-medium text-sm text-slate-700 dark:text-slate-300 capitalize truncate">{selectedListing.isBulkDrive ? 'Community Bulk Drive' : (selectedListing.sellerName || 'Verified Seller')}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800/30 rounded-xl border border-[#e0e3eb] dark:border-slate-800">
                    <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                      <p className="font-medium text-xs text-slate-700 dark:text-slate-300">{selectedListing.location}</p>
                    </div>
                  </div>

                  {selectedListing.description && (
                     <div>
                       <p className="font-medium text-[9px] text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                         <Info className="w-3 h-3" /> Seller Notes
                       </p>
                       <p className="font-medium text-xs text-slate-600 dark:text-slate-400 italic p-3 bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/20">
"{selectedListing.description}"
                       </p>
                     </div>
                  )}

                  {selectedListing.isBulkDrive && selectedListing.groupMetadata && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
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
                </div>

                <div className="p-4 bg-white dark:bg-slate-800/80 border-t border-[#e0e3eb] dark:border-slate-700/50 shrink-0">
                  {/* Premium Bid Section */}
                  <div className={`${getHasOffer(selectedListing.id) ? 'bg-indigo-600' : 'bg-emerald-700'} p-3 rounded-lg border border-white/10 space-y-4 transition-colors duration-500 shadow-xl`}>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        {getHasOffer(selectedListing.id) ? (
                          <CheckCircle2 className="font-medium w-3 h-3 text-white" />
                        ) : (
                          <MessageSquare className="font-medium w-3 h-3 text-white" />
                        )}
                      </div>
                      <h3 className="text-[9px] font-semibold text-white uppercase tracking-[0.2em]">
                        {getHasOffer(selectedListing.id) ? 'Bid Active' : 'Ready to negotiate?'}
                      </h3>
                    </div>

                    {getHasOffer(selectedListing.id) ? (
                      <div className="text-center py-2 space-y-1">
                        <p className="font-medium text-[10px] text-white/90 leading-relaxed italic px-2">
"Your offer has been sent. You'll be notified if they accept."
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Detailed Seller Asking Info */}
                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/10">
                          <p className="font-medium text-[8px] text-white/70 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3" /> Seller's Asking Price
                          </p>
                          
                          <div className="flex items-end justify-between mb-1">
                             <div>
                               <p className="font-medium text-[9px] text-white/60 mb-0.5">Price Per KG</p>
                               <p className="font-medium text-sm text-white">KSh {selectedListing.pricePerKg}</p>
                             </div>
                             <div className="font-medium text-white/40 pb-1 text-xs">×</div>
                             <div className="text-right">
                               <p className="font-medium text-[9px] text-white/60 mb-0.5">Quantity</p>
                               <p className="font-medium text-sm text-white">{selectedListing.quantity} KG</p>
                             </div>
                          </div>
                          
                          <div className="h-px bg-white/10 my-1.5" />
                          
                          <div className="flex items-center justify-between">
                             <p className="font-medium text-[10px] text-white/80">Total Asking</p>
                             <p className="font-medium text-base text-green-400">KSh {(selectedListing.pricePerKg * selectedListing.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="font-medium text-[8px] text-white uppercase tracking-widest ml-1">My Bid (/KG)</label>
                            <input
                              type="number"
                              value={offerPrice}
                              onChange={(e) => setOfferPrice(e.target.value)}
                              className="font-medium w-full bg-black/20 border border-white/20 h-9 rounded-lg px-3 text-xs text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40"
                              placeholder="0.00"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-medium text-[8px] text-white uppercase tracking-widest ml-1">Weight (KG)</label>
                            <input
                              type="number"
                              max={selectedListing.quantity}
                              value={offerQty}
                              onChange={(e) => setOfferQty(Number(e.target.value))}
                              className="font-medium w-full bg-black/20 border border-white/20 h-9 rounded-lg px-3 text-xs text-white outline-none transition-all placeholder:text-white/40 focus:border-white/40"
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-[8px] text-white/80 uppercase tracking-widest mb-0.5">Total Bid Value</p>
                            <p className="font-medium text-sm text-white">KSh {(parseFloat(offerPrice || '0') * (offerQty || 0)).toLocaleString()}</p>
                          </div>

                          <button
                            onClick={handleMakeOffer}
                            disabled={isLoading || !offerPrice || !offerQty}
                            className="font-medium px-5 py-2.5 bg-white text-emerald-800 rounded-xl text-[10px] uppercase tracking-widest shadow-none active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isLoading ? 'Sending...' : 'Send Offer'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
