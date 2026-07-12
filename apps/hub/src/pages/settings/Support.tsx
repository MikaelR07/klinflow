import React, { useState } from 'react';
import { HelpCircle, PhoneCall, Send, Loader2,MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Support() {
  const [supportForm, setSupportForm] = useState({ subject: '', message: '' });
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSupport(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Message Sent', { description: 'A support agent will respond shortly.' });
    setSupportForm({ subject: '', message: '' });
    setIsSubmittingSupport(false);
  };

  return (
    <>
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            <div className="flex flex-col gap-1 pb-4">
              <h1 className="text-3xl font-bold tracking-tight text-[#131722] dark:text-white">Support Center</h1>
              <p className="text-[16px] text-slate-500 dark:text-slate-400">Get help and contact Klinflow technical support.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#131722] dark:text-white">Get Help & Support</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button className="flex-1 py-4 border border-[#e0e3eb] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <PhoneCall className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-base font-bold text-[#131722] dark:text-white">Call Support</span>
                  </button>
                  <button className="flex-1 py-4 border border-[#e0e3eb] dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                    <MessageCircle className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                    <span className="text-base font-bold text-[#131722] dark:text-white">WhatsApp Us</span>
                  </button>
                </div>
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Subject</label>
                    <input type="text" required value={supportForm.subject} onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })} placeholder="What do you need help with?" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Describe the Issue</label>
                    <textarea required rows={3} value={supportForm.message} onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })} placeholder="Please provide as much detail as possible..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-indigo-500 outline-none resize-none" />
                  </div>
                  <button type="submit" disabled={isSubmittingSupport} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-70 mt-2">
                    {isSubmittingSupport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send Message
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
