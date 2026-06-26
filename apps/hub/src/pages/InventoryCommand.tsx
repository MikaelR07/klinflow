import React from 'react';
import { 
  Warehouse, 
  Search, 
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Layers,
  Box
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function InventoryCommand() {
  const { isDarkMode } = useThemeStore();

  const inventoryData = [
    { material: 'PET Clear (Raw)', category: 'Plastics', volume: '42.5', unit: 'Tons', trend: '+5.2%', status: 'Optimal' },
    { material: 'PET Flakes (Processed)', category: 'Plastics', volume: '18.2', unit: 'Tons', trend: '-2.1%', status: 'Low Stock' },
    { material: 'HDPE Rigid', category: 'Plastics', volume: '55.0', unit: 'Tons', trend: '+12.4%', status: 'Overstock' },
    { material: 'Cardboard (OCC)', category: 'Paper', volume: '110.5', unit: 'Tons', trend: '+1.5%', status: 'Optimal' },
    { material: 'Aluminium Cans', category: 'Metals', volume: '8.4', unit: 'Tons', trend: '-0.5%', status: 'Optimal' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Inventory Command Center</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Centralized tracking for raw materials, WIP, and finished goods.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-64 ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            <Search className="font-medium w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search inventory..." className="font-medium bg-transparent border-none text-sm focus:ring-0 w-full outline-none dark:text-white" />
          </div>
        </div>
      </div>

      {/* Top Aggregates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className={`p-6 rounded-3xl border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-white/5">
               <Layers className="font-medium w-6 h-6 text-slate-500" />
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Raw Materials</p>
               <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>245.8 <span className="text-lg text-slate-400">Tons</span></p>
            </div>
         </div>
         <div className={`p-6 rounded-3xl border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
               <Package className="font-medium w-6 h-6 text-amber-500" />
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Work In Progress</p>
               <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>42.1 <span className="text-lg text-slate-400">Tons</span></p>
            </div>
         </div>
         <div className={`p-6 rounded-3xl border flex items-center gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
               <Box className="font-medium w-6 h-6 text-emerald-500" />
            </div>
            <div>
               <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Finished Goods</p>
               <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>128.5 <span className="text-lg text-slate-400">Tons</span></p>
            </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Material Table */}
        <div className="lg:col-span-8 space-y-6">
           <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                 <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Detailed Stock Ledger</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="font-medium w-full text-left text-sm">
                  <thead className={`text-xs uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                    <tr>
                      <th className="px-6 py-4">Material</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Volume</th>
                      <th className="px-6 py-4">Weekly Trend</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {inventoryData.map((item, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors`}>
                        <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.material}</td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.category}</td>
                        <td className={`px-6 py-4 font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.volume} {item.unit}</td>
                        <td className="px-6 py-4">
                           <span className={`text-xs font-medium flex items-center gap-1 ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {item.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              {item.trend}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                             item.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                             item.status === 'Low Stock' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                             'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                           }`}>
                             {item.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right Column: Visualizations */}
        <div className="lg:col-span-4 space-y-6">
           
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Stockpile Visualization</h3>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Plastics (All Types)</span>
                       <span className="font-medium text-emerald-500">55%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[55%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Paper & Cardboard</span>
                       <span className="font-medium text-amber-500">35%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-amber-500 w-[35%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Metals</span>
                       <span className="text-indigo-500">10%</span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[10%]" />
                    </div>
                 </div>
              </div>
           </div>

           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Capacity Alerts</h3>
              <div className="space-y-3">
                 <div className={`p-4 rounded-xl border border-rose-500/20 bg-rose-500/5`}>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-1">Raw PET Capacity at 95%</p>
                    <p className="font-medium text-xs text-rose-600/80 dark:text-rose-400/80">Intake bay 1 is nearing maximum raw material storage limits. Expedite processing to clear space.</p>
                 </div>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
