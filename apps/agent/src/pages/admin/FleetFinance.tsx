/**
 * Fleet Finance Page — Company Owner Disbursement Control
 * Compact dropdown cards with approve/decline and driver contact info.
 */
import { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  Banknote,
  User,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Phone,
  Check,
  X as XIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (e) { /* silent */ }
};

export default function FleetFinance() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();

    if (!profile?.id) return;

    const channel = supabase
      .channel('fund-requests-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'fund_requests',
        filter: `company_id=eq.${profile.id}`
      }, async (payload) => {
        playNotificationSound();

        const newReq = payload.new as any;
        const { data: driverData } = await supabase
          .from('profiles')
          .select('name, avatar_url, phone')
          .eq('id', newReq.driver_id)
          .single();

        const enrichedRequest = {
          id: newReq.id,
          amount: newReq.amount,
          reason: newReq.reason,
          status: newReq.status,
          created_at: newReq.created_at,
          driver_name: driverData?.name || 'Fleet Driver',
          driver_avatar: driverData?.avatar_url || null,
          driver_phone: driverData?.phone || null,
        };

        setRequests(prev => [enrichedRequest, ...prev]);

        toast.info(`💰 New Fund Request`, {
          description: `${driverData?.name || 'A driver'} is requesting KSh ${Number(newReq.amount).toLocaleString()}`,
          duration: 8000,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_fund_requests', {
        p_owner_id: profile?.id
      });
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Fetch requests error:', err);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const { data, error } = await supabase.rpc('approve_fund_request', {
        p_request_id: requestId
      });
      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setExpandedId(null);
        await refreshProfile();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Disbursement failed');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const { error } = await supabase
        .from('fund_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      toast('Request Declined', { description: 'The driver will be notified.' });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setExpandedId(null);
    } catch (err) {
      toast.error('Failed to decline request');
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Fleet Finance</h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">Fund Requests & Disbursement</p>
        </div>
      </div>

      {/* Company Wallet Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[1.5rem] p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Wallet className="w-24 h-24 rotate-12" />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Treasury</p>
          <h2 className="text-3xl font-black tracking-tighter">KSh {Number(profile?.walletBalance || 0).toLocaleString()}</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest text-[11px]">Pending Requests</h3>
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-bold rounded-md">{requests.length}</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 opacity-50">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Loading...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl py-14 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-40">
              <ShieldCheck className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</p>
              <p className="text-xs text-slate-400 mt-0.5">No pending fund requests.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {requests.map((req) => {
                const isExpanded = expandedId === req.id;
                return (
                  <motion.div 
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Collapsed Row */}
                    <button 
                      onClick={() => toggleExpand(req.id)}
                      className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700">
                        {req.driver_avatar ? (
                          <img 
                            src={req.driver_avatar} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as any).src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(req.driver_name) + "&background=random";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {req.driver_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{req.driver_name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{new Date(req.created_at).toLocaleString()}</p>
                      </div>
                      <div className="text-right flex-shrink-0 mr-2">
                        <p className="text-sm font-black text-slate-900 dark:text-white">KSh {Number(req.amount).toLocaleString()}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                            {/* Reason */}
                            {req.reason && (
                              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purpose</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">"{req.reason}"</p>
                              </div>
                            )}

                            {/* Phone & Call */}
                            {req.driver_phone && (
                              <a 
                                href={`tel:${req.driver_phone}`}
                                className="flex items-center gap-3 bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl group hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                                  <Phone className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{req.driver_phone}</p>
                                  <p className="text-[9px] text-blue-400 font-medium">Tap to call driver</p>
                                </div>
                              </a>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                              <button 
                                onClick={() => handleApprove(req.id)}
                                disabled={isProcessing !== null}
                                className="flex-1 h-11 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                              >
                                {isProcessing === req.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4" />
                                    Approve & Send
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => handleDecline(req.id)}
                                disabled={isProcessing !== null}
                                className="h-11 px-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
                              >
                                <XIcon className="w-4 h-4" />
                                Decline
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
