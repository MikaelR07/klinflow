const fs = require('fs');

let file = fs.readFileSync('apps/agent/src/pages/admin/FleetFinance.tsx', 'utf8');

// The new imports we need for LineChart
const importRechartsLine = "import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';";

file = file.replace(/import \{ PieChart.*?\} from 'recharts';/, importRechartsLine);

// Ensure we have LineChartIcon imported
if (!file.includes('LineChart as LineChartIcon')) {
  file = file.replace('PieChart as PieChartIcon', 'PieChart as PieChartIcon,\n  LineChart as LineChartIcon,\n  TrendingDown');
}

// Add mock data for Cash Flow Overview right after the imports
const mockDataString = `
const CASH_FLOW_MOCK_DATA = [
  { date: 'May 12', sent: 120000, bought: 85000 },
  { date: 'May 17', sent: 150000, bought: 110000 },
  { date: 'May 22', sent: 210000, bought: 140000 },
  { date: 'May 27', sent: 180000, bought: 160000 },
  { date: 'Jun 1', sent: 250000, bought: 220000 },
  { date: 'Jun 6', sent: 280000, bought: 260000 },
  { date: 'Jun 12', sent: 310000, bought: 290000 },
];
`;

if (!file.includes('CASH_FLOW_MOCK_DATA')) {
  file = file.replace('const COLORS =', mockDataString + '\nconst COLORS =');
}

// Extract components we want to keep
const pieChartMatch = file.match(/{\/\* Material Spend Breakdown Chart \*\/}.*?<\/ResponsiveContainer>.*?<\/div>\s*<\/div>/s);
let pieChartBlock = pieChartMatch ? pieChartMatch[0] : '';
// The old pie chart block had a wrapper <div> we need to adapt for the new grid. Let's adapt it.
pieChartBlock = pieChartBlock.replace(/bg-white dark:bg-slate-800\/60 rounded-\[1rem\] p-5 shadow-sm border border-slate-200 dark:border-slate-700/, 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm h-full flex flex-col');
pieChartBlock = pieChartBlock.replace(/h-\[250px\] w-full relative/, 'flex-1 min-h-[250px] w-full relative');

const pendingMatch = file.match(/{\/\* Pending Fund Requests \*\/}.*?<\/AnimatePresence>.*?<\/div>\s*<\/div>/s);
let pendingBlock = pendingMatch ? pendingMatch[0] : '';
pendingBlock = pendingBlock.replace(/bg-white dark:bg-slate-800\/60 rounded-\[1rem\] p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col/, 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full');

const transactionsMatch = file.match(/{\/\* Recent Transactions Ledger \*\/}.*?<\/div>\s*<\/div>\s*<\/div>/s);
let transactionsBlock = transactionsMatch ? transactionsMatch[0] : '';
// Strip out the last </div> that belonged to the main page wrapper
transactionsBlock = transactionsBlock.replace(/<\/div>\s*$/, '');
transactionsBlock = transactionsBlock.replace(/bg-white dark:bg-slate-800\/60 rounded-\[1rem\] p-5 shadow-sm border border-slate-200 dark:border-slate-700/, 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col h-full');


// Construct new render method
const newRender = `
  return (
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
            <Activity className={\`w-3.5 h-3.5 \${isLoading ? 'animate-spin' : ''}\`} /> Export
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
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => \`\${val / 1000}k\`} />
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
           ${pieChartBlock}
         </div>

         <div className="h-[400px]">
           ${pendingBlock}
         </div>
      </div>

      {/* ── THIRD ROW: 2 CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            ${transactionsBlock}
         </div>

         <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-bold text-slate-900 dark:text-white">Spend Insights</h3>
               <button className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1">View insights <ArrowUpRight className="w-3 h-3"/></button>
            </div>
            
            <div className="space-y-5">
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                   <TrendingDown className="w-4 h-4" />
                 </div>
                 <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Material spend decreased by 6%</h4>
                   <p className="text-[11px] text-slate-500 font-medium">You spent KES {totalSpentOnMaterials.toLocaleString()} this month, mainly on plastics.</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                   <TrendingUp className="w-4 h-4" />
                 </div>
                 <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">Plastic prices trending up</h4>
                   <p className="text-[11px] text-slate-500 font-medium">PET price increased by 12% in the last 14 days.</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                   <Activity className="w-4 h-4" />
                 </div>
                 <div>
                   <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">3 payments awaiting approval</h4>
                   <p className="text-[11px] text-slate-500 font-medium">Total pending amount: KES {requests.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}</p>
                 </div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
`;

// Replace the return block entirely
file = file.substring(0, file.indexOf('  return (')) + newRender;

fs.writeFileSync('apps/agent/src/pages/admin/FleetFinance.tsx', file);
console.log("Patched FleetFinance.tsx successfully");
