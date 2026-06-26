import re

FILE_PATH = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/FleetRFQs.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

# 1. Update Imports
if 'AreaChart' not in content:
    lucide_imports_match = re.search(r'import\s+\{[^\}]+\}\s+from\s+[\'"]lucide-react[\'"];', content)
    if lucide_imports_match:
        # Add new lucide icons
        old_lucide = lucide_imports_match.group(0)
        new_lucide = old_lucide.replace('}', ', TrendingUp, TrendingDown, AlertTriangle, MoreVertical, Search, FileText }')
        # Recharts imports
        recharts_import = "import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';\n"
        content = content.replace(old_lucide, recharts_import + new_lucide)

# 2. Inject Mock Data before `return (`
if 'sentVsAcceptedData' not in content:
    mock_data = """
  // --- MOCK DATA FOR CHARTS ---
  const sentVsAcceptedData = [
    { name: 'Mon', sent: 4, accepted: 2 },
    { name: 'Tue', sent: 7, accepted: 3 },
    { name: 'Wed', sent: 5, accepted: 4 },
    { name: 'Thu', sent: 12, accepted: 8 },
    { name: 'Fri', sent: 8, accepted: 6 },
    { name: 'Sat', sent: 3, accepted: 2 },
    { name: 'Sun', sent: 5, accepted: 4 },
  ];

  const materialDonutData = [
    { name: 'PET Flakes', value: 45 },
    { name: 'Aluminium', value: 25 },
    { name: 'OCC Paper', value: 20 },
    { name: 'Glass', value: 10 },
  ];
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  const actionNeeded = [
    { id: 'RFQ-2041', material: 'Mixed Glass', weight: '120kg', issue: 'Closes in 2 hrs - 1 bid', urgency: 'high' },
    { id: 'RFQ-1988', material: 'PET Bottles', weight: '500kg', issue: 'Price 18% above market', urgency: 'medium' },
    { id: 'RFQ-2022', material: 'OCC Paper', weight: '2000kg', issue: 'Awaiting approval', urgency: 'low' },
  ];

  const marketFlow = [
    { material: 'PET Plastic', trend: 'up', percentage: '8%' },
    { material: 'OCC Paper', trend: 'up', percentage: '4%' },
    { material: 'Aluminium', trend: 'down', percentage: '2%' },
    { material: 'Clear Glass', trend: 'up', percentage: '12%' },
  ];

"""
    return_pattern = re.compile(r'(\s+)(return\s+\(\s*<div\s+className="space-y-8 animate-fade-in pb-10">)')
    content = return_pattern.sub(r'\n' + mock_data + r'\1\2', content)

# 3. Replace the UI block from PIPELINE STATS to the start of BROADCAST RFQ MODAL
ui_replacement = """
      {/* ── ROW 1: KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { name: 'Total Broadcasted', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { name: 'Open RFQs', value: stats.open, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { name: 'Pending Review', value: 8, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { name: 'Fulfilled RFQs', value: stats.fulfilled, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
          { name: 'Seller Responses', value: stats.totalBids, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { name: 'RFQ Value (Week)', value: 'KSh 1.24M', color: 'text-rose-500', bg: 'bg-rose-500/10' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</p>
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <Receipt className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{item.value}</h3>
          </div>
        ))}
      </div>

      {/* ── ROW 2: ANALYSIS CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Sent vs Accepted */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">RFQs Sent vs Accepted</h3>
            <select className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-600 outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="h-48 w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentVsAcceptedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="accepted" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorAccepted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Material Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Response by Material</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 flex items-center justify-center relative min-h-[192px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={materialDonutData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                  {materialDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">100%</span>
            </div>
          </div>
        </div>

        {/* Action Needed */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Action Needed
            </h3>
            <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[220px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RFQ & Material</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Issues</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {actionNeeded.map((action, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group">
                    <td className="px-5 py-3">
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{action.id}</p>
                      <p className="text-[10px] text-slate-500">{action.material}</p>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-700 dark:text-slate-300">{action.weight}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        action.urgency === 'high' ? 'bg-rose-500/10 text-rose-600' :
                        action.urgency === 'medium' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-blue-500/10 text-blue-600'
                      }`}>
                        {action.issue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ROW 3: MAIN RFQ TABLE & SIDEBAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Col: Main RFQ Table */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1rem] shadow-sm flex flex-col overflow-hidden">
          
          {/* Tabs & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/30 dark:bg-slate-900/50">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              {['pending', 'accepted', 'closed', 'cancelled'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {tab === 'pending' ? 'Open' : tab === 'accepted' ? 'Fulfilled' : tab}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search RFQs..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Table Data */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">RFQ & Material</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pricing</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bids & Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {filteredRFQs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">No RFQs Found</h3>
                    </td>
                  </tr>
                ) : filteredRFQs.map(rfq => (
                  <tr key={rfq.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 mb-0.5">{rfq.id.substring(0, 8).toUpperCase()}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{rfq.material}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{rfq.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-slate-400" /> {rfq.quantity}
                        </p>
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {rfq.location}
                        </p>
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> {rfq.deadline || 'No deadline'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Target Price</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">KSh {rfq.targetPrice} <span className="text-xs font-medium text-slate-400">/kg</span></p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {rfq.bidsCount} Bids <span className="text-slate-400 font-normal">received</span>
                        </p>
                        <div className="flex gap-1 items-center">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i < Math.min(rfq.bidsCount, 5) ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => navigate(`/rfqs/${rfq.id}`)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        View Bids
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Market Flow */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1rem] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Market Flow
            </h3>
            <div className="space-y-4">
              {marketFlow.map((flow, idx) => (
                <div key={idx} className="flex items-center justify-between pb-4 border-b border-slate-50 dark:border-slate-800 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{flow.material}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">High Volume</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold ${flow.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {flow.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {flow.percentage}
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest">
              View All Trends
            </button>
          </div>

          <div className="bg-blue-600 rounded-[1rem] p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-sm font-bold mb-2">New Market RFQs Available</h3>
              <p className="text-xs text-blue-100 mb-4 opacity-90 leading-relaxed">
                12 new opportunities matching your usual material requirements have been posted.
              </p>
              <button className="text-xs font-bold bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
                View Opportunities <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <Package className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-500/30" />
          </div>
        </div>
      </div>
"""

start_marker = r'\{/\*\s*── PIPELINE STATS ──\s*\*/\}'
end_marker = r'\{/\*\s*── BROADCAST RFQ MODAL \(DESKTOP FORM COMPLIANT\) ──\s*\*/\}'

# We use re.DOTALL so .* can match across newlines
pattern = re.compile(start_marker + r'.*?(?=' + end_marker + r')', re.DOTALL)
content = pattern.sub(ui_replacement + '\n      ', content)

with open(FILE_PATH, 'w') as f:
    f.write(content)

print("Successfully updated FleetRFQs.tsx")
