import { useState, useEffect } from 'react';
import { 
  Network, TrendingUp, Users, Target, Activity, Zap, 
  ShieldCheck, RefreshCw, ChevronRight, Map as MapIcon,
  Search, Filter, MoreVertical, Edit2, Save, X, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAssetStore, usePriceStore, MATERIAL_TYPES } from '@cleanflow/core';
import { toast } from 'sonner';

export default function NetworkOracle() {
  const { assets, fetchAssets } = useAssetStore();
  const { prices, fetchPrices, updatePrice, isLoading: pricesLoading } = usePriceStore();
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    fetchAssets();
    fetchPrices();
  }, []);

  const totalMarketValue = assets.reduce((sum, a) => sum + (a.market_value || 0), 0);
  const matchedAssets = assets.filter(a => a.status === 'matched').length;
  const matchRate = assets.length > 0 ? (matchedAssets / assets.length) * 100 : 0;

  const handleSavePrice = async (id) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue <= 0) return toast.error('Invalid Price');
    
    const result = await updatePrice(id, numValue);
    if (result.success) {
      toast.success('Market Rates Propagated');
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Network Oracle</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Network className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Sustainomics Engine</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Control market liquidity and monitor network health.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => fetchPrices()} className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-all">
            <RefreshCw className={`w-5 h-5 text-slate-400 ${pricesLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Oracle KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Market Cap', value: `KSh ${totalMarketValue.toLocaleString()}`, sub: 'Verified Assets', icon: TrendingUp, color: 'emerald' },
          { label: 'Network Match Rate', value: `${matchRate.toFixed(1)}%`, sub: 'Claimed by Weavers', icon: Target, color: 'indigo' },
          { label: 'Active Weavers', value: '124', sub: 'In the last 24h', icon: Users, color: 'blue' },
          { label: 'Liquidity Depth', value: 'High', sub: 'Market confidence', icon: ShieldCheck, color: 'purple' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-600 dark:text-${kpi.color}-400`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <Activity className="w-4 h-4 text-slate-200 dark:text-slate-700 animate-pulse" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</p>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{kpi.value}</h2>
            <p className="text-xs font-semibold text-slate-500 mt-2">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Price Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                Market Rates <span className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full uppercase">KSh/KG</span>
              </h3>
            </div>

            <div className="space-y-4">
              {prices.map((m) => (
                <div key={m.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group hover:border-indigo-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-xl shadow-sm">
                        {MATERIAL_TYPES[m.material_name.toUpperCase()]?.icon || '📦'}
                      </div>
                      <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">{m.material_name}</span>
                    </div>
                    {editingId === m.id ? (
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input 
                          autoFocus
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-12 bg-transparent outline-none font-semibold text-sm text-indigo-600 dark:text-indigo-400 text-right"
                        />
                        <button onClick={() => handleSavePrice(m.id)} className="p-1 text-emerald-500"><Save className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingId(m.id);
                          setEditValue(m.price_per_kg);
                        }}
                        className="text-lg font-semibold text-slate-900 dark:text-white hover:text-indigo-500 transition-colors"
                      >
                        KSh {m.price_per_kg}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-600 uppercase">STABLE</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Database Active</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-medium leading-relaxed">
                  These rates are applied to all AI-verified pickups. Changes are audited and logged in the system master history.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Asset Flow & Activity */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Live Asset Verification Flow</h3>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Throughput in the last 24 hours</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-500' : 'text-slate-400'}`}
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-500' : 'text-slate-400'}`}
                >
                  <Activity className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} debounce={50}>
                <AreaChart data={[
                  { time: '00:00', volume: 120 },
                  { time: '04:00', volume: 80 },
                  { time: '08:00', volume: 250 },
                  { time: '12:00', volume: 450 },
                  { time: '16:00', volume: 380 },
                  { time: '20:00', volume: 290 },
                  { time: '23:59', volume: 150 },
                ]}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorVolume)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Verifications Table */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Audit Log: Recent Assets</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Search assets..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-indigo-500/30 transition-all" />
                </div>
                <button className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl"><Filter className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Asset ID</th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Type</th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Weight</th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Market Value</th>
                    <th className="px-8 py-4 text-xs font-semibold uppercase tracking-widest text-slate-400"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assets.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-8 py-4">
                        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">{a.id}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs">
                            {MATERIAL_TYPES[a.material_type?.toUpperCase()]?.icon || '📦'}
                          </div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase">{a.material_type}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-xs font-semibold text-slate-700 dark:text-slate-300">{a.weight} KG</td>
                      <td className="px-8 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-widest ${
                          a.status === 'matched' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 font-semibold text-xs text-indigo-600 dark:text-indigo-400">KSh {a.market_value?.toLocaleString()}</td>
                      <td className="px-8 py-4 text-right">
                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-slate-400" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <button className="text-xs font-semibold uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                View Full Audit History <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
