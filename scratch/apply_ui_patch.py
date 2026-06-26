import re

with open('apps/agent/src/pages/admin/FleetFinance.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';",
    "import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';"
)

content = content.replace(
    "PieChart as PieChartIcon",
    "PieChart as PieChartIcon,\n  LineChart as LineChartIcon,\n  TrendingDown"
)

# 2. Insert mock data
mock_data = """
const CASH_FLOW_MOCK_DATA = [
  { date: 'May 12', sent: 120000, bought: 85000 },
  { date: 'May 17', sent: 150000, bought: 110000 },
  { date: 'May 22', sent: 210000, bought: 140000 },
  { date: 'May 27', sent: 180000, bought: 160000 },
  { date: 'Jun 1', sent: 250000, bought: 220000 },
  { date: 'Jun 6', sent: 280000, bought: 260000 },
  { date: 'Jun 12', sent: 310000, bought: 290000 },
];
"""
if "CASH_FLOW_MOCK_DATA" not in content:
    content = content.replace("const COLORS =", mock_data + "const COLORS =")

# 3. Replace the entire return block
new_render = """  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Finance Command Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor liquidity, track disbursements, manage approvals, and analyze financial performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300">
            May 12 - Jun 12, 2026 <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => fetchData()} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm hover:bg-slate-50 transition-all text-slate-700 dark:text-slate-300 flex items-center gap-2 text-xs font-bold px-3">
            <Activity className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Export
          </button>
        </div>
      </div>

      {/* ── TOP ROW: KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <Wallet className="w-3.5 h-3.5" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Available Cash</p>
           </div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">KES {Number(profile?.walletBalance || 0).toLocaleString()}</h3>
           <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +14% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <ShieldCheck className="w-3.5 h-3.5" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Total Disbursed</p>
           </div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">KES {totalMoneySent.toLocaleString()}</h3>
           <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +8% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
               <Clock className="w-3.5 h-3.5" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Pending Approvals</p>
           </div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">KES {requests.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}</h3>
           <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">{requests.length} requests</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
               <Package className="w-3.5 h-3.5" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Material Spend</p>
           </div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">KES {totalSpentOnMaterials.toLocaleString()}</h3>
           <p className="text-[10px] font-bold text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/> -6% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <LineChartIcon className="w-3.5 h-3.5" />
             </div>
             <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Gross Margin</p>
           </div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">28.4%</h3>
           <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +4.6% vs last month</p>
        </div>
      </div>

      {/* ── SECOND ROW: 3 CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Cash Flow Overview */}
         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cash Flow Overview</h3>
              <button className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-slate-200 dark:border-slate-700">Daily <ChevronDown className="w-3 h-3"/></button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[10px] font-bold text-slate-500">Money Sent</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-[10px] font-bold text-slate-500">Material Bought</span></div>
            </div>

            <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={CASH_FLOW_MOCK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorBought" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000}k`} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                   />
                   <Area type="monotone" dataKey="sent" name="Money Sent" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                   <Area type="monotone" dataKey="bought" name="Material Bought" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBought)" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="h-[400px]">
           {/* Material Spend Breakdown Chart */}
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">Material Spend Breakdown (30d)</h3>
               </div>
             </div>

             <div className="flex-1 min-h-[250px] w-full relative">
               {materialSpend.length > 0 ? (
                 <div className="flex h-full items-center gap-2">
                   <div className="w-1/2 h-full min-h-[200px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={materialSpend}
                           cx="50%"
                           cy="50%"
                           innerRadius={65}
                           outerRadius={85}
                           paddingAngle={2}
                           dataKey="value"
                           stroke="none"
                         >
                           {materialSpend.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip
                           formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Spent']}
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">KES</span>
                       <span className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{totalSpentOnMaterials.toLocaleString()}</span>
                       <span className="text-[9px] text-slate-400 mt-1">Total</span>
                     </div>
                   </div>
                   <div className="w-1/2 flex flex-col justify-center space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                     {materialSpend.map((entry, index) => {
                        const percentage = totalSpentOnMaterials > 0 ? ((entry.value / totalSpentOnMaterials) * 100).toFixed(0) : 0;
                        return (
                          <div key={index} className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[80px]" title={entry.name}>
                                  {entry.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 shrink-0">{percentage}%</span>
                            </div>
                            <div className="pl-3.5">
                              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">KES {entry.value.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                     })}
                   </div>
                 </div>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                   <Package className="w-8 h-8 text-slate-400 mb-2" />
                   <p className="text-xs font-bold text-slate-500">No material spend data yet</p>
                 </div>
               )}
             </div>
             <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
               <button className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">View full breakdown <ArrowUpRight className="w-3 h-3"/></button>
             </div>
           </div>
         </div>

         <div className="h-[400px]">
           {/* Pending Fund Requests */}
           <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Approvals</h3>
                 <span className="w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-bold">{requests.length}</span>
               </div>
               <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
             </div>

             <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-3">
               {isLoading && requests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 opacity-50">
                   <Loader2 className="w-6 h-6 animate-spin text-primary" />
                 </div>
               ) : requests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                     <ShieldCheck className="w-6 h-6 text-emerald-500" />
                   </div>
                   <p className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</p>
                   <p className="text-xs text-slate-500 mt-1">No pending requests.</p>
                 </div>
               ) : (
                 requests.map((req, i) => {
                   const isHigh = Number(req.amount) > 10000;
                   return (
                     <div key={req.id} className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                               {req.driver_avatar ? (
                                 <OptimizedImage src={req.driver_avatar} className="w-full h-full object-cover rounded-full" />
                               ) : (
                                 <span className="text-xs font-bold text-slate-500">{req.driver_name.substring(0,2).toUpperCase()}</span>
                               )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">{req.driver_name}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{req.reason || 'Wallet Top-up'}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Requested: 2h ago</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900 dark:text-white">KES {Number(req.amount).toLocaleString()}</p>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${isHigh ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-amber-50 text-amber-500 dark:bg-amber-500/10'}`}>
                               {isHigh ? 'High' : 'Medium'}
                            </span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleApprove(req.id)} disabled={isProcessing !== null} className="flex-1 py-1.5 bg-emerald-500 text-white rounded-lg font-bold text-[11px] hover:bg-emerald-600 transition-colors flex items-center justify-center">
                            Approve
                          </button>
                          <button onClick={() => handleDecline(req.id)} disabled={isProcessing !== null} className="flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-[11px] hover:bg-slate-50 transition-colors flex items-center justify-center">
                            Reject
                          </button>
                          <button className="px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
         </div>
      </div>

      {/* ── THIRD ROW: 2 CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            {/* Recent Transactions Ledger */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
                <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/50 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                      <th className="pb-3 font-medium px-2">Date & Time</th>
                      <th className="pb-3 font-medium px-2">Type</th>
                      <th className="pb-3 font-medium px-2">Description</th>
                      <th className="pb-3 font-medium px-2">Agent / Party</th>
                      <th className="pb-3 text-right font-medium px-2">Amount</th>
                      <th className="pb-3 font-medium pl-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-slate-500">No transactions found</td>
                      </tr>
                    ) : (
                      transactions.slice(0, 5).map((tx, i) => {
                        const type = i % 2 === 0 ? 'Disbursement' : 'Payout';
                        const typeColor = type === 'Disbursement' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-blue-600 bg-blue-50 dark:bg-blue-500/10';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${typeColor}`}>
                                {type}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              {tx.receiver_name ? `Agent wallet funding` : 'Dispute refund'}
                            </td>
                            <td className="py-3 px-2 text-xs font-bold text-slate-900 dark:text-white">
                              {tx.receiver_name || 'EcoWaste Solutions'}
                            </td>
                            <td className={`py-3 px-2 text-right text-xs font-black ${i % 3 === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {i % 3 === 0 ? '+' : '-'}KES {Number(tx.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 pl-6">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-bold text-slate-500">Completed</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">View all transactions <ArrowUpRight className="w-3 h-3"/></button>
              </div>
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white">Financial Alerts</h3>
                   <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-3 items-start bg-rose-50 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-100 dark:border-rose-500/10">
                     <div className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                       <XIcon className="w-3.5 h-3.5" />
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-[11px] font-bold text-rose-900 dark:text-rose-300">Low cash balance alert</h4>
                          <span className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer">Action required</span>
                       </div>
                       <p className="text-[10px] text-rose-700/70 dark:text-rose-400/70 font-medium">Available cash is below your threshold.</p>
                     </div>
                   </div>

                   <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-100 dark:border-amber-500/10">
                     <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                       <Activity className="w-3.5 h-3.5" />
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-[11px] font-bold text-amber-900 dark:text-amber-300">{requests.length} payments awaiting approval</h4>
                          <span className="text-[9px] font-bold text-amber-600 hover:underline cursor-pointer">Review now</span>
                       </div>
                       <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-medium">Total pending amount: KES {requests.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}</p>
                     </div>
                   </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spend Insights</h3>
                   <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1">View insights <ArrowUpRight className="w-3 h-3"/></button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-3 items-start">
                     <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                       <TrendingDown className="w-3.5 h-3.5" />
                     </div>
                     <div>
                       <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Material spend decreased by 6%</h4>
                       <p className="text-[11px] text-slate-500 font-medium">You spent KES {totalSpentOnMaterials.toLocaleString()} this month.</p>
                     </div>
                   </div>

                   <div className="flex gap-3 items-start">
                     <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                       <TrendingUp className="w-3.5 h-3.5" />
                     </div>
                     <div>
                       <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Plastic prices trending up</h4>
                       <p className="text-[11px] text-slate-500 font-medium">HDPE price increased by 12% in the last 14 days.</p>
                     </div>
                   </div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
}
"""

start_index = content.find("  return (")
if start_index != -1:
    content = content[:start_index] + new_render
    with open('apps/agent/src/pages/admin/FleetFinance.tsx', 'w') as f:
        f.write(content)
    print("Successfully rewritten FleetFinance.tsx UI")
else:
    print("Could not find return statement")
