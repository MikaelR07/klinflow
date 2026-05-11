import { X, Activity, Wind, Droplets, QrCode } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useIotStore } from '@cleanflow/core';
import { toast } from "sonner";

export default function IotDetailModal({ show, onClose, item, type }) {
  const disposeAtBin = useIotStore((state) => state.disposeAtBin);

  if (!show || !item) return null;

  const isBin = type === "bin";
  const isAir = type === "air";
  const isWater = type === "water";

  const handleDispose = () => {
    disposeAtBin(item.id);
    toast.success("Disposal Successful!", {
      description: "You've earned 5 Green Points for using the smart bin.",
      icon: "🎉"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden mt-safe pb-safe-bottom animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 border-t dark:border-slate-800">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isBin ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
              isAir ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
              'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400'
            }`}>
              {isBin && <Activity className="w-5 h-5" />}
              {isAir && <Wind className="w-5 h-5" />}
              {isWater && <Droplets className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 dark:text-white">
                {isBin ? item.name : isAir ? (item.name || "Air Quality Sensor") : (item.name || "Wastewater Monitor")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                {isBin ? item.location : isAir ? "Estate Wide" : "Central Plant"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 bg-white dark:bg-slate-800 rounded-full shadow-sm transition-colors border dark:border-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          
          {/* AI Insight Section */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 mb-6 border border-primary/10 dark:border-primary/20">
            <div className="flex items-center gap-2 text-primary dark:text-primary-light font-semibold text-sm mb-2 uppercase tracking-tight">
              <Activity className="w-4 h-4" /> AI Insight
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isBin && (item.aiRecommended 
                ? "This bin is nearing its optimal collection capacity. Disposing now helps optimize collection routes!"
                : "This bin has plenty of space. No immediate action required.")}
              {isAir && item.aiInsight}
              {isWater && item.aiTip}
            </p>
          </div>

          {/* Type Specific Data */}
          {isBin && (
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span className="text-slate-600">Current Fill Level</span>
                  <span className="text-slate-800">{item.fillLevel}%</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${item.fillLevel}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Waste Composition</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">Organic</p>
                    <p className="text-xl font-semibold text-green-700">{item.breakdown.organic}%</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Recyclable</p>
                    <p className="text-xl font-semibold text-blue-700">{item.breakdown.recyclable}%</p>
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Other</p>
                    <p className="text-xl font-semibold text-slate-700">{item.breakdown.other}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAir && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Current AQI</p>
                  <p className="text-4xl font-semibold text-slate-800">{item.aqi}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-500">Odour Level</p>
                  <p className="text-lg font-semibold text-blue-600">{item.odourLevel}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <p className="text-sm font-medium text-slate-700 mb-4">24 Hour Trend</p>
                <div className="h-48 w-full bg-slate-50 rounded-xl p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={item.trend}>
                      <defs>
                        <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'currentColor'}} className="text-slate-400 dark:text-slate-600" />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'currentColor'}} className="text-slate-400 dark:text-slate-600" width={30} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12xl', border: 'none', backgroundColor: 'var(--tw-slate-900)', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px' }}
                      />
                      <Area type="monotone" dataKey="aqi" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAqi)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {isWater && (
            <div className="space-y-6">
               <div className="flex flex-col items-center justify-center py-6">
                <div className="w-32 h-32 rounded-full border-8 border-emerald-100 flex items-center justify-center mb-4">
                  <div className="text-3xl font-semibold text-emerald-600">{item.efficiency}%</div>
                </div>
                <p className="text-slate-600 font-medium">Treatment Efficiency</p>
               </div>
               
               <div className="bg-slate-50 rounded-xl p-4 grid gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">System Status</span>
                    <span className="font-semibold text-slate-800">{item.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Last Maintenance</span>
                    <span className="font-semibold text-slate-800">{item.lastMaintenance}</span>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Action Button for Bins */}
        {isBin && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <button 
              onClick={handleDispose}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5"
            >
              <QrCode className="w-5 h-5" />
              Scan & Dispose Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
