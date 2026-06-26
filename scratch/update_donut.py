import re

FILE_PATH = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/FleetRFQs.tsx'

with open(FILE_PATH, 'r') as f:
    content = f.read()

pattern = r'\{\/\* Chart 2: Material Donut \*\/\}.*?\{\/\* Action Needed \*\/\}'

new_ui = """{/* Chart 2: Material Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Response by Material</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 flex items-center gap-2">
            
            {/* Custom Legend on the Left */}
            <div className="w-2/5 flex flex-col justify-center space-y-3">
              {materialDonutData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-none line-clamp-1">{entry.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">{entry.value}%</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Donut Chart on the Right */}
            <div className="w-3/5 flex items-center justify-center relative min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={materialDonutData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {materialDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Total</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">100%</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Needed */}"""

content = re.sub(pattern, new_ui, content, flags=re.DOTALL)

with open(FILE_PATH, 'w') as f:
    f.write(content)

print("Updated Material Donut layout successfully.")
