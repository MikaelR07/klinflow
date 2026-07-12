import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, HelpCircle, Wallet, Phone, Contact,
  CheckCircle2, Leaf, User, Tag, Clock, Users,
  ChevronRight, Send, Lock, ArrowLeftRight, Loader2, X, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService, WalletRecipientSearchResult, TransferResult, WALLET_CONFIG } from '@klinflow/core';
import { toast } from 'sonner';

export default function TransferGFP() {
  const navigate = useNavigate();
  const { userId } = useAuthStore();
  const [walletBalance, setWalletBalance] = useState(0);

  // Wizard state
  const [step, setStep] = useState(1);

  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searchedRecipient, setSearchedRecipient] = useState<WalletRecipientSearchResult | null>(null);
  const [recipient, setRecipient] = useState<WalletRecipientSearchResult | null>(null);
  
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  const transferAmount = Number(amount) || 0;
  const equivalentKes = transferAmount * WALLET_CONFIG.GFP_TO_KES_RATE;

  useEffect(() => {
    if (userId) {
      walletService.getWalletDetails(userId).then(data => {
        if (data) setWalletBalance(data.available_points);
      });
    }
  }, [userId]);

  const searchUser = async () => {
    if (!phone || phone.length < 4) return toast.error('Enter a valid phone or ID to search');
    setIsSearching(true);
    setSearchAttempted(true);
    setSearchedRecipient(null);
    try {
      const result = await walletService.searchRecipient(phone);
      setSearchedRecipient(result);
    } catch (err) {
      setSearchedRecipient(null);
    } finally {
      setIsSearching(false);
    }
  };

  const selectRecipient = (user: WalletRecipientSearchResult) => {
    setRecipient(user);
    toast.success(`${user.full_name} selected`);
    setStep(2);
  };

  const handleNextStep1 = () => {
    if (!recipient) return toast.error('Please select a valid recipient');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!amount || transferAmount < WALLET_CONFIG.MIN_TRANSFER_POINTS) return toast.error(`Minimum transfer amount is ${WALLET_CONFIG.MIN_TRANSFER_POINTS} GFP`);
    if (transferAmount > walletBalance) return toast.error('Insufficient GFP balance');
    setStep(3);
  };

  const executeTransfer = async () => {
    if (!recipient) return;
    
    setIsProcessing(true);
    const result = await walletService.transferPoints(recipient.user_id, transferAmount, 'Transfer from App');
    setIsProcessing(false);

    if (result.success) {
      setTransferResult(result);
      if (result.sender_balance_after !== undefined) {
         setWalletBalance(result.sender_balance_after);
      }
    } else {
      toast.error('Transfer Failed', { description: result.error });
    }
  };

  return (
    <div className="-mx-1 px-1 bg-[#F8F8FF] dark:bg-slate-900 text-slate-900 dark:text-white pb-5 relative  overflow-x-hidden">
      
      {/* EMERALD TOP BACKGROUND */}
      <div className="absolute top-0 left-0 right-0 h-[330px] bg-gradient-to-b from-primary to-primary rounded-b-[40%] scale-x-[1.5] z-0 shadow-sm" />

      {/* HEADER */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary  backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+0.6rem)] pb-3 px-4 max-w-lg mx-auto flex items-start justify-between">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 active:scale-95 transition-all relative z-10">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div className="absolute left-0 right-0 bottom-2 flex flex-col items-center pointer-events-none text-center px-12">
          <h1 className="text-[17px] font-bold tracking-wide text-white leading-tight">Transfer GFP</h1>
          <p className="text-[9px] text-emerald-100/90 font-medium tracking-wider uppercase mt-0.5">Share your tokens with loved ones</p>
        </div>

        <button 
          onClick={() => navigate('/wallet-history')}
          className="relative z-10 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm mt-0.5 border border-white/10"
        >
          <Clock className="w-3.5 h-3.5 text-white" />
          <span className="text-xs font-bold text-white">History</span>
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 pt-[calc(env(safe-area-inset-top,1rem)+4rem)] px-1.5 max-w-lg mx-auto space-y-4">

        {/* HERO IMAGE CARD */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg bg-emerald-900 border border-emerald-400/20 flex items-center justify-center">
          <img 
            src="/vectors/money.webp" 
            alt="Transfer GFP" 
            className="w-full h-auto opacity-90"
          />
        </div>

        {/* STATS CARD */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Available Balance</p>
              <div className="flex items-baseline justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="text-base font-black leading-none">
                  {walletBalance.toLocaleString()}
                </span>
                <span className="text-xs font-bold">GFP</span>
              </div>
            </div>
            
            <div className="w-[1px] h-10 bg-slate-200 dark:bg-slate-700" />

            <div className="text-center flex-1">
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Worth (KES)</p>
              <div className="flex items-baseline justify-center gap-1 text-amber-600 dark:text-amber-500">
                <span className="text-base font-black leading-none">
                  {(walletBalance * WALLET_CONFIG.GFP_TO_KES_RATE).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-STEP WIZARD FORM */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mt-4 min-h-[300px]">
          
          {/* STEP INDICATOR */}
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`h-1.5 w-12 rounded-full transition-colors duration-300 ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
          </div>

          {/* STEP 1: RECIPIENT */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-5">
                <h3 className="text-[15px] font-bold text-slate-700 dark:text-white uppercase tracking-wider mb-1">Step 1: Recipient</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Search by Klinflow ID or phone</p>
              </div>

              {!recipient && (
                <div className="bg-primary  rounded-2xl p-3 mb-5 border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-[11px] text-emerald-50 dark:text-emerald-300 font-medium leading-relaxed">
                    Enter the registered phone number or Klinflow ID of the person you want to send points to. Make sure they have a verified Klinflow account.
                  </p>
                </div>
              )}

              {!recipient ? (
                <>
                  <div className="relative flex items-center gap-2 mb-4">
                    <div className="relative flex-1">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setSearchAttempted(false);
                          setSearchedRecipient(null);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') searchUser(); }}
                        placeholder="e.g. 0712... or KPT..."
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      onClick={searchUser}
                      disabled={isSearching || !phone}
                      className="px-5 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-bold tracking-wide disabled:opacity-50 hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {searchAttempted && !isSearching && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      {searchedRecipient ? (
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-600 shadow-sm">
                              {searchedRecipient.avatar ? (
                                <img src={searchedRecipient.avatar} alt="avatar" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm font-black text-slate-500 dark:text-slate-400">{searchedRecipient.full_name.charAt(0)}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0.5">{searchedRecipient.full_name}</h4>
                              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                                {searchedRecipient.account_type.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => selectRecipient(searchedRecipient)}
                            className="w-full mt-4 py-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                          >
                            Select Recipient
                          </button>
                        </div>
                      ) : (
                        <div className="bg-red-50 dark:bg-red-500/10 rounded-2xl p-4 border border-red-100 dark:border-red-500/20 text-center animate-in fade-in zoom-in-95">
                          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 mx-auto flex items-center justify-center mb-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          </div>
                          <p className="text-xs font-bold text-red-600 dark:text-red-400">User Not Found</p>
                          <p className="text-[10px] font-medium text-red-500/80 dark:text-red-400/80 mt-0.5">Please check the number or ID and try again.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-500/20 relative animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => {
                      setRecipient(null);
                      setSearchedRecipient(null);
                      setSearchAttempted(false);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Selected Recipient</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-200 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-lg font-bold overflow-hidden shadow-sm">
                      {recipient.avatar ? <img src={recipient.avatar} alt="avatar" className="w-full h-full object-cover" /> : recipient.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight mb-1">{recipient.full_name}</h4>
                      <span className="px-2 py-0.5 bg-emerald-200/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-md">
                        {recipient.account_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {recipient && (
                <button 
                  onClick={handleNextStep1} 
                  className="w-full mt-6 py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* STEP 2: AMOUNT */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep(1)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 active:scale-95 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center pr-8">
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Step 2: Amount</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Enter points to transfer</p>
                </div>
              </div>

              <div className="relative flex items-center mb-3">
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
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-12 pr-12 text-lg font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-300"
                />
                <span className="absolute right-4 text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                  GFP
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {['50', '100', '200', 'Max'].map(label => {
                  const val = label === 'Max' ? walletBalance : parseInt(label);
                  const isSelected = transferAmount === val;
                  return (
                    <button
                      key={label}
                      onClick={() => setAmount(val.toString())}
                      className={`py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={handleNextStep2} 
                disabled={transferAmount < WALLET_CONFIG.MIN_TRANSFER_POINTS || transferAmount > walletBalance} 
                className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                Review Transfer <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: SUMMARY */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setStep(2)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 active:scale-95 transition-all">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center pr-8">
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Step 3: Confirm</h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Review final details</p>
                </div>
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
                    <span className="text-slate-500 font-medium">Worth</span>
                    <span className="font-bold text-amber-600">KES {equivalentKes.toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">Transfer Fee</span>
                    <span className="font-bold text-emerald-500 uppercase">Free</span>
                 </div>
                 <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Remaining Balance</span>
                    <span className="font-bold text-slate-900 dark:text-white">{(walletBalance - transferAmount).toLocaleString()} GFP</span>
                 </div>
              </div>

              <button
                 onClick={executeTransfer}
                 disabled={isProcessing}
                 className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] flex justify-center items-center gap-2"
              >
                 {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                   <>Confirm & Send <Send className="w-4 h-4 ml-1" /></>
                 )}
              </button>
            </div>
          )}

        </div>
        
        {/* SECURE INDICATOR */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2 pb-6">
          <Lock className="w-3 h-3" />
          <span>Secure • Instant • Free</span>
        </div>

      </div>

      {/* SUCCESS MODAL OVERLAY */}
      {transferResult?.success && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-gradient-to-b from-emerald-600 to-emerald-800 w-full max-w-[320px] rounded-[2rem] p-6 text-center text-white relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-emerald-400/20">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-900/40 rounded-full blur-2xl pointer-events-none" />
             
             <div className="relative z-10">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                   <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                
                <h1 className="text-2xl font-black tracking-tight mb-1 leading-tight">Transfer<br/>Successful!</h1>
                <p className="text-xs text-emerald-100 font-medium mb-6">Points sent securely.</p>
                
                <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm border border-white/10 mb-6 space-y-2.5">
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">Amount Sent</span>
                      <span className="font-bold">{transferResult.amount?.toLocaleString()} GFP</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">Recipient</span>
                      <span className="font-bold">{recipient?.full_name}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="text-emerald-200">Ref No.</span>
                      <span className="font-bold tracking-widest uppercase">{transferResult.reference_number}</span>
                   </div>
                </div>
                
                <button 
                  onClick={() => navigate('/resident-wallet')}
                  className="w-full bg-white text-emerald-700 hover:text-emerald-800 py-3.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
                >
                   Return to Wallet
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
