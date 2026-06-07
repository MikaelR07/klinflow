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

const TABS = ['Active', 'My Swarms', 'Completed'];

export default function SwarmsList() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const { swarms, goals, loadingSwarms, fetchSwarms, fetchGoals, setupSubscriptions, cleanupSubscriptions } = useCollectiveStore();
  const fetchMaterialPrices = useServiceStore(s => s.fetchMaterialPrices);
  const materialPrices = useServiceStore(s => s.materialPrices);

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (estateName) {
      fetchSwarms(estateName);
      fetchGoals(estateName);
      fetchMaterialPrices();
      setupSubscriptions(estateName);
      return () => cleanupSubscriptions();
    }
  }, [estateName]);

  const filteredSwarms = swarms
    .filter((s: any) => {
      if (activeTab === 'Active') return s.status === 'active';
      if (activeTab === 'My Swarms') return s.creator_id === userId;
      if (activeTab === 'Completed') return s.status === 'completed';
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
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90  border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)]  px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate('/community-collective')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Logistics Swarms</h1>
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
                if (tab === 'Active') return s.status === 'active';
                if (tab === 'My Swarms') return s.creator_id === userId;
                if (tab === 'Completed') return s.status === 'completed';
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
                  p-3.5
                  mb-3
                  transition-all duration-200
                  hover:shadow-md
                  active:scale-[0.98]
                "
              >
                {/* Header & Progress Ring */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[11px] font-medium text-slate-500 uppercase dark:text-slate-400">
                        <span className="font-semibold uppercase text-slate-900 text-sm dark:text-white">{materialPrices.find(m => m.material_name === swarm.material)?.category || swarm.material}</span>
                      </p>
                      {swarm.status === 'active' && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                          Posted
                        </span>
                      )}
                    </div>

                    <h3 className="text-xs font-bold text-[#5c50e6] dark:text-indigo-400 mb-2 leading-tight tracking-tight">
                      Material: {swarm.material}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-500 dark:text-slate-400">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-xs font-medium">{swarm.estate}</p>
                    </div>

                    {swarm.closes_at && (
                      <div className="flex items-center gap-1.5 text-[#e65100] dark:text-amber-500 font-bold mt-0.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-xs">Deadline: {new Date(swarm.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Ring */}
                  <div className="shrink-0 ml-1 mt-0.5">
                    <div className="relative w-[88px] h-[88px]">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
                        <circle
                          cx="42"
                          cy="42"
                          r="38"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-slate-200 dark:text-slate-700"
                        />
                        <circle
                          cx="42"
                          cy="42"
                          r="38"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-green-500"
                          strokeDasharray={`${2 * Math.PI * 38}`}
                          strokeDashoffset={`${2 * Math.PI * 38 * (1 - progress / 100)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white leading-none mb-0.5">
                          {progress}%
                        </span>
                        <span className="text-[9px] text-[#868e96] dark:text-slate-400 font-medium leading-none">
                          Complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="my-2 border-t border-slate-200 dark:border-slate-700 w-full" />

                {/* Metrics & Action */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    {/* Reward Pool */}
                    <div>
                      <p className="text-[12px] text-[#868e96] dark:text-slate-400 mb-0.5">Reward</p>
                      <p className="text-[11px] font-bold text-[#2e7d32] dark:text-green-500">ksh {rewardPool.toLocaleString()}</p>
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
