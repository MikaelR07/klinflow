/**
 * RedeemGFP — Production-grade points redemption page
 * Integrates with walletService for real wallet operations
 */
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gift, Phone, Landmark,
  ChevronRight, ShieldCheck, HelpCircle,
  Wallet, Info, Lock, Loader2,
  Receipt, X, AlertCircle, CheckCircle2,
  Copy, ArrowRight, Clock
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, WALLET_CONFIG, RedemptionResult } from '@klinflow/core';
import { toast } from 'sonner';

type RedeemOption = 'money' | 'safaricom' | 'airtel' | 'khetias' | 'naivas';

const REDEEM_OPTIONS = [
  { id: 'money' as RedeemOption, title: 'Withdraw Cash', desc: 'Convert GFP directly to your Klinflow cash wallet', icon: Landmark, color: 'text-white', bg: 'bg-blue-600', type: 'money' as const, payout_method: 'wallet_cash' },
  { id: 'safaricom' as RedeemOption, title: 'Safaricom Airtime', desc: 'Top up your Safaricom airtime instantly', icon: Phone, color: 'text-white', bg: 'bg-green-600', type: 'airtime' as const, payout_method: 'safaricom_airtime' },
  { id: 'airtel' as RedeemOption, title: 'Airtel Airtime', desc: 'Top up your Airtel airtime instantly', icon: Phone, color: 'text-white', bg: 'bg-red-600', type: 'airtime' as const, payout_method: 'airtel_airtime' },
  { id: 'khetias' as RedeemOption, title: 'Khetias Voucher', desc: 'Shop quality products at Khetias stores', icon: Gift, color: 'text-white', bg: 'bg-yellow-500', type: 'voucher' as const, payout_method: 'voucher_khetias' },
  { id: 'naivas' as RedeemOption, title: 'Naivas Voucher', desc: 'Redeem at any Naivas branch nationwide', icon: Gift, color: 'text-white', bg: 'bg-amber-600', type: 'voucher' as const, payout_method: 'voucher_naivas' },
];

type ViewState = 'options' | 'confirm' | 'processing' | 'success';

export default function RedeemGFP() {
  const navigate = useNavigate();
  const { userId, profile } = useAuthStore();
  const [gfpBalance, setGfpBalance] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  const [selectedOption, setSelectedOption] = useState<RedeemOption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [gfpAmount, setGfpAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || '');

  const [viewState, setViewState] = useState<ViewState>('options');
  const [redemptionResult, setRedemptionResult] = useState<RedemptionResult | null>(null);

  // Fetch real wallet balance
  useEffect(() => {
    if (userId) {
      setIsLoadingWallet(true);
      walletService.getWalletDetails(userId).then(data => {
        if (data) setGfpBalance(data.available_points);
        setIsLoadingWallet(false);
      });
    }
  }, [userId]);

  const { GFP_TO_KES_RATE, MIN_REDEMPTION_POINTS, MAX_REDEMPTION_PER_TX } = WALLET_CONFIG;
  const maxKsh = Math.floor(gfpBalance * GFP_TO_KES_RATE);

  const activeOption = useMemo(
    () => REDEEM_OPTIONS.find((o) => o.id === selectedOption),
    [selectedOption]
  );

  const numericGfp = Number(gfpAmount) || 0;
  const kesEquivalent = Math.floor(numericGfp * GFP_TO_KES_RATE);
  const isValidAmount = numericGfp >= MIN_REDEMPTION_POINTS && numericGfp <= gfpBalance && numericGfp <= MAX_REDEMPTION_PER_TX;

  const requiresPhone = activeOption?.type === 'airtime';

  const handleCardClick = (id: RedeemOption) => {
    setSelectedOption(id);
    setGfpAmount('');
    setViewState('options');
    setRedemptionResult(null);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!isValidAmount || !activeOption) return;
    if (requiresPhone && (!phoneNumber || phoneNumber.length < 10)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setViewState('confirm');
  };

  const handleRedeem = async () => {
    if (!isValidAmount || !activeOption) return;

    setViewState('processing');

    const result = await walletService.redeemPoints({
      type: activeOption.type,
      amount: numericGfp,
      payout_method: activeOption.payout_method,
      phone: requiresPhone ? phoneNumber : undefined,
    });

    setRedemptionResult(result);

    if (result.success) {
      setViewState('success');
      // Update local balance
      setGfpBalance(prev => prev - numericGfp);
    } else {
      setViewState('options');
      toast.error(result.error || 'Redemption failed. Please try again.');
    }
  };

  const handleDone = () => {
    setShowModal(false);
    setGfpAmount('');
    setViewState('options');
    setRedemptionResult(null);
  };

  const copyRef = () => {
    if (redemptionResult?.reference_number) {
      navigator.clipboard.writeText(redemptionResult.reference_number);
      toast.success('Reference copied!');
    }
  };

  return (
    <div className=" bg-[#F8F8FF] dark:bg-slate-800 text-slate-900 dark:text-white pb-5">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#F8F8FF] dark:bg-slate-800 dark:border-slate-600 border-b border-gray-200 pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <h1 className="text-[18px] font-semibold tracking-wide text-slate-600 dark:text-white">Redeem GFP</h1>
        </div>
        <button 
          onClick={() => navigate('/redemption-history')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">History</span>
        </button>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+3rem)] px-1.5 max-w-lg mx-auto space-y-6">

        {/* HERO CARD (Banner Image Only) */}
        <div className="relative overflow-hidden rounded-xl shadow-sm bg-emerald-800 border border-emerald-900/40 h-[240px]">
          {/* Background Image */}
          <div
            className="absolute inset-0 w-full h-full z-0"
            style={{ 
              backgroundImage: "url('/vectors/redeem-gfp.webp')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat"
            }}
          />
        </div>

        {/* COMPACT COMBINED STATS CARD */}
        <div className="bg-white dark:bg-slate-900 rounded-xl !mt-2 border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-0.5">Available Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-700 dark:text-white leading-none tracking-tight">
                    {isLoadingWallet ? '...' : gfpBalance.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-500">GFP</span>
                </div>
              </div>
            </div>
            
            <div className="text-right border-l border-slate-100 dark:border-slate-800 pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Equivalent To</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                <span className="text-[10px] text-slate-500 mr-0.5">KES</span>
                {maxKsh.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Receipt className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              Rate: <span className="font-bold text-slate-700 dark:text-slate-200">2 GFP = KES 1</span>. Redeem for airtime, tokens, or cash.
            </p>
          </div>
        </div>

        {/* OPTIONS GRID */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Redeem your points</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose from the rewards below and enjoy.</p>

          <div className="grid grid-cols-2 gap-3">
            {REDEEM_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleCardClick(opt.id)}
                disabled={isLoadingWallet}
                className={`flex flex-col p-4 rounded-2xl text-left transition-colors disabled:opacity-50 ${selectedOption === opt.id
                  ? 'bg-slate-100 dark:bg-slate-800 border-2 border-emerald-500'
                  : 'bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-transparent '
                  }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${opt.bg}`}>
                  <opt.icon className={`w-5 h-5 ${opt.color}`} />
                </div>
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">{opt.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug mb-4 h-8">{opt.desc}</p>

                <div className="flex items-center justify-between mt-auto w-full">
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#1f2937] ${opt.color}`}>
                    Min {MIN_REDEMPTION_POINTS} GFP
                  </div>
                  <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </button>
            ))}

            {/* Secure & Instant Card */}
            <div className="flex flex-col p-4 rounded-2xl text-left bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-green-700">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="text-[13px] font-bold text-emerald-600 dark:text-emerald-500 mb-1">Secure & Instant</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">All rewards are delivered instantly and securely.</p>
              <Lock className="w-8 h-8 text-slate-200 dark:text-slate-800 absolute bottom-3 right-3 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* REDEMPTION MODAL */}
      {/* ═══════════════════════════════════════ */}
      {showModal && activeOption && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => viewState !== 'processing' && handleDone()} />

          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] z-10">
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

            {viewState !== 'processing' && (
              <button onClick={handleDone} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            )}

            {/* ─── OPTIONS VIEW (amount input) ─── */}
            {viewState === 'options' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${activeOption.bg}`}>
                    <activeOption.icon className={`w-5 h-5 ${activeOption.color}`} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeOption.title}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{activeOption.desc}</p>
                  </div>
                </div>

                {/* GFP Input */}
                <div className="mb-4">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Enter GFP Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={gfpAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || Number(val) >= 0) setGfpAmount(val);
                      }}
                      placeholder={`Min ${MIN_REDEMPTION_POINTS}`}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GFP</span>
                  </div>

                  {gfpAmount && !isValidAmount && (
                    <div className="flex items-center gap-1.5 mt-2 text-amber-500">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <p className="text-[10px] font-medium">
                        {numericGfp < MIN_REDEMPTION_POINTS
                          ? `Minimum is ${MIN_REDEMPTION_POINTS} GFP`
                          : numericGfp > gfpBalance
                            ? `You only have ${gfpBalance.toLocaleString()} GFP`
                            : numericGfp > MAX_REDEMPTION_PER_TX
                              ? `Maximum per transaction is ${MAX_REDEMPTION_PER_TX.toLocaleString()} GFP`
                              : 'Invalid amount'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Phone Input (for airtime) */}
                {requiresPhone && (
                  <div className="mb-4">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                )}

                {/* Quick Select */}
                <div className="flex gap-2 mb-5">
                  {[100, 200, 500, 1000].filter(v => v <= gfpBalance).map((val) => (
                    <button
                      key={val}
                      onClick={() => setGfpAmount(String(val))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${Number(gfpAmount) === val
                        ? 'bg-emerald-500 text-white border-emerald-500'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                    >
                      {val}
                    </button>
                  ))}
                  <button
                    onClick={() => setGfpAmount(String(Math.min(gfpBalance, MAX_REDEMPTION_PER_TX)))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${Number(gfpAmount) === Math.min(gfpBalance, MAX_REDEMPTION_PER_TX)
                      ? 'bg-green-600 text-white border-emerald-500'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    Max
                  </button>
                </div>

                {/* KES Preview */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/70 rounded-xl p-3 mb-5 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">You will receive</p>
                  <p className="text-lg font-black text-green-600 dark:text-green-600">
                    KES {kesEquivalent.toLocaleString()}
                  </p>
                </div>

                {/* Continue Button */}
                <button
                  onClick={handleConfirm}
                  disabled={!isValidAmount}
                  className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${isValidAmount
                    ? 'bg-green-600 text-white active:scale-[0.98]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* ─── CONFIRM VIEW ─── */}
            {viewState === 'confirm' && (
              <>
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${activeOption.bg}`}>
                    <activeOption.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Redemption</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please review the details below.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-3 mb-6 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Type</span>
                    <span className="font-bold text-slate-900 dark:text-white">{activeOption.title}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Points</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{numericGfp.toLocaleString()} GFP</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">You Receive</span>
                    <span className="font-bold text-green-600">KES {kesEquivalent.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Fee</span>
                    <span className="font-bold text-slate-900 dark:text-white">0 GFP</span>
                  </div>
                  {requiresPhone && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Phone</span>
                      <span className="font-bold text-slate-900 dark:text-white">{phoneNumber}</span>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Remaining Balance</span>
                    <span className="font-bold text-slate-900 dark:text-white">{(gfpBalance - numericGfp).toLocaleString()} GFP</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setViewState('options')}
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:scale-[0.98]"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRedeem}
                    className="flex-[2] py-3.5 rounded-xl text-sm font-bold bg-green-600 text-white active:scale-[0.98] transition-all shadow-md"
                  >
                    Confirm & Redeem
                  </button>
                </div>
              </>
            )}

            {/* ─── PROCESSING VIEW ─── */}
            {viewState === 'processing' && (
              <div className="py-12 text-center">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Processing Redemption</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Please wait while we process your request...</p>
              </div>
            )}

            {/* ─── SUCCESS VIEW ─── */}
            {viewState === 'success' && redemptionResult && (
              <div className="py-6 text-center">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Redemption Successful!</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your points have been redeemed successfully.</p>

                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-3 mb-6 border border-slate-100 dark:border-slate-800 text-left">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Reference</span>
                    <button onClick={copyRef} className="flex items-center gap-1.5 font-mono font-bold text-emerald-600">
                      {redemptionResult.reference_number}
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Amount</span>
                    <span className="font-bold text-slate-900 dark:text-white">{redemptionResult.amount?.toLocaleString()} GFP</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Value</span>
                    <span className="font-bold text-green-600">KES {redemptionResult.kes_equivalent?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">New Balance</span>
                    <span className="font-bold text-slate-900 dark:text-white">{redemptionResult.balance_after?.toLocaleString()} GFP</span>
                  </div>
                </div>

                <button
                  onClick={handleDone}
                  className="w-full py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white active:scale-[0.98] transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
