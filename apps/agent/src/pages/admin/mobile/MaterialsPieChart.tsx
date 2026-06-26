import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#ffa200ff', '#8B5CF6'];
// Visualization Data
  const materialsCollectedData = [
    { name: 'Plastic', value: 400, color: '#10B981' },
    { name: 'Metal', value: 300, color: '#3B82F6' },
    { name: 'Paper', value: 300, color: '#ffa200ff' },
    { name: 'Organic', value: 200, color: '#8B5CF6' },
  ];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = materialsCollectedData.reduce((s: number, d: any) => s + d.value, 0);
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-3 py-2 text-xs shadow-none">
      <p className="font-medium text-slate-800 dark:text-slate-100">{item.name}</p>
      <p className="text-slate-500 mt-0.5">
        {item.value} kg &nbsp;·&nbsp;
        <span className="font-medium text-slate-700 dark:text-slate-200">
          {Math.round((item.value / total) * 100)}%
        </span>
      </p>
    </div>
  );
};



export function MaterialsPieChart() {
  const total = materialsCollectedData.reduce((s, d) => s + d.value, 0);
  const top = materialsCollectedData.reduce((a, b) => a.value > b.value ? a : b);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <div className="bg-emerald-800  rounded-xl border border-slate-100 dark:border-slate-800 p-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white dark:text-slate-100">
            Materials Collected
          </h3>
          <p className="text-[11px] text-slate-200 ">By weight (kg)</p>
        </div>
        
      </div>

      {/* Chart + Legend */}
      <div className="flex items-center gap-4">
        <div className="w-[200px] h-[200px] flex-shrink-0 relative">
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xl font-black text-white leading-none">{total >= 1000 ? `${(total/1000).toFixed(1)}k` : total}</p>
            <p className="text-[10px] text-emerald-100 mt-0.5 font-medium">Total kg</p>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={materialsCollectedData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={96}
                paddingAngle={1.5}
                dataKey="value"
                stroke="none"
                onMouseEnter={(_, i) => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                labelLine={false}
              >
                {materialsCollectedData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                    opacity={activeIdx === null || activeIdx === index ? 1 : 0.35}
                    style={{ transition: 'opacity 0.15s', cursor: 'pointer' }}
                  />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 flex flex-col gap-2 items-end">
          {materialsCollectedData.map((item, i) => {
            const pct = Math.round((item.value / total) * 100);
            return (
              <div
                key={i}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 border transition-all cursor-pointer w-full justify-end ${
                  activeIdx === i
                    ? 'bg-emerald-600  border-emerald-600'
                    : 'border-transparent'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <div className="min-w-0 text-right">
                  <p className="text-[11px] font-medium text-white dark:text-slate-400 truncate">
                    {item.name}
                  </p>
                  <p className="text-[13px] font-medium text-white dark:text-slate-100 leading-tight">
                    {item.value.toLocaleString()} <span className="text-[10px] text-slate-200 dark:text-slate-400 font-normal">kg</span>
                    <span className="text-[10px] text-slate-200 dark:text-slate-400 font-normal ml-1">{pct}%</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}