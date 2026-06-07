import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, Briefcase, ArrowRight, Brain, Zap, ShieldCheck, Navigation, UserCheck } from 'lucide-react';
import { OptimizedImage } from '@klinflow/ui';

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
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-600',
      iconColor: 'text-white',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      benefits: ['Flexible Hours', 'Direct Earnings', 'Business Growth']
    },
    {
      id: 'fleet_driver',
      title: 'Fleet Driver',
      subtitle: 'Optimized Operations',
      description: 'Work for a registered logistics company. Follow assigned routes, manage professional fleet assets, and execute tasks as part of a larger recycling team.',
      icon: Truck,
      accent: 'blue',
      bgColor: 'bg-blue-600',
      borderColor: 'border-blue-700',
      iconColor: 'text-white',
      textColor: 'text-blue-600 dark:text-blue-400',
      benefits: ['Assigned Tasks', 'Fleet Support', 'Smart Routing']
    },
    {
      id: 'company_admin',
      title: 'Company Owner',
      subtitle: 'The Agent Hub',
      description: 'Best for waste management companies. Access the Agent Hub to monitor your entire fleet in real-time, track aggregate earnings, and manage staff performance.',
      icon: Briefcase,
      accent: 'amber',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-600',
      iconColor: 'text-white',
      textColor: 'text-amber-600 dark:text-amber-400',
      benefits: ['Fleet Monitoring', 'Admin Dashboard', 'Team Management']
    }
  ];

  return (
    <div className=" bg-slate-50 dark:bg-slate-900 flex flex-col p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

      <header className="relative z-10 pt-2 mb-3">
        <button
          onClick={() => navigate(-1)}
          className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 shadow-sm"
        >
          <ArrowRight className="w-5 h-5 rotate-180" />
        </button>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-4">
          How will you be operating within the network?
        </p>
      </header>

      <div className="flex-1 space-y-3 relative z-10">
        {roles.map((role, idx) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => navigate(`/register?type=${role.id}`)}
            className="w-full text-left group relative active:scale-[0.98] transition-transform"
          >
            {/* No Glow */}

            <div className="relative bg-[#FFFFFF] dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-[2rem] p-5 transition-all md:group-hover:border-emerald-500/30 md:group-hover:-translate-y-1">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl ${role.bgColor} flex items-center justify-center ${role.iconColor} border ${role.borderColor}`}>
                  <role.icon className="w-6 h-6" />
                </div>
              </div>

              <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">{role.title}</h2>
              <p className={`text-[10px] font-semibold capitalize tracking-widest ${role.textColor} mb-2`}>{role.subtitle}</p>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                {role.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {role.benefits.map((benefit, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-slate-900 dark:bg-emerald-500 text-white flex items-center justify-center opacity-0 md:group-hover:opacity-100 transition-all translate-x-4 md:group-hover:translate-x-0 hidden md:flex">
                <ArrowRight className="w-5 h-5" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <footer className="py-8 text-center relative z-10">
        <p className="text-xs text-slate-400 font-medium">
          Powered by <span className="text-emerald-500 font-semibold">Klinflow</span>
        </p>
      </footer>
    </div>
  );
}
