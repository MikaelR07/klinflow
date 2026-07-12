import React, { useState } from 'react';
import { Globe, MapPin, Briefcase } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';

export default function TimezoneRegions() {
  const { profile } = useAuthStore();
  const roleDisplay = profile?.agentAccountType?.replace(/_/g, ' ') || 'Hub Manager';
  
  const [formData, setFormData] = useState({
    hub: (profile as any)?.businessName || 'Central Hub (HQ)',
    department: 'Operations & Logistics',
    timezone: 'Africa/Lagos',
    language: 'English (US)'
  });

  return (
    <>
      <div className="flex h-full w-full relative bg-transparent overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-20">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            <div className="flex flex-col gap-1 pb-4">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Timezone & Regions</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Configure your regional settings and operational context.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Work & Regional Settings</h3>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Location (Hub)</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.hub}
                      onChange={e => setFormData({...formData, hub: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Department</label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      value={formData.department}
                      onChange={e => setFormData({...formData, department: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Timezone</label>
                  <select 
                    value={formData.timezone}
                    onChange={e => setFormData({...formData, timezone: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
                  >
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                    <option value="Africa/Johannesburg">South Africa Standard Time (SAST)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Language</label>
                  <select 
                    value={formData.language}
                    onChange={e => setFormData({...formData, language: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-bold text-[#131722] dark:text-white focus:border-emerald-500 outline-none transition-colors appearance-none"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="English (UK)">English (UK)</option>
                    <option value="French">Français</option>
                  </select>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
