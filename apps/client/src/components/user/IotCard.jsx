import { Activity, Wind, Droplets, Info, Zap } from "lucide-react";

export default function IotCard({ item, type, onClick }) {
  // Configs based on device type
  const isBin = type === "bin";
  const isAir = type === "air";
  const isWater = type === "water";

  const getStatusColor = () => {
    if (isBin) {
      if (item.fillLevel < 60) return "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20";
      if (item.fillLevel < 85) return "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20";
      return "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20";
    }
    if (isAir) {
      if (item.aqi <= 50) return "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20";
      if (item.aqi <= 100) return "text-amber-500 bg-amber-500/10 dark:bg-amber-500/20";
      return "text-rose-500 bg-rose-500/10 dark:bg-rose-500/20";
    }
    if (isWater) {
      return "text-blue-500 bg-blue-500/10 dark:bg-blue-500/20";
    }
    return "text-slate-500 bg-slate-500/10";
  };

  const statusStyle = getStatusColor();

  return (
    <div 
      onClick={() => onClick(item, type)}
      className="card p-5 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800/50 shadow-xl shadow-slate-200/40 dark:shadow-none"
    >
      {/* AI Recommended Badge */}
      {isBin && item.aiRecommended && (
        <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
          <Zap className="w-2.5 h-2.5 fill-white" /> AI Optimal
        </div>
      )}
      {(isAir && item.aqi > 100) && (
        <div className="absolute top-0 right-0 bg-rose-500 text-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest rounded-bl-xl flex items-center gap-1.5 shadow-lg shadow-rose-500/20 animate-pulse">
          Alert Active
        </div>
      )}

      <div className="flex items-start gap-4 mb-5">
        <div className={`p-3.5 rounded-2xl ${statusStyle} transition-transform group-hover:scale-110 duration-300`}>
          {isBin && <Activity className="w-6 h-6" />}
          {isAir && <Wind className="w-6 h-6" />}
          {isWater && <Droplets className="w-6 h-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 dark:text-white truncate leading-tight transition-colors group-hover:text-primary">
            {isBin ? item.name : isAir ? (item.name || "Station Alpha") : (item.name || "Flow Meter")}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 mt-1">
            {isBin ? (item.location || 'Linked Node') : isAir ? `Odour: ${item.odourLevel}` : (item.status || 'Monitoring')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isBin && (
          <div>
            <div className="flex justify-between items-end text-xs font-semibold uppercase tracking-widest mb-2 font-medium">
              <span className="text-slate-400">Capacity Load</span>
              <span className={item.fillLevel > 85 ? "text-rose-500" : "text-slate-600 dark:text-slate-300"}>{item.fillLevel}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border dark:border-slate-700">
              <div 
                className={`h-full transition-all duration-1000 rounded-full ${
                  item.fillLevel < 60 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                  item.fillLevel < 85 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                  'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                }`}
                style={{ width: `${item.fillLevel}%` }}
              />
            </div>
          </div>
        )}

        {isAir && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Live AQI Index</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-semibold ${statusStyle.split(' ')[0]}`}>{item.aqi}</span>
                <span className="text-xs font-semibold text-slate-400">PM2.5</span>
              </div>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group-hover:bg-primary/10 transition-colors">
              <Info className="w-4 h-4 text-slate-300 group-hover:text-primary" />
            </div>
          </div>
        )}

        {isWater && (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Efficiency Ratio</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold text-blue-500">{item.efficiency}%</span>
                <span className="text-xs font-semibold text-slate-400">Purity</span>
              </div>
            </div>
            <div className="text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-100 dark:border-blue-800">
               Live
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
