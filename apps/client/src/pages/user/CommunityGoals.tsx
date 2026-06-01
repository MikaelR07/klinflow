/**
 * CommunityGoals.tsx — Dedicated page for browsing and managing Community Goals
 * Extracted from CommunityCollective.tsx for scalability
 */
import { useEffect, useState } from 'react';
import {
  Users, ArrowLeft, ShieldCheck, Plus,
  Search, Target
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';

const TABS = ['Active', 'My Goals', 'Completed'];

export default function CommunityGoals() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const {
    goals, loadingGoals,
    fetchGoals, setupSubscriptions, cleanupSubscriptions
  } = useCollectiveStore();

  const [activeTab, setActiveTab] = useState('Active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchGoals(estateName);
    setupSubscriptions(estateName);
    return () => cleanupSubscriptions();
  }, [estateName]);

  const filteredGoals = goals
    .filter((g: any) => {
      if (activeTab === 'Active') return g.status === 'active';
      if (activeTab === 'My Goals') return g.creator_id === userId;
      if (activeTab === 'Completed') return g.status === 'completed';
      return true;
    })
    .filter((g: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.title?.toLowerCase().includes(q) ||
        g.estate?.toLowerCase().includes(q)
      );
    });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] px-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate('/community-collective')} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Community Goals</h1>
                <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-emerald-500" /> {estateName}
                </p>
              </div>
            </div>
            <Link
              to="/community-collective/goal/create"
              className="flex items-center gap-1.5 px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              Create Goal
            </Link>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search goals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-300 dark:focus:border-emerald-600 transition-colors"
            />
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl">
            {TABS.map(tab => {
              const tabCount = goals.filter((g: any) => {
                if (tab === 'Active') return g.status === 'active';
                if (tab === 'My Goals') return g.creator_id === userId;
                if (tab === 'Completed') return g.status === 'completed';
                return false;
              }).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${activeTab === tab
                    ? 'bg-emerald-600 shadow-sm text-white font-black'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                >
                  <span className="truncate">{tab}</span>
                  {tabCount > 0 && (
                    <span className={`px-1 py-0.2 text-[8px] font-bold rounded ${activeTab === tab ? 'bg-emerald-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
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
        {loadingGoals && goals.length === 0 && (
          <div className="space-y-3 px-1.5 mt-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-[140px] shadow-sm" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-[140px] shadow-sm" />
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse h-[140px] shadow-sm" />
          </div>
        )}

        {/* Empty */}
        {filteredGoals.length === 0 && !loadingGoals && (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 mx-4 mt-4">
            <Target className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No {activeTab.toLowerCase()} goals</p>
            <p className="text-xs font-medium text-slate-400">
              {activeTab === 'Active' ? 'Create a community goal for your estate!' :
               activeTab === 'My Goals' ? "You haven't created any goals yet." :
               'No completed goals to show.'}
            </p>
          </div>
        )}

        {/* Goal Cards */}
        <div className="flex flex-col gap-y-[1px] bg-slate-200 dark:bg-slate-800 border-y border-slate-200 dark:border-slate-800">
          {filteredGoals.map((goal: any) => {
            const percentage = Math.min(100, Math.round((goal.current_weight / goal.target_weight) * 100));
            return (
              <Link to={`/community-collective/goal/${goal.id}`} key={goal.id} className="block bg-white dark:bg-slate-900 p-4 active:scale-[0.98] transition-all">
              <div className="flex justify-between items-center mb-3">
                <div className="flex-1 pr-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4 text-[#0b3c2d] dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">{goal.title}</h4>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Community Goal</p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#00b634] rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-[#00b634] tracking-wide">{goal.current_weight.toLocaleString()} / {goal.target_weight.toLocaleString()} KG</p>
                    </div>
                  </div>
                </div>

                <div className="relative w-[64px] h-[64px] flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="5" fill="none" />
                    <circle cx="32" cy="32" r="28" className="stroke-[#00b634]" strokeWidth="5" fill="none" strokeDasharray="176" strokeDashoffset={176 - (176 * percentage) / 100} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-xs font-bold text-slate-800 dark:text-white">{percentage}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400">{goal.participants_count || 0} members contributing</p>
                <div className="px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest">
                  View Goal
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
