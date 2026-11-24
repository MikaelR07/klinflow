import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, History, Send,
  TrendingUp, CheckCircle2, Loader2, CreditCard, ChevronRight,
  Target, Wallet, Zap,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { toast } from 'sonner';
import { walletService } from '@klinflow/core/services/walletService';

export default function AgentWallet() {
  const navigate = useNavigate();
  const profile = useAuthStore((s: any) => s.profile);
  const fetchProfile = useAuthStore((s: any) => s.fetchProfile);
  const walletBalance = useAuthStore((s: any) => s.walletBalance);
  const payoutBalance = useAuthStore((s: any) => s.payoutBalance);
  const depositToWallet = useAuthStore((s: any) => s.depositToWallet);
  const withdrawRewards = useAuthStore((s: any) => s.withdrawRewards);
  const transferToTradingBalance = useAuthStore((s: any) => s.transferToTradingBalance);
  const earnings = useAgentStore(s => s.earnings);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);

  const [balanceVisible, setBalanceVisible] = useState(true);
  const [activeFlow, setActiveFlow] = useState<'none' | 'deposit' | 'withdraw' | 'transfer'>('none');
  const [flowStep, setFlowStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [txTab, setTxTab] = useState<'all' | 'topup' | 'withdrawal' | 'payout' | 'payment' | 'transfer'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  // Fetch fresh wallet data from server on mount
  useEffect(() => {
    fetchProfile();
    fetchEarnings();
    if (profile?.id) {
      walletService.getWalletTransactions(profile.id, 25).then(data => {
        setTransactions(data || []);
        setIsLoadingTx(false);
      });
    }
    const timer = setTimeout(() => setIsChartReady(true), 300);
    return () => clearTimeout(timer);
  }, [fetchProfile, fetchEarnings, profile?.id]);

  const formatTxDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const dateFormatted = d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (txTab === 'all') return true;
    if (txTab === 'topup') return tx.transaction_type === 'topup';
    if (txTab === 'withdrawal') return tx.transaction_type === 'withdrawal';
    if (txTab === 'payout') return tx.transaction_type === 'payout' || tx.transaction_type === 'escrow_release';
    if (txTab === 'payment') return tx.transaction_type === 'payment';
    if (txTab === 'transfer') return tx.transaction_type === 'transfer';
    return true;
  });

  const handleProcessFlow = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsProcessing(true);
    try {
      if (activeFlow === 'deposit') {
        await depositToWallet(val);
        toast.success(`Deposited KSh ${val.toLocaleString()}`);
      } else if (activeFlow === 'withdraw') {
        if (val > (payoutBalance || 0)) {
          toast.error('Insufficient payout balance');
          setIsProcessing(false);
          return;
        }
        await withdrawRewards(val);
        toast.success(`Withdrawn KSh ${val.toLocaleString()} to M-Pesa`);
      } else if (activeFlow === 'transfer') {
        if (val > (payoutBalance || 0)) {
          toast.error('Insufficient payout balance');
          setIsProcessing(false);
          return;
        }
        await transferToTradingBalance(val);
        toast.success(`Transferred KSh ${val.toLocaleString()} to Trading Balance`);
      }
      setFlowStep(3); // Success step
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setActiveFlow('none');
    setFlowStep(1);
    setAmount('');
  };

  // Helper for bottom sheet style modals
  const renderFlowSheet = () => {
    if (activeFlow === 'none') return null;
    const isDeposit = activeFlow === 'deposit';
    const isTransfer = activeFlow === 'transfer';
    const title = isDeposit ? 'Deposit Funds' : isTransfer ? 'Transfer to Trading' : 'Withdraw Payout';

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={resetFlow} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            {isDeposit ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Deposit Funds</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Add money to your trading wallet</p>
                </div>
              </div>
            ) : isTransfer ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Internal Transfer</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Move profits to trading balance</p>
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            )}
            <button onClick={resetFlow} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center active:scale-90 transition-transform text-slate-500 font-bold">✕</button>
          </div>

          {/* DEPOSIT FLOW (Single Step) */}
          {isDeposit && flowStep !== 3 && (
            <div className="space-y-5">
              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2">
                {[1000, 2000, 5000, 7500, 10000].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setAmount(amt.toString())}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${amount === amt.toString()
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                  >
                    KSh {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Custom Amount</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">KSh</div>
                  <input
                    type="number"
                    min="0"
                    onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-2xl font-bold text-slate-900 dark:text-white outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <button
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                onClick={handleProcessFlow}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Confirm Deposit
                  </>
                )}
              </button>

              {/* Info */}
              <div className="bg-amber-700 dark:bg-amber-700 border border-amber-600 dark:border-amber-700 rounded-xl p-4 space-y-2 mt-4">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-200 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-white">Instant Processing</p>
                    <p className="text-[10px] text-amber-100">Deposits reflect in your wallet immediately. Use your balance to accept marketplace deals and buy stock from residents.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* WITHDRAWAL & TRANSFER STEP 1: Amount Entry */}
          {!isDeposit && flowStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 block">Enter Amount (KSh)</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">KSh</div>
                  <input
                    type="number"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-bold text-slate-900 dark:text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium px-2 mt-1">Available Payouts: KSh {(payoutBalance || 0).toLocaleString()}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 justify-center">
                {[1000, 2000, 5000].map(amt => (
                  <button key={amt} onClick={() => setAmount(amt.toString())} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-transform">
                    +{amt}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  if (parseFloat(amount) > 0) setFlowStep(2);
                }}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full h-16 bg-blue-600 text-white rounded-[1.25rem] font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-4"
              >
                Continue
              </button>
            </div>
          )}

          {/* WITHDRAWAL & TRANSFER STEP 2: Confirmation */}
          {!isDeposit && flowStep === 2 && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-500">{isTransfer ? 'Transfer Amount' : 'Withdraw Amount'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">KSh {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-slate-500">{isTransfer ? 'Transfer to' : 'Withdraw to'}</span>
                  <div className="flex items-center gap-2">
                    {isTransfer ? (
                      <span className="font-bold text-slate-900 dark:text-white">Trading Balance</span>
                    ) : (
                      <>
                        <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center text-white text-[9px] font-bold">M</div>
                        <span className="font-bold text-slate-900 dark:text-white">***{profile?.phone?.slice(-4) || '1234'}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-blue-600">KSh {parseFloat(amount).toLocaleString()}</span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                onClick={handleProcessFlow}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    {isTransfer ? 'Confirm Transfer' : 'Confirm Withdrawal'}
                  </>
                )}
              </button>

              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900 border border-blue-100 dark:border-blue-800 rounded-xl p-4 space-y-2 mt-4">
                <div className="flex items-start gap-2">
                  <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white">Instant Processing</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isTransfer ? 'Funds will be immediately available in your Trading Balance.' : 'Withdrawals are processed instantly via M-Pesa. Standard transaction fees may apply.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {flowStep === 3 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold dark:text-white mb-1">Success!</h3>
                <p className="text-sm text-slate-500 font-medium">Your transaction was processed successfully.</p>
              </div>
              <button 
                onClick={resetFlow}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-base mt-4 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </motion.div>
      </div>
    );
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#f8fafc] dark:bg-slate-800 font-sans pb-6">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-2.5 transition-all duration-300 bg-gradient-to-tr from-emerald-700 via-emerald-600 to-lime-600 shadow-sm">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between relative">
          {/* Left: Back Arrow */}
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>

          {/* Center: Agent Wallet */}
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">
              Agent Wallet
            </h1>
          </div>

          {/* Right: Statements History */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-10">
            <button
              onClick={() => navigate("/payout-history")}
              className="relative w-10 h-10 shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-sm transition-all active:scale-95 group"
              title="Payout History"
            >
              <History className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TOP SECTION WITH LIME GRADIENT ── */}
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-600 text-white relative overflow-hidden rounded-b-[1.25rem] pb-6 pt-[calc(env(safe-area-inset-top,1.5rem)+6.5rem)] shadow-sm">
        {/* Decorative background orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/[0.12] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-lime-300/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto px-4">
          {/* Total Balance */}
          <div className="mb-3 text-center">
            <p className="text-[10px] font-semibold text-white/80 uppercase tracking-[0.2em] mb-2">Total Wallet Balance</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg font-medium opacity-90 text-white">KSh</span>
              <span className={`text-2xl font-bold leading-none tracking-tight transition-all duration-300 text-white ${!balanceVisible ? 'blur-lg select-none' : ''}`}>
                {(walletBalance + (payoutBalance || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="p-2 hover:bg-white/15 rounded-full transition-colors active:scale-90">
                {balanceVisible ? <Eye className="w-4.5 h-4.5 text-white/80" /> : <EyeOff className="w-4.5 h-4.5 text-white/80" />}
              </button>
            </div>
          </div>

         

          {/* Balance Breakdown Cards (Trading Balance & Payout Balance) - Scrollable */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 px-4 -mx-4 snap-x mb-4">
            {/* Trading Balance */}
            <div className="w-[195px] shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/20 snap-center shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Trading Balance</p>
                <span className="w-2 h-2 rounded-full bg-lime-300 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xs font-bold text-white/90">KSh</span>
                <h3 className={`text-base font-bold text-white truncate ${!balanceVisible ? 'blur-sm select-none' : ''}`}>
                  {walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="bg-white/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-white/90 font-medium capitalize truncate">Available for sourcing</span>
              </div>
            </div>

            {/* Payout Balance */}
            <div className="w-[195px] shrink-0 bg-white/15 backdrop-blur-sm rounded-2xl p-3.5 border border-white/20 snap-center shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Payout Balance</p>
                <ArrowUpCircle className="w-3.5 h-3.5 text-lime-300" />
              </div>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="text-xs font-bold text-white/90">KSh</span>
                <h3 className={`text-base font-bold text-white truncate ${!balanceVisible ? 'blur-sm select-none' : ''}`}>
                  {(payoutBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className="bg-white/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5">
                <span className="text-[9px] text-white/90 font-medium capitalize truncate">Ready to withdraw</span>
              </div>
            </div>
          </div>

          {/* ── Quick Actions inside Top Section (Smaller with Icon Before Text) ── */}
          <div className="flex items-center gap-2 pt-3 border-t border-white/15">
            {/* Deposit */}
            <button
              onClick={() => setActiveFlow('deposit')}
              className="flex-1 py-3 px-2.5 bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-white/25 shadow-sm"
            >
              <BanknoteArrowDown className="w-4 h-4 text-white shrink-0" />
              <span className="text-[11px] font-bold text-white tracking-wide">Deposit</span>
            </button>

            {/* Transfer */}
            <button
              onClick={() => setActiveFlow('transfer')}
              className="flex-1 py-3 px-2.5 bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-white/25 shadow-sm"
            >
              <Send className="w-4 h-4 text-white shrink-0" />
              <span className="text-[11px] font-bold text-white tracking-wide">Transfer</span>
            </button>

            {/* Withdraw */}
            <button
              onClick={() => setActiveFlow('withdraw')}
              className="flex-1 py-3 px-2.5 bg-white/15 backdrop-blur-sm border border-white/15 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-white/25 shadow-sm"
            >
              <BanknoteArrowUp className="w-4 h-4 text-white shrink-0" />
              <span className="text-[11px] font-bold text-white tracking-wide">Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (RECENT TRANSACTIONS) ── */}
      <div className="px-4 sm:px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* ── RECENT TRANSACTIONS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-600 dark:text-white capitalize tracking-wider">
              Recent Transactions
            </h3>
            <button
              onClick={() => navigate('/payout-history')}
              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide hover:underline cursor-pointer"
            >
              View History
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'topup', label: 'Deposits' },
              { id: 'payout', label: 'Earnings' },
              { id: 'payment', label: 'Purchases' },
              { id: 'withdrawal', label: 'Withdrawals' },
              { id: 'transfer', label: 'Transfers' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTxTab(tab.id as any)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-xl transition-all shrink-0 active:scale-95 ${
                  txTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {isLoadingTx ? (
              <div className="py-6 text-center text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                Loading transactions...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No transactions yet</p>
                <p className="text-[10px] font-semibold text-slate-400/70 dark:text-slate-500">
                  Transactions will appear here as you buy stock, earn and withdraw
                </p>
              </div>
            ) : (
              filteredTransactions.slice(0, 4).map((tx) => {
                const isDeposit = ['topup', 'payout', 'escrow_release', 'refund'].includes(tx.transaction_type);
                const isPayment = tx.transaction_type === 'payment';
                const isFailed = tx.status === 'failed';
                const titleMap: Record<string, string> = {
                  'topup': 'Wallet Deposit',
                  'withdrawal': 'Wallet Withdrawal',
                  'payout': 'Sales Earnings',
                  'transfer': 'Internal Transfer',
                  'payment': 'Stock Purchase'
                };
                const displayTitle = isPayment && tx.counterparty_name
                  ? tx.counterparty_name
                  : (titleMap[tx.transaction_type] || tx.transaction_type);
                const displaySubtitle = isPayment && tx.counterparty_phone
                  ? tx.counterparty_phone.substring(0, 5) + '******'
                  : tx.description || (isDeposit ? 'Credit to wallet' : 'Debit from wallet');

                return (
                  <div
                    key={tx.id}
                    className="px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700/60 rounded-2xl  transition-shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        isFailed 
                          ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-500' 
                          : isDeposit 
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {isDeposit ? (
                          <BanknoteArrowUp className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-bold leading-tight mb-0.5 truncate ${isFailed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                            {displayTitle}
                          </p>
                          {isFailed && (
                            <span className="text-[9px] font-bold uppercase text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">Failed</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {displaySubtitle && (
                            <>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                {displaySubtitle}
                              </p>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                            </>
                          )}
                          <p className="text-[10px] font-medium text-slate-400">
                            {formatTxDate(tx.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-bold ${
                        isFailed 
                          ? 'text-slate-400' 
                          : isDeposit 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-900 dark:text-white'
                      }`}>
                        {isDeposit ? '+' : '-'}KSh {Number(Math.abs(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 mt-0.5 capitalize">
                        {tx.status || 'Completed'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── SECURITY FOOTER ── */}
        <div className="flex items-center justify-center gap-2 py-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/40" />
          <p className="text-[9px] font-bold text-slate-400/50 dark:text-slate-500/50 uppercase tracking-[0.2em]">
            Secured by Klinflow Escrow
          </p>
        </div>
      </div>


      <AnimatePresence>
        {renderFlowSheet()}
      </AnimatePresence>
    </div>
  );
}
