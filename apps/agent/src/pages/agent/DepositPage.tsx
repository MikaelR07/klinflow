/**
 * Agent Wallet Deposit Page
 * Separate views for Independent Agents and Fleet Drivers
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Loader2, ShieldCheck, Zap, TrendingUp,
  Building2, Send, FileText, Clock, CheckCircle2, AlertCircle, History, ArrowDownToLine, ArrowUpFromLine,
  BanknoteArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function DepositPage() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const depositToWallet = useAuthStore(s => s.depositToWallet);
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const earnings = useAgentStore(s => s.earnings);

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  // Fleet driver specific
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [companyBalance, setCompanyBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [requestsTab, setRequestsTab] = useState<'all' | 'approved' | 'rejected' | 'payouts'>('all');



  useEffect(() => {
    fetchProfile();
    if (isFleetDriver && profile?.companyId) {
      fetchCompanyBalance();
      fetchRecentRequests();
    }
  }, [profile?.id]);

  const fetchCompanyBalance = async () => {
    if (!profile?.companyId) return;
    setIsLoadingBalance(true);
    try {
      const { data, error } = await supabase
        .from('user_wallets')
        .select('cash_balance')
        .eq('user_id', profile.companyId)
        .maybeSingle();
      if (!error && data) {
        setCompanyBalance(data.cash_balance);
      }
    } catch (err) {
      console.error('Failed to fetch company balance:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const fetchRecentRequests = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('fund_requests')
        .select('*')
        .eq('driver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };



  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a positive amount to deposit.' });
      return;
    }

    setIsDepositing(true);
    try {
      await depositToWallet(amount);
      toast.success('Deposit Successful! 💸', { description: `KSh ${amount.toLocaleString()} added to your wallet.` });
      setDepositAmount('');
      if (isFleetDriver) fetchCompanyBalance();
    } catch (err: any) {
      toast.error('Deposit Failed', { description: err.message });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleRequestFunds = async () => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount');
      return;
    }

    if (!profile?.id || !profile?.companyId) {
      toast.error('Identity Error', { description: 'Your profile information is not fully loaded.' });
      return;
    }

    setIsRequesting(true);
    try {
      const { error } = await supabase.from('fund_requests').insert([{
        driver_id: profile.id,
        company_id: profile.companyId,
        amount,
        reason: requestReason,
        status: 'pending'
      }]);

      if (error) throw error;

      toast.success('Request Sent! 📩', { description: 'Your company owner has been notified.' });
      setRequestAmount('');
      setRequestReason('');
      fetchRecentRequests();
    } catch (err: any) {
      toast.error('Request Failed', { description: err.message });
    } finally {
      setIsRequesting(false);
    }
  };

  const quickAmounts = [1000, 2000, 5000, 7500, 10000];

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-800 relative overflow-x-hidden ">
      
      {/* DEPOSIT MODAL */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsDepositModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Request Funds</h3>
                    <p className="text-[12px] text-slate-400 font-medium">Ask company owner</p>
                  </div>
                </div>
                <button onClick={() => setIsDepositModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center active:scale-90 transition-transform text-slate-500 font-bold">✕</button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Amount Requested</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">KSh</div>
                    <input
                      type="number"
                      min="0"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-14 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-xl font-bold text-slate-900 dark:text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Reason / Purpose</label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="e.g. Buying HDPE from residents"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white min-h-[80px] resize-none outline-none transition-colors"
                  />
                </div>

                <button
                  disabled={isRequesting || !requestAmount || parseFloat(requestAmount) <= 0}
                  onClick={async () => {
                    await handleRequestFunds();
                    setIsDepositModalOpen(false);
                  }}
                  className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Request</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── TOP SECTION: BLUE WITH ROUNDED BOTTOM ── */}
      <div className="bg-blue-700 pt-[calc(env(safe-area-inset-top,1.5rem)+7.5rem)] pb-6 rounded-b-[2rem] shadow-sm relative z-20">
        
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-700/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center gap-3 shadow-sm">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Fleet Agent Wallet</h1>
          </div>
        </div>

        {/* Centered Balance */}
        <div className="text-center px-4 mb-6">
          <p className="text-[11px] font-bold text-blue-100/70 uppercase tracking-widest mb-1.5">Available Balance</p>
          <div className="flex items-baseline justify-center gap-1 text-white">
            <span className="text-xl font-bold">KSh</span>
            <span className="text-3xl font-black leading-none">
              {(profile?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-3 px-4 mt-4">
          <button onClick={() => setIsDepositModalOpen(true)} className="flex-1 py-3.5 px-2 bg-blue-600 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-blue-600 shadow-inner backdrop-blur-sm">
            <ArrowDownToLine className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white tracking-wider uppercase">Deposit</span>
          </button>

          <button onClick={() => navigate('/payout-history')} className="flex-1 py-3.5 px-2 bg-blue-600 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-blue-600">
            <History className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white tracking-wider uppercase">History</span>
          </button>
        </div>
      </div>

      <div className="relative z-10 px-1.5 mt-6 max-w-lg mx-auto space-y-6">

        {/* ── DEPOSIT SECTION (INDIVIDUAL AGENTS) ── */}
        {/* Note: Individual agents deposit through the AgentWallet page now */}

        {/* ── FLEET DRIVER: DEPOSIT + REQUEST ── */}
        {isFleetDriver && (
          <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-[1rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-white">Recent Requests</h3>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1 mb-5 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                    { id: 'payouts', label: 'Payouts' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setRequestsTab(tab.id as any)}
                      className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-lg transition-all ${requestsTab === tab.id ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {recentRequests.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">No requests yet</div>
                  ) : recentRequests.filter(req => requestsTab === 'all' || req.status === requestsTab).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs font-medium">No {requestsTab} requests</div>
                  ) : (
                    recentRequests.filter(req => requestsTab === 'all' || req.status === requestsTab).map((req, i) => {
                      const statusIcon = req.status === 'approved' ? CheckCircle2 : req.status === 'rejected' ? AlertCircle : Clock;
                      const StatusIcon = statusIcon;
                      const statusColor = req.status === 'approved'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                        : req.status === 'rejected'
                          ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
                          : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';

                      return (
                        <div key={req.id || i} className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${statusColor}`}>
                              <BanknoteArrowDown className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col justify-center min-w-0">
                              <p className="text-[12px] font-medium text-slate-900 dark:text-white leading-none">
                                KSh {Number(req.amount).toLocaleString()}
                              </p>
                              {req.reason && (
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                                  <span className="text-slate-400 dark:text-slate-500">Note:</span> {req.reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end gap-1">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${req.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : req.status === 'rejected' ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                              {req.status}
                            </span>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                              {new Date(req.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {new Date(req.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
                
            {/* Fleet Info */}
            <div className="bg-blue-600  border border-blue-700 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <p className="text-[12px] font-bold text-white">Fleet Driver Info</p>
                  <p className="text-[10px] text-white leading-relaxed">As a fleet driver, you can't deposit directly but you can request funds from your company. Requested funds must be approved by your company admin before they appear in your wallet.</p>
                </div>
              </div>
            </div>

          </div>
        )}


      </div>
    </div>
  );
}
