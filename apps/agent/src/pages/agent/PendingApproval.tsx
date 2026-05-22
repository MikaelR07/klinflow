import { useNavigate } from 'react-router-dom';
import { Clock, ShieldAlert, LogOut, Info } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';

export default function PendingApproval() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-900 px-6 py-10 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-5%] left-[-10%] w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-[20%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full mx-auto relative z-10 animate-slide-up text-center">
        
        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
          <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">
          Pending Approval
        </h1>
        
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed">
          Your request to join the company fleet has been submitted. The company administrator must approve your account before you can start receiving pickups.
        </p>

        <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 text-left mb-8 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" /> Next Steps
          </h3>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 font-medium">
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              Contact your company admin and notify them you've registered.
            </li>
            <li className="flex items-start gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              Once approved, you will gain full access to the agent dashboard automatically.
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl font-bold tracking-widest text-[10px] uppercase shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>

      </div>
    </div>
  );
}
