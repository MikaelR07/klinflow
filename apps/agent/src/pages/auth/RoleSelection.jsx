import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Briefcase, ArrowRight, Brain, Zap, ShieldCheck, Navigation, UserCheck } from 'lucide-react';

export default function RoleSelection() {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'independent',
      title: 'Independent Agent',
      subtitle: 'Your Business, Your Rules',
      description: 'Perfect for entrepreneurs with their own transport. Accept jobs, manage your own schedule, and earn directly for every kilogram you deliver to the market.',
      icon: UserCheck,
      accent: 'emerald',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-500',
      benefits: ['Flexible Hours', 'Direct Earnings', 'Business Growth']
    },
    {
      id: 'fleet_driver',
      title: 'Fleet Driver',
      subtitle: 'Optimized Operations',
      description: 'Work for a registered logistics company. Follow assigned routes, manage professional fleet assets, and execute tasks as part of a larger recycling team.',
      icon: Truck,
      accent: 'blue',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-500',
      benefits: ['Assigned Tasks', 'Fleet Support', 'Smart Routing']
    },
    {
      id: 'company_admin',
      title: 'Company Owner',
      subtitle: 'The Agent Hub',
      description: 'Best for waste management companies. Access the Agent Hub to monitor your entire fleet in real-time, track aggregate earnings, and manage staff performance.',
      icon: Briefcase,
      accent: 'amber',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-500',
      benefits: ['Fleet Monitoring', 'Admin Dashboard', 'Team Management']
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col p-6 relative overflow-hidden">
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
          Logistics <br />
          <span className="text-emerald-500">Service Path</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-4">
          How will you be operating within the network?
        </p>
      </header>

      <div className="flex-1 space-y-6 relative z-10">
        {roles.map((role, idx) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(`/register?type=${role.id}`)}
            className="w-full text-left group relative"
          >
            <div className={`absolute inset-0 bg-${role.accent}-500/5 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
            
            <div className="relative bg-white dark:bg-slate-800/50 backdrop-blur-xl border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all group-hover:border-emerald-500/30 group-hover:-translate-y-1">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-16 h-16 rounded-2xl ${role.bgColor} flex items-center justify-center ${role.textColor} border ${role.borderColor}`}>
                  <role.icon className="w-8 h-8" />
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${role.id}${i}`} alt="user" />
                    </div>
                  ))}
                </div>
              </div>

              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">{role.title}</h2>
              <p className={`text-xs font-semibold uppercase tracking-widest ${role.textColor} mb-4`}>{role.subtitle}</p>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                {role.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {role.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-white/5 rounded-full border border-slate-100 dark:border-white/5">
                    <ShieldCheck className={`w-3 h-3 ${role.textColor}`} />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-8 right-8 w-10 h-10 rounded-full bg-slate-900 dark:bg-emerald-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
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
