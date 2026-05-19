import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, User, Phone, Lock, Hash, MapPin, Bike, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, ROLES } from '@klinflow/core';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    confirmPin: '',
    role: ROLES.ADMIN,
    location: null,
    idNumber: '',
    vehicle: '',
    accessKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData(prev => ({ ...prev, role: selectedRole }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.phone.length < 9 || formData.pin.length < 8 || formData.name.length < 2) {
      toast.error('Invalid Input', { description: 'Ensure name, phone, and at least an 8-character password are provided.' });
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      toast.error('Password Mismatch', { description: 'The entered passwords do not match.' });
      return;
    }
    if (!formData.location?.estate) {
      toast.error('Missing Location', { description: 'Please securely provide your operating location.' });
      return;
    }

    if (formData.role === ROLES.AGENT && !formData.idNumber) {
      toast.error('Missing Agent Details', { description: 'Agents must provide a National ID number.' });
      return;
    }

    // Security Gate: Admin Access Key Validation
    const masterKey = import.meta.env.VITE_ADMIN_REGISTRATION_KEY;
    if (masterKey && formData.accessKey !== masterKey) {
      toast.error('Security Violation', { description: 'The provided Admin Access Key is incorrect. Unauthorized provisioning blocked.' });
      return;
    }

    setIsLoading(true);
    try {
      await register(formData);
      toast.success('Registration Successful', { description: 'Your Klinflow account has been created.' });
      navigate('/', { replace: true });
    } catch (err) {
      toast.error('Registration Failed', { description: err.message || 'Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const isAgent = false;

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-900 px-4 py-8">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-full flex items-center justify-between mb-6">
            <Link to="/login" className="p-2 -ml-2 rounded-full hover:bg-white/10 text-slate-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
          <img src="/logo.png" className="w-56 h-auto shadow-2xl rounded-3xl mb-4" alt="Admin Logo" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Admin Provisioning</h1>
          <p className="text-sm text-slate-400 mt-1 mb-6 font-medium">Create a new administrator account for CleanCore.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-4">
          
          {/* Base Fields */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="07XX XXX XXX" className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="password" name="pin" value={formData.pin} onChange={handleInputChange} placeholder="••••••••" minLength={8} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input type="password" name="confirmPin" value={formData.confirmPin} onChange={handleInputChange} placeholder="••••••••" minLength={8} className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" required />
              </div>
            </div>
          </div>

          {/* Location Block */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-slide-up text-left">
            <LocationSelector 
              value={formData.location} 
              onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
            />
          </div>

          {/* Security Gate Field */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="block text-xs font-semibold text-rose-500 mb-1.5 uppercase tracking-widest">Admin Access Key</label>
            <div className="relative">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500/50" />
              <input 
                type="password" 
                name="accessKey" 
                value={formData.accessKey} 
                onChange={handleInputChange} 
                placeholder="Required Secret Key" 
                className="w-full pl-11 pr-4 py-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-rose-500/50 text-sm font-mono tracking-widest" 
                required 
              />
            </div>
            <p className="text-xs text-slate-500 mt-2 font-semibold italic tracking-tight">Only authorized personnel can provision administrator accounts.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-4 mt-4 text-white rounded-xl font-semibold text-[15px] shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${!isAgent ? 'bg-primary hover:bg-primary-dark shadow-primary/30' : 'bg-secondary hover:bg-blue-700 shadow-secondary/30'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Provision Admin Account'}
          </button>
        </form>

      </div>
    </div>
  );
}
