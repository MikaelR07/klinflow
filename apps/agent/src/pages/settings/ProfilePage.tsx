import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save, Camera, Target, User, Phone, Mail, ShieldCheck, MapPin, Sparkles } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { ROLES } from '@klinflow/constants';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
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

  const handleFileChange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success('Photo Uploaded', { description: 'Your professional photo has been updated.' });
    } catch (err: any) {
      toast.error('Upload Failed', { description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: any) => {
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
    <div className="bg-[#F8F9FC] dark:bg-surface-950 transition-colors text-slate-900 dark:text-white pb-12">
      {/* Fixed Top Header */}
      {!isCompanyAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3.5 px-4 border-b border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/settings')} 
                className="p-2.5 bg-slate-100 dark:bg-surface-800 rounded-xl hover:bg-slate-200 dark:hover:bg-surface-700 active:scale-95 transition-all text-slate-700 dark:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-0.5">My Profile</h1>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">Personal & Operational Details</p>
              </div>
            </div>
            <button
              type="submit"
              form="profile-form"
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-70 shadow-md shadow-emerald-600/20"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        </div>
      )}

      <div className={`w-full max-w-xl mx-auto px-1.5 ${isCompanyAdmin ? 'pt-6' : 'pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]'} space-y-2`}>

        {/* Hero Profile Photo Card */}
        <div className="bg-white dark:bg-surface-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-xs flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-blue-500/20" />
          
          <div className="relative z-10 mb-3 mt-2">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-surface-900 shadow-lg overflow-hidden bg-slate-100 dark:bg-surface-950 flex items-center justify-center text-4xl relative">
              {profile?.avatarUrl ? (
                <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 200 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
              ) : (
                profile?.avatar || '👤'
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-1 right-1 p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-lg cursor-pointer active:scale-90 transition-all border-2 border-white dark:border-surface-900">
              <Camera className="w-4 h-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            </label>
          </div>

          <div className="text-center z-10">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{profile?.name || 'Agent User'}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isAgent ? 'Field Collection Agent' : 'Company Administrator'}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-2">Tap camera icon to change profile photo</p>
          </div>
        </div>

        {/* Profile Form */}
        <form id="profile-form" onSubmit={handleSave} className="space-y-6">

          {/* Basic Information Card */}
          <div className="bg-white dark:bg-surface-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-500" /> Basic Information
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Credentials</span>
            </div>

            {/* SIDE BY SIDE: Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-500" /> Full Name
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all" 
                  required 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-blue-500" /> Phone Number
                  </span>
                  <span className="text-[9px] text-slate-400 font-bold lowercase">(read-only)</span>
                </label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  disabled 
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-surface-950/60 border border-slate-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed font-medium" 
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-purple-500" /> Email Address
                </span>
                <span className="text-[9px] text-slate-400 font-bold lowercase">(optional)</span>
              </label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="you@example.com" 
                className="w-full px-4 py-3 bg-slate-50 dark:bg-surface-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-medium text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all" 
              />
            </div>
          </div>

          {/* Active Application Location Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Primary Location Area
              </label>
              {formData.location?.accuracy && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-500/20">
                  <Target className="w-3 h-3" /> ±{Math.round(formData.location.accuracy)}m Precision
                </span>
              )}
            </div>

            {/* LocationSelector Container (Full Original Size) */}
            <div className="bg-white dark:bg-surface-900 p-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xs relative z-0">
              <LocationSelector
                value={formData.location}
                onChange={(newLoc) => setFormData(prev => ({ ...prev, location: newLoc }))}
                hideHeaderText={true}
                hideFooterText={true}
              />
            </div>

            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-1 text-center">
              GPS location pin determines your primary dispatch zone and active operational harvesting region.
            </p>
          </div>



          {isCompanyAdmin && (
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70 mt-6"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile Changes
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
