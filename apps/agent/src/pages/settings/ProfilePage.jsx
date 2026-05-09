import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Camera } from 'lucide-react';
import { useAuthStore, ROLES, getThumbnailUrl } from '@cleanflow/core';
import { toast } from 'sonner';
import LocationSelector from '@cleanflow/ui/components/LocationSelector';

export default function ProfilePage() {
  const { profile, role, updateProfile, uploadAvatar } = useAuthStore();
  const navigate = useNavigate();
  const isAgent = role === ROLES.AGENT;

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
    <div className="animate-slide-up pb-20">
      <header className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/settings')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold dark:text-white">My Profile</h1>
      </header>

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
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-3">Professional Photo</p>
      </div>

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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
        </button>

      </form>
    </div>
  );
}
