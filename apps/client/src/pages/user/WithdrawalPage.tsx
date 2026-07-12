import { useState, useEffect } from 'react';
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
      await withdrawRewards(Number(amount));
      setStep(2);
      toast.success('Withdrawal Request Sent!');
    } catch (err) {
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="-mx-1 -mt-[calc(env(safe-area-inset-top,1.5rem)+1.5rem)] bg-[#F8F9FF] dark:bg-slate-950 relative overflow-x-hidden min-h-screen">
      
      {/* ── TOP SECTION: PRIMARY WITH ROUNDED BOTTOM ── */}
      <div className="bg-primary pt-[calc(env(safe-area-inset-top,1.5rem)+5.5rem)] pb-6 rounded-b-[2rem] shadow-sm relative z-20">
        
        {/* Fixed Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 dark:bg-primary/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1.5rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between shadow-sm">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-all border border-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Withdraw Funds</h1>
          </div>
          <div className="w-10 h-10"></div>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in duration-300">
            <div className="text-center px-4 mb-4">
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Total Balance</p>
              <div className="flex items-baseline justify-center gap-1 text-white">
                <span className="text-xl font-bold">KSh</span>
                <span className="text-3xl font-black leading-none">
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
                const buttonBg = m.id === 'mpesa' ? 'bg-green-600' : 'bg-red-600';
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m)}
                    className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-left transition-all active:scale-95 ${buttonBg} ${isSelected 
                      ? 'border-[1.5px] border-white shadow-md scale-[1.02]' 
                      : 'border-[1.5px] border-transparent opacity-80 hover:opacity-100'}`}
                  >
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
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
        )}
      </div>

      <div className="px-1.5 mt-2 space-y-6 relative z-10 max-w-lg mx-auto">

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* AMOUNT AND DETAILS CARD */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[1rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-[14px] font-bold text-slate-700 dark:text-white uppercase tracking-wider mb-4 text-center">Withdrawal Details</h3>
              
              <div className="space-y-4">
                {/* AMOUNT INPUT */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Amount to Withdraw</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 font-black text-emerald-600 dark:text-emerald-400 text-lg">KSh</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val === '' ? '' : Number(val));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-14 pr-4 text-xl font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-300"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between px-1 mt-1.5 text-[10px] font-bold">
                    <p className="text-slate-400 uppercase tracking-widest">Fee: <span className="text-emerald-500">Free</span></p>
                    <button onClick={() => setAmount(cashBalance)} className="text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline active:opacity-50">Withdraw All</button>
                  </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 -mx-5 my-4" />

                {/* DETAILS INPUT */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    {method.id === 'bank' ? 'Account Number' : 'Phone Number'}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-slate-400">
                      <PhoneIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400"
                      placeholder={method.id === 'bank' ? 'Enter Account No' : '07XXXXXXXX'}
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={loading || amount === '' || Number(amount) < 100 || Number(amount) > cashBalance}
                className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Confirm & Withdraw</>}
              </button>

              <div className="text-center mt-4">
                <p className="text-[10px] font-medium text-slate-400 leading-relaxed">
                  By clicking confirm, you authorize Klinflow to process this settlement to the provided account.
                </p>
              </div>
            </div>

            {/* HOW IT WORKS */}
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[1rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
              <h4 className="text-[12px] font-bold text-slate-700 dark:text-white uppercase tracking-wider mb-3">How Withdrawals Work</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">1</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Choose your preferred network (<strong className="text-slate-700 dark:text-slate-300">M-Pesa</strong> or <strong className="text-slate-700 dark:text-slate-300">Airtel Money</strong>) and enter the amount you wish to withdraw.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">2</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    Confirm your registered phone number. Your funds are instantly dispatched to your mobile wallet once approved.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* STEP 2: SUCCESS */}
        {step === 2 && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-gradient-to-b from-emerald-600 to-emerald-800 w-full max-w-[360px] rounded-[2rem] p-6 text-center text-white relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-emerald-400/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/40 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                
                <h1 className="text-xl font-bold text-white tracking-wide mb-1 leading-tight">Withdrawal<br/>Initiated!</h1>
                <p className="text-xs text-emerald-100 font-medium mb-6">Funds are on the way.</p>
                
                <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10 mb-6 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-200">Amount Sent</span>
                    <span className="font-bold">KSh {Number(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-200">Destination</span>
                    <span className="font-bold">{method?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-200">Ref No.</span>
                    <span className="font-bold tracking-widest uppercase">KF-WD-{Math.random().toString(36).substring(2, 6).toUpperCase()}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate(-1)}
                  className="w-full bg-white text-emerald-700 hover:text-emerald-800 py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                  Return to Wallet
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
