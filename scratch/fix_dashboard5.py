import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/CompanyAdminDashboard.tsx'

with open(filepath, 'r') as f:
    content = f.read()

# Replace the entire Fleet Status card with the correct layout
fleet_regex = re.compile(r'(\{\/\* Fleet Status Donut Chart \*\/\}\s*<Card>.*?)\{\/\* Top Drivers Leaderboard \*\/\}', re.DOTALL)

new_fleet_card = """{/* Fleet Status Donut Chart */}
        <Card className="flex flex-col">
          <SectionHeader icon={Truck} title="Fleet Status" action="/admin/agents" actionLabel="View fleet" />
          <div className="flex-1 flex flex-col items-center justify-between mt-2">
            <div className="w-full h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fleetStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="80%"
                    paddingAngle={0}
                    dataKey="value"
                    strokeWidth={0}
                    label={({name, value}) => value > 0 ? `${name} (${value})` : ''}
                    labelLine={false}
                  >
                    {fleetStatusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px", border: "none" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-4 w-full border-t border-slate-100 dark:border-slate-700/50 pt-4">
              {fleetStatusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="font-semibold text-[11px] text-slate-600 dark:text-slate-500 capitalize">{s.name}</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-white ml-0.5">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        """

content = fleet_regex.sub(new_fleet_card + "{/* Top Drivers Leaderboard */}", content)

with open(filepath, 'w') as f:
    f.write(content)

print("Fleet status card updated.")
