import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Gift, Phone, Landmark,
  ChevronRight, ShieldCheck, HelpCircle,
  Wallet, Info, Lock,
  Receipt, X, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

type RedeemOption = 'money' | 'safaricom' | 'airtel' | 'khetias' | 'naivas';

const REDEEM_OPTIONS = [
  { id: 'money', title: 'Withdraw Cash', desc: 'Transfer directly to your Klin wallet account', icon: Landmark, color: 'text-white', bg: 'bg-blue-600', gfp: 100, kes: 50 },
  { id: 'safaricom', title: 'Safaricom Airtime', desc: 'Top up your Safaricom airtime instantly', icon: Phone, color: 'text-white', bg: 'bg-green-600', gfp: 50, kes: 25 },
  { id: 'airtel', title: 'Airtel Airtime', desc: 'Top up your Airtel airtime instantly', icon: Phone, color: 'text-white', bg: 'bg-red-600', gfp: 50, kes: 25 },
  { id: 'khetias', title: 'Khetias Voucher', desc: 'Shop quality products at Khetias', icon: Gift, color: 'text-white', bg: 'bg-yellow-500', gfp: 100, kes: 50 },
  { id: 'naivas', title: 'Naivas Voucher', desc: 'Redeem at any Naivas branch', icon: Gift, color: 'text-white', bg: 'bg-amber-600', gfp: 100, kes: 50 },
];

export default function RedeemGFP() {
  const navigate = useNavigate();
  const { rewardPoints } = useAuthStore();
  const [selectedOption, setSelectedOption] = useState<RedeemOption | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [gfpAmount, setGfpAmount] = useState('');

  // 2 GFP = 1 Ksh
  const maxKsh = Math.floor(rewardPoints / 2);

  const activeOption = useMemo(
    () => REDEEM_OPTIONS.find((o) => o.id === selectedOption),
    [selectedOption]
  );

  const numericGfp = Number(gfpAmount) || 0;
  const kesEquivalent = Math.floor(numericGfp / 2);
  const isValidAmount = numericGfp >= 2 && numericGfp <= rewardPoints && numericGfp % 2 === 0;

  const handleCardClick = (id: RedeemOption) => {
    setSelectedOption(id);
    setGfpAmount('');
    setShowModal(true);
  };

  const handleRedeem = () => {
    if (!isValidAmount || !activeOption) return;
    toast.success(`Redeemed ${numericGfp} GFP for KES ${kesEquivalent} ${activeOption.title}`);
    setShowModal(false);
    setGfpAmount('');
  };

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 text-slate-900 dark:text-white pb-5">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#F8F8FF] dark:bg-slate-800 dark:border-slate-600 border-b border-gray-200 pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <h1 className="text-[18px] font-semibold tracking-wide text-slate-900 dark:text-white">Redeem GFP</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50  transition-colors">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">How it works</span>
        </button>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+3rem)] px-1.5 max-w-lg mx-auto space-y-6">

        {/* HERO CARD */}
        <div className="relative overflow-hidden rounded-xl p-3 border border-emerald-900/40 bg-gradient-to-br from-primary to-emerald-800 ">
          {/* Content */}
          <div className="relative z-10 flex flex-col gap-1 text-white">

            {/* Top Section */}
            <div className="flex justify-between items-start">

              {/* Left Content */}
              <div className="w-[60%]">
                <h2 className="text-xl font-bold leading-snug tracking-tight text-white mb-2">
                  Turn your green actions into <span className="text-emerald-300">rewards</span>
                </h2>

                <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                  Redeem your GFP points for awesome rewards from our trusted partners.
                </p>
              </div>
            </div>

            {/* Info Cards Side-by-Side */}
            <div className="mt-3 grid grid-cols-2 gap-2 relative z-10">

              {/* Conversion Card */}
              <div className="rounded-xl border border-emerald-800/30 bg-black/20 p-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/5 flex items-center justify-center shrink-0">
                  <Receipt className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white mb-0.5 leading-tight">
                    Value
                  </p>
                  <p className="text-[10px] text-emerald-100/80">100 GFP = KES 50</p>
                </div>
              </div>

              {/* Wallet Card */}
              <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/40 p-2.5 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1">
                    <p className="text-[15px] font-black text-white leading-none">
                      {rewardPoints}
                    </p>
                    <p className="text-[9px] font-bold text-emerald-400">GFP</p>
                  </div>
                  <p className="text-[10px] text-emerald-100/80 mt-0.5">≈ KES {maxKsh}</p>
                </div>
              </div>

            </div>

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
                onClick={() => handleCardClick(opt.id as RedeemOption)}
                className={`flex flex-col p-4 rounded-2xl text-left transition-colors ${selectedOption === opt.id
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
                    {opt.gfp} GFP
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">= KES {opt.kes}</span>
                    <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Secure & Instant Info Card */}
            <div className="flex flex-col p-4 rounded-2xl text-left bg-white dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 relative overflow-hidden">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 bg-green-700">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <h4 className="text-[13px] font-bold text-emerald-600 dark:text-emerald-500 mb-1">Secure & Instant?</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">All rewards are delivered instantly and securely.</p>
              <Lock className="w-8 h-8 text-slate-200 dark:text-slate-800 absolute bottom-3 right-3 opacity-50" />
            </div>
          </div>
        </div>

      </div>

      {/* REDEEM MODAL */}
      {showModal && activeOption && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Sheet */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl p-5 pb-[calc(env(safe-area-inset-bottom,0px)+6.5rem)] z-10">

            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-4" />

            {/* Close */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {/* Option Header */}
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
                  placeholder="e.g. 100"
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/70 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">GFP</span>
              </div>

              {/* Validation Hint */}
              {gfpAmount && !isValidAmount && (
                <div className="flex items-center gap-1.5 mt-2 text-amber-500">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <p className="text-[10px] font-medium">
                    {numericGfp < 2
                      ? 'Minimum is 2 GFP'
                      : numericGfp > rewardPoints
                        ? `You only have ${rewardPoints} GFP`
                        : 'Amount must be even (2 GFP = 1 KES)'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Select */}
            <div className="flex gap-2 mb-5">
              {[50, 100, 200, 500].filter(v => v <= rewardPoints).map((val) => (
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
                onClick={() => setGfpAmount(String(rewardPoints - (rewardPoints % 2)))}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${Number(gfpAmount) === rewardPoints - (rewardPoints % 2)
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
                KES {kesEquivalent}
              </p>
            </div>

            {/* Redeem Button */}
            <button
              onClick={handleRedeem}
              disabled={!isValidAmount}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-colors ${isValidAmount
                ? 'bg-green-600 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
            >
              Redeem {numericGfp > 0 ? `${numericGfp} GFP` : ''}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
