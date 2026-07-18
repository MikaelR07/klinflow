import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { walletService } from '@klinflow/core/services/walletService';
import { supabase } from '@klinflow/supabase';
import { History, ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Download, Search, Filter, BanknoteArrowDown, BanknoteArrowUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PayoutHistory() {
  const navigate = useNavigate();
  const profile = useAuthStore((s: any) => s.profile);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const isFleetDriver = profile?.agentAccountType === 'fleet_driver';
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      if (isFleetDriver) {
        // Fleet agents: fetch fund requests
        supabase
          .from('fund_requests')
          .select('*')
          .eq('driver_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50)
          .then(({ data }) => {
            setFundRequests(data || []);
            setIsLoadingRequests(false);
          });
      } else {
        // Individual agents: fetch wallet transactions
        walletService.getWalletTransactions(profile.id, 50).then(data => {
          setTransactions(data);
          setIsLoading(false);
        });
      }
    }
  }, [profile?.id, isFleetDriver]);

  const filteredTransactions = useMemo(() => {
    if (isFleetDriver) {
      return fundRequests.filter(req => {
        const matchesSearch = (req.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(req.amount).includes(searchTerm);
        const matchesFilter = filter === 'all' || req.status === filter;
        return matchesSearch && matchesFilter;
      });
    }
    return transactions.filter(tx => {
      const typeStr = tx.transaction_type || '';
      const refStr = tx.reference_id || '';
      const matchesSearch = typeStr.toLowerCase().includes(searchTerm.toLowerCase()) || refStr.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || typeStr === filter;
      return matchesSearch && matchesFilter;
    });
  }, [transactions, fundRequests, searchTerm, filter, isFleetDriver]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const titleMap: Record<string, string> = {
    'topup': 'Wallet Deposit',
    'withdrawal': 'Withdrawal',
    'payout': 'Trade Earnings',
    'transfer': 'Internal Transfer'
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter]);

  return (
    <div className=" bg-[#F8F9FF] dark:bg-slate-800  pt-[calc(env(safe-area-inset-top,1rem)+2.5rem)] relative overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800  pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between border-b border-slate-200 dark:border-slate-900">
        <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
        </button>
        <h1 className="text-[17px] font-bold text-slate-900 dark:text-white">Transaction History</h1>
        <button className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center active:scale-95 transition-all">
          <Download className="w-5 h-5 text-emerald-600" />
        </button>
      </div>

      <div className="px-1.5 max-w-lg mx-auto space-y-4 mt-4">
        
        {/* Search & Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reference or type..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
            />
          </div>
          
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
            {(isFleetDriver ? [
              { id: 'all', label: 'All' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'pending', label: 'Pending' }
            ] : [
              { id: 'all', label: 'All' },
              { id: 'topup', label: 'Deposits' },
              { id: 'payout', label: 'Earnings' },
              { id: 'payment', label: 'Payouts' },
              { id: 'transfer', label: 'Transfers' }
            ]).map(tab => (
              <button 
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === tab.id ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Statements List */}
        <div className="space-y-0.5 pb-5">
          {(isFleetDriver ? isLoadingRequests : isLoading) ? (
            // Loading Skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
              </div>
            ))
          ) : paginatedTransactions.length > 0 ? (
            isFleetDriver ? (
              // Fleet agent: render fund request cards
              paginatedTransactions.map((req: any, i: number) => {
                const statusColor = req.status === 'approved'
                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : req.status === 'rejected'
                    ? 'text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400';
                const StatusIcon = req.status === 'approved' ? CheckCircle2 : req.status === 'rejected' ? AlertCircle : Clock;

                return (
                  <div key={req.id || i} className="flex items-center justify-between p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all hover:shadow-md">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${statusColor}`}>
                        <BanknoteArrowDown className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="text-[12px] font-medium text-slate-900 dark:text-white leading-none">
                          KSh {Number(req.amount).toLocaleString()}
                        </p>
                        {req.reason && (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
                            <span className="text-slate-400 dark:text-slate-500">Note:</span> {req.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${req.status === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400' : req.status === 'rejected' ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400' : 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400'}`}>
                        {req.status}
                      </span>
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {new Date(req.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} · {new Date(req.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              // Individual agent: render wallet transaction cards
              paginatedTransactions.map(tx => {
              const isDeposit = ['topup', 'payout', 'escrow_release', 'refund'].includes(tx.transaction_type);
              const isPayment = tx.transaction_type === 'payment';
              const status = tx.status || 'completed';
              const isFailed = status === 'failed';
              const titleMap: Record<string, string> = {
                'topup': 'Wallet Deposit',
                'withdrawal': 'Wallet Withdrawal',
                'payout': 'Sales Earnings',
                'transfer': 'Internal Transfer'
              };
              
              const displayTitle = isPayment
                ? (tx.counterparty_name || 'Recipient')
                : (titleMap[tx.transaction_type] || tx.transaction_type);
              const maskedPhone = tx.counterparty_phone 
                ? tx.counterparty_phone.substring(0, 5) + '******'
                : '';
              const displaySubtitle = isPayment
                ? maskedPhone
                : '';

              return (
                <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${isFailed ? 'bg-slate-100 text-slate-400 dark:bg-slate-800' : isDeposit ? 'bg-white dark:bg-slate-900 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-red-500'}`}>
                      {isDeposit ? <BanknoteArrowDown className="w-5 h-5" /> : <BanknoteArrowUp className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <p className={`text-[12px] font-medium leading-none ${isFailed ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                          {displayTitle}
                        </p>
                        {isFailed && <span className="text-[9px] font-black uppercase text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded">Failed</span>}
                      </div>
                      
                      {displaySubtitle ? (
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">{displaySubtitle}</p>
                      ) : (
                        !isPayment && (
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1.5">
                            {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        )
                      )}

                      {tx.reference_id && (
                        <div className="mt-1.5">
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {tx.reference_id.length > 12 ? tx.reference_id.substring(0, 8) : tx.reference_id}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-[15px] font-medium tracking-tight ${isFailed ? 'text-slate-400' : isDeposit ? 'text-emerald-600 dark:text-emerald-400' : isPayment ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {isDeposit ? '+' : '-'}KSh {Math.abs(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                      {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">No transactions found</h3>
              <p className="text-xs font-medium text-slate-500 mt-1 max-w-[220px]">
                {searchTerm ? 'No transactions match your search.' : isFleetDriver ? 'You haven\'t made any fund requests yet.' : 'You haven\'t made any wallet transactions yet.'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 pb-8 px-2 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-95 transition-all"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-95 transition-all"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
