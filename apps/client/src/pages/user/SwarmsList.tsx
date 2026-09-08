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
  MapPin
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

  const { swarms, loadingSwarms, fetchSwarms, setupSubscriptions, cleanupSubscriptions } = useCollectiveStore();
  const fetchMaterialPrices = useServiceStore(s => s.fetchMaterialPrices);
  const materialPrices = useServiceStore(s => s.materialPrices);

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [postedSwarmIds, setPostedSwarmIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (estateName) {
      fetchSwarms(estateName, profile?.role);
      fetchMaterialPrices();
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
              <button onClick={() => navigate('/community-collective')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
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
              className="flex items-center gap-1.5 px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Create Group
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
              <Link
                to={`/community-collective/swarm/${swarm.id}`}
                key={swarm.id}
                className="
                  block
                  bg-white dark:bg-slate-900
                  rounded-[1.25rem]
                  border border-slate-100 dark:border-slate-800 shadow-sm
                  p-2.5
                  transition-all duration-200
                  hover:shadow-md
                  active:scale-[0.98]
                "
              >
                {/* Header & Image */}
                <div className="flex items-start gap-3">
                  {/* Image on the left */}
                  <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative">
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

                  {/* Details on the right */}
                  <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <p className="text-[11px] font-medium text-slate-500 uppercase dark:text-slate-400 leading-none">
                        <span className="font-semibold uppercase text-slate-900 text-[13px] dark:text-white">{materialPrices.find(m => m.material_name === swarm.material)?.category || swarm.material}</span>
                      </p>
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

                    <h3 className="text-xs font-semibold text-[#5c50e6] dark:text-indigo-400 mb-2 leading-tight tracking-tight">
                      Material-Type: {swarm.material}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-[11px] font-medium truncate">{swarm.estate}</p>
                    </div>

                    {swarm.closes_at && (
                      <div className={`flex items-center gap-1.5 font-bold mt-1 ${new Date(swarm.closes_at).getTime() < new Date().getTime() ? 'text-rose-500' : 'text-[#e65100] dark:text-amber-500'}`}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[10px] uppercase tracking-wide">
                          {new Date(swarm.closes_at).getTime() < new Date().getTime() ? 'Expired: ' : 'Deadline: '}
                          {new Date(swarm.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="my-2 border-t border-slate-200 dark:border-slate-700 w-full" />

                {/* Metrics & Action */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    {/* Reward Pool */}
                    <div>
                      <p className="text-[12px] text-[#868e96] dark:text-slate-400 mb-0.5">Reward</p>
                      <p className="text-[11px] font-bold text-[#2e7d32] dark:text-green-500">{isMixed ? 'Varies' : `ksh ${rewardPool.toLocaleString()}`}</p>
                    </div>

                    <div className="w-px h-6 bg-[#f1f3f5] dark:bg-slate-800" />

                    {/* Participants */}
                    <div>
                      <p className="text-[12px] text-[#868e96] dark:text-slate-400 mb-0.5">Members</p>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white">{swarm.participants_count || 0}</p>
                    </div>

                    <div className="w-px h-6 bg-[#f1f3f5] dark:bg-slate-800" />

                    {/* Target */}
                    <div>
                      <p className="text-[12px] text-[#868e96] dark:text-slate-400 mb-0.5">Target</p>
                      <p className="text-[11px] font-bold text-slate-900 dark:text-white">{swarm.target_weight.toLocaleString()}kg</p>
                    </div>
                  </div>

                  <div className="px-3 py-1.5 bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-[10px] font-bold rounded-lg transition-colors shrink-0 shadow-sm">
                    View Details
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
