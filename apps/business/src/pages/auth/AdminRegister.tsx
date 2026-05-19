import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldAlert, User, Phone, Mail, Lock, KeyRound, Loader2 } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pin: '',
    confirmPin: '',
    secretKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();

    // Basic Validations
    if (formData.name.trim().length < 2) {
      toast.error('Invalid Name', { description: 'Please enter your full name.' });
      return;
    }
    if (formData.phone.length < 9) {
      toast.error('Invalid Phone', { description: 'Please enter a valid phone number.' });
      return;
    }
    if (formData.pin.length !== 6) {
      toast.error('Invalid PIN', { description: 'Security PIN must be exactly 6 digits.' });
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      toast.error('PIN Mismatch', { description: 'The entered PINs do not match.' });
      return;
    }

    // Secret Key Validation
    const actualSecret = import.meta.env.VITE_ADMIN_SECRET_KEY;
    if (!actualSecret) {
      toast.error('Configuration Error', { description: 'VITE_ADMIN_SECRET_KEY is not defined on the server.' });
      return;
    }
    if (formData.secretKey !== actualSecret) {
      toast.error('Security Failure', { description: 'Invalid Admin Secret Key.' });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        pin: formData.pin,
        role: ROLES.ADMIN,
        location: { estate: 'System', latitude: null, longitude: null } // Mock location to satisfy mock DB requirements
      });
      toast.success('Admin Created', { description: 'Admin account registered successfully.' });
      navigate('/admin/login', { replace: true });
    } catch (err) {
      toast.error('Registration Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pt-12 pb-24 sm:py-8 justify-center bg-slate-900 border-t-4 border-rose-500 px-4 relative overflow-y-auto">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Admin Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Klinflow <span className="text-rose-500">Security</span>
          </h1>
          <p className="text-sm border border-rose-500/30 bg-rose-500/10 text-rose-300 py-1.5 px-3 rounded-full mt-3 font-medium inline-block shadow-lg">
            Authorized Personnel Only
          </p>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed px-4">
            This page is for administrators only. Contact the founder if you need access.
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleAdminRegister} className="bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Admin Name" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500/50 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07XX XXX XXX" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500/50 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Email (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="admin@klinflow.app" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500/50 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">6-Digit PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input type="password" name="pin" value={formData.pin} onChange={handleInputChange} placeholder="••••••" maxLength={6} inputMode="numeric" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500/50 tracking-widest text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Confirm PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input type="password" name="confirmPin" value={formData.confirmPin} onChange={handleInputChange} placeholder="••••••" maxLength={6} inputMode="numeric" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500/50 tracking-widest text-sm" required />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-rose-400 mb-1.5 uppercase tracking-wider">Admin Secret Key</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500" />
              <input type="password" name="secretKey" value={formData.secretKey} onChange={handleInputChange} placeholder="Required System Key" className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-rose-500/30 rounded-xl text-white focus:ring-2 text-base focus:ring-rose-500 focus:border-rose-500 text-sm placeholder:text-rose-500/30" required />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-rose-900/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Registering...
              </>
            ) : (
              'Create Admin Account'
            )}
          </button>

          <div className="text-center pt-4 border-t border-slate-700 mt-6">
            <p className="text-sm text-slate-400">
              Already have an admin account?{' '}
              <Link to="/admin/login" className="text-rose-400 font-semibold hover:text-rose-300 transition-colors">
                Secure Login
              </Link>
            </p>
          </div>
        </form>

      </div>
    </div>
  );
}
