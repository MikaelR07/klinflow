import { useEffect, useState } from 'react';
import { useFeedbackStore } from '@klinflow/core/stores/feedbackStore';
import { Star, MessageSquare, Trash2, CalendarClock, User, Briefcase, Truck, Users, LayoutGrid, AlertTriangle, X, UserCheck, Building2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminFeedbackInbox() {
  const { feedbackList, deleteFeedback, clearAllFeedback, fetchFeedback, isLoading } = useFeedbackStore();
  const [activeHub, setActiveHub] = useState('all');
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, targetId: null, isBulk: false });

  useEffect(() => {
    fetchFeedback();
  }, []);

  const hubs = [
    { id: 'all',              label: 'All Feedback',    icon: LayoutGrid,  desc: 'Every submission' },
    { id: 'client',          label: 'Client App',       icon: Smartphone,  desc: 'Resident members' },
    { id: 'agent_independent', label: 'Ind. Agents',    icon: UserCheck,   desc: 'Freelance agents' },
    { id: 'agent_company',   label: 'Company Owners',   icon: Building2,   desc: 'Corporate tenants' },
    { id: 'issues',          label: 'Issues Only',      icon: AlertTriangle, desc: 'Rating ≤ 2 stars' },
  ];

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
    if (rating === 3) return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
  };

  const filteredFeedback = feedbackList.filter(item => {
    if (activeHub === 'all') return true;
    if (activeHub === 'issues') return item.rating <= 2;
    return item.sourceApp === activeHub;
  });

  const confirmDelete = () => {
    if (deleteModal.isBulk) {
      clearAllFeedback();
      toast.success('Inbox Cleared Successfully');
    } else {
      deleteFeedback(deleteModal.targetId);
      toast.success('Review Deleted');
    }
    setDeleteModal({ isOpen: false, targetId: null, isBulk: false });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold dark:text-white tracking-tighter">Feedback Hub</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Monitor Sentiment & Issue Reports</p>
        </div>
        {feedbackList.length > 0 && (
          <button 
            onClick={() => setDeleteModal({ isOpen: true, targetId: null, isBulk: true })}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-rose-100 dark:border-rose-900 shadow-sm"
          >
            <Trash2 className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      {/* ── HUB SELECTOR ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {hubs.map(hub => (
          <button
            key={hub.id}
            onClick={() => setActiveHub(hub.id)}
            className={`p-4 rounded-3xl border transition-all text-left group relative overflow-hidden ${
              activeHub === hub.id 
                ? 'bg-slate-900 border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-primary/20' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-slate-200'
            }`}
          >
            {activeHub === hub.id && (
              <div className="absolute top-3 right-3 px-2 py-0.5 bg-primary/20 border border-primary/20 text-primary text-[7px] font-semibold uppercase tracking-widest rounded-full animate-pulse">
                Active
              </div>
            )}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${
              activeHub === hub.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
            }`}>
              <hub.icon className="w-5 h-5" />
            </div>
            <h3 className={`text-sm font-semibold tracking-tight leading-tight ${activeHub === hub.id ? 'text-white' : 'dark:text-white'}`}>{hub.label}</h3>
            <p className={`text-xs font-semibold uppercase tracking-widest ${activeHub === hub.id ? 'text-white/40' : 'text-slate-400'}`}>{hub.desc}</p>
          </button>
        ))}
      </div>

      {/* ── FEEDBACK LIST ── */}
      {filteredFeedback.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 flex items-center justify-center mb-4">
             <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold dark:text-white tracking-tight">No feedback found</h3>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Try selecting a different hub</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFeedback.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl relative overflow-hidden group border border-slate-100 dark:border-white/5 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/5 flex flex-col h-full">
               
                {/* Header: Rating & Date & SOURCE */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${getRatingColor(item.rating)}`}>
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-semibold">{item.rating}.0</span>
                    </div>

                    {/* SOURCE BADGE */}
                     <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all ${
                       item.sourceApp === 'agent_independent' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                       item.sourceApp === 'agent_company' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                       item.sourceApp === 'client' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                       'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-white/5'
                     }`}>
                       {item.sourceApp === 'agent_independent' ? '🚴 Ind. Agent' :
                        item.sourceApp === 'agent_company' ? '🏢 Company' :
                        item.sourceApp === 'client' ? '🏠 Resident' : '👤 Unknown'}
                     </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs uppercase font-semibold text-slate-400">
                     {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow space-y-2">
                  <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {item.category}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic font-medium leading-normal line-clamp-3">"{item.text}"</p>
                </div>

                {/* Footer: User Details */}
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                       {item.name?.charAt(0) || <User className="w-4 h-4" />}
                     </div>
                     <div className="max-w-[120px]">
                       <p className="text-xs font-semibold dark:text-slate-200 truncate">{item.name || 'Anonymous'}</p>
                       <p className="text-xs text-slate-400 font-mono tracking-tighter truncate">{item.phone || 'No Phone'}</p>
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => setDeleteModal({ isOpen: true, targetId: item.id, isBulk: false })}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

            </div>
          ))}
        </div>
      )}

      {/* ── CONFIRMATION MODAL ── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 animate-scale-in">
              <div className="p-8 text-center space-y-4">
                 <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                 </div>
                 <div>
                    <h3 className="text-xl font-semibold dark:text-white tracking-tight">
                       {deleteModal.isBulk ? 'Clear Entire Inbox?' : 'Delete Review?'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                       {deleteModal.isBulk 
                         ? 'This will permanently remove all feedback records. This action cannot be undone.' 
                         : 'This feedback will be removed permanently from the system.'}
                    </p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 pt-4">
                    <button 
                      onClick={() => setDeleteModal({ isOpen: false, targetId: null, isBulk: false })}
                      className="py-3.5 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                       Cancel
                    </button>
                    <button 
                      onClick={confirmDelete}
                      className="py-3.5 px-6 rounded-2xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 shadow-lg shadow-rose-500/25 transition-all active:scale-95"
                    >
                       Yes, Delete
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
