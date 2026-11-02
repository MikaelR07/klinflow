/**
 * Resident Wallet — Full-featured wallet management for residents
 * Dark greenish theme matching agent performance card styling
 */
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft,
  TrendingUp, Clock, CheckCircle2, Eye, EyeOff,
  ChevronRight, ShieldCheck, Banknote, Sparkles,
  Gift, Send, Recycle, Leaf, Trophy,
  ArrowRight, Package, CheckCircle,
  Landmark,
  ArrowRightLeft,
  ArrowDownSquare,
  ArrowUpSquare,
  ArrowUpCircle,
  ArrowDownCircle,
  Bell, Headset,
  BanknoteArrowUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { walletService } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function ResidentWallet() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const { bookings, fetchBookings } = useBookingStore(s => s);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [gfpBalance, setGfpBalance] = useState(0);
  const [cashBalance, setCashBalance] = useState(0);
  const [walletStats, setWalletStats] = useState<any>(null);
  const [walletTxns, setWalletTxns] = useState<any[]>([]);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});
  const getUnreadCount = useNotificationStore(s => s.getUnreadCount);
  const fetchNotifications = useNotificationStore(s => s.fetchNotifications);
  const unreadCount = getUnreadCount();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId, 'client');
    }
  }, [userId, fetchNotifications]);

  // Fetch real wallet balance and bookings
  useEffect(() => {
    if (!userId) return;

    const loadData = () => {
      walletService.getWalletDetails(userId).then(data => {
        if (data) {
          setGfpBalance(data.available_points || 0);
          setCashBalance(data.cash_balance || 0);
          setWalletStats(data);
        }
      });
      walletService.getWalletTransactions(userId).then(async data => {
        const txns = data || [];
        setWalletTxns(txns);

        const refIds = txns
          .filter(t => t.amount > 0 && t.transaction_type === 'payout' && t.reference_id)
          .map(t => t.reference_id);

        if (refIds.length > 0) {
          try {
            const mapping: Record<string, string> = {};
            
            const [{ data: foData }, { data: bData }] = await Promise.all([
              supabase.from('fulfillment_orders').select('id, assigned_agent_id').in('id', refIds),
              supabase.from('bookings').select('id, agent_id').in('id', refIds)
            ]);

            const agentIds = new Set<string>();
            foData?.forEach((f: any) => { if (f.assigned_agent_id) agentIds.add(f.assigned_agent_id); });
            bData?.forEach((b: any) => { if (b.agent_id) agentIds.add(b.agent_id); });
            
            if (agentIds.size > 0) {
              const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', Array.from(agentIds));
              const profileMap = new Map(profiles?.map((p: any) => [p.id, p.name]));
              
              foData?.forEach((f: any) => { if (profileMap.has(f.assigned_agent_id)) mapping[f.id] = profileMap.get(f.assigned_agent_id); });
              bData?.forEach((b: any) => { if (profileMap.has(b.agent_id)) mapping[b.id] = profileMap.get(b.agent_id); });
            }
            setAgentNames(prev => ({ ...prev, ...mapping }));
          } catch (error) {
            console.error('Error fetching agent names:', error);
          }
        }
      });
      fetchBookings();
    };

    loadData();

    const channel = supabase
      .channel(`resident-wallet-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions', filter: `profile_id=eq.${userId}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_wallets', filter: `user_id=eq.${userId}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBookings]);

  // Derived metrics
  const now = new Date();
  const currentMonthStart = useMemo(() => new Date(now.getFullYear(), now.getMonth(), 1), []);

  const completedBookings = useMemo(() =>
    bookings.filter((b: any) => ['completed', 'paid', 'verified'].includes(b.status)),
    [bookings]
  );

  const thisMonthPickups = useMemo(() =>
    completedBookings.filter((b: any) => new Date(b.completedAt || b.updatedAt || b.createdAt) >= currentMonthStart),
    [completedBookings, currentMonthStart]
  );



  // True Transactions from ledger (Moved up to be used by metrics)
  const transactions = useMemo(() => {
    return walletTxns.map((t: any) => {
      const isWithdrawal = t.transaction_type === 'withdrawal' || t.amount < 0;
      return {
        id: t.id,
        type: isWithdrawal ? 'withdrawal' : (t.amount > 0 ? 'earned' : 'reward'),
        buyerName: isWithdrawal
          ? 'Wallet Withdrawal'
          : (agentNames[t.reference_id] || t.metadata?.hub_name || t.metadata?.buyer_name || (t.metadata?.type === 'material_buyback' ? 'Recycling Agent' : 'Klinflow Payout')),
        materialSummary: isWithdrawal
          ? (t.metadata?.method ? `${t.metadata.method} Transfer` : 'M-PESA Transfer')
          : (t.metadata?.materials_summary || t.metadata?.material || t.metadata?.description || (t.amount > 0 ? 'Recyclables Sale Payout' : 'Wallet Transfer / Reward')),
        amount: t.amount,
      date: new Date(t.created_at),
      status: 'completed' as const,
      reference: t.metadata?.waybill_id || `TRX-${String(t.id).substring(0, 6).toUpperCase()}`,
      metadata: t.metadata
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [walletTxns, agentNames]);



  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#f8fafc] dark:bg-slate-800 relative overflow-x-hidden min-h-screen font-sans pb-6">

      {/* ── FIXED TOP NAV ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 bg-gradient-to-tr from-emerald-700 via-emerald-800 to-emerald-900`}>
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between relative">
          {/* Left: Back Arrow */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Center: My Wallet */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">
              My Wallet
            </h1>
          </div>

          {/* Right: Notifications & Support */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <button
              onClick={() => navigate("/notifications")}
              className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group"
            >
              <Bell className="w-5 h-5 text-white group-hover:animate-swing" />
              {Number(unreadCount) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-emerald-800 shadow-md animate-in zoom-in">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => navigate("/settings/support")}
              className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group"
            >
              <Headset className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TOP SECTION WITH BACKGROUND COLOR ── */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-emerald-900 text-white relative overflow-hidden rounded-b-[1.25rem]  pb-6 pt-[calc(env(safe-area-inset-top,1.5rem)+7.5rem)]">
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.08] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-300/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 max-w-lg mx-auto px-4">

          {/* Wallet Icon + Label */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Available Balance</span>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-lg font-bold text-white/80">KSh</span>
            <span className={`text-2xl font-bold text-white leading-none transition-all duration-300 ${!balanceVisible ? 'blur-md select-none' : ''}`}>
              {Number(cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-1.5 hover:bg-white/10 rounded-xl transition-colors active:scale-95">
              {balanceVisible ? <Eye className="w-4.5 h-4.5 text-white/60" /> : <EyeOff className="w-4.5 h-4.5 text-white/60" />}
            </button>
          </div>

          {/* Secure Klinflow Wallet */}
          <div className="flex justify-center mb-5">
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-white/80 uppercase tracking-widest bg-white/10 px-3.5 py-1 rounded-full border border-white/15 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Klinflow Wallet
            </div>
          </div>

          {/* ── Quick Actions inside Top Section ── */}
          <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/15">
            <button
              onClick={() => navigate('/withdraw')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <BanknoteArrowUp className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Withdraw</p>
            </button>

            <button
              onClick={() => navigate('/redeem-gfp')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Gift className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Redeem</p>
            </button>

            <button
              onClick={() => navigate('/transfer-gfp')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Transfer</p>
            </button>

            <button
              onClick={() => navigate('/book-pickup')}
              className="bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-[0.97] transition-all group hover:bg-white/25 shadow-sm"
            >
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Banknote className="w-4.5 h-4.5 text-white" />
              </div>
              <p className="text-[12px] font-bold text-white text-center leading-tight">Earn More</p>
            </button>
          </div>
        </div>
      </div>

      {/* ── Content area below top section ── */}
      <div className="px-4 sm:px-4 py-4 max-w-lg mx-auto space-y-4">

        {/* ── Recent Transactions ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-600 dark:text-white capitalize tracking-wider">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/transactions-history')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide hover:underline cursor-pointer"
            >
              View History
            </button>
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {transactions.length > 0 ? (
                transactions.slice(0, 4).map((txn, i) => (
                  <motion.div
                    key={txn.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04 }}
                    className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${txn.type === 'earned'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30'
                        : 'bg-red-50 dark:bg-red-900/30'
                        }`}>
                        {txn.type === 'earned'
                          ? <ArrowDownCircle className="w-5 h-5 text-emerald-500" />
                          : <ArrowUpCircle className="w-5 h-5 text-red-500" />
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5">
                          {txn.buyerName}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                            {txn.materialSummary}
                          </p>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <p className="text-[10px] font-medium text-slate-400">
                            {txn.date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} • {txn.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-bold ${txn.type === 'earned'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : txn.type === 'withdrawal'
                          ? 'text-red-500 dark:text-red-400'
                          : 'text-slate-900 dark:text-white'
                        }`}>
                        {txn.type === 'earned' ? '+' : '-'} KES {Math.abs(Number(txn.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                        {txn.type === 'earned' ? 'Received' : txn.type === 'withdrawal' ? 'Completed' : 'Credited'}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No transactions yet</p>
                  <p className="text-[10px] font-semibold text-slate-400/70 dark:text-slate-500 mb-4">
                    Complete your first pickup to start earning
                  </p>
                  <button
                    onClick={() => navigate('/book-pickup')}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                  >
                    Book a Pickup
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      {/* ── SECURITY FOOTER ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 py-3"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
        <p className="text-[9px] font-bold text-slate-400/50 dark:text-slate-500/50 uppercase tracking-[0.2em]">
          Secured by Klinflow Escrow
        </p>
      </motion.div>
      </div>
    </div>
  );
}
