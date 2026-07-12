import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowDownToLine, ArrowUpFromLine, History, Send,
  TrendingUp, CheckCircle2, Loader2, CreditCard, ChevronRight,
  Target, Wallet, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import PayoutsBarchart from '../admin/mobile/PayoutsBarchart';
import { toast } from 'sonner';

// MOCK TRANSACTIONS
const MOCK_TRANSACTIONS = [
  { id: '1', type: 'deposit', amount: 5000, date: '25 January 2026', title: 'M-Pesa Deposit', status: 'completed' },
  { id: '2', type: 'withdrawal', amount: 1500, date: '23 January 2026', title: 'Hub Payout', status: 'completed' },
  { id: '3', type: 'deposit', amount: 2000, date: '20 January 2026', title: 'M-Pesa Deposit', status: 'completed' },
];

export default function AgentWallet() {
  const navigate = useNavigate();
  const profile = useAuthStore((s: any) => s.profile);
  const fetchProfile = useAuthStore((s: any) => s.fetchProfile);
  const walletBalance = useAuthStore((s: any) => s.walletBalance);
  const depositToWallet = useAuthStore((s: any) => s.depositToWallet);
  const withdrawRewards = useAuthStore((s: any) => s.withdrawRewards);
  const earnings = useAgentStore(s => s.earnings);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);

  const [activeFlow, setActiveFlow] = useState<'none' | 'deposit' | 'withdraw'>('none');
  const [flowStep, setFlowStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const [txTab, setTxTab] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  // Fetch fresh wallet data from server on mount
  useEffect(() => {
    fetchProfile();
    fetchEarnings();
    const timer = setTimeout(() => setIsChartReady(true), 300);
    return () => clearTimeout(timer);
  }, [fetchProfile, fetchEarnings]);

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
        // Mock withdraw check
        if (val > (earnings?.todayPayout || 0)) {
          toast.error('Insufficient payout balance');
          setIsProcessing(false);
          return;
        }
        await withdrawRewards(val);
        toast.success(`Withdrawn KSh ${val.toLocaleString()} to M-Pesa`);
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
    const title = isDeposit ? 'Deposit Funds' : 'Withdraw Payout';

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
                  <p className="text-[10px] text-slate-400 font-medium">Add money to your agent wallet</p>
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

          {/* WITHDRAWAL STEP 1: Amount Entry */}
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
                <p className="text-xs text-slate-500 font-medium px-2 mt-1">Available: KSh {(earnings?.todayPayout || 0).toLocaleString()}</p>
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

          {/* WITHDRAWAL STEP 2: Confirmation */}
          {!isDeposit && flowStep === 2 && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Amount</span>
                  <span className="text-base font-bold dark:text-white">KSh {parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Withdraw to</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-[10px] font-bold">M</div>
                    <span className="text-sm font-bold dark:text-white">M-Pesa (***{profile?.phone?.slice(-4) || '1234'})</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-lg font-black text-blue-600">KSh {parseFloat(amount).toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={handleProcessFlow}
                disabled={isProcessing}
                className="w-full h-16 bg-blue-600 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Transaction'}
              </button>
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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-950  relative overflow-x-hidden min-h-screen">
      {/* ── TOP SECTION: BLUE WITH ROUNDED BOTTOM ── */}
      <div className="bg-blue-700 pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 rounded-b-[2rem] shadow-sm relative z-20">
        
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-700/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-3 px-4 flex items-center justify-between shadow-sm max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Agent Wallet Account</h1>
          </div>
          <div className="w-10 h-10"></div>
        </div>

        {/* Centered Total Balance */}
        <div className="text-center px-4 mb-6">
          <p className="text-blue-100 text-[11px] font-bold tracking-widest uppercase mb-1">Total Wallet Balance</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-blue-200">KSh</span>
            <h2 className="text-3xl font-black text-white tracking-tight">
              {(walletBalance + (earnings?.total || 0)).toLocaleString()}
            </h2>
          </div>
        </div>

        {/* Scrollable Cards */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-4 snap-x">
          {/* Card 1: Trading Balance */}
          <div className="min-w-[280px] bg-blue-600 rounded-2xl p-5 border border-blue-400/20 snap-center ">
            <p className="text-blue-100 text-xs font-medium tracking-wide mb-1">Trading Balance</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xl font-bold text-blue-200">KSh</span>
              <h2 className="text-xl font-black text-white tracking-tight">{walletBalance.toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">Available for sourcing</span>
            </div>
          </div>

          {/* Card 2: Payout Balance */}
          <div className="min-w-[280px] bg-blue-600 rounded-2xl p-5 border border-blue-400/20 snap-center">
            <p className="text-blue-100 text-xs font-medium tracking-wide mb-1">Payout Balance</p>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-xl font-bold text-blue-200">KSh</span>
              <h2 className="text-xl font-black text-white tracking-tight">{(earnings?.total || 0).toLocaleString()}</h2>
            </div>
            <div className="bg-white/10 px-3 py-1.5 rounded-full inline-flex items-center gap-1">
              <ArrowUpFromLine className="w-3 h-3 text-blue-200" />
              <span className="text-[10px] text-white font-bold uppercase tracking-widest">Ready to withdraw</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-6 px-4 gap-3">
          <button onClick={() => setActiveFlow('deposit')} className="flex-1 py-3.5 bg-blue-600 text-white border border-blue-600 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95  font-black">
            <ArrowDownToLine className="w-4 h-4" />
            <span className="text-xs tracking-wide">Deposit</span>
          </button>
          
          <button onClick={() => setActiveFlow('withdraw')} className="flex-1 py-3.5 bg-blue-600 text-white border border-blue-600 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95  font-black">
            <ArrowUpFromLine className="w-4 h-4" />
            <span className="text-xs tracking-wide">Withdraw</span>
          </button>

          <button onClick={() => navigate('/payout-history')} className="flex-1 py-3.5 bg-blue-600 text-white border border-blue-600 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95  font-black">
            <History className="w-4 h-4" />
            <span className="text-xs tracking-wide">History</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-1.5 mt-2 space-y-6 relative z-10">
        {/* Recent Transactions */}
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[1rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Recent Transactions</h3>
            <button onClick={() => navigate('/payout-history')} className="text-xs font-semibold text-emerald-600">See All</button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl">
            {['all', 'deposit', 'withdrawal'].map(tab => (
              <button 
                key={tab}
                onClick={() => setTxTab(tab as any)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${txTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                {tab === 'deposit' ? 'Deposits' : tab === 'withdrawal' ? 'Withdrawals' : 'All'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {MOCK_TRANSACTIONS.filter(tx => txTab === 'all' || tx.type === txTab).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'deposit' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                    {tx.type === 'deposit' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{tx.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${tx.type === 'deposit' ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}KSh {tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Payouts Trend Bargraph */}
        <div className="pb-2">
          <PayoutsBarchart />
        </div>
      </div>


      <AnimatePresence>
        {renderFlowSheet()}
      </AnimatePresence>
    </div>
  );
}
