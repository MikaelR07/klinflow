/**
 * FinancingHub.jsx — Embedded Micro-Loans & Equipment Financing
 * Unlocks capital for weavers based on their Circular Resume.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Bike, 
  Smartphone, 
  ChevronRight, 
  Sparkles,
  Info,
  CheckCircle2,
  Lock,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

const LOAN_OFFERS: any[] = [
  {
    id: 'cargo-bike-2024',
    title: 'Cargo Bike Financing',
    description: 'Triple your collection capacity with a heavy-duty electric cargo bike.',
    amount: 45000,
    tenure: '12 Months',
    interest: '5% Fixed',
    requiredScore: 75,
    requiredVolume: 500, // KG
    icon: Bike,
    color: 'emerald'
  },
  {
    id: 'smart-scale-pro',
    title: 'Smart Scale Pro',
    description: 'Verified digital scales for instant material grading and payouts.',
    amount: 8500,
    tenure: '3 Months',
    interest: '0% Interest',
    requiredScore: 50,
    requiredVolume: 100,
    icon: TrendingUp,
    color: 'blue'
  },
  {
    id: 'working-capital-1',
    title: 'Weekly Working Capital',
    description: 'Cash advance for material acquisition and operational costs.',
    amount: 5000,
    tenure: '1 Week',
    interest: '2% Flat',
    requiredScore: 85,
    requiredVolume: 1000,
    icon: Wallet,
    color: 'indigo'
  }
];

export default function FinancingHub() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  // Mock metrics derived from "Circular Resume" logic
  const trustScore = 78; // In real app, this comes from store
  const totalVolume = 642; 
  
  const [selectedLoan, setSelectedLoan] = useState<any>(null);  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 ">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div>
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">Klinflow Capital</h1>
              <p className="text-[10px] font-bold text-emerald-500 capitalize tracking-[0.2em]">Growth & Equipment Hub</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
             <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">
        {/* ── REPUTATION SNAPSHOT ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 text-slate-900 dark:text-white shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
           <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize tracking-widest">Borrowing Power</p>
                 <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">High</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 </div>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 capitalize tracking-widest">Trust Integrity</p>
                 <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{trustScore}%</p>
              </div>
           </div>
        </div>

        {/* ── LOAN OFFERS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-[11px] font-semibold text-slate-400 capitalize tracking-widest">Available Financing</h2>
             <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
               <Sparkles className="w-3 h-3" /> BASED ON YOUR RESUME
             </span>
          </div>

          <div className="space-y-4">
            {LOAN_OFFERS.map((loan: any) => {
              const isUnlocked = trustScore >= loan.requiredScore && totalVolume >= loan.requiredVolume;
              
              return (
                <div 
                  key={loan.id}
                  onClick={() => isUnlocked && setSelectedLoan(loan)}
                  className={`p-5 rounded-2xl border-2 transition-all relative overflow-hidden group ${
                    isUnlocked 
                      ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 active:scale-[0.98]' 
                      : 'bg-slate-100/50 dark:bg-slate-900/40 border-transparent opacity-60'
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-100 dark:border-slate-700">
                           <Lock className="w-3 h-3 text-slate-400" />
                           <span className="text-[10px] font-bold text-slate-500 capitalize tracking-widest">Requires {loan.requiredScore}% Trust</span>
                        </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-${loan.color === 'emerald' ? 'emerald' : loan.color === 'blue' ? 'blue' : 'indigo'}-500/10 flex items-center justify-center text-${loan.color === 'emerald' ? 'emerald' : loan.color === 'blue' ? 'blue' : 'indigo'}-500`}>
                      <loan.icon className="w-6 h-6" />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Loan Amount</p>
                       <p className="text-base font-bold text-slate-900 dark:text-white">KSh {loan.amount.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{loan.title}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-snug mt-1">{loan.description}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                     <div className="flex gap-4">
                        <div>
                           <p className="text-[9px] font-semibold text-slate-400 capitalize tracking-widest leading-none mb-1">Tenure</p>
                           <p className="text-[11px] font-semibold text-slate-900 dark:text-white">{loan.tenure}</p>
                        </div>
                        <div>
                           <p className="text-[9px] font-semibold text-slate-400 capitalize tracking-widest leading-none mb-1">Interest</p>
                           <p className="text-[11px] font-semibold text-emerald-500">{loan.interest}</p>
                        </div>
                     </div>
                     {isUnlocked && <ChevronRight className="w-5 h-5 text-slate-300" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── FINANCIAL EDUCATION SECTION ── */}
        <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
           <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white shrink-0">
                 <Info className="w-6 h-6" />
              </div>
              <div>
                 <h3 className="text-xs font-bold capitalize tracking-widest leading-tight mb-2">Growth Advisor</h3>
                 <p className="text-xs font-semibold text-indigo-100/80 leading-relaxed">
                   "You are 58kg away from unlocking the <strong>Working Capital</strong> loan. Keep your purity score above 90% to maintain your interest rates."
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* ── APPLICATION MODAL ── */}
      <AnimatePresence>
        {selectedLoan && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center">
             <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               exit={{ opacity: 0 }}
               onClick={() => setSelectedLoan(null)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
             />
             <motion.div 
               initial={{ y: '100%' }} 
               animate={{ y: 0 }} 
               exit={{ y: '100%' }}
               className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-8 pb-12 shadow-2xl z-10"
             >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-8" />
                
                <div className="flex items-center gap-4 mb-8">
                   <div className={`w-16 h-16 rounded-2xl bg-[rgba(16,185,129,0.1)] flex items-center justify-center text-emerald-500 shadow-inner`}>
                      <selectedLoan.icon className="w-7 h-7" />
                   </div>
                   <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">{selectedLoan.title}</h3>
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mt-1.5">KSh {selectedLoan.amount.toLocaleString()} Principal</p>
                   </div>
                </div>

                <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 mb-8">
                   <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Monthly Installment</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">KSh {(selectedLoan.amount / 12 * 1.05).toFixed(0)}</p>
                   </div>
                   <div className="flex justify-between items-center">
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Repayment Period</p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedLoan.tenure}</p>
                   </div>
                   <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <p className="text-[10px] font-bold text-slate-500 capitalize leading-snug">No collateral required. Your transaction history is your security.</p>
                   </div>
                </div>

                <button 
                  onClick={() => {
                    toast.success("Application Received!", { description: "Our credit team is reviewing your Circular Resume." });
                    setSelectedLoan(null);
                  }}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-sm capitalize tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Apply for Financing
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
