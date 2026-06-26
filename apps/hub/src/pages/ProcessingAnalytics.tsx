import React from 'react';
import { 
  Activity, 
  ArrowRight, 
  Settings, 
  AlertTriangle,
  Zap,
  TrendingUp,
  Droplets
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function ProcessingAnalytics() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Processing Analytics</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live throughput, line efficiency, and output yield tracking.</p>
        </div>
      </div>

      {/* Main Flow Diagram */}
      <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
         <h2 className={`font-semibold mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Material Flow: PET Line 1</h2>
         
         <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8 overflow-x-auto pb-4">
            
            {/* Step 1: Sorting */}
            <div className="flex flex-col items-center shrink-0 w-48">
               <div className={`w-full p-4 rounded-2xl border-2 border-indigo-500 bg-indigo-500/10 text-center relative`}>
                  <p className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">1. Auto-Sorting</p>
                  <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4.5 T/hr</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                     <Settings className="w-3 h-3 animate-spin" /> Running
                  </div>
               </div>
            </div>

            <ArrowRight className="font-medium w-8 h-8 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />

            {/* Step 2: Washing */}
            <div className="flex flex-col items-center shrink-0 w-48">
               <div className={`w-full p-4 rounded-2xl border-2 border-blue-500 bg-blue-500/10 text-center relative`}>
                  <p className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">2. Hot Wash</p>
                  <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4.2 T/hr</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                     <Droplets className="font-medium w-3 h-3 text-blue-500" /> 85°C Optimal
                  </div>
               </div>
               <div className="mt-2 text-center text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-1 rounded">
                  -0.3T (Contamination Loss)
               </div>
            </div>

            <ArrowRight className="font-medium w-8 h-8 text-slate-300 dark:text-slate-600 hidden md:block shrink-0" />

            {/* Step 3: Crushing */}
            <div className="flex flex-col items-center shrink-0 w-48">
               <div className={`w-full p-4 rounded-2xl border-2 border-amber-500 bg-amber-500/10 text-center relative`}>
                  <p className="text-xs font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">3. Granulation</p>
                  <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4.1 T/hr</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-amber-500">
                     <AlertTriangle className="w-3 h-3" /> Blade Temp High
                  </div>
               </div>
               <div className="mt-2 text-center text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-1 rounded">
                  -0.1T (Moisture Loss)
               </div>
            </div>

            <ArrowRight className="font-medium w-8 h-8 text-emerald-500 hidden md:block shrink-0" />

            {/* Step 4: Output */}
            <div className="flex flex-col items-center shrink-0 w-48">
               <div className={`w-full p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-500/10 text-center relative shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]`}>
                  <p className="text-xs font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">Net Output</p>
                  <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4.1 T/hr</p>
                  <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-emerald-500">
                     <TrendingUp className="w-3 h-3" /> 91% Yield Rate
                  </div>
               </div>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
         
         {/* Efficiency KPIs */}
         <div className={`p-6 rounded-3xl border grid grid-cols-2 gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><Zap className="w-4 h-4 text-amber-500" /> Power Consumption</p>
               <p className={`text-4xl font-medium tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>245 <span className="text-lg text-slate-500">kW/h</span></p>
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><Activity className="w-4 h-4 text-indigo-500" /> Overall Equipment Effectiveness</p>
               <p className={`text-4xl font-medium tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>88.4<span className="text-lg text-slate-500">%</span></p>
            </div>
            <div className="col-span-2 pt-6 border-t border-slate-100 dark:border-white/5">
               <div className="flex justify-between text-sm font-medium mb-2">
                  <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Target Output Today (35 Tons)</span>
                  <span className="font-medium text-emerald-500">22.4 Tons Produced (64%)</span>
               </div>
               <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[64%]" />
               </div>
            </div>
         </div>

         {/* Alert Log */}
         <div className={`p-6 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h2 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Production Alerts</h2>
            <div className="space-y-4 flex-1 overflow-y-auto">
               {[
                 { time: '10:42 AM', type: 'warning', msg: 'Granulator blade temperature exceeding 85°C.', line: 'Line 1' },
                 { time: '09:15 AM', type: 'info', msg: 'Scheduled maintenance complete. Wash line restarted.', line: 'Line 2' },
                 { time: '08:30 AM', type: 'critical', msg: 'Feedstock interruption. Conveyor belt C2 stalled.', line: 'Line 1' },
               ].map((alert, i) => (
                 <div key={i} className={`p-4 rounded-xl border flex gap-4 ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="pt-1">
                       {alert.type === 'warning' ? <AlertTriangle className="font-medium w-5 h-5 text-amber-500" /> :
                        alert.type === 'critical' ? <AlertTriangle className="font-medium w-5 h-5 text-rose-500" /> :
                        <Activity className="font-medium w-5 h-5 text-blue-500" />}
                    </div>
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                         <span className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{alert.time}</span>
                         <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>{alert.line}</span>
                       </div>
                       <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{alert.msg}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>

      </div>
    </div>
  );
}
