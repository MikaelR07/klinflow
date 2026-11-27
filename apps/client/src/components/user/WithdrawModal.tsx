import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ChevronDown, CheckCircle2, ShieldCheck,
  Smartphone as PhoneIcon, Loader2, X
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';
import { toast } from 'sonner';

interface Method {
  id: string;
  name: string;
  icon: typeof PhoneIcon;
  description: string;
}

const METHODS: Method[] = [
  { id: 'mpesa', name: 'M-Pesa', icon: PhoneIcon, description: 'Instant withdrawal' },
  { id: 'airtel', name: 'Airtel Money', icon: PhoneIcon, description: 'Airtel mobile money' },
];

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBalance?: number;
  onSuccess?: () => void;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  initialBalance = 0,
  onSuccess,
}: WithdrawModalProps) {
  const { profile, userId, withdrawRewards } = useAuthStore();
  const [view, setView] = useState<'form' | 'method' | 'success'>('form');
  const [method, setMethod] = useState<Method>(METHODS[0]!);
  const [cashBalance, setCashBalance] = useState(initialBalance);
  const [amount, setAmount] = useState<number | ''>('');
  const [details, setDetails] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);
  const [txRef, setTxRef] = useState('');
  const [txTimestamp, setTxTimestamp] = useState('');

  useEffect(() => {
    setCashBalance(initialBalance);
  }, [initialBalance]);

  useEffect(() => {
    if (!isOpen) return;
    setView('form');
    setAmount('');
    setDetails(profile?.phone || '');

    if (userId) {
      walletService.getWalletDetails(userId).then((data: any) => {
        if (data && typeof data.cash_balance === 'number') {
          setCashBalance(data.cash_balance);
        }
      });
    }
  }, [isOpen, userId, profile?.phone]);

  if (!isOpen || typeof document === 'undefined') return null;

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
      const formattedTime =
        now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' • ' +
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTxRef(generatedRef);
      setTxTimestamp(formattedTime);
      setCashBalance((prev) => Math.max(0, prev - Number(amount)));
      setView('success');
      toast.success('Withdrawal Request Sent!');
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] max-h-[90dvh] overflow-y-auto bg-white dark:bg-slate-900 rounded-[1.75rem] shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
      >
        {view === 'form' && (
          <div>
            {/* Top Balance Card matching the wallet hero gradient */}
            <div className="bg-gradient-to-br from-[#1178ab] to-[#085078] px-5 pt-5 pb-5 text-white relative">
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center text-white transition-colors active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center">
                <p className="text-[10px] font-bold text-white/75 uppercase tracking-widest mb-1">
                  Available Balance
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-base font-bold text-white/90">KSh</span>
                  <span className="text-2xl font-bold leading-none tabular-nums">
                    {cashBalance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-center mt-2.5">
                  <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-white uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full border border-white/15">
                    <ShieldCheck className="w-3 h-3" /> Secure Klin Wallet
                  </div>
                </div>
              </div>
            </div>

            {/* Form Body */}
            <div className="p-4 space-y-3.5">
              {/* Withdraw To Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-0.5 block">
                  Withdraw To
                </label>
                <button
                  type="button"
                  onClick={() => setView('method')}
                  className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl p-2.5 flex items-center justify-between gap-3 transition-all active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        method.id === 'mpesa'
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400'
                      }`}
                    >
                      <method.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {method.name}
                        </p>
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            method.id === 'mpesa' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                        {method.description}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#085078] dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-1.5 rounded-lg shrink-0">
                    Change
                    <ChevronDown className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Amount to Withdraw
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">Min. KSh 100</span>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                    KSh
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmount(val === '' ? '' : Number(val));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl py-3 pl-12 pr-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600 transition-colors placeholder:text-slate-300 tabular-nums"
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  {[100, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                        Number(amount) === preset
                          ? 'bg-emerald-950 text-white border-emerald-950'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700'
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
                        : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 px-0.5 block">
                  {method.name} Phone Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-slate-400">
                    <PhoneIcon className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-600 transition-colors placeholder:text-slate-400"
                    placeholder="07XXXXXXXX"
                  />
                </div>
              </div>

              {/* Live Settlement Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/70 space-y-1.5 text-xs">
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
                <div className="h-px bg-slate-200/70 dark:bg-slate-700/60" />
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">You&apos;ll Receive</span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                    KSh{' '}
                    {Number(amount || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <button
                type="button"
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
        )}

        {view === 'method' && (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setView('form')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Select Method
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose where to receive your funds
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {METHODS.map((m) => {
                const isSelected = method.id === m.id;
                const isMpesa = m.id === 'mpesa';
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m);
                      setView('form');
                    }}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all active:scale-[0.99] text-left ${
                      isSelected
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-600/60 dark:border-emerald-500/50'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isMpesa
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
                            : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                        }`}
                      >
                        <m.icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {m.name}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'success' && (
          <div className="p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-4 border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-700/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Funds Dispatched
              </div>

              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Withdrawal Initiated!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Funds are on the way to your account.
              </p>

              <div className="my-4 py-2.5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Amount Withdrawn
                </span>
                <div className="flex items-baseline justify-center gap-1 mt-1 text-slate-900 dark:text-white">
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KSh</span>
                  <span className="text-2xl font-extrabold tracking-tight leading-none tabular-nums">
                    {Number(amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-2.5 text-left mb-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Destination</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        method.id === 'mpesa' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    {method.name}
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
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Date &amp; Time</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                    {txTimestamp || 'Just now'}
                  </span>
                </div>

                <div className="h-px bg-slate-200/60 dark:bg-slate-800 my-1" />

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Reference No.</span>
                  <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white tracking-widest uppercase">
                    {txRef || 'KF-WD-PENDING'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

