/**
 * MyBids Page — Tracks agent negotiations and offers on Marketplace listings.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, ChevronRight, Package, Receipt, MapPin, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';

type BidStatus = 'pending' | 'accepted' | 'rejected';

interface Bid {
  id: string;
  listingId: string;
  agentId: string;
  sellerId: string;
  status: BidStatus;
  offerPrice: number;
  offerQuantity: number;
  createdAt: string;
  listing: {
    material: string;
    materialCategory?: string;
    location: string;
    pricePerKg: number;
    quantity: number;
    photoUrl?: string;
  };
  seller: {
    name: string;
    companyName?: string;
  };
}

export default function MyBids() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    if (!profile?.id) return;

    const fetchBids = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('marketplace_offers')
          .select(`
            *,
            listing:marketplace_listings(
              material, material_category, location, price_per_kg, quantity, photo_url
            ),
            seller:profiles!marketplace_offers_seller_id_fkey(
              name, company_name
            )
          `)
          .eq('buyer_id', profile.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const formattedBids = data.map((offer: any) => ({
            id: offer.id,
            listingId: offer.listing_id,
            agentId: offer.buyer_id,
            sellerId: offer.seller_id,
            status: offer.status as BidStatus,
            offerPrice: offer.offered_price,
            offerQuantity: offer.quantity,
            createdAt: offer.created_at,
            listing: {
              material: offer.listing?.material || 'Unknown Material',
              materialCategory: offer.listing?.material_category,
              location: offer.listing?.location || 'Unknown Location',
              pricePerKg: offer.listing?.price_per_kg || 0,
              quantity: offer.listing?.quantity || 0,
              photoUrl: offer.listing?.photo_url
            },
            seller: {
              name: offer.seller?.name || 'Seller',
              companyName: offer.seller?.company_name
            }
          }));
          setBids(formattedBids);
        }
      } catch (err) {
        console.error('Failed to fetch bids:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBids();
  }, [profile?.id]);

  const filteredBids = bids.filter(bid => bid.status === activeTab);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="h-[calc(env(safe-area-inset-top,1rem)+7rem)]" />
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>

          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">My Bids</h1>
            <p className="text-[10px] font-bold text-indigo-500 capitalize tracking-[0.2em] mt-1">Negotiation History</p>
          </div>
        </div>

        {/* Tabs - Pill style */}
        <div className="flex bg-slate-200 dark:bg-slate-800/80 p-1.5 rounded-2xl">
          {[
            { id: 'pending', label: 'Pending', icon: Clock, count: bids.filter(b => b.status === 'pending').length },
            { id: 'accepted', label: 'Won', icon: CheckCircle2, count: bids.filter(b => b.status === 'accepted').length },
            { id: 'rejected', label: 'Rejected', icon: XCircle, count: bids.filter(b => b.status === 'rejected').length }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative flex-1 py-1.5 text-[11px] font-bold capitalize tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 shadow-sm text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar max-w-lg mx-auto w-full px-1.5 pb-12">
        {/* Top Hero Stats Card */}
        <div className="bg-indigo-900 rounded-2xl p-5 mb-5 border border-indigo-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Receipt className="w-24 h-24 text-white" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-300 capitalize tracking-[0.2em] mb-1">Success Rate</p>
              <div className="flex items-baseline gap-1.5">
                <h2 className="text-3xl font-black text-white">
                  {bids.length > 0 
                    ? Math.round((bids.filter(b => b.status === 'accepted').length / bids.length) * 100) 
                    : 0}%
                </h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-indigo-300 capitalize tracking-[0.2em] mb-1">Total Bids</p>
              <h2 className="text-3xl font-black text-white">{bids.length}</h2>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12 px-6 bg-slate-100 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-4">
              <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-[15px] font-black text-slate-700 dark:text-slate-300 mb-1">No {activeTab} bids</h3>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed">
              {activeTab === 'pending' 
                ? "You haven't placed any active bids yet. Head to the marketplace to find materials."
                : `You don't have any ${activeTab} bids.`}
            </p>
            {activeTab === 'pending' && (
              <button 
                onClick={() => navigate('/sourcing')}
                className="mt-6 px-6 py-2.5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-500/30 active:scale-95 transition-transform"
              >
                Go to Marketplace
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBids.map((bid) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={bid.id}
                className="bg-white dark:bg-slate-900 rounded-[1.25rem] p-3 border border-slate-100 dark:border-slate-800/60 shadow-sm relative overflow-hidden"
              >
                <div className="flex gap-3 relative z-10">
                  <div className="w-[84px] h-[84px] shrink-0 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden relative border border-slate-200/50 dark:border-slate-700/50">
                    {bid.listing.photoUrl ? (
                      <OptimizedImage src={getThumbnailUrl(bid.listing.photoUrl)} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}
                    {activeTab === 'pending' && (
                      <div className="absolute top-1.5 right-1.5 bg-amber-500 rounded-full w-2 h-2 border border-white dark:border-slate-800 shadow-sm animate-pulse" />
                    )}
                    {activeTab === 'accepted' && (
                      <div className="absolute top-1.5 right-1.5 bg-emerald-500 rounded-full w-2 h-2 border border-white dark:border-slate-800 shadow-sm" />
                    )}
                    {activeTab === 'rejected' && (
                      <div className="absolute top-1.5 right-1.5 bg-rose-500 rounded-full w-2 h-2 border border-white dark:border-slate-800 shadow-sm" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 py-0.5 flex">
                    {/* Middle section: Material Info */}
                    <div className="flex-1 min-w-0 flex flex-col">
                      <h3 className="text-[15px] font-black text-slate-900 dark:text-white leading-tight capitalize truncate mb-1.5">
                        {bid.listing.material}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 mb-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-500 truncate">{bid.seller.companyName || bid.seller.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-semibold text-slate-500 truncate">{bid.listing.location}</span>
                      </div>

                      <div className="flex items-baseline gap-1 mt-auto">
                        <span className="text-[10px] font-bold text-slate-500">KSh</span>
                        <span className="text-[15px] font-black text-indigo-600 dark:text-indigo-400 leading-none">{bid.offerPrice}</span>
                        <span className="text-[10px] font-bold text-slate-500">/kg</span>
                      </div>
                    </div>

                    {/* Right section: Weight & Date */}
                    <div className="shrink-0 flex flex-col items-end justify-between pl-3 border-l border-slate-100 dark:border-slate-800/60 ml-2">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Weight</p>
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-[14px] font-black text-slate-700 dark:text-slate-300 leading-none">{bid.offerQuantity}</span>
                          <span className="text-[10px] font-bold text-slate-500">kg</span>
                        </div>
                      </div>
                      
                      <div className="text-right mt-auto">
                        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Bid Placed</span>
                        <span className="block text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {new Date(bid.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="block text-[9px] font-bold text-slate-500">
                          {new Date(bid.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {activeTab === 'accepted' && (
                  <button 
                    onClick={() => navigate('/jobs', { state: { tab: 'active', filter: 'Market trades' } })}
                    className="mt-3 w-full py-2.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    Go to Pickup <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
