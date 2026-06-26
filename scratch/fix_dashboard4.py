import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# 1. KPI Cards Row -> 6 cols and reduce text sizes to fit
content = content.replace('lg:grid-cols-5 gap-3', 'lg:grid-cols-6 gap-3')
content = content.replace('<h2 className="text-xl font-bold text-slate-900', '<h2 className="text-lg font-bold text-slate-900')
content = content.replace('<Card key={kpi.label}>', '<Card key={kpi.label} className="!p-4">')
# The explicit Wallet Card
content = content.replace('<Card className="flex flex-col justify-between p-4">', '<Card className="flex flex-col justify-between !p-4">')
content = content.replace('<h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">KSh {(profile.walletBalance || 0).toLocaleString()}</h2>', '<h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tighter">KSh {(profile.walletBalance || 0).toLocaleString()}</h2>')

# 2. Operations Overview Graph Lines Fix
# We need to add a middle YAxis and use domain for auto-scaling
chart_regex = re.compile(r'(<LineChart data=\{chartData\}>.*?</LineChart>)', re.DOTALL)
new_chart = """<LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" hide={true} domain={['dataMin', 'dataMax']} />
                <YAxis yAxisId="middle" hide={true} domain={['dataMin', 'dataMax']} />
                <Tooltip
                  contentStyle={{ background: isDarkMode ? '#1e293b' : '#fff', borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (KSh)" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="middle" type="monotone" dataKey="weight" name="Collected (Kg)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="pickups" name="Pickups" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>"""
content = chart_regex.sub(new_chart, content)


# 3. Fleet Status PieChart -> Huge, thick, labels on top
pie_regex = re.compile(r'(<div className="flex items-center gap-6">.*?<div className="w-)32( h-)32( relative shrink-0">.*?<PieChart>\s*<Pie\s*data=\{fleetStatusData\}.*?innerRadius=\{)50(\}\s*outerRadius=\{)62(\}\s*paddingAngle=\{)3(\}\s*dataKey="value"\s*strokeWidth=\{)0(\}\s*>\s*\{fleetStatusData.*?\}\s*</Pie>)', re.DOTALL)
content = pie_regex.sub(r'\g<1>48\g<2>48\g<3>0\g<4>80\g<5>0\g<6>0\g<7> label={({name, value}) => `${name} (${value})`} labelLine={false}', content)

# Remove the "Total Simulated Drivers" absolute center text since it's a solid pie chart now and text would overlap the pie center
content = re.sub(r'<div className="absolute inset-0 flex flex-col items-center justify-center">.*?<span className="font-bold text-xl.*?</span>.*?<span className="font-bold text-\[10px\].*?</span>.*?</div>', '', content, flags=re.DOTALL)


# 4. Swap Top Drivers and Marketplace Opportunities
# Extract Marketplace
market_regex = re.compile(r'(\{\/\* Marketplace Opportunities \*\/\}\s*<Card className="lg:col-span-1 flex flex-col justify-between">.*?</Card>)', re.DOTALL)
market_match = market_regex.search(content)
market_block = market_match.group(1) if market_match else ""

# Extract Top Drivers
drivers_regex = re.compile(r'(\{\/\* Top Drivers Leaderboard \*\/\}\s*<Card className="lg:col-span-1">.*?</Card>)', re.DOTALL)
drivers_match = drivers_regex.search(content)
drivers_block = drivers_match.group(1) if drivers_match else ""

if market_block and drivers_block:
    content = content.replace(market_block, "MARKETPLACE_PLACEHOLDER")
    content = content.replace(drivers_block, "TOPDRIVERS_PLACEHOLDER")
    
    # Put Top Drivers where Marketplace was
    content = content.replace("MARKETPLACE_PLACEHOLDER", drivers_block)
    # Put Marketplace where Top Drivers was
    content = content.replace("TOPDRIVERS_PLACEHOLDER", market_block)

with open(filepath, 'w') as f:
    f.write(content)

print("Updates applied.")
