import { motion } from 'framer-motion';

interface GlassMockupProps {
  color?: 'emerald' | 'blue' | 'indigo' | 'rose';
  icon?: any;
  isDarkMode: boolean;
}

export default function GlassMockup({ color = 'emerald', icon: Icon, isDarkMode }: GlassMockupProps) {
  const colors = {
    emerald: 'from-emerald-500/20 to-teal-500/10',
    blue: 'from-blue-500/20 to-cyan-500/10',
    indigo: 'from-indigo-500/20 to-purple-500/10',
    rose: 'from-rose-500/20 to-pink-500/10',
  };

  const accentColors = {
    emerald: 'bg-primary',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="relative">
      <div className={`aspect-square rounded-[3rem] md:rounded-[4rem] border transition-all overflow-hidden flex items-center justify-center ${
        isDarkMode 
          ? 'bg-white/5 border-white/5' 
          : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Clean Static Background Gradient */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-10`}
        />

        {/* Inner Glass Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className={`relative w-32 h-32 md:w-48 md:h-48 rounded-[2rem] md:rounded-[3rem] flex items-center justify-center shadow-sm border ${
            isDarkMode 
              ? 'bg-surface-900 border-white/10' 
              : 'bg-white border-slate-200'
          }`}
        >
          <div className={`w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] ${accentColors[color]} flex items-center justify-center text-white shadow-xl`}>
            {Icon && <Icon className="w-8 h-8 md:w-12 md:h-12" />}
          </div>

          {/* Decorative Rings */}
          <div className="absolute inset-0 border border-white/20 rounded-[2rem] md:rounded-[3rem] scale-110 opacity-20" />
          <div className="absolute inset-0 border border-white/10 rounded-[2rem] md:rounded-[3rem] scale-125 opacity-10" />
        </motion.div>
      </div>

      {/* Floating Badge (Visual Decor) */}
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -top-6 -right-6 p-4 rounded-2xl backdrop-blur-md border shadow-xl ${
          isDarkMode 
            ? 'bg-surface-950/80 border-white/10 text-white' 
            : 'bg-white/80 border-slate-200 text-slate-900'
        }`}
      >
        <div className="text-xs font-black uppercase tracking-widest text-primary mb-1">Status</div>
        <div className="text-xs font-bold">Encrypted Ledger</div>
      </motion.div>
    </div>
  );
}
