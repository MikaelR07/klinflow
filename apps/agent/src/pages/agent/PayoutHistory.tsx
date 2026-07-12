import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Download, Search, Filter } from 'lucide-react';
import { useState } from 'react';

// Extended MOCK TRANSACTIONS
const MOCK_TRANSACTIONS = [
  { id: '1', type: 'deposit', amount: 5000, date: '25 Jan 2026, 14:30', title: 'M-Pesa Deposit', status: 'completed', ref: 'RQK93847J' },
  { id: '2', type: 'withdrawal', amount: 1500, date: '23 Jan 2026, 09:15', title: 'Hub Payout Withdrawal', status: 'completed', ref: 'RQK93847K' },
  { id: '3', type: 'deposit', amount: 2000, date: '20 Jan 2026, 11:20', title: 'M-Pesa Deposit', status: 'completed', ref: 'RQK93847L' },
  { id: '4', type: 'withdrawal', amount: 3500, date: '15 Jan 2026, 16:45', title: 'Hub Payout Withdrawal', status: 'completed', ref: 'RQK93847M' },
  { id: '5', type: 'deposit', amount: 1000, date: '10 Jan 2026, 08:00', title: 'M-Pesa Deposit', status: 'completed', ref: 'RQK93847N' },
  { id: '6', type: 'deposit', amount: 8000, date: '05 Jan 2026, 12:10', title: 'M-Pesa Deposit', status: 'failed', ref: 'RQK93847O' },
  { id: '7', type: 'withdrawal', amount: 4200, date: '02 Jan 2026, 15:30', title: 'Hub Payout Withdrawal', status: 'completed', ref: 'RQK93847P' },
];

export default function PayoutHistory() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');

  const filteredTransactions = MOCK_TRANSACTIONS.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || tx.ref.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || tx.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className=" bg-[#F8F9FF] dark:bg-slate-950  pt-[calc(env(safe-area-inset-top,1rem)+2.5rem)] relative overflow-x-hidden">
      
      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 max-w-lg mx-auto flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
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
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
            >
              All Transactions
            </button>
            <button 
              onClick={() => setFilter('deposit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === 'deposit' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
            >
              Deposits
            </button>
            <button 
              onClick={() => setFilter('withdrawal')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === 'withdrawal' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800'}`}
            >
              Withdrawals
            </button>
          </div>
        </div>

        {/* Statements List */}
        <div className="space-y-1">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(tx => (
              <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${tx.type === 'deposit' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'}`}>
                    {tx.type === 'deposit' ? <ArrowDownToLine className="w-5 h-5" /> : <ArrowUpFromLine className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-white leading-tight">{tx.title}</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-0.5">{tx.date}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">{tx.ref}</span>
                      {tx.status === 'failed' && (
                        <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Failed</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${tx.status === 'failed' ? 'text-slate-400 line-through' : tx.type === 'deposit' ? 'text-slate-900 dark:text-white' : 'text-emerald-600'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}KSh {tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Filter className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No transactions found</h3>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
