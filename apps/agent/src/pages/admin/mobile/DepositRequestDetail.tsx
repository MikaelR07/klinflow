import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MoreVertical, Wallet, Check, X, Clock, 
  Info, Paperclip, CreditCard, Diamond, Copy, FileText, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function DepositRequestDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  
  const req = state?.request;

  if (!req) {
    return (
      <div className="pt-20 text-center">
        <p className="text-slate-500">Request not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 font-bold">Go Back</button>
      </div>
    );
  }

  const handleAction = (action: 'approve' | 'reject') => {
    toast.success(`Request ${action === 'approve' ? 'Approved ✅' : 'Rejected ❌'}`);
    navigate(-1);
  };

  const requestDate = new Date(req.created_at);
  const requestId = `DEP-${requestDate.getFullYear()}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    if (status === 'approved') return { label: 'APPROVED', bg: 'bg-emerald-500', text: 'text-white' };
    if (status === 'rejected') return { label: 'REJECTED', bg: 'bg-rose-500', text: 'text-white' };
    return { label: 'PENDING', bg: 'bg-blue-500', text: 'text-white' };
  };

  const badge = getStatusBadge(req.status);

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col max-w-lg mx-auto">
      
      {/* ── TOP NAV ── */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Request Details</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Review and take action on this request</p>
          </div>
        </div>
        <button className="p-2 text-slate-400">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-10">

        {/* ── HERO CARD ── */}
        <div className="mx-4 mt-4 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-xl p-5 text-white relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-[0.08]">
            <Wallet className="w-28 h-28" />
          </div>
          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white">Deposit Request</p>
                <p className="text-2xl font-black mt-0.5">
                  <span className="text-sm font-bold opacity-80 mr-1">KES</span>
                  {Number(req.amount || 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-white mt-1">
                  Requested on {requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {requestDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
            <span className={`${badge.bg} ${badge.text} text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1`}>
              <Clock className="w-3 h-3" /> {badge.label}
            </span>
          </div>
        </div>

        <div className="px-4 mt-6 space-y-6">

          {/* ── REQUEST OVERVIEW ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-white">Request Overview</h3>
            </div>
            <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Request ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{requestId}</p>
                    <button onClick={() => copyToClipboard(requestId)} className="p-1 text-slate-400 active:scale-90 transition-all">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-700 pl-4 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Requested By</p>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-white truncate">{req.agent_name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">Agent</p>
                </div>
                <div className="border-l border-slate-200 dark:border-slate-700 pl-4 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Request Date</p>
                  <p className="text-[12px] font-bold text-slate-800 dark:text-white">{requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[10px] text-slate-500">{requestDate.toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── REQUEST INFORMATION ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Info className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Request Information</h3>
            </div>
            <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-700">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Amount</span>
                </div>
                <span className="text-sm font-black text-emerald-600">KES {Number(req.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                    <Paperclip className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Attachments</span>
                </div>
                <span className="text-sm font-medium text-slate-400">No attachments</span>
              </div>
               {/* ── AGENT NOTES ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">Agent Notes</h3>
                </div>
                <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {req.notes || "No notes provided by the agent for this request."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── STATUS TIMELINE ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">Status Timeline</h3>
            </div>
            <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-1">
              {/* Requested */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-400 mt-1" />
                  <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="flex-1 flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Requested</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {requestDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600">Current</span>
                </div>
              </div>
              {/* Under Review */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 mt-1" />
                  <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Under Review</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">—</p>
                </div>
              </div>
              {/* Approved / Rejected */}
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 mt-1" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Approved / Rejected</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">—</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── ACTIONS ── */}
          {req.status === 'pending' && (
            <div className="pt-2">
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction('reject')}
                  className="flex-1 py-4 bg-rose-500 dark:bg-rose-500/10 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <X className="w-5 h-5" /> Reject
                </button>
                <button 
                  onClick={() => handleAction('approve')}
                  className="flex-[1.4] py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2  active:scale-[0.98] transition-all"
                >
                  <Check className="w-5 h-5" /> Approve
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
