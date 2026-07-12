/**
 * AgentHome Stats & Quick Actions
 * Extracted from AgentHome.tsx
 */
import { useState, useEffect } from 'react';
import {
  Handshake, Truck, Star, Zap, Briefcase, Receipt, PlusSquare,
  MapPinPlus
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import type { AgentEarningsData } from './agentHome.types';

interface AgentHomeStatsProps {
  profile: any;
  earnings: AgentEarningsData;
  performanceChange: number;
  acceptedTradesCount: number;
  navigate: (path: string) => void;
}

export default function AgentHomeStats({
  profile, earnings, performanceChange, acceptedTradesCount, navigate
}: AgentHomeStatsProps) {
  const [newPickupsCount, setNewPickupsCount] = useState(0);
  const [newBidsCount, setNewBidsCount] = useState(0);
  const [newRfqsCount, setNewRfqsCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;

    const checkNewItems = async () => {
      const lastPickups = localStorage.getItem(`last_viewed_pickups_${profile.id}`) || '2000-01-01T00:00:00Z';
      const lastBids = localStorage.getItem(`last_viewed_bids_${profile.id}`) || '2000-01-01T00:00:00Z';
      const lastRfqs = localStorage.getItem(`last_viewed_rfqs_${profile.id}`) || '2000-01-01T00:00:00Z';

      const { count: pickups } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .in('status', ['confirmed', 'scheduled', 'accepted', 'in_progress', 'in-progress', 'picked_up'])
        .or('is_market_trade.is.null,is_market_trade.eq.false')
        .gt('updated_at', lastPickups);
      setNewPickupsCount(pickups || 0);

      const { count: bids } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', profile.id)
        .or('is_market_trade.eq.true,booking_type.eq.marketplace_pickup')
        .neq('status', 'completed')
        .neq('status', 'cancelled')
        .gt('created_at', lastBids);
      setNewBidsCount(bids || 0);

      const { count: rfqs } = await supabase
        .from('rfqs')
        .select('*', { count: 'exact', head: true })
        .eq('buyer_id', profile.id)
        .eq('status', 'fulfilled')
        .gt('updated_at', lastRfqs);
      setNewRfqsCount(rfqs || 0);
    };

    checkNewItems();
    const interval = setInterval(checkNewItems, 30000);
    return () => clearInterval(interval);
  }, [profile?.id]);

  const handlePickupsClick = () => {
    localStorage.setItem(`last_viewed_pickups_${profile?.id}`, new Date().toISOString());
    setNewPickupsCount(0);
    navigate(profile?.agentAccountType !== 'fleet_driver' ? '/expected-arrivals' : '/jobs');
  };

  const handleBidsClick = () => {
    localStorage.setItem(`last_viewed_bids_${profile?.id}`, new Date().toISOString());
    setNewBidsCount(0);
    navigate('/trades');
  };

  const handleRfqsClick = () => {
    localStorage.setItem(`last_viewed_rfqs_${profile?.id}`, new Date().toISOString());
    setNewRfqsCount(0);
    navigate('/rfqs');
  };

  return (
    <>
      {/* ── PERFORMANCE CARD ── */}
      <div className="relative !mt-1.5">
        <div className="relative bg-gradient-to-br from-[#064e3b] to-primary  rounded-xl p-3 shadow-none">
          {/* TOP SECTION */}
          <div className="flex items-start justify-between gap-3 mb-2">
            {/* LEFT */}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-[12px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Stock Value
              </p>

              <div className="flex items-baseline gap-1 mb-2 min-w-0">
                <span className="text-xl sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>
                <h2 className="text-xl sm:text-xl font-black text-white truncate">
                  {(earnings?.inventoryValue || 0).toLocaleString()}
                </h2>
              </div>

              <div className="bg-emerald-500/20 text-emerald-100 text-[10px] font-black px-2 py-1 rounded-md inline-flex max-w-full">
                {performanceChange >= 0 ? `↑ ${performanceChange.toFixed(0)}% from yesterday` : `↓ ${Math.abs(performanceChange).toFixed(0)}% from yesterday`}
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px self-stretch bg-white/20" />

            {/* RIGHT */}
            <div className="flex-1 min-w-0 flex flex-col items-end text-right pr-1">
              <p className="text-[12px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Trading Balance
              </p>

              <div className="flex items-baseline justify-end gap-1 mb-2 min-w-0 w-full">
                <span className="text-xl sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>
                <h2 className="text-xl sm:text-xl font-black text-white truncate">
                  {(profile?.walletBalance || 0).toLocaleString()}
                </h2>
              </div>

              <div className="w-full flex justify-end">
                <button
                  onClick={() => navigate(profile?.agentAccountType === 'fleet_driver' ? '/deposit' : '/wallet')}
                  className="bg-primary text-white px-8 py-2 min-h-[44px] rounded-xl font-bold text-xs tracking-wider flex items-center justify-center active:scale-95 transition-all  whitespace-nowrap"
                >
                  Wallet
                </button>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Handshake className="w-4 h-4 text-emerald-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {acceptedTradesCount || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Accepted Bids
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {earnings?.completedToday || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Pickups
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Star className="w-4 h-4 text-amber-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rating ? Number(profile.rating).toFixed(1) : "4.0"}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Rating
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Zap className="w-4 h-4 text-blue-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rewardPoints || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    <div className="bg-white dark:bg-slate-900 rounded-xl !mt-2 p-1 border border-slate-200/60 dark:border-slate-700 space-y-4">
      {/* ── QUICK ACTIONS ── */}
      <div className="px-2">
        <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-0.5  px-1">
          Quick Actions
        </p>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={handlePickupsClick}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group relative"
          >
            {newPickupsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm z-10">
                {newPickupsCount > 99 ? '99+' : newPickupsCount}
              </span>
            )}
            <div className="w-10 h-10 shrink-0 bg-blue-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPinPlus className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              {profile?.agentAccountType !== 'fleet_driver' ? 'Drop-Offs' : 'View Pickups'}
            </p>
          </button>

          <button
            onClick={handleBidsClick}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group relative"
          >
            {newBidsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm z-10">
                {newBidsCount > 99 ? '99+' : newBidsCount}
              </span>
            )}
            <div className="w-10 h-10 shrink-0 bg-emerald-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Handshake className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              Market Bids
            </p>
          </button>

          <button
            onClick={() => navigate('/rfq/create')}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
          >
            <div className="w-10 h-10 shrink-0 bg-amber-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusSquare className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              Create RFQ
            </p>
          </button>

          <button
            onClick={handleRfqsClick}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group relative"
          >
            {newRfqsCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center shadow-sm z-10">
                {newRfqsCount > 99 ? '99+' : newRfqsCount}
              </span>
            )}
            <div className="w-10 h-10 shrink-0 bg-indigo-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              View RFQs
            </p>
          </button>
        </div>
      </div>
      </div>
    </>
  );
}
