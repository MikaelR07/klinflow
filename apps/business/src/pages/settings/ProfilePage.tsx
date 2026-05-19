import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuthStore, getBusinessLabel } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function ProfilePage() {
  const profile = useAuthStore(s => s.profile);
  const role = useAuthStore(s => s.role);
  const updateProfile = useAuthStore(s => s.updateProfile);
  const navigate = useNavigate();
  const isAgent = role === ROLES.AGENT;

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || null,
    idNumber: profile?.idNumber || '',
    businessType: profile?.businessType || '',
    specializations: profile?.specializations || [],
    nemaLicense: profile?.nemaLicense || '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile Updated', { description: 'Your information has been saved successfully.' });
      navigate('/settings');
    } catch (err) {
      toast.error('Failed to update', { description: 'Please try again later' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">My Profile</h1>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Basic Details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">Basic Information</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number <span className="lowercase text-xs text-slate-400">(Read-only)</span></label>
            <input type="tel" value={formData.phone} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed opacity-70" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email (Optional)</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
          </div>
        </div>

        {/* Active Application Location */}
        <div className="card p-5 space-y-4">
          <LocationSelector 
            value={formData.location} 
            onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
          />
        </div>

        {/* Agent Details */}
        {isAgent && (
          <div className="card p-5 space-y-4 bg-secondary/5 border-secondary/20">
             <h2 className="text-sm font-semibold text-secondary mb-2 pb-2 border-b border-secondary/20">Agent Logistics</h2>
             <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Verified ID Number</label>
              <input type="text" value={formData.idNumber} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed opacity-70" />
            </div>
          </div>
        )}

        {/* Business Verification */}
        <div className="card p-5 space-y-4 border-primary/20 bg-primary/5">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-primary/10">
            <h2 className="text-sm font-semibold text-primary">Business Verification (B2B)</h2>
            {profile?.isVerified ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-xs font-semibold uppercase">Verified ✓</span>
            ) : formData.nemaLicense ? (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold uppercase animate-pulse">Pending Review</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-xs font-semibold uppercase">Not Submitted</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Business Type</label>
              <select 
                value={formData.businessType} 
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 text-base focus:ring-primary/50"
              >
                <option value="">Select Type</option>
                <option value="weaver">Informal Weaver</option>
                <option value="recycler">Recycling Firm</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="retailer">Retailer / Importer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                NEMA License 
                {formData.nemaLicense && formData.nemaLicense.length > 0 && (
                  !formData.nemaLicense.toUpperCase().startsWith('NEMA/') ? (
                    <span className="text-red-500 lowercase text-xs ml-2">(Must start with NEMA/)</span>
                  ) : formData.nemaLicense.length < 10 ? (
                    <span className="text-orange-500 lowercase text-xs ml-2">(Too short)</span>
                  ) : (
                    <span className="text-emerald-500 lowercase text-xs ml-2">(Format Valid)</span>
                  )
                )}
              </label>
              <input 
                type="text" 
                value={formData.nemaLicense} 
                onChange={(e) => setFormData({...formData, nemaLicense: e.target.value.toUpperCase()})} 
                placeholder="NEMA/WML/..." 
                className={`w-full px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl text-slate-900 dark:text-white text-sm focus:ring-2 text-base transition-all ${
                  formData.nemaLicense && (!formData.nemaLicense.startsWith('NEMA/') || formData.nemaLicense.length < 10)
                    ? 'border-red-300 focus:ring-red-500/50' 
                    : 'border-slate-200 dark:border-slate-800 focus:ring-primary/50'
                }`} 
              />
            </div>
          </div>

          {/* Role-Specific Specializations */}
          {formData.businessType && (
            <div className="pt-4 border-t border-primary/10">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider text-primary">
                {getBusinessLabel(formData.businessType, 'role')} Focus Areas (Smart Match)
              </label>
              <div className="flex flex-wrap gap-2">
                {['Plastics', 'Metals', 'Paper & Cardboard', 'Glass', 'E-Waste'].map(spec => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() => {
                      const current = formData.specializations || [];
                      const next = current.includes(spec) 
                        ? current.filter(s => s !== spec) 
                        : [...current, spec];
                      setFormData(prev => ({ ...prev, specializations: next }));
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      formData.specializations?.includes(spec)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed italic">
            Once submitted, our compliance team will verify your documents to award you the **Verified badge** for the marketplace.
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || (formData.nemaLicense && (!formData.nemaLicense.startsWith('NEMA/') || formData.nemaLicense.length < 10))}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
        </button>

      </form>
    </div>
  );
}
