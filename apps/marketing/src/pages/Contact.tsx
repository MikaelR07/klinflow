import { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, Send, Building2 } from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { toast } from 'sonner';
import Layout from '../layouts/Layout';

export default function Contact() {
  const { isDarkMode } = useThemeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);


    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      const templateParams = {
        name: `${formData.get('first_name')} ${formData.get('last_name')}`,
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        email: formData.get('email'),
        reply_to: formData.get('email'),
        subject: formData.get('inquiry_type'),
        inquiry_type: formData.get('inquiry_type'),
        message: formData.get('message'),
      };

      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        }
      );
      toast.success("Message sent successfully! We'll get back to you soon.");
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <section className={`relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
        {/* Background Elements */}
        {/* <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" /> */}

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
            
            {/* Left Column: Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col justify-center"
            >
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-[10px] uppercase tracking-[0.2em] mb-8 border ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-primary/5 border-primary/10 text-primary'}`}>
                <Building2 className="w-3.5 h-3.5" /> Get in Touch
              </div>
              
              <h1 className={`text-4xl md:text-5xl lg:text-4xl font-black tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Let's build the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                  circular future.
                </span>
              </h1>
              
              <p className={`text-base md:text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Whether you're an enterprise looking to optimize waste logistics, a recycler sourcing verified materials, or an investor, our team is ready to assist you.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/10 text-primary' : 'bg-white border-slate-200 text-primary shadow-sm'}`}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Email Us</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>For general inquiries & partnerships</p>
                    <a href="mailto:hello@klinflow.com" className="text-primary font-bold text-sm mt-1 hover:underline">klinflow@gmail.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isDarkMode ? 'bg-white/5 border-white/10 text-primary' : 'bg-white border-slate-200 text-primary shadow-sm'}`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Headquarters</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nairobi, Kenya</p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Global operations expanding soon.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className={`p-8 md:p-12 rounded-[2rem] border shadow-2xl dark:shadow-none relative overflow-hidden ${isDarkMode ? 'bg-surface-900 border-white/10' : 'bg-white border-slate-200'}`}>
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <Send className="w-48 h-48" />
                </div>

                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>First Name</label>
                      <input 
                        required
                        type="text" 
                        name="first_name"
                        placeholder="John"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${isDarkMode ? 'bg-surface-950 border-white/10 text-white focus:border-primary placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary placeholder:text-slate-400'}`}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Last Name</label>
                      <input 
                        required
                        type="text" 
                        name="last_name"
                        placeholder="Doe"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${isDarkMode ? 'bg-surface-950 border-white/10 text-white focus:border-primary placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary placeholder:text-slate-400'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Work Email</label>
                    <input 
                      required
                      type="email" 
                      name="email"
                      placeholder="john@company.com"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors ${isDarkMode ? 'bg-surface-950 border-white/10 text-white focus:border-primary placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary placeholder:text-slate-400'}`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Inquiry Type</label>
                    <select 
                      name="inquiry_type"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors appearance-none ${isDarkMode ? 'bg-surface-950 border-white/10 text-white focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary'}`}
                    >
                      <option>Enterprise Integration</option>
                      <option>Material Purchasing (B2B)</option>
                      <option>Fleet/Agent Onboarding</option>
                      <option>Investor Relations</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Message</label>
                    <textarea 
                      required
                      name="message"
                      rows={4}
                      placeholder="How can we help you?"
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-colors resize-none ${isDarkMode ? 'bg-surface-950 border-white/10 text-white focus:border-primary placeholder:text-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary placeholder:text-slate-400'}`}
                    />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full py-4 mt-2 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Send Message <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
    </Layout>
  );
}
