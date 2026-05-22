import { useState } from 'react';
import { 
  ArrowLeft, Wallet, Smartphone, Building2, 
  ChevronRight, CheckCircle2, ShieldCheck, 
  Smartphone as PhoneIcon, Landmark, CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
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
  { id: 'mpesa', name: 'M-Pesa', icon: PhoneIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', description: 'Instant to your mobile number' },
  { id: 'airtel', name: 'Airtel Money', icon: PhoneIcon, color: 'text-rose-500', bg: 'bg-rose-50', description: 'Airtel mobile money transfer' }
];

export default function WithdrawalPage() {
  const navigate = useNavigate();
  const { profile, walletBalance, withdrawRewards } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Method, 2: Amount/Details, 3: Success
  const [method, setMethod] = useState<Method | null>(null);
  const [amount, setAmount] = useState<number | ''>(walletBalance || 0);
  const [details, setDetails] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (typeof amount !== 'number' || amount < 100) {
      toast.error('Minimum withdrawal is KSh 100');
      return;
    }
    if (amount > walletBalance) {
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
      setStep(3);
      toast.success('Withdrawal Request Sent!');
    } catch (err) {
      toast.error('Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-2 px-1 rounded-3xl mb-6 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <h1 className="font-semibold text-lg tracking-tight dark:text-white">Withdraw Funds</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-2 py-6 space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 mb-4">
           {[1, 2, 3].map(i => (
             <div key={i} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  step === i ? 'bg-primary text-white scale-125 shadow-lg shadow-primary/20' : 
                  step > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                   {step > i ? <CheckCircle2 className="w-4 h-4" /> : i}
                </div>
                {i < 3 && <div className={`h-1 w-12 mx-2 rounded-full ${step > i ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />}
             </div>
           ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            <div className="card p-6 bg-gradient-to-br from-primary to-emerald-700 text-white border-none">
              <p className="text-xs font-semibold text-emerald-100 capitalize tracking-[0.2em] mb-1">Available for Withdrawal</p>
              <h2 className="text-4xl font-semibold tracking-tight">KSh {walletBalance.toLocaleString()}</h2>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" /> SECURE ESCROW SETTLEMENT
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-400 capitalize tracking-widest px-1">Select Method</h3>
            <div className="space-y-3">
              {METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMethod(m); setStep(2); }}
                  className="w-full card p-4 flex items-center justify-between group hover:border-primary transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                       <m.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold dark:text-white leading-none mb-1">{m.name}</p>
                      <p className="text-xs font-medium text-slate-400">{m.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && method && (
          <div className="space-y-6 animate-slide-up">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                 <div className={`w-14 h-14 ${method.bg} ${method.color} rounded-3xl flex items-center justify-center`}>
                    <method.icon className="w-8 h-8" />
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest leading-none mb-1">Withdraw via</p>
                    <p className="text-xl font-semibold dark:text-white leading-none">{method.name}</p>
                 </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Amount to Withdraw</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-400">KSh</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val === '' ? '' : Number(val));
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-4 pl-14 pr-4 font-semibold text-xl focus:border-primary outline-none transition-all dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex justify-between px-1">
                    <p className="text-xs font-semibold text-slate-400">Fee: <span className="text-slate-900 dark:text-white">KSh 0.00</span></p>
                    <button onClick={() => setAmount(walletBalance)} className="text-xs font-semibold text-primary capitalize tracking-widest hover:underline">Withdraw All</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">
                    {method.id === 'bank' ? 'Account Number' : 'Phone Number'}
                  </label>
                  <input 
                    type="text"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 font-semibold focus:border-primary outline-none transition-all dark:text-white"
                    placeholder={method.id === 'bank' ? 'Enter Account No' : '07XXXXXXXX'}
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleConfirm}
              disabled={loading || Number(amount) < 100}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-semibold text-sm capitalize tracking-[0.2em] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm & Withdraw <ChevronRight className="w-5 h-5" /></>
              )}
            </button>

            <div className="text-center p-4">
              <p className="text-xs font-semibold text-slate-400 italic">
                By clicking confirm, you authorize Klinflow to process this settlement to the provided account.
              </p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-8 py-10 animate-scale-in">
             <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 relative">
                <CheckCircle2 className="w-12 h-12" />
                <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] animate-ping opacity-20" />
             </div>
             
             <div className="space-y-2">
               <h2 className="text-3xl font-semibold dark:text-white tracking-tight">Withdrawal Initiated!</h2>
               <p className="text-sm font-medium text-slate-400 max-w-[250px] mx-auto leading-relaxed">
                 KSh {amount?.toLocaleString()} is being sent to your {method?.name} account. 
               </p>
             </div>

             <div className="card p-6 bg-slate-100 dark:bg-slate-800 border-dashed border-2">
                <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-2">Transaction Reference</p>
                <p className="font-mono font-semibold dark:text-white">CF-WD-{Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
             </div>

             <button 
              onClick={() => navigate('/')}
              className="w-full py-5 bg-primary text-white rounded-[2rem] font-semibold text-sm capitalize tracking-widest shadow-xl active:scale-[0.98] transition-all"
             >
               Return Home
             </button>
          </div>
        )}

      </div>
    </div>
  );
}
