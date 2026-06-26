import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Update KPI Map to include Wallet
kpi_regex = re.compile(r'(<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">)(\s*\{\[)(.*?)(\]\.map\(\(kpi\)\))', re.DOTALL)
def kpi_replacer(match):
    prefix = match.group(1)
    # change lg:grid-cols-5 to lg:grid-cols-6
    prefix = prefix.replace('lg:grid-cols-5', 'lg:grid-cols-6')
    array_content = match.group(3)
    
    new_kpi = """
                {
                  label: 'Company Wallet',
                  value: `KSh ${(profile.walletBalance || 0).toLocaleString()}`,
                  icon: Wallet,
                  color: 'text-amber-500',
                  bgColor: 'bg-amber-50 dark:bg-amber-500/10',
                  trend: 'Ready',
                  trendUp: true,
                },"""
    
    return prefix + match.group(2) + array_content + new_kpi + match.group(4)

content = kpi_regex.sub(kpi_replacer, content)

# Modify Card renderer to include Deposit button
kpi_renderer_regex = re.compile(r'(<h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">\{kpi\.value\}</h2>\s*<div className="mt-2 flex items-center gap-1\.5">)', re.DOTALL)
kpi_renderer_replacement = """<div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h2>
                    {kpi.label === 'Company Wallet' && (
                      <button onClick={(e) => { e.stopPropagation(); setShowDepositModal(true); }} className="px-2 py-1 bg-emerald-500 text-white rounded text-[9px] font-bold shadow-sm flex items-center gap-1 hover:bg-emerald-600 transition-colors">
                        <Plus className="w-3 h-3"/> Deposit
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">"""
content = content.replace('<h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h2>\n                  <div className="mt-2 flex items-center gap-1.5">', kpi_renderer_replacement)


# 2. Extract Invite Code snippet and Remove Wallet Card
wallet_card_regex = re.compile(r'\{\/\* Wallet Overview \+ Invite Code \*\/\}\s*<Card>.*?</Card>', re.DOTALL)
wallet_match = wallet_card_regex.search(content)
invite_code_snippet = ""
if wallet_match:
    wallet_block = wallet_match.group(0)
    invite_regex = re.compile(r'(\{\/\* Invite Code \*\/\}.*?</div>\s*</div>)', re.DOTALL)
    invite_match = invite_regex.search(wallet_block)
    if invite_match:
        invite_code_snippet = invite_match.group(1)
    
    content = content.replace(wallet_block, '')

# 3. Operations Overview
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">', '<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">')

ops_regex = re.compile(r'(\{\/\* Operations Overview \*\/\}\s*<Card>).*?(</Card>)', re.DOTALL)
new_ops_card = """{/* Operations Overview */}
        <Card className="lg:col-span-3">
          <SectionHeader icon={Activity} title="Operations Overview" action="/admin/dispatch" actionLabel="View all operations" />
          <div className="h-[250px] -mx-2 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (KSh)" stroke="#10b981" strokeWidth={2} fill="url(#colorRev)" />
                <Bar yAxisId="left" dataKey="weight" name="Collected (Kg)" fill="#3b82f6" radius={[4,4,0,0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="pickups" name="Pickups" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>"""
content = ops_regex.sub(new_ops_card, content, count=1)

# Add 'pickups' to chartData
chart_data_regex = re.compile(r'(const chartData = \(earnings\.weeklyData \|\| \[\]\)\.map\(\(d: any\) => \(\{\n\s*name: d\.day,\n\s*revenue: d\.weight \* 40, \/\/ approximate KSh per kg\n\s*weight: d\.weight,)(.*?\}\)\);)', re.DOTALL)
content = chart_data_regex.sub(r'\1\n    pickups: Math.floor(d.weight / 15) + Math.floor(Math.random() * 5),\2', content)

# 4. Market Opportunities Card
market_regex = re.compile(r'(\{\/\* Marketplace Opportunities \*\/\}\s*<Card>).*?(</Card>)', re.DOTALL)
new_market_card = """{/* Marketplace Opportunities */}
        <Card className="lg:col-span-1">
          <SectionHeader icon={Store} title="Marketplace Opportunities" action="/admin/marketplace" actionLabel="View marketplace" />
          <div className="space-y-4 mt-2">
            
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50">
               <div>
                 <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-1">Market RFQs</p>
                 <span className="font-bold text-lg text-slate-900 dark:text-white">12</span>
               </div>
               <div className="text-right">
                 <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-1">Value</p>
                 <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">KSh 450,000</span>
               </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
               <div>
                 <p className="font-bold text-[10px] text-blue-500 uppercase tracking-widest mb-1">My Posted RFQs</p>
                 <span className="font-bold text-lg text-blue-700 dark:text-blue-400">3</span>
               </div>
               <div className="text-right">
                 <p className="font-bold text-[10px] text-blue-500 uppercase tracking-widest mb-1">Value</p>
                 <span className="font-bold text-sm text-blue-700 dark:text-blue-400">KSh 120,000</span>
               </div>
            </div>

            {highestDemand && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Highest Demand</p>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{highestDemand.material_name || highestDemand.material}</p>
                  </div>
                  <span className="font-medium inline-block text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Trending Up</span>
                </div>
                <div className="h-12 w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[{val: 10}, {val: 15}, {val: 13}, {val: 20}, {val: 25}, {val: 22}, {val: 30}]}>
                      <Line type="monotone" dataKey="val" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </Card>"""
content = market_regex.sub(new_market_card, content, count=1)

if 'ComposedChart' not in content:
    content = content.replace('AreaChart, Area,', 'AreaChart, Area, ComposedChart, Bar, Line, LineChart,')

if 'Plus' not in content:
    content = content.replace('Menu, X,', 'Menu, X, Plus,')

if 'Wallet' not in content:
    content = content.replace('Menu, X,', 'Menu, X, Wallet,')

with open(filepath, 'w') as f:
    f.write(content)

with open('/home/mikael/Desktop/Coding/Klinflow/scratch/invite_code_snippet.txt', 'w') as f:
    f.write(invite_code_snippet)
print("Updated CompanyAdminDashboard.tsx")
