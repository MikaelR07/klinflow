import { useEffect, useState, useMemo, Fragment } from 'react';
import { 
  Building2, TrendingUp, Scale, Package,
  Loader2, CheckCircle2, BadgeCheck, BarChart3,
  Award, Zap, Users, Target, Activity
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
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-purple-500', 'bg-sky-500',
  'bg-orange-500', 'bg-teal-500'
];

export default function CompanyMetrics() {
  const [companies, setCompanies] = useState([]);
  const [bookingStats, setBookingStats] = useState({});
  const [fleetCounts, setFleetCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);
  const [sortBy, setSortBy] = useState('weight');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);

    // 1. Fetch all company admins
    const { data: companyData } = await supabase
      .from('profiles')
      .select('id, name, phone, company_name, is_online, is_verified, service_profile, created_at')
      .eq('agent_account_type', 'company_admin')
      .order('created_at', { ascending: false });

    // 2. Fetch all fleet drivers to count per company and get their booking stats
    const { data: fleetDrivers } = await supabase
      .from('profiles')
      .select('id, company_id')
      .eq('agent_account_type', 'fleet_driver');

    // 3. Fetch all completed bookings (we'll match via fleet driver IDs)
    const { data: bookings } = await supabase
      .from('bookings')
      .select('agent_id, actual_weight_kg, fee, status');

    // Build fleet count and driver ID set per company
    const fleetMap = {};
    const driverToCompany = {};
    (fleetDrivers || []).forEach(d => {
      if (!d.company_id) return;
      fleetMap[d.company_id] = (fleetMap[d.company_id] || 0) + 1;
      driverToCompany[d.id] = d.company_id;
    });

    // Aggregate booking stats per company (through drivers)
    const statsMap = {};
    (bookings || []).forEach(b => {
      const companyId = driverToCompany[b.agent_id];
      const key = companyId || b.agent_id; // fallback to direct if company_admin did job
      if (!key) return;
      if (!statsMap[key]) statsMap[key] = { total: 0, completed: 0, cancelled: 0, weight: 0, revenue: 0 };
      statsMap[key].total++;
      if (b.status === 'completed') {
        statsMap[key].completed++;
        statsMap[key].weight += b.actual_weight_kg || 0;
        statsMap[key].revenue += b.fee || 0;
      }
      if (b.status === 'cancelled') statsMap[key].cancelled++;
    });

    setCompanies(companyData || []);
    setBookingStats(statsMap);
    setFleetCounts(fleetMap);
    setLoading(false);
  };

  // ── Derived Analytics ──────────────────────────────────────────────
  const totalWeight = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.weight, 0), [bookingStats]);
  const totalRevenue = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.revenue, 0), [bookingStats]);
  const totalJobs = useMemo(() => Object.values(bookingStats).reduce((s, b) => s + b.completed, 0), [bookingStats]);
  const totalFleetSize = useMemo(() => Object.values(fleetCounts).reduce((s, c) => s + c, 0), [fleetCounts]);

  // Category coverage across companies
  const categoryCoverage = useMemo(() => {
    const counts = {};
    companies.forEach(company => {
      const cats = company.service_profile?.categories || [];
      cats.forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name: MATERIAL_LABELS[name] || name, count,
        pct: companies.length > 0 ? Math.round((count / companies.length) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  // Fleet efficiency per company: jobs per driver
  const fleetEfficiency = useMemo(() => {
    return companies.map(c => {
      const stats = bookingStats[c.id] || {};
      const drivers = fleetCounts[c.id] || 1;
      return {
        name: c.company_name || c.name,
        efficiency: drivers > 0 ? ((stats.completed || 0) / drivers).toFixed(1) : '0'
      };
    }).sort((a, b) => parseFloat(b.efficiency) - parseFloat(a.efficiency)).slice(0, 6);
  }, [companies, bookingStats, fleetCounts]);

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const sa = bookingStats[a.id] || {};
      const sb = bookingStats[b.id] || {};
      if (sortBy === 'weight') return (sb.weight || 0) - (sa.weight || 0);
      if (sortBy === 'jobs') return (sb.completed || 0) - (sa.completed || 0);
      if (sortBy === 'revenue') return (sb.revenue || 0) - (sa.revenue || 0);
      if (sortBy === 'fleet') return (fleetCounts[b.id] || 0) - (fleetCounts[a.id] || 0);
      return 0;
    });
  }, [companies, bookingStats, fleetCounts, sortBy]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in pb-20">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mb-20" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-indigo-400" />
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-400">PaaS Intelligence</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Company Analytics</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-md">
              Live operational intelligence for all corporate tenants and their fleets on the CleanFlow network.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 shrink-0">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Companies</p>
              <p className="text-3xl font-semibold">{companies.length}</p>
            </div>
            <div className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Fleet</p>
              <p className="text-3xl font-semibold text-indigo-400">{totalFleetSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Weight Recovered', value: `${totalWeight.toFixed(1)} KG`, icon: Package, sub: 'via fleet drivers' },
          { label: 'Total Revenue Generated', value: `KSh ${totalRevenue.toLocaleString()}`, icon: TrendingUp, sub: 'platform commissions' },
          { label: 'Completed Jobs', value: totalJobs, icon: CheckCircle2, sub: 'all companies combined' },
          { label: 'Total Fleet Drivers', value: totalFleetSize, icon: Users, sub: 'across all tenants' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <kpi.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white leading-none">{kpi.value}</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── TWO COLUMN: Category Coverage + Fleet Efficiency ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Category Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-base font-semibold dark:text-white">Category Coverage</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">% of companies covering each material</p>
            </div>
          </div>
          <div className="space-y-3">
            {categoryCoverage.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No service profile data yet.</p>
            ) : categoryCoverage.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold dark:text-white">{cat.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400">{cat.count} companies</span>
                    <span className="text-xs font-semibold text-indigo-500">{cat.pct}%</span>
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
        </div>

        {/* Fleet Efficiency */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-base font-semibold dark:text-white">Fleet Efficiency</h3>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Completed jobs per driver (top 6)</p>
            </div>
          </div>
          <div className="space-y-3">
            {fleetEfficiency.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No booking data yet.</p>
            ) : fleetEfficiency.map((row, i) => {
              const maxEff = parseFloat(fleetEfficiency[0]?.efficiency || 1);
              const pct = maxEff > 0 ? Math.round((parseFloat(row.efficiency) / maxEff) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold dark:text-white truncate max-w-[180px]">{row.name}</span>
                    <span className="text-xs font-semibold text-amber-500">{row.efficiency} jobs/driver</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── COMPANY LEADERBOARD ── */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-semibold dark:text-white tracking-tight">Company Leaderboard</h2>
            <div className="h-px w-16 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{companies.length} Tenants</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'weight', label: 'By Weight' },
              { key: 'revenue', label: 'By Revenue' },
              { key: 'jobs', label: 'By Jobs' },
              { key: 'fleet', label: 'By Fleet' },
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
                {['Rank', 'Company', 'Status', 'Fleet', 'Weight (KG)', 'Revenue (KSh)', 'Jobs', 'Success Rate', 'Capacity', 'Verified'].map(h => (
                  <th key={h} className="px-6 py-5 text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {sortedCompanies.length === 0 ? (
                <tr><td colSpan="10" className="px-8 py-16 text-center text-slate-400 text-sm">No companies found.</td></tr>
              ) : sortedCompanies.map((company, idx) => {
                const stats = bookingStats[company.id] || { total: 0, completed: 0, cancelled: 0, weight: 0, revenue: 0 };
                const successRate = stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(0) : '—';
                const drivers = fleetCounts[company.id] || 0;
                const isExpanded = expandedRow === company.id;

                return (
                  <Fragment key={company.id}>
                    <tr
                      onClick={() => setExpandedRow(isExpanded ? null : company.id)}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-semibold ${
                          idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>{idx + 1}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold dark:text-white flex items-center gap-2 whitespace-nowrap">
                          {company.company_name || company.name}
                          {company.is_verified && <BadgeCheck className="w-4 h-4 text-indigo-500 shrink-0" />}
                        </p>
                        <p className="text-xs font-semibold text-slate-400 font-mono">{company.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-xs font-semibold uppercase ${
                          company.is_online ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${company.is_online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                          {company.is_online ? 'Active' : 'Offline'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-xl text-xs font-semibold">{drivers} drivers</span>
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
                          <span className="text-indigo-500 font-semibold">{company.service_profile?.min_weight ?? '?'}</span>
                          <span className="text-slate-400"> – </span>
                          <span className="font-semibold dark:text-white">{company.service_profile?.max_weight ?? '?'}</span>
                          <span className="text-slate-400"> KG</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {company.is_verified ? (
                          <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-semibold uppercase">Verified</span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-xl text-xs font-semibold uppercase">Pending</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Row: Service Profile Categories */}
                    {isExpanded && (
                      <tr key={`${company.id}-exp`} className="bg-slate-50/70 dark:bg-slate-800/40">
                        <td colSpan="10" className="px-8 py-5">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Declared Service Categories</p>
                              <div className="flex flex-wrap gap-2">
                                {(company.service_profile?.categories || []).length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">No categories declared.</p>
                                ) : company.service_profile.categories.map((cat, i) => (
                                  <span key={i} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 rounded-xl text-xs font-semibold uppercase">
                                    {MATERIAL_LABELS[cat.name] || cat.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Fleet Efficiency</p>
                              <p className="text-2xl font-semibold text-amber-500">
                                {drivers > 0 ? (stats.completed / drivers).toFixed(1) : '0'}
                                <span className="text-sm font-semibold text-slate-400 ml-1">jobs/driver</span>
                              </p>
                            </div>
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
