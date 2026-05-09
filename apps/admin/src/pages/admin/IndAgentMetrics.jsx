import { useEffect, useState, useMemo, Fragment } from 'react';
import { 
  UserCheck, TrendingUp, Scale, Package, 
  Loader2, CheckCircle2, XCircle, Star,
  ChevronDown, ChevronUp, Award, BarChart3,
  Tag, Zap, Target, Activity
} from 'lucide-react';
import { supabase } from '@cleanflow/core';

const MATERIAL_LABELS = {
  recyclable: 'Recyclables',
  ewaste: 'E-Waste',
  organic: 'Organic',
  hazardous: 'Hazardous',
  metal: 'Metal',
  glass: 'Glass',
  plastic: 'Plastic',
  paper: 'Paper',
};

const CATEGORY_COLORS = [
  'bg-emerald-500', 'bg-indigo-500', 'bg-amber-500',
  'bg-rose-500', 'bg-purple-500', 'bg-sky-500',
  'bg-orange-500', 'bg-teal-500'
];

export default function IndAgentMetrics() {
  const [agents, setAgents] = useState([]);
  const [bookingStats, setBookingStats] = useState({});
  const [agentConfigs, setAgentConfigs] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortBy, setSortBy] = useState('weight'); // 'weight' | 'jobs' | 'revenue'

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    // 1. Fetch all independent agents
    const { data: agentData } = await supabase
      .from('profiles')
      .select('id, name, phone, is_online, is_verified, service_profile, created_at')
      .eq('agent_account_type', 'independent')
      .order('created_at', { ascending: false });

    // 2. Fetch booking stats per agent (all bookings)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('agent_id, actual_weight_kg, fee, status');

    // 3. Fetch agent configs for pricing data
    const { data: configs } = await supabase
      .from('agent_configurations')
      .select('agent_id, accepted_materials, custom_rates');

    // Process booking stats per agent
    const statsMap = {};
    (bookings || []).forEach(b => {
      if (!b.agent_id) return;
      if (!statsMap[b.agent_id]) {
        statsMap[b.agent_id] = { total: 0, completed: 0, cancelled: 0, weight: 0, revenue: 0 };
      }
      statsMap[b.agent_id].total++;
      if (b.status === 'completed') {
        statsMap[b.agent_id].completed++;
        statsMap[b.agent_id].weight += b.actual_weight_kg || 0;
        statsMap[b.agent_id].revenue += b.fee || 0;
      }
      if (b.status === 'cancelled') statsMap[b.agent_id].cancelled++;
    });

    // Process configs into map
    const configMap = {};
    (configs || []).forEach(c => { configMap[c.agent_id] = c; });

    setAgents(agentData || []);
    setBookingStats(statsMap);
    setAgentConfigs(configMap);
    setLoading(false);
  };

  // ── Derived Analytics ──────────────────────────────────────────────
  const totalWeight = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.weight, 0), [bookingStats]);
  const totalRevenue = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.revenue, 0), [bookingStats]);
  const totalJobs = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.completed, 0), [bookingStats]);
  const avgSuccessRate = useMemo(() => {
    const rates = Object.values(bookingStats).filter(b => b.total > 0).map(b => b.completed / b.total);
    return rates.length ? (rates.reduce((s, r) => s + r, 0) / rates.length) * 100 : 0;
  }, [bookingStats]);

  // Category coverage: how many agents declared each category
  const categoryCoverage = useMemo(() => {
    const counts = {};
    agents.forEach(agent => {
      const cats = agent.service_profile?.categories || [];
      const config = agentConfigs[agent.id];
      const legacyMats = config?.accepted_materials || [];
      const allCats = [...new Set([...cats.map(c => c.name), ...legacyMats])];
      allCats.forEach(c => { counts[c] = (counts[c] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name: MATERIAL_LABELS[name] || name, count, pct: agents.length > 0 ? Math.round((count / agents.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [agents, agentConfigs]);

  // Pricing intelligence: min/avg/max per material across all agents
  const pricingIntel = useMemo(() => {
    const rates = {};
    Object.values(agentConfigs).forEach(cfg => {
      Object.entries(cfg.custom_rates || {}).forEach(([slug, rate]) => {
        const key = MATERIAL_LABELS[slug] || slug;
        if (!rates[key]) rates[key] = [];
        if (rate > 0) rates[key].push(rate);
      });
    });
    return Object.entries(rates)
      .filter(([, arr]) => arr.length > 0)
      .map(([name, arr]) => ({
        name,
        min: Math.min(...arr),
        max: Math.max(...arr),
        avg: arr.reduce((s, v) => s + v, 0) / arr.length,
        count: arr.length
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [agentConfigs]);

  // Custom catalog adoption
  const customCatalogCount = agents.filter(a => (a.service_profile?.custom_services?.length || 0) > 0).length;

  // Sorted agents
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const sa = bookingStats[a.id] || {};
      const sb = bookingStats[b.id] || {};
      if (sortBy === 'weight') return (sb.weight || 0) - (sa.weight || 0);
      if (sortBy === 'jobs') return (sb.completed || 0) - (sa.completed || 0);
      if (sortBy === 'revenue') return (sb.revenue || 0) - (sa.revenue || 0);
      return 0;
    });
  }, [agents, bookingStats, sortBy]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-400">PaaS Intelligence</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Ind. Agent Analytics</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              Live operational intelligence for all independent freelance agents on the CleanFlow network.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Agents</p>
              <p className="text-3xl font-semibold">{agents.length}</p>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Online Now</p>
              <p className="text-3xl font-semibold text-emerald-400">{agents.filter(a => a.is_online).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Weight Recovered', value: `${totalWeight.toFixed(1)} KG`, icon: Package, accent: 'emerald' },
          { label: 'Total Platform Revenue', value: `KSh ${totalRevenue.toLocaleString()}`, icon: TrendingUp, accent: 'indigo' },
          { label: 'Completed Jobs', value: totalJobs, icon: CheckCircle2, accent: 'green' },
          { label: 'Avg. Success Rate', value: `${avgSuccessRate.toFixed(1)}%`, icon: Target, accent: 'amber' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── TWO COLUMN: Category Coverage + Pricing Intel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-base font-semibold dark:text-white">Category Coverage</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">% of agents declaring each material</p>
            </div>
          </div>
          <div className="space-y-3">
            {categoryCoverage.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No category data yet.</p>
            ) : categoryCoverage.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold dark:text-white">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">{cat.count} agents</span>
                    <span className="text-xs font-semibold text-emerald-500">{cat.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]} rounded-full transition-all duration-700`}
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <p className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold">{customCatalogCount}</span> agent{customCatalogCount !== 1 ? 's' : ''} have built custom subcategory catalogs.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Intelligence */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-semibold dark:text-white">Pricing Intelligence</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Agent market rates per material (KSh/KG)</p>
            </div>
          </div>
          {pricingIntel.length === 0 ? (
            <p className="text-sm text-slate-400 italic text-center py-8">No custom pricing data yet.</p>
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-4 gap-2 pb-2 border-b border-slate-100 dark:border-white/5">
                {['Material', 'Min', 'Avg', 'Max'].map(h => (
                  <p key={h} className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{h}</p>
                ))}
              </div>
              {pricingIntel.map((row, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 py-2.5 border-b border-slate-50 dark:border-white/5 last:border-0">
                  <p className="text-xs font-semibold dark:text-white truncate">{row.name}</p>
                  <p className="text-xs font-semibold text-rose-500">{row.min}</p>
                  <p className="text-xs font-semibold text-amber-500">{row.avg.toFixed(1)}</p>
                  <p className="text-xs font-semibold text-emerald-500">{row.max}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── AGENT LEADERBOARD ── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold dark:text-white tracking-tight">Agent Leaderboard</h2>
            <div className="h-px w-16 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{agents.length} Agents</span>
          </div>
          {/* Sort Controls */}
          <div className="flex gap-2">
            {[
              { key: 'weight', label: 'By Weight' },
              { key: 'jobs', label: 'By Jobs' },
              { key: 'revenue', label: 'By Revenue' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all ${
                  sortBy === s.key ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-50 dark:border-white/5">
                {['Rank', 'Agent', 'Status', 'Materials', 'Weight (KG)', 'Revenue (KSh)', 'Jobs', 'Success Rate', 'Capacity'].map(h => (
                  <th key={h} className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {sortedAgents.length === 0 ? (
                <tr><td colSpan="9" className="p-10 text-center text-slate-400 font-semibold uppercase text-xs tracking-widest italic">No agent data available for this criteria.</td></tr>
              ) : sortedAgents.map((agent, idx) => {
                const stats = bookingStats[agent.id] || { total: 0, completed: 0, cancelled: 0, weight: 0, revenue: 0 };
                const config = agentConfigs[agent.id];
                const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : '—';
                const materials = [
                  ...(agent.service_profile?.categories?.map(c => c.name) || []),
                  ...(config?.accepted_materials || [])
                ];
                const uniqueMats = [...new Set(materials)].slice(0, 3);
                const isExpanded = expandedRow === agent.id;

                return (
                  <Fragment key={agent.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : agent.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold ${
                          idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold dark:text-white whitespace-nowrap">{agent.name}</p>
                        <p className="text-xs font-semibold text-slate-400 font-mono">{agent.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold uppercase ${
                          agent.is_online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${agent.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {agent.is_online ? 'Online' : 'Offline'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {uniqueMats.length === 0 ? <span className="text-xs text-slate-300 italic">None set</span> : uniqueMats.map((m, i) => (
                            <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold uppercase">{MATERIAL_LABELS[m] || m}</span>
                          ))}
                          {materials.length > 3 && <span className="text-xs text-slate-400">+{materials.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-emerald-600">{stats.weight.toFixed(1)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.revenue.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-semibold">{stats.completed}✓</span>
                          <span className="text-rose-400 font-semibold">{stats.cancelled}✗</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${parseFloat(successRate) >= 80 ? 'text-emerald-500' : parseFloat(successRate) >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {successRate}{successRate !== '—' ? '%' : ''}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                          <span className="text-indigo-500 font-semibold">{agent.service_profile?.min_weight ?? '?'}</span>
                          <span className="text-slate-400"> – </span>
                          <span className="font-semibold dark:text-white">{agent.service_profile?.max_weight ?? '?'}</span>
                          <span className="text-slate-400"> KG</span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row: Custom Services */}
                    {isExpanded && (
                      <tr key={`${agent.id}-exp`} className="bg-slate-50/70 dark:bg-slate-800/40">
                        <td colSpan="9" className="px-8 py-5">
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Custom Service Catalog</p>
                            {(agent.service_profile?.custom_services || []).length === 0 ? (
                              <p className="text-xs text-slate-400 italic">No custom categories defined yet.</p>
                            ) : (
                              <div className="flex flex-wrap gap-3">
                                {agent.service_profile.custom_services.map((svc, i) => (
                                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 space-y-2 min-w-[180px]">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl">{svc.icon}</span>
                                      <span className="text-xs font-semibold dark:text-white">{svc.category}</span>
                                    </div>
                                    <div className="space-y-1">
                                      {(svc.subcategories || []).map((sub, j) => (
                                        <div key={j} className="flex items-center justify-between text-xs">
                                          <span className="text-slate-500">{sub.name}</span>
                                          <span className="font-semibold text-emerald-500">KSh {sub.rate_per_kg}/KG</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
