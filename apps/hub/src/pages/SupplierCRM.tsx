import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ArrowUpRight,
  ShieldCheck,
  MoreVertical,
  Download
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function SupplierCRM() {
  const { isDarkMode } = useThemeStore();
  const [searchTerm, setSearchTerm] = useState('');

  const suppliers = [
    { id: 'SUP-1042', name: 'Eco-Klect Logistics', type: 'Enterprise Fleet', location: 'Industrial Area', volume: '420.5T', score: '98', reliability: 'High' },
    { id: 'SUP-0992', name: 'Jane Doe Collections', type: 'Agent (Level 3)', location: 'Embakasi', volume: '14.2T', score: '92', reliability: 'High' },
    { id: 'SUP-1104', name: 'GreenCity Recyclers', type: 'Enterprise Fleet', location: 'Thika', volume: '155.0T', score: '84', reliability: 'Medium' },
    { id: 'SUP-1420', name: 'Kamau & Sons', type: 'Agent (Level 2)', location: 'Kibera', volume: '4.8T', score: '76', reliability: 'Medium' },
    { id: 'SUP-0844', name: 'Pioneer Waste', type: 'Corporate Partner', location: 'Mombasa Road', volume: '842.1T', score: '99', reliability: 'High' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Supplier Directory</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage all agents, fleets, and corporate material suppliers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`px-4 py-2 font-medium text-sm rounded-xl border flex items-center gap-2 ${isDarkMode ? 'bg-slate-900 border-white/10 text-white hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button className="px-4 py-2 font-medium text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2">
            <Users className="w-4 h-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: "1,248" },
          { label: "Active This Week", value: "842" },
          { label: "Pending KYC", value: "14" },
          { label: "Blacklisted", value: "3" },
        ].map((kpi, i) => (
          <div key={i} className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
             <p className={`text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.label}</p>
             <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
        
        {/* Toolbar */}
        <div className={`p-4 border-b flex flex-col sm:flex-row items-center gap-4 justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
           <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-96 ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
             <Search className="font-medium w-4 h-4 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search by name, ID, or location..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="font-medium bg-transparent border-none text-sm focus:ring-0 w-full outline-none dark:text-white"
             />
           </div>
           <button className={`px-4 py-2 font-medium text-sm rounded-xl border flex items-center gap-2 ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
             <Filter className="w-4 h-4" /> Filters
           </button>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="font-medium w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
              <tr>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Lifetime Volume</th>
                <th className="px-6 py-4">Quality Score</th>
                <th className="px-6 py-4">Reliability</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {suppliers.map((sup, i) => (
                <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${isDarkMode ? 'bg-slate-800 text-white border border-white/10' : 'bg-slate-100 text-slate-900 border border-slate-200'}`}>
                         {sup.name.charAt(0)}
                       </div>
                       <div>
                         <p className={`font-medium flex items-center gap-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                           {sup.name}
                           {sup.score > '90' && <ShieldCheck className="font-medium w-3.5 h-3.5 text-emerald-500" />}
                         </p>
                         <p className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{sup.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${sup.type.includes('Enterprise') ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : sup.type.includes('Corporate') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {sup.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{sup.location}</td>
                  <td className={`px-6 py-4 font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sup.volume}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-16">
                         <div className={`h-full ${parseInt(sup.score) > 90 ? 'bg-emerald-500' : parseInt(sup.score) > 80 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${sup.score}%` }} />
                       </div>
                       <span className={`font-medium text-xs ${parseInt(sup.score) > 90 ? 'text-emerald-500' : parseInt(sup.score) > 80 ? 'text-amber-500' : 'text-rose-500'}`}>{sup.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-medium text-xs ${sup.reliability === 'High' ? 'text-emerald-500' : sup.reliability === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>{sup.reliability}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                          <ArrowUpRight className="w-4 h-4" />
                       </button>
                       <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                          <MoreVertical className="w-4 h-4" />
                       </button>
                    </div>
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
