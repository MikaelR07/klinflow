import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, Wallet, Smartphone, Building2,
  ChevronRight, CheckCircle2, ShieldCheck,
  Smartphone as PhoneIcon, Landmark, CreditCard, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';
import { toast } from 'sonner';

interface Method {
  id: string;
  name: string;
  icon: any;
  color: string;
  bg: string;
  description: string;
}

const METHODS: Method[] = [
  { id: 'mpesa', name: 'M-Pesa', icon: PhoneIcon, color: 'text-white', bg: 'bg-emerald-600 dark:bg-emerald-500/20', description: 'Instant withdrawal' },
  { id: 'airtel', name: 'Airtel Money', icon: PhoneIcon, color: 'text-rose-400', bg: 'bg-rose-300 dark:bg-rose-500/20', description: 'Airtel mobile money ' }
];

export default function WithdrawalPage() {
  const navigate = useNavigate();
  const { profile, userId, withdrawRewards } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Form, 2: Success
  const [method, setMethod] = useState<Method>(METHODS[0]);
  const [cashBalance, setCashBalance] = useState(0);
  const [amount, setAmount] = useState<number | ''>('');
  const [details, setDetails] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [txTimestamp, setTxTimestamp] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (userId) {
      walletService.getWalletDetails(userId).then(data => {
        if (data) {
          setCashBalance(data.cash_balance);
        }
      });
    }
  }, [userId]);

  const handleConfirm = async () => {
    if (typeof amount !== 'number' || amount < 100) {
      toast.error('Minimum withdrawal is KSh 100');
      return;
    }
    if (amount > cashBalance) {
      toast.error('Insufficient balance');
      return;
    }
    if (!details) {
      toast.error('Please provide account details');
      return;
    }

    setLoading(true);
    try {
      await withdrawRewards(Number(amount), method.name, details);
      const generatedRef = `KF-WD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const now = new Date();
      const formattedTime = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTxRef(generatedRef);
      setTxTimestamp(formattedTime);
      setStep(2);
      toast.success('Withdrawal Request Sent!');
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-white dark:bg-slate-900 min-h-screen relative overflow-x-hidden transition-colors">
      
      {/* ── FIXED TOP NAV ── */}
      <div className={`fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,1.5rem)+0.75rem)] pb-2.5 transition-all duration-300 bg-gradient-to-br from-[#1178ab] to-[#085078] backdrop-blur-md `}>
        <div className="max-w-lg mx-auto px-5 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center active:scale-95 transition-all border border-white/20 shadow-sm z-10"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-semibold tracking-wide text-white leading-tight">Withdraw Funds</h1>
          </div>
          <div className="w-10 h-10"></div>
        </div>
      </div>

      {/* ── TOP SECTION: PRIMARY WITH ROUNDED BOTTOM ── */}
      <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] pt-[calc(env(safe-area-inset-top,1.5rem)+7rem)] pb-6 rounded-b-[1.5rem] relative z-20 overflow-hidden">
        <div className="text-center px-4 mb-4">
          <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Total Balance</p>
          <div className="flex items-baseline justify-center gap-1 text-white">
            <span className="text-xl font-bold">KSh</span>
            <span className="text-3xl font-bold leading-none">
              {cashBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-center mt-3">
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5" /> Secure Klin Wallet
            </div>
          </div>
        </div>

        {/* Withdrawal Method Buttons */}
        <div className="flex items-center justify-center gap-3 px-4 mt-2">
          {METHODS.map(m => {
            const isSelected = method.id === m.id;
            const selectedBg = m.id === 'mpesa' ? 'bg-green-600' : 'bg-red-600';
            return (
              <button
                key={m.id}
                onClick={() => setMethod(m)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-left transition-all active:scale-95 border-[1.5px] ${isSelected 
                  ? `${selectedBg} border-white shadow-md scale-[1.02]` 
                  : 'bg-white/20 border-white/30 opacity-90 hover:opacity-100'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                  <m.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white leading-tight truncate">{m.name}</p>
                  <p className="text-[9px] font-medium text-white/90 leading-tight line-clamp-1">{m.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-3 mt-4 pb-10 space-y-4 relative z-10 max-w-lg mx-auto">
        {/* AMOUNT AND DETAILS CARD */}
        <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
          {/* AMOUNT INPUT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount to Withdraw</label>
              <span className="text-[11px] font-semibold text-slate-400">Min. KSh 100</span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-4 font-bold text-emerald-700 dark:text-emerald-400 text-base">KSh</span>
              <input
                type="number"
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  setAmount(val === '' ? '' : Number(val));
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl py-3.5 pl-14 pr-4 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600 transition-colors placeholder:text-slate-300 tabular-nums"
                placeholder="0"
              />
            </div>

            {/* Quick-Amount Chips */}
            <div className="flex items-center gap-2 pt-0.5">
              {[100, 500, 1000].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                    Number(amount) === preset
                      ? 'bg-emerald-950 text-white border-emerald-950'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  KSh {preset.toLocaleString()}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmount(cashBalance)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                  cashBalance > 0 && Number(amount) === cashBalance
                    ? 'bg-emerald-950 text-white border-emerald-950'
                    : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border-slate-200/80 dark:border-slate-700'
                }`}
              >
                Max
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />

          {/* DETAILS INPUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-0.5 block">
              {method.id === 'bank' ? 'Account Number' : `${method.name} Phone Number`}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400">
                <PhoneIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-600 transition-colors placeholder:text-slate-400"
                placeholder={method.id === 'bank' ? 'Enter Account No' : '07XXXXXXXX'}
              />
            </div>
          </div>

          {/* LIVE SETTLEMENT SUMMARY */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Destination</span>
              <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">
                {method.name} {details ? `· ${details}` : ''}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Transfer Fee</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">Free (KSh 0)</span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800" />
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-slate-300">You&apos;ll Receive</span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                KSh {Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading || amount === '' || Number(amount) < 100 || Number(amount) > cashBalance}
            className="w-full py-3.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Withdraw'}
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            Instant dispatch upon approval · Secured by Klinflow
          </p>
        </div>
      </div>

        {/* STEP 2: SUCCESS MODAL */}
      {step === 2 && typeof document !== 'undefined' && createPortal(
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
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Funds Dispatched
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Withdrawal Initiated!</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Funds are on the way to your account.</p>

              {/* Amount Hero Box */}
              <div className="my-5 py-2 px-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Amount Withdrawn</span>
                <div className="flex items-baseline justify-center gap-1 mt-1 text-slate-900 dark:text-white">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KSh</span>
                  <span className="text-2xl font-extrabold tracking-tight leading-none">
                    {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Receipt Details Box */}
              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2.5 text-left mb-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Destination</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${method.id === 'mpesa' ? 'bg-green-500' : 'bg-red-500'}`} />
                    {method?.name}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Account / Phone</span>
                  <span className="font-bold text-slate-900 dark:text-white tracking-wide">{details}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Transfer Fee</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full">
                    Free (KSh 0.00)
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Date & Time</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{txTimestamp || 'Just now'}</span>
                </div>

                <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-1" />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Reference No.</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white tracking-widest uppercase">
                    {txRef || 'KF-WD-PENDING'}
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
                onClick={() => navigate(-1)}
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
