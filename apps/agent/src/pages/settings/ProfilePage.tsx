import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Camera, Target, Move } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function ProfilePage() {
  const { profile, role, updateProfile, uploadAvatar } = useAuthStore();
  const navigate = useNavigate();
  const isAgent = role === ROLES.AGENT;
  const isCompanyAdmin = profile?.agentAccountType === 'company_admin';

  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: profile?.location || null,
    idNumber: profile?.idNumber || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Photo Uploaded', { description: 'Your professional photo has been updated.' });
    } catch (err) {
      toast.error('Upload Failed', { description: err.message });
    } finally {
      setUploading(false);
    }
  };

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
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* Fixed Top Nav */}
      {!isCompanyAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
              <ArrowLeft className="w-4 h-4 dark:text-white" />
            </button>
            <div>
              <h1 className="text-[17px] font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none mb-1">My Profile</h1>
              <p className="text-[10px] font-bold text-primary capitalize tracking-[0.2em]">Personal Information</p>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full ${isCompanyAdmin ? 'pt-8' : 'pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)]'} pb-24 px-1.5 space-y-6 max-w-lg mx-auto`}>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">
            {profile?.avatar_url ? (
              <img src={getThumbnailUrl(profile.avatar_url, { width: 200 })} className="w-full h-full object-cover" />
            ) : (
              profile?.avatar || '👤'
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg cursor-pointer active:scale-90 transition-all">
            <Camera className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
          </label>
        </div>
        <p className="text-xs text-slate-500 font-medium mt-3">Professional Photo</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Basic Details */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">Basic Information</h2>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Phone Number <span className="text-slate-400 font-normal">(Read-only)</span></label>
            <input type="tel" value={formData.phone} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed opacity-70" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Email (Optional)</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
          </div>
        </div>

        {/* Active Application Location */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-black text-slate-400 dark:text-slate-555 capitalize tracking-[0.2em]">Location Area</label>
            {formData.location?.accuracy && (
              <span className="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full capitalize tracking-widest">
                <Target className="w-3 h-3" /> Precision {Math.round(formData.location.accuracy)}m
              </span>
            )}
          </div>
          
          <div className="card p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
            <LocationSelector 
              value={formData.location} 
              onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))} 
              hideHeaderText={true}
              hideFooterText={true}
            />
          </div>

          <p className="text-xs text-slate-400 mt-2 italic leading-relaxed px-1 text-center">
            Klinflow uses your GPS pin for pinpoint accuracy. This marker determines your primary routing dispatch and operational zone.
          </p>
        </div>

        {/* Agent Details */}
        {isAgent && (
          <div className="card p-5 space-y-4 bg-secondary/5 border-secondary/20">
             <h2 className="text-sm font-semibold text-secondary mb-2 pb-2 border-b border-secondary/20">Agent Logistics</h2>
             <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Verified ID Number</label>
              <input type="text" value={formData.idNumber} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed opacity-70" />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
        </button>

      </form>
      </div>
    </div>
  );
}
