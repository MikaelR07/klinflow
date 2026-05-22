import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneCall, MessageCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSystemStore } from '@klinflow/core/stores/systemStore';

export default function SupportPage() {
  const navigate = useNavigate();
  const { supportPhone, whatsappNumber } = useSystemStore();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: any) => {
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
  };

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 ">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">Contact Support</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Help & Assistance</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
           <a href={`tel:${supportPhone}`} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-primary transition-all flex flex-col items-center justify-center gap-3 text-center shadow-sm">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
               <PhoneCall className="w-6 h-6" />
             </div>
             <div>
               <div className="text-sm font-semibold text-slate-800 dark:text-white">Call Us</div>
               <div className="text-xs text-slate-500 mt-0.5">Toll Free</div>
             </div>
           </a>

           <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-[#25D366] transition-all flex flex-col items-center justify-center gap-3 text-center shadow-sm">
             <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-full flex items-center justify-center">
               <MessageCircle className="w-6 h-6" />
             </div>
             <div>
               <div className="text-sm font-semibold text-slate-800 dark:text-white">WhatsApp</div>
               <div className="text-xs text-slate-500 mt-0.5">24/7 Chat</div>
             </div>
           </a>
        </div>

        {/* Support Message Form */}
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
           <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2">Send us a message</h2>
           
           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 capitalize tracking-wider">Subject</label>
             <input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="e.g., Missed pickup, Payment issue" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
           </div>

           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 capitalize tracking-wider">How can we help?</label>
             <textarea required rows={4} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Please describe your issue..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm resize-none" />
           </div>

           <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 dark:bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-1" />} Send Request
           </button>
        </form>

      </div>
    </div>
  );
}
