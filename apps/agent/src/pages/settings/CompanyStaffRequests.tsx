import { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';
import { Check, X, User, Loader2, RefreshCw, Clock } from 'lucide-react';

export default function CompanyStaffRequests() {
  const { userId } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_join_requests')
        .select(`
          id,
          created_at,
          status,
          profiles:driver_id (
            id,
            name,
            phone,
            id_number,
            gender
          )
        `)
        .eq('company_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      toast.error("Failed to load requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchRequests();
  }, [userId]);

  const handleAction = async (requestId, action) => {
    setProcessingId(requestId);
    try {
      const rpcName = action === 'approve' ? 'approve_fleet_driver_request' : 'reject_fleet_driver_request';
      const { error } = await supabase.rpc(rpcName, { p_request_id: requestId });

      if (error) throw error;
      
      toast.success(`Driver ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (err) {
      console.error(`Error ${action}ing driver:`, err);
      toast.error(`Failed to ${action} driver`, { description: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold dark:text-white tracking-tight">Pending Drivers</h2>
         <button 
           onClick={fetchRequests}
           className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
         >
           <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
         </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
           <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
           <p className="text-xs font-bold uppercase tracking-widest">Loading Requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
           <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-8 h-8" />
           </div>
           <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No pending requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const driver = req.profiles;
            return (
              <div key={req.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
                     <User className="w-6 h-6 text-blue-500" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{driver.name}</h3>
                     <p className="text-xs font-medium text-slate-500">{driver.phone}</p>
                     <div className="flex gap-2 mt-2">
                       <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-bold text-slate-500 capitalize">ID: {driver.id_number || 'N/A'}</span>
                       <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-bold text-slate-500 capitalize">{driver.gender || 'N/A'}</span>
                     </div>
                   </div>
                 </div>

                 <div className="flex gap-3 pt-2">
                   <button
                     onClick={() => handleAction(req.id, 'reject')}
                     disabled={processingId === req.id}
                     className="flex-1 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-100 transition-colors disabled:opacity-50"
                   >
                     {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4" /> Reject</>}
                   </button>
                   <button
                     onClick={() => handleAction(req.id, 'approve')}
                     disabled={processingId === req.id}
                     className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-colors disabled:opacity-50"
                   >
                     {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve</>}
                   </button>
                 </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
