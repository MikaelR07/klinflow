import { useEffect, useState, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, Wallet, ArrowUpRight, 
  ArrowDownRight, Printer, ChevronLeft, 
  BarChart3, Activity, PieChart,
  Calendar, Building2, UserCheck, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/core';

export default function FinancialReport() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0.2); // Default 20%

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setLoading(true);
    // Fetch all completed bookings with fees
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, fee, updated_at, waste_type, agent_id')
      .eq('status', 'completed');

    if (!error) setData(bookings || []);
    setLoading(false);
  };

  // ── Metrics Aggregation ──────────────────────────────────────────
  const stats = useMemo(() => {
    let totalGross = 0;
    let totalCommission = 0;
    let totalPayouts = 0;
    const materialRevenue = {};
    const monthlyTrend = {};

    data.forEach(b => {
      const gross = b.fee || 0;
      const comm = gross * commissionRate;
      const payout = gross - comm;

      totalGross += gross;
      totalCommission += comm;
      totalPayouts += payout;

      const type = b.waste_type || 'Other';
      materialRevenue[type] = (materialRevenue[type] || 0) + gross;

      const date = new Date(b.updated_at);
      const monthKey = date.toLocaleString('en-US', { month: 'short' });
      if (!monthlyTrend[monthKey]) monthlyTrend[monthKey] = { gross: 0, comm: 0 };
      monthlyTrend[monthKey].gross += gross;
      monthlyTrend[monthKey].comm += comm;
    });

    return {
      totalGross,
      totalCommission,
      totalPayouts,
      byMaterial: Object.entries(materialRevenue)
        .map(([name, value]) => ({ name, value, pct: totalGross > 0 ? (value / totalGross) * 100 : 0 }))
        .sort((a, b) => b.value - a.value),
      trend: Object.entries(monthlyTrend).map(([month, vals]) => ({ month, ...vals }))
    };
  }, [data, commissionRate]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-primary">
      <Activity className="w-10 h-10 animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 print:p-0">
      
      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm print:hidden">
        <button 
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-semibold text-slate-500"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Hub
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <Printer className="w-4 h-4" /> Print Statement
        </button>
      </div>

      {/* ── FINANCIAL DOCUMENT ── */}
      <div className="bg-white dark:bg-slate-900 p-12 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-2xl print:p-0 print:border-none print:shadow-none print:rounded-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 dark:border-white pb-8 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900">
                <Briefcase className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight">Platform Financial Summary</h1>
            </div>
            <p className="text-slate-500 font-semibold uppercase text-xs tracking-[0.4em]">Klinflow PaaS Operations · Internal Statement</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Financial Year</p>
            <p className="text-sm font-semibold dark:text-white">{new Date().getFullYear()}</p>
            <p className="text-xs text-slate-500 uppercase tracking-tighter">Currency: KES (KSh)</p>
          </div>
        </div>

        {/* SUMMARY TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50">
             <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Gross Transaction Value</p>
             <h2 className="text-4xl font-semibold text-slate-900 dark:text-white leading-none">KSh {stats.totalGross.toLocaleString()}</h2>
             <div className="flex items-center gap-1 mt-4 text-emerald-500">
               <ArrowUpRight className="w-4 h-4" />
               <span className="text-xs font-semibold">LIFETIME REVENUE</span>
             </div>
          </div>

          <div className="p-8 bg-primary/5 rounded-[2.5rem] border border-primary/20">
             <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-2">Platform Commissions</p>
             <h2 className="text-4xl font-semibold text-primary leading-none">KSh {stats.totalCommission.toLocaleString()}</h2>
             <p className="text-xs text-slate-500 font-semibold mt-4 uppercase tracking-tighter">Avg. Take Rate: {commissionRate * 100}%</p>
          </div>

          <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Total Agent Payouts</p>
             <h2 className="text-4xl font-semibold leading-none">KSh {stats.totalPayouts.toLocaleString()}</h2>
             <div className="flex items-center gap-1 mt-4 text-slate-500">
               <UserCheck className="w-4 h-4" />
               <span className="text-xs font-semibold uppercase">Economic Value Shared</span>
             </div>
          </div>
        </div>

        {/* REVENUE BREAKDOWN & TREND */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-6">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <PieChart className="w-4 h-4 text-slate-400" /> Revenue by Material Stream
              </h3>
              <div className="space-y-4">
                 {stats.byMaterial.map((m, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold dark:text-white">{m.name}</span>
                        <span className="text-xs font-semibold text-slate-400">KSh {m.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 dark:bg-white transition-all duration-1000" style={{ width: `${m.pct}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="space-y-6">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Monthly Growth Trend
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 h-full flex flex-col justify-end gap-2">
                 <div className="flex items-end justify-between h-40 gap-2">
                    {stats.trend.map((t, i) => {
                      const max = Math.max(...stats.trend.map(x => x.gross));
                      const height = (t.gross / max) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                           <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-t-lg relative" style={{ height: `${height}%` }}>
                              <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg" />
                           </div>
                           <span className="text-xs font-semibold text-slate-400 uppercase">{t.month}</span>
                        </div>
                      )
                    })}
                 </div>
              </div>
           </div>
        </div>

        {/* FINANCIAL DISCLOSURE */}
        <div className="mt-20 pt-8 border-t-2 border-slate-100 dark:border-white/5 space-y-4">
           <div className="flex justify-between items-end text-xs text-slate-400 font-semibold uppercase tracking-widest">
              <div className="max-w-sm leading-relaxed">
                 This report is an internal accounting of platform fees and does not include 
                 subscription revenue or third-party logistics costs. Calculated using a flat {commissionRate * 100}% take-rate.
              </div>
              <div className="text-right">
                 Verified by Klinflow Finance Hub<br/>
                 Timestamp: {new Date().toISOString()}
              </div>
           </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </div>
  );
}
