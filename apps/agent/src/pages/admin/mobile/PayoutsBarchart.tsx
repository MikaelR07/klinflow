import { useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Cell } from 'recharts';

export default function PayoutsBarchart() {
  const [chartView, setChartView] = useState('daily');
  
  const dailyData = [
    { name: 'Mon', payouts: 4200 },
    { name: 'Tue', payouts: 3100 },
    { name: 'Wed', payouts: 6400 },
    { name: 'Thu', payouts: 4800 },
    { name: 'Fri', payouts: 2700 },
    { name: 'Sat', payouts: 3600 },
    { name: 'Sun', payouts: 5000 },
  ];

  const weeklyData = [
    { name: 'W1', payouts: 28000 },
    { name: 'W2', payouts: 32000 },
    { name: 'W3', payouts: 35000 },
    { name: 'W4', payouts: 31000 },
    { name: 'W5', payouts: 38000 },
    { name: 'W6', payouts: 40000 },
    { name: 'W7', payouts: 39000 },
    { name: 'W8', payouts: 42000 },
  ];

  const activeChartData = chartView === 'daily' ? dailyData : weeklyData;

  const maxPayout = Math.max(...activeChartData.map(d => d.payouts));
  const minPayout = Math.min(...activeChartData.map(d => d.payouts));
  const avgPayout = Math.round(activeChartData.reduce((acc, curr) => acc + curr.payouts, 0) / activeChartData.length);

  return (
    <div className="bg-[#F8F8FF] dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">
            Payout Trends
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {chartView === 'daily' ? 'Mon – Sun, this week' : 'Last 8 weeks'}
          </p>
        </div>
        <div className="flex bg-slate-50 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setChartView('daily')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              chartView === 'daily'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setChartView('weekly')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              chartView === 'weekly'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={activeChartData}
            margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              vertical={false}
              stroke="#f1f5f9"
              strokeDasharray="0"
              className="dark:[&>line]:stroke-slate-800"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }}
              tickFormatter={(val) => `${val/1000}K`}
              tickCount={4}
            />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                borderRadius: '10px',
                fontSize: '12px',
                border: '0.5px solid #e2e8f0',
                boxShadow: 'none',
                padding: '8px 12px',
                backgroundColor: 'white',
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Payout']}
            />
            <Bar
              dataKey="payouts"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            >
              {activeChartData.map((entry, index) => {
                return (
                  <Cell
                    key={index}
                    fill={entry.payouts === maxPayout ? '#059669' : '#34d399'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 mb-0.5">Highest</p>
          <p className="text-[13px] font-black text-slate-800 dark:text-white"><span className="text-[9px] text-slate-500 mr-0.5">KES</span>{maxPayout.toLocaleString()}</p>
          <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Peak</p>
        </div>
        <div className="text-center border-r border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-bold text-slate-400 mb-0.5">Lowest</p>
          <p className="text-[13px] font-black text-slate-800 dark:text-white"><span className="text-[9px] text-slate-500 mr-0.5">KES</span>{minPayout.toLocaleString()}</p>
          <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-0.5">Min</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] font-bold text-slate-400 mb-0.5">Average</p>
          <p className="text-[13px] font-black text-slate-800 dark:text-white"><span className="text-[9px] text-slate-500 mr-0.5">KES</span>{avgPayout.toLocaleString()}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{chartView === 'daily' ? 'This week' : 'Last 8 wks'}</p>
        </div>
      </div>
    </div>
  );
}