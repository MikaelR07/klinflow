import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  PhoneCall, 
  MessageCircle, 
  Send, 
  Loader2, 
  HelpCircle, 
  ChevronRight,
  ShieldAlert,
  Wallet,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { useSystemStore } from '@klinflow/core/stores/systemStore';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } }
};

const COMMON_ISSUES = [
  { label: 'Missed Pickup', icon: Clock, subject: 'Issue: Missed Pickup' },
  { label: 'Payment Delay', icon: Wallet, subject: 'Issue: Delayed Payment' },
  { label: 'Account Security', icon: ShieldAlert, subject: 'Issue: Account Security' },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const { supportPhone, whatsappNumber } = useSystemStore();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Format the message for WhatsApp
    const text = encodeURIComponent(`*Support Request*\n*Subject:* ${form.subject}\n\n${form.message}`);
    const waUrl = `https://wa.me/${whatsappNumber}?text=${text}`;
    
    // Simulate slight loading for UX, then open WhatsApp
    await new Promise(r => setTimeout(r, 600));
    window.open(waUrl, '_blank');
    
    setForm({ subject: '', message: '' });
    setIsLoading(false);
    toast.success('Support request prepared!', { description: 'Opening WhatsApp to send your message.' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10] text-slate-900 dark:text-white selection:bg-emerald-500/30">
      
      {/* ── PREMIUM FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0a0c10]/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 pt-[calc(env(safe-area-inset-top,0px))]">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/settings')} 
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center active:scale-95 transition-all text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-[16px] font-bold tracking-tight leading-tight">Help & Support</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">24/7 Assistance</span>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>

      <motion.div 
        variants={stagger} 
        initial="hidden" 
        animate="show" 
        className="pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] pb-24 px-4 max-w-xl mx-auto space-y-6"
      >

        {/* ── HEADER INTRO ── */}
        <motion.div variants={fadeUp} className="text-center px-4">
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter mb-2">How can we help?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Get in touch with our dedicated support team. We generally reply within a few minutes.
          </p>
        </motion.div>

        {/* ── QUICK CONTACT CARDS ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-2">
           <a 
             href={`tel:${supportPhone}`} 
             className="group relative overflow-hidden p-5 rounded-[14px] bg-white dark:bg-[#12141c] border border-slate-200 dark:border-slate-800/80 active:scale-[0.97] transition-all shadow-sm flex items-center gap-2.5"
           >
             <div className="w-7 h-7 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
               <PhoneCall className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <div className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight">Call Direct</div>
               <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Toll Free</div>
             </div>
           </a>

           <a 
             href={`https://wa.me/${whatsappNumber}`} 
             target="_blank" 
             rel="noreferrer" 
             className="group relative overflow-hidden p-2 rounded-[14px] bg-white dark:bg-[#12141c] border border-slate-200 dark:border-slate-800/80 active:scale-[0.97] transition-all shadow-sm flex items-center gap-2.5"
           >
             <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-lg flex items-center justify-center shrink-0">
               <MessageCircle className="w-5 h-5" />
             </div>
             <div className="min-w-0">
               <div className="text-[12px] font-bold text-slate-900 dark:text-white leading-tight">WhatsApp</div>
               <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Fast Reply</div>
             </div>
           </a>
        </motion.div>

        <motion.div variants={fadeUp} className="w-full h-px bg-slate-200 dark:bg-slate-800/60" />

        {/* ── MESSAGE FORM ── */}
        <motion.div variants={fadeUp}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[15px] font-bold">Send a Message</h3>
          </div>

          {/* Quick Select Pills */}
          <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-edges">
            {COMMON_ISSUES.map((issue, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setForm(f => ({ ...f, subject: issue.subject }))}
                className="shrink-0 flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <issue.icon className="w-4 h-4 text-slate-400" />
                {issue.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Subject Input */}
            <div className={`relative rounded-xl border transition-all duration-300 bg-white dark:bg-[#12141c] ${
              focusedInput === 'subject' 
              ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20 shadow-sm' 
              : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="absolute top-2.5 left-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                Subject
              </div>
              <input 
                type="text" 
                required 
                value={form.subject} 
                onFocus={() => setFocusedInput('subject')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setForm({...form, subject: e.target.value})} 
                placeholder="Briefly describe the issue" 
                className="w-full px-4 pt-7 pb-2.5 bg-transparent text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
              />
            </div>

            {/* Message Textarea */}
            <div className={`relative rounded-xl border transition-all duration-300 bg-white dark:bg-[#12141c] overflow-hidden ${
              focusedInput === 'message' 
              ? 'border-emerald-500 ring-4 ring-emerald-500/10 dark:ring-emerald-500/20 shadow-sm' 
              : 'border-slate-200 dark:border-slate-800'
            }`}>
              <div className="absolute top-3 left-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                How can we help?
              </div>
              <textarea 
                required 
                rows={5} 
                value={form.message} 
                onFocus={() => setFocusedInput('message')}
                onBlur={() => setFocusedInput(null)}
                onChange={(e) => setForm({...form, message: e.target.value})} 
                placeholder="Include any relevant details like transaction IDs or pickup times..." 
                className="w-full px-4 pt-8 pb-3 bg-transparent text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none resize-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !form.subject || !form.message} 
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-emerald-600/20 mt-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Send className="w-4 h-4" /> Connect with Support
                </>
              )}
            </button>
            <p className="text-center text-[11px] font-medium text-slate-400 mt-3 flex items-center justify-center gap-1">
              Protected by end-to-end encryption <ShieldAlert className="w-3 h-3" />
            </p>
          </form>
        </motion.div>

      </motion.div>
    </div>
  );
}
