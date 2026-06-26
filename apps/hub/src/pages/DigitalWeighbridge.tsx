import React, { useState } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function DigitalWeighbridge() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('live');

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Digital Weighbridge</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live scale integration and material intake verification.</p>
        </div>
        <div className={`inline-flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
          <button onClick={() => setActiveTab('live')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'live' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Live Scale</button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Transaction History</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Scale Display */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className={`p-8 rounded-3xl border flex flex-col items-center justify-center relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-900 border-slate-800'}`}>
             <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)]" style={{ backgroundSize: '24px 24px' }} />
             <div className="relative z-10 text-center">
                <p className="text-emerald-400 font-medium tracking-widest uppercase text-sm mb-2 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Scale: Bay 1
                </p>
                <div className="font-mono text-7xl md:text-9xl text-white font-medium tracking-tighter">
                  14,520<span className="font-medium text-3xl md:text-5xl text-slate-400 ml-2">KG</span>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                   <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center backdrop-blur-md">
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Tare Weight</p>
                      <p className="font-medium text-white font-mono text-xl">4,200 KG</p>
                   </div>
                   <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-center backdrop-blur-md">
                      <p className="text-emerald-400 text-xs font-medium uppercase tracking-wider mb-1">Net Material</p>
                      <p className="font-medium text-white font-mono text-xl">10,320 KG</p>
                   </div>
                </div>
             </div>
          </div>

          {/* Camera Verification Panel */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
             <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Camera Verification</h3>
                <span className="px-2 py-1 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium uppercase">AI Validated</span>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-950 flex items-center justify-center border border-slate-300 dark:border-white/10 relative overflow-hidden group">
                   <Camera className="font-medium w-6 h-6 text-slate-400" />
                   <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white font-medium">Front License Plate</p>
                   </div>
                </div>
                <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-950 flex items-center justify-center border border-slate-300 dark:border-white/10 relative overflow-hidden">
                   <Camera className="font-medium w-6 h-6 text-slate-400" />
                   <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white font-medium">Top Load View</p>
                   </div>
                </div>
                <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-950 flex items-center justify-center border border-slate-300 dark:border-white/10 relative overflow-hidden">
                   <Camera className="font-medium w-6 h-6 text-slate-400" />
                   <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white font-medium">Side Profile</p>
                   </div>
                </div>
                <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-950 flex items-center justify-center border border-slate-300 dark:border-white/10 relative overflow-hidden">
                   <Camera className="font-medium w-6 h-6 text-slate-400" />
                   <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-[10px] text-white font-medium">Rear Scale Cam</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Workflow & Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Active Transaction</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                 <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Supplier</p>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">EK</div>
                    <div>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Eco-Klect Logistics</p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tier: Gold Partner</p>
                    </div>
                 </div>
              </div>
              <hr className={isDarkMode ? 'border-white/5' : 'border-slate-100'} />
              <div>
                 <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Vehicle & Material</p>
                 <div className="flex items-center gap-2">
                    <Truck className="font-medium w-4 h-4 text-slate-400" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KDA 442G</span>
                 </div>
                 <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Expected: Mixed PET Bottles</p>
              </div>
            </div>

            <div className="space-y-3">
               <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                 <CheckCircle2 className="w-5 h-5" /> Accept Weight
               </button>
               <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl font-medium transition-colors border border-amber-500/20">
                 <AlertCircle className="w-5 h-5" /> Flag for Manual QC
               </button>
               <button className="w-full flex items-center justify-center gap-2 py-3 px-4 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl font-medium transition-colors">
                 <XCircle className="w-5 h-5" /> Reject Load
               </button>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Transactions Table */}
      <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
          <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Recent Weighbridge Tickets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="font-medium w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-4">Ticket</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Vehicle</th>
                <th className="px-6 py-4">Net Weight</th>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {[1, 2, 3].map((_, i) => (
                <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                  <td className="px-6 py-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">#TK-402{i}</td>
                  <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Acme Recycling Ltd</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>KCE 11{i}X</td>
                  <td className={`px-6 py-4 font-mono font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>8,420 KG</td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>HDPE Cans</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">Approved</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
