/**
 * AgentHome Stats & Quick Actions
 * Extracted from AgentHome.tsx
 */
import { useState, useEffect } from 'react';
import {
  Handshake, Truck, Star, Zap, Briefcase, Receipt, PlusSquare,
  MapPinPlus, Package, BarChart3Icon, ChevronRight, Route,
  Navigation, Radar, Moon, MapPin, CheckCircle, XCircle,
  User, Clock, Scale, Store, FileText, Users,
  Wallet,
  UserStar
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
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-white dark:bg-slate-800 rounded-t-2xl shadow-[0_-20px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-20px_40px_rgba(0,0,0,0.3)] border-t border-slate-200 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom,1.5rem)+5.5rem)] pt-6 px-2 transition-transform duration-300 h-[60vh] flex flex-col">
      
      {/* ── DRAG HANDLE ── */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 mt-2">
        {/* ── HERO CARD (Balances + Performance Stats) ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-emerald-800 to-emerald-600 p-5 border border-emerald-500/30 shadow-lg shrink-0">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none bg-emerald-400/20" />
            
            {/* ── BALANCES SECTION ── */}
            <div className="relative z-10 flex items-start justify-between gap-4 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-emerald-200/80 mb-0.5 tracking-widest uppercase">Collected Value</p>
                <div className="flex items-baseline gap-1 min-w-0">
                  <span className="text-sm font-bold text-emerald-300 shrink-0">KSh</span>
                  <h2 className="text-2xl font-black text-white truncate">{(earnings?.inventoryValue || 0).toLocaleString()}</h2>
                </div>
                <div className="text-[10px] font-bold mt-0.5 text-emerald-200/70 flex items-center gap-1">
                  {performanceChange >= 0 ? (
                    <span className="text-emerald-100 bg-white/15 px-1.5 py-0.5 rounded">↑ {performanceChange.toFixed(0)}%</span>
                  ) : (
                    <span className="text-rose-200 bg-rose-500/20 px-1.5 py-0.5 rounded">↓ {Math.abs(performanceChange).toFixed(0)}%</span>
                  )}
                  today
                </div>
              </div>
              <div className="w-px h-12 self-center bg-white/20" />
              <div className="flex-1 min-w-0 flex flex-col items-end text-right">
                <p className="text-[10px] font-bold text-emerald-200/80 mb-0.5 tracking-widest uppercase">Trading Balance</p>
                <div className="flex items-baseline justify-end gap-1 min-w-0 w-full">
                  <span className="text-sm font-bold text-emerald-300 shrink-0">KSh</span>
                  <h2 className="text-2xl font-black text-white truncate">{(profile?.walletBalance || 0).toLocaleString()}</h2>
                </div>
                <p className="text-[10px] font-bold text-emerald-200/70 mt-0.5">Available Cash</p>
              </div>
            </div>

            {/* ── PICKUPS INDICATOR ── */}
            <div className="relative z-10 flex items-center gap-2.5 border-t border-white/15 pt-2">
              <Truck className="w-5 h-5 text-emerald-300 shrink-0" />
              <span className="text-[12px] font-bold text-emerald-200/80">
                <span className="text-white font-black">{profile?.stats?.totalPickups || 0}</span> pickups completed
              </span>
            </div>
        </div>

        {/* ── QUICK ACTIONS CARD ── */}
        <div className="bg-slate-200 dark:bg-slate-900 rounded-2xl p-2 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex flex-col gap-2 shrink-0">
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

              <button onClick={() => navigate(profile?.agentAccountType === 'fleet_driver' ? '/deposit' : '/wallet')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-amber-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Wallet</span>
              </button>

              <button onClick={() => navigate('/warehouse')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-purple-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">{profile?.agentAccountType === 'fleet_driver' ? 'Warehouse' : 'B2B Hub'}</span>
              </button>

              <button onClick={() => navigate('/reviews')} className="bg-slate-50 dark:bg-slate-700/50 border border-white dark:border-slate-700/50 rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm hover:shadow-md active:scale-95 transition-all group">
                <div className="relative w-9 h-9 shrink-0 bg-emerald-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white group-hover:scale-110 transition-transform">
                  <UserStar className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 capitalize tracking-wider">Reviews</span>
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
          <div className="bg-gradient-to-br from-[#2e1065] via-purple-800 to-indigo-600 rounded-2xl p-3.5 flex flex-col gap-3 shrink-0 border border-purple-500/30 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none bg-indigo-400/20" />
            
            {/* HEADER ROW: Customer Info, Badge & Location */}
            <div className="flex justify-between items-start relative z-10 mb-1">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-purple-700/50 flex items-center justify-center border-2 border-purple-400 shadow-sm overflow-hidden">
                    {nextPickup.originalJob?.customerAvatar || nextPickup.originalJob?.sellerAvatar ? (
                      <img src={nextPickup.originalJob?.customerAvatar || nextPickup.originalJob?.sellerAvatar} alt="Customer" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-purple-200" />
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-400 border-2 border-purple-800 rounded-full animate-ping" />
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-[15px] font-bold text-white capitalize truncate leading-tight">
                    {nextPickup.customerName || 'Resident Client'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-white/20 text-white">
                      <Zap className="w-3 h-3" /> New Request
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Location on the right */}
              <div className="flex flex-col items-end text-right shrink-0 max-w-[130px]">
                <div className="flex items-center justify-end gap-1 mb-0.5 text-purple-200/80">
                  <MapPin className="w-3 h-3 text-purple-300 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="text-[11px] font-bold text-white leading-snug line-clamp-2">
                  {nextPickup.pickupAddress || 'Address pending'}
                </p>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="relative z-10 grid grid-cols-2 gap-2 bg-black/20 p-2 rounded-xl border border-white/10">
               <div className="flex flex-col gap-1 pl-1">
                 <p className="text-[9px] font-bold text-purple-200/80 uppercase tracking-widest flex items-center gap-1"><Package className="w-3 h-3" /> Material</p>
                 <p className="text-[12px] font-bold text-white truncate capitalize">{nextPickup.material}</p>
               </div>
               <div className="flex flex-col gap-1 pl-1">
                 <p className="text-[9px] font-bold text-purple-200/80 uppercase tracking-widest flex items-center gap-1"><Scale className="w-3 h-3" /> Weight</p>
                 <p className="text-[12px] font-black text-white">{nextPickup.estimatedWeight} kg</p>
               </div>
            </div>
            
            {/* ACTION BUTTONS */}
            <div className="flex gap-2 mt-auto relative z-10">
              <button 
                onClick={async () => {
                  if (nextPickup.source === 'bookings' || nextPickup.source === 'market_trades') {
                     const success = await acceptJob(nextPickup.id);
                     if (success) toast.success("Pickup Accepted!");
                     else toast.error("Could not accept pickup");
                  }
                }}
                className="flex-[2] bg-white hover:bg-purple-50 text-purple-800 font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                <CheckCircle className="w-4 h-4" /> Accept Pickup
              </button>
              <button 
                onClick={() => {
                  if (nextPickup.source === 'bookings' || nextPickup.source === 'market_trades') {
                     rejectJob(nextPickup.id);
                  }
                }}
                className="flex-[1] bg-white/10 hover:bg-white/20 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/10"
              >
                <XCircle className="w-4 h-4" /> Decline
              </button>
            </div>
          </div>
        ) : nextPickup ? (
          <div 
            onClick={() => {
              if (nextPickup.source === 'fulfillment_orders') navigate(`/pickups/${nextPickup.id}`);
              else navigate(`/jobs/navigate/${nextPickup.id}`);
            }}
            className={`rounded-2xl p-3.5 flex flex-col gap-3 shrink-0 shadow-lg cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden bg-gradient-to-br from-[#064e3b] via-emerald-800 to-emerald-600 border border-emerald-500/30`}
          >
            {/* Soft background accents based on status */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none ${
              useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'bg-amber-500/20' :
              nextPickup.status === 'in_progress' ? 'bg-blue-500/20' : 'bg-emerald-400/20'
            }`} />

            {/* HEADER ROW: Customer Info, Status Badge & Location */}
            <div className="flex justify-between items-start relative z-10 mb-1">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full bg-emerald-700/50 flex items-center justify-center border-2 border-emerald-500 shadow-sm overflow-hidden">
                    {nextPickup.originalJob?.customerAvatar || nextPickup.originalJob?.sellerAvatar ? (
                      <img src={nextPickup.originalJob?.customerAvatar || nextPickup.originalJob?.sellerAvatar} alt="Customer" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-emerald-200" />
                    )}
                  </div>
                  {useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-amber-500 border-2 border-emerald-700 rounded-full" />
                  ) : nextPickup.status === 'in_progress' ? (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 border-2 border-emerald-700 rounded-full animate-pulse" />
                  ) : null}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <h3 className="text-[15px] font-bold text-white capitalize truncate leading-tight">
                    {nextPickup.customerName || 'Resident Client'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {(() => {
                      const job = nextPickup.originalJob;
                      let badgeIcon = <User className="w-3 h-3" />;
                      let badgeText = 'Resident';
                      let badgeColor = 'bg-white/20 text-white';
                      
                      if (nextPickup.source === 'fulfillment_orders') {
                        if (job.rfq?.is_group_collection) { badgeIcon = <Users className="w-3 h-3" />; badgeText = 'Group RFQ'; badgeColor = 'bg-blue-500/30 text-blue-100'; }
                        else { badgeIcon = <FileText className="w-3 h-3" />; badgeText = 'RFQ'; badgeColor = 'bg-violet-500/30 text-violet-100'; }
                      } else {
                        if (job.is_group_pickup) { badgeIcon = <Users className="w-3 h-3" />; badgeText = 'Swarm'; badgeColor = 'bg-indigo-500/30 text-indigo-100'; }
                        else if (job.is_market_trade || job.booking_type === 'marketplace_pickup' || job.listing_id) { badgeIcon = <Store className="w-3 h-3" />; badgeText = 'Trade'; badgeColor = 'bg-emerald-500/30 text-emerald-100'; }
                      }
                      
                      return (
                        <span className={`px-2 py-0.5 rounded flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                          {badgeIcon} {badgeText}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Location on the right */}
              <div className="flex flex-col items-end text-right shrink-0 max-w-[130px]">
                <div className="flex items-center justify-end gap-1 mb-0.5 text-emerald-200/80">
                  <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">Location</span>
                </div>
                <p className="text-[11px] font-bold text-white leading-snug line-clamp-2">
                  {nextPickup.pickupAddress || 'Address pending'}
                </p>
              </div>
            </div>

            {/* DETAILS GRID */}
            <div className="relative z-10 grid grid-cols-2 gap-2 bg-black/20 p-2 rounded-xl border border-white/10">
               <div className="flex flex-col gap-1 pl-1">
                 <p className="text-[9px] font-bold text-emerald-200/80 uppercase tracking-widest flex items-center gap-1"><Package className="w-3 h-3" /> Material</p>
                 <p className="text-[12px] font-bold text-white truncate capitalize">{nextPickup.material}</p>
               </div>
               <div className="flex flex-col gap-1 pl-1">
                 <p className="text-[9px] font-bold text-emerald-200/80 uppercase tracking-widest flex items-center gap-1"><Scale className="w-3 h-3" /> Weight</p>
                 <p className="text-[12px] font-black text-white">{nextPickup.estimatedWeight} kg</p>
               </div>
            </div>
            
            {/* ACTION BUTTON */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (nextPickup.source === 'fulfillment_orders') navigate(`/pickups/${nextPickup.id}`);
                else navigate(`/jobs/navigate/${nextPickup.id}`);
              }}
              className={`w-full font-black text-[11px] uppercase tracking-widest py-3 rounded-xl transition-all relative z-10 flex items-center justify-center gap-2 ${
               useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) 
                 ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                 : nextPickup.status === 'in_progress'
                 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                 : 'bg-white hover:bg-emerald-50 text-emerald-800 shadow-lg shadow-black/10'
              }`}
            >
              <Navigation className="w-4 h-4" /> 
              {
                useAgentStore.getState().arrivedJobIds.includes(nextPickup.id) ? 'Verify Collection' :
                nextPickup.status === 'in_progress' ? 'Continue Route' :
                'Navigate to Pickup'
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
          <button onClick={() => navigate("/market-pulse")} className="w-full bg-slate-200 dark:bg-slate-900 text-slate-900 rounded-[20px] shadow-sm shadow-slate-900/5 active:scale-[0.98] transition-all group p-3 flex items-center justify-between border border-white/10 dark:border-slate-900/10 relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <BarChart3Icon className="w-6 h-6 text-slate-600 dark:text-slate-200" />
              </div>
              <div className="text-left min-w-0">
                <h3 className="text-[15px] font-bold tracking-tight leading-none mb-1 text-slate-700 dark:text-slate-200">Market Prices</h3>
                <p className="text-[11px] font-semibold text-slate-600/80 dark:text-slate-300 leading-tight">View live material prices</p>
              </div>
            </div>
            
            <div className="relative z-10 shrink-0 right-0 mr-1">
              {/* Sparkline Chart */}
              <div className="h-12 w-26 opacity-80 group-hover:opacity-100 transition-opacity">
                <svg viewBox="0 0 105 40" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="spark-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,35 Q10,35 20,25 T40,25 T60,15 T80,10 T100,5"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-sm"
                  />
                  <path
                    d="M0,35 Q10,35 20,25 T40,25 T60,15 T80,10 T100,5 L100,40 L0,40 Z"
                    fill="url(#spark-gradient)"
                  />
                  {/* Rounded Tip at the end */}
                  <circle cx="100" cy="5" r="3" fill="#10b981" className="drop-shadow-md" />
                </svg>
              </div>
            </div>
          </button>
        </div>

      </div>

    </div>
  );
}
