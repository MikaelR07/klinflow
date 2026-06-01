/**
 * SwarmsList.tsx — Dedicated page for browsing and managing Logistics Swarms
 * Extracted from CommunityCollective.tsx for scalability
 */
import { useEffect, useState } from 'react';
import {
  Users, ArrowLeft, Truck, Plus,
  Search, Filter
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
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-300 dark:focus:border-indigo-600 transition-colors"
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
        <div className="flex flex-col gap-y-[1px] bg-slate-200 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-800">
          {filteredSwarms.map((swarm: any) => (
            <div key={swarm.id} className="bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50/80 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Truck className="w-4 h-4" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-0.5 tracking-tight">{swarm.material}</h4>
                    <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">{swarm.estate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${swarm.status === 'active' ? 'text-green-500' : 'text-emerald-500'}`}>{swarm.status}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 tracking-wide">{swarm.current_weight} / {swarm.target_weight} KG</p>
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{Math.min(100, Math.round((swarm.current_weight / swarm.target_weight) * 100))}%</p>
                </div>
                <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (swarm.current_weight / swarm.target_weight) * 100)}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{swarm.participants_count || 0}</p>
                </div>
                <Link to={`/community-collective/swarm/${swarm.id}`} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-[9px] uppercase tracking-widest font-bold active:scale-95 transition-all shadow-sm">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
