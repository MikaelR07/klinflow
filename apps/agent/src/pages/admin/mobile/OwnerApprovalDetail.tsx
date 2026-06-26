import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, UserPlus, Tag, Check, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerApprovalDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  
  const req = state?.request;

  if (!req) {
    return (
      <div className="pt-20 text-center">
        <p className="text-slate-500">Request not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">Go Back</button>
      </div>
    );
  }

  const getIconConfig = (type: string) => {
    if (type === 'fund') return { icon: Wallet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (type === 'join') return { icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (type === 'override') return { icon: Tag, color: 'text-rose-500', bg: 'bg-rose-500/10' };
    return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-500/10' };
  };

  const config = getIconConfig(req.reqType);

  const getTitle = (req: any) => {
    if (req.reqType === 'fund') return 'Deposit Request';
    if (req.reqType === 'join') return 'Onboarding Request';
    if (req.reqType === 'override') return 'Price Override';
    return 'Request Details';
  };

  const handleAction = (action: 'approve' | 'reject') => {
    toast.success(`Request ${action === 'approve' ? 'Approved' : 'Rejected'}`);
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#F8F8FF] dark:bg-slate-800 flex flex-col max-w-lg mx-auto">
      
      {/* ── HEADER ── */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-4 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tighter">Request Details</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${config.bg} ${config.color}`}>
            <config.icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{getTitle(req)}</h2>
          <p className="text-sm font-bold text-slate-500">{new Date(req.created_at).toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Information</h3>
          
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agent</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{req.agent_name || req.name || 'Unknown'}</span>
            </div>
            
            {req.reqType === 'fund' && (
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</span>
                <span className="text-sm font-black text-emerald-500">KES {Number(req.amount || 0).toLocaleString()}</span>
              </div>
            )}
            
            {req.reqType === 'override' && (
              <>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Original Price</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{req.original}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Requested Price</span>
                  <span className="text-sm font-black text-rose-500">{req.amount}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Status</span>
              <span className="text-sm font-black text-amber-500 uppercase">{req.status}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Manager Notes (Optional)</h3>
          <textarea 
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            rows={4}
            placeholder="Add internal notes about this decision..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

      </div>

      {/* ── FIXED ACTIONS ── */}
      {req.status === 'pending' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <button 
              onClick={() => handleAction('reject')}
              className="flex-1 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <X className="w-5 h-5" /> Reject
            </button>
            <button 
              onClick={() => handleAction('approve')}
              className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <Check className="w-5 h-5" /> Approve
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
