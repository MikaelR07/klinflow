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
  Star, Lock
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
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white dark:bg-slate-800 text-slate-900 dark:text-white pb-8 relative overflow-x-hidden min-h-screen">

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

      {/* ── TOP SECTION: BACKGROUND COLOR WITH REWARDS BALANCE CARD ── */}
      <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 dark:from-amber-600 dark:via-amber-700 dark:to-orange-700 text-white rounded-b-[1.75rem] relative overflow-hidden pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 px-4 shadow-md">
        {/* Subtle ambient glow */}
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-lg mx-auto relative z-10">
          {/* HERO REWARDS CARD */}
          <div className="bg-gradient-to-br from-orange-600/90 via-amber-600/90 to-yellow-700/90 backdrop-blur-md rounded-2xl p-5 shadow-xl border border-white/25 relative overflow-hidden">
            {/* Faded background gift box icon */}
            <Gift className="absolute -top-4 -right-8 w-44 h-44 text-white/10 rotate-12 pointer-events-none" />

            <div className="relative z-10">
              <p className="text-[10px] font-bold text-white/75 uppercase tracking-[0.18em]">
                Available Points
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                {isLoadingWallet ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <>
                    <Star className="w-6 h-6 text-yellow-300 fill-yellow-300 shrink-0" />
                    <span className="text-3xl font-extrabold text-white leading-none tracking-tight tabular-nums">
                      {gfpBalance.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-white/85 uppercase tracking-wider self-end pb-0.5">
                      GFP
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="relative z-10 h-px bg-white/15 my-4" />

            <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-white/90 font-medium">
                <Gift className="w-3.5 h-3.5 text-yellow-200 shrink-0" />
                <span>Redeem for airtime &amp; vouchers</span>
              </div>
              {isExpiringSoon ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 border border-white/20 text-[10px] font-bold text-yellow-100 shrink-0">
                  <AlertCircle className="w-3 h-3" /> Expiring soon
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white uppercase tracking-wider shrink-0">
                  Instant
                </span>
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

          {/* REWARDS LIST - Solid Ticket Cards */}
          <div className="grid grid-cols-1 gap-3.5">
            {filteredRewards.map((reward: RewardItem) => {
              const isAffordable = gfpBalance >= reward.min_gfp;
              const Icon = reward.icon === 'phone' ? Phone : Gift;
              const cardBg =
                reward.id === 'saf'
                  ? 'bg-green-600'
                  : reward.id === 'air'
                  ? 'bg-red-600'
                  : reward.id === 'khe'
                  ? 'bg-amber-600'
                  : 'bg-orange-600';

              return (
                <button
                  key={reward.id}
                  onClick={() => handleCardClick(reward)}
                  disabled={isLoadingWallet || !isAffordable}
                  className={`group relative flex items-stretch text-left rounded-2xl transition-all duration-200 overflow-hidden min-h-[112px] shadow-sm ${cardBg} ${
                    isAffordable
                      ? 'active:scale-[0.98] hover:shadow-md cursor-pointer'
                      : 'opacity-65 grayscale-[25%] cursor-not-allowed'
                  }`}
                >
                  {/* Big faded icon in the background on the right */}
                  <Icon className="absolute -bottom-4 right-14 w-28 h-28 text-white/15 -rotate-12 pointer-events-none transition-transform duration-300 group-hover:scale-105" />

                  {/* Left Main Ticket Content */}
                  <div className="flex-1 p-4 pr-3 flex flex-col justify-between relative z-10 min-w-0">
                    <div>
                      <span className="inline-block text-[9px] font-bold uppercase tracking-[0.16em] bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/15">
                        {reward.category === 'airtime' ? 'Airtime' : 'Voucher'}
                      </span>

                      <h3 className="text-base font-extrabold text-white tracking-tight leading-snug mt-2 truncate">
                        {reward.title}
                      </h3>
                      <p className="text-[11px] font-medium text-white/85 mt-0.5 truncate">
                        {reward.description} · {reward.value_label}
                      </p>
                    </div>

                    <div className="mt-3">
                      {isAffordable ? (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-slate-900 shadow-sm">
                          <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                          <span className="text-[10px] font-extrabold tracking-wide">
                            From {reward.min_gfp} GFP
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/25 text-white/90 border border-white/15">
                          <Lock className="w-3 h-3" />
                          <span className="text-[10px] font-bold">
                            Need {reward.min_gfp - gfpBalance} more GFP
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Ticket Stub with Perforation & Notches */}
                  <div className="w-[84px] shrink-0 border-l-2 border-dashed border-white/30 flex flex-col items-center justify-center p-2 relative z-10 bg-black/10">
                    {/* Top & bottom semicircular ticket notches */}
                    <span className="w-4 h-4 rounded-full bg-[#F8F9FF] dark:bg-slate-800 absolute -top-2 -left-[9px] pointer-events-none" />
                    <span className="w-4 h-4 rounded-full bg-[#F8F9FF] dark:bg-slate-800 absolute -bottom-2 -left-[9px] pointer-events-none" />

                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-colors">
                      {isAffordable ? (
                        <ChevronRight className="w-4.5 h-4.5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-white/90 uppercase tracking-widest mt-1.5">
                      {isAffordable ? 'Redeem' : 'Locked'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

      </div>

      {/* ═══════════════════════════════════════ */}
      {/* REDEMPTION CENTERED MODAL */}
      {/* ═══════════════════════════════════════ */}
      {showModal && selectedReward && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={() => viewState !== 'processing' && handleDone()}
          />

          <div className="relative w-full max-w-[400px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[1.75rem] z-10 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            {/* ─── CONFIRM VIEW ─── */}
            {viewState === 'confirm' && (
              <div>
                {/* Modal Top Header */}
                <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 px-5 py-4 text-white relative">
                  <button
                    type="button"
                    onClick={handleDone}
                    aria-label="Close"
                    className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors active:scale-95"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 pr-9">
                    <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                      {selectedReward.icon === 'phone' ? (
                        <Phone className="w-5 h-5 text-white" />
                      ) : (
                        <Gift className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-white leading-tight truncate">
                        {selectedReward.title}
                      </h2>
                      <p className="text-[11px] font-medium text-white/80 mt-0.5 truncate">
                        {selectedReward.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px]">
                    <span className="text-white/80 font-medium">Available Balance</span>
                    <span className="font-bold text-white flex items-center gap-1 tabular-nums">
                      <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                      {gfpBalance.toLocaleString()} GFP
                    </span>
                  </div>
                </div>

                {/* Modal Form Body */}
                <div className="p-4 space-y-3.5">
                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-0.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {selectedReward.category === 'airtime' ? 'Airtime Amount' : 'Voucher Value'}
                      </label>
                      <button
                        type="button"
                        onClick={setMaxAmount}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/15 px-2.5 py-0.5 rounded-md hover:bg-amber-100 transition-colors"
                      >
                        Use Max
                      </button>
                    </div>

                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 font-bold text-amber-600 dark:text-amber-400 text-sm">
                        KSh
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={inputKesAmount}
                        onChange={(e) => setInputKesAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500 transition-colors placeholder:text-slate-300 dark:placeholder:text-slate-600 tabular-nums"
                      />
                    </div>

                    {/* Quick Select Chips */}
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                      {[50, 100, 200, 500, 1000].map((amt) => {
                        const isAffordable = gfpBalance >= amt / selectedReward.gfp_to_kes_rate;
                        if (!isAffordable) return null;

                        return (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setInputKesAmount(amt.toString())}
                            className={`flex-1 min-w-[54px] py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                              kesValueNum === amt
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                            }`}
                          >
                            {amt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recipient Phone (for airtime) */}
                  {selectedReward.requires_phone && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-0.5 block">
                        Send Airtime To
                      </label>

                      <div className="grid grid-cols-2 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSendTo('me')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all ${
                            sendTo === 'me'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          My Number
                        </button>
                        <button
                          type="button"
                          onClick={() => setSendTo('other')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all ${
                            sendTo === 'other'
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Other Number
                        </button>
                      </div>

                      {sendTo === 'me' ? (
                        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 rounded-xl px-3.5 py-2.5">
                          <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                              Linked Number
                            </p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {profile?.phone || 'Not Set'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="07XXXXXXXX"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Breakdown */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/70 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Points Required</span>
                      <span
                        className={`font-bold tabular-nums ${
                          totalGfpCost > gfpBalance
                            ? 'text-rose-500'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {totalGfpCost.toLocaleString()} GFP
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Delivery</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {selectedReward.requires_phone ? 'Direct to phone' : 'Digital voucher'}
                      </span>
                    </div>
                    <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Balance</span>
                      <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {totalGfpCost <= gfpBalance
                          ? `${(gfpBalance - totalGfpCost).toLocaleString()} GFP`
                          : '---'}
                      </span>
                    </div>
                    {errorMsg && (
                      <p className="text-[11px] font-bold text-rose-500 pt-0.5">{errorMsg}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={!isValidAmount}
                    className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-md shadow-amber-500/20 disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {isValidAmount
                      ? `Redeem ${totalGfpCost.toLocaleString()} GFP`
                      : 'Enter Valid Amount'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── PROCESSING VIEW ─── */}
            {viewState === 'processing' && (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                  <div className="w-14 h-14 rounded-full border-4 border-amber-500 border-t-transparent animate-spin absolute inset-0" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  Processing Request...
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[240px]">
                  Please wait while we secure your reward. Do not close this window.
                </p>
              </div>
            )}

            {/* ─── SUCCESS VIEW ─── */}
            {viewState === 'success' && redemptionResult && (
              <div className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mb-3 border-4 border-emerald-100 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-2">
                  Reward Confirmed
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Redemption Successful!
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 mb-5 max-w-[270px]">
                  Your KSh {kesValueNum.toLocaleString()} {selectedReward.title} reward is being processed.
                </p>

                <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 mb-5 text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Reference Number
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-mono font-bold text-slate-900 dark:text-white truncate">
                      {redemptionResult.reference_number}
                    </p>
                    <button
                      type="button"
                      onClick={copyRef}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                      aria-label="Copy reference"
                    >
                      <Copy className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDone}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-all active:scale-[0.98]"
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
