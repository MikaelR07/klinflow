import React from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCcw,
  Building2,
  Landmark,
  Plus
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

export default function WalletTreasury() {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Wallet & Treasury</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Financial control center for payouts, escrow, and receivables.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className={`px-4 py-2 font-medium text-sm rounded-xl border flex items-center gap-2 ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-700'}`}>
            <RefreshCcw className="w-4 h-4" /> Sync Ledgers
          </button>
          <button className="px-4 py-2 font-medium text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Fund Wallet
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Left Column: Balances & Cash Flow */}
        <div className="lg:col-span-8 space-y-6">
           
           {/* Big Wallet Balance */}
           <div className={`p-8 rounded-3xl border bg-gradient-to-br ${isDarkMode ? 'from-indigo-900/40 via-slate-900 to-slate-900 border-white/5' : 'from-indigo-900 via-indigo-800 to-indigo-900 border-indigo-900 text-white'}`}>
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                       <Wallet className="font-medium w-6 h-6 text-white" />
                    </div>
                    <div>
                       <p className={`text-sm font-medium uppercase tracking-wider ${isDarkMode ? 'text-indigo-300' : 'text-indigo-200'}`}>Master Escrow Wallet</p>
                       <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-indigo-300'}`}>Connected to KCB Corporate API</p>
                    </div>
                 </div>
              </div>

              <div>
                 <p className={`text-sm font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-indigo-200'}`}>Available Balance</p>
                 <div className="flex items-end gap-4">
                    <h2 className={`text-5xl md:text-7xl font-semibold tracking-tighter ${isDarkMode ? 'text-white' : 'text-white'}`}>KES 12.4M</h2>
                 </div>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-indigo-200'}`}>Reserved for Payouts</p>
                    <p className="text-xl font-medium text-white">KES 840K</p>
                 </div>
                 <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-indigo-200'}`}>Expected Receivables</p>
                    <p className="text-xl font-medium text-white">KES 4.2M</p>
                 </div>
              </div>
           </div>

           {/* Cash Flow Chart */}
           <div className={`p-6 rounded-3xl border h-80 flex flex-col ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Cash Flow Analytics</h2>
              </div>
              <div className="flex-1 relative border-b border-l border-slate-200 dark:border-white/10 flex items-end justify-between px-4 pb-2">
                 {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                    <div key={i} className="w-12 flex gap-1 items-end h-full">
                       <div className="w-1/2 bg-indigo-500 rounded-t-sm" style={{ height: `${h}%` }} />
                       <div className="w-1/2 bg-rose-500 rounded-t-sm" style={{ height: `${h * 0.6}%` }} />
                    </div>
                 ))}
              </div>
              <div className="flex items-center justify-center gap-6 mt-4">
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500" />
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Inflow (B2B Sales)</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Outflow (Supplier Payouts)</span>
                 </div>
              </div>
           </div>

        </div>

        {/* Right Column: Funding & Treasury */}
        <div className="lg:col-span-4 space-y-6">
           
           {/* Connected Accounts */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                 <Landmark className="w-5 h-5 text-indigo-500" />
                 Connected Sources
              </h3>
              <div className="space-y-3">
                 <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5" />
                       </div>
                       <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KCB Corporate</p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>**** 4022</p>
                       </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-medium uppercase rounded">Active</span>
                 </div>
                 <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-medium">
                          MP
                       </div>
                       <div>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>M-PESA B2B Paybill</p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paybill 220***</p>
                       </div>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-medium uppercase rounded">Active</span>
                 </div>
              </div>
           </div>

           {/* Quick Actions */}
           <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Quick Transfer</h3>
              <div className="space-y-4">
                 <div>
                    <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Amount (KES)</label>
                    <input type="text" placeholder="0.00" className={`w-full p-4 rounded-xl border font-mono font-medium text-lg ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`} />
                 </div>
                 <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                    Execute Transfer
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
}
