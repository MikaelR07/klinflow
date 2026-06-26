import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { 
  Wallet, Plus, X, Loader2, ArrowUpRight, ArrowDownLeft, 
  Activity, Receipt,ArrowLeft, TrendingUp, Search, Moon, Bell, ChevronDown,
  Info, BarChart2, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Dot
} from 'recharts';
import PayoutsBarchart from './PayoutsBarchart';

export default function OwnerFinance() {
  const navigate = useNavigate();
  const { profile, fetchProfile, depositToWallet } = useAuthStore();
  const { earnings, fetchEarnings } = useAgentStore();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchEarnings();
  }, [fetchProfile, fetchEarnings]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a positive amount to deposit.' });
      return;
    }

    setIsDepositing(true);
    try {
      await depositToWallet(amount);
      toast.success('Deposit Successful! 💸', { description: `KSh ${amount.toLocaleString()} added to your company wallet.` });
      setShowDepositModal(false);
      setDepositAmount('');
      fetchProfile();
    } catch (err: any) {
      toast.error('Deposit Failed', { description: err.message });
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 animate-in fade-in duration-300">
      
      {/* ── TOP NAVIGATION ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="p-2 -ml-2 bg-[#F8F8FF] dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-wide">Finance</h1>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-100 mt-0.5">manage your company funds and payouts</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-emerald-600 active:scale-95 transition-all">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[10px] font-bold">Reports</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+6rem)] px-1.5 pb-5 space-y-5">
        
        {/* ── HERO STATS ── */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-[1rem] p-5  text-white relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.07]">
            <Wallet className="w-40 h-40" />
          </div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100 mb-1">Company Balance</p>
              <p className="text-3xl font-black">
                <span className="text-sm font-bold opacity-80 mr-1">KES</span>
                {(profile?.walletBalance || 70002).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-100 mb-1">Total Disbursed</p>
              <p className="text-sm font-black text-emerald-50">
                KES {(earnings?.totalPayout || 45000).toLocaleString()}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowDepositModal(true)}
            className="w-full py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-xl font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-2 transition-all active:scale-[0.98] relative z-10"
          >
            <Plus className="w-4 h-4" /> Make a Deposit
          </button>
        </div>

        {/* ── FINANCE OVERVIEW ── */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white px-1">Finance Overview</h3>
          <div className="overflow-x-auto no-scrollbar -mx-1.5 px-1.5 pb-2">
            <div className="flex gap-2 w-max">
              {[
                { label: 'Collections', amount: 120450, trend: '↑ 18%', isPositive: true, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Total Disbursed', amount: 45000, trend: '↑ 10%', isPositive: true, icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Wallet Balance', amount: 70002, trend: '↑ 5%', isPositive: true, icon: Wallet, color: 'text-violet-500', bg: 'bg-violet-50' },
                { label: 'Reimbursements  ', amount: 8250, trend: '↓ 3%', isPositive: false, icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-50' },
              ].map((item, i) => (
                <div key={i} className="w-[140px] bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-3 shadow-sm shrink-0 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-500 mb-1 truncate">{item.label}</p>
                    <p className="text-[12px] font-bold text-slate-900 dark:text-white mb-0.5 truncate">KES {(item.amount/1000).toFixed(1)}k</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold ${item.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{item.trend}</span>
                    </div>
                  </div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg} dark:bg-opacity-10`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PAYOUT TRENDS CHART ── */}
        <PayoutsBarchart />

        {/* ── RECENT TRANSACTIONS ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Transactions</h3>
            <button className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">View All <ArrowLeft className="w-3 h-3 rotate-180" /></button>
          </div>
          
          <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-1">
            {[
              { id: 1, type: 'Payout', title: 'Agent Payout', agent: 'John Doe', amount: -2450, date: 'Today, 10:42 AM' },
              { id: 2, type: 'Deposit', title: 'Wallet Top-up', agent: 'Company Card', amount: 50000, date: 'Yesterday, 2:15 PM' },
              { id: 3, type: 'Payout', title: 'Agent Payout', agent: 'Sarah W.', amount: -1800, date: 'Yesterday, 1:30 PM' },
              { id: 4, type: 'Payment', title: 'Payment Received', agent: 'Client Payment', amount: 8500, date: 'May 30, 9:10 AM' },
              { id: 5, type: 'Fee', title: 'System Fee', agent: 'Service Charge', amount: -450, date: 'May 30, 8:05 AM' },
            ].map((tx, i) => (
              <div key={tx.id} className={`flex items-center gap-3 p-3 transition-all ${i !== 4 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'Payment' ? 'bg-amber-50 text-amber-500 dark:bg-amber-500/10' :
                  tx.type === 'Fee' ? 'bg-blue-50 text-blue-500 dark:bg-blue-500/10' :
                  tx.amount > 0 ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10' : 'bg-rose-50 text-rose-500 dark:bg-rose-500/10'
                }`}>
                  {tx.type === 'Payment' ? <Wallet className="w-5 h-5" /> : 
                   tx.type === 'Fee' ? <ArrowDownLeft className="w-5 h-5" /> :
                   tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{tx.title}</p>
                  <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">{tx.agent}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-black ${
                    tx.amount > 0 ? 'text-emerald-500' : 'text-slate-800 dark:text-white'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount < 0 ? '-' : ''}KES {Math.abs(tx.amount).toLocaleString()}
                  </p>
                  <p className="text-[9px] font-medium text-slate-400 mt-0.5">{tx.date}</p>
                </div>
                <button className="p-1 pl-2 text-slate-300">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── DEPOSIT MODAL ── */}
        <AnimatePresence>
          {showDepositModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDepositModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden p-6 sm:p-8 border border-slate-100 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Wallet Deposit</h3>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center active:scale-90 transition-transform"
                  >
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-2 block">Enter Amount (KSh)</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">KSh</div>
                      <input
                        type="number"
                        autoFocus
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-2xl font-black text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <button
                    disabled={isDepositing || !depositAmount}
                    onClick={handleDeposit}
                    className="w-full h-16 bg-emerald-600 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                  >
                    {isDepositing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Deposit'}
                  </button>

                  <p className="text-[9px] font-bold uppercase tracking-widest text-center text-slate-400">
                    Secured by Klinflow Payment Gateway
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
