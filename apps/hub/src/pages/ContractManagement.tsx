import React, { useState } from 'react';
import { 
  FileSignature, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  Building2,
  FileText
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function ContractManagement() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('active');

  const contracts = [
    { id: 'CTR-2026-001', buyer: 'Global Plastics Corp', item: 'PET Flakes (Clear)', volume: '500 Tons', fulfilled: 320, duration: 'Jan 2026 - Dec 2026', status: 'Active' },
    { id: 'CTR-2026-042', buyer: 'Nairobi Paper Mills', item: 'OCC Cardboard', volume: '1,200 Tons', fulfilled: 1050, duration: 'Mar 2026 - Aug 2026', status: 'Active' },
    { id: 'CTR-2026-084', buyer: 'EuroMetals Ltd', item: 'Aluminium UBCs', volume: '50 Tons', fulfilled: 50, duration: 'Jan 2026 - Mar 2026', status: 'Completed' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Contract Management</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage long-term buyer agreements and track fulfillment progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 font-medium text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <FileSignature className="w-4 h-4" /> Draft New Contract
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Contracts */}
        <div className="lg:col-span-8 space-y-6">
           
           <div className={`p-6 rounded-3xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex gap-8">
                 <div>
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Active Contracts</p>
                    <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>12</p>
                 </div>
                 <div>
                    <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Committed Volume</p>
                    <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>4,250 <span className="text-lg text-slate-500">Tons</span></p>
                 </div>
              </div>
              <div className="hidden md:block">
                 {/* Decorative graphic */}
                 <div className="flex -space-x-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={`w-12 h-12 rounded-full border-4 flex items-center justify-center bg-indigo-100 text-indigo-600 font-medium ${isDarkMode ? 'border-slate-900' : 'border-white'}`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                    ))}
                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center bg-slate-100 text-slate-500 font-medium text-xs ${isDarkMode ? 'border-slate-900' : 'border-white'}`}>
                      +9
                    </div>
                 </div>
              </div>
           </div>

           {/* Contract List */}
           <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className={`px-6 py-4 border-b flex items-center gap-6 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                 <button 
                   onClick={() => setActiveTab('active')}
                   className={`text-sm font-medium transition-colors ${activeTab === 'active' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                 >
                   Active Contracts
                 </button>
                 <button 
                   onClick={() => setActiveTab('completed')}
                   className={`text-sm font-medium transition-colors ${activeTab === 'completed' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                 >
                   Completed
                 </button>
              </div>
              <div className="p-6 space-y-4">
                 {contracts.filter(c => activeTab === 'active' ? c.status === 'Active' : c.status === 'Completed').map((contract, i) => {
                    const totalVolume = parseInt(contract.volume.replace(',', '').replace(' Tons', ''));
                    const percentFulfilled = Math.round((contract.fulfilled / totalVolume) * 100);
                    
                    return (
                      <div key={i} className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                               <p className={`font-mono font-medium text-sm text-indigo-500`}>{contract.id}</p>
                               <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                                 contract.status === 'Active' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                               }`}>
                                 {contract.status}
                               </span>
                            </div>
                            <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{contract.buyer}</h3>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{contract.item} • {contract.duration}</p>
                         </div>
                         
                         <div className="flex-1 md:max-w-[300px] w-full">
                            <div className="flex justify-between text-xs font-medium mb-2">
                               <span className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>Fulfillment Progress</span>
                               <span className={percentFulfilled === 100 ? 'text-emerald-500' : isDarkMode ? 'text-white' : 'text-slate-900'}>
                                 {percentFulfilled}%
                               </span>
                            </div>
                            <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden mb-2">
                               <div 
                                 className={`h-full ${percentFulfilled === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                 style={{ width: `${percentFulfilled}%` }} 
                               />
                            </div>
                            <p className={`text-xs font-medium text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                               {contract.fulfilled} / {contract.volume} Delivered
                            </p>
                         </div>

                         <div className="shrink-0 flex items-center justify-end">
                            <button className={`p-3 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                               <ArrowRight className="w-5 h-5" />
                            </button>
                         </div>
                      </div>
                    );
                 })}
              </div>
           </div>

        </div>

        {/* Right Column: Contract Intelligence */}
        <div className="lg:col-span-4 space-y-6">
           
           <div className={`p-6 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/40 to-slate-900 border-indigo-500/20' : 'from-indigo-50 to-white border-indigo-100'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
                 <FileText className="w-5 h-5 text-indigo-500" />
                 Fulfillment Intelligence
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600/70'}`}>AI analysis of current contract obligations versus actual inventory levels.</p>
              
              <div className="space-y-4">
                 <div className={`p-4 rounded-xl border border-rose-500/20 bg-rose-500/5`}>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">Risk Alert: Contract CTR-2026-001</p>
                    <p className="font-medium text-xs text-rose-600/80 dark:text-rose-400/80">Current processing output for PET Flakes is tracking 12% behind required schedule to meet Q4 delivery target for Global Plastics Corp.</p>
                 </div>
                 <div className={`p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5`}>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">On Track: Contract CTR-2026-042</p>
                    <p className="font-medium text-xs text-emerald-600/80 dark:text-emerald-400/80">Cardboard deliveries to Nairobi Paper Mills are tracking 5% ahead of schedule.</p>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
