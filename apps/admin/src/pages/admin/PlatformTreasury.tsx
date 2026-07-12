import { useEffect, useState, useMemo } from 'react';
import { 
  Building2, TrendingUp, Wallet, ArrowUpRight, 
  Printer, ChevronLeft, Activity, ShieldCheck, Banknote
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';

interface TreasuryEntry {
  id: string;
  source_type: 'resident_pickup' | 'marketplace_trade' | 'rfq_fulfillment';
  amount: number;
  reference_id: string;
  created_at: string;
}

export default function PlatformTreasury() {
  const navigate = useNavigate();
  const [data, setData] = useState<TreasuryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  const fetchTreasuryData = async () => {
    setLoading(true);
    const { data: entries, error } = await supabase
      .from('platform_treasury')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[PlatformTreasury] Query Error:', error);
    } else {
      console.log('[PlatformTreasury] Fetched entries:', entries?.length || 0);
      setData(entries || []);
    }
    setLoading(false);
  };

  const metrics = useMemo(() => {
    let total = 0;
    let resident = 0;
    let market = 0;
    let rfq = 0;

    data.forEach(entry => {
      total += entry.amount;
      if (entry.source_type === 'resident_pickup') resident += entry.amount;
      if (entry.source_type === 'marketplace_trade') market += entry.amount;
      if (entry.source_type === 'rfq_fulfillment') rfq += entry.amount;
    });

    return { total, resident, market, rfq };
  }, [data]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="h-screen flex items-center justify-center text-primary">
      <Activity className="w-10 h-10 animate-pulse" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 print:p-0">
      
      {/* ── ACTION BAR ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[1rem] border border-slate-100 dark:border-white/5 shadow-sm print:hidden">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-semibold text-slate-500"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          <Printer className="w-4 h-4" /> Print Statement
        </button>
      </div>

      {/* ── TREASURY OVERVIEW ── */}
      <div className="bg-gradient-to-br from-slate-900 to-black p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/10 print:border-none print:shadow-none print:rounded-none">
        
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-12">
          
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-xl">
                <Building2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-1">Platform Treasury</h1>
                <p className="text-sm font-semibold text-white/50 uppercase tracking-widest">Klinflow Revenue Ledger</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Secure Ledger</span>
              </div>
              <p className="text-sm font-mono text-white/40">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Master Balance */}
          <div className="flex items-baseline gap-4 py-8 border-y border-white/10">
            <span className="text-2xl font-black text-white/30 uppercase tracking-tighter">KSh</span>
            <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-tighter">
              {metrics.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-bold">
              <TrendingUp className="w-4 h-4" />
              Total Generated
            </div>
          </div>

          {/* Source Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Resident Pickups</p>
              <p className="text-2xl font-black text-white tracking-tight">KSh {metrics.resident.toLocaleString()}</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Banknote className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Marketplace Trades</p>
              <p className="text-2xl font-black text-white tracking-tight">KSh {metrics.market.toLocaleString()}</p>
            </div>

            <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">RFQ Fulfillments</p>
              <p className="text-2xl font-black text-white tracking-tight">KSh {metrics.rfq.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION LIST ── */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 shadow-sm">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-6">Recent Ledger Entries</h3>
        
        {data.length === 0 ? (
          <div className="text-center py-12">
             <p className="text-slate-400 font-bold">No revenue recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.slice(0, 50).map((entry) => (
              <div 
                key={entry.id} 
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 transition-colors bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${entry.source_type === 'resident_pickup' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                      entry.source_type === 'marketplace_trade' ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                      'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'}
                  `}>
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {entry.source_type.replace('_', ' ')}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">
                      Ref: {entry.reference_id?.split('-')[0] || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    + KSh {entry.amount.toLocaleString()}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {new Date(entry.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
