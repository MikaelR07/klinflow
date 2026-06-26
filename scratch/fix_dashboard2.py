import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Remove Company Wallet from array
content = re.sub(
    r'\{\s*label:\s*\'Company Wallet\'.*?trendUp:\s*true,\s*\},', 
    '', 
    content, 
    flags=re.DOTALL
)

# 2. Fix the Card renderer in KPI map to remove custom button logic
content = re.sub(
    r'<div className="flex items-center justify-between">\s*<h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">\{kpi\.value\}</h2>\s*\{kpi\.label === \'Company Wallet\'.*?</div>\s*<div className="mt-2 flex items-center gap-1\.5">',
    '<h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h2>\n                  <div className="mt-2 flex items-center gap-1.5">',
    content,
    flags=re.DOTALL
)

# 3. Add explicit Wallet Card right after the KPI array map
kpi_grid_end = r'</Card>\n              \)\)}\n            </div>'
wallet_card_addition = """</Card>
              ))}
              
              <Card className="flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-50 dark:bg-amber-500/10">
                    <Wallet className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="font-bold text-[10px] text-slate-600 uppercase tracking-widest">Company Wallet</p>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">KSh {(profile.walletBalance || 0).toLocaleString()}</h2>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-medium text-[10px] text-emerald-500">Ready for payout</p>
                    <button onClick={(e) => { e.stopPropagation(); setShowDepositModal(true); }} className="px-2.5 py-1 bg-emerald-500 text-white rounded-md text-[10px] font-bold shadow-sm flex items-center gap-1 hover:bg-emerald-600 transition-colors">
                      <Plus className="w-3 h-3"/> Deposit
                    </button>
                  </div>
                </div>
              </Card>
            </div>"""
content = content.replace(r'</Card>\n              ))}\n            </div>', wallet_card_addition)

# 4. Row 2 Layout: grid-cols-4, Operations -> col-span-2
content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-3 gap-3">', '<div className="grid grid-cols-1 lg:grid-cols-4 gap-3">')
content = content.replace('<Card className="lg:col-span-3">', '<Card className="lg:col-span-2 flex flex-col">')

# 5. Fix Operations Chart (3 Lines)
ops_chart_regex = re.compile(r'<ComposedChart data=\{chartData\}>.*?</ComposedChart>', re.DOTALL)
new_chart = """<LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (KSh)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="Collected (Kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="pickups" name="Pickups" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>"""
content = ops_chart_regex.sub(new_chart, content)

# 6. Marketplace Opportunities Card: Simplify
market_regex = re.compile(r'\{\/\* Marketplace Opportunities \*\/\}\s*<Card className="lg:col-span-1">.*?</Card>', re.DOTALL)
new_market = """{/* Marketplace Opportunities */}
        <Card className="lg:col-span-1 flex flex-col">
          <SectionHeader icon={Store} title="Marketplace Opportunities" action="/admin/marketplace" actionLabel="View marketplace" />
          <div className="flex-1 flex flex-col justify-between space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mb-1">Market RFQs</p>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-lg text-slate-900 dark:text-white">12</span>
                  <span className="font-bold text-[9px] text-emerald-600">450K</span>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30">
                <p className="font-bold text-[9px] text-blue-500 uppercase tracking-widest mb-1">My RFQs</p>
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-lg text-blue-700 dark:text-blue-400">3</span>
                  <span className="font-bold text-[9px] text-blue-700">120K</span>
                </div>
              </div>
            </div>

            {highestDemand && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest">Highest Demand</p>
                    <p className="font-medium text-xs text-slate-900 dark:text-white truncate max-w-[100px]">{highestDemand.material_name || highestDemand.material}</p>
                  </div>
                  <span className="font-bold text-[9px] text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> Trending</span>
                </div>
                <div className="h-12 w-full mt-2">
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
content = market_regex.sub(new_market, content)

with open(filepath, 'w') as f:
    f.write(content)

print("Safely replaced everything.")
