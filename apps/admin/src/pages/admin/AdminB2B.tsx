import { useState, useEffect } from 'react';
import { 
  Building2, BadgeCheck, TrendingUp, Truck, 
  Search, Check, X, ShieldCheck, 
  Activity, AlertCircle, ShoppingBag, ArrowRight, Scale
} from 'lucide-react';
import { useAdminStore } from '@klinflow/core/stores/adminStore';
import { toast } from 'sonner';

export default function AdminB2B() {
  const { 
    unverifiedBusinesses, b2bLogistics, marketplaceFeed,
    fetchB2BData, verifyBusiness, isLoading 
  } = useAdminStore();
  const [activeTab, setActiveTab] = useState('verifications');

  useEffect(() => {
    fetchB2BData();
  }, []);

  const tabs = [
    { id: 'verifications', label: 'Verification Queue', icon: ShieldCheck, count: unverifiedBusinesses.length },
    { id: 'marketplace',   label: 'Market Oversight',   icon: ShoppingBag,    count: marketplaceFeed.length },
    { id: 'logistics',     label: 'Freight Dispatch',   icon: Truck,          count: b2bLogistics.length },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">B2B Command Center</h1>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Industrial View</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage industrial verification, bulk trading, and Green Freight operations.</p>
        </div>
      </div>

      {/* KPI Row (B2B Specific) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex items-center gap-6">
          <div className="p-4 rounded-[1rem] bg-emerald-500/10 text-emerald-600">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Queue Size</p>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{unverifiedBusinesses.length}</h2>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex items-center gap-6">
          <div className="p-4 rounded-[1rem] bg-indigo-500/10 text-indigo-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Active Bulk Trades</p>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{marketplaceFeed.length}</h2>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-100/50 dark:shadow-none flex items-center gap-6">
          <div className="p-4 rounded-[1rem] bg-amber-500/10 text-amber-600">
            <Truck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Freight In-Transit</p>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">{b2bLogistics.length}</h2>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-[1rem] gap-2 max-w-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-[1rem] text-[11px] font-semibold uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-primary shadow-xl shadow-slate-200/50 dark:shadow-none'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Synchronizing B2B Grid...</p>
          </div>
        ) : (
          <div className="p-8">
            {activeTab === 'verifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Pending Verifications</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Filter by NEMA ID..." className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-semibold w-64 focus:ring-2 text-base focus:ring-primary/20" />
                  </div>
                </div>

                {unverifiedBusinesses.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                      <BadgeCheck className="w-10 h-10" />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-lg">Queue Clear!</h4>
                    <p className="text-sm text-slate-500">All submitted business credentials have been processed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <th className="pb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Business Entity</th>
                          <th className="pb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">License / Type</th>
                          <th className="pb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Submitted</th>
                          <th className="pb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {unverifiedBusinesses.map(biz => (
                          <tr key={biz.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-lg shadow-sm">🏢</div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{biz.name}</p>
                                  <p className="text-xs font-semibold text-slate-400">{biz.phone}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-5">
                              <div>
                                <p className="text-xs font-semibold text-primary uppercase tracking-tighter">{biz.nema_license}</p>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{biz.business_type}</p>
                              </div>
                            </td>
                            <td className="py-5">
                              <p className="text-xs font-semibold text-slate-500">
                                {new Date(biz.created_at).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-5 text-right">
                              <div className="flex items-center justify-end gap-2 pr-2">
                                <button 
                                  onClick={() => verifyBusiness(biz.id)}
                                  className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 hover:scale-110 active:scale-90 transition-all"
                                  title="Approve Business"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all" title="Flag for Review">
                                  <AlertCircle className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'marketplace' && (
              <div className="space-y-8">
                 <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Market Oversight</h3>
                      <p className="text-xs font-semibold text-slate-400 mt-1">Industrial Bulk Listings & Pricing Analytics</p>
                    </div>
                    <div className="flex gap-2">
                       <div className="p-4 rounded-[1rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Avg Price (PET)</p>
                          <p className="text-lg font-semibold text-primary">KSh 32/kg</p>
                       </div>
                       <div className="p-4 rounded-[1rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-center min-w-[120px]">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Weekly Move</p>
                          <p className="text-lg font-semibold text-emerald-500">+4.2%</p>
                       </div>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-4">
                    {marketplaceFeed.map(item => (
                      <div key={item.id} className="p-5 rounded-[1rem] border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-5 hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl transition-all cursor-pointer group">
                        <div className="w-16 h-16 rounded-[1rem] overflow-hidden bg-slate-200 shrink-0">
                           <img src={item.photo_url || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200'} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{item.material}</h4>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{item.seller?.name}</p>
                             </div>
                             <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">{item.grade}</span>
                           </div>
                           <div className="flex items-center gap-4 mt-3">
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">Volume</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.quantity} {item.unit}</p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase">MOQ</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.moq} {item.unit}</p>
                              </div>
                              <div className="ml-auto text-right">
                                <p className="text-xs font-semibold text-slate-400 uppercase">Floor Price</p>
                                <p className="text-sm font-semibold text-primary">KSh {item.price_per_kg}/kg</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
            )}

            {activeTab === 'logistics' && (
              <div className="space-y-6">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Active Freight Dispatch</h3>
                    <button className="text-xs font-semibold text-primary flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl">
                       <Truck className="w-4 h-4" /> Global Dispatch Map
                    </button>
                 </div>

                 <div className="space-y-3">
                    {b2bLogistics.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[1rem]">
                        <Truck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">No Active Freight Requests</p>
                      </div>
                    ) : b2bLogistics.map(order => (
                      <div key={order.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1rem] shadow-sm hover:shadow-xl transition-all flex items-center gap-8">
                         <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                            <Truck className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                               <h4 className="font-semibold text-slate-900 dark:text-white truncate">Industrial {order.material} Haul</h4>
                               <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 text-xs font-semibold uppercase tracking-widest rounded-full border border-amber-500/10">
                                 {order.booking?.status || 'Pending Dispatch'}
                               </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                               <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Buyer: {order.buyer?.name}</span>
                               <span className="flex items-center gap-1.5"><Scale className="w-3 h-3" /> Volume: {order.quantity} KG</span>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Platform Revenue</p>
                           <p className="text-lg font-semibold text-slate-900 dark:text-white italic underline decoration-primary decoration-4">KSh {order.total_price * 0.2 > 500 ? (order.total_price * 0.2).toFixed(0) : 500}</p>
                         </div>
                         <button className="p-4 bg-slate-50 dark:bg-slate-800 rounded-[1rem] text-slate-400 hover:bg-primary hover:text-white transition-all group">
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                         </button>
                      </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
