import React, { useState } from 'react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';
import { 
  User, Mail, Phone, MapPin, Briefcase, Camera, Save, X, Loader2
} from 'lucide-react';

export default function ProfileSettings() {
  const { profile } = useAuthStore() as any;
  
  const [formData, setFormData] = useState({
    firstName: profile?.name?.split(' ')[0] || 'John',
    lastName: profile?.name?.split(' ')[1] || 'Doe',
    email: profile?.email || 'john.doe@klinflow.com',
    phone: profile?.phone || '+254 712 345 678',
    department: 'Operations',
    hub: 'Nairobi Central Hub'
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!profile?.id) return toast.error("Session Error: Please log in again");
    setIsSaving(true);
    try {
      const payload = {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').update(payload as any).eq('id', profile.id);
      if (error) throw error;
      
      toast.success("Settings Saved");
      const { fetchProfile } = useAuthStore.getState() as any;
      if(fetchProfile) await fetchProfile();
    } catch (err: any) {
      toast.error(`Save Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const roleDisplay = profile?.role 
    ? profile.role.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
    : 'System User';

  return (
    <>
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
        <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Profile</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Manage your personal identity and basic information.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-500 hover:text-[#131722] dark:hover:text-white transition-colors flex items-center gap-2">
              <X className="w-4 h-4" /> Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Changes
            </button>
          </div>
        </div>

        {/* Main Layout Grid */}
        <div className="flex flex-col md:flex-row gap-6 relative items-start">
          
          {/* Left Column: Profile Card */}
          <div className="w-full md:w-80 shrink-0">
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-[1.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20"></div>
              
              <div className="relative group mb-4 mt-8">
                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 border-4 border-white dark:border-slate-800 overflow-hidden flex items-center justify-center shadow-xl">
                  {(profile as any)?.avatar_url ? (
                    <img src={(profile as any).avatar_url as string} alt={profile?.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-lg hover:scale-110 transition-transform">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-[#131722] dark:text-white leading-tight">{formData.firstName} {formData.lastName}</h2>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">{roleDisplay}</p>
              
              <div className="mt-6 flex flex-col gap-3 w-full text-left">
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Department</p>
                    <p className="text-xs font-bold text-[#131722] dark:text-white">{formData.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Location</p>
                    <p className="text-xs font-bold text-[#131722] dark:text-white">{formData.hub}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Personal Information */}
          <div className="flex-1 w-full">
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Personal Information</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Update your identity and contact details.</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">First Name</label>
                  <input 
                    type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Name</label>
                  <input 
                    type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" name="email" value={formData.email} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
    </>
  );
}
