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
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  TrendingDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { OptimizedImage } from '@klinflow/ui';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';


const CASH_FLOW_MOCK_DATA = [
  { date: 'May 12', sent: 120000, bought: 85000 },
  { date: 'May 17', sent: 150000, bought: 110000 },
  { date: 'May 22', sent: 210000, bought: 140000 },
  { date: 'May 27', sent: 180000, bought: 160000 },
  { date: 'Jun 1', sent: 250000, bought: 220000 },
  { date: 'Jun 6', sent: 280000, bought: 260000 },
  { date: 'Jun 12', sent: 310000, bought: 290000 },
];

const MOCK_MATERIAL_SPEND = [
  { name: 'HDPE Plastic', value: 145000 },
  { name: 'PET Bottles', value: 95000 },
  { name: 'Cardboard', value: 65000 },
  { name: 'Aluminium', value: 45000 },
  // { name: 'Other', value: 25000 },
];
const MOCK_TOTAL_SPEND = 375000;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

const playNotificationSound = () => {
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => { });
  } catch (e) { /* silent */ }
};

export default function AgentDisbursements() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [materialSpend, setMaterialSpend] = useState<{ name: string; value: number }[]>(MOCK_MATERIAL_SPEND);
  const [totalSpentOnMaterials, setTotalSpentOnMaterials] = useState(MOCK_TOTAL_SPEND);
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
        // Use mock data for now
        /*
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
        */
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
    <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto">

      {/* ── DESCRIPTION ── */}
      <div className="mb-4">
        <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">Monitor liquidity, track disbursements, manage approvals, and analyze financial performance.</p>
      </div>

      {/* ── TOP ROW: KPI STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="font-medium w-6 h-6 rounded bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
               <Wallet className="w-3.5 h-3.5" />
             </div>
             <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Available Cash</p>
           </div>
           <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">KES {Number(profile?.walletBalance || 0).toLocaleString()}</h3>
           <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="font-medium w-3 h-3"/> +14% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="font-medium w-6 h-6 rounded bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <ShieldCheck className="w-3.5 h-3.5" />
             </div>
             <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Total Disbursed</p>
           </div>
           <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">KES {totalMoneySent.toLocaleString()}</h3>
           <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="font-medium w-3 h-3"/> +8% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="font-medium w-6 h-6 rounded bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
               <Clock className="w-3.5 h-3.5" />
             </div>
             <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Pending Approvals</p>
           </div>
           <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">KES {requests.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}</h3>
           <p className="font-medium text-[10px] text-amber-600 dark:text-amber-400 mt-1">{requests.length} requests</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
               <Package className="w-3.5 h-3.5" />
             </div>
             <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Material Spend</p>
           </div>
           <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">KES {totalSpentOnMaterials.toLocaleString()}</h3>
           <p className="font-medium text-[10px] text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-0.5"><TrendingDown className="font-medium w-3 h-3"/> -6% vs last month</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-[#e0e3eb] dark:border-slate-800 shadow-none flex flex-col">
           <div className="flex items-center gap-2 mb-2">
             <div className="w-6 h-6 rounded bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
               <LineChartIcon className="w-3.5 h-3.5" />
             </div>
             <p className="font-medium text-[11px] text-slate-500 dark:text-slate-400">Gross Margin</p>
           </div>
           <h3 className="text-sm font-bold text-[#131722] dark:text-white tracking-tight">28.4%</h3>
           <p className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5"><TrendingUp className="font-medium w-3 h-3"/> +4.6% vs last month</p>
        </div>
      </div>

      {/* ── SECOND ROW: 3 CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Cash Flow Overview */}
         <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#131722] dark:text-white">Cash Flow Overview</h3>
              <button className="font-medium text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-[#e0e3eb] dark:border-slate-700">Daily <ChevronDown className="font-medium w-3 h-3"/></button>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
               <div className="font-medium flex items-center gap-1.5"><div className="font-medium w-2 h-2 rounded-full bg-emerald-500"></div><span className="font-medium text-[10px] text-slate-500">Money Sent</span></div>
               <div className="font-medium flex items-center gap-1.5"><div className="font-medium w-2 h-2 rounded-full bg-rose-500"></div><span className="font-medium text-[10px] text-slate-500">Material Bought</span></div>
            </div>

            <div className="flex-1 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={CASH_FLOW_MOCK_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                     <linearGradient id="colorBought" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                       <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000}k`} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                     labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                   />
                   <Area type="monotone" dataKey="sent" name="Money Sent" stroke="#10b981" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                   <Area type="monotone" dataKey="bought" name="Material Bought" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBought)" strokeWidth={2} />
                 </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="h-[400px]">
           {/* Material Spend Breakdown Chart */}
           <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h3 className="text-sm font-bold text-[#131722] dark:text-white">Material Spend Breakdown (30d)</h3>
               </div>
             </div>

             <div className="flex-1 min-h-[250px] w-full relative">
               {materialSpend.length > 0 ? (
                 <div className="flex h-full items-center gap-2">
                   <div className="w-1/2 h-full min-h-[200px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={materialSpend}
                           cx="50%"
                           cy="50%"
                           innerRadius={65}
                           outerRadius={85}
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
                       </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="font-medium text-[10px] text-slate-500 uppercase tracking-widest mt-1">KES</span>
                       <span className="font-bold text-sm text-[#131722] dark:text-white leading-none mt-0.5">{totalSpentOnMaterials.toLocaleString()}</span>
                       <span className="font-medium text-[9px] text-slate-400 mt-1">Total</span>
                     </div>
                   </div>
                   <div className="w-1/2 flex flex-col justify-center space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                     {materialSpend.map((entry, index) => {
                        const percentage = totalSpentOnMaterials > 0 ? ((entry.value / totalSpentOnMaterials) * 100).toFixed(0) : 0;
                        return (
                          <div key={index} className="flex flex-col gap-0.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate max-w-[80px]" title={entry.name}>
                                  {entry.name}
                                </span>
                              </div>
                              <span className="font-medium text-[10px] text-slate-500 shrink-0">{percentage}%</span>
                            </div>
                            <div className="pl-3.5">
                              <span className="font-medium text-[10px] text-slate-500 dark:text-slate-400">KES {entry.value.toLocaleString()}</span>
                            </div>
                          </div>
                        );
                     })}
                   </div>
                 </div>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50">
                   <Package className="font-medium w-8 h-8 text-slate-400 mb-2" />
                   <p className="font-medium text-xs text-slate-500">No material spend data yet</p>
                 </div>
               )}
             </div>
             <div className="mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700">
               <button className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">View full breakdown <ArrowUpRight className="font-medium w-3 h-3"/></button>
             </div>
           </div>
         </div>

         <div className="h-[400px]">
           {/* Pending Fund Requests */}
           <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-5 shadow-none flex flex-col h-full">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <h3 className="text-sm font-bold text-[#131722] dark:text-white">Pending Approvals</h3>
                 <span className="font-medium w-5 h-5 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px]">{requests.length}</span>
               </div>
               <button className="font-medium text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
             </div>

             <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar space-y-3">
               {isLoading && requests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 opacity-50">
                   <Loader2 className="w-6 h-6 animate-spin text-primary" />
                 </div>
               ) : requests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-12 text-center">
                   <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                     <ShieldCheck className="font-medium w-6 h-6 text-emerald-500" />
                   </div>
                   <p className="font-medium text-sm text-[#131722] dark:text-white">All Clear!</p>
                   <p className="font-medium text-xs text-slate-500 mt-1">No pending requests.</p>
                 </div>
               ) : (
                 requests.map((req, i) => {
                   const isHigh = Number(req.amount) > 10000;
                   return (
                     <div key={req.id} className="p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-[#e0e3eb] dark:border-slate-700/50 hover:border-slate-300 transition-colors">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                               {req.driver_avatar ? (
                                 <OptimizedImage src={req.driver_avatar} className="w-full h-full object-cover rounded-full" />
                               ) : (
                                 <span className="font-medium text-xs text-slate-500">{req.driver_name.substring(0,2).toUpperCase()}</span>
                               )}
                            </div>
                            <div>
                              <p className="font-medium text-xs text-[#131722] dark:text-white">{req.driver_name}</p>
                              <p className="font-medium text-[10px] text-slate-500 truncate max-w-[120px]">{req.reason || 'Wallet Top-up'}</p>
                              <p className="font-medium text-[9px] text-slate-400 mt-0.5">Requested: 2h ago</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-xs text-[#131722] dark:text-white">KES {Number(req.amount).toLocaleString()}</p>
                            <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest ${isHigh ? 'bg-rose-50 text-rose-500 dark:bg-rose-500/10' : 'bg-amber-50 text-amber-500 dark:bg-amber-500/10'}`}>
                               {isHigh ? 'High' : 'Medium'}
                            </span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => handleApprove(req.id)} disabled={isProcessing !== null} className="font-medium flex-1 py-1.5 bg-emerald-500 text-white rounded-lg text-[11px] hover:bg-emerald-600 transition-colors flex items-center justify-center">
                            Approve
                          </button>
                          <button onClick={() => handleDecline(req.id)} disabled={isProcessing !== null} className="font-medium flex-1 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-[11px] hover:bg-white transition-colors flex items-center justify-center">
                            Reject
                          </button>
                          <button className="font-medium px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-500 border border-[#e0e3eb] dark:border-slate-700 rounded-lg hover:bg-white transition-colors flex items-center justify-center">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                       </div>
                     </div>
                   );
                 })
               )}
             </div>
           </div>
         </div>
      </div>

      {/* ── THIRD ROW: 2 CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2">
            {/* Recent Transactions Ledger */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-6 shadow-none flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white">Recent Transactions</h3>
                <button className="font-medium text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="font-medium border-b border-[#e0e3eb] dark:border-slate-700/50 text-[10px] uppercase text-slate-400 tracking-wider">
                      <th className="pb-3 px-2">Date & Time</th>
                      <th className="pb-3 px-2">Type</th>
                      <th className="pb-3 px-2">Description</th>
                      <th className="pb-3 px-2">Agent / Party</th>
                      <th className="pb-3 text-right px-2">Amount</th>
                      <th className="pb-3 pl-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="font-medium py-8 text-center text-xs text-slate-500">No transactions found</td>
                      </tr>
                    ) : (
                      transactions.slice(0, 5).map((tx, i) => {
                        const type = i % 2 === 0 ? 'Disbursement' : 'Payout';
                        const typeColor = type === 'Disbursement' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' : 'text-blue-600 bg-blue-50 dark:bg-blue-500/10';
                        
                        return (
                          <tr key={tx.id} className="hover:bg-white dark:hover:bg-slate-800/50 transition-colors">
                            <td className="font-medium py-3 px-2 text-xs text-slate-700 dark:text-slate-300">
                              {new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[9px] uppercase tracking-widest ${typeColor}`}>
                                {type}
                              </span>
                            </td>
                            <td className="font-medium py-3 px-2 text-xs text-slate-700 dark:text-slate-300">
                              {tx.receiver_name ? `Agent wallet funding` : 'Dispute refund'}
                            </td>
                            <td className="font-medium py-3 px-2 text-xs text-[#131722] dark:text-white">
                              {tx.receiver_name || 'EcoWaste Solutions'}
                            </td>
                            <td className={`py-3 px-2 text-right text-xs ${i % 3 === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {i % 3 === 0 ? '+' : '-'}KES {Number(tx.amount || 0).toLocaleString()}
                            </td>
                            <td className="py-3 pl-6">
                              <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                <span className="font-medium text-[10px] text-slate-500">Completed</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-[#e0e3eb] dark:border-slate-700">
                <button className="font-medium text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">View all transactions <ArrowUpRight className="font-medium w-3 h-3"/></button>
              </div>
            </div>
         </div>

         <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-6 shadow-none flex flex-col">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-[#131722] dark:text-white">Financial Alerts</h3>
                   <button className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline">View all &rarr;</button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-3 items-start bg-rose-50 dark:bg-rose-500/5 p-3 rounded-xl border border-rose-100 dark:border-rose-500/10">
                     <div className="font-medium w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                       <XIcon className="w-3.5 h-3.5" />
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-[11px] font-semibold text-rose-900 dark:text-rose-300">Low cash balance alert</h4>
                          <span className="font-medium text-[9px] text-rose-500 hover:underline cursor-pointer">Action required</span>
                       </div>
                       <p className="font-medium text-[10px] text-rose-700/70 dark:text-rose-400/70">Available cash is below your threshold.</p>
                     </div>
                   </div>

                   <div className="flex gap-3 items-start bg-amber-50 dark:bg-amber-500/5 p-3 rounded-xl border border-amber-100 dark:border-amber-500/10">
                     <div className="font-medium w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                       <Activity className="w-3.5 h-3.5" />
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between items-center mb-0.5">
                          <h4 className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">{requests.length} payments awaiting approval</h4>
                          <span className="font-medium text-[9px] text-amber-600 hover:underline cursor-pointer">Review now</span>
                       </div>
                       <p className="font-medium text-[10px] text-amber-700/70 dark:text-amber-400/70">Total pending amount: KES {requests.reduce((acc, r) => acc + Number(r.amount), 0).toLocaleString()}</p>
                     </div>
                   </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-800 rounded-lg p-6 shadow-none flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-bold text-[#131722] dark:text-white">Spend Insights</h3>
                   <button className="font-medium text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1">View insights <ArrowUpRight className="font-medium w-3 h-3"/></button>
                </div>
                
                <div className="space-y-4">
                   <div className="flex gap-3 items-start">
                     <div className="font-medium w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                       <TrendingDown className="w-3.5 h-3.5" />
                     </div>
                     <div>
                       <h4 className="text-xs font-semibold text-[#131722] dark:text-white mb-0.5">Material spend decreased by 6%</h4>
                       <p className="font-medium text-[11px] text-slate-500">You spent KES {totalSpentOnMaterials.toLocaleString()} this month.</p>
                     </div>
                   </div>

                   <div className="flex gap-3 items-start">
                     <div className="font-medium w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                       <TrendingUp className="w-3.5 h-3.5" />
                     </div>
                     <div>
                       <h4 className="text-xs font-semibold text-[#131722] dark:text-white mb-0.5">Plastic prices trending up</h4>
                       <p className="font-medium text-[11px] text-slate-500">HDPE price increased by 12% in the last 14 days.</p>
                     </div>
                   </div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
}
