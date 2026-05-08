import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PhoneCall, MessageCircle, Send, Loader2 } from 'lucide-react';
import { useSystemStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function SupportPage() {
  const navigate = useNavigate();
  const { supportPhone, whatsappNumber } = useSystemStore();
  const [form, setForm] = useState({ subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Message Sent', { description: 'A support agent will respond shortly.' });
    setForm({ subject: '', message: '' });
    setIsLoading(false);
  };

  return (
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">Contact Support</h1>
      </header>

      <div className="space-y-6">

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
           <a href={`tel:${supportPhone}`} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary transition-all flex flex-col items-center justify-center gap-3 text-center shadow-sm">
             <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
               <PhoneCall className="w-6 h-6" />
             </div>
             <div>
               <div className="text-sm font-semibold text-slate-800 dark:text-white">Call Us</div>
               <div className="text-xs text-slate-500 mt-0.5">Toll Free</div>
             </div>
           </a>

           <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#25D366] transition-all flex flex-col items-center justify-center gap-3 text-center shadow-sm">
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
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Subject</label>
             <input type="text" required value={form.subject} onChange={(e) => setForm({...form, subject: e.target.value})} placeholder="e.g., Missed pickup, Payment issue" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
           </div>

           <div>
             <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">How can we help?</label>
             <textarea required rows={4} value={form.message} onChange={(e) => setForm({...form, message: e.target.value})} placeholder="Please describe your issue..." className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm resize-none" />
           </div>

           <button type="submit" disabled={isLoading} className="w-full py-4 bg-slate-900 dark:bg-primary text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4 ml-1" />} Send Request
           </button>
        </form>

      </div>
    </div>
  );
}
