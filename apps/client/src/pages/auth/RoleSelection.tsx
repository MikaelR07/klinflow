import { useNavigate } from 'react-router-dom';
import { Home, TrendingUp, ArrowRight, ArrowLeft, Leaf } from 'lucide-react';

const roles = [
  {
    id: 'resident',
    title: 'Resident & Business',
    subtitle: 'I want to recycle & earn cash',
    description: 'Perfect for Homes, Cafes, and Offices. Book collectors to your doorstep, get paid for every kilo you trade.',
    icon: Home,
    cardBg: '#0a8901ff',
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
      <div className="px-4 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors mb-8"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
        </button>
        <h1 className="text-[28px] font-bold text-[#0c392c] leading-tight tracking-tight mb-2 text-center">
          How will you use <br />Klinflow?
        </h1>
        <p className="text-[15px] text-slate-500 leading-relaxed text-center">
          Pick the path that fits you best. You can always switch later.
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex-1 px-2 pt-10 space-y-2 pb-4">
        {roles.map((role) => (
          <div
            key={role.id}
            className="relative rounded-2xl p-6 shadow-lg"
            style={{ backgroundColor: role.cardBg }}
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
            
            <p className="text-sm text-white/80 leading-relaxed mb-2">
              {role.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      <div className="px-6 pb-8 pt-4 space-y-3">
        <button
          onClick={() => navigate('/register')}
          className="w-full py-[16px] bg-[#0c392c] text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:bg-[#06241c]"
        >
          Start Registration <ArrowRight className="w-[18px] h-[18px]" />
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-medium text-slate-500">Already have an account?</span>
          <button
            onClick={() => navigate('/login')}
            className="text-sm font-bold text-emerald-600 hover:text-emerald-500 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>

    </div>
  );
}
