import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldCheck, Briefcase, FileText, 
  ChevronRight, Loader2, CheckCircle2, AlertCircle,
  Truck, ShieldAlert, RefreshCw
} from 'lucide-react';
import { useAuthStore, supabase } from '@cleanflow/core';
import { toast } from 'sonner';

export default function StaffApplication() {
  const navigate = useNavigate();
  const { profile, updateProfile, userId } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Derive status directly from profile — no local state that can go stale
  const isStaff = profile?.isStaff === true || profile?.is_staff === true;
  const hasFleetId = !!(profile?.fleetId || profile?.fleet_id);
  const isVerified = isStaff || hasFleetId;
  const isPending = !isVerified && (profile?.notes || '').includes('staff_application_pending');

  // FORCE SYNC: Bypass the store, query Supabase directly, then slam the store
  const forceSync = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      console.log('[StaffApp] RAW DB DATA:', { 
        is_staff: data.is_staff, 
        fleet_id: data.fleet_id, 
        notes: data.notes 
      });

      // Force-update the store with fresh DB values
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
        description: data.is_staff ? "You're on the team!" : "Still pending review." 
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

  // ── VERIFIED STAFF VIEW ──
  if (isVerified) {
    return (
      <div className="animate-fade-in px-4 pt-4 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/20">
           <ShieldCheck className="w-12 h-12 text-primary" />
        </div>
        <div>
           <h1 className="text-2xl font-semibold dark:text-white tracking-tight">CleanFlow Staff</h1>
           <p className="text-sm text-slate-500 font-medium mt-1">You are an official CleanFlow team member.</p>
        </div>
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-2 shadow-2xl border border-white/5">
           <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Your Staff ID</p>
           <h2 className="text-4xl font-semibold tracking-tighter text-primary">{profile?.fleetId || profile?.fleet_id || 'CF-FLEET-OK'}</h2>
        </div>
        <button onClick={() => navigate('/settings')} className="w-full py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl font-semibold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all active:scale-95">
           CONTINUE TO DASHBOARD
        </button>
      </div>
    );
  }

  // ── APPLICATION / PENDING VIEW ──
  return (
    <div className="animate-slide-up pb-20 px-4 pt-4 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="text-xl font-semibold dark:text-white tracking-tight">Staff Program</h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Join the Official Team</p>
          </div>
        </div>
        <button 
          onClick={forceSync}
          disabled={isRefreshing}
          className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 active:rotate-180 transition-transform duration-500"
          title="Refresh Status"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      {isPending ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 border border-slate-100 dark:border-white/5 text-center space-y-8 shadow-sm">
           <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-[2rem] flex items-center justify-center mx-auto text-orange-500">
              <Loader2 className="w-10 h-10 animate-spin" />
           </div>
           <div className="space-y-3">
              <h2 className="text-xl font-semibold dark:text-white tracking-tight leading-none">Application in Progress</h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">CleanFlow HQ is reviewing your credentials. Once approved, tap the button below to update your status.</p>
           </div>
           <button 
             onClick={forceSync}
             disabled={isRefreshing}
             className="w-full py-5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check My Status'}
           </button>
           <button onClick={() => navigate('/settings')} className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-semibold text-xs uppercase tracking-widest text-slate-400">
              Return to Settings
           </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-primary p-8 rounded-[2.5rem] text-white shadow-2xl shadow-primary/30 space-y-4">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
             </div>
             <h2 className="text-xl font-semibold tracking-tight leading-none">Join the CleanFlow Team</h2>
             <p className="text-xs text-white/80 leading-relaxed font-medium">Get priority jobs, monthly incentives, and official company branding.</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-6">
             <div className="space-y-5">
                <div className="flex items-start gap-4">
                   <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shrink-0"><CheckCircle2 className="w-5 h-5" /></div>
                   <div><h4 className="text-xs font-semibold dark:text-white uppercase tracking-widest">Priority Dispatch</h4><p className="text-[11px] text-slate-400 font-medium">Get assigned to commercial and bulk orders first.</p></div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                   <div><h4 className="text-xs font-semibold dark:text-white uppercase tracking-widest">Team Benefits</h4><p className="text-[11px] text-slate-400 font-medium">Access to health cover and equipment financing.</p></div>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-50 dark:border-white/5">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                   <div className="flex items-center gap-3">
                      <ShieldAlert className="w-5 h-5 text-orange-500" />
                      <p className="text-xs font-semibold text-slate-500 leading-tight">By submitting, you agree to HQ verification of your NEMA license.</p>
                   </div>
                </div>
             </div>

             <button 
               onClick={handleApply}
               disabled={isSubmitting}
               className="w-full py-5 bg-slate-900 dark:bg-primary text-white rounded-2xl font-semibold text-sm shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-primary/20"
             >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>SUBMIT APPLICATION</span><ChevronRight className="w-4 h-4" /></>}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
