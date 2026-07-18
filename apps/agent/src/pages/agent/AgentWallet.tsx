import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, History, Send,
  TrendingUp, CheckCircle2, Loader2, CreditCard, ChevronRight,
  Target, Wallet, Zap,
  BanknoteArrowDown,
  BanknoteArrowUp,
  ArrowDownCircle,
  ArrowUpCircle
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

  const [activeFlow, setActiveFlow] = useState<'none' | 'deposit' | 'withdraw' | 'transfer'>('none');
  const [flowStep, setFlowStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [txTab, setTxTab] = useState<'all' | 'topup' | 'withdrawal' | 'payout' | 'transfer'>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState(true);

  // Fetch fresh wallet data from server on mount
  useEffect(() => {
    fetchProfile();
    fetchEarnings();
    if (profile?.id) {
      walletService.getWalletTransactions(profile.id, 10).then(data => {
        setTransactions(data);
        setIsLoadingTx(false);
      });
    }
    const timer = setTimeout(() => setIsChartReady(true), 300);
    return () => clearTimeout(timer);
  }, [fetchProfile, fetchEarnings, profile?.id]);

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
              <h3 className="text-lg font-black text-slate-900 dark:text-white">{title}</h3>
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
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">KSh</div>
                  <input
                    type="number"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl font-black text-slate-900 dark:text-white outline-none"
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
                className="w-full h-16 bg-blue-600 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 mt-4"
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
                  <span className="text-lg font-black text-blue-600">KSh {parseFloat(amount).toLocaleString()}</span>
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
                <h3 className="text-2xl font-black dark:text-white mb-1">Success!</h3>
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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-800  relative overflow-x-hidden ">
      {/* ── TOP SECTION: BLUE WITH ROUNDED BOTTOM ── */}
      <div className="bg-blue-700 pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 rounded-b-[2rem] shadow-sm relative z-20">
        
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-700 pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-3 px-4 flex items-center gap-3 shadow-sm max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center active:scale-95 transition-all shrink-0">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-[16px] font-bold tracking-wide text-white leading-tight">Agent Wallet</h1>
          </div>
        </div>

        {/* Centered Total Balance */}
        <div className="text-center px-4 mb-6">
          <p className="text-blue-100 text-[11px] font-bold tracking-widest uppercase mb-1">Total Balance</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-blue-200">KSh</span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {(walletBalance + (payoutBalance || 0)).toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Scrollable Cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-4 snap-x">
          {/* Card 1: Trading Balance */}
          <div className="min-w-[280px] bg-blue-600 rounded-2xl p-5 border border-blue-500 snap-center ">
            <p className="text-blue-100 text-xs font-medium tracking-wide mb-1">Trading Balance</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xl font-bold text-blue-200">KSh</span>
              <h2 className="text-xl font-black text-white tracking-tight">{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Available for sourcing</span>
            </div>
          </div>

          {/* Card 2: Payout Balance */}
          <div className="min-w-[280px] bg-blue-600 rounded-2xl p-5 border border-blue-500 snap-center">
            <p className="text-blue-100 text-xs font-medium tracking-wide mb-1">Payout Balance</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xl font-bold text-blue-200">KSh</span>
              <h2 className="text-xl font-black text-white tracking-tight">{(payoutBalance || 0).toLocaleString()}</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-white/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
                <ArrowUpCircle className="w-3 h-3 text-blue-200" />
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">Ready to withdraw</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 px-4 gap-2">
          <button onClick={() => setActiveFlow('deposit')} className="flex-1 py-3 bg-blue-600 text-white border border-blue-500 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 font-bold">
            <ArrowDownCircle className="w-4 h-4" />
            <span className="text-[10px] tracking-wide uppercase">Deposit</span>
          </button>
          
          <button onClick={() => setActiveFlow('transfer')} className="flex-1 py-3 bg-blue-600 text-white border border-blue-500 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 font-bold">
            <Send className="w-4 h-4" />
            <span className="text-[10px] tracking-wide uppercase">Transfer</span>
          </button>

          <button onClick={() => setActiveFlow('withdraw')} className="flex-1 py-3 bg-blue-600 text-white border border-blue-500 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 font-bold">
            <ArrowUpCircle className="w-4 h-4" />
            <span className="text-[10px] tracking-wide uppercase">Withdraw</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-1.5 mt-6 space-y-6 relative z-10">
        {/* Recent Transactions */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[1rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Recent Transactions</h3>
            <button onClick={() => navigate('/payout-history')} className="text-xs font-semibold text-emerald-600">View Statements</button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All' },
              { id: 'topup', label: 'Deposits' },
              { id: 'payout', label: 'Earnings' },
              { id: 'payment', label: 'Payouts' },
              { id: 'transfer', label: 'Transfers' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setTxTab(tab.id as any)}
                className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-lg transition-all ${txTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 min-h-[200px]">
            {isLoadingTx ? (
              // Loading Skeleton
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/50 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-2">
                      <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded-md" />
                      <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded-md" />
                </div>
              ))
            ) : transactions.length === 0 ? (
              // Empty State
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                  <History className="w-5 h-5 text-slate-400" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Transactions</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">You haven't made any wallet transactions yet.</p>
              </div>
            ) : (
              // Real Transactions
              transactions.filter(tx => txTab === 'all' || tx.transaction_type === txTab).slice(0, 4).map((tx) => {
                const isDeposit = ['topup', 'payout', 'escrow_release', 'refund'].includes(tx.transaction_type);
                const isPayment = tx.transaction_type === 'payment';
                const isFailed = tx.status === 'failed';
                const titleMap: Record<string, string> = {
                  'topup': 'Wallet Deposit',
                  'withdrawal': 'Wallet Withdrawal',
                  'payout': 'sales Earnings',
                  'transfer': 'Internal Transfer'
                };
                // For payment transactions, show the seller/resident name
                const displayTitle = isPayment
                  ? (tx.counterparty_name || 'Recipient')
                  : (titleMap[tx.transaction_type] || tx.transaction_type);
                const maskedPhone = tx.counterparty_phone 
                  ? tx.counterparty_phone.substring(0, 5) + '******'
                  : '';
                const displaySubtitle = isPayment
                  ? maskedPhone
                  : '';

                return (
                  <div key={tx.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isFailed ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : isDeposit ? 'bg-white dark:bg-slate-700 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-red-500'}`}>
                        {isDeposit ? <BanknoteArrowDown className="w-5 h-5" /> : <BanknoteArrowUp className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <p className={`text-[12px] font-medium leading-none ${isFailed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                            {displayTitle}
                          </p>
                          {isFailed && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">Failed</span>}
                        </div>
                        {displaySubtitle ? (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{displaySubtitle}</p>
                        ) : (
                          !isPayment && (
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium tracking-tight ${isFailed ? 'text-slate-400' : isDeposit ? 'text-emerald-600 dark:text-emerald-400' : isPayment ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                        {isDeposit ? '+' : '-'}KSh {Math.abs(tx.amount).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>


      <AnimatePresence>
        {renderFlowSheet()}
      </AnimatePresence>
    </div>
  );
}
