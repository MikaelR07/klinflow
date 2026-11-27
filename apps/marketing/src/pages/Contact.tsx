import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { motion } from 'framer-motion';
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Building2,
  Clock,
  MessageSquare,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Headphones,
  FileQuestion,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import Layout from '../layouts/Layout';

export default function Contact() {
  const isDarkMode = false;
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
        phone: formData.get('phone') || 'Not provided',
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
      toast.success("Message sent successfully! We'll get back to you shortly.");
      form.reset();
    } catch (error) {
      console.error('EmailJS Error:', error);
      toast.error("Failed to send message. Please try again later or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="w-full">
        {/* ── TOP SECTION: COLORED HERO BANNER (MONIEPOINT STYLE) ── */}
        <section
          className={`w-full pt-36 pb-28 md:pt-44 md:pb-40 relative overflow-hidden transition-colors duration-300 ${
            isDarkMode
              ? 'bg-gradient-to-br from-slate-950 via-surface-950 to-slate-950 border-b border-white/10'
              : 'bg-gradient-to-br from-teal-800 via-emerald-700 to-primary text-white'
          }`}
        >
          {/* Subtle geometric dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 mx-auto ${
                  isDarkMode
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/15 text-white border border-white/25 backdrop-blur-sm'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Contact & Support</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-[1.1] text-center"
              >
                We're here to help you <br className="hidden sm:block" />
                <span className="text-amber-400">connect and scale.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-white/85 font-normal leading-relaxed mb-8 max-w-2xl text-center mx-auto"
              >
                Have questions about Klinflow, looking to deploy our MOS software, or exploring B2B material trading? Reach out to our team for quick, dedicated assistance.
              </motion.p>

              {/* Quick Trust / Service Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-4 border-t border-white/15 text-white/90 text-xs sm:text-sm font-semibold w-full max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>&lt; 2hr Response Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Enterprise SLA Support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>Pan-African Operations</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Curved Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <svg
              className="w-full h-32 md:h-40 lg:h-50"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0,20 Q720,150 1440,20 L1440,120 L0,120 Z"
                fill={isDarkMode ? '#0b1a25' : '#d1f0dc'}
              />
            </svg>
          </div>
        </section>

        {/* ── MAIN CONTENT SECTION: FORM & EXTENSIVE INFORMATION ── */}
        <section
          className={`py-16 md:py-24 px-6 relative z-10 transition-colors duration-300 ${
            isDarkMode ? 'bg-surface-950' : 'bg-primary/20'
          }`}
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              
              {/* ── LEFT COLUMN: DETAILED INFO, CHANNELS & TEXT ── */}
              <motion.div
                initial={{ opacity: 0, x: -25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-5 flex flex-col space-y-10"
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-primary">
                    Reach Out Directly
                  </div>
                  <h2
                    className={`text-2xl sm:text-3xl font-black tracking-tight mb-4 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Multiple ways to get in touch.
                  </h2>
                  <p
                    className={`text-sm sm:text-base leading-relaxed ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Whether you are an independent collection agent, a recycling facility owner, or an enterprise seeking traceable sustainability data, we have dedicated support desks for your needs.
                  </p>
                </div>

                {/* Direct Contact Cards */}
                <div className="space-y-4">
                  {/* Email Card */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isDarkMode
                        ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-base font-bold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          Email Support
                        </h4>
                        <p
                          className={`text-xs mb-2 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          General questions, partnerships & feedback
                        </p>
                        <div className="flex flex-col gap-1">
                          <a
                            href="mailto:klinflow@gmail.com"
                            className="text-sm font-semibold text-primary hover:underline truncate"
                          >
                            klinflow@gmail.com
                          </a>
                          <a
                            href="mailto:support@klinflow.com"
                            className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
                          >
                            support@klinflow.com
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phone & Hotline Card */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isDarkMode
                        ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-base font-bold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          Phone & WhatsApp
                        </h4>
                        <p
                          className={`text-xs mb-2 ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          Mon – Fri: 8:00 AM – 6:00 PM (EAT)
                        </p>
                        <div className="flex flex-col gap-1">
                          <a
                            href="tel:+254113787588"
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            +254 (0) 113 787 588
                          </a>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Direct dispatch & logistics hotline
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Office Location Card */}
                  <div
                    className={`p-5 rounded-2xl border transition-all ${
                      isDarkMode
                        ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                        : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-base font-bold mb-1 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          Headquarters
                        </h4>
                        <p
                          className={`text-xs font-medium ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Nairobi, Kenya
                        </p>
                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            isDarkMode ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          The Mirage Towers, Chiromo Road, Westlands. Operating across Kenya, with ongoing regional expansion across East & West Africa.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specialized Support Desks */}
                <div
                  className={`p-6 rounded-2xl border ${
                    isDarkMode
                      ? 'bg-surface-900 border-white/5'
                      : 'bg-slate-100/70 border-slate-200/60'
                  }`}
                >
                  <h4
                    className={`text-sm font-bold uppercase tracking-wider mb-3 ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Support by Audience
                  </h4>
                  <ul className="space-y-3 text-xs sm:text-sm">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                          Collection Agents & Fleets:
                        </strong>{' '}
                        Assistance with daily mobile payouts, route issues, and terminal onboarding.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                          Hub & Facility Owners:
                        </strong>{' '}
                        MOS platform integration, material inventory audits, and marketplace listing.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>
                          Enterprises & Offtakers:
                        </strong>{' '}
                        High-volume recyclable procurement and verified EPR compliance reporting.
                      </span>
                    </li>
                  </ul>
                </div>
              </motion.div>

              {/* ── RIGHT COLUMN: INTERACTIVE FORM ── */}
              <motion.div
                initial={{ opacity: 0, x: 25 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-7"
              >
                <div
                  className={`p-8 sm:p-10 md:p-12 rounded-3xl border shadow-xl relative overflow-hidden ${
                    isDarkMode
                      ? 'bg-surface-900/90 border-white/10 shadow-black/40'
                      : 'bg-white border-slate-200 shadow-slate-200/60'
                  }`}
                >
                  {/* Subtle background watermark */}
                  <div
                    className={`absolute -bottom-8 -right-8 opacity-[0.03] pointer-events-none ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    <Send className="w-64 h-64" />
                  </div>

                  <div className="relative z-10 mb-8">
                    <h3
                      className={`text-2xl sm:text-3xl font-black tracking-tight mb-2 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Send Us a Message
                    </h3>
                    <p
                      className={`text-sm ${
                        isDarkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      Complete the form below and our specialized team will review your inquiry and follow up promptly.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
                    {/* First & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          First Name <span className="text-amber-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="first_name"
                          placeholder="e.g. John"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isDarkMode
                              ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Last Name <span className="text-amber-500">*</span>
                        </label>
                        <input
                          required
                          type="text"
                          name="last_name"
                          placeholder="e.g. Doe"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isDarkMode
                              ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Work Email <span className="text-amber-500">*</span>
                        </label>
                        <input
                          required
                          type="email"
                          name="email"
                          placeholder="john@organization.com"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isDarkMode
                              ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          className={`text-xs font-bold uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          Phone / WhatsApp <span className="text-slate-400 text-[10px] font-normal">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="+254 700 000 000"
                          className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all ${
                            isDarkMode
                              ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600'
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Inquiry Type */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Inquiry Category <span className="text-amber-500">*</span>
                      </label>
                      <select
                        name="inquiry_type"
                        defaultValue="Enterprise Integration & EPR"
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all cursor-pointer ${
                          isDarkMode
                            ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                      >
                        <option value="Enterprise Integration & EPR">
                          Enterprise Integration & EPR Compliance
                        </option>
                        <option value="B2B Recyclables Purchasing">
                          B2B Recyclables Purchasing (Offtaker / Processor)
                        </option>
                        <option value="MOS Software for Hub Owners">
                          MOS Software for Hub Owners & Warehouses
                        </option>
                        <option value="Collection Agent & Fleet Onboarding">
                          Collection Agent & Fleet Onboarding
                        </option>
                        <option value="Investor & Partnership Relations">
                          Investor & Partnership Relations
                        </option>
                        <option value="General Support & Feedback">
                          General Support & Feedback
                        </option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-xs font-bold uppercase tracking-wider ${
                          isDarkMode ? 'text-slate-300' : 'text-slate-700'
                        }`}
                      >
                        Message <span className="text-amber-500">*</span>
                      </label>
                      <textarea
                        required
                        name="message"
                        rows={4}
                        placeholder="Tell us about your operations, expected volume, or how we can help..."
                        className={`w-full px-4 py-3 rounded-xl border text-sm font-medium outline-none transition-all resize-none ${
                          isDarkMode
                            ? 'bg-surface-950 border-white/10 text-white focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-600'
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400'
                        }`}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 mt-2 bg-primary hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Submit Message</span>
                          <Send className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </button>

                    <p
                      className={`text-[11px] text-center mt-1 ${
                        isDarkMode ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      We value your privacy. Your information is securely stored and never shared with third parties.
                    </p>
                  </form>
                </div>
              </motion.div>

            </div>

            {/* ── ADDITIONAL SUPPORT CHANNELS (MONIEPOINT STYLE HELP HUB) ── */}
            <div className="mt-20 pt-16 border-t border-slate-200 dark:border-white/10">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                  Quick Resolution Channels
                </span>
                <h3
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Need Immediate Answers?
                </h3>
                <p
                  className={`text-sm mt-2 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  Check our self-service documentation or connect directly with our regional operations leads.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Knowledge Base / FAQ */}
                <div
                  className={`p-7 rounded-2xl border transition-all hover:-translate-y-1 ${
                    isDarkMode
                      ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  <h4
                    className={`text-lg font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Knowledge Base & FAQs
                  </h4>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Explore our comprehensive guide on weight verification scales, payout schedules, and acceptable material categories.
                  </p>
                  <Link
                    to="/faq"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Read Help Articles</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Card 2: Live In-App Chat */}
                <div
                  className={`p-7 rounded-2xl border transition-all hover:-translate-y-1 ${
                    isDarkMode
                      ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-5">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4
                    className={`text-lg font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Agent & Fleet Support
                  </h4>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Are you an active collector experiencing a route dispute or weigh-in delay? Reach our field ops team on WhatsApp.
                  </p>
                  <a
                    href="https://wa.me/254113787588"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Chat on WhatsApp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Card 3: Enterprise Consultation */}
                <div
                  className={`p-7 rounded-2xl border transition-all hover:-translate-y-1 ${
                    isDarkMode
                      ? 'bg-surface-900/80 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200/80 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-5">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4
                    className={`text-lg font-bold mb-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Enterprise & Hub Demo
                  </h4>
                  <p
                    className={`text-xs sm:text-sm leading-relaxed mb-5 ${
                      isDarkMode ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    Interested in a guided walkthrough of the MOS terminal or integrating your ERP with our logistics API?
                  </p>
                  <a
                    href="mailto:sales@klinflow.com"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    <span>Book Private Demo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>
    </Layout>
  );
}
