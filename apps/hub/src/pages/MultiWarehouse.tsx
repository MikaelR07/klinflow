import React, { useState } from 'react';
import { 
  Map, 
  Box, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function MultiWarehouse() {
  const { isDarkMode } = useThemeStore();
  const [activeZone, setActiveZone] = useState('Nairobi HQ');

  const warehouses = ['Nairobi HQ', 'Mombasa Export Hub', 'Thika Processing Plant'];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Multi-Warehouse Mapping</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Spatial tracking and zone management across all physical hubs.</p>
        </div>
        <div className={`inline-flex items-center p-1 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
          {warehouses.map(w => (
             <button 
               key={w}
               onClick={() => setActiveZone(w)} 
               className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${activeZone === w ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
             >
               {w}
             </button>
          ))}
        </div>
      </div>

      {/* Main Floor Plan Area */}
      <div className={`rounded-3xl border flex flex-col overflow-hidden min-h-[600px] ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
         
         {/* Map Header */}
         <div className={`px-6 py-4 border-b flex items-center justify-between z-10 bg-inherit ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Map className="font-medium w-5 h-5 text-emerald-500" />
              {activeZone} Digital Twin
            </h2>
            <div className="flex gap-4 text-xs font-medium">
               <span className="font-medium flex items-center gap-1 text-emerald-500"><span className="font-medium w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/30" /> Optimal</span>
               <span className="font-medium flex items-center gap-1 text-amber-500"><span className="font-medium w-3 h-3 rounded bg-amber-500/20 border border-amber-500/30" /> Warning</span>
               <span className="font-medium flex items-center gap-1 text-rose-500"><span className="font-medium w-3 h-3 rounded bg-rose-500/20 border border-rose-500/30" /> Full</span>
            </div>
         </div>

         {/* Interactive Map Floor */}
         <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 p-8 flex flex-col md:flex-row gap-6">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Zone: Raw Material Storage */}
            <div className="flex-1 rounded-3xl border-2 border-dashed border-rose-500/30 bg-rose-500/5 relative group p-6 flex flex-col cursor-pointer transition-colors hover:bg-rose-500/10">
               <div className="absolute top-4 right-4 flex gap-1">
                 <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
               </div>
               <h3 className="font-semibold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> Raw Intake Zones</h3>
               <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-rose-500/20 p-4 shadow-sm flex flex-col justify-between">
                     <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Zone A: PET</p>
                     <div>
                        <p className={`font-mono text-xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>95% Full</p>
                        <div className="w-full h-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-full mt-2 overflow-hidden"><div className="h-full bg-rose-500 w-[95%]" /></div>
                     </div>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-900 border border-amber-500/20 p-4 shadow-sm flex flex-col justify-between">
                     <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Zone B: HDPE</p>
                     <div>
                        <p className={`font-mono text-xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>72% Full</p>
                        <div className="w-full h-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-full mt-2 overflow-hidden"><div className="h-full bg-amber-500 w-[72%]" /></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Zone: Processing */}
            <div className="flex-1 rounded-3xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 relative group p-6 flex flex-col cursor-pointer transition-colors hover:bg-amber-500/10">
               <h3 className="font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2"><Building className="w-4 h-4" /> Processing Floor</h3>
               <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                     <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                        <Box className="font-medium w-8 h-8 text-amber-500" />
                     </div>
                     <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>3 Lines Active</p>
                     <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Processing 4.2T / hr</p>
                  </div>
               </div>
            </div>

            {/* Zone: Finished Goods */}
            <div className="flex-[1.5] rounded-3xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 relative group p-6 flex flex-col cursor-pointer transition-colors hover:bg-emerald-500/10">
               <h3 className="font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Finished Goods Storage</h3>
               <div className="flex-1 grid grid-cols-3 gap-4">
                  {[
                    { label: 'Aisle 1 (PET Flakes)', util: 45 },
                    { label: 'Aisle 2 (PET Flakes)', util: 30 },
                    { label: 'Aisle 3 (HDPE Rigid)', util: 85 },
                    { label: 'Aisle 4 (Cardboard)', util: 12 },
                    { label: 'Aisle 5 (Empty)', util: 0 },
                    { label: 'Aisle 6 (Empty)', util: 0 },
                  ].map((aisle, i) => (
                    <div key={i} className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-500/20 p-3 shadow-sm flex flex-col justify-between">
                       <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{aisle.label}</p>
                       <div className="mt-2">
                          <p className={`font-mono text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{aisle.util}% Util</p>
                          <div className="w-full h-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mt-1 overflow-hidden"><div className={`h-full ${aisle.util > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${aisle.util}%` }} /></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
