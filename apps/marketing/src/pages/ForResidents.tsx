import { motion } from 'framer-motion';
import { 
  Home as HomeIcon, CheckCircle2, ArrowRight, 
  Wallet, Search, Trash2, Sprout, HandCoins
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core';
import Layout from '../layouts/Layout';

export default function ForResidents() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto mb-20">
            <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               Household Waste, <br className="hidden sm:block" />
               <span className="text-emerald-500 italic">Redefined.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
               Stop throwing away value. Klinflow makes it effortless for residents to schedule pickups, verify their impact, and earn rewards for every kilogram of recyclables recovered.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
             {[
                { title: 'Doorstep Convenience', desc: 'Schedule a collection in seconds. Our agents come to you, verify the weight, and take it from there.', icon: Trash2 },
                { title: 'Instant Rewards', desc: 'Earn GreenFlow Points for every collection. Redeem them for utility bills, shopping vouchers, or cash.', icon: HandCoins },
                { title: 'Community Impact', desc: 'Track your household contribution to a cleaner city with personalized impact metrics and badges.', icon: Sprout },
             ].map((item, i) => (
                <div key={i} className={`p-10 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-8">
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
         <div className={`max-w-5xl mx-auto p-8 md:p-20 rounded-2xl text-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <h2 className={`text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Ready to Clean Up?</h2>
            <button className="px-10 py-5 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
               Download for iOS & Android
            </button>
         </div>
      </section>
    </Layout>
  );
}
