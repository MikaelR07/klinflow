import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, ArrowRight, Brain, Zap, ShieldCheck, TrendingUp } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'resident',
      title: 'Household & Small Businesses',
      subtitle: 'I want to recycle & earn Money',
      description: 'Perfect for homes, cafes, or offices. Book a professional collector to your doorstep, keep your space clean, and get paid for every kilogram you segregate.',
      icon: Home,
      accent: 'emerald',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-600',
      iconColor: 'text-white',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      benefits: ['Doorstep Pickups', 'Cash Rewards', 'Impact Tracking']
    },
    {
      id: 'seller',
      title: 'Pro-Seller & Collector',
      subtitle: 'I have collections to sell',
      description: 'Best for informal pickers, yard owners, or collection groups. List your verified inventory as a "Waste-Asset" and sell directly to companies and agents for top prices.',
      icon: TrendingUp,
      accent: 'blue',
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-700',
      iconColor: 'text-white',
      textColor: 'text-blue-600 dark:text-blue-400',
      benefits: ['Direct-to-Market', 'Inventory Management', 'Micro-Credit Access']
    }
  ];

  return (
    <div className="flex flex-col dark:bg-slate-900 min-h-dvh max-w-lg mx-auto px-6 py-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <header className="relative z-10 pt-8 mb-12">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 mb-8 shadow-sm"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-white leading-tight tracking-tighter">
          Choose Your <br />
          <span className="text-emerald-500">Klinflow Path</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-4">
          How would you like to contribute to the ecosystem?
        </p>
      </header>

      <div className="flex-1 space-y-6 relative z-10">
        {roles.map((role, idx) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, ease: "easeOut" }}
            onClick={() => navigate(`/register?type=${role.id}`)}
            className="w-full text-left group relative active:scale-[0.99] transition-all gpu-layer"
          >
            <div className="relative bg-[#FFFFFF] dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-[2.5rem] p-8 transition-all active:bg-slate-100 dark:active:bg-slate-800 overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl ${role.bgColor} flex items-center justify-center ${role.iconColor} border ${role.borderColor} shadow-inner`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <div className="flex -space-x-2.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-9 h-9 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden shadow-sm">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role.id}${i}`} alt="user" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">{role.title}</h2>
              <p className={`text-[10px] font-bold capitalize tracking-[0.2em] ${role.textColor} mb-4`}>{role.subtitle}</p>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium">
                {role.description}
              </p>

              <div className="flex flex-wrap gap-2.5">
                {role.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-100 dark:bg-emerald-900 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 capitalize tracking-tight">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-8 right-8 w-11 h-11 rounded-full bg-slate-900 dark:bg-emerald-500 text-white flex items-center justify-center shadow-lg transition-all md:group-hover:scale-110 hidden md:flex">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <footer className="py-8 text-center relative z-10">
        <p className="text-xs text-slate-400 font-medium">
          Powered by <span className="text-emerald-500 font-semibold">HygeneX AI</span> Neural Network
        </p>
      </footer>
    </div>
  );
}
