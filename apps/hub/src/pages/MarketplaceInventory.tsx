import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Tag,
  ShieldCheck,
  Building2,
  TrendingUp
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function MarketplaceInventory() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState('listings');

  const listings = [
    { id: 'MK-1042', material: 'Hot Washed PET Flakes', grade: 'Grade A (<1% PVC)', quantity: '24 Tons', price: 'KES 85.00/kg', status: 'Live', facility: 'Nairobi HQ' },
    { id: 'MK-1043', material: 'HDPE Regrind', grade: 'Mixed Colors', quantity: '12.5 Tons', price: 'KES 65.00/kg', status: 'Live', facility: 'Thika Plant' },
    { id: 'MK-1044', material: 'Baled OCC Cardboard', grade: 'Premium', quantity: '45 Tons', price: 'KES 18.00/kg', status: 'Draft', facility: 'Mombasa Hub' },
    { id: 'MK-1045', material: 'Aluminium UBCs', grade: 'Baled', quantity: '8 Tons', price: 'KES 155.00/kg', status: 'Live', facility: 'Nairobi HQ' },
  ];

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Marketplace Inventory</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manage B2B listings, view incoming buy requests, and publish stock.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 font-medium text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2">
            <Tag className="w-4 h-4" /> Publish New Listing
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10">
         <button 
           onClick={() => setActiveTab('listings')}
           className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'listings' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
         >
           Active Listings
         </button>
         <button 
           onClick={() => setActiveTab('requests')}
           className={`pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'requests' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
         >
           Incoming Buy Requests <span className="font-medium w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">3</span>
         </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Listings Table */}
        <div className="lg:col-span-8 space-y-6">
           <div className={`rounded-3xl border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              
              {/* Toolbar */}
              <div className={`p-4 border-b flex flex-col sm:flex-row items-center gap-4 justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
                 <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-96 ${isDarkMode ? 'bg-slate-800 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                   <Search className="font-medium w-4 h-4 text-slate-400" />
                   <input type="text" placeholder="Search inventory listings..." className="font-medium bg-transparent border-none text-sm focus:ring-0 w-full outline-none dark:text-white" />
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
                      <th className="px-6 py-4">Listing ID</th>
                      <th className="px-6 py-4">Material Details</th>
                      <th className="px-6 py-4">Available Qty</th>
                      <th className="px-6 py-4">Asking Price</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {listings.map((list, i) => (
                      <tr key={i} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer`}>
                        <td className="px-6 py-4 font-mono font-semibold text-slate-500">{list.id}</td>
                        <td className="px-6 py-4">
                           <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{list.material}</p>
                           <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{list.grade} • {list.facility}</p>
                        </td>
                        <td className={`px-6 py-4 font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{list.quantity}</td>
                        <td className={`px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400`}>{list.price}</td>
                        <td className="px-6 py-4">
                           <span className={`px-2 py-1 rounded-md text-[10px] font-medium uppercase tracking-wider ${
                             list.status === 'Live' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                           }`}>
                             {list.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        </div>

        {/* Right Column: B2B Requests Insight */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Market Demand Intel */}
           <div className={`p-6 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-emerald-900/40 to-slate-900 border-emerald-500/20' : 'from-emerald-50 to-white border-emerald-100'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>
                 <TrendingUp className="font-medium w-5 h-5 text-emerald-500" />
                 Market Demand Intel
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-emerald-200/70' : 'text-emerald-600/70'}`}>Items currently in high demand from global off-takers on the Klinflow network.</p>
              
              <div className="space-y-3">
                 <div className={`p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-between border border-transparent dark:border-white/5`}>
                    <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Hot Washed PET Flakes</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">High Demand</span>
                 </div>
                 <div className={`p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 flex items-center justify-between border border-transparent dark:border-white/5`}>
                    <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>HDPE Regrind</span>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">High Demand</span>
                 </div>
              </div>
           </div>

           {/* Live RFQs / Buy Requests */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>New Buy Requests</h3>
                 <span className="text-xs font-medium text-emerald-500 cursor-pointer">View All</span>
              </div>
              
              <div className="space-y-4">
                 {[
                   { buyer: 'Global Plastics Corp', item: 'PET Flakes', qty: '100 Tons', loc: 'Export (Mombasa)' },
                   { buyer: 'Nairobi Paper Mills', item: 'OCC Cardboard', qty: '50 Tons', loc: 'Local Delivery' },
                 ].map((req, i) => (
                   <div key={i} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <Building2 className="w-4 h-4 text-indigo-500" />
                           <span className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{req.buyer}</span>
                         </div>
                         <ShieldCheck className="font-medium w-4 h-4 text-emerald-500" />
                      </div>
                      <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Requested: <span className="font-medium text-emerald-500">{req.qty}</span> of {req.item} for {req.loc}</p>
                      <button className={`w-full py-2 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                         Respond to RFQ
                      </button>
                   </div>
                 ))}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
