/**
 * RequestVerificationPage — Seller-only page to request Klinflow identity verification.
 * Sends a verification request to the admin team via a Supabase insert.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ShieldCheck, Upload, CheckCircle2, Clock, 
  FileText, Camera, AlertCircle, Loader2
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function RequestVerificationPage() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);

  const [idNumber, setIdNumber] = useState(profile?.idNumber || '');
  const [businessName, setBusinessName] = useState(profile?.companyName || '');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isAlreadyVerified = profile?.isVerified === true;

  const handleSubmit = async () => {
    if (!idNumber.trim()) {
      toast.error('Please enter your National ID or Business Registration number.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert a verification request into the notifications table for admin review
      const { error } = await supabase.from('notifications').insert({
        title: '🔒 Verification Request',
        content: `Seller "${profile?.name}" (${profile?.phone}) is requesting Klinflow Verification.\n\nID/Reg: ${idNumber}\nBusiness: ${businessName || 'N/A'}\nReason: ${reason || 'Standard verification'}\nProfile ID: ${profile?.id}`,
        type: 'security',
        target_role: 'admin',
        target_user: null,
        is_read: false,
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success('Verification request submitted!');
    } catch (err) {
      console.error('Verification request failed:', err);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAlreadyVerified) {
    return (
      <div className="flex flex-col bg-slate-50 dark:bg-slate-800  font-sans overflow-hidden">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3 px-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Verification Status</h1>
          </div>
        </div>
        
        <main className="flex-1 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+6rem)] pb-12 max-w-xl mx-auto w-full flex items-center justify-center relative">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            transition={{ type: "spring", bounce: 0.5 }}
            className="w-full bg-gradient-to-br from-amber-500/20 via-amber-600/20 to-amber-900/40  rounded-[2rem] p-1 shadow-2xl relative z-10"
          >
            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-[1.85rem] p-8 md:p-10 text-center relative overflow-hidden">
              
              {/* Shine effect */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
              
              {/* Confetti Emojis */}
              <div className="absolute top-4 left-0 right-0 h-32 pointer-events-none flex justify-center z-0">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -10, opacity: 1 }} transition={{ delay: 0.3, duration: 1 }} className="absolute -ml-24 mt-4 text-2xl">🎉</motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -5, opacity: 1 }} transition={{ delay: 0.5, duration: 1.2 }} className="absolute ml-28 mt-2 text-3xl">🎊</motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: -15, opacity: 1 }} transition={{ delay: 0.7, duration: 0.8 }} className="absolute -ml-10 mt-12 text-xl">✨</motion.div>
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 1.1 }} className="absolute ml-12 mt-10 text-2xl">🎉</motion.div>
              </div>

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.6, delay: 0.2 }}
                className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center  mb-6 border-4 border-amber-100 dark:border-slate-800 relative z-10"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-400 dark:from-amber-300 dark:to-white tracking-tight mb-2">
                Identity Confirmed
              </h2>
              
              <p className="text-sm text-slate-200 max-w-sm mx-auto mb-8 leading-relaxed">
                Your professional identity has been verified on the Klinflow network. You now have full access to premium trust badges and priority visibility.
              </p>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/50 mb-8 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Account Holder</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{profile?.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Klinflow ID</span>
                  <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">{profile?.klinflowId || profile?.id?.slice(0,8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-400 px-2 py-0.5 rounded-full uppercase tracking-widest">Verified</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/circular-resume')} 
                className="w-full px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg hover:bg-slate-800 dark:hover:bg-slate-100 flex items-center justify-center gap-2"
              >
                View Circular Resume <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col bg-slate-50 dark:bg-slate-800 min-h-screen font-sans">
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3 px-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Verification</h1>
          </div>
        </div>
        <main className="flex-1 px-4 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] pb-24 max-w-xl mx-auto w-full flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Request Submitted</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">Our team will review your information and verify your identity within 24-48 hours. You'll receive a notification once approved.</p>
            <button onClick={() => navigate('/circular-resume')} className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm active:scale-95 transition-all">
              Back to Resume
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 font-sans">
      {/* Top Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3 px-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Get Verified</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">Identity Verification</p>
          </div>
        </div>
      </div>

      <main className="flex-1 px-4 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] pb-12 max-w-xl mx-auto w-full space-y-6">
        
        {/* Info Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">Why get verified?</h3>
              <p className="text-[12px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Verified sellers get a green badge on their Circular Resume, higher trust scores, and priority visibility to buyers. Verification proves your identity is real and your business is legitimate.
              </p>
            </div>
          </div>
        </div>

        {/* Requirements + Form Wrapper */}
        <div className="bg-slate-200 dark:bg-slate-800/50 rounded-2xl p-3 space-y-3">
          {/* Requirements */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">What We Need</h3>
            <div className="space-y-3">
              {[
                { icon: FileText, label: 'National ID or Passport Number', required: true },
                { icon: Camera, label: 'Business Name (if applicable)', required: false },
                { icon: AlertCircle, label: 'Brief description of your activity', required: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{item.label}</span>
                  {item.required && <span className="text-[9px] font-bold text-red-500 uppercase">Required</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Your Information</h3>
            
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">National ID / Business Reg. *</label>
              <input 
                type="text"
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder="e.g., 12345678"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Business Name (Optional)</label>
              <input 
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g., Green Recyclers Ltd"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Why do you want verification? (Optional)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g., I want buyers to trust my profile..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <button 
          onClick={handleSubmit}
          disabled={isSubmitting || !idNumber.trim()}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : (
            <><ShieldCheck className="w-4 h-4" /> Submit Verification Request</>
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
          By submitting, you confirm that the information provided is accurate. Klinflow may contact you for additional verification steps.
        </p>

      </main>
    </div>
  );
}
