import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRightLeft, Search,
  CheckCircle2, AlertCircle, User,
  HelpCircle, ChevronRight, Lock, ShieldCheck,
  Coins, Lightbulb, Phone
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

export default function TransferGFP() {
  const navigate = useNavigate();
  const { rewardPoints } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const transferAmount = Number(amount);

  const handleTransfer = () => {
    if (!phone || phone.length < 9) return toast.error('Please enter a valid phone number');
    if (!amount || transferAmount <= 0) return toast.error('Please enter a valid amount');
    if (transferAmount > rewardPoints) return toast.error('Insufficient GFP balance');

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success('Transfer successful!', {
        description: `Successfully sent ${transferAmount} GFP to ${phone}.`
      });
      navigate('/resident-wallet');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 pb-20 text-slate-900 dark:text-white">
      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
          </button>
          <h1 className="text-[18px] font-semibold tracking-wide text-slate-900 dark:text-white">Transfer Points</h1>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 bg-green-400 dark:bg-green-900/30 text-green-700 dark:text-green-400 transition-colors">
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">How it works</span>
        </button>
      </div>

      <div className="pt-[calc(env(safe-area-inset-top,1rem)+3rem)] px-1.5 max-w-lg mx-auto space-y-6">

        {/* HERO CARD */}
        <div className="relative overflow-hidden rounded-xl p-5 bg-gradient-to-bl from-primary to-green-950  text-white">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center border border-green-600/50">
                <ArrowRightLeft className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white mb-0.5">Your Available Balance</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black">{rewardPoints}</span>
                  <span className="text-lg font-bold text-green-400">GFP</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-green-100/80 mb-3">Keep going! Every green action counts.</p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-800 border border-green-700/50 text-[10px] font-bold text-green-300 uppercase tracking-wider">
                <div className="w-3 h-3 rounded-full border border-green-400 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-green-400" /></div>
                100 GFP = KES 50
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* MAIN FORM CARD */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-6">

          {/* Recipient */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Recipient Phone Number</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter the phone number linked to the recipient's account</p>
              </div>
            </div>
            <div className="relative flex items-center pt-2">
              <span className="absolute left-4 text-slate-400">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-12 pr-14 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-green-500 transition-colors placeholder:text-slate-400"
              />
              <button className="absolute right-4 p-1 rounded-md bg-green-50 dark:bg-green-900/30">
                <User className="w-5 h-5 text-green-600 dark:text-green-500" />
              </button>
            </div>
          </div>

          <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">Amount (GFP)</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enter the number of points to transfer</p>
              </div>
            </div>
            <div className="pt-2">
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || Number(val) >= 0) setAmount(val);
                }}
                placeholder="0"
                className="w-full bg-transparent border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 px-4 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-green-500 transition-colors placeholder:text-slate-400"
              />

              {/* Quick Select */}
              <div className="flex gap-2 mt-3">
                {[50, 100, 500].map(val => (
                  <button
                    key={val}
                    onClick={() => setAmount(val.toString())}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${transferAmount === val
                      ? 'bg-green-50 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-400'
                      : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    {val} GFP
                  </button>
                ))}
              </div>

              {transferAmount > rewardPoints && (
                <div className="flex items-center gap-1.5 text-red-500 mt-3">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">You don't have enough GFP</span>
                </div>
              )}
            </div>
          </div>

          {/* Secure & Instant */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-500" />
              <div>
                <p className="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">Secure & Instant</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Points are transferred instantly and securely.</p>
              </div>
            </div>
            <Lock className="w-5 h-5 text-green-600/50 dark:text-green-500/50" />
          </div>

          <button
            onClick={handleTransfer}
            disabled={isProcessing || !phone || !amount || transferAmount > rewardPoints || transferAmount <= 0}
            className={`w-full py-4 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 ${isProcessing || !phone || !amount || transferAmount > rewardPoints || transferAmount <= 0
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
              : 'bg-green-700 hover:bg-green-800 active:scale-95 shadow-md shadow-green-700/20'
              }`}
          >
            {isProcessing ? 'Processing...' : 'Send Points'}
            {!isProcessing && <ArrowRightLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* RECENT TRANSFERS */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transfers</h3>
            <button className="text-[11px] font-bold text-green-600 dark:text-green-500 hover:underline">View all</button>
          </div>

          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-2 shadow-sm">
            {[
              { initials: 'MW', name: 'Mercy W.', phone: '0712 345 678', gfp: 100, time: 'Today, 10:24 AM' },
              { initials: 'JO', name: 'John O.', phone: '0722 111 444', gfp: 50, time: 'Yesterday, 4:15 PM' },
            ].map((transfer, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                    {transfer.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{transfer.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{transfer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[13px] font-bold text-green-600 dark:text-green-500 mb-0.5">{transfer.gfp} GFP</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500">{transfer.time}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GOOD TO KNOW */}
        <div className="bg-green-600 dark:bg-green-900 border border-green-100 dark:border-green-900/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-green-600 dark:text-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white dark:text-slate-300 mb-0.5">Good to know</p>
            <p className="text-[11px] text-white/80 dark:text-slate-400/80 leading-snug">You can only transfer points to users who have a Klinflow account.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-white/50 dark:text-green-500/50 shrink-0" />
        </div>

      </div>
    </div>
  );
}
