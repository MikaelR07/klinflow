/**
 * Fleet Agent Wallet Page (DepositPage)
 * Matches WithdrawalPage blue header gradient with fintech Request Funds & Request Details modals.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, ShieldCheck,
  Building2, Send, Clock, CheckCircle2, AlertCircle, History,
  BanknoteArrowDown, ChevronRight, X, Receipt, Calendar, FileText,
  BanknoteArrowUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];
const QUICK_REASONS = ['Stock Purchase', 'Fuel & Transport', 'Hub Operations', 'Emergency'];

export default function DepositPage() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const fetchProfile = useAuthStore(s => s.fetchProfile);

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  // Fleet driver specific
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [requestsTab, setRequestsTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchProfile();
    if (isFleetDriver && profile?.companyId) {
      fetchRecentRequests();
    }
  }, [profile?.id]);

  const fetchRecentRequests = async () => {
    if (!profile?.id) return;
    try {
      const { data } = await supabase
        .from('fund_requests')
        .select('*')
        .eq('driver_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setRecentRequests(data);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    }
  };

  const handleRequestFunds = async (): Promise<boolean> => {
    const amount = parseFloat(requestAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount');
      return false;
    }

    if (!profile?.id || !profile?.companyId) {
      toast.error('Identity Error', { description: 'Your profile information is not fully loaded.' });
      return false;
    }

    setIsRequesting(true);
    try {
      const { error } = await supabase.from('fund_requests').insert([{
        driver_id: profile.id,
        company_id: profile.companyId,
        amount,
        reason: requestReason.trim(),
        status: 'pending'
      }]);

      if (error) throw error;

      toast.success('Request Sent!', { description: 'Your company owner has been notified.' });
      setRequestAmount('');
      setRequestReason('');
      fetchRecentRequests();
      return true;
    } catch (err: any) {
      toast.error('Request Failed', { description: err.message });
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const filteredRequests = recentRequests.filter(
    req => requestsTab === 'all' || req.status === requestsTab
  );

  const getStatusMeta = (status: string) => {
    if (status === 'approved') {
      return {
        label: 'Approved',
        Icon: CheckCircle2,
        iconBox: 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        pill: 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      };
    }
    if (status === 'rejected') {
      return {
        label: 'Rejected',
        Icon: AlertCircle,
        iconBox: 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
        pill: 'bg-rose-100/80 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
      };
    }
    return {
      label: 'Pending',
      Icon: Clock,
      iconBox: 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
      pill: 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    };
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white dark:bg-slate-800 min-h-screen relative overflow-x-hidden transition-colors pb-10">

      {/* ── REQUEST FUNDS MODAL (FINTECH SHEET) ── */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRequestModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl p-5 sm:p-6 border-t sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col"
            >
              {/* Drag Handle (Mobile) */}
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-50 dark:bg-sky-500/15 rounded-2xl flex items-center justify-center border border-sky-200/60 dark:border-sky-500/20">
                    <Send className="w-4 h-4 text-[#1178ab] dark:text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Request Funds</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Request working capital from your company</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount Requested</label>
                    <span className="text-[11px] font-medium text-slate-400">Kenyan Shillings</span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-bold text-slate-400 dark:text-slate-500 text-sm">KSh</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="decimal"
                      onKeyDown={(e) => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-14 pl-14 pr-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#1178ab]/20 focus:border-[#1178ab] text-2xl font-bold tabular-nums text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>

                  {/* Quick Amount Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {QUICK_AMOUNTS.map(amt => {
                      const isSelected = requestAmount === amt.toString();
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setRequestAmount(amt.toString())}
                          className={`py-2 rounded-xl text-[11px] font-bold tabular-nums transition-all active:scale-95 border ${
                            isSelected
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {amt.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Purpose / Reason */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Purpose</label>
                    <span className="text-[11px] font-medium text-slate-400">Optional</span>
                  </div>

                  {/* Quick Purpose Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REASONS.map(tag => {
                      const isSelected = requestReason === tag;
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setRequestReason(isSelected ? '' : tag)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-500/15 text-[#1178ab] dark:text-sky-400 border-[#1178ab]/30'
                              : 'bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-slate-700/60'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="e.g. Buying HDPE from residents in Westlands"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-[#1178ab]/20 focus:border-[#1178ab] text-xs font-medium text-slate-900 dark:text-white min-h-[76px] resize-none outline-none transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Submit CTA */}
                <button
                  disabled={isRequesting || !requestAmount || parseFloat(requestAmount) <= 0}
                  onClick={async () => {
                    const ok = await handleRequestFunds();
                    if (ok) setIsRequestModalOpen(false);
                  }}
                  className="w-full h-13 py-3.5 bg-gradient-to-r from-[#1178ab] to-[#085078] hover:opacity-95 text-white rounded-2xl font-bold text-sm tracking-wide active:scale-[0.98] transition-all disabled:opacity-45 flex items-center justify-center gap-2 mt-1"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {requestAmount && parseFloat(requestAmount) > 0
                          ? `Request KSh ${parseFloat(requestAmount).toLocaleString()}`
                          : 'Send Request'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REQUEST DETAILS MODAL ── */}
      <AnimatePresence>
        {selectedRequest && (() => {
          const meta = getStatusMeta(selectedRequest.status);
          const StatusIcon = meta.Icon;
          const createdDate = new Date(selectedRequest.created_at || Date.now());
          const updatedDate = selectedRequest.updated_at ? new Date(selectedRequest.updated_at) : null;
          const hasUpdated = updatedDate && Math.abs(updatedDate.getTime() - createdDate.getTime()) > 5000;

          return (
            <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedRequest(null)}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.98 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[26px] sm:rounded-3xl p-5 sm:p-6 border-t sm:border border-slate-200/80 dark:border-slate-800 shadow-2xl flex flex-col"
              >
                {/* Drag Handle (Mobile) */}
                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4 sm:hidden" />

                {/* Top Bar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Request Details
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform text-slate-500 dark:text-slate-400"
                    aria-label="Close details"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Amount & Status Summary */}
                <div className="text-center py-3 space-y-2.5">
                  <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${meta.iconBox}`}>
                    <BanknoteArrowUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-3xl font-semibold text-emerald-600 dark:text-white tabular-nums tracking-tight">
                      KSh {Number(selectedRequest.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 ${meta.pill}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>

                {/* Structured Details Card */}
                <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-3 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Reference ID</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      REQ-{(selectedRequest.id || '000000').toString().slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> Submitted
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {createdDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {hasUpdated && updatedDate && (
                    <>
                      <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Reviewed</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {updatedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />

                  <div className="space-y-1 text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" /> Purpose / Note
                    </span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {selectedRequest.reason?.trim() ? selectedRequest.reason : 'No reason provided'}
                    </p>
                  </div>

                  {(selectedRequest.admin_notes || selectedRequest.rejection_reason) && (
                    <>
                      <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />
                      <div className="space-y-1 text-xs">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Admin Response</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {selectedRequest.admin_notes || selectedRequest.rejection_reason}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full py-3.5 mt-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* ── FIXED TOP NAV (MATCHES WITHDRAWAL PAGE) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 transition-all duration-300 bg-gradient-to-br from-[#1178ab] to-[#085078] backdrop-blur-md">
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-95 transition-all border border-white/20 shadow-sm z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-semibold tracking-wide text-white leading-tight">Fleet Agent Wallet</h1>
          </div>
          <div className="w-10 h-10" />
        </div>
      </div>

      {/* ── TOP SECTION: OCEAN BLUE WITH ROUNDED BOTTOM (MATCHES WITHDRAWAL PAGE) ── */}
      <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] pt-[calc(env(safe-area-inset-top,1.5rem)+6.75rem)] pb-6 rounded-b-[1.5rem] relative z-20 overflow-hidden">
        {/* Centered Balance */}
        <div className="text-center px-4 mb-5">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Available Balance</p>
          <div className="flex items-baseline justify-center gap-1 text-white">
            <span className="text-xl font-bold">KSh</span>
            <span className="text-3xl font-bold leading-none tabular-nums">
              {(profile?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-center mt-3">
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" /> Company Fleet Wallet
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-center gap-3 px-4 max-w-lg mx-auto">
          <button
            onClick={() => setIsRequestModalOpen(true)}
            className="flex-1 py-3.5 px-3 bg-white/15 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/20"
          >
            <Send className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white tracking-wider uppercase">Request Funds</span>
          </button>

          <button
            onClick={() => navigate('/payout-history')}
            className="flex-1 py-3.5 px-3 bg-white/15 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-white/20"
          >
            <History className="w-4 h-4 text-white" />
            <span className="text-[11px] font-bold text-white tracking-wider uppercase">History</span>
          </button>
        </div>
      </div>

      {/* ── BODY CONTENT ── */}
      <div className="relative z-10 px-4 py-4 max-w-lg mx-auto space-y-4">
        {isFleetDriver && (
          <>
            {/* ── RECENT REQUESTS (MATCHES SELLER WALLET RECENT TRANSACTIONS) ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-slate-600 dark:text-white capitalize tracking-wider">
                  Recent Requests
                </h3>
                <button
                  onClick={() => navigate('/payout-history')}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide hover:underline cursor-pointer"
                >
                  View History
                </button>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'pending', label: 'Pending' },
                  { id: 'approved', label: 'Approved' },
                  { id: 'rejected', label: 'Rejected' }
                ].map(tab => {
                  const isActive = requestsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRequestsTab(tab.id as any)}
                      className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${
                        isActive
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                          : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Request Cards (slate-50, clickable -> modal) */}
              <div className="space-y-2">
                {recentRequests.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <BanknoteArrowDown className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">No requests yet</p>
                    <p className="text-[10px] font-semibold text-slate-400/70 dark:text-slate-500 mb-4">
                      Fund requests to your company admin will appear here
                    </p>
                    <button
                      onClick={() => setIsRequestModalOpen(true)}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                    >
                      Request Funds
                    </button>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No {requestsTab} requests</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Switch tabs to view other requests</p>
                  </div>
                ) : (
                  filteredRequests.map((req, i) => {
                    const meta = getStatusMeta(req.status);
                    const StatusIcon = meta.Icon;
                    const amountColor =
                      req.status === 'approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : req.status === 'rejected'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white';
                    const rowTitle =
                      req.status === 'approved'
                        ? 'Funds Approved'
                        : req.status === 'rejected'
                        ? 'Request Declined'
                        : 'Fund Request';

                    return (
                      <button
                        key={req.id || i}
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="w-full text-left px-4 py-4 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl hover:bg-slate-100/80 dark:hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${meta.iconBox}`}>
                            <BanknoteArrowUp className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-slate-900 dark:text-white truncate leading-tight">
                              {rowTitle}
                            </p>
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              {new Date(req.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {new Date(req.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className={`text-[13px] font-semibold tabular-nums leading-tight ${amountColor}`}>
                              {req.status === 'approved' ? '+' : ''}KSh {Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 ${meta.pill}`}>
                              {meta.label}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* ── FLEET DRIVER INFO CARD ── */}
            <div className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100/80 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-[#1178ab] dark:text-sky-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Fleet Driver Info</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    As a fleet driver, you request working funds directly from your company. Approved funds are credited to your wallet automatically.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
