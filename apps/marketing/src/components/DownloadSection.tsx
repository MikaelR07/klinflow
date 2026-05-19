import { motion } from 'framer-motion';
import { Smartphone, Apple, PlayCircle, Monitor, ExternalLink, ChevronRight, CheckCircle2 } from 'lucide-react';

const appSuite = [
  {
    name: "Resident & Seller",
    type: "Mobile App",
    desc: "The core portal for waste monetization, points tracking, and B2B marketplace listings.",
    icon: <Smartphone className="w-6 h-6" />,
    color: "from-emerald-500 to-teal-600",
    badges: true,
    platform: "iOS & Android"
  },
  {
    name: "Agent Terminal",
    type: "Field Tool",
    desc: "Mission-critical tool for collectors. AI verification, routing, and real-time commission settlement.",
    icon: <Smartphone className="w-6 h-6" />,
    color: "from-blue-500 to-indigo-600",
    badges: true,
    platform: "iOS & Android"
  },
  {
    name: "Enterprise Command",
    type: "Web Portal",
    desc: "Desktop-grade dashboard for Hub Managers and Fleet Owners to monitor logistics and intake at scale.",
    icon: <Monitor className="w-6 h-6" />,
    color: "from-slate-700 to-slate-900",
    badges: false,
    platform: "Desktop Web"
  }
];

export default function DownloadSection({ isDarkMode }) {
  return (
    <section className={`py-40 px-6 relative overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 text-emerald-500 font-bold uppercase tracking-widest text-xs mb-6">
            <CheckCircle2 className="w-4 h-4" /> Native Access
          </div>
          <h2 className={`text-4xl md:text-7xl font-bold tracking-tighter mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Klinflow in Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Hand & Workspace.</span>
          </h2>
          <p className={`text-xl font-medium leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Download the native mobile apps for field operations or access the high-fidelity command center via your desktop.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {appSuite.map((app, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-10 rounded-[3rem] border flex flex-col h-full transition-all duration-500 ${
                isDarkMode 
                  ? 'bg-slate-900/50 border-white/5 hover:border-emerald-500/20 shadow-2xl' 
                  : 'bg-white border-slate-100 hover:border-emerald-500/20 shadow-xl'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.color} text-white flex items-center justify-center mb-8 shadow-lg`}>
                {app.icon}
              </div>
              
              <div className="mb-4">
                <span className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-1 block">{app.type}</span>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{app.name}</h3>
              </div>

              <p className={`text-sm font-medium leading-relaxed mb-10 flex-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {app.desc}
              </p>

              <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                {app.badges ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Available for {app.platform}</p>
                    <div className="flex flex-wrap gap-3">
                      <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-lg group">
                        <Apple className="w-5 h-5" />
                        <div className="text-left">
                          <p className="text-xs font-bold uppercase leading-none opacity-60">App Store</p>
                          <p className="text-xs font-black tracking-tight leading-tight">Download</p>
                        </div>
                      </button>
                      <button className="flex items-center gap-3 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-105 transition-all shadow-lg group">
                        <PlayCircle className="w-5 h-5" />
                        <div className="text-left">
                          <p className="text-xs font-bold uppercase leading-none opacity-60">Play Store</p>
                          <p className="text-xs font-black tracking-tight leading-tight">Get it on</p>
                        </div>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Optimized for {app.platform}</p>
                     <button className={`flex items-center justify-between px-6 py-4 rounded-xl border font-bold text-sm transition-all active:scale-95 group ${
                       isDarkMode ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100'
                     }`}>
                       Access Web Command <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                     </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
