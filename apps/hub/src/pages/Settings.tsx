import React, { useState } from 'react';
import { 
  Settings as SettingsIcon,
  User, 
  Building2, 
  Bell, 
  ShieldCheck,
  CreditCard,
  Globe,
  Smartphone
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';

export default function Settings() {
  const { isDarkMode } = useThemeStore();
  const { profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'facility', label: 'Facility Configuration', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & Roles', icon: ShieldCheck },
    { id: 'billing', label: 'Billing & Subscriptions', icon: CreditCard },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1200px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hub Configuration</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage your account, facility parameters, and security settings.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
           {tabs.map((tab) => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                 activeTab === tab.id 
                   ? (isDarkMode ? 'bg-slate-800 text-emerald-400 shadow-sm border border-white/5' : 'bg-white text-emerald-600 shadow-sm border border-slate-200')
                   : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-900/50 border border-transparent' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent')
               }`}
             >
                <tab.icon className="w-5 h-5" /> {tab.label}
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className={`lg:col-span-9 rounded-3xl border p-6 md:p-8 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
           
           {activeTab === 'profile' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className={`font-semibold text-lg mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>My Profile</h2>
                
                <div className="flex items-center gap-6">
                   <div className="w-24 h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-medium text-3xl text-emerald-600 dark:text-emerald-400">
                      {profile?.name ? profile.name.charAt(0) : 'E'}
                   </div>
                   <div className="space-y-2">
                      <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-sm font-medium rounded-xl transition-colors">
                         Upload New Avatar
                      </button>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recommended size: 256x256px (JPG, PNG)</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <input type="text" defaultValue={profile?.name || 'Executive Admin'} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
                   </div>
                   <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                      <input type="email" defaultValue={profile?.email || 'admin@klinflow.com'} className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-400 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed'}`} disabled />
                   </div>
                   <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                      <input type="tel" defaultValue="+254 700 000000" className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
                   </div>
                   <div className="space-y-2">
                      <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Role</label>
                      <input type="text" defaultValue="Head of Operations" className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'}`} />
                   </div>
                </div>

                <div className="pt-6 border-t dark:border-white/5">
                   <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-colors">
                      Save Changes
                   </button>
                </div>
             </div>
           )}

           {activeTab === 'facility' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className={`font-semibold text-lg mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Facility Configuration</h2>
                
                <div className="space-y-6">
                   <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                         <Globe className="w-5 h-5 text-indigo-500" />
                         <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Active Location</h3>
                      </div>
                      <select className={`w-full p-3 rounded-xl border text-sm font-medium outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}>
                         <option>Nairobi HQ</option>
                         <option>Mombasa Export Hub</option>
                         <option>Thika Processing Plant</option>
                      </select>
                   </div>

                   <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center gap-3 mb-4">
                         <SettingsIcon className="w-5 h-5 text-indigo-500" />
                         <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>System Parameters</h3>
                      </div>
                      <div className="space-y-4">
                         <div className="flex items-center justify-between">
                            <div>
                               <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Auto-approve Weighbridge Tickets</p>
                               <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Automatically approve tickets under 1.5 Tons.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" defaultChecked />
                               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                            </label>
                         </div>
                         <div className="flex items-center justify-between">
                            <div>
                               <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Night Shift Mode</p>
                               <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Silence non-critical alerts between 10PM and 6AM.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input type="checkbox" className="sr-only peer" />
                               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                            </label>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t dark:border-white/5">
                   <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
                      Save Facility Settings
                   </button>
                </div>
             </div>
           )}

           {(activeTab === 'notifications' || activeTab === 'security' || activeTab === 'billing') && (
             <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-300">
                <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                   <SettingsIcon className={`w-8 h-8 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                </div>
                <h3 className={`font-semibold text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Under Construction</h3>
                <p className={`text-sm max-w-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>This settings module is being built out in a future update.</p>
             </div>
           )}

        </div>

      </div>
    </div>
  );
}
