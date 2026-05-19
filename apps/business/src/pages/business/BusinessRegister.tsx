import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Recycle, Building2, Phone, Lock, Mail, MapPin, Loader2, ArrowLeft, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore, ROLES } from '@klinflow/core';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

const BUSINESS_TYPES = [
  'Recycler', 
  'Farming Business', 
  'Manufacturer', 
  'Estate Management', 
  'E-Waste Processor', 
  'Other'
];

export default function BusinessRegister() {
  const [formData, setFormData] = useState({
    name: '', // Business Name
    businessType: '',
    phone: '',
    email: '',
    pin: '',
    confirmPin: '',
    location: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.name.length < 3) {
      toast.error('Invalid Business Name', { description: 'Please enter a valid business name.' });
      return;
    }
    if (!formData.businessType) {
      toast.error('Select Business Type', { description: 'Please select your type of business.' });
      return;
    }
    if (formData.phone.length < 9) {
      toast.error('Invalid Phone', { description: 'Please enter a valid phone number.' });
      return;
    }
    if (formData.pin.length < 6) {
      toast.error('Invalid PIN', { description: 'PIN must be 6 digits.' });
      return;
    }
    if (formData.pin !== formData.confirmPin) {
      toast.error('PIN Mismatch', { description: 'The entered PINs do not match.' });
      return;
    }
    if (!formData.location?.estate) {
      toast.error('Missing Location', { description: 'Please provide your operating location.' });
      return;
    }

    setIsLoading(true);
    try {
      await register({
        ...formData,
        role: ROLES.BUSINESS,
      });
      toast.success('Business Registered', { description: 'Welcome to the Klinflow Marketplace!' });
      navigate('/marketplace', { replace: true });
    } catch (err) {
      toast.error('Registration Failed', { description: err.message || 'Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center bg-slate-50 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-md w-full mx-auto animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/login" className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div className="w-9" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Business Registration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6 font-medium">Connect your business to the green circular economy.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-4">
          
          {/* Business Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Business Name</label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="EcoRecycle Solutions" 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" 
                required 
              />
            </div>
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Type of Business</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select 
                name="businessType" 
                value={formData.businessType} 
                onChange={handleInputChange} 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm appearance-none" 
                required
              >
                <option value="" disabled>Select Business Type</option>
                {BUSINESS_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  placeholder="07XX XXX XXX" 
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" 
                  required 
                />
              </div>
            </div>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  placeholder="biz@klinflow.ke" 
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">6-Digit PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  name="pin" 
                  value={formData.pin} 
                  onChange={handleInputChange} 
                  placeholder="••••••" 
                  minLength={6} 
                  maxLength={6} 
                  inputMode="numeric" 
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" 
                  required 
                />
              </div>
            </div>
            {/* Confirm PIN */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">Confirm PIN</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  name="confirmPin" 
                  value={formData.confirmPin} 
                  onChange={handleInputChange} 
                  placeholder="••••••" 
                  minLength={6} 
                  maxLength={6} 
                  inputMode="numeric" 
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 tracking-widest text-sm" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Location Block */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 animate-slide-up">
            <LocationSelector 
              value={formData.location} 
              onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-4 bg-primary hover:bg-emerald-600 text-white rounded-xl font-semibold text-[15px] shadow-lg shadow-primary/30 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Business'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          Already have a business account?{' '}
          <Link to="/business/login" className="text-primary font-semibold hover:underline">Log In</Link>
        </p>

      </div>
    </div>
  );
}
