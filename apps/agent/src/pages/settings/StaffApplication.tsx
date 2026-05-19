import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Briefcase, ChevronRight, Loader2, CheckCircle2,
  Truck, ShieldAlert, RefreshCw, Heart, TrendingUp, Award, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

export default function StaffApplication() {
  const navigate = useNavigate();
  const { profile, updateProfile, userId } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isStaff = profile?.isStaff === true || profile?.is_staff === true;
  const hasFleetId = !!(profile?.fleetId || profile?.fleet_id);
  const isVerified = isStaff || hasFleetId;
  const isPending = !isVerified && (profile?.notes || '').includes('staff_application_pending');

  // FORCE SYNC: Query Supabase directly to get fresh values
  const forceSync = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;

      useAuthStore.setState({
        profile: {
          ...useAuthStore.getState().profile,
          ...data,
          isStaff: data.is_staff === true,
          fleetId: data.fleet_id,
          notes: data.notes || '',
        }
      });

      toast.success("Status Refreshed", { 
        description: data.is_staff ? "Welcome to the team!" : "Application is still under review." 
      });
    } catch (err) {
      console.error('[StaffApp] Sync Error:', err);
      toast.error("Sync failed");
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  const handleApply = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const currentNotes = profile?.notes || '';
      if (currentNotes.includes('staff_application_pending')) {
        toast.info("Already applied!");
        return;
      }
      const updatedNotes = (currentNotes + ' | staff_application_pending').trim();
      await updateProfile({ notes: updatedNotes });
      toast.success("Application Submitted! 📋");
    } catch (err) {
      toast.error("Submission failed", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: <Award className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-50 dark:bg-amber-500/10",
      title: "Priority Dispatch",
      description: "Receive high-value commercial and bulk orders first before independent operators, ensuring optimal daily earnings."
    },
     {
      icon: <Truck className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      title: "Official PPE & Safety Uniforms",
      description: "Free heavy-duty high-vis overalls, safety boots, puncture-resistant gloves, and branded identity cards."
    },
    {
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      bg: "bg-rose-50 dark:bg-rose-500/10",
      title: "Medical & Injury Insurance",
      description: "Comprehensive coverage under WIBA (Work Injury Benefits Act) and local partner clinic medical benefits."
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      title: "App Data & Airtime Bundles",
      description: "Free monthly communication bundles (data & airtime) to cover continuous operations and map navigation."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-500/10",
      title: "NEMA Licensing Support",
      description: "Get company backing and training for NEMA waste handling certificates and regulatory compliance."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50 dark:bg-blue-500/10",
      title: "NEMA Compliance Care",
      description: "Full regulatory guidance from our legal department, simplifying license applications, environmental audits, and renewals."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors pb-24">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Staff Program</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Klinflow Team</p>
            </div>
          </div>
          <button 
            onClick={forceSync}
            disabled={isRefreshing}
            className="p-2 bg-slate-105 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 rounded-xl transition-all active:scale-95 flex items-center justify-center"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+3.5rem)] px-4 max-w-lg mx-auto w-full space-y-6 mt-4">
        
        {isVerified ? (
          // ── VERIFIED STAFF VIEW ──
          <div className="space-y-6 animate-fade-in text-center py-6">
            <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
               <ShieldCheck className="w-12 h-12 text-primary" />
            </div>
            <div className="space-y-2">
               <h1 className="text-2xl font-bold dark:text-white tracking-tight">Official Staff Account</h1>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Congratulations, you are a verified member of the Klinflow team.</p>
            </div>
            
            <div className="bg-green-300 rounded-2xl p-2 text-white space-y-2  border border-white/5">
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Your Staff ID</p>
               <h2 className="text-3xl t-black tracking-tight text-primary">{profile?.fleetId || profile?.fleet_id || 'CF-STAFF-ACTIVE'}</h2>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 text-left space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Staff Privileges</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Receive high-value commercial and bulk orders first before independent operators, ensuring optimal daily earnings</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Get company backing and training for NEMA waste handling certificates and regulatory compliance</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Free heavy-duty high-vis overalls, safety boots, puncture-resistant gloves, and branded identity cards</p>
                </div>
              </div>
            </div>


          </div>
        ) : isPending ? (
          // ── PENDING STATE VIEW ──
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6 shadow-sm">
             <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mx-auto text-amber-500 animate-pulse">
                <Briefcase className="w-8 h-8" />
             </div>
             <div className="space-y-3">
                <h2 className="text-xl font-bold dark:text-white tracking-tight leading-none">Review in Progress</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  We are verifying your credentials and registration details. Approval typically takes less than 24 hours.
                </p>
             </div>
             <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-3">
               <button 
                 onClick={forceSync}
                 disabled={isRefreshing}
                 className="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
               >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Checking...' : 'Check Approval Status'}
               </button>
               <button onClick={() => navigate('/settings')} className="w-full py-4 bg-slate-50 dark:bg-slate-850 rounded-2xl font-semibold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  Return to Settings
               </button>
             </div>
          </div>
        ) : (
          // ── APPLICATION FORM & DETAILED BENEFITS VIEW ──
          <div className="space-y-6">
            
            {/* Header Hero Banner */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-white/5">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -mr-10 -mt-10" />
               <div className="relative z-10 space-y-3">
                 <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                    <Sparkles className="w-5 h-5 text-primary" />
                 </div>
                 <h2 className="text-xl font-black uppercase tracking-tight leading-none">Klinflow Staff</h2>
                 <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                   Upgrade your operator profile to gain exclusive access to corporate logistics orders, fleet operations support, and financial rewards.
                 </p>
               </div>
            </div>

            {/* Core Program Benefits */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 px-1">Program Benefits</h3>
              
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-100 dark:border-slate-800 flex gap-4 shadow-sm">
                    <div className={`w-10 h-10 rounded-xl ${benefit.bg} flex items-center justify-center shrink-0`}>
                      {benefit.icon}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{benefit.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Consent & Action Button */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
               <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 flex gap-3 items-center">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0" />
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-450 leading-tight">
                    HQ Verification: By submitting your application, you authorize the review team to run credentials checks, including NEMA registrations.
                  </p>
               </div>

               <button 
                 onClick={handleApply}
                 disabled={isSubmitting}
                 className="w-full py-4.5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-primary/10"
               >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>SUBMIT STAFF APPLICATION</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
               </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
