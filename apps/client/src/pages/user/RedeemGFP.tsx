/**
 * RedeemGFP — Production-grade points redemption page
 * Rebuilt as a Rewards Store based on the Bonga Points model
 * Supports dynamic KES amount input based on Providers
 */
import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gift, Phone, AlertCircle,
  Wallet, Loader2,
  X, CheckCircle2, Copy, Clock,
  ChevronRight, Leaf, Zap, Flame,
  Star
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, REWARDS_CATALOG, RewardItem, RedemptionResult } from '@klinflow/core';
import { toast } from 'sonner';

type ViewState = 'catalog' | 'confirm' | 'processing' | 'success';

export default function RedeemGFP() {
  const navigate = useNavigate();
  const { userId, profile } = useAuthStore();
  const [gfpBalance, setGfpBalance] = useState(0);
  const [pointsLastEarnedAt, setPointsLastEarnedAt] = useState<string | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  
  // Custom Input State
  const [inputKesAmount, setInputKesAmount] = useState<string>('');
  
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendTo, setSendTo] = useState<'me' | 'other'>('me');
  const [activeTab, setActiveTab] = useState<'all' | 'airtime' | 'voucher'>('all');

  const [viewState, setViewState] = useState<ViewState>('catalog');
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  // Fetch real wallet balance
  useEffect(() => {
    if (userId) {
      setIsLoadingWallet(true);
      walletService.getWalletDetails(userId).then((data: any) => {
        if (data) {
          setGfpBalance(data.available_points || 0);
          setPointsLastEarnedAt(data.points_last_earned_at || null);
        }
        setIsLoadingWallet(false);
      });
    }
  }, [userId]);

  const filteredRewards = useMemo(() => {
    return REWARDS_CATALOG.filter((r: RewardItem) => r.enabled && (activeTab === 'all' || r.category === activeTab));
  }, [activeTab]);

  // Check for upcoming expiry (points older than 5 months warn the user)
  const isExpiringSoon = useMemo(() => {
    if (!pointsLastEarnedAt || gfpBalance === 0) return false;
    const earnedDate = new Date(pointsLastEarnedAt);
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 5);
    return earnedDate < fiveMonthsAgo;
  }, [pointsLastEarnedAt, gfpBalance]);

  // Calculate dynamic costs
  const kesValueNum = parseInt(inputKesAmount) || 0;
  const totalGfpCost = selectedReward ? Math.ceil(kesValueNum / selectedReward.gfp_to_kes_rate) : 0;
  
  const isValidAmount = selectedReward && kesValueNum > 0 && totalGfpCost >= selectedReward.min_gfp && totalGfpCost <= gfpBalance;
  const errorMsg = selectedReward 
    ? (totalGfpCost > gfpBalance ? 'Insufficient GFP balance' : (totalGfpCost > 0 && totalGfpCost < selectedReward.min_gfp ? `Minimum is ${(selectedReward.min_gfp * selectedReward.gfp_to_kes_rate)} KES` : ''))
    : '';

  const handleCardClick = (reward: RewardItem) => {
    if (gfpBalance < reward.min_gfp) return;
    setSelectedReward(reward);
    setInputKesAmount(''); // Reset input
    setViewState('confirm');
    setRedemptionResult(null);
    setShowModal(true);
  };

  const setMaxAmount = () => {
    if (!selectedReward) return;
    const maxKes = Math.floor(gfpBalance * selectedReward.gfp_to_kes_rate);
    setInputKesAmount(maxKes.toString());
  };

  const handleRedeem = async () => {
    if (!selectedReward || !isValidAmount) return;
    
    const finalPhone = sendTo === 'me' ? profile?.phone : phoneNumber;
    
    if (selectedReward.requires_phone && (!finalPhone || finalPhone.length < 10)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setViewState('processing');

    const result = await walletService.redeemPoints({
      type: selectedReward.category,
      amount: totalGfpCost,
      payout_method: selectedReward.payout_method,
      phone: selectedReward.requires_phone ? finalPhone : undefined,
    });

    setRedemptionResult(result);

    if (result.success) {
      setViewState('success');
      setGfpBalance(prev => prev - totalGfpCost);
    } else {
      setViewState('confirm');
      toast.error(result.error || 'Redemption failed. Please try again.');
    }
  };

  const handleDone = () => {
    setShowModal(false);
    setSelectedReward(null);
    setInputKesAmount('');
    setViewState('catalog');
    setRedemptionResult(null);
  };

  const copyRef = () => {
    if (redemptionResult?.reference_number) {
      navigator.clipboard.writeText(redemptionResult.reference_number);
      toast.success('Reference copied!');
    }
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-800 text-slate-900 dark:text-white pb-8 relative overflow-x-hidden min-h-screen">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-tr from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:to-amber-700 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 transition-all duration-300">
        <div className="max-w-lg mx-auto px-4 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-95 transition-all border border-white/20 shadow-sm z-10 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Redeem GFP</h1>
            <p className="text-[9px] text-white/75 font-medium tracking-wider capitalize mt-0.5">Turn green fuel points into rewards</p>
          </div>

          <button 
            onClick={() => navigate('/redemption-history')}
            className="z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-sm border border-white/20 shadow-sm cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-bold text-white">History</span>
          </button>
        </div>
      </div>

      {/* ── TOP SECTION: BACKGROUND COLOR WITH BANNER CARD ── */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 text-white rounded-b-[1.75rem] relative overflow-hidden pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 px-4 shadow-md">
        {/* Subtle decorative background shapes */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-lg mx-auto">
          {/* BANNER CARD */}
          <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-700 rounded-2xl p-5 shadow-xl border border-white/20 relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/20 rounded-full blur-2xl pointer-events-none" />

            {/* Background gift icon */}
            <Gift className="absolute -top-4 -right-8 w-44 h-44 text-white/10 rotate-12 pointer-events-none" />

            <div className="relative z-10">
              {/* Top Left Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-700/70 backdrop-blur-sm text-white text-[10px] font-bold tracking-wide uppercase mb-3.5 shadow-sm border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
                <span>Infinite points. Unlimited rewards</span>
              </div>

              <div className="mb-4">
                <p className="text-3xl font-extrabold text-white leading-none tracking-tight">Turn your Points</p>
                <p className="text-3xl font-extrabold text-white leading-none tracking-tight mt-1">into rewards</p>
              </div>

              <p className="text-[10px] font-bold text-white/75 uppercase tracking-widest mb-1">YOU HAVE</p>
              <div className="flex items-center gap-2 mb-1">
                {isLoadingWallet ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
                    <span className="text-2xl font-black text-white leading-none tracking-tight">
                      {gfpBalance.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-white/90">points</span>
                  </>
                )}
              </div>

              {isExpiringSoon && (
                <p className="text-[10px] font-medium text-white/75 mt-1">
                  {gfpBalance} points will expire soon
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL SECTION: DIRECTLY ON THE PAGE ── */}
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-4 relative z-10">

        {/* Category Tabs */}
        <div className="flex gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          {(['all', 'airtime', 'voucher'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[12px] font-bold capitalize rounded-xl transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'all' ? 'All Rewards' : tab}
            </button>
          ))}
        </div>

          {/* REWARDS LIST - Horizontal Cards */}
          <div className="grid grid-cols-1 gap-3">
            {filteredRewards.map((reward: RewardItem) => {
              const isAffordable = gfpBalance >= reward.min_gfp;
              const Icon = reward.icon === 'phone' ? Phone : Gift;

              return (
                <button
                  key={reward.id}
                  onClick={() => handleCardClick(reward)}
                  disabled={isLoadingWallet || !isAffordable}
                  className={`relative flex items-stretch text-left rounded-2xl border transition-all duration-200 overflow-hidden min-h-[100px]
                    ${isAffordable
                      ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 hover:shadow-md'
                      : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-60 grayscale-[30%]'
                    }`}
                >
                  {/* Left Image Block */}
                  <div className="w-[52%] shrink-0 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={`/vectors/${reward.id === 'saf' ? 'safaricom' : reward.id === 'air' ? 'airtel' : reward.id === 'khe' ? 'khetias' : 'naivas'}.webp`}
                      alt={reward.title}
                      className={`absolute inset-0 w-full h-full object-cover ${reward.id === 'nai' ? 'object-left' : 'object-center'}`}
                    />
                  </div>

                  {/* Right Content */}
                  <div className="flex-1 p-3 flex flex-col justify-center items-end text-right">
                    <div className="mb-1.5">
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                        {reward.title}
                      </h3>
                      <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                        {reward.value_label}
                      </p>
                    </div>

                    <div className="mt-2">
                      {isAffordable ? (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${
                          isAffordable
                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 border-orange-200 dark:border-orange-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                          <Flame className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                          <span className={`text-[10px] font-extrabold ${
                            isAffordable ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400'
                          }`}>
                            {reward.min_gfp} GFP
                          </span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                          Need {reward.min_gfp - gfpBalance} more
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* REDEMPTION BOTTOM SHEET MODAL */}
      {/* ═══════════════════════════════════════ */}
      {showModal && selectedReward && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => viewState !== 'processing' && handleDone()} />

          <div className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-900 rounded-t-[32px] p-4 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] z-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto mb-6" />

            {viewState !== 'processing' && (
              <button onClick={handleDone} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center active:scale-95 transition-transform">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}

            {/* ─── CONFIRM VIEW ─── */}
            {viewState === 'confirm' && (
              <>
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg ${selectedReward.bg}`}>
                    {selectedReward.icon === 'phone' ? <Phone className="w-7 h-7 text-white" /> : <Gift className="w-7 h-7 text-white" />}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{selectedReward.title}</h2>
                  <p className="text-[11px] text-slate-600 dark:text-slate-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
                    You are redeeming your points for <strong className="text-slate-900 dark:text-slate-400">{selectedReward.description}</strong>. 
                    {selectedReward.requires_phone 
                      ? " The airtime will be sent directly to your phone."
                      : " A digital voucher code will be issued to you."}
                  </p>
                </div>

                {/* ── CUSTOM AMOUNT INPUT & COST BREAKDOWN ── */}
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 mb-5 relative overflow-hidden">
                  <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {selectedReward.category === 'airtime' ? 'Airtime Amount to Receive (KES)' : 'Voucher Value (KES)'}
                    </p>
                    <button 
                      onClick={setMaxAmount}
                      className="text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900/80 border-2 border-emerald-500/20 focus-within:border-emerald-500 rounded-xl px-3 py-2 shadow-inner transition-colors">
                    <span className="text-lg font-black text-slate-400 dark:text-slate-500">KSh</span>
                    <input
                      type="number"
                      value={inputKesAmount}
                      onChange={(e) => setInputKesAmount(e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-transparent text-lg font-black text-slate-900 dark:text-white outline-none w-full placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                  </div>

                  {/* Quick Select Bubbles */}
                  <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide pb-1">
                    {[50, 100, 200, 500, 1000].map(amt => {
                      // Only show quick buttons user can afford
                      const isAffordable = gfpBalance >= (amt / selectedReward.gfp_to_kes_rate);
                      if (!isAffordable) return null;

                      return (
                        <button
                          key={amt}
                          onClick={() => setInputKesAmount(amt.toString())}
                          className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                            kesValueNum === amt
                              ? 'bg-emerald-500 text-white border-emerald-500'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {amt}
                        </button>
                      );
                    })}
                  </div>
                  </div>

                  {/* Cost breakdown */}
                  <div className="bg-slate-100/50 dark:bg-slate-800/80 p-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Total Cost</span>
                    <div className="flex flex-col items-end">
                      <span className={`font-bold ${totalGfpCost > gfpBalance ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                        {totalGfpCost.toLocaleString()} GFP
                      </span>
                      {errorMsg && <span className="text-[9px] text-rose-500 font-bold">{errorMsg}</span>}
                    </div>
                  </div>
                  <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2.5 flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Balance After</span>
                    <span className={`font-bold ${totalGfpCost > gfpBalance ? 'text-slate-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {totalGfpCost <= gfpBalance ? (gfpBalance - totalGfpCost).toLocaleString() : '---'} GFP
                    </span>
                  </div>
                </div>
                </div>


                {/* Phone Input (for airtime) */}
                {selectedReward.requires_phone && (
                  <div className="mb-5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block ml-1">Send Airtime To</label>
                    
                    <div className="flex gap-2 mb-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setSendTo('me')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          sendTo === 'me'
                            ? 'bg-primary dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        My Number
                      </button>
                      <button
                        onClick={() => setSendTo('other')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                          sendTo === 'other'
                            ? 'bg-primary dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                      >
                        Other Number
                      </button>
                    </div>

                    {sendTo === 'me' ? (
                      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl px-4 py-3">
                        <Phone className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase">Linked Number</p>
                          <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">{profile?.phone || 'Not Set'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative animate-in slide-in-from-top-2 duration-200">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 0712345678"
                          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        />
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={handleRedeem}
                  disabled={!isValidAmount}
                  className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-sm tracking-wide transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isValidAmount ? `Redeem ${totalGfpCost.toLocaleString()} GFP` : 'Enter Valid Amount'}
                </button>
              </>
            )}

            {/* ─── PROCESSING VIEW ─── */}
            {viewState === 'processing' && (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin absolute inset-0" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Processing Request...</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center max-w-[250px]">
                  Please wait while we secure your reward. Do not close this page.
                </p>
              </div>
            )}

            {/* ─── SUCCESS VIEW ─── */}
            {viewState === 'success' && redemptionResult && (
              <div className="py-4 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-5 border-4 border-white dark:border-slate-900 shadow-xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Success!</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-[280px]">
                  Your request for KSh {kesValueNum.toLocaleString()} {selectedReward.title} has been received and is being processed.
                </p>

                <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 mb-8 text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reference Number</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-white">{redemptionResult.reference_number}</p>
                    <button onClick={copyRef} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDone}
                  className="w-full py-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-sm tracking-wide transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
