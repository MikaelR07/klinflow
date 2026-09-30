/**
 * AgentHome Stats & Quick Actions
 * Extracted from AgentHome.tsx
 */
import { useState, useEffect } from 'react';
import {
  Handshake, Truck, Star, Zap, Briefcase, Receipt, PlusSquare,
  MapPinPlus, Package, BarChart3Icon, ChevronRight, Route,
  Navigation, Radar, Moon, MapPin, CheckCircle, XCircle
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import type { AgentEarningsData } from './agentHome.types';
import { useNextPickup } from './useNextPickup';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { toast } from 'sonner';

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
  const { nextPickup, isLoading } = useNextPickup();
  const acceptJob = useAgentStore(s => s.acceptJob);
  const rejectJob = useAgentStore(s => s.rejectJob);
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
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,1.5rem)+5.5rem)] pt-6 px-2 transition-transform duration-300 h-[60vh] flex flex-col">
      
      {/* ── DRAG HANDLE ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 mt-2">
        {/* ── HERO CARD (Balances + Performance Stats) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-emerald-800 to-emerald-600 p-5 border border-emerald-500/30 shrink-0">
            
            {/* ── BALANCES SECTION ── */}
            <div className="relative z-10 flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-100/80 mb-0.5 tracking-widest uppercase">Collected Value</p>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-sm font-bold text-emerald-300 shrink-0">KSh</span>
                  <h2 className="text-2xl font-black text-white truncate">{(earnings?.inventoryValue || 0).toLocaleString()}</h2>
                </div>
                <div className="text-[10px] font-bold mt-0.5 text-emerald-100 flex items-center gap-1">
                  {performanceChange >= 0 ? (
                    <span className="text-emerald-100 bg-emerald-500/40 px-1.5 py-0.5 rounded">↑ {performanceChange.toFixed(0)}%</span>
                  ) : (
                    <span className="text-rose-100 bg-rose-500/40 px-1.5 py-0.5 rounded">↓ {Math.abs(performanceChange).toFixed(0)}%</span>
                  )}
                  today
                </div>
              </div>
              <div className="w-px h-12 self-center bg-emerald-500/30" />
              <div className="flex-1 min-w-0 flex flex-col items-end text-right">
                <p className="text-[10px] font-bold text-emerald-100/80 mb-0.5 tracking-widest uppercase">Trading Balance</p>
                <div className="flex items-baseline justify-end gap-1 min-w-0 w-full">
                  <span className="text-sm font-bold text-emerald-300 shrink-0">KSh</span>
                  <h2 className="text-2xl font-black text-white truncate">{(profile?.walletBalance || 0).toLocaleString()}</h2>
                </div>
                <p className="text-[10px] font-bold text-emerald-100 mt-0.5">Available Cash</p>
              </div>
            </div>

            {/* ── PICKUPS INDICATOR ── */}
            <div className="relative z-10 flex items-center gap-2.5 border-t border-emerald-500/30 pt-2">
              <Truck className="w-5 h-5  text-emerald-200 shrink-0" />
              <span className="text-[12px] font-bold text-emerald-100">
                <span className="text-white font-black">{profile?.stats?.totalPickups || 0}</span> pickups completed
              </span>
            </div>
        </div>

        {/* ── QUICK ACTIONS CARD ── */}
        <div className="bg-slate-200 dark:bg-slate-800/50 rounded-2xl p-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-2 shrink-0">
          {/* ── QUICK ACTIONS SECTION ── */}
          <div className="px-1 pb-1">
            <h3 className="text-[13px] font-black text-slate-600 dark:text-white capitalize tracking-widest px-1 mb-2 mt-1">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-1">
              <button onClick={handlePickupsClick} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-indigo-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  {newPickupsCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm z-10">
                      <span className="text-[10px] font-semibold text-white">{newPickupsCount > 99 ? '99+' : newPickupsCount}</span>
                    </div>
                  )}
                  <MapPinPlus className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">{profile?.agentAccountType !== 'fleet_driver' ? 'Drop-Offs' : 'Pickups'}</span>
              </button>

              <button onClick={() => navigate('/reviews')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-emerald-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Rating</span>
              </button>

              <button onClick={() => navigate('/warehouse')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-purple-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Warehouse</span>
              </button>

              <button onClick={() => navigate(profile?.agentAccountType === 'fleet_driver' ? '/deposit' : '/wallet')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-amber-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5-1.52.5.5 0 0 1-.1-.63l2.25-3.82a.5.5 0 0 0-.1-.63z"/><path d="M5 21h14a2 2 0 0 0 2-2v-3.5"/><path d="M5 21a2 2 0 0 1-2-2V7"/><path d="M11 7v13"/></svg>
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Wallet</span>
              </button>
            </div>


          </div>
        </div>

        {/* ── DRIVER STATUS / NEXT PICKUP ── */}
        {isLoading ? (
          <div className="bg-slate-100 dark:bg-slate-800/30 rounded-2xl p-4 flex flex-col gap-3 min-h-[120px] shrink-0 border border-slate-200/50 dark:border-slate-800/50 animate-pulse relative overflow-hidden">
             <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700/50 shrink-0" />
                <div className="pt-1 space-y-2 w-32">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700/50 rounded-md" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700/50 rounded-md w-2/3" />
                </div>
              </div>
             </div>
             <div className="h-8 bg-slate-200 dark:bg-slate-700/50 rounded-xl mt-auto w-full" />
          </div>
        ) : nextPickup && nextPickup.status === 'pending' ? (
          <div className="bg-indigo-600 dark:bg-indigo-900/60 rounded-2xl p-4 flex flex-col gap-3 min-h-[140px] shrink-0 border border-indigo-500/30 shadow-xl shadow-indigo-600/10 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className="flex gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="pt-0.5 min-w-0">
                  <h3 className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">New Request</h3>
                  <h4 className="text-[13px] font-black text-white leading-tight truncate">{nextPickup.material}</h4>
                  <p className="text-[11px] text-indigo-100/80 font-medium leading-tight mt-0.5 truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {nextPickup.pickupAddress}
                  </p>
                </div>
              </div>
              <div className="bg-black/20 rounded-lg px-2.5 py-1.5 flex flex-col items-end border border-white/10 shrink-0 ml-2">
                <span className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest leading-none mb-1">Est</span>
                <span className="text-xs font-black text-white leading-none">{nextPickup.estimatedWeight} kg</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-auto relative z-10">
              <button 
                onClick={async () => {
                  if (nextPickup.source === 'bookings' || nextPickup.source === 'market_trades') {
                     const success = await acceptJob(nextPickup.id);
                     if (success) toast.success("Pickup Accepted!");
                     else toast.error("Could not accept pickup");
                  }
                }}
                className="flex-[2] bg-white text-indigo-600 hover:bg-indigo-50 font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </button>
              <button 
                onClick={() => {
                  if (nextPickup.source === 'bookings' || nextPickup.source === 'market_trades') {
                     rejectJob(nextPickup.id);
                  }
                }}
                className="flex-[1] bg-black/10 hover:bg-black/20 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : nextPickup ? (
          <div 
            onClick={() => {
              if (nextPickup.source === 'fulfillment_orders') navigate(`/pickups/${nextPickup.id}`);
              else navigate(`/jobs/navigate/${nextPickup.id}`);
            }}
            className={`rounded-2xl p-4 flex flex-col gap-3 min-h-[140px] shrink-0 border shadow-xl cursor-pointer active:scale-95 transition-transform relative overflow-hidden ${
              useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50' 
                : nextPickup.status === 'in_progress'
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50'
                : 'bg-slate-900 dark:bg-slate-800 border-slate-800 dark:border-slate-700'
            }`}
          >
            {/* Subtle highlight effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div className="flex gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                   useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                   nextPickup.status === 'in_progress' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                   'bg-emerald-500/20 text-emerald-400'
                }`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="pt-0.5 min-w-0">
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-1 flex items-center gap-1.5 ${
                     useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'text-amber-600 dark:text-amber-500' :
                     nextPickup.status === 'in_progress' ? 'text-blue-600 dark:text-blue-500' :
                     'text-slate-400'
                  }`}>
                    {useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? (
                      <><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Arrived</>
                    ) : nextPickup.status === 'in_progress' ? (
                      <><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" /> In Progress</>
                    ) : (
                      'Next Pickup'
                    )}
                  </h3>
                  <h4 className={`text-[13px] font-black leading-tight truncate ${
                     (useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) || nextPickup.status === 'in_progress')
                     ? 'text-slate-900 dark:text-white' 
                     : 'text-white'
                  }`}>{nextPickup.material}</h4>
                  <p className={`text-[11px] font-medium leading-tight mt-0.5 truncate ${
                     (useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) || nextPickup.status === 'in_progress')
                     ? 'text-slate-600 dark:text-slate-400'
                     : 'text-slate-400'
                  }`}>
                    {nextPickup.pickupAddress}
                  </p>
                </div>
              </div>
              <div className={`rounded-lg px-2.5 py-1.5 flex flex-col items-end border shrink-0 ml-2 ${
                 (useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) || nextPickup.status === 'in_progress')
                 ? 'bg-white/50 dark:bg-black/20 border-slate-200 dark:border-white/10'
                 : 'bg-slate-800/80 border-slate-700'
              }`}>
                <span className={`text-[9px] font-bold uppercase tracking-widest leading-none mb-1 ${
                   (useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) || nextPickup.status === 'in_progress')
                   ? 'text-slate-500' : 'text-slate-400'
                }`}>Est</span>
                <span className={`text-xs font-black leading-none ${
                   useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'text-amber-600 dark:text-amber-400' :
                   nextPickup.status === 'in_progress' ? 'text-blue-600 dark:text-blue-400' :
                   'text-emerald-400'
                }`}>
                  {nextPickup.estimatedWeight} kg
                </span>
              </div>
            </div>
            
            <button className={`w-full font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-colors mt-auto flex items-center justify-center gap-2 relative z-10 shadow-sm ${
               useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) 
                 ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                 : nextPickup.status === 'in_progress'
                 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'
                 : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
            }`}>
              <Navigation className="w-4 h-4" /> {
                useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'Verify Collection' :
                nextPickup.status === 'in_progress' ? 'Continue Route' :
                'Navigate'
              }
            </button>
          </div>
        ) : profile?.isOnline ? (
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] shrink-0 border border-slate-200/50 dark:border-slate-700/50 relative overflow-hidden">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-full flex items-center justify-center shrink-0">
              <Radar className="w-6 h-6 text-slate-900 dark:text-slate-400 animate-[spin_4s_linear_infinite]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">Looking for Pickups</h3>
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1 flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                You're Online & Ready
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[140px] shrink-0 relative overflow-hidden">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-full flex items-center justify-center shrink-0">
              <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">Pickups Paused</h3>
              <p className="text-[10px] font-bold text-slate-500 mt-1 max-w-[200px] leading-relaxed mx-auto">
                Go online to receive nearby pickup requests.
              </p>
            </div>
          </div>
        )}

        {/* ── MARKET INTELLIGENCE ── */}
        <div className="w-full mt-1">
          <button onClick={() => navigate("/market-pulse")} className="w-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white dark:bg-white dark:text-slate-900 rounded-[20px] shadow-sm shadow-slate-900/5 active:scale-[0.98] transition-all group p-3 flex items-center justify-between border border-white/10 dark:border-slate-900/10 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 dark:bg-slate-900/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <BarChart3Icon className="w-6 h-6 text-white dark:text-slate-900" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-[16px] font-bold tracking-tight leading-none mb-1 text-white dark:text-slate-200">Market Intelligence</h3>
                <p className="text-[11px] font-semibold text-white/80 dark:text-slate-300 leading-tight">Live prices & trade data</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 dark:bg-slate-900/10 flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-slate-900/20 transition-colors relative z-10 shrink-0">
              <ChevronRight className="w-4 h-4 text-white dark:text-slate-900 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

      </div>

    </div>
  );
}
