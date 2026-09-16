import { useNavigate } from 'react-router-dom';
import { Home, TrendingUp, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';

const roles = [
  {
    id: 'resident',
    title: 'Resident & Business',
    subtitle: 'I want to recycle & earn cash',
    description: 'Perfect for Homes, Cafes, and Offices. Book collectors to your doorstep, get paid for every kilo you trade.',
    icon: Home,
    cardBg: '#064e3b',
    iconBg: 'rgba(255,255,255,0.15)',
  },
  {
    id: 'seller',
    title: 'Pro-Seller',
    subtitle: 'Sell your collections to buyers',
    description: 'Best for Informal Pickers and collection groups. List verified inventory and sell directly to companies at top prices.',
    icon: TrendingUp,
    cardBg: '#1e40af',
    iconBg: 'rgba(255,255,255,0.15)',
  },
];

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-white min-h-[100dvh] w-full max-w-lg mx-auto relative font-sans">

      {/* Header */}
      <div className="px-6 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors mb-8"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-6 h-6 text-emerald-600 fill-emerald-600" />
          <span className="text-sm font-bold text-emerald-700 tracking-tight">Klinflow</span>
        </div>

        <h1 className="text-[28px] font-bold text-[#0c392c] leading-tight tracking-tight mb-2">
          How will you use <br />Klinflow?
        </h1>
        <p className="text-[15px] text-slate-500 leading-relaxed">
          Pick the path that fits you best. You can always switch later.
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex-1 px-6 pt-10 space-y-4">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => navigate(`/register?type=${role.id}`)}
            className="w-full text-left group active:scale-[0.98] transition-all"
          >
            <div
              className="relative rounded-2xl p-6 pr-14 transition-all shadow-lg"
              style={{ backgroundColor: role.cardBg }}
            >
              
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: role.iconBg }}
              >
                <role.icon className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <h2 className="text-lg font-bold text-white tracking-tight mb-0.5">
                {role.title}
              </h2>
              <p className="text-[13px] font-semibold text-white/70 mb-2">
                {role.subtitle}
              </p>
              <p className="text-sm text-white/50 leading-relaxed">
                {role.description}
              </p>

              {/* Arrow */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 group-hover:bg-white/30 flex items-center justify-center transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-6 py-8">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-medium text-slate-400">Already have an account?</span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-[#064e3b] hover:text-[#022c22] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>

    </div>
  );
}
