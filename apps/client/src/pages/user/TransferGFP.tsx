import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, Wallet, Phone, Contact,
  CheckCircle2, Leaf, User, Tag, Clock, Users,
  ChevronRight, Send, Lock,
  ArrowLeftRight, Loader2, X
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, WalletRecipientSearchResult, TransferResult } from '@klinflow/core';
import { toast } from 'sonner';

export default function TransferGFP() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(0);

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipient, setRecipient] = useState<WalletRecipientSearchResult | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  const transferAmount = Number(amount) || 0;
  const equivalentKes = transferAmount / 2; // Assuming 2 GFP = 1 KES

  useEffect(() => {
    if (userId) {
      walletService.getWalletDetails(userId).then(data => {
        if (data) setWalletBalance(data.available_points);
      });
    }
  }, [userId]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (phone && phone.length >= 8) {
        searchUser();
      } else {
        setRecipient(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [phone]);

  const searchUser = async () => {
    setIsSearching(true);
    try {
      const result = await walletService.searchRecipient(phone);
      setRecipient(result);
    } catch (err) {
      setRecipient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInitTransfer = () => {
    if (!recipient) return toast.error('Please select a valid recipient');
    if (!amount || transferAmount < 10) return toast.error('Minimum transfer amount is 10 GFP');
    if (transferAmount > walletBalance) return toast.error('Insufficient GFP balance');
    
    setShowConfirmModal(true);
  };

  const executeTransfer = async () => {
    if (!recipient) return;
    
    setIsProcessing(true);
    const result = await walletService.transferPoints(recipient.user_id, transferAmount, 'Transfer from App');
    setIsProcessing(false);
    setShowConfirmModal(false);

    if (result.success) {
      setTransferResult(result);
      if (result.sender_balance_after !== undefined) {
         setWalletBalance(result.sender_balance_after);
      }
    } else {
      toast.error('Transfer Failed', { description: result.error });
    }
  };

  if (transferResult?.success) {
    return (
      <div className="flex flex-col min-h-screen bg-emerald-500 items-center justify-center p-6 text-center text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-900/20 rounded-full blur-3xl" />
         
         <div className="relative z-10 w-full max-w-sm mx-auto">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
               <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            
            <h1 className="text-3xl font-black tracking-tight mb-2">Transfer<br/>Successful!</h1>
            <p className="text-emerald-100 font-medium mb-8">Your points have been sent securely.</p>
            
            <div className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm border border-white/20 mb-8 space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-100">Amount Sent</span>
                  <span className="font-bold">{transferResult.amount?.toLocaleString()} GFP</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-100">Recipient</span>
                  <span className="font-bold">{recipient?.full_name}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-emerald-100">Reference No.</span>
                  <span className="font-bold tracking-widest uppercase">{transferResult.reference_number}</span>
               </div>
            </div>
            
            <button 
              onClick={() => navigate('/resident-wallet')}
              className="w-full bg-white text-emerald-600 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform"
            >
               Return to Wallet
            </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Transfer Points</h1>
          </div>
          <button 
            onClick={() => navigate('/wallet-history')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">History</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] pb-[20px] max-w-lg mx-auto w-full px-1.5 space-y-4">

        {/* HERO CARD */}
        <div className="relative rounded-xl p-4 text-white overflow-hidden shadow-sm bg-emerald-800">
          {/* Background Image */}
          <div
            className="absolute inset-0 w-full h-full z-0"
            style={{ 
              backgroundImage: "url('/vectors/money.webp')",
              backgroundSize: "cover",
              backgroundPosition: "50% center",
              backgroundRepeat: "no-repeat"
            }}
          />

          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10 z-0" />

          <div className="relative z-10">
            <div className="flex flex-col gap-4 p-1">
              <div>
                <h2 className="text-2xl font-black text-slate-50 tracking-tighter leading-none mb-1.5">
                 Gift your GFP
                </h2>
                <p className="text-xs font-semibold text-slate-200 leading-snug max-w-[75%]">
                  Share your recycling rewards instantly with friends, family, or community members.
                </p>
              </div>

              <div className="inline-flex items-center gap-3 bg-green-700  rounded-[1rem] p-2 shadow-md">
                <div className="w-10 h-10 rounded-[0.85rem] bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="pr-4">
                  <p className="text-[9px] text-slate-50 font-bold uppercase tracking-widest mb-0.5">Available Balance</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[20px] font-black text-slate-50 tracking-tight leading-none">{walletBalance.toLocaleString()}</span>
                    <span className="text-[11px] font-bold text-emerald-300">GFP</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300 mx-0.5" />
                    <span className="text-[10px] font-bold text-slate-50">KES {(walletBalance / 2).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 1: RECIPIENT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Who are you sending to?</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Search by Klinflow ID or phone number.</p>
            </div>
          </div>

          <div className="relative flex items-center mb-4">
            <span className="absolute left-4 text-slate-400">
              <Phone className="w-4 h-4" />
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712... or KPT..."
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-12 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400 placeholder:font-medium"
            />
            <button className="absolute right-3 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all">
              <Contact className="w-4 h-4" />
            </button>
          </div>

          {isSearching && (
             <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
             </div>
          )}

          {!isSearching && recipient && (
            <div className="flex items-center justify-between p-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-700 ">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold overflow-hidden">
                  {recipient.avatar ? <img src={recipient.avatar} alt="avatar" className="w-full h-full object-cover" /> : recipient.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-slate-900 text-white leading-tight mb-0.5">{recipient.full_name}</h4>
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-[10px] text-slate-200 capitalize tracking-widest leading-none">{recipient.account_type}</p>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="text-[9px] font-bold tracking-widest uppercase">{recipient.klinflow_id}</span>
                  </div>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: AMOUNT */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">How many points?</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Enter the amount of GFP to transfer.</p>
            </div>
          </div>

          <div className="relative flex items-center mb-2">
            <span className="absolute left-4 text-emerald-600 dark:text-emerald-400">
              <Leaf className="w-5 h-5" />
            </span>
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
              className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-12 pr-12 text-2xl font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-300"
            />
            <span className="absolute right-4 text-[13px] font-bold text-emerald-700 dark:text-emerald-400">
              GFP
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-4 px-1">
            <span>Available: {walletBalance.toLocaleString()} GFP</span>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-600"></span>
            <span>≈ KES {(walletBalance / 2).toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {['100 GFP', '250 GFP', '500 GFP', `Max (${walletBalance.toLocaleString()})`].map(label => {
              const val = label.startsWith('Max') ? walletBalance : parseInt(label);
              const isSelected = transferAmount === val;
              return (
                <button
                  key={label}
                  onClick={() => setAmount(val.toString())}
                  className={`py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-200'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 3: SUMMARY */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Transfer Summary</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Review the details before confirming.</p>
            </div>
          </div>

          <div className="space-y-3 px-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-500">
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold capitalize tracking-widest">Recipient</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{recipient?.full_name || '-'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-500">
                <Leaf className="w-3.5 h-3.5" />
                <span className="font-semibold capitalize tracking-widest">Amount</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">{transferAmount.toLocaleString()} GFP</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-500">
                <Wallet className="w-3.5 h-3.5" />
                <span className="font-semibold capitalize tracking-widest">Value</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">KES {equivalentKes.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 text-slate-500">
                <Tag className="w-3.5 h-3.5" />
                <span className="font-semibold capitalize tracking-widest">Transfer Fee</span>
              </div>
              <span className="font-black text-emerald-500 uppercase tracking-widest">Free</span>
            </div>

            <div className="border-t border-dashed border-slate-200 dark:border-slate-700 my-3 pt-3 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock className="w-4 h-4" />
                <span className="font-bold uppercase tracking-widest">Total to Send</span>
              </div>
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-[14px]">{transferAmount.toLocaleString()} GFP</span>
            </div>
          </div>
        </div>

        {/* WHY TRANSFER */}
        <div className="bg-amber-600 rounded-2xl p-4 flex items-center justify-between border border-emerald-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-[85%]">
              <h4 className="text-[11px] font-bold text-white  mb-0.5 tracking-wide uppercase">Why transfer GFP?</h4>
              <p className="text-[10px] font-medium text-slate-100  leading-tight">
                Support other recyclers, reward family members, or share earned rewards with your community and loved ones.
              </p>
            </div>
          </div>
          
        </div>

        {/* ── BOTTOM CTA ── */}
        <div className="pt-2">
          <button
            onClick={handleInitTransfer}
            disabled={isProcessing || !recipient || transferAmount <= 0 || transferAmount > walletBalance}
            className={`w-full py-4 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 mb-3 ${!recipient || transferAmount <= 0 || transferAmount > walletBalance
              ? 'bg-slate-200 dark:bg-primary text-slate-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] shadow-md shadow-emerald-600/20'
              }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Proceed to Transfer
          </button>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-4">
            <Lock className="w-3 h-3" />
            <span>Secure • Instant • Free</span>
          </div>
        </div>

      </main>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center mb-6">
               <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ArrowLeftRight className="w-8 h-8 text-emerald-500" />
               </div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Transfer</h3>
               <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please review the details below.</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-3 mb-6 border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">To</span>
                  <span className="font-bold text-slate-900 dark:text-white">{recipient?.full_name}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{transferAmount.toLocaleString()} GFP</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Transfer Fee</span>
                  <span className="font-bold text-slate-900 dark:text-white">0 GFP</span>
               </div>
               <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Remaining Balance</span>
                  <span className="font-bold text-slate-900 dark:text-white">{(walletBalance - transferAmount).toLocaleString()} GFP</span>
               </div>
            </div>
            
            <button
               onClick={executeTransfer}
               disabled={isProcessing}
               className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-md active:scale-95 flex justify-center items-center gap-2"
            >
               {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
