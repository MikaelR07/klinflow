import { motion } from 'framer-motion';
import { 
  Truck, Navigation, Zap, Briefcase, 
  HandCoins, TrendingUp, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

export default function ForAgents() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto mb-20">
            <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               Earn More, <br className="hidden sm:block" />
               <span className="text-blue-500 italic">Drive Smarter.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
               CleanFlow provides individual collectors and fleet drivers with guaranteed job flow, AI-optimized routing, and instant payouts. Build your career in circular logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
             {[
                { title: 'Guaranteed Missions', desc: 'Stop searching for collections. Our job board provides a steady stream of verified pickup requests near you.', icon: Briefcase },
                { title: 'Optimized Routes', desc: 'Save time and fuel. Our AI plans your entire day with multi-stop routes that maximize your hourly earnings.', icon: Navigation },
                { title: 'Instant Commissions', desc: 'No more waiting for weeks to get paid. Withdraw your commissions to M-Pesa the moment your drop-off is verified.', icon: HandCoins },
             ].map((item, i) => (
                <div key={i} className={`p-10 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8">
                      <item.icon className="w-6 h-6" />
                   </div>
                   <h4 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                   <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-32 px-6">
         <div className={`max-w-5xl mx-auto p-8 md:p-20 rounded-2xl text-center bg-blue-600`}>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 text-white">Join the Fleet.</h2>
            <button className="px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all">
               Apply to Become an Agent
            </button>
         </div>
      </section>
    </Layout>
  );
}
