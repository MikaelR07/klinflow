import { useState, useEffect } from 'react';
import { 
  Activity, 
  ArrowLeft, 
  Package, 
  MapPin, 
  Scale, 
  Zap, 
  Building2, 
  Truck,
  Clock,
  Search,
  X,
  MessageSquareQuote,
  Loader2,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  useAuthStore, useAssetStore, useMarketplaceStore, 
  getBusinessLabel, supabase, getThumbnailUrl 
} from '@cleanflow/core';
import { toast } from 'sonner';

export default function SupplyTerminal() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const { listings, fetchListings, makeOffer } = useMarketplaceStore();
  const { liveFeed, fetchLiveFeed, claimAsset } = useAssetStore();
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');

  // Offer Modal State
  const [offerModal, setOfferModal] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQty, setOfferQty] = useState('');
  const [isOffering, setIsOffering] = useState(false);

  // Determine user context
  const isWeaver = profile?.business_type === 'weaver';
  
  useEffect(() => {
    fetchListings();
    if (isWeaver) {
      fetchLiveFeed();
    }
    
    const channelName = `terminal-sync-${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    // Always listen for listings if we want real-time merchant posts for weavers
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'marketplace_listings' }, () => fetchListings());
    
    if (isWeaver) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => fetchLiveFeed());
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isWeaver]);

  // SOURCE SELECTION: 
  // 1. Weavers see "Fresh Agent Pickups" + "Fresh Merchant Posts"
  // 2. Industrial see "Bulk Bales" (listings > 50kg)
  const terminalArrivals = isWeaver 
    ? [
        ...liveFeed.map(item => ({ 
          ...item, 
          sourceType: 'agent', 
          typeLabel: 'Warehouse Ready',
          displayTitle: item.material_type 
        })),
        ...listings
          .filter(item => item.sellerId !== userId && item.status === 'active') // Merchant Posts
          .map(item => ({
            ...item,
            sourceType: 'merchant',
            typeLabel: 'Seller',
            displayTitle: item.material,
            weight_kg: item.quantity,
            pricePerKg: item.pricePerKg,
            photo_url: item.photo,
            created_at: item.createdAt
          }))
      ]
    : listings
        .filter(item => item.quantity >= 50 && item.status === 'active') // Only "Bulk" for the terminal
        .map(item => ({ 
          ...item, 
          sourceType: 'weaver', 
          typeLabel: 'Bulk Bale',
          displayTitle: item.material,
          weight_kg: item.quantity,
          photo_url: item.photo,
          created_at: item.createdAt
        }));

  const filteredArrivals = terminalArrivals
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .filter(item => (item.displayTitle || '').toLowerCase().includes(search.toLowerCase()))
    .filter((item, index, self) => 
      index === self.findIndex((t) => (
        t.id === item.id || (t.booking_id && t.booking_id === item.booking_id)
      ))
    );

  const marketIndices = [
    { label: 'PET-A', price: '128.50', change: '+3.2%', up: true, trend: [10, 15, 12, 18, 14, 20, 18] },
    { label: 'HDPE', price: '94.20', change: '-1.5%', up: false, trend: [20, 18, 19, 15, 16, 12, 10] },
    { label: 'METAL', price: '215.00', change: '+2.8%', up: true, trend: [15, 12, 18, 16, 20, 22, 25] },
    { label: 'PP', price: '102.00', change: '+0.5%', up: true, trend: [12, 14, 13, 15, 14, 16, 17] },
  ];

  const getMaterialColor = (type) => {
    const t = type?.toLowerCase();
    if (t?.includes('plastic')) return 'from-blue-400 to-blue-600';
    if (t?.includes('metal')) return 'from-slate-400 to-slate-600';
    if (t?.includes('paper')) return 'from-amber-400 to-amber-600';
    return 'from-emerald-400 to-emerald-600';
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] dark:bg-slate-900 pb-24">

      <div className="w-full">
        {/* ── AI MARKET PULSE (ANIMATED STOCK TICKER) ── */}
        <style>
          {`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 20s linear infinite;
            }
            .animate-marquee:hover {
              animation-play-state: paused;
            }
          `}
        </style>
        <div className="pt-1.5 pb-1 bg-[#F4F4F4] dark:bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-slate-800">
          <div className="animate-marquee flex gap-1.5 px-3">
            {[...marketIndices, ...marketIndices].map((m, i) => (
              <div key={i} className="flex-shrink-0 w-26 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-1.5 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[8px] font-black text-slate-900 dark:text-white tracking-tighter uppercase">{m.label}</span>
                  <span className={`text-[7px] font-black ${m.up ? 'text-emerald-500' : 'text-rose-500'} italic`}>{m.change}</span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[10px] font-black text-slate-900 dark:text-white">KSh {m.price}</span>
                  <span className="text-[6px] text-slate-400 font-bold uppercase tracking-widest">/KG</span>
                </div>
                {/* Mini Sparkline */}
                <div className="h-2.5 flex items-end gap-0.5">
                  {m.trend.map((v, idx) => (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-t-[0.5px] ${m.up ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} 
                      style={{ height: `${(v / 25) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SEARCH & NAV TERMINAL (UNIFIED) ── */}
        <div className="px-3 pt-2 pb-3 bg-[#F4F4F4] dark:bg-slate-900 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl active:scale-95 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="relative flex-1 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text" 
                placeholder={`Filter ${isWeaver ? 'pickups' : 'bulk inventory'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[13px] font-medium outline-none focus:ring-1 focus:ring-emerald-500/20 text-slate-900 dark:text-white shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── VERTICAL LINE-ITEM TERMINAL (ALIBABA HIGH-DENSITY) ── */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {filteredArrivals.map((item) => (
            <div 
              key={item.id}
              onClick={() => navigate(`/arrivals/${item.id}`)}
              className="flex items-center gap-4 p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors relative"
            >
              {/* Thumbnail Anchor */}
              <div className="w-20 h-20 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                {item.photo_url || item.photo ? (
                  <img src={getThumbnailUrl(item.photo_url || item.photo, { width: 200 })} loading="lazy" className="w-full h-full object-cover" alt="Material" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                    {item.sourceType === 'weaver' ? <Building2 className="w-8 h-8 text-slate-300/50" /> : <Truck className="w-8 h-8 text-slate-300/50" />}
                  </div>
                )}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-[7px] font-black text-white rounded uppercase tracking-widest shadow-lg">
                  {item.sourceType === 'agent' ? 'Pickup' : 'Seller'}
                </div>
              </div>

              {/* Telemetry Strip */}
              <div className="flex-1 min-w-0 py-0.5 flex flex-col justify-between h-20">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate tracking-tight italic leading-none mb-1">
                      {item.displayTitle}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${getMaterialColor(item.displayTitle)} shadow-sm`} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{item.typeLabel}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1 mb-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                    <p className="text-sm font-black text-slate-900 dark:text-white italic tracking-tighter leading-none">
                      {item.weight_kg} <span className="text-[8px] uppercase not-italic opacity-40">KG</span>
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">Grade {item.grade || 'A'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800/50 pt-1.5 mt-auto">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <MapPin className="w-3 h-3 text-slate-300" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">
                      {item.location || 'Logistics Hub'}
                    </p>
                  </div>
                  <div className="text-right pl-2">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                      {item.pricePerKg || (item.estimated_value && item.weight_kg ? Math.round(item.estimated_value / item.weight_kg) : null) ? 
                        `KSh ${item.pricePerKg || Math.round(item.estimated_value / item.weight_kg)}` : 
                        'Quoting'}
                      <span className="text-[7px] text-slate-400 ml-0.5">/KG</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredArrivals.length === 0 && (
          <div className="py-20 text-center opacity-40">
            <Activity className="w-10 h-10 mx-auto mb-4" />
            <p className="text-sm font-semibold uppercase tracking-widest">No Arrivals Tracked</p>
          </div>
        )}
      </div>
    </div>
  );
}
