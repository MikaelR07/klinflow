import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, Wallet, Phone, Contact,
  CheckCircle2, Leaf, User, Tag, Clock, Users,
  ChevronRight, Send, Lock, ArrowLeftRight, Loader2, X, AlertCircle, Search,
  ShieldCheck, Star
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, WalletRecipientSearchResult, TransferResult, WALLET_CONFIG } from '@klinflow/core';
import { toast } from 'sonner';

export default function TransferGFP() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(0);

  // Wizard state
  const [step, setStep] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');

  const maskPhone = (p?: string) => {
    if (!p) return '';
    if (p.length >= 10) return `${p.slice(0, 2)}****${p.slice(-4)}`;
    if (p.length > 4) return `${p.slice(0, 2)}***`;
    return p;
  };
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchedRecipient, setSearchedRecipient] = useState<WalletRecipientSearchResult | null>(null);
  const [recipient, setRecipient] = useState<WalletRecipientSearchResult | null>(null);
  
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  const transferAmount = Number(amount) || 0;

  useEffect(() => {
    if (userId) {
      walletService.getWalletDetails(userId).then(data => {
        if (data) setWalletBalance(data.available_points);
      });
    }
  }, [userId]);

  const searchUser = async () => {
    if (!searchQuery || searchQuery.length < 5) return toast.error('Enter a valid Klinflow ID to search');
    setIsSearching(true);
    setSearchAttempted(true);
    setSearchedRecipient(null);
    try {
      const result = await walletService.searchRecipient(searchQuery);
      setSearchedRecipient(result);
    } catch (err) {
      setSearchedRecipient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const selectRecipient = (user: WalletRecipientSearchResult) => {
    setRecipient(user);
    toast.success(`${user.full_name} selected`);
    setStep(2);
  };

  const handleNextStep1 = () => {
    if (!recipient) return toast.error('Please select a valid recipient');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!amount || transferAmount < WALLET_CONFIG.MIN_TRANSFER_POINTS) return toast.error(`Minimum transfer amount is ${WALLET_CONFIG.MIN_TRANSFER_POINTS} GFP`);
    if (transferAmount > walletBalance) return toast.error('Insufficient GFP balance');
    setStep(3);
  };

  const executeTransfer = async () => {
    if (!recipient) return;
    
    setIsProcessing(true);
    const result = await walletService.transferPoints(recipient.user_id, transferAmount, 'Transfer from App');
    setIsProcessing(false);

    if (result.success) {
      setTransferResult(result);
      if (result.sender_balance_after !== undefined) {
         setWalletBalance(result.sender_balance_after);
      }
    } else {
      toast.error('Transfer Failed', { description: result.error });
    }
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-800 text-slate-900 dark:text-white pb-8 relative overflow-x-hidden min-h-screen">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary  backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 transition-all duration-300">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-95 transition-all border border-white/20 shadow-sm z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Transfer GFP</h1>
            <p className="text-[9px] text-white/75 font-medium tracking-wider capitalize mt-0.5">Share tokens with friends & family</p>
          </div>

          <button 
            onClick={() => navigate('/wallet-history')}
            className="z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">History</span>
          </button>
        </div>
      </div>

      {/* ── TOP SECTION: BACKGROUND COLOR WITH BANNER CARD ── */}
      <div className="bg-primary  text-white rounded-b-[1.75rem] relative overflow-hidden pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 px-4 shadow-md">
        {/* Subtle decorative background shapes */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-teal-300/15 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-lg mx-auto">
          {/* BANNER CARD */}
          <div className="bg-primary dark:bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-xl relative overflow-hidden">
            {/* Background watermark icon */}
            <Send className="absolute -top-4 -right-4 w-36 h-36 text-white/[0.09] rotate-12 pointer-events-none" />

            <div className="relative z-10">
              {/* Top Left Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide uppercase mb-3.5 shadow-sm border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                <span>Your points. Your power</span>
              </div>

              <div className="mb-3">
                <p className="text-3xl font-extrabold text-white leading-none tracking-tight">Transfer Your</p>
                <p className="text-3xl font-extrabold text-Primary leading-none tracking-tight mt-1">Green Fuel Points</p>
              </div>

              <p className="text-[10px] font-bold text-white/75 uppercase tracking-widest mb-1">YOU HAVE</p>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                <span className="text-2xl font-black text-white leading-none tracking-tight">
                  {walletBalance.toLocaleString()}
                </span>
                <span className="text-sm font-bold text-white/90">points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL SECTION: DIRECTLY ON THE PAGE ── */}
      <div className="max-w-lg mx-auto px-6 pt-6 space-y-6 relative z-10">

        {/* POLISHED STEP INDICATOR */}
        <div className="flex items-center justify-between mb-6 relative px-4">
          {/* Background track */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
          {/* Active track */}
          <div
            className="absolute left-8 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 z-0 transition-all duration-500 ease-out"
            style={{ right: step === 1 ? '66%' : step === 2 ? '33%' : '8px' }}
          />

          {[
            { num: 1, label: 'Recipient' },
            { num: 2, label: 'Amount' },
            { num: 3, label: 'Confirm' }
          ].map((s) => (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300 ${
                step >= s.num
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700'
              }`}>
                {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider absolute -bottom-5 whitespace-nowrap transition-colors duration-300 ${
                step >= s.num ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2">
            {/* STEP 1: RECIPIENT */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Who are you sending to?</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Search by Klinflow ID</p>
                </div>

                {!recipient ? (
                  <>
                    <div className="mb-4">
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Contact className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value.toUpperCase());
                            setSearchAttempted(false);
                            setSearchedRecipient(null);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') searchUser(); }}
                          placeholder="e.g. KPT123456"
                          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-4 text-[14px] font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        />
                      </div>
                    </div>

                    <button
                      onClick={searchUser}
                      disabled={isSearching || searchQuery.length < 5}
                      className="w-full mb-6 h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold tracking-wide disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-[0.98] cursor-pointer"
                    >
                      {isSearching ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : (
                        <>
                          <Search className="w-4 h-4" />
                          Search Recipient
                        </>
                      )}
                    </button>

                    {!searchQuery && !searchAttempted && (
                      <div className="flex items-start gap-2 pt-2 text-slate-500 dark:text-slate-400 animate-in fade-in duration-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] leading-relaxed">
                          Ensure the recipient has a <strong>verified Klinflow account</strong> before transferring GFP.
                        </p>
                      </div>
                    )}

                    {searchAttempted && !isSearching && (
                      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {searchedRecipient ? (
                          <div
                            className="py-3 px-2 rounded-xl border-y border-dashed border-emerald-500/30 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all cursor-pointer flex items-center gap-3.5"
                            onClick={() => selectRecipient(searchedRecipient)}
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold shrink-0 overflow-hidden">
                              {searchedRecipient.avatar ? (
                                <img src={searchedRecipient.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                searchedRecipient.full_name.charAt(0)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-[15px] font-bold text-slate-900 dark:text-white truncate leading-none">{searchedRecipient.full_name}</h4>
                                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-full shrink-0">
                                  {searchedRecipient.account_type.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 tracking-wide leading-none">{maskPhone(searchedRecipient.phone)}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <ChevronRight className="w-4.5 h-4.5" />
                            </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center">
                            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-900/20 mx-auto flex items-center justify-center mb-2">
                              <AlertCircle className="w-5 h-5 text-rose-500" />
                            </div>
                            <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400">User Not Found</p>
                            <p className="text-[11px] font-medium text-slate-400 mt-0.5">Please check the ID and try again.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="pt-2 pb-4 border-b border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sending to</span>
                        <button
                          onClick={() => {
                            setRecipient(null);
                            setSearchedRecipient(null);
                            setSearchAttempted(false);
                          }}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 active:opacity-60 transition-opacity cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Change
                        </button>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold overflow-hidden shadow-sm shrink-0">
                          {recipient.avatar ? <img src={recipient.avatar} alt="avatar" className="w-full h-full object-cover" /> : recipient.full_name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight truncate">{recipient.full_name}</h4>
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold uppercase tracking-wider rounded-full shrink-0">
                              {recipient.account_type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 tracking-wide leading-none">{maskPhone(recipient.phone)}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleNextStep1}
                      className="w-full mt-6 py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
                    >
                      Continue <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: AMOUNT */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setStep(1)} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight leading-tight">Enter Amount</h3>
                  </div>
                </div>

                <div className="flex-1 flex flex-col py-2">
                  <div className="w-full mb-6">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Amount to Send</label>
                    <div className="relative w-full group">
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-[13px] font-bold text-slate-400 dark:text-slate-500">GFP</span>
                      </div>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={amount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || Number(val) >= 0) setAmount(val);
                        }}
                        placeholder="0.00"
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-4 pr-14 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6 w-full">
                    {[50, 100, 200, walletBalance].filter(v => v > 0 && v <= walletBalance).map((val, idx) => {
                      const isMax = idx === 3 || val === walletBalance;
                      const label = isMax ? 'Max' : `+${val}`;
                      const isSelected = transferAmount === val;
                      return (
                        <button
                          key={label}
                          onClick={() => setAmount(val.toString())}
                          className={`px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button 
                  onClick={handleNextStep2} 
                  disabled={transferAmount < WALLET_CONFIG.MIN_TRANSFER_POINTS || transferAmount > walletBalance} 
                  className="w-full mt-auto py-4 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer"
                >
                  Review Transfer <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            {/* STEP 3: SUMMARY */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <button onClick={() => setStep(2)} className="p-2 bg-slate-50 dark:bg-slate-900 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all">
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </button>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Confirm Details</h3>
                </div>

                {/* Recipient */}
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 overflow-hidden flex items-center justify-center shrink-0 shadow-sm text-emerald-600 dark:text-emerald-400 font-bold">
                    {recipient?.avatar ? <img src={recipient.avatar} alt="avatar" className="w-full h-full object-cover" /> : recipient?.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sending To</p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{recipient?.full_name}</h4>
                  </div>
                </div>

                {/* Transfer details — flat, no card */}
                <div className="space-y-3.5 mb-5">
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Transfer Amount</span>
                    <span className="font-bold text-slate-900 dark:text-white">{transferAmount.toLocaleString()} GFP</span>
                  </div>
                  <div className="flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Network Fee</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">Free</span>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-3.5 flex justify-between items-center text-[13px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Balance After</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{(walletBalance - transferAmount).toLocaleString()} GFP</span>
                  </div>
                </div>

                {/* Total Deducted */}
                <div className="border-t-2 border-slate-200/80 dark:border-slate-700 pt-3.5 flex justify-between items-end mb-6">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Deducted</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-white leading-none">{transferAmount.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-400">GFP</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Lock className="w-3 h-3 text-emerald-500" />
                    <span>Secured by Klinflow</span>
                  </div>
                  <button
                    onClick={executeTransfer}
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                      <>Send Now <Send className="w-4 h-4 ml-1" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* SECURE INDICATOR */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-6">
          <Lock className="w-3 h-3" />
          <span>Secure • Instant • Free</span>
        </div>

      </div>

      {/* SUCCESS MODAL OVERLAY — portaled to body */}
      {transferResult?.success && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-[370px] bg-white dark:bg-slate-900 rounded-[2rem] p-6 text-center relative overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
            {/* Subtle top ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Success Icon */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-4 border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Status Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Transfer Complete
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Transfer Successful!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Points sent securely.</p>

              {/* Amount Hero Box */}
              <div className="my-5 py-4 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount Sent</span>
                <div className="flex items-baseline justify-center gap-1 mt-1 text-slate-900 dark:text-white">
                  <span className="text-3xl font-extrabold tracking-tight leading-none">
                    {transferResult.amount?.toLocaleString()}
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">GFP</span>
                </div>
              </div>

              {/* Receipt Details */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2.5 text-left mb-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Recipient</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recipient?.full_name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Transfer Fee</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                    Free (0 GFP)
                  </span>
                </div>
                <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-1" />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Reference No.</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white tracking-widest uppercase">
                    {transferResult.reference_number}
                  </span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Secured by Klinflow Wallet</span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/resident-wallet')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Return to Wallet
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
