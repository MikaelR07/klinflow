import React from 'react';
import { 
  Leaf, 
  Droplets, 
  Wind,
  TreePine,
  Download
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function ESGImpact() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>ESG & Carbon Impact</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Measure the environmental equivalents of your recycling operations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 font-medium text-sm rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
            <Download className="w-4 h-4" /> Download ESG Report
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         
         <div className={`p-8 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-teal-900/40 via-slate-900 to-slate-900 border-white/5' : 'from-teal-900 via-teal-800 to-teal-900 border-teal-900 text-white'} md:col-span-2 flex flex-col justify-between`}>
            <div className="flex items-center gap-3 mb-8">
               <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <Wind className="font-medium w-6 h-6 text-white" />
               </div>
               <div>
                  <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-teal-300' : 'text-teal-200'}`}>Carbon Offset</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-teal-300'}`}>CO2e Avoided (YTD)</p>
               </div>
            </div>
            <div>
               <h2 className={`text-5xl md:text-7xl font-semibold tracking-tighter ${isDarkMode ? 'text-white' : 'text-white'}`}>
                 14,520 <span className="font-medium text-3xl text-white/50">tCO2e</span>
               </h2>
               <p className={`text-sm mt-4 font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-200'}`}>Equivalent to removing 3,140 cars from the road for a year.</p>
            </div>
         </div>

         <div className={`p-8 rounded-3xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Droplets className="font-medium w-5 h-5 text-blue-500" />
               </div>
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Water Saved</p>
               <h2 className={`text-3xl md:text-4xl font-semibold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 2.4M <span className="font-medium text-xl text-slate-400">Liters</span>
               </h2>
            </div>
         </div>

         <div className={`p-8 rounded-3xl border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <TreePine className="font-medium w-5 h-5 text-emerald-500" />
               </div>
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Trees Saved</p>
               <h2 className={`text-3xl md:text-4xl font-semibold tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 84,200
               </h2>
            </div>
         </div>

      </div>

      <div className="grid lg:grid-cols-2 gap-6">
         
         <div className={`p-6 rounded-3xl border h-96 flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Carbon Offset Trajectory</h3>
            <div className="flex-1 relative border-b border-l border-slate-200 dark:border-white/10 flex items-end px-2">
               {/* Decorative Chart */}
               <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,90 Q20,80 40,60 T70,40 T100,10" fill="none" stroke="currentColor" strokeWidth="3" className="text-teal-500" />
               </svg>
            </div>
         </div>

         <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Material Impact Breakdown</h3>
            <div className="space-y-6">
               <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                     <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>PET Recycling (Avoided Emissions)</span>
                     <span className="text-teal-500">8,420 tCO2e</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                     <div className="h-full bg-teal-500 w-[60%]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                     <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Paper/Cardboard (Avoided Deforestation)</span>
                     <span className="font-medium text-emerald-500">4,100 tCO2e</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[30%]" />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                     <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Aluminium (Energy Saved)</span>
                     <span className="font-medium text-amber-500">2,000 tCO2e</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                     <div className="h-full bg-amber-500 w-[10%]" />
                  </div>
               </div>
            </div>
         </div>

      </div>
    </div>
  );
}
