import { motion } from 'framer-motion';
import { 
  Building2, ShoppingBag, BarChart3, ShieldCheck, 
  Layers, Zap, CheckCircle2, ArrowRight
} from 'lucide-react';
import { useThemeStore } from '@cleanflow/core';
import Layout from '../layouts/Layout';

export default function ForBusinesses() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`} />
          <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full`} />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto mb-20">
            <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               Industrial-Scale <br className="hidden sm:block" />
               <span className="text-indigo-500 italic">Procurement.</span>
            </h1>
            <p className={`text-base md:text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
               CleanFlow connects industrial buyers with a verified, real-time supply chain of circular materials. Secure your raw material pipeline with absolute grade transparency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
             {[
                { title: 'Verified Supply', desc: 'Every kilogram on our marketplace is verified by AI and human agents, ensuring you get the exact material grade you pay for.', icon: ShieldCheck },
                { title: 'B2B Settlement', desc: 'Secure your trades with automated escrow and instant industrial settlement protocols designed for high-volume commerce.', icon: Layers },
                { title: 'Supply Intelligence', desc: 'Track material availability, price shifts, and collection hotspots to optimize your procurement strategy.', icon: BarChart3 },
             ].map((item, i) => (
                <div key={i} className={`p-10 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-xl'}`}>
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-8">
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
         <div className={`max-w-5xl mx-auto p-8 md:p-20 rounded-2xl text-center bg-indigo-600`}>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold tracking-tighter mb-8 text-white">Scale Your Supply.</h2>
            <button className="px-10 py-5 bg-white text-indigo-600 font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all">
               Speak to Enterprise Sales
            </button>
         </div>
      </section>
    </Layout>
  );
}
