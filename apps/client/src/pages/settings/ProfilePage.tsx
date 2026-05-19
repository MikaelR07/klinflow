import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Camera, BadgeCheck, ArrowRight } from 'lucide-react';
import { useAuthStore, ROLES } from '@klinflow/core';
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
    <div className="animate-slide-up pb-20 px-2">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">My Profile</h1>
      </header>

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

      {/* Professional Identity Card */}
      {isSeller && (
        <div 
          onClick={() => navigate('/circular-resume')}
          className="mb-8 p-5 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-emerald-950 dark:to-slate-900 rounded-[2rem] border border-slate-800 dark:border-emerald-900/30 shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/20 transition-colors" />
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                <BadgeCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tight leading-none mb-1">Circular Resume</h3>
                <p className="text-[9px] font-bold text-emerald-400/80 uppercase tracking-widest italic">View Professional Credentials</p>
              </div>
            </div>
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

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
            <input type="tel" value={formData.phone} disabled className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-500 text-sm cursor-not-allowed opacity-70" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Email (Optional)</label>
            <input type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})} placeholder="you@example.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:ring-2 text-base focus:ring-primary/50 text-sm" />
          </div>
        </div>

        {/* High-Precision Location Picker */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">Operational Location</h2>
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
          />
          <p className="text-xs text-slate-400 mt-2 italic leading-relaxed">
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
  );
}
