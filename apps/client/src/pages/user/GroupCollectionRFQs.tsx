/**
 * GroupCollectionRFQs.tsx — Sellers-only page for browsing Group Collection contracts.
 * Fetches RFQs marked as is_group_collection=true from the rfqs table.
 */
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Search, Users, Scale, MapPin, Clock,
  Recycle, Flame, Bookmark, User, Handshake,
  CircleCheck, ShieldCheck, ArrowUpRight, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ContractsTabBar from '../../components/user/ContractsTabBar';

interface GroupRFQ {
  id: string;
  company: string;
  material: string;
  quantity: string;
  requestedWeight: number;
  price: number;
  deadline: string;
  verified: boolean;
  region: string;
  category: string;
  delivery: string;
  offersSubmitted: number;
  totalPledgedWeight: number;
  avatar?: string;
  postedAt?: string;
  images?: string[];
  status: string;
  hasMyPledge: boolean;
}

const TABS = ['Open', 'My Pledges', 'Fulfilled'];

export default function GroupCollectionRFQs() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);

  const [rfqs, setRfqs] = useState<GroupRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Open');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchGroupRFQs = async () => {
    try {
      let storeMaterials = useServiceStore.getState().materialPrices;
      if (!storeMaterials || storeMaterials.length === 0) {
        await useServiceStore.getState().fetchMaterialPrices();
        storeMaterials = useServiceStore.getState().materialPrices;
      }

      let storeCategories = useServiceStore.getState().categories;
      if (!storeCategories || storeCategories.length === 0) {
        await useServiceStore.getState().fetchCategories();
        storeCategories = useServiceStore.getState().categories;
      }

      const { data, error } = await supabase
        .rpc('get_visible_rfqs', { p_seller_id: profile?.id })
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(company_name, name, avatar_url),
          company:companies!rfqs_company_id_fkey(name),
          rfq_offers(count)
        `)
        .eq('is_group_collection', true);

      if (error) throw error;

      if (data) {
        // Fetch total pledged weights for all group RFQs
        const rfqIds = data.map((r: any) => r.id);
        const pledgedByRFQ: Record<string, number> = {};
        const myPledgedRfqs = new Set<string>();

        if (rfqIds.length > 0) {
          const { data: offersData } = await supabase
            .from('rfq_offers')
            .select('rfq_id, offered_weight, seller_id')
            .in('rfq_id', rfqIds);

          offersData?.forEach((o: any) => {
            pledgedByRFQ[o.rfq_id] = (pledgedByRFQ[o.rfq_id] || 0) + (o.offered_weight || 0);
            if (o.seller_id === profile.id) {
              myPledgedRfqs.add(o.rfq_id);
            }
          });
        }

        const mapped: GroupRFQ[] = data
          .filter((r: any) => {
            if (!r.deadline) return true;
            const isExpired = new Date(r.deadline).getTime() < new Date().getTime();
            if (isExpired) {
              const hasPledged = myPledgedRfqs.has(r.id);
              const isFulfilled = r.status === 'fulfilled' || r.status === 'completed';
              return hasPledged || isFulfilled;
            }
            return true;
          })
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
            company: r.company?.name || r.buyer?.company_name || r.buyer?.name || 'Unknown Buyer',
            material: materialName,
            quantity: `${r.requested_weight}kg`,
            requestedWeight: r.requested_weight || 0,
            price: r.target_price || 0,
            deadline: deadlineText,
            verified: true,
            region: r.pickup_area,
            category: categoryName,
            delivery: deliveryText,
            offersSubmitted: r.rfq_offers?.[0]?.count || 0,
            totalPledgedWeight: pledgedByRFQ[r.id] || 0,
            avatar: r.buyer?.avatar_url || null,
            images: r.images || [],
            postedAt: r.created_at ? (() => {
              const diffMs = new Date().getTime() - new Date(r.created_at).getTime();
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
              const diffDays = Math.floor(diffHours / 24);
              if (diffDays > 0) return `${diffDays} days ago`;
              if (diffHours > 0) return `${diffHours} hrs ago`;
              return 'Just now';
            })() : undefined,
            status: r.status,
            hasMyPledge: myPledgedRfqs.has(r.id),
          };
        });
        setRfqs(mapped);
      }
    } catch (err: any) {
      console.error('Failed to fetch group RFQs:', err);
      toast.error('Failed to load group contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupRFQs();

    const channel = supabase.channel('public:group-rfqs-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, () => {
        fetchGroupRFQs();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfq_offers' }, () => {
        fetchGroupRFQs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredRFQs = rfqs.filter(rfq => {
    // Tab filter
    if (activeTab === 'Open') {
      if (rfq.status !== 'open' || rfq.deadline === 'Expired') return false;
    }
    if (activeTab === 'My Pledges') {
      if (!rfq.hasMyPledge) return false;
      if (rfq.status === 'completed' || rfq.status === 'fulfilled') return false;
    }
    if (activeTab === 'Fulfilled') {
      if (rfq.status !== 'fulfilled' && rfq.status !== 'completed' && rfq.totalPledgedWeight < rfq.requestedWeight) return false;
    }

    if (selectedCategory !== 'All' && !(rfq.category && rfq.category.toLowerCase() === selectedCategory.toLowerCase())) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rfq.material.toLowerCase().includes(q) ||
        rfq.company.toLowerCase().includes(q) ||
        rfq.region.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabCounts = {
    Open: rfqs.filter(r => r.status === 'open' && r.deadline !== 'Expired').length,
    'My Pledges': rfqs.filter(r => r.hasMyPledge && r.status !== 'completed' && r.status !== 'fulfilled').length,
    Fulfilled: rfqs.filter(r => r.status === 'fulfilled' || r.status === 'completed' || r.totalPledgedWeight >= r.requestedWeight).length,
  };

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors ">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Group Contracts</h1>
              <p className="text-[10px] font-bold text-blue-600 capitalize tracking-widest flex items-center gap-1 mt-0.5">
                 A greener way to connect
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 pb-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts by material, buyer, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-300 dark:focus:border-blue-600 transition-colors shadow-sm"
            />
          </div>
        </div>
        <ContractsTabBar />
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+9rem)] pb-5 max-w-lg mx-auto w-full">

        {/* ── HERO BANNERS CAROUSEL ── */}
        <div className="flex gap-3 px-1.5 mb-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1">
          {/* Banner 1: My Proposals */}
          <div className="relative w-[92%] shrink-0 h-[160px] rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800/60 snap-start">
            <img src="/vectors/community-banner-real.webp" alt="More Impact. More Rewards." className="absolute inset-0 w-full h-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-transparent dark:from-slate-950/95 dark:via-emerald-950/80"></div>
            <div className="relative z-10 p-4 h-full flex flex-col justify-center">
              <h3 className="text-[22px] font-black text-emerald-400 leading-tight">More Impact.</h3>
              <h3 className="text-[22px] font-black text-amber-500 leading-tight">More Rewards.</h3>
              <p className="text-[11px] font-semibold text-slate-200/90 leading-tight max-w-[240px] mt-1.5">
                Access contracts from trusted buyers and earn premium rates by Joining the Community Network.
              </p>
            </div>
          </div>

          {/* Banner 2: Group Contracts */}
          <div className="relative w-[92%] shrink-0 h-[160px] rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800/60 snap-start">
            <img src="/vectors/klin-contract-real.webp" alt="Group Contracts" className="absolute inset-0 w-full h-full object-cover object-right" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/60 to-transparent" />
            <div className="relative z-10 p-4 h-full flex flex-col justify-center">
              <h3 className="text-[22px] font-black text-amber-400 leading-tight">Pool Resources.</h3>
              <h3 className="text-[22px] font-black text-white leading-tight">Fulfill Together.</h3>
              <p className="text-[11px] font-semibold text-blue-100 leading-tight max-w-[240px] mt-1.5">
                Join forces with other sellers to fulfill large volume orders from major buyers and earn premium rates collaboratively.
              </p>
            </div>
          </div>
          
          {/* Spacer for right edge */}
          <div className="w-1 shrink-0" />
        </div>

        {/* ── STATE TABS ── */}
        <div className="flex justify-center px-4 pb-3 mt-2">
          <div className="flex w-full bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl shadow-inner border border-slate-200/60 dark:border-slate-700/50 gap-0.5">
            {TABS.map(tab => {
              const count = (tabCounts as any)[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 rounded-xl text-[9.5px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all ${
                    activeTab === tab
                    ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <span>{tab}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] leading-none ${
                      activeTab === tab
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CATEGORY FILTERS ── */}
        <div className="flex px-2 pb-4 gap-1.5 overflow-x-auto no-scrollbar">
          {(['All', 'Plastic', 'Metal', 'Paper', 'Organic', 'Glass', 'E-waste'] as const).map((category) => {
            const count = category === 'All' 
              ? rfqs.filter(r => {
                  if (activeTab === 'Open') return r.status === 'open' && r.deadline !== 'Expired';
                  if (activeTab === 'My Pledges') return r.hasMyPledge && r.status !== 'completed' && r.status !== 'fulfilled';
                  if (activeTab === 'Fulfilled') return r.status === 'fulfilled' || r.status === 'completed' || r.totalPledgedWeight >= r.requestedWeight;
                  return true;
                }).length 
              : rfqs.filter(r => {
                  if (!(r.category && r.category.toLowerCase() === category.toLowerCase())) return false;
                  if (activeTab === 'Open') return r.status === 'open' && r.deadline !== 'Expired';
                  if (activeTab === 'My Pledges') return r.hasMyPledge && r.status !== 'completed' && r.status !== 'fulfilled';
                  if (activeTab === 'Fulfilled') return r.status === 'fulfilled' || r.status === 'completed' || r.totalPledgedWeight >= r.requestedWeight;
                  return true;
                }).length;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`py-1.5 px-2.5 rounded-xl text-[9px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all border shadow-sm shrink-0 ${
                  selectedCategory === category
                  ? 'bg-emerald-600 text-white border-transparent'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span>{category}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] leading-none ${
                    selectedCategory === category
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-1 px-1.5 mt-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 p-4 border-y border-slate-100 dark:border-slate-800 animate-pulse h-[160px]" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRFQs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 mx-1.5 mt-2">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Group Contracts</h3>
            <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] mx-auto font-medium">
              {activeTab === 'Open' ? 'No open group contracts available right now. Check back soon.' :
               activeTab === 'My Pledges' ? "You haven't pledged to any contracts yet." :
               'No fulfilled contracts to show.'}
            </p>
          </div>
        )}

        {/* RFQ Cards */}
        {!loading && filteredRFQs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1 pb-5 px-1.5"
          >
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Group Contracts</h3>
                <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400 ml-0.5 bg-blue-50 dark:bg-blue-900/30 px-1 py-0.5 rounded">Live</span>
              </div>
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{filteredRFQs.length} Available</span>
            </div>

            <div className="space-y-1">
              {filteredRFQs.map((rfq) => {
                const fulfillmentPercentage = rfq.requestedWeight > 0
                  ? Math.min(100, Math.round((rfq.totalPledgedWeight / rfq.requestedWeight) * 100))
                  : 0;

                return (
                  <div 
                    key={rfq.id} 
                    onClick={() => navigate(`/group-rfqs/${rfq.id}`)}
                    className={`bg-white dark:bg-slate-900 -mx-1.5 p-4 px-4 border-y border-slate-100 dark:border-slate-800 shadow-sm transition-colors group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80 ${rfq.hasMyPledge ? 'opacity-80 grayscale-[0.2]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      {/* Left: Material Image and Title */}
                      <div className="flex gap-4 items-start">
                        <div className="relative w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                          <img 
                            src={`/material-categories/${(rfq.category || '').toLowerCase()}.webp`}
                            onError={(e) => { e.currentTarget.src = "/material-categories/recyclables.webp" }}
                            alt={rfq.material}
                            className="w-full h-full object-cover"
                          />
                          {rfq.hasMyPledge && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                              <div className="flex flex-col items-center">
                                <CircleCheck className="w-6 h-6 text-emerald-400 mb-0.5" strokeWidth={2.5} />
                                <span className="text-[8px] font-black text-white uppercase tracking-wider text-center leading-tight">Pledge<br/>Sent</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col h-24 py-0.5">
                          <h4 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">{rfq.material}</h4>
                          <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">{rfq.category}</p>
                          <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                            <Users className="w-3 h-3" /> {rfq.offersSubmitted} seller{rfq.offersSubmitted !== 1 ? 's' : ''} joined
                          </p>
                          <div className="flex items-center gap-1.5 mt-auto">
                            <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                              {rfq.avatar ? (
                                <img src={getThumbnailUrl(rfq.avatar, { width: 50 })} className="w-full h-full object-cover" alt={rfq.company} />
                              ) : (
                                <User className="w-3 h-3 text-slate-400" />
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{rfq.company.split(' ')[0]}</span>
                            {rfq.verified && <CircleCheck className="w-3 h-3 text-blue-500 shrink-0" fill="currentColor" stroke="white" strokeWidth={2} />}
                          </div>
                        </div>
                      </div>

                      {/* Right: Badges and Price */}
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded text-[9px] font-bold">
                            <Users className="w-3 h-3" />
                            Group Contract
                          </span>
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 rounded text-[9px] font-bold">
                            <Clock className="w-3 h-3" />
                            {rfq.deadline}
                          </span>
                          {rfq.price > 50 && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded text-[9px] font-bold">
                              <Flame className="w-3 h-3" />
                              High Value
                            </span>
                          )}
                        </div>
                        <div className="text-right mt-1">
                          <p className="text-base font-black text-emerald-500 leading-none">
                            KSh {rfq.price} <span className="text-[10px] text-slate-400 font-semibold">/kg</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Row 3: Fulfillment Progress */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fulfillment Progress</span>
                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400">{fulfillmentPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${fulfillmentPercentage}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] font-semibold text-slate-400">{rfq.totalPledgedWeight}kg pledged</span>
                        <span className="text-[10px] font-bold text-slate-500">{rfq.requestedWeight}kg needed</span>
                      </div>
                    </div>

                    {/* Row 4: Key Details */}
                    <div className="flex items-center gap-6 border-t border-slate-200 dark:border-slate-800 pt-2 mt-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                          <Scale className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.quantity}</p>
                          <p className="text-[9px] font-semibold text-slate-400 leading-none">Quantity</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.region}</p>
                          <p className="text-[9px] font-semibold text-slate-400 leading-none">Location</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-none mb-0.5">{rfq.postedAt ? rfq.postedAt : '3 hrs ago'}</p>
                          <p className="text-[9px] font-semibold text-slate-400 leading-none">Posted</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
