/**
 * SwarmsList.tsx — Dedicated page for browsing and managing Logistics Swarms
 * Extracted from CommunityCollective.tsx for scalability
 */
import { useEffect, useState } from 'react';
import {
  Users, ArrowLeft, Truck, Plus,
  Search, Filter,
  Gift,
  Leaf,
  LeafyGreen,
  Clock,
  MapPin,
  Handshake,
  DollarSign,
  Coins,
  Scale
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useCollectiveStore, useServiceStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';

const TABS = ['Active', 'My Swarms', 'Completed'];

export default function SwarmsList() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const { swarms, loadingSwarms, estateStats, fetchSwarms, fetchEstateStats, setupSubscriptions, cleanupSubscriptions } = useCollectiveStore();
  const fetchMaterialPrices = useServiceStore(s => s.fetchMaterialPrices);
  const materialPrices = useServiceStore(s => s.materialPrices);

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [postedSwarmIds, setPostedSwarmIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (estateName) {
      fetchSwarms(estateName, profile?.role);
      fetchMaterialPrices();
      fetchEstateStats(estateName);
      setupSubscriptions(estateName, profile?.role);

      // Check which swarms have been posted to the marketplace
      supabase
        .from('marketplace_listings')
        .select('swarm_id')
        .not('swarm_id', 'is', null)
        .then(({ data }) => {
          if (data) {
            setPostedSwarmIds(new Set(data.map((d: any) => d.swarm_id).filter(Boolean)));
          }
        });

      return () => cleanupSubscriptions();
    }
  }, [estateName]);

  const filteredSwarms = swarms
    .filter((s: any) => {
      const isExpired = s.closes_at && new Date(s.closes_at).getTime() < new Date().getTime();
      
      if (activeTab === 'Active') return s.status === 'active' && !isExpired;
      if (activeTab === 'My Swarms') return s.creator_id === userId;
      if (activeTab === 'Completed') return s.status === 'completed' || (s.status === 'active' && isExpired);
      return true;
    })
    .filter((s: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.material?.toLowerCase().includes(q) ||
        s.estate?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90  border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)]  px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Logistics Swarms</h1>
                <p className="text-[10px] font-bold text-indigo-600 capitalize tracking-widest flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" /> {estateName}
                </p>
              </div>
            </div>
            <Link
              to="/community-collective/swarm/create"
              className="flex items-center gap-1 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Add Swarm
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search swarms by material..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl">
            {TABS.map(tab => {
              const tabCount = swarms.filter((s: any) => {
                const isExpired = s.closes_at && new Date(s.closes_at).getTime() < new Date().getTime();
                if (tab === 'Active') return s.status === 'active' && !isExpired;
                if (tab === 'My Swarms') return s.creator_id === userId;
                if (tab === 'Completed') return s.status === 'completed' || (s.status === 'active' && isExpired);
                return false;
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === tab
                    ? 'bg-indigo-600 shadow-sm text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <span className="truncate">{tab}</span>
                  {tabCount > 0 && (
                    <span className={`px-1 py-0.2 text-[8px] font-bold rounded ${activeTab === tab ? 'bg-indigo-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                      }`}>
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+8.5rem)] pb-5 max-w-lg mx-auto w-full">

        {/* ── HERO SECTION ── */}
        {activeTab === 'Active' && (
          <div className="flex flex-col px-1.5 mb-4">
            <div className="relative w-full rounded-3xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800/60">
              <img 
                src="/vectors/klin-swarms-real.webp" 
                alt="Swarms Background" 
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 to-slate-900/20 dark:from-slate-950/95 dark:to-slate-950/40" />
              <div className="relative z-10 p-4 flex flex-col gap-4">
                <div className="min-h-[160px] flex flex-col justify-center">
                  <h2 className="text-xl font-black text-white leading-tight mb-1.5 tracking-tight">
                    Find Your Swarm.<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Maximize Earnings.</span>
                  </h2>
                  <p className="text-[11px] text-slate-200 font-medium leading-relaxed max-w-[260px]">
                    Team up with others in your area, pool your collections, and fulfill large volume requests together.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-20 -mt-2 mx-4 bg-white dark:bg-primary rounded-xl p-3 shadow-lg flex flex-col gap-2 border border-emerald-500/30">
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(() => {
                  const totalPooledKg = swarms.reduce((acc: number, s: any) => acc + (s.current_weight || 0), 0);
                  const totalPotentialPayout = swarms.reduce((acc: number, s: any) => {
                    const marketRate = materialPrices.find(m => m.material_name === s.material)?.price_per_kg || 0;
                    return acc + ((s.current_weight || 0) * marketRate);
                  }, 0);
                  
                  const formatNumber = (val: number) => {
                    if (!val) return '0';
                    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                    if (val >= 100000) return (val / 1000).toFixed(1) + 'k';
                    return Math.floor(val).toLocaleString();
                  };

                  return (
                    <>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Scale className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex flex-col text-left">
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">{formatNumber(totalPooledKg)}</p>
                          <p className="text-[9px] text-slate-600 dark:text-white font-bold uppercase tracking-wider leading-none">Pooled Kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-x border-slate-200 dark:border-black/20 px-2 justify-center">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Coins className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex flex-col text-left">
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">
                            {formatNumber(totalPotentialPayout)}
                          </p>
                          <p className="text-[9px] text-slate-600 dark:text-white font-bold uppercase tracking-wider leading-none">Est Value</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pl-2 justify-center">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col text-left">
                          <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-0.5">{swarms.filter(s => s.status === 'active' && new Date(s.closes_at) > new Date()).length}</p>
                          <p className="text-[9px] text-slate-600 dark:text-white font-bold uppercase tracking-wider leading-none">Active</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loadingSwarms && swarms.length === 0 && (
          <div className="space-y-3 px-1.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse h-[110px]" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse h-[110px]" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 animate-pulse h-[110px]" />
          </div>
        )}

        {/* Empty */}
        {filteredSwarms.length === 0 && !loadingSwarms && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mx-4 mt-4">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No {activeTab.toLowerCase()} swarms</p>
            <p className="text-xs font-medium text-slate-400">
              {activeTab === 'Active' ? 'Start a neighbourhood swarm to consolidate pickups!' :
                activeTab === 'My Swarms' ? "You haven't created any swarms yet." :
                  'No completed swarms to show.'}
            </p>
          </div>
        )}

        {/* Swarm Cards */}
        <div className="flex flex-col gap-1.5">
          {filteredSwarms.map((swarm: any) => {
            const progress = Math.min(100, Math.round((swarm.current_weight / swarm.target_weight) * 100));
            const isMixed = swarm.material?.toLowerCase().includes('mixed');
            const marketRate = materialPrices.find(m => m.material_name === swarm.material)?.price_per_kg || 0;
            const rewardPool = swarm.target_weight * marketRate;

            return (
              <div
                key={swarm.id}
                onClick={() => navigate(`/community-collective/swarm/${swarm.id}`)}
                className="bg-white dark:bg-slate-900 p-3 px-4 border-y border-slate-100 dark:border-slate-800 shadow-sm transition-colors group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <div className="flex justify-between items-start mb-1">
                  {/* Left: Material Image and Title */}
                  <div className="flex gap-3 items-start">
                    <div className="relative w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                      <img 
                        src={(swarm.images && swarm.images[0]) || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200'} 
                        alt={swarm.material || 'Material'} 
                        className="w-full h-full object-cover"
                      />
                      {swarm.images && swarm.images.length > 1 && (
                        <div className="absolute bottom-1 right-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                          +{swarm.images.length - 1}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col h-20 py-0.5">
                      <h4 className="text-[16px] font-black text-slate-900 dark:text-white tracking-tight leading-tight">{swarm.material}</h4>
                      <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">
                        {materialPrices.find(m => m.material_name === swarm.material)?.category || swarm.material}
                      </p>
                      <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {swarm.participants_count || 0} members
                      </p>
                      <div className="flex items-center gap-1.5 mt-auto">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{swarm.estate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badges and Price */}
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {swarm.status === 'active' && postedSwarmIds.has(swarm.id) && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 leading-none">
                          Posted
                        </span>
                      )}
                      {swarm.status === 'active' && !postedSwarmIds.has(swarm.id) && new Date(swarm.closes_at).getTime() > new Date().getTime() && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 leading-none">
                          Active
                        </span>
                      )}
                      {swarm.status === 'active' && new Date(swarm.closes_at).getTime() < new Date().getTime() && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 leading-none">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-right mt-1">
                      <p className="text-base font-black text-emerald-500 leading-none">
                        {isMixed ? 'Varies' : `KSh ${rewardPool.toLocaleString()}`}
                      </p>
                      <span className="text-[10px] text-slate-400 font-semibold">Reward</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Key Details */}
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2 pb-2 mt-1.5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{swarm.target_weight.toLocaleString()}kg</p>
                        <p className="text-[9px] font-semibold text-slate-400 leading-none">Target</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{swarm.current_weight.toLocaleString()}kg</p>
                        <p className="text-[9px] font-semibold text-slate-400 leading-none">Collected</p>
                      </div>
                    </div>
                  </div>
                  
                  {swarm.closes_at && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0 text-right">
                        <p className={`text-[11px] font-semibold leading-none mb-0.5 ${new Date(swarm.closes_at).getTime() < new Date().getTime() ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {new Date(swarm.closes_at).toLocaleDateString('en-GB')}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500 leading-none">
                          Deadline
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
