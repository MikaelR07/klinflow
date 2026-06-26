import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDisputeStore } from '@klinflow/core/stores/disputeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ArrowLeft, Check, X, AlertTriangle, ShieldAlert, FileText, User } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerDisputeDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { updateDisputeStatus } = useDisputeStore();
  
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  
  const dispute = state?.dispute;

  if (!dispute) {
    return (
      <div className="pt-20 text-center">
        <p className="text-slate-500">Dispute not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">Go Back</button>
      </div>
    );
  }

  const handleResolve = async (status: 'resolved' | 'rejected') => {
    if (status === 'resolved' && !resolutionNotes) {
      toast.error('Please add resolution notes');
      return;
    }
    
    try {
      await updateDisputeStatus(dispute.id, status, resolutionNotes, profile?.id || '');
      toast.success(`Dispute ${status}`);
      navigate(-1);
    } catch (err) {
      toast.error('Failed to update dispute');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#F8F8FF] dark:bg-slate-800 flex flex-col max-w-lg mx-auto">
      
      {/* ── HEADER ── */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-4 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Dispute Details</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {dispute.dispute_id}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        
        {/* ── OVERVIEW CARD ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Issue Type</p>
                <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{dispute.dispute_type.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${dispute.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
              {dispute.status}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agent</span>
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {dispute.agent_name || 'Unknown'}
              </span>
            </div>
            
            {dispute.amount && (
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount in Dispute</span>
                <span className="text-sm font-black text-rose-500">KES {Number(dispute.amount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date Reported</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{new Date(dispute.created_at).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Description / Reason</h3>
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
              {dispute.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* ── EVIDENCE ── */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Evidence</h3>
          {dispute.evidence_urls && dispute.evidence_urls.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {dispute.evidence_urls.map((url: string, i: number) => (
                <div key={i} className="aspect-square rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden relative group">
                  <img src={url} alt={`Evidence ${i+1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs font-bold text-white uppercase tracking-widest">View Full</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-400" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No evidence files attached</p>
            </div>
          )}
        </div>

        {/* ── RESOLUTION FORM (ONLY IF OPEN) ── */}
        {dispute.status !== 'resolved' && (
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-[11px] font-black text-slate-400 capitalize tracking-widest px-2">Resolve Dispute</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1 block">Adjustment Amount (KES)</label>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm font-black focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-1 block">Resolution Notes</label>
                <textarea 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                  rows={3}
                  placeholder="Explain the resolution decision..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── FIXED ACTIONS ── */}
      {dispute.status !== 'resolved' && (
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-3">
            <button 
              onClick={() => handleResolve('rejected')}
              className="flex-1 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <X className="w-5 h-5" /> Reject
            </button>
            <button 
              onClick={() => handleResolve('resolved')}
              className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
            >
              <Check className="w-5 h-5" /> Resolve
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
