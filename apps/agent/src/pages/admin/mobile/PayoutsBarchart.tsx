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
    <div className="bg-blue-600 rounded-2xl shadow-md p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">
            Payout Trends
          </h3>
          <p className="text-[10px] text-blue-100 mt-0.5">
            {chartView === 'daily' ? 'Mon – Sun, this week' : 'Last 8 weeks'}
          </p>
        </div>
        <div className="flex bg-blue-700/50 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setChartView('daily')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              chartView === 'daily'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setChartView('weekly')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              chartView === 'weekly'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart
            data={activeChartData}
            margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="0"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#bfdbfe', fontWeight: 600 }}
              dy={6}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#bfdbfe', fontWeight: 600 }}
              tickFormatter={(val) => `${val/1000}K`}
              tickCount={4}
            />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                borderRadius: '10px',
                fontSize: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '8px 12px',
                backgroundColor: '#1e3a8a',
                color: 'white',
              }}
              itemStyle={{ color: 'white' }}
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
                    fill={entry.payouts === maxPayout ? '#ffffff' : 'rgba(255,255,255,0.4)'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
        <div className="text-center border-r border-white/10">
          <p className="text-[10px] font-bold text-blue-200 mb-0.5">Highest</p>
          <p className="text-[13px] font-black text-white"><span className="text-[9px] text-blue-200 mr-0.5">KES</span>{maxPayout.toLocaleString()}</p>
        </div>
        <div className="text-center border-r border-white/10">
          <p className="text-[10px] font-bold text-blue-200 mb-0.5">Lowest</p>
          <p className="text-[13px] font-black text-white"><span className="text-[9px] text-blue-200 mr-0.5">KES</span>{minPayout.toLocaleString()}</p>
          
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-blue-200 mb-0.5">Average</p>
          <p className="text-[13px] font-black text-white"><span className="text-[9px] text-blue-200 mr-0.5">KES</span>{avgPayout.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}