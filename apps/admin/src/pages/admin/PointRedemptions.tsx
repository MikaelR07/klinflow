/**
 * PointRedemptions — Admin monitoring dashboard for all point redemptions
 */
import { useState, useEffect, useMemo } from 'react';
import {
  Gift, Search, Filter, Clock,
  CheckCircle2, XCircle, AlertTriangle,
  Landmark, Phone, Loader2, RefreshCw,
  TrendingUp, ArrowDownRight
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';

interface AdminRedemption {
  id: string;
  reference_number: string;
  user_id: string;
  type: string;
  amount: number;
  fee: number;
  net_amount: number;
  kes_equivalent: number;
  status: string;
  payout_method: string;
  payout_details: any;
  failure_reason?: string;
  created_at: string;
  completed_at?: string;
  user?: { name: string; phone: string; klinflow_id: string };
}

export default function PointRedemptions() {
  const [redemptions, setRedemptions] = useState<AdminRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchRedemptions();
  }, [statusFilter, typeFilter]);

  const fetchRedemptions = async () => {
    setIsLoading(true);
    let query = supabase
      .from('point_redemptions')
      .select(`
        *,
        user:profiles!user_id (name, phone, klinflow_id)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (typeFilter !== 'all') query = query.eq('type', typeFilter);

    const { data } = await query;
    if (data) {
      setRedemptions(data.map((d: any) => ({
        ...d,
        user: d.user
      })));
    }
    setIsLoading(false);
  };

  const filteredRedemptions = redemptions.filter(r =>
    r.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.user?.klinflow_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Summary stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayRedemptions = redemptions.filter(r => new Date(r.created_at).toDateString() === today);
    return {
      totalToday: todayRedemptions.length,
      totalPointsToday: todayRedemptions.reduce((sum, r) => sum + r.amount, 0),
      totalKesToday: todayRedemptions.reduce((sum, r) => sum + Number(r.kes_equivalent || 0), 0),
      pendingCount: redemptions.filter(r => r.status === 'pending' || r.status === 'processing').length,
      failedCount: redemptions.filter(r => r.status === 'failed').length,
    };
  }, [redemptions]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
      completed: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
      processing: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
      pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
      failed: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
      rejected: { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-500/10' },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg}`}>
        <Icon className={`w-3 h-3 ${c.color}`} />
        <span className={`text-[9px] font-bold uppercase tracking-wider ${c.color}`}>{status}</span>
      </div>
    );
  };

  const getTypeIcon = (type: string) => {
    if (type === 'money') return <Landmark className="w-4 h-4 text-blue-500" />;
    if (type === 'airtime') return <Phone className="w-4 h-4 text-green-500" />;
    return <Gift className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-500" />
            Point Redemptions
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Monitor all network point redemptions</p>
        </div>
        <button
          onClick={fetchRedemptions}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Today</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.totalToday}</p>
          <p className="text-[10px] text-slate-400 font-semibold">{stats.totalPointsToday.toLocaleString()} GFP</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">KES Value Today</p>
          <p className="text-2xl font-black text-green-600">KES {stats.totalKesToday.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p>
          <p className="text-2xl font-black text-amber-500">{stats.pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Failed</p>
          <p className="text-2xl font-black text-rose-500">{stats.failedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, user name, or Klinflow ID..."
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="all">All Types</option>
          <option value="money">Cash</option>
          <option value="airtime">Airtime</option>
          <option value="voucher">Voucher</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[1rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Reference</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Points</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">KES</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-10">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-400">Loading redemptions...</p>
              </td></tr>
            ) : filteredRedemptions.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-sm font-bold text-slate-400">No redemptions found</td></tr>
            ) : filteredRedemptions.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-5 py-4">
                  <span className="text-[11px] font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {r.reference_number}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <p className="text-sm font-bold dark:text-white">{r.user?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{r.user?.klinflow_id}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(r.type)}
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{r.type}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {r.amount.toLocaleString()} GFP
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-bold text-green-600">
                    KES {Number(r.kes_equivalent).toLocaleString()}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {getStatusBadge(r.status)}
                </td>
                <td className="px-5 py-4">
                  <p className="text-xs font-semibold text-slate-500">{new Date(r.created_at).toLocaleString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
