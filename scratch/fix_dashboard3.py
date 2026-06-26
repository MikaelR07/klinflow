import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. Add Wallet KPI Card
# We need to insert it right after `</Card>\n              ))}`
# Let's find exactly where it is.
wallet_kpi = """</Card>
              ))}

              <Card className="flex flex-col justify-between p-4">
                <div className="flex items-center gap-2 mb-2">
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
              </Card>"""
content = content.replace('</Card>\n              ))}', wallet_kpi)

# 2. Operations Overview -> Add 3 Mini Cards with different colors
ops_regex = re.compile(r'(<Card className="lg:col-span-2 flex flex-col">.*?<div className="h-\[250px\] -mx-2 mt-4">)', re.DOTALL)
def ops_replacer(m):
    return """<Card className="lg:col-span-2 flex flex-col">
          <SectionHeader icon={Activity} title="Operations Overview" action="/admin/dispatch" actionLabel="View all operations" />
          <div className="grid grid-cols-3 gap-3 mt-2 mb-4">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3">
              <p className="font-bold text-[9px] text-emerald-600 uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400">KSh {(earnings.total || 0).toLocaleString()}</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3">
              <p className="font-bold text-[9px] text-blue-600 uppercase tracking-widest mb-1">Total Collected</p>
              <h3 className="font-bold text-lg text-blue-700 dark:text-blue-400">{(fleetDrivers.reduce((sum: any, d: any) => sum + (d.collected_kg || 0), 0)).toLocaleString()} Kg</h3>
            </div>
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl p-3">
              <p className="font-bold text-[9px] text-amber-600 uppercase tracking-widest mb-1">Total Pickups</p>
              <h3 className="font-bold text-lg text-amber-700 dark:text-amber-400">{fleetDrivers.reduce((sum: any, d: any) => sum + (d.completed_jobs || 0), 0)}</h3>
            </div>
          </div>
          <div className="h-[200px] -mx-2 mt-2">"""

content = ops_regex.sub(ops_replacer, content)

# 3. Fleet Status Card -> Ensure PieChart has labels so user sees "info with data"
# Also we'll add Legend
pie_regex = re.compile(r'(<PieChart>\s*<Pie\s*data=\{fleetStatusData\}.*?>\s*\{fleetStatusData\.map.*?\}\s*</Pie>\s*)(</PieChart>)', re.DOTALL)
content = pie_regex.sub(r'\1<Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none" }} />\n                \2', content)

# 4. Marketplace Opportunities Card -> Restyle it
market_regex = re.compile(r'(\{\/\* Marketplace Opportunities \*\/\}\s*<Card className="lg:col-span-1 flex flex-col">).*?(</Card>)', re.DOTALL)
new_market = """{/* Marketplace Opportunities */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <SectionHeader icon={Store} title="Marketplace Opportunities" action="/admin/marketplace" actionLabel="View marketplace" />
          
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <div>
                <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mb-1">Total Market RFQs</p>
                <span className="font-bold text-xl text-slate-900 dark:text-white">{rfqCount || 12}</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mb-1">Highest RFQ Value</p>
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">KSh 450,000</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100/50 dark:border-blue-900/30">
              <div>
                <p className="font-bold text-[9px] text-blue-500 uppercase tracking-widest mb-1">My RFQs</p>
                <span className="font-bold text-xl text-blue-700 dark:text-blue-400">3</span>
              </div>
              <div className="text-right">
                <p className="font-bold text-[9px] text-blue-500 uppercase tracking-widest mb-1">Total Value</p>
                <span className="font-bold text-sm text-blue-700 dark:text-blue-400">KSh 120,000</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
            <div>
              <p className="font-bold text-[9px] text-slate-500 uppercase tracking-widest mb-1">Highest Demand</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[100px]">{highestDemand?.material_name || highestDemand?.material || 'PET Bottles'}</p>
                <span className="font-bold text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-sm">28 Req</span>
              </div>
              <p className="font-medium text-[10px] text-slate-500 mt-0.5">KSh {highestDemand?.price_per_kg || 42}/kg</p>
            </div>
            
            <div className="w-[100px] h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[{val: 10}, {val: 12}, {val: 11}, {val: 15}, {val: 18}, {val: 16}, {val: 22}]}>
                  <Line type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>"""
content = market_regex.sub(new_market, content)

# 5. Fix row 3 grid-cols to fit perfectly
row3_regex = re.compile(r'(\{\/\* ══════════════════════════════════════════════════════════════════════\s*ROW 3 — LIVE FLEET MAP.*?══════════════════════════════════════════════════════════════════════ \*\/\}\s*<div className="grid grid-cols-1 )lg:grid-cols-4( gap-3">)', re.DOTALL)
content = row3_regex.sub(r'\1lg:grid-cols-3\2', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Updates applied.")
