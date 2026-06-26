const fs = require('fs');

let file = fs.readFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', 'utf8');

// 1. Add X icon
file = file.replace('Activity', 'Activity, X');

// 2. Extract AI Market Signals
const aiStart = file.indexOf('            {/* AI Market Signals */}');
const aiEnd = file.indexOf('            </div>\n\n          </div>\n        </div>', aiStart);
if (aiStart === -1 || aiEnd === -1) {
  console.log("Could not find AI Market Signals");
  process.exit(1);
}

// Remove from sidebar
file = file.substring(0, aiStart) + file.substring(aiEnd);

// 3. Insert Bottom Section
const bottomSection = `
            {/* BOTTOM SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Material Details Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 flex flex-col">
                <div className="flex items-start justify-between mb-5 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                       <Box className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                         PET Plastic <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">HIGH DEMAND</span>
                       </h3>
                       <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Polyethylene Terephthalate</p>
                     </div>
                   </div>
                   <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                     <X className="w-4 h-4" />
                   </button>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-700/50 mb-4 overflow-x-auto no-scrollbar pb-1">
                  <button className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500 pb-2 whitespace-nowrap">Overview</button>
                  <button className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Price Trend</button>
                  <button className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Buyers</button>
                  <button className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">Supply</button>
                  <button className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 pb-2 whitespace-nowrap">News</button>
                </div>

                {/* Price and Metrics */}
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">KES 68.00 <span className="text-xs text-slate-500 font-bold">/kg</span></h4>
                    <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1"><TrendingUp className="w-3.5 h-3.5" /> +12.4% (7D)</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-400 mb-1">Demand</p>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 block">HIGH</span>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold text-slate-400 mb-1">Supply</p>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 block">LOW</span>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-[9px] font-bold text-slate-400 mb-1">Active Buyers</p>
                      <span className="text-xs font-black text-slate-900 dark:text-white block">12</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 mb-1">Forecast (14D)</p>
                      <p className="text-xs font-black text-slate-900 dark:text-white block">KES 72.00</p>
                    </div>
                  </div>
                </div>

                {/* Chart Mockup */}
                <div className="flex-1 min-h-[120px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 p-2">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={generateSparkline(20, 'up')}>
                       <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                     </AreaChart>
                   </ResponsiveContainer>
                </div>
              </div>

              {/* AI Market Signals Card (Horizontal format) */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-5 flex flex-col">
                <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" /> AI Market Signals
                  </h3>
                  <button className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1 transition-colors">
                    View all <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MOCK_AI_SIGNALS.map((signal, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className={\`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 \${signal.type === 'up' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-500' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-500'}\`}>
                        {signal.type === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug font-medium">
                          <span className="font-bold text-slate-900 dark:text-white">{signal.material}</span> {signal.text}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-2">{signal.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
`;

// Find where to insert (after materials table)
const tableEnd = file.indexOf('            </div>\n\n          </div>\n\n          {/* SIDEBAR (RIGHT) */}');
if (tableEnd === -1) {
  console.log("Could not find table end");
  process.exit(1);
}

file = file.substring(0, tableEnd) + bottomSection + file.substring(tableEnd);

fs.writeFileSync('apps/agent/src/pages/admin/MarketIntelligence.tsx', file);
console.log('Done');
