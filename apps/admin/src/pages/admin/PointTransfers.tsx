import { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, Search, Filter, 
  ArrowDownLeft, ArrowUpRight, Clock,
  CheckCircle2, XCircle
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { PointTransferRecord } from '@klinflow/core/services/walletService';

export default function PointTransfers() {
  const [transfers, setTransfers] = useState<PointTransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const fetchTransfers = async () => {
    setIsLoading(true);
    let query = supabase
      .from('point_transfers')
      .select(`
        *,
        sender:profiles!sender_id (name, klinflow_id, phone),
        receiver:profiles!receiver_id (name, klinflow_id, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (data) {
      setTransfers(data.map((d: any) => ({
        ...d,
        sender_name: d.sender?.name,
        receiver_name: d.receiver?.name
      })));
    }
    setIsLoading(false);
  };

  const filteredTransfers = transfers.filter(t => 
    t.reference_number.toLowerCase().includes(search.toLowerCase()) ||
    t.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
    t.receiver_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-emerald-500" />
            Point Transfers
          </h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Monitor all network point transfers</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference, sender, or receiver..."
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm font-semibold outline-none focus:border-emerald-500"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-sm font-semibold outline-none focus:border-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Reference</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Sender</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Receiver</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-sm font-bold text-slate-400">Loading transfers...</td></tr>
            ) : filteredTransfers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-sm font-bold text-slate-400">No transfers found</td></tr>
            ) : filteredTransfers.map(t => (
              <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td className="px-6 py-4">
                  <span className="text-[11px] font-bold font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                    {t.reference_number}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold dark:text-white">{t.sender_name}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold dark:text-white">{t.receiver_name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {t.amount.toLocaleString()} GFP
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {t.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {t.status === 'failed' && <XCircle className="w-3 h-3 text-rose-500" />}
                    {t.status === 'pending' && <Clock className="w-3 h-3 text-amber-500" />}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-xs font-semibold text-slate-500">{new Date(t.created_at).toLocaleString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
