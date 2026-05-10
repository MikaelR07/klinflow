import { useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, Brain, Zap, Sparkles, Briefcase, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col"
      >
        {/* Hero Section */}
        <div className="flex-1 flex flex-col justify-center relative z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-6 w-fit">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Logistics & Dispatch</span>
          </div>

          <h1 className="text-5xl font-semibold text-slate-900 dark:text-white leading-[0.95] mb-6 tracking-tighter">
            Clean Cities. <br />
            <span className="text-emerald-500 italic">Unlimited Earnings.</span>
          </h1>

          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-sm mb-10 leading-relaxed">
            CleanFlow Agent is the command center for modern recyclers. Navigate, collect, and trade waste-assets with AI-powered efficiency.
          </p>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-8 mb-12">
            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-emerald-500/5 flex items-center justify-center text-emerald-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">HygeneX Ops Manager</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Let AI optimize your routes and grade your collections. Minimize fuel, maximize recovery, and grow your recycling empire.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-blue-500/5 flex items-center justify-center text-blue-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <TrendingUp className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">Waste Marketplace</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Sell your collected inventory directly to Weaver Hubs. Get instant payouts and access top market prices for every kilogram.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-amber-500/5 flex items-center justify-center text-amber-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">Fleet Operations Hub</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Own a fleet? Manage your entire team from one dashboard. Monitor collections in real-time, track aggregate earnings, and optimize your logistics network.</p>
              </div>
            </div>

            <div className="flex gap-4 group">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-xl shadow-orange-500/5 flex items-center justify-center text-orange-500 shrink-0 border border-slate-100 dark:border-slate-700">
                <Zap className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-base">Micro-Credit for Growth</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Need a better truck or more bags? Access low-interest micro-credit based on your verified collection performance and asset history.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="relative z-10 pb-8 space-y-4">
          <button
            onClick={() => navigate('/role-selection')}
            className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-semibold text-base shadow-2xl shadow-emerald-600/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Start Collecting <ArrowRight className="w-5 h-5" />
          </button>
          
          <div className="flex items-center justify-center gap-2">
            <p className="text-sm text-slate-400 font-medium">Already an Agent?</p>
            <button onClick={() => navigate('/login')} className="text-sm text-emerald-500 font-semibold uppercase tracking-widest">Log In</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
