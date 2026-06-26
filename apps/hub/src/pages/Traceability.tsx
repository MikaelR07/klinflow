import React, { useState } from 'react';
import { 
  Scan, 
  Link, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Database
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function Traceability() {
  const { isDarkMode } = useThemeStore();
  const [searchCode, setSearchCode] = useState('');

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Traceability Platform</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>End-to-end blockchain-verified material provenance.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Search & Timeline */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Blockchain Search */}
           <div className={`p-6 md:p-8 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-emerald-900/40 to-slate-900 border-emerald-500/20' : 'from-emerald-900 to-emerald-950 border-emerald-900 text-white'}`}>
              <div className="flex items-center gap-3 mb-6">
                 <ShieldCheck className="font-medium w-6 h-6 text-emerald-400" />
                 <h2 className="font-semibold text-lg text-white">Provenance Ledger Search</h2>
              </div>
              <div className="flex items-center gap-3 max-w-2xl">
                 <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                    <Scan className="font-medium w-5 h-5 text-emerald-400" />
                    <input 
                      type="text" 
                      placeholder="Enter Batch ID or QR Code..." 
                      className="font-medium bg-transparent border-none text-white placeholder:text-white/50 focus:ring-0 w-full outline-none font-mono"
                    />
                 </div>
                 <button className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors">
                    Track
                 </button>
              </div>
           </div>

           {/* Traceability Timeline */}
           <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Batch Journey: <span className="font-mono text-emerald-500">#KLN-2026-8842-PET</span></h3>
              
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-emerald-500/30 before:to-transparent">
                 
                 {/* Step 1 */}
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-emerald-500 bg-white dark:bg-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <Database className="font-medium w-4 h-4 text-emerald-500" />
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'} shadow-sm`}>
                       <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>1. Source Collection</p>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Aggregated by Jane Doe (Agent)</p>
                       <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Location: Kibera, Nairobi</p>
                       <p className={`text-[10px] font-mono mt-2 text-emerald-500`}>Verified: Oct 12, 08:42 AM</p>
                    </div>
                 </div>

                 {/* Step 2 */}
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-emerald-500 bg-white dark:bg-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <Scan className="font-medium w-4 h-4 text-emerald-500" />
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'} shadow-sm`}>
                       <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>2. Hub Intake & QC</p>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Received at Nairobi HQ</p>
                       <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Grade A Assigned. Net Weight: 4.2 Tons</p>
                       <p className={`text-[10px] font-mono mt-2 text-emerald-500`}>Verified: Oct 13, 14:15 PM</p>
                    </div>
                 </div>

                 {/* Step 3 */}
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-emerald-500 bg-white dark:bg-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <Globe className="font-medium w-4 h-4 text-emerald-500" />
                    </div>
                    <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'} shadow-sm`}>
                       <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>3. Processing</p>
                       <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hot Washed & Granulated</p>
                       <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Converted to Premium PET Flakes</p>
                       <p className={`text-[10px] font-mono mt-2 text-emerald-500`}>Verified: Oct 14, 09:30 AM</p>
                    </div>
                 </div>

              </div>
           </div>

        </div>

        {/* Right Column: Ledger Intel */}
        <div className="lg:col-span-4 space-y-6">
           <div className={`p-6 rounded-3xl border sticky top-24 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <Link className="w-5 h-5 text-indigo-500" />
                 Ledger Details
              </h3>
              
              <div className="space-y-4">
                 <div>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Digital Signature</p>
                    <p className="font-medium font-mono text-xs break-all text-indigo-500 bg-indigo-500/10 p-2 rounded">
                      0x8f2c9a...3b4e7d
                    </p>
                 </div>
                 <div>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Block Height</p>
                    <p className={`font-mono text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      14,402,891
                    </p>
                 </div>
                 <div>
                    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Network</p>
                    <p className={`font-mono text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      Klinflow Subnet (Polygon)
                    </p>
                 </div>
              </div>

              <hr className={`my-6 ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`} />

              <button className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors">
                 Generate Provenance PDF
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
