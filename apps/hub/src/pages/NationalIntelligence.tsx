import React from 'react';
import { 
  MapPin, 
  BarChart3, 
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function NationalIntelligence() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>National Intelligence Center</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Macro-level mapping of supply density, competitor activity, and demographic yields.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 h-[800px]">
        
        {/* Left Column: Heatmap Area */}
        <div className={`lg:col-span-8 rounded-3xl border overflow-hidden flex flex-col relative ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
           
           <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
           
           <div className={`absolute top-6 left-6 right-6 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md border ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'}`}>
              <div className="flex items-center gap-6">
                 <button className={`text-sm font-medium pb-1 border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400`}>Material Density</button>
                 <button className={`text-sm font-medium pb-1 border-b-2 border-transparent ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Agent Coverage</button>
              </div>
           </div>

           {/* Heatmap Blobs */}
           <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-rose-500/30 rounded-full blur-3xl" />
           <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-emerald-500/30 rounded-full blur-2xl" />
           <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-indigo-500/30 rounded-full blur-xl" />

           {/* Interactive Pins */}
           <div className="absolute top-1/3 left-1/3 text-center">
              <MapPin className="font-medium w-6 h-6 text-rose-500 mx-auto" />
              <p className="text-[10px] font-medium text-slate-900 dark:text-white mt-1">High Contamination Zone</p>
           </div>
           
           <div className="absolute top-1/2 left-1/2 text-center">
              <MapPin className="font-medium w-6 h-6 text-emerald-500 mx-auto" />
              <p className="text-[10px] font-medium text-slate-900 dark:text-white mt-1">High Volume Yield (PET)</p>
           </div>

        </div>

        {/* Right Column: Analytics Sidebar */}
        <div className={`lg:col-span-4 space-y-6 flex flex-col`}>
           
           <div className={`p-6 rounded-3xl border flex-1 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <BarChart3 className="w-5 h-5 text-indigo-500" />
                 Regional Breakdown
              </h3>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Nairobi County</span>
                       <span className="font-medium text-emerald-500">65% of Total Yield</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[65%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Mombasa County</span>
                       <span className="text-indigo-500">22% of Total Yield</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[22%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Kiambu County</span>
                       <span className="font-medium text-amber-500">13% of Total Yield</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-amber-500 w-[13%]" />
                    </div>
                 </div>
              </div>
           </div>

           <div className={`p-6 rounded-3xl border flex-1 bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/40 to-slate-900 border-indigo-500/20' : 'from-indigo-50 to-white border-indigo-100'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
                 <TrendingUp className="w-5 h-5 text-indigo-500" />
                 Growth Opportunities
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600/70'}`}>AI detected underserved areas with high potential for recycling aggregation.</p>
              
              <div className="space-y-4">
                 <div className={`p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5`}>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Nakuru Town</p>
                    <p className="font-medium text-xs text-indigo-600/80 dark:text-indigo-400/80">High commercial activity but only 2 active Klinflow agents. Potential +15T/week yield.</p>
                 </div>
                 <div className={`p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5`}>
                    <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">Eldoret Hub</p>
                    <p className="font-medium text-xs text-indigo-600/80 dark:text-indigo-400/80">Growing university population. Suggest deploying 5 new smart-bins for PET collection.</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
