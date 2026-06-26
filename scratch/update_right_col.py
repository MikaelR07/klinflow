import re

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/DisputesPage.tsx'

with open(filepath, 'r') as f:
    content = f.read()

replacement = """{/* Right Column (Span 1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1rem] p-5 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white w-full mb-6 text-center">Resolution Insights</h3>
            
            {/* Health Score */}
            <div className="flex flex-col items-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-full text-center mb-2">Resolution Health Score</p>
              <div className="relative w-48 h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ value: 84 }, { value: 16 }]}
                      cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                      startAngle={90} endAngle={-270}
                      dataKey="value" stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#f1f5f9" className="dark:fill-slate-800" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">84%</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Good</span>
                </div>
              </div>
              <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
                <span>Target: 90%</span>
                <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[8px]">?</span>
              </div>
            </div>

            {/* Most Common Issues */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Most Common Issues</h4>
                <select className="text-[10px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer">
                  <option>This Month</option>
                </select>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-900 dark:text-white">Late Deliveries</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mb-2">32% of disputes</div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Payment Issues</span>
                    <span className="text-slate-900 dark:text-white">24%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Damaged Goods</span>
                    <span className="text-slate-900 dark:text-white">18%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Staff Behavior</span>
                    <span className="text-slate-900 dark:text-white">12%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Other</span>
                    <span className="text-slate-900 dark:text-white">14%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Repeat Offenders */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Top Repeat Offenders</h4>
                <select className="text-[10px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer">
                  <option>This Month</option>
                </select>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Agent A', count: 7, severity: 'High', color: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30' },
                  { name: 'Agent B', count: 5, severity: 'Medium', color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' },
                  { name: 'Agent C', count: 3, severity: 'Medium', color: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30' }
                ].map((offender, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white">{offender.name}</p>
                        <p className="text-[9px] text-slate-500">{offender.count} disputes</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${offender.color}`}>{offender.severity}</span>
                  </div>
                ))}
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-2 block">View all offenders →</button>
              </div>
            </div>

            {/* Top Repeat Complainers */}
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Top Repeat Complainers</h4>
                <select className="text-[10px] font-bold bg-transparent text-slate-500 outline-none cursor-pointer">
                  <option>This Month</option>
                </select>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Client X', count: 4, type: 'Corporate', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' },
                  { name: 'Client Y', count: 3, type: 'Residential', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30' },
                  { name: 'Client Z', count: 3, type: 'Corporate', color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30' }
                ].map((complainer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-900 dark:text-white">{complainer.name}</p>
                        <p className="text-[9px] text-slate-500">{complainer.count} complaints</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${complainer.color}`}>{complainer.type}</span>
                  </div>
                ))}
                <button className="text-[10px] font-bold text-blue-600 hover:underline mt-2 block">View all complainers →</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL */}"""

# We replace everything from {/* Right Column (Span 1) */} to {/* RESOLUTION MODAL */}
pattern = re.compile(r'\{\/\*\s*Right Column \(Span 1\)\s*\*\/\}.*?\{\/\*\s*RESOLUTION MODAL\s*\*\/\}', re.DOTALL)
new_content = pattern.sub(replacement, content)

with open(filepath, 'w') as f:
    f.write(new_content)

print("Updated Right Column with insights.")
