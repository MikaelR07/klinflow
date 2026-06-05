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
  Clock
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';

const TABS = ['Active', 'My Swarms', 'Completed'];

export default function SwarmsList() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const {
    swarms, loadingSwarms,
    fetchSwarms, setupSubscriptions, cleanupSubscriptions
  } = useCollectiveStore();

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSwarms(estateName);
    setupSubscriptions(estateName);
    return () => cleanupSubscriptions();
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

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+9rem)] pb-5 max-w-lg mx-auto w-full">
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
        <div className="flex flex-col gap-3 px-1.5">
          {filteredSwarms.map((swarm: any) => {
            const progress = Math.min(100, Math.round((swarm.current_weight / swarm.target_weight) * 100));
            // Placeholder reward pool: KSh 5 per target kg
            const rewardPool = swarm.target_weight * 5;

            return (
              <div
                key={swarm.id}
                className="
      bg-white dark:bg-slate-900/60
      rounded-xl
      border border-slate-200/80 dark:border-slate-800
      shadow-sm
      p-3
      transition-all duration-200
      hover:border-green-200
      dark:hover:border-green-900
    "
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base  text-slate-900 dark:text-white truncate">
                        Material: {swarm.material}
                      </h4>

                      {swarm.status === 'active' && (
                        <span
                          className="
                px-2 py-1
                rounded-full
                text-[10px]
                font-semibold
                bg-green-50
                text-green-700
                dark:bg-green-500/10
                dark:text-green-400
              "
                        >
                          Active
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Location: {swarm.estate}
                    </p>
                    {swarm.closes_at && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        Deadline: {new Date(swarm.closes_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  <Link
                    to={`/community-collective/swarm/${swarm.id}`}
                    className="
          text-xs
          font-semibold
          text-green-600
          dark:text-green-400
          whitespace-nowrap
        "
                  >
                    View Details
                  </Link>
                </div>

                {/* Metrics + Progress Ring */}
                <div className="flex items-center justify-between gap-4 ">
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Reward Pool */}
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Reward Pool
                        </p>

                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          ksh {rewardPool.toLocaleString()}
                        </p>
                      </div>

                      {/* Participants */}
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Participants
                        </p>

                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {swarm.participants_count || 0}
                        </p>
                      </div>

                      {/* Target */}
                      <div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                          Target
                        </p>

                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {swarm.target_weight.toLocaleString()}kg
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Ring */}
                  <div className="shrink-0">
                    <div className="relative w-[84px] h-[84px]">
                      <svg
                        className="w-full h-full -rotate-90"
                        viewBox="0 0 84 84"
                      >
                        <circle
                          cx="42"
                          cy="42"
                          r="36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="text-slate-200 dark:text-slate-700"
                        />

                        <circle
                          cx="42"
                          cy="42"
                          r="36"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="6"
                          className="text-green-500"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)
                            }`}
                          strokeLinecap="round"
                        />
                      </svg>

                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {progress}%
                        </span>

                        <span className="text-[9px] text-slate-500 dark:text-slate-400">
                          Complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
