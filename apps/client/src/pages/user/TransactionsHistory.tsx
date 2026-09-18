import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Store, Wallet, Package, 
  Search 
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';

export default function TransactionsHistory() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const [rawTxns, setRawTxns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'payouts' | 'rewards'>('all');
  const [visibleCount, setVisibleCount] = useState(12);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  const isSeller = profile?.role === 'seller';

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    // Fetch both wallet transactions ledger and seller stats if seller
    const loadTxns = async () => {
      setIsLoading(true);
      try {
        let txs: any[] = [];
        if (isSeller) {
          const stats = await walletService.getSellerDashboard(userId);
          if (stats?.recent_trades && stats.recent_trades.length > 0) {
            txs = stats.recent_trades;
          } else {
            txs = await walletService.getWalletTransactions(userId) || [];
          }
        } else {
          txs = await walletService.getWalletTransactions(userId) || [];
        }
        setRawTxns(txs);

        // Fetch agent names for any payouts
        const refIds = txs
          .filter((t: any) => t.amount > 0 && t.transaction_type === 'payout' && t.reference_id)
          .map((t: any) => t.reference_id);

        if (refIds.length > 0) {
          try {
            const mapping: Record<string, string> = {};
            const [{ data: foData }, { data: bData }] = await Promise.all([
              supabase.from('fulfillment_orders').select('id, assigned_agent_id').in('id', refIds),
              supabase.from('bookings').select('id, agent_id').in('id', refIds)
            ]);

            const agentIds = new Set<string>();
            foData?.forEach((f: any) => { if (f.assigned_agent_id) agentIds.add(f.assigned_agent_id); });
            bData?.forEach((b: any) => { if (b.agent_id) agentIds.add(b.agent_id); });
            
            if (agentIds.size > 0) {
              const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', Array.from(agentIds));
              const profileMap = new Map(profiles?.map((p: any) => [p.id, p.name]));
              
              foData?.forEach((f: any) => { if (profileMap.has(f.assigned_agent_id)) mapping[f.id] = profileMap.get(f.assigned_agent_id); });
              bData?.forEach((b: any) => { if (profileMap.has(b.agent_id)) mapping[b.id] = profileMap.get(b.agent_id); });
            }
            setAgentNames(mapping);
          } catch (error) {
            console.error('Error fetching agent names:', error);
          }
        }
      } catch (err) {
        console.error('Failed to load transaction history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTxns();
  }, [isSeller, userId]);

  // Normalized Transaction List
  const normalizedTransactions = useMemo(() => {
    return rawTxns.map((item: any) => {
      const isPayout = item.transaction_type === 'payout' || item.amount > 0;
      const isWithdrawal = item.transaction_type === 'withdrawal' || item.amount < 0;
      
      const buyerName = isWithdrawal
        ? 'Wallet Withdrawal'
        : (item.buyer && !['Agent', 'Klinflow Hub Payout', 'Unknown Buyer', 'Recycling Agent'].includes(item.buyer)
          ? item.buyer
          : (agentNames[item.reference_id] || item.metadata?.hub_name || item.metadata?.buyer_name || (item.metadata?.type === 'material_buyback' ? 'Recycling Agent' : 'Klinflow Hub')));
      
      const materialSummary = isWithdrawal
        ? (item.metadata?.method ? `${item.metadata.method} Transfer` : 'M-PESA Transfer')
        : (item.material && item.material !== 'Material'
          ? item.material
          : (item.metadata?.materials_summary || item.metadata?.description || 'Recyclables Drop-off'));

      const dateObj = new Date(item.created_at || item.date || Date.now());

      return {
        id: item.id || Math.random().toString(),
        buyer: buyerName,
        material: materialSummary,
        amount: Number(item.amount || 0),
        status: item.status || 'Completed',
        date: dateObj,
        isPayout,
        isWithdrawal,
        raw: item
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [rawTxns, agentNames]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return normalizedTransactions.filter(item => {
      const matchesSearch = 
        item.buyer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.material.toLowerCase().includes(searchQuery.toLowerCase());

      if (filterType === 'payouts') return matchesSearch && item.isPayout;
      if (filterType === 'rewards') return matchesSearch && !item.isPayout;
      return matchesSearch;
    });
  }, [normalizedTransactions, searchQuery, filterType]);



  const formatTxDate = (date: Date) => {
    if (isNaN(date.getTime())) return '';
    const dateFormatted = date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
    const timeFormatted = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${dateFormatted} • ${timeFormatted}`;
  };

  return (
    <div className=" bg-slate-50 dark:bg-slate-950 transition-colors pb-12">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 shadow-2xs">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                Transaction History
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Hub payouts & wallet ledger
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-500/20">
              {filteredTransactions.length} Total
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+3.25rem)] space-y-3">
        {/* ── STATS HEADER & FILTERS CARD ── */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-slate-900 dark:to-slate-900 border border-indigo-800/30 dark:border-slate-800 text-white rounded-2xl p-4 shadow-sm space-y-2">


          {/* Search & Filter Controls */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Hub name or material..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/30 dark:bg-slate-950/50 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {(['all', 'payouts', 'rewards'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 border ${
                    filterType === type
                      ? 'bg-white text-indigo-600 dark:bg-emerald-500 dark:text-slate-950 border-white dark:border-emerald-500 shadow-sm'
                      : 'bg-black/10 dark:bg-slate-900 border-white/10 text-white/80 hover:bg-black/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRANSACTION FEED CARD ── */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-2 shadow-2xs">
          <div className="space-y-1">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500 font-medium">
                Loading transaction ledger...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 space-y-2">
                <Package className="w-8 h-8 mx-auto opacity-30" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No matching transactions found
                </p>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                  Try adjusting your search terms or filter selection.
                </p>
              </div>
            ) : (
              filteredTransactions.slice(0, visibleCount).map(item => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 font-bold">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {item.buyer}
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.material}
                      </p>
                      <p className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatTxDate(item.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold font-mono ${item.isWithdrawal ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {item.isWithdrawal ? '-' : '+'}KES {Math.abs(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`inline-block border text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                      item.isWithdrawal 
                        ? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            
            {filteredTransactions.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="w-full py-3 mt-2 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
              >
                Load More ({filteredTransactions.length - visibleCount} remaining)
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
