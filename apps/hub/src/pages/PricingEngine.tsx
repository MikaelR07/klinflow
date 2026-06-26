import React from 'react';
import { 
  LineChart, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function PricingEngine() {
  const { isDarkMode } = useThemeStore();

  const materials = [
    { name: 'PET Bottles (Clear)', price: '45.00', trend: '+2.5', up: true, category: 'Plastics' },
    { name: 'HDPE (Rigid)', price: '52.00', trend: '+1.2', up: true, category: 'Plastics' },
    { name: 'LDPE (Film)', price: '18.50', trend: '-0.5', up: false, category: 'Plastics' },
    { name: 'PP (Woven Bags)', price: '22.00', trend: '+0.0', up: true, category: 'Plastics' },
    { name: 'Paper (Mixed)', price: '12.00', trend: '-1.0', up: false, category: 'Paper' },
    { name: 'Cardboard (OCC)', price: '15.50', trend: '+3.5', up: true, category: 'Paper' },
    { name: 'Aluminium Cans', price: '145.00', trend: '+5.0', up: true, category: 'Metals' },
    { name: 'Steel / Light Scrap', price: '35.00', trend: '-2.0', up: false, category: 'Metals' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dynamic Pricing Engine</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Real-time commodity market prices and predictive forecasting.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Market Price Dashboard */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Market Prices Grid */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live National Prices (KES / KG)</h2>
                 <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Market Data
                 </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 {materials.map((mat, i) => (
                   <div key={i} className={`p-4 rounded-2xl border transition-all cursor-pointer ${isDarkMode ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}>
                      <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{mat.category}</p>
                      <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mat.name}</p>
                      
                      <div className="flex items-end justify-between">
                         <p className={`text-2xl font-medium tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{mat.price}</p>
                         <div className={`flex items-center gap-1 text-xs font-medium ${mat.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {mat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {mat.trend}%
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Price Trend Chart Placeholder */}
           <div className={`p-6 rounded-3xl border h-96 flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>30-Day Trend: PET Clear</h2>
                 <div className="flex gap-2">
                    <button className={`px-3 py-1 text-xs font-medium rounded-lg ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'}`}>1M</button>
                    <button className={`px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white`}>3M</button>
                    <button className={`px-3 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white`}>1Y</button>
                 </div>
              </div>
              <div className="flex-1 relative border-b border-l border-slate-200 dark:border-white/10 flex items-end">
                 {/* Decorative CSS Chart */}
                 <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path d="M0,80 Q25,90 50,60 T100,20 L100,100 L0,100 Z" fill="currentColor" className="font-medium text-emerald-500/10 dark:text-emerald-500/5" />
                    <path d="M0,80 Q25,90 50,60 T100,20" fill="none" stroke="currentColor" strokeWidth="2" className="font-medium text-emerald-500" />
                 </svg>
              </div>
           </div>

        </div>

        {/* Right Column: Regional Prices & Forecast */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Regional Prices */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <MapPin className="w-5 h-5 text-indigo-500" />
                 Regional Variances (PET)
              </h3>
              <div className="space-y-3">
                 <div className={`p-4 rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <div>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Nairobi</p>
                       <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Base Rate</p>
                    </div>
                    <p className={`text-lg font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KES 45.00</p>
                 </div>
                 <div className={`p-4 rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <div>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Mombasa</p>
                       <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>+ Export Premium</p>
                    </div>
                    <p className={`text-lg font-medium font-mono text-emerald-500`}>KES 48.50</p>
                 </div>
                 <div className={`p-4 rounded-xl flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <div>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Kisumu</p>
                       <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>- Logistics Deduct</p>
                    </div>
                    <p className={`text-lg font-medium font-mono text-rose-500`}>KES 41.00</p>
                 </div>
              </div>
           </div>

           {/* Forecast Panel */}
           <div className={`p-6 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/40 to-slate-900 border-indigo-500/20' : 'from-indigo-50 to-white border-indigo-100'}`}>
              <h3 className={`font-semibold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>
                 <TrendingUp className="w-5 h-5 text-indigo-500" />
                 AI Price Forecast
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-indigo-200/70' : 'text-indigo-600/70'}`}>Predicted market movement over the next 14 days based on export demands.</p>
              
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>PET Clear</span>
                       <span className="font-medium text-emerald-500">Expected to Rise (+5%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-indigo-500/20 overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[70%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>Cardboard</span>
                       <span className="font-medium text-slate-500">Stable</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-indigo-500/20 overflow-hidden">
                       <div className="h-full bg-slate-400 w-[40%]" />
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                       <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>LDPE</span>
                       <span className="font-medium text-rose-500">Expected to Fall (-2%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-indigo-500/20 overflow-hidden">
                       <div className="h-full bg-rose-500 w-[20%]" />
                    </div>
                 </div>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
