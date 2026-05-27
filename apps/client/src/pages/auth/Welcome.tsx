import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Recycle, Gift, Gauge, Sparkles, CreditCard, Store, ChevronRight, ArrowLeft, Brain, Zap, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Welcome() {
  const navigate = useNavigate();
  const startRecycling = () => {
    navigate('/role-selection');
  };

  return (
    <div className="flex flex-col dark:bg-slate-900 min-h-dvh max-w-lg mx-auto px-6 py-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center relative z-10">


          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 w-fit">
            <Users className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 capitalize tracking-widest">For Homes & Pro-Sellers</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white leading-[0.95] mb-6 tracking-tighter">
            Recyclables into <span className="text-emerald-500 italic">Assets.</span> <br />
            AI-Powered.
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-10 leading-relaxed">
            Klinflow is an AI-driven "Waste-as-Asset" ecosystem. We turn your recyclables into Money while powering a Whole network of sustainable collectors.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-8 mb-12">
            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800  flex items-center justify-center text-emerald-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">HygeneX AI Assistant</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Meet your intelligent operations manager. HygeneX uses vision AI to grade your waste, manage logistics, and help you earn more.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800  flex items-center justify-center text-blue-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">Waste-as-Asset Marketplace</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Don't just discard—sell. Whether you're a household or a professional picker, your collections are high-value assets for our Weaver network.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800  flex items-center justify-center text-amber-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">Micro-Credit Ecosystem</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Unlock financial growth. Use your verified market trading data to access micro-loans and grow your collection business.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 pb-8 space-y-4">
          <button
            onClick={startRecycling}
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-semibold text-base shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Join the Movement <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-slate-400 font-medium">Already have an account?</p>
            <button onClick={() => navigate('/login')} className="text-sm text-emerald-500 font-semibold capitalize tracking-widest">Log In</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
