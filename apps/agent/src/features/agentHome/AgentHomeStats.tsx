/**
 * AgentHome Stats & Quick Actions
 * Extracted from AgentHome.tsx
 */
import {
  Handshake, Truck, Star, Zap, Briefcase, Receipt, PlusSquare
} from 'lucide-react';
import type { AgentEarningsData } from './agentHome.types';

interface AgentHomeStatsProps {
  profile: any;
  earnings: AgentEarningsData;
  performanceChange: number;
  acceptedTradesCount: number;
  navigate: (path: string) => void;
}

export default function AgentHomeStats({
  profile, earnings, performanceChange, acceptedTradesCount, navigate
}: AgentHomeStatsProps) {
  return (
    <>
      {/* ── PERFORMANCE CARD ── */}
      <div className="relative !mt-1.5">
        <div className="relative bg-gradient-to-br from-primary to-[#064e3b] dark:from-emerald-900 dark:to-primary rounded-xl p-3 shadow-none">
          {/* TOP SECTION */}
          <div className="flex items-start justify-between gap-3 mb-2">
            {/* LEFT */}
            <div className="flex-1 min-w-0 pl-1">
              <p className="text-[12px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Assets Value
              </p>

              <div className="flex items-baseline gap-1 mb-2 min-w-0">
                <span className="text-xl sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>
                <h2 className="text-xl sm:text-xl font-black text-white truncate">
                  {earnings?.today}
                </h2>
              </div>

              <div className="bg-emerald-500/20 text-emerald-100 text-[10px] font-black px-2 py-1 rounded-md inline-flex max-w-full">
                {performanceChange >= 0 ? `↑ ${performanceChange.toFixed(0)}% from yesterday` : `↓ ${Math.abs(performanceChange).toFixed(0)}% from yesterday`}
              </div>
            </div>

            {/* DIVIDER */}
            <div className="w-px self-stretch bg-white/20" />

            {/* RIGHT */}
            <div className="flex-1 min-w-0 flex flex-col items-end text-right pr-1">
              <p className="text-[12px] font-bold text-emerald-50 mb-1 tracking-wider uppercase">
                Wallet Balance
              </p>

              <div className="flex items-baseline justify-end gap-1 mb-2 min-w-0 w-full">
                <span className="text-xl sm:text-xl font-bold text-emerald-400 shrink-0">
                  KSh
                </span>
                <h2 className="text-xl sm:text-xl font-black text-white truncate">
                  {(profile?.walletBalance || 0).toLocaleString()}
                </h2>
              </div>

              <div className="w-full flex justify-end">
                <button
                  onClick={() => navigate('/deposit')}
                  className="bg-emerald-800 text-white px-8 py-2 min-h-[44px] rounded-xl font-bold text-xs tracking-wider flex items-center justify-center active:scale-95 transition-all hover:bg-slate-50 whitespace-nowrap"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-4 gap-1">
            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Handshake className="w-4 h-4 text-emerald-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {acceptedTradesCount || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Accepted Bids
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {earnings?.completedToday || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Pickups
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Star className="w-4 h-4 text-amber-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rating ? Number(profile.rating).toFixed(1) : "4.0"}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Rating
                </p>
              </div>
            </div>

            <div className="bg-emerald-950/40 text-center rounded-xl p-2.5 flex flex-col justify-between min-h-[84px]">
              <Zap className="w-4 h-4 text-blue-400 shrink-0 mx-auto" />
              <div>
                <h4 className="text-sm font-black text-white leading-none mb-1 truncate">
                  {profile?.rewardPoints || 0}
                </h4>
                <p className="text-[9px] font-bold text-emerald-100/60 leading-tight">
                  Points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="px-2  !mt-2">
        <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-0.5  px-1">
          Quick Actions
        </p>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={() => navigate('/jobs')}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
          >
            <div className="w-10 h-10 shrink-0 bg-blue-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Briefcase className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              View Jobs
            </p>
          </button>

          <button
            onClick={() => navigate('/trades')}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
          >
            <div className="w-10 h-10 shrink-0 bg-emerald-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Handshake className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              Accepted Bids
            </p>
          </button>

          <button
            onClick={() => navigate('/rfqs')}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
          >
            <div className="w-10 h-10 shrink-0 bg-indigo-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              Quotes
            </p>
          </button>

          <button
            onClick={() => navigate('/rfq/create')}
            className="min-w-0 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex flex-col items-center gap-1 active:scale-[0.98] transition-all shadow-none group"
          >
            <div className="w-10 h-10 shrink-0 bg-amber-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <PlusSquare className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 leading-tight mt-1 text-center break-words">
              Create RFQ
            </p>
          </button>
        </div>
      </div>
    </>
  );
}
