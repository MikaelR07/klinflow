import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ShieldAlert, Plus, X, AlertCircle, 
  MessageSquare, CheckCircle2, Clock, Loader2, EyeOff, Eye,
  Truck, Users, DollarSign, Smartphone, Navigation, AlertTriangle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  'Vehicle Breakdown',
  'Fellow Agent Misconduct',
  'Salary Dispute',
  'App Issue',
  'Route Issue',
  'Other'
];

export const getTicketNumber = (id: string, ticketNo?: string): string => {
  if (ticketNo) return ticketNo;
  if (!id) return 'CP-000-000';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part1 = clean.substring(0, 3).padEnd(3, '0');
  const part2 = clean.substring(3, 6).padEnd(3, '0');
  return `CP-${part1}-${part2}`;
};

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'Vehicle Breakdown': return Truck;
    case 'Fellow Agent Misconduct': return Users;
    case 'Salary Dispute': return DollarSign;
    case 'App Issue': return Smartphone;
    case 'Route Issue': return Navigation;
    default: return AlertTriangle;
  }
};

export default function AgentComplaintsPage() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { agentComplaints = [], isLoadingComplaints, fetchAgentComplaints, submitAgentComplaint } = useAgentStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedComplaintId, setExpandedComplaintId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: CATEGORIES[0],
    description: '',
    priority: 'medium',
    is_anonymous: false
  });

  useEffect(() => {
    if (profile?.id && fetchAgentComplaints) {
      fetchAgentComplaints(profile.id);
    }
  }, [profile?.id, fetchAgentComplaints]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !profile?.companyId) {
      toast.error('You must be assigned to a company to submit complaints.');
      return;
    }

    if (formData.description.trim().length < 10) {
      toast.error('Please provide more details in your description.');
      return;
    }

    setIsSubmitting(true);
    if (!submitAgentComplaint) {
      toast.error('Store not ready. Please restart dev server with --force.');
      setIsSubmitting(false);
      return;
    }
    
    const { success, error } = await submitAgentComplaint(
      profile.id,
      profile.companyId,
      { ...formData, status: 'open' }
    );
    setIsSubmitting(false);

    if (success) {
      toast.success('Complaint submitted successfully');
      setIsModalOpen(false);
      setFormData({ type: CATEGORIES[0], description: '', priority: 'medium', is_anonymous: false });
      fetchAgentComplaints(profile.id);
    } else {
      toast.error(error || 'Failed to submit complaint');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical': return 'text-rose-500';
      case 'medium': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800  pb-4">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Hub Complaints</h1>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Report issues to your Hub</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-rose-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit</span>
          </button>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4rem)] max-w-lg mx-auto w-full px-2 space-y-4">
        {isLoadingComplaints ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-rose-500" />
            <p className="text-sm font-bold">Loading records...</p>
          </div>
        ) : agentComplaints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Complaints Found</p>
            <p className="text-xs max-w-[250px]">You haven't submitted any complaints to your Hub yet.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-rose-500/20"
            >
              Submit Complaint
            </button>
          </div>
        ) : (
          agentComplaints.map(complaint => {
            const CategoryIcon = getCategoryIcon(complaint.type);
            const isExpanded = expandedComplaintId === complaint.id;

            return (
              <motion.div 
                key={complaint.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Clickable Card Header */}
                <button 
                  type="button"
                  onClick={() => setExpandedComplaintId(isExpanded ? null : complaint.id)}
                  className="w-full p-4 text-left space-y-3 cursor-pointer select-none focus:outline-none"
                >
                  {/* Top Status & Priority Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        complaint.priority === 'high' || complaint.priority === 'critical'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          : complaint.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {complaint.priority}
                      </span>
                      {complaint.is_anonymous && (
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          <EyeOff className="w-2.5 h-2.5 text-slate-400" /> Anonymous
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {format(new Date(complaint.created_at), 'MMM d · h:mm a')}
                    </span>
                  </div>

                  {/* Category Title & Chevron Toggle */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                        <CategoryIcon className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {complaint.type}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                          {getTicketNumber(complaint.id, (complaint as any).ticket_number)}
                        </p>
                      </div>
                    </div>

                    <div className={`w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : ''}`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Expandable Body Details */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40"
                    >
                      <div className="p-4 space-y-3">
                        {/* Description */}
                        <div className="bg-white dark:bg-slate-950 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800/80">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Details</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            "{complaint.description}"
                          </p>
                        </div>

                        {/* Hub Resolution Note */}
                        {complaint.resolution_note && (
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/40 dark:to-teal-950/20 rounded-xl p-3.5 border border-emerald-200/80 dark:border-emerald-800/50">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Hub Response
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium">
                              {complaint.resolution_note}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </main>

      {/* NEW COMPLAINT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex flex-col justify-end p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }} 
              className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Submit Complaint</h2>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Secure Hub Communication</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Category</label>
                    <select 
                      value={formData.type}
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-colors"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Priority Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({...formData, priority: p})}
                          className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all ${
                            formData.priority === p 
                              ? p === 'high' ? 'bg-rose-500 border-rose-500 text-white' 
                              : p === 'medium' ? 'bg-amber-500 border-amber-500 text-white'
                              : 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Details</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      placeholder="Please describe the issue in detail..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-rose-500 transition-colors min-h-[120px] resize-none"
                    />
                  </div>

                  {/* Privacy Toggle */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        {formData.is_anonymous ? <EyeOff className="w-4 h-4 text-rose-500"/> : <Eye className="w-4 h-4 text-emerald-500"/>} 
                        Anonymous Mode
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                        {formData.is_anonymous ? "Your identity will be hidden from the Hub." : "Your name will be visible to the Hub."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, is_anonymous: !formData.is_anonymous})}
                      className={`w-12 h-6 rounded-full p-1 transition-all ${formData.is_anonymous ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${formData.is_anonymous ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Submit */}
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                    {isSubmitting ? 'Submitting...' : 'Send to Hub'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
