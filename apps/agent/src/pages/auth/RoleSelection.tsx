import { useNavigate } from 'react-router-dom';
import { Truck, UserCheck, ArrowRight, ArrowLeft, Leaf, ShieldCheck, Clock, TrendingUp, Navigation, Briefcase, Zap } from 'lucide-react';

const roles = [
  {
    id: 'independent',
    title: 'Independent Agent',
    subtitle: 'Your Business, Your Rules',
    description: 'Perfect for entrepreneurs with their own transport. Accept jobs, manage your own schedule, and earn directly for every kilogram you deliver to the market.',
    icon: UserCheck,
    cardClasses: 'bg-gradient-to-br from-primary to-emerald-700',
    iconBg: 'rgba(255,255,255,0.15)',
    benefits: [
      { icon: Clock, text: 'Send contracts' },
      { icon: TrendingUp, text: 'Direct earnings' },
    ],
  },
  {
    id: 'fleet_driver',
    title: 'Fleet Driver',
    subtitle: 'Optimized Operations',
    description: 'Work for a registered logistics company. Follow assigned routes, manage professional fleet assets, and execute tasks as part of a larger recycling team.',
    icon: Truck,
    cardClasses: 'bg-gradient-to-br from-slate-800 to-slate-600',
    iconBg: 'rgba(255,255,255,0.15)',
    benefits: [
      { icon: Briefcase, text: 'Assigned tasks' },
      { icon: ShieldCheck, text: 'Fleet support ' },
    ],
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-white min-h-[100dvh] w-full max-w-lg mx-auto relative font-sans">

      {/* Header */}
      <div className="px-4 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors mb-8"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>

        <h1 className="text-[28px] font-bold text-slate-900 leading-tight tracking-tight mb-1 text-center">
          Agent Roles <br />Explained
        </h1>
        <p className="text-[15px] text-slate-500 leading-relaxed text-center">
          Learn about the different ways you can operate within the Klinflow network.
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex-1 px-2 pt-4 space-y-2 pb-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className={`relative rounded-2xl p-6 shadow-lg ${role.cardClasses}`}
          >
            {/* Header Row: Icon + Title */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: role.iconBg }}
              >
                <role.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight mb-0.5">
                  {role.title}
                </h2>
                <p className="text-[13px] font-semibold text-white/70">
                  {role.subtitle}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed mb-5">
              {role.description}
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-2">
              {role.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl">
                  <benefit.icon className="w-3.5 h-3.5 text-white/60 shrink-0" />
                  <span className="text-[11px] font-medium text-white/70">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      <div className="px-6 pb-8 pt-2 space-y-3">
        <button
          onClick={() => navigate('/register')}
          className="w-full py-[16px] bg-[#064e3b] text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#022c22]"
        >
          Start Registration <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-medium text-slate-400">Already have an account?</span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-[#064e3b] hover:text-emerald-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>

    </div>
  );
}
