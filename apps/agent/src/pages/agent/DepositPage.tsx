/**
 * Agent Wallet Deposit Page
 * Separate views for Independent Agents and Fleet Drivers
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet, Loader2, ShieldCheck, Zap, TrendingUp,
  Building2, Send, FileText, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
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

  // Fleet driver specific
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [companyBalance, setCompanyBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);



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
        .from('profiles')
        .select('wallet_balance')
        .eq('id', profile.companyId)
        .single();
      if (!error && data) {
        setCompanyBalance(data.wallet_balance);
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
    <div className="min-h bg-slate-50 dark:bg-slate-800">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-900">
        <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0.5rem)+1rem)] pb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {isFleetDriver ? 'Fleet Wallet' : 'Agent Wallet'}
          </h1>
          <div className="w-10" /> {/* spacer */}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-lg mx-auto px-1.5 pt-[calc(env(safe-area-inset-top,0.5rem)+4rem)] pb-5 space-y-5">

        {/* ── WALLET BALANCE CARD ── */}
        <div className="bg-gradient-to-b from-primary  to-emerald-800 rounded-[1rem] p-4 text-white relative overflow-hidden">

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-[0.2em]">Current Balance</p>
                <p className="text-[10px] font-medium text-emerald-300/70">{profile?.name || 'Agent'}</p>
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-lg font-bold text-emerald-300">KSh</span>
              <h2 className="text-4xl font-black tracking-tight">
                {(profile?.walletBalance || 0).toLocaleString()}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-200/80">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Klinflow Payment Gateway
            </div>
          </div>
        </div>

        {/* ── DEPOSIT SECTION (INDIVIDUAL AGENTS) ── */}
        {!isFleetDriver && (
          <div className="bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Deposit Funds</h3>
                <p className="text-[10px] text-slate-400 font-medium">Add money to your agent wallet</p>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map(amt => (
                <button
                  key={amt}
                  onClick={() => setDepositAmount(amt.toString())}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${depositAmount === amt.toString()
                    ? 'bg-emerald-600 text-white  shadow-emerald-500/20'
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
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500/30 focus:border-primary text-2xl font-bold text-slate-900 dark:text-white outline-none transition-colors"
                />
              </div>
            </div>

            {/* Confirm Button */}
            <button
              disabled={isDepositing || !depositAmount || parseFloat(depositAmount) <= 0}
              onClick={handleDeposit}
              className="w-full h-14 bg-gradient-to-r from-primary to-emerald-500 text-white rounded-2xl font-bold text-sm tracking-wide  active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isDepositing ? (
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
            <div className="bg-amber-700 dark:bg-amber-700 border border-amber-600 dark:border-amber-700 rounded-xl p-4 space-y-2">
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

        {/* ── FLEET DRIVER: DEPOSIT + REQUEST ── */}
        {isFleetDriver && (
          <div className="space-y-5">
            {/* Request Funds from Company */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Send className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Request Company Funds</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Ask your company owner to fund your wallet</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Amount Requested</label>
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
                  <label className="text-[10px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Reason / Purpose</label>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="e.g. Buying HDPE from residents"
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white min-h-[100px] resize-none outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                disabled={isRequesting || !requestAmount || parseFloat(requestAmount) <= 0}
                onClick={handleRequestFunds}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRequesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Send Request</>}
              </button>

              {/* Recent Requests */}
              {recentRequests.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 px-1">Recent Requests</p>
                  {recentRequests.map((req, i) => {
                    const statusIcon = req.status === 'approved' ? CheckCircle2 : req.status === 'rejected' ? AlertCircle : Clock;
                    const StatusIcon = statusIcon;
                    const statusColor = req.status === 'approved'
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : req.status === 'rejected'
                        ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
                        : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';

                    return (
                      <div key={req.id || i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColor}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">KSh {Number(req.amount).toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{req.reason || 'No reason'}</p>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColor}`}>
                          {req.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fleet Info */}
            <div className="bg-amber-600  border border-amber-700 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-white">Fleet Driver Info</p>
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
