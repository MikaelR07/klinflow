/**
 * Marketplace Home — Industrial Trading Terminal for CleanFlow Weavers
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Grid, 
  ShoppingBag, 
  PlusCircle, 
  ArrowRight, 
  Brain, 
  Sparkles, 
  Mic, 
  History, 
  Loader2,
  Package,
  Activity,
  ArrowUpRight,
  ChevronRight,
  Database,
  Truck,
  Layers,
  Tag,
  Building2,
  MapPin,
  Zap,
  Clock,
  Scale,
  BadgeCheck,
  LayoutGrid,
  FileText,
  ListOrdered
} from 'lucide-react';
import { 
  useAuthStore, useAssetStore, useMarketplaceStore, 
  usePriceStore, getBusinessLabel, getThumbnailUrl 
} from '@cleanflow/core';
import { toast } from 'sonner';
import { AssetBadge, TopUpModal } from '@cleanflow/ui';
import TopTabs from '../../components/TopTabs.jsx';

export default function MarketplaceHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const { categories, listings, fetchListings, isLoading } = useMarketplaceStore();
  const { liveFeed, fetchLiveFeed, claimAsset } = useAssetStore();
  const { role, profile, topUpBalance } = useAuthStore();
  const { getPriceForMaterial, fetchPrices } = usePriceStore();
  const navigate = useNavigate();
  const [isToppingUp, setIsToppingUp] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const isWeaver = profile?.business_type === 'weaver';
  const [showCategories, setShowCategories] = useState(false);
  const mySpecializations = profile?.specializations || [];

  useEffect(() => { 
    fetchListings(); 
    fetchPrices();
    if (isWeaver) fetchLiveFeed();
  }, [isWeaver, fetchListings, fetchPrices, fetchLiveFeed]);

  // ── PHASE 1: AI-POWERED DISCOVERY ──────────────────────────────
  
  // Match Score Calculator — scores each listing based on relevance to this user
  const computeMatchScore = (listing) => {
    let score = 0;
    const material = (listing.material || '').toLowerCase();
    const specs = mySpecializations.map(s => s.toLowerCase());
    
    // Specialization Match (+40) — does this material match what the user deals in?
    if (specs.some(s => material.includes(s) || s.includes(material.split(' ')[0]))) {
      score += 40;
    }
    
    // Location Proximity (+25) — same area as the user?
    const userEstate = (profile?.location?.estate || '').toLowerCase();
    const listingLocation = (listing.location || '').toLowerCase();
    if (userEstate && listingLocation && listingLocation.includes(userEstate)) {
      score += 25;
    } else if (userEstate && listingLocation) {
      score += 10; // partial — at least they're both in Nairobi
    }
    
    // Freshness (+20) — newer listings score higher
    const hoursAgo = (Date.now() - new Date(listing.createdAt).getTime()) / 3600000;
    if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 15;
    else if (hoursAgo < 72) score += 10;
    else score += 5;
    
    // Price Competitiveness (+15) — lower price per KG = higher score
    const avgPrice = listings.length > 0 
      ? listings.reduce((sum, l) => sum + (l.pricePerKg || 0), 0) / listings.length 
      : 0;
    if (avgPrice > 0 && listing.pricePerKg <= avgPrice * 0.8) score += 15;
    else if (avgPrice > 0 && listing.pricePerKg <= avgPrice) score += 10;
    else score += 5;
    
    return Math.min(100, score);
  };
  
  // Smart Feed — sorted by match score, filtered by search query
  const smartFeed = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    // Score and sort all listings
    const scored = listings.map(l => ({
      ...l,
      matchScore: computeMatchScore(l)
    })).sort((a, b) => b.matchScore - a.matchScore);
    
    // Apply search filter if query exists
    if (!query) return scored;
    
    return scored.filter(l => 
      (l.material || '').toLowerCase().includes(query) ||
      (l.location || '').toLowerCase().includes(query) ||
      (l.sellerName || '').toLowerCase().includes(query) ||
      (l.grade || '').toLowerCase().includes(query)
    );
  }, [listings, searchQuery, mySpecializations, profile]);
  
  const hasPersonalization = mySpecializations.length > 0;

  const handleConfirmReplenish = async (amount) => {
    setIsToppingUp(true);
    try {
      const success = await topUpBalance(amount);
      if (success) {
        toast.success("Budget Replenished! 💸", {
          description: `KSh ${Number(amount).toLocaleString()} added to your weaver terminal.`
        });
      }
    } catch (err) {
      toast.error("Top Up Failed");
    } finally {
      setIsToppingUp(false);
    }
  };

  return (
    <div className="animate-fade-in -mt-5 -mx-2 pb-12">
      {/* ── MISSION CONTROL HEADER (UNIFIED) ── */}
      <div className="bg-[#F4F4F4] dark:bg-slate-900 pt-2 pb-4 px-0 relative overflow-hidden">
        {/* Landing Page Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1] pointer-events-none" 
          style={{ 
            backgroundImage: `linear-gradient(#10b981 1.5px, transparent 1.5px), linear-gradient(90deg, #10b981 1.5px, transparent 1.5px)`,
            backgroundSize: '30px 30px',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)'
          }}
        />
        
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 blur-[100px] rounded-full" />

        <div className="relative space-y-3">
          <TopTabs active="/" />

          {/* Search Terminal */}
          <div className="relative group px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/40 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={hasPersonalization ? `Search ${mySpecializations[0] || 'materials'}...` : 'Search marketplace...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-emerald-500/30 transition-all text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors">Clear</button>
            )}
          </div>

          {/* Quick Nav Cards */}
          <div className="flex gap-2 px-2">
            <button 
              onClick={() => setShowCategories(!showCategories)}
              className={`flex-1 flex items-center gap-2.5 px-3 py-3 rounded-xl border active:scale-95 transition-all ${
                showCategories 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            </button>
            <button 
              onClick={() => navigate('/procurement')}
              className="flex-1 flex items-center gap-2.5 px-3 py-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl active:scale-95 transition-all text-slate-700 dark:text-white"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Bulk Sourcing</span>
            </button>
            <button 
              onClick={() => navigate('/listings')}
              className="flex-1 flex items-center gap-2.5 px-3 py-3 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl active:scale-95 transition-all text-slate-700 dark:text-white"
            >
              <ListOrdered className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">Listings</span>
            </button>
          </div>

          {/* Material Radar Grid (Collapsible) */}
          {showCategories && (
          <div className="px-2 animate-fade-in">
            <div className="grid grid-cols-6 gap-1.5">
              {/* Plastic: Tall Primary */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-2 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-4 flex flex-col justify-between group active:scale-95 transition-all min-h-[140px]"
              >
                <div className="flex justify-between items-start">
                  <span className="text-xl">🥤</span>
                  <ArrowUpRight className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Plastic</p>
                  <p className="text-xs text-slate-900 dark:text-white">PET & HDPE</p>
                </div>
              </button>

              {/* Metal: Medium */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-4 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-4 flex items-center gap-3 group active:scale-95 transition-all"
              >
                <span className="text-lg">🥫</span>
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Metal</p>
                  <p className="text-xs text-slate-900 dark:text-white">Industrial Aluminium</p>
                </div>
              </button>

              {/* Paper */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-2 flex flex-col justify-center items-center text-center group active:scale-95 transition-all"
              >
                <span className="text-base">📄</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase mt-1">Paper</p>
              </button>

              {/* Glass */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-2 flex flex-col justify-center items-center text-center group active:scale-95 transition-all"
              >
                <span className="text-base">🍾</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase mt-1">Glass</p>
              </button>

              {/* Organic */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-2 flex flex-col justify-center items-center text-center group active:scale-95 transition-all"
              >
                <span className="text-base">🍌</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase mt-1">Organic</p>
              </button>

              {/* E-Waste */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-2 flex flex-col justify-center items-center text-center group active:scale-95 transition-all"
              >
                <span className="text-base">💻</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase mt-1">E-Waste</p>
              </button>

              {/* Others */}
              <button 
                onClick={() => navigate('/buy')}
                className="col-span-2 row-span-1 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[0.45rem] p-2 flex flex-col justify-center items-center text-center group active:scale-95 transition-all"
              >
                <PlusCircle className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase mt-1">Others</p>
              </button>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* ── LOWER CONTENT SECTION (REFINED) ── */}
      <div className="px-2 pb-8 space-y-8">
        {/* ── LIVE SUPPLY TERMINAL SECTION ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Live material arrivals</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Active Feed</span>
            </div>
          </div>

          {/* UNIFIED ARRIVALS CAROUSEL (LATEST 6) */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {(isWeaver 
              ? [
                  ...liveFeed.map(item => ({ ...item, sourceType: 'agent', typeLabel: 'Pickup', displayTitle: item.material_type })),
                  ...listings.filter(item => item.status === 'active').map(item => ({ ...item, sourceType: 'merchant', typeLabel: 'Seller', displayTitle: item.material, weight_kg: item.quantity, photo_url: item.photo, created_at: item.createdAt }))
                ]
              : listings
            )
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .filter((item, index, self) => index === self.findIndex((t) => (
                t.id === item.id || (t.booking_id && t.booking_id === item.booking_id)
              )))
              .slice(0, 6)
              .map((item) => (
              <div 
                key={item.id}
                onClick={() => navigate(`/arrivals/${item.id}`)}
                className="flex-shrink-0 w-[calc(33.33%-6px)] snap-start rounded-xl min-h-[140px] flex flex-col justify-between active:scale-95 transition-all relative overflow-hidden"
              >
                {/* Photo Background Backdrop */}
                {item.photo_url && (
                  <div className="absolute inset-0">
                    <img src={getThumbnailUrl(item.photo_url, { width: 200 })} loading="lazy" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  </div>
                )}
                {!item.photo_url && (
                  <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800" />
                )}
                
                <div className="relative z-10 flex flex-col h-full justify-between p-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shadow-sm text-white ${item.sourceType === 'merchant' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                      {item.typeLabel || 'Live'}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs uppercase tracking-tighter line-clamp-2 leading-tight drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)]">{item.displayTitle || item.material}</h4>
                    <div className="flex items-center gap-1 text-white">
                      <Scale className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-xs font-black drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)]">{item.weight_kg}kg</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/arrivals')}
            className="w-full py-3.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-sm shadow-emerald-500/20 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            Enter Terminal <ArrowRight className="w-4 h-4" />
          </button>
        </div>


        {/* ── FAIRE-STYLE DISCOVERY SHELVES ── */}
        <section className="space-y-8">
          <div className="px-1">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Curated Collections
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Industrial Bulk', desc: '5+ Ton Bales', color: 'from-slate-700 to-slate-900', icon: Database },
                { title: 'Eco Partners', desc: 'Low Carbon Footprint', color: 'from-emerald-500 to-teal-600', icon: Building2 },
              ].map((shelf, i) => (
                <div key={i} className={`h-28 rounded-2xl bg-gradient-to-br ${shelf.color} p-4 relative overflow-hidden group shadow-lg active:scale-95 transition-all`}>
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <shelf.icon className="w-14 h-14 text-white" />
                  </div>
                  <div className="relative z-10 flex flex-col justify-end h-full">
                    <h3 className="text-white font-bold text-sm">{shelf.title}</h3>
                    <p className="text-white/70 text-xs font-medium">{shelf.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SMART FEED (AI-POWERED DISCOVERY) ── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {searchQuery ? (
                  <><Search className="w-3.5 h-3.5" /> Results for "{searchQuery}"</>
                ) : hasPersonalization ? (
                  <><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Recommended For You</>
                ) : (
                  <><Building2 className="w-3.5 h-3.5" /> B2B Market Postings</>
                )}
              </h2>
              {hasPersonalization && !searchQuery && (
                <p className="text-xs text-slate-400 mt-1">Based on your specializations: {mySpecializations.join(', ')}</p>
              )}
            </div>
            <button 
              onClick={() => navigate('/buy')} 
              className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest rounded-full border border-indigo-100 dark:border-indigo-500/20 active:scale-95 transition-all"
            >
              View All
            </button>
          </div>

          {smartFeed.length === 0 && searchQuery && (
            <div className="py-12 text-center">
              <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No results for "{searchQuery}"</p>
              <p className="text-xs text-slate-400 mt-1">Try a different material, location, or seller name</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {smartFeed.slice(0, 6).map((listing) => (
              <div 
                key={listing.id}
                onClick={() => navigate(`/listings/${listing.id}`)}
                className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden active:scale-[0.97] transition-all group"
              >
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  {listing.photo ? (
                    <img src={getThumbnailUrl(listing.photo, { width: 400 })} loading="lazy" alt={listing.material} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-slate-200" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-md text-xs font-bold text-white uppercase tracking-wider">
                    {listing.quantity} KG
                  </div>
                  {/* Match Score Badge */}
                  {listing.matchScore >= 50 && (
                    <div className={`absolute top-2 right-2 px-2 py-0.5 backdrop-blur-sm rounded-md text-xs font-black text-white uppercase tracking-wider ${
                      listing.matchScore >= 80 ? 'bg-emerald-500/80' : 'bg-amber-500/80'
                    }`}>
                      {listing.matchScore}% Match
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight truncate">{listing.material}</h3>
                  <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {listing.location}</span>
                    <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {listing.quantity} KG</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-emerald-600 italic">KSh {listing.pricePerKg}<span className="text-xs text-slate-400 font-medium not-italic ml-0.5">/KG</span></p>
                    <p className="text-xs text-slate-400 font-bold uppercase">MOQ {listing.moq || Math.max(1, Math.round(listing.quantity * 0.1))}kg</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <TopUpModal 
        isOpen={showReplenishModal} 
        onClose={() => setShowReplenishModal(false)}
        onConfirm={handleConfirmReplenish}
        title="Replenish Budget"
        balance={profile?.balance || 0}
      />

    </div>
  );
}
