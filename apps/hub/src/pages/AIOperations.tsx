import React from 'react';
import { 
  BrainCircuit, 
  AlertTriangle, 
  Settings, 
  CheckCircle2,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function AIOperations() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Operations Center</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Predictive maintenance, automated decision engines, and system health.</p>
        </div>
        <div className="flex items-center gap-3">
           <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-medium flex items-center gap-2 border border-indigo-500/20">
             <BrainCircuit className="w-4 h-4 animate-pulse" /> AI Copilot Active
           </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Predictive Maintenance */}
        <div className="lg:col-span-8 space-y-6">
           
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h2 className={`font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <Settings className="font-medium w-5 h-5 text-slate-500" />
                 Predictive Equipment Maintenance
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                 
                 {/* High Risk Asset */}
                 <div className={`p-5 rounded-2xl border border-rose-500/30 bg-rose-500/5`}>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-rose-600 dark:text-rose-400">Main Granulator (Line 1)</h3>
                       <AlertTriangle className="font-medium w-5 h-5 text-rose-500" />
                    </div>
                    <div className="space-y-3 mb-4">
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1 text-slate-500">
                             <span>Blade Wear</span>
                             <span className="font-medium text-rose-500">89%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-rose-500/20 overflow-hidden">
                             <div className="h-full bg-rose-500 w-[89%]" />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1 text-slate-500">
                             <span>Motor Temperature</span>
                             <span className="font-medium text-amber-500">82°C</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-rose-500/20 overflow-hidden">
                             <div className="h-full bg-amber-500 w-[75%]" />
                          </div>
                       </div>
                    </div>
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 p-2 rounded">
                       AI Prediction: 85% probability of failure within 48 hours. Recommend immediate blade replacement.
                    </p>
                 </div>

                 {/* Low Risk Asset */}
                 <div className={`p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5`}>
                    <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-emerald-600 dark:text-emerald-400">Hot Wash System (Line 2)</h3>
                       <CheckCircle2 className="font-medium w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="space-y-3 mb-4">
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1 text-slate-500">
                             <span>Pump Efficiency</span>
                             <span className="font-medium text-emerald-500">95%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-emerald-500/20 overflow-hidden">
                             <div className="h-full bg-emerald-500 w-[95%]" />
                          </div>
                       </div>
                       <div>
                          <div className="flex justify-between text-xs font-medium mb-1 text-slate-500">
                             <span>Filter Status</span>
                             <span className="font-medium text-emerald-500">Clean</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-emerald-500/20 overflow-hidden">
                             <div className="h-full bg-emerald-500 w-[10%]" />
                          </div>
                       </div>
                    </div>
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded">
                       AI Prediction: System operating optimally. Next scheduled maintenance in 14 days.
                    </p>
                 </div>

              </div>
           </div>

           {/* Automated Supply Chain Decisions */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h2 className={`font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <TrendingUp className="w-5 h-5 text-indigo-500" />
                 Automated Market Actions
              </h2>
              
              <div className="overflow-x-auto">
                <table className="font-medium w-full text-left text-sm">
                  <thead className={`text-xs uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    <tr>
                      <th className="px-6 py-4">Trigger Event</th>
                      <th className="px-6 py-4">AI Analysis</th>
                      <th className="px-6 py-4">Automated Action Taken</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    <tr className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                      <td className="px-6 py-4 font-semibold text-slate-500">Market Price Drop (PET)</td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Export demand fell by 12% in EU.</td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                           Lowered supplier buying price by KES 2.00
                         </span>
                      </td>
                    </tr>
                    <tr className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                      <td className="px-6 py-4 font-semibold text-slate-500">Storage Capacity &gt; 90%</td>
                      <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Nairobi HQ raw intake bins full.</td>
                      <td className="px-6 py-4">
                         <span className="px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400">
                           Paused agent deliveries to HQ
                         </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
           </div>

        </div>

        {/* Right Column: AI Live Insights Feed */}
        <div className="lg:col-span-4 space-y-6">
           
           <div className={`p-6 rounded-3xl border h-full bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/40 to-slate-900 border-indigo-500/20' : 'from-indigo-50 to-white border-indigo-100'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
                 <Cpu className="w-5 h-5 text-indigo-500" />
                 Live AI Insights Stream
              </h3>
              
              <div className="space-y-4">
                 {[
                   { time: 'Just now', msg: 'Supplier "Kamau Logistics" is trending 15% lower on quality this week. Recommend temporary downgrade to Silver tier.' },
                   { time: '10 mins ago', msg: 'Processing Line 2 is consuming 8% more power than baseline. Probable filter clog detected.' },
                   { time: '1 hour ago', msg: 'New RFQ from Global Plastics perfectly matches our current Thika plant overstock. Drafted auto-response.' },
                 ].map((insight, i) => (
                   <div key={i} className={`p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-transparent dark:border-white/5`}>
                      <p className={`text-[10px] font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{insight.time}</p>
                      <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{insight.msg}</p>
                   </div>
                 ))}
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
