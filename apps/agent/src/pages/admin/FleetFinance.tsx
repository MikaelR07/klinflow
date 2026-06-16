/**
 * Fleet Finance Page — Company Owner Disbursement Control & Analytics
 */
import { useEffect, useState } from 'react';
import {
  Wallet,
  Banknote,
  ShieldCheck,
  Loader2,
  ChevronDown,
  Phone,
  Check,
  X as XIcon,
  TrendingUp,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  PieChart as PieChartIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { OptimizedImage } from '@klinflow/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => { });
  } catch (e) { /* silent */ }
};

export default function FleetFinance() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [materialSpend, setMaterialSpend] = useState<{ name: string; value: number }[]>([]);
  const [totalSpentOnMaterials, setTotalSpentOnMaterials] = useState(0);
  const [totalMoneySent, setTotalMoneySent] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();

    if (!profile?.id) return;

    const channel = supabase
      .channel('fund-requests-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'fund_requests',
        filter: `company_id=eq.${profile.id}`
      }, async (payload) => {
        playNotificationSound();
        const newReq = payload.new as any;
        const { data: driverData } = await supabase
          .from('profiles')
          .select('name, avatar_url, phone')
          .eq('id', newReq.driver_id)
          .single();

        const enrichedRequest = {
          id: newReq.id,
          amount: newReq.amount,
          reason: newReq.reason,
          status: newReq.status,
          created_at: newReq.created_at,
          driver_name: driverData?.name || 'Fleet Driver',
          driver_avatar: driverData?.avatar_url || null,
          driver_phone: driverData?.phone || null,
        };

        setRequests(prev => [enrichedRequest, ...prev]);
        toast.info(`💰 New Fund Request`, {
          description: `${driverData?.name || 'A driver'} is requesting KSh ${Number(newReq.amount).toLocaleString()}`,
          duration: 8000,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch pending requests
      const { data: reqs, error } = await supabase.rpc('get_pending_fund_requests', {
        p_owner_id: profile?.id
      });
      if (!error && reqs) setRequests(reqs);

      // 2. Fetch Transactions (Sent to agents)
      if (profile?.id) {
        const { data: approvedRequests } = await supabase
          .from('fund_requests')
          .select(`
            id,
            amount,
            status,
            created_at,
            driver:profiles!driver_id(name, klinflow_id)
          `)
          .eq('company_id', profile.id)
          .eq('status', 'approved')
          .order('updated_at', { ascending: false })
          .limit(50);
          
        const mappedTx = (approvedRequests || []).map((req: any) => ({
          id: req.id,
          amount: req.amount,
          status: 'completed', // Map 'approved' to 'completed' for UI styling
          created_at: req.created_at,
          receiver_name: req.driver?.name,
          receiver_klinflow_id: req.driver?.klinflow_id,
          fee: 0
        }));
        
        setTransactions(mappedTx);

        // Calculate total sent
        const sentSum = mappedTx.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
        setTotalMoneySent(sentSum);

        // 3. Material spend breakdown
        const { data: agentData } = await supabase.from('profiles').select('id').eq('company_id', profile.id);
        const agentIds = agentData?.map(a => a.id) || [];

        if (agentIds.length > 0) {
          const { data: bookings } = await supabase
            .from('bookings')
            .select('waste_type, fee, total_price')
            .in('status', ['completed'])
            .in('agent_id', agentIds);

          if (bookings) {
            let totalSpend = 0;
            const spendMap: Record<string, number> = {};

            bookings.forEach(b => {
              const amt = Number(b.fee) || Number(b.total_price) || 0;
              totalSpend += amt;
              const type = b.waste_type ? String(b.waste_type).toUpperCase() : 'OTHER';
              spendMap[type] = (spendMap[type] || 0) + amt;
            });

            setTotalSpentOnMaterials(totalSpend);
            setMaterialSpend(
              Object.entries(spendMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
            );
          }
        }
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const { data, error } = await supabase.rpc('approve_fund_request', {
        p_request_id: requestId
      });
      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        setRequests(prev => prev.filter(r => r.id !== requestId));
        setExpandedId(null);
        await refreshProfile();
        fetchData(); // Refresh history
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Disbursement failed');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setIsProcessing(requestId);
    try {
      const { error } = await supabase
        .from('fund_requests')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      toast('Request Declined', { description: 'The driver will be notified.' });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      setExpandedId(null);
    } catch (err) {
      toast.error('Failed to decline request');
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Company Finance</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Monitor company balance, agents payouts, and material spend.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchData()} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all text-slate-500">
            <Activity className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Hero Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Company Treasury Card (Main Balance) */}
        <div className="relative group overflow-hidden">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[1rem] p-5 shadow-xl border border-white/10 flex flex-col justify-between h-full min-h-[140px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center backdrop-blur-sm border border-emerald-500/30">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Company Balance</span>
                </div>
                <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-sm flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-white tracking-widest">Live</span>
                </div>
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-400 mb-1">Available Funds</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-400">KSh</span>
                  <h2 className="text-5xl font-black text-white tracking-tighter">
                    {Number(profile?.walletBalance || 0).toLocaleString()}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Sent to Agents */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-500 mb-3">
              <ArrowUpRight className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Total Sent to Agents</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              KSh {totalMoneySent.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Disbursements for jobs & funding</p>
          </div>
        </div>

        {/* Material Spend */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <Package className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Material Spend</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              KSh {totalSpentOnMaterials.toLocaleString()}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Total spent by agents to buy stock</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Material Spend Breakdown Chart */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Material Spend Breakdown</h3>
              <p className="text-xs text-slate-500 mt-1">What your agents are buying</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-slate-400" />
            </div>
          </div>

          <div className="h-[250px] w-full relative">
            {materialSpend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={materialSpend}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {materialSpend.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Spent']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                <Package className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-500">No material spend data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Pending Fund Requests */}
        <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Requests</h3>
              <p className="text-xs text-slate-500 mt-1">Agents waiting for funds</p>
            </div>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-500 text-[10px] font-bold tracking-widest uppercase rounded-full">
              {requests.length} Pending
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-3">
            {isLoading && requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</p>
                <p className="text-xs text-slate-500 mt-1">No pending requests.</p>
              </div>
            ) : (
              <AnimatePresence>
                {requests.map((req) => {
                  const isExpanded = expandedId === req.id;
                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-slate-50 dark:bg-slate-900/50 rounded-1xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <button onClick={() => toggleExpand(req.id)} className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                          {req.driver_avatar ? (
                            <OptimizedImage src={req.driver_avatar} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-slate-400">{req.driver_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{req.driver_name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{new Date(req.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white">KSh {Number(req.amount).toLocaleString()}</p>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3 pt-2">
                              {req.reason && (
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 italic">"{req.reason}"</p>
                                </div>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleApprove(req.id)}
                                  disabled={isProcessing !== null}
                                  className="flex-1 h-10 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                                >
                                  {isProcessing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Approve</>}
                                </button>
                                <button
                                  onClick={() => handleDecline(req.id)}
                                  disabled={isProcessing !== null}
                                  className="h-10 px-4 bg-white dark:bg-slate-800 text-slate-500 rounded-xl font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 border border-slate-200 dark:border-slate-700"
                                >
                                  <XIcon className="w-4 h-4" /> Decline
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions Ledger */}
      <div className="bg-white dark:bg-slate-900/60 rounded-[1rem] p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
            <p className="text-xs text-slate-500 mt-1">Transfers sent to your agents</p>
          </div>
          <Banknote className="w-5 h-5 text-slate-400" />
        </div>

        <div className="space-y-3">
          {isLoading && transactions.length === 0 ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 opacity-50">
              <ArrowUpRight className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">No recent transactions found.</p>
            </div>
          ) : (
            transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                  tx.status === 'failed' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                  <ArrowUpRight className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    To: {tx.receiver_name || tx.receiver_klinflow_id || 'Agent'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(tx.created_at).toLocaleDateString()}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 rounded-full uppercase tracking-widest ${tx.status === 'completed' ? 'text-emerald-500 bg-emerald-500/10' :
                      tx.status === 'failed' ? 'text-rose-500 bg-rose-500/10' :
                        'text-amber-500 bg-amber-500/10'
                      }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    -KSh {Number(tx.amount || 0).toLocaleString()}
                  </p>
                  {tx.fee > 0 && <p className="text-[9px] text-slate-400 mt-0.5">Fee: KSh {tx.fee}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
