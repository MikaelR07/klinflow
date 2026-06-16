/**
 * GroupCollectionRFQs.tsx — Sellers-only page for browsing Group Collection contracts.
 * Fetches RFQs marked as is_group_collection=true from the rfqs table.
 */
import { useEffect, useState } from 'react';
import {
  ArrowLeft, Search, Users, Scale, MapPin, Clock,
  Recycle, Flame, Bookmark, User, Handshake,
  CircleCheck, ShieldCheck, ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
        .from('rfqs')
        .select(`
          *,
          buyer:profiles!rfqs_buyer_id_fkey(company_name, name, avatar_url),
          rfq_offers(count)
        `)
        .eq('is_group_collection', true)
        .order('created_at', { ascending: false });

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

        const mapped: GroupRFQ[] = data.map((r: any) => {
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

          const materialRecord = storeMaterials.find(m => m.id === r.material_grade);
          const materialName = materialRecord ? materialRecord.material_name : r.material_grade;

          const categoryRecord = storeCategories.find(c => c.id === r.category);
          const categoryName = categoryRecord ? categoryRecord.label : r.category;

          return {
            id: r.id,
            company: r.buyer?.company_name || r.buyer?.name || 'Unknown Buyer',
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
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate('/community-collective')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Group Contracts</h1>
                <p className="text-[10px] font-bold text-blue-600 capitalize tracking-widest flex items-center gap-1">
                  <Handshake className="w-3.5 h-3.5 text-blue-500" /> Pool & Fulfill Together
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts by material, buyer, area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-blue-300 dark:focus:border-blue-600 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 !mt-1 rounded-xl">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === tab
                  ? 'bg-blue-600 shadow-sm text-white font-black'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                <span className="truncate">{tab}</span>
                {(tabCounts as any)[tab] > 0 && (
                  <span className={`px-1 py-0.5 text-[8px] font-bold rounded ${activeTab === tab ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                    {(tabCounts as any)[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+8.5rem)] pb-5 max-w-lg mx-auto w-full">

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
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50 mx-4 mt-2">
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
                  <div key={rfq.id} className="bg-white dark:bg-slate-900 -mx-1.5 p-2 px-1.5 border-y border-slate-100 dark:border-slate-800 shadow-sm transition-colors group">
                    {/* Row 1: Tags & Price */}
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-wrap gap-1.5 items-center mt-1">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 rounded text-[9px] font-bold">
                          <Users className="w-3 h-3" />
                          Group Contract
                        </span>
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
                    <div className="flex items-center gap-2 ">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {rfq.avatar ? (
                          <img src={getThumbnailUrl(rfq.avatar, { width: 150 })} className="w-full h-full object-cover" alt={rfq.company} />
                        ) : (
                          <User className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <h4 className="text-[12px] font-bold text-slate-900 dark:text-white leading-none">{rfq.company}</h4>
                          {rfq.verified && <CircleCheck className="w-3.5 h-3.5 text-blue-500" fill="currentColor" stroke="white" strokeWidth={2} />}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                          {rfq.verified && (
                            <span className="flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Verified Buyer
                            </span>
                          )}
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
                    <div className="flex items-center gap-6 border-t border-slate-200 dark:border-slate-800 pt-2 pb-2">
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
                        <div className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center shrink-0">
                          <Clock className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-rose-500 leading-none mb-0.5">{rfq.deadline}</p>
                          <p className="text-[9px] font-semibold text-slate-400 leading-none">Deadline</p>
                        </div>
                      </div>
                    </div>

                    {/* Row 5: Footer Actions */}
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                        {rfq.postedAt ? `Posted ${rfq.postedAt}` : 'Posted recently'}
                        <span className="text-slate-300">·</span>
                        <span className="text-blue-500 font-bold">{rfq.offersSubmitted} seller{rfq.offersSubmitted !== 1 ? 's' : ''} joined</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => navigate(`/group-rfqs/${rfq.id}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors hover:bg-blue-700"
                        >
                          View & Pledge <ArrowUpRight className="w-3 h-3" />
                        </button>
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
