import React from 'react';
import { 
  Truck, 
  Map, 
  Clock, 
  AlertTriangle,
  Navigation,
  MapPin,
  MoreVertical
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function LogisticsTower() {
  const { isDarkMode } = useThemeStore();

  const fleets = [
    { id: 'KDA 123G', supplier: 'Kamau Logistics', origin: 'Mombasa Hub', status: 'En Route', eta: '45 mins', alert: false },
    { id: 'KCE 402X', supplier: 'Eco-Klect', origin: 'Industrial Area', status: 'Delayed', eta: '2 hrs 15 mins', alert: true },
    { id: 'KCG 992Y', supplier: 'Internal Fleet 04', origin: 'Thika Plant', status: 'Loading', eta: '--', alert: false },
    { id: 'KCQ 114Z', supplier: 'Jane Doe', origin: 'Kibera', status: 'En Route', eta: '12 mins', alert: false },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Logistics Control Tower</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Live fleet tracking, route optimization, and ETA management.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 h-[800px]">
        
        {/* Left Column: Live GPS Map Area */}
        <div className={`lg:col-span-8 rounded-3xl border overflow-hidden flex flex-col relative ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
           
           {/* Mock Map Background */}
           <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px, 100px 100px' }} />
           
           <div className={`absolute top-6 left-6 right-6 p-4 rounded-2xl flex items-center justify-between shadow-xl backdrop-blur-md border ${isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white/90 border-slate-200'}`}>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>24 Active Vehicles</span>
                 </div>
                 <div className="w-px h-6 bg-slate-300 dark:bg-white/20" />
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>3 Delayed</span>
                 </div>
              </div>
              <button className={`px-4 py-2 font-medium text-xs rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'}`}>
                <Navigation className="w-4 h-4" /> Dispatch Internal Fleet
              </button>
           </div>

           {/* Floating Map Pins */}
           <div className="absolute top-1/3 left-1/4 animate-bounce">
              <div className="relative">
                 <MapPin className="w-8 h-8 text-indigo-500 drop-shadow-lg" />
                 <div className="absolute -top-8 -left-4 w-24 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-lg border dark:border-white/10 text-center">
                    <p className="text-[10px] font-medium text-slate-900 dark:text-white">KDA 123G</p>
                 </div>
              </div>
           </div>

           <div className="absolute top-1/2 left-1/2 animate-bounce" style={{ animationDelay: '1s' }}>
              <div className="relative">
                 <MapPin className="font-medium w-8 h-8 text-emerald-500 drop-shadow-lg" />
                 <div className="absolute -top-8 -left-4 w-24 bg-white dark:bg-slate-900 p-2 rounded-lg shadow-lg border dark:border-white/10 text-center">
                    <p className="text-[10px] font-medium text-slate-900 dark:text-white">KCQ 114Z</p>
                 </div>
              </div>
           </div>

           <div className="absolute top-1/4 right-1/4">
              <div className="relative">
                 <MapPin className="font-medium w-8 h-8 text-rose-500 drop-shadow-lg" />
                 <div className="font-medium absolute -top-12 -left-8 w-32 bg-rose-500 text-white p-2 rounded-lg shadow-lg text-center">
                    <p className="text-[10px] font-medium">KCE 402X</p>
                    <p className="text-[8px] font-medium opacity-80 uppercase">Delayed - Traffic</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: Fleet Manifest */}
        <div className={`lg:col-span-4 rounded-3xl border flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
           <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Inbound Manifest</h2>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {fleets.map((fleet, i) => (
                 <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-3 ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Truck className="font-medium w-4 h-4 text-slate-400" />
                          <span className={`font-medium font-mono text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{fleet.id}</span>
                       </div>
                       <button className="font-medium p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"><MoreVertical className="font-medium w-4 h-4" /></button>
                    </div>
                    
                    <div>
                       <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{fleet.supplier}</p>
                       <p className={`text-[10px] uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>From: {fleet.origin}</p>
                    </div>

                    <div className={`mt-2 pt-3 border-t flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                       <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase ${
                         fleet.status === 'En Route' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                         fleet.status === 'Delayed' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                         'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                       }`}>
                         {fleet.status}
                       </span>
                       
                       <div className={`flex items-center gap-1 text-xs font-medium ${fleet.alert ? 'text-rose-500' : isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {fleet.alert ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          ETA: {fleet.eta}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
