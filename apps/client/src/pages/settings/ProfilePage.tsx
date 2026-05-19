import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Camera, BadgeCheck, ArrowRight, Target, Move } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { toast } from 'sonner';
import LocationSelector from '@klinflow/ui/components/LocationSelector';

export default function ProfilePage() {
  const { profile, role, updateProfile, uploadAvatar } = useAuthStore();
  const navigate = useNavigate();
  const isAgent = role === ROLES.AGENT;
  const isSeller = profile?.role === 'seller';

  const [formData, setFormData] = useState({
    name: profile?.fullName || profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    location: { estate: profile?.location?.estate || '', latitude: profile?.location?.latitude || 0, longitude: profile?.location?.longitude || 0 },
    idNumber: profile?.idNumber || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Photo Uploaded', { description: 'Your profile photo has been updated.' });
    } catch (err) {
      toast.error('Upload Failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-900 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-900 pt-[calc(env(safe-area-inset-top,1rem)+1.25rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/settings')} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white uppercase tracking-tighter leading-none mb-1">My Profile</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Personal Information</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] pb-24 px-1.5 space-y-6 max-w-lg mx-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-[6px] border-white dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
              {profile?.avatarUrl || profile?.avatar ? (
                <img 
                  src={profile.avatarUrl || profile.avatar || ''} 
                  alt="Profile" 
                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
                />
              ) : (
                <div className="text-4xl text-slate-300 dark:text-slate-700 font-black">
                  {(profile?.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <label className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg cursor-pointer hover:bg-primary-dark transition-all hover:scale-110 active:scale-90 border-4 border-white dark:border-slate-800 z-20">
              <Camera className="w-5 h-5" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 uppercase tracking-[0.2em] font-bold">Update Profile Photo</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Basic Details */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">Basic Information</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input type="text" value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Phone Number <span className="lowercase text-xs text-slate-400">(Read-only)</span></label>
              <input type="tel" value={formData.phone} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed opacity-70" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email (Optional)</label>
              <input type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
            </div>
          </div>

          {/* High-Precision Location Picker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">map Location</h2>
              {formData.location?.latitude ? (
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                  <Target className="w-3 h-3" /> Location Locked
                </span>
              ) : null}
            </div>
            
            <div className="card p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm relative z-0">
              <LocationSelector 
                value={formData.location} 
                onChange={(newLoc: any) => setFormData(prev => ({ 
                  ...prev, 
                  location: { 
                    estate: newLoc.estate || '', 
                    latitude: newLoc.latitude || 0, 
                    longitude: newLoc.longitude || 0 
                  } 
                }))} 
                hideHeaderText={true}
                hideFooterText={true}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-center mt-2 flex items-center justify-center gap-1.5 px-2">
              <Move className="w-3 h-3" /> Drag the pin to your exact pickup gate
            </p>
            <p className="text-xs text-slate-400 mt-2 italic leading-relaxed px-1">
              Klinflow uses your GPS pin for pinpoint accuracy. Agents will navigate directly to this marker for your waste collection.
            </p>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-[2rem] font-semibold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Update My Data
          </button>

        </form>
      </div>
    </div>
  );
}
