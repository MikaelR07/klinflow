import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Share2, BadgeCheck, ShieldCheck, 
  Briefcase, Globe, TrendingUp, Award, Clock, 
  FileText, QrCode, Download, ExternalLink,
  ChevronRight, CalendarDays, Activity, BarChart3,
  X, Copy, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

// ==========================================
// MOCK DATA LAYER (For Phase 1)
// ==========================================


// ==========================================
// SHARE MODAL COMPONENT
// ==========================================
function ShareResumeModal({ isOpen, onClose, profile, stats, trustScore, level }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Share Verification</h3>
            <button onClick={onClose} className="p-2 -mr-2 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 mb-6 relative overflow-hidden">
            {/* Scannable QR Code */}
            <div className="w-36 h-36 bg-white rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 flex items-center justify-center mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/verify/${profile?.id}`)}&margin=0`}
                alt="QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <h4 className="text-lg font-black text-slate-900 dark:text-white mb-0.5">{profile?.name}</h4>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" /> Klinflow Verified
            </div>

            <div className="w-full grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trust Score</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{trustScore}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Volume</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{stats.totalKg} kg</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/verify/${profile?.id}`);
                toast.success('Public Link Copied!');
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors">
              <Copy className="w-4 h-4" /> Copy Public Link
            </button>
            <button 
              onClick={() => {
                onClose();
                setTimeout(() => window.print(), 300);
              }}
              className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors">
              <Download className="w-4 h-4" /> Download PDF Certificate
            </button>
          </div>
        </div>
      </motion.div>
      <style>{`
        @media print {
          body { background: white !important; }
          .fixed { display: none !important; } /* hides top nav and floating elements */
          button { display: none !important; } /* hides action buttons */
          main { padding-top: 0 !important; margin: 0 !important; max-width: 100% !important; }
          .shadow-sm, .border { box-shadow: none !important; border-color: #e2e8f0 !important; }
          .bg-slate-900 { background: white !important; color: black !important; }
          .text-white { color: black !important; }
          .dark\\:bg-slate-900 { background: white !important; }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// TABS COMPONENTS
// ==========================================

function OverviewTab({ profile, stats, level, trustScore, badges, timeOnPlatform, progression }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      
      {/* Verified Economic Activity */}
      <section>
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Verified Economic Activity</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-y-6 gap-x-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Lifetime Volume</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stats.totalKg.toLocaleString()} kg</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Materials recovered</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Transaction Value</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">KSh {stats.lifetimeEarnings.toLocaleString()}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Verified payouts</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Completed Jobs</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stats.count.toLocaleString()}</p>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Track record
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Time on Platform</p>
              <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{timeOnPlatform}</p>
              <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Consistent activity
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Progression */}
      <section>
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Professional Progression</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          {/* Current Tier + Progress */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Current Tier</p>
                <h4 className="text-base font-black text-slate-900 dark:text-white capitalize flex items-center gap-2">
                  <span>{progression.current.icon}</span> {progression.current.name}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            
            {!progression.isMaxTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{progression.progress}% toward {progression.next.name}</span>
                  <span className="text-slate-400">{progression.next.minJobs} Jobs Required</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-900 dark:bg-white rounded-full transition-all duration-500" style={{ width: `${progression.progress}%` }} />
                </div>
                <p className="text-[10px] font-medium text-slate-500 mt-2">
                  {progression.jobsRemaining} more verified jobs needed to unlock <span className="font-bold text-slate-700 dark:text-slate-300">{progression.next.name}</span>.
                </p>
              </div>
            )}
            {progression.isMaxTier && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg">
                <CheckCircle2 className="w-4 h-4" /> Maximum tier reached. You are a legendary Operator.
              </p>
            )}
          </div>

          {/* Tier Ladder */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tier History</p>
            <div className="space-y-1.5">
              {progression.allTiers.map((tier: any, i: number) => {
                const isAchieved = i <= progression.currentTierIdx;
                const isCurrent = i === progression.currentTierIdx;
                return (
                  <div key={tier.name} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${isCurrent ? 'bg-emerald-700 dark:bg-white/10' : isAchieved ? 'bg-slate-50 dark:bg-slate-800/50' : 'opacity-40'}`}>
                    <span className="text-base">{tier.icon}</span>
                    <div className="flex-1">
                      <p className={`text-[12px] font-bold ${isCurrent ? 'text-white dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{tier.name}</p>
                      <p className={`text-[9px] font-semibold ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>{tier.minJobs}+ jobs • {tier.minKg}+ kg</p>
                    </div>
                    {isAchieved && (
                      <CheckCircle2 className={`w-4 h-4 ${isCurrent ? 'text-emerald-400' : 'text-emerald-500'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Skills & Verifications */}
      <section>
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Skills & Verifications</h3>
        <div className="grid gap-2">
          {badges.map((badge: any, i: number) => (
            <div key={i} className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2 overflow-hidden group hover:border-emerald-500/30 transition-colors">
              
              {/* Subtle background glow based on badge color */}
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-20 pointer-events-none ${
                badge.color === 'emerald' ? 'bg-emerald-400' :
                badge.color === 'blue' ? 'bg-blue-400' :
                'bg-indigo-400'
              }`} />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                    badge.color === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/30' :
                    badge.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-blue-200 dark:border-blue-500/30' :
                    'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-500/20 dark:to-indigo-500/5 border-indigo-200 dark:border-indigo-500/30'
                  }`}>
                    <badge.icon className="w-5 h-5 text-black dark:text-black" />
                  </div>
                  <h4 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight">{badge.title}</h4>
                </div>
                <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
                  badge.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                  badge.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                  'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
                }`}>Verified</span>
              </div>
              
              <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
                {badge.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </motion.div>
  );
}

function ActivityTab({ bookings, stats }: any) {
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  // Resolve agent names from IDs
  useMemo(() => {
    const completed = bookings.filter((b: any) => b.status === 'completed');
    const agentIds = [...new Set(completed.map((b: any) => b.agentId).filter(Boolean))] as string[];
    
    if (agentIds.length === 0) return;

    import('@klinflow/core/lib/supabaseClient').then(({ supabase }) => {
      supabase
        .from('profiles')
        .select('id, name')
        .in('id', agentIds)
        .then(({ data }) => {
          if (data) {
            const mapping: Record<string, string> = {};
            data.forEach((p: any) => { mapping[p.id] = p.name || 'Agent'; });
            setAgentNames(mapping);
          }
        });
    });
  }, [bookings]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Impact & Work History */}
      <section>
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Impact & History</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          
          {/* Impact Stats */}
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Carbon Saved</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{(stats.totalCarbon * 1000).toFixed(0)} kg</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Diverted Waste</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalKg.toLocaleString()} kg</p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white mb-3">Material Breakdown</h4>
              <div className="space-y-3">
                {Object.entries(stats.breakdown).map(([type, weight]: any) => (
                  <div key={type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600 dark:text-slate-300 capitalize">{type}</span>
                      <span className="text-slate-900 dark:text-white">{weight} kg</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${(weight / stats.totalKg) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(stats.breakdown).length === 0 && (
                  <p className="text-xs text-slate-500 italic">No verified materials recorded yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Divider with Work History label */}
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
            <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Latest Work History</h4>
            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">Ledger</span>
          </div>

          {/* Work History Table */}
          {(() => {
            const completed = bookings.filter((b: any) => b.status === 'completed')
              .sort((a: any, b: any) => new Date(b.createdAt || b.created_at || 0).getTime() - new Date(a.createdAt || a.created_at || 0).getTime());
            const shown = completed.slice(0, 5);
            const remaining = completed.length - shown.length;

            return completed.length === 0 ? (
              <div className="p-8 text-center text-sm font-medium text-slate-500">No verified jobs found on network.</div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_0.6fr] gap-1 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Material</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Buyer</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {shown.map((b: any, i: number) => {
                    const dateStr = (() => { const d = new Date(b.createdAt || b.created_at || b.date); return isNaN(d.getTime()) ? 'N/A' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; })();
                    const buyerName = b.agentId ? (agentNames[b.agentId] || '...') : 'Direct';
                    
                    return (
                      <div key={i} className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_0.6fr] gap-1 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <span className="text-[12px] font-bold text-slate-900 dark:text-white capitalize truncate">{b.wasteType || 'Mixed'}</span>
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize truncate">{buyerName}</span>
                        <span className="text-[12px] font-black text-slate-900 dark:text-white">{Number(b.actualWeightKg) || Number(b.weightKg) || 0} kg</span>
                        <span className="text-[11px] font-medium text-slate-400">{dateStr}</span>
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md text-center uppercase tracking-wider">Verified</span>
                      </div>
                    );
                  })}
                </div>

                {remaining > 0 && (
                  <div className="px-5 py-3 text-center border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400">
                      + {remaining} more verified job{remaining !== 1 ? 's' : ''} on record ({completed.length} total)
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

    </motion.div>
  );
}

function FinancialTab({ data }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">Privacy Control Enabled</h4>
          <p className="text-[11px] font-medium text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            Exact financial figures are hidden on your public resume. Verified partners will only see your "Income Consistency" rating unless you grant them access.
          </p>
        </div>
      </div>

      <section>
        <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Financial Activity</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Lifetime Verified</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">KSh {(data.lifetimeEarnings / 1000000).toFixed(2)}M</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Avg. Monthly</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">KSh {(data.avgMonthly / 1000).toFixed(1)}K</p>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white mb-4">Income Consistency (Last 6 Months)</h4>
            <div className="flex items-end justify-between h-32 gap-2 pt-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              {data.months.map((m: any, i: number) => {
                const height = `${(m.value / data.highestMonth) * 100}%`;
                const isCurrent = i === data.months.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full relative h-full flex items-end">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`w-full rounded-t-md transition-colors ${isCurrent ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'}`} 
                      />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </section>

    </motion.div>
  );
}

// ==========================================
// DYNAMIC DATES HELPER
// ==========================================
const getMonthsList = () => {
  const months = [];
  const d = new Date();
  d.setDate(1); // avoid end of month bugs
  for (let i = 5; i >= 0; i--) {
    const temp = new Date(d);
    temp.setMonth(temp.getMonth() - i);
    months.push(temp.toLocaleString('default', { month: 'short' }));
  }
  return months;
};

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function CircularResume() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);
  const bookings = useBookingStore(s => s.bookings);
  const receivedOrders = useMarketplaceStore(s => s.receivedOrders);

  const [activeTab, setActiveTab] = useState('overview');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Time on platform (dynamic)
  const timeOnPlatform = useMemo(() => {
    if (!profile?.createdAt) return 'New';
    const start = new Date(profile.createdAt);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months === 0) return '1 mo';
    return `${months} mos`;
  }, [profile]);

  // ── PROFESSIONAL TRUST SCORE (Multi-Factor, 0-1000) ──
  // Weighted breakdown: Activity (30%), Reliability (25%), Volume (20%), Tenure (15%), Verification (10%)
  const trustScore = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const total = completed.length + cancelled.length;

    // Factor 1: Activity Score (0-300) — based on number of completed deals
    const activityScore = Math.min(300, completed.length * 6);

    // Factor 2: Reliability Score (0-250) — completion rate
    const completionRate = total > 0 ? completed.length / total : 1;
    const reliabilityScore = Math.round(completionRate * 250);

    // Factor 3: Volume Score (0-200) — total kg handled
    const totalKg = completed.reduce((sum, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
    const volumeScore = Math.min(200, Math.round((totalKg / 5000) * 200));

    // Factor 4: Tenure Score (0-150) — months on platform
    const monthsOnPlatform = profile?.createdAt
      ? Math.max(1, (new Date().getFullYear() - new Date(profile.createdAt).getFullYear()) * 12 + (new Date().getMonth() - new Date(profile.createdAt).getMonth()))
      : 1;
    const tenureScore = Math.min(150, monthsOnPlatform * 6);

    // Factor 5: Verification Bonus (0-100)
    const verificationScore = profile?.isVerified ? 100 : 0;

    return Math.min(1000, activityScore + reliabilityScore + volumeScore + tenureScore + verificationScore);
  }, [bookings, profile]);

  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.status === 'completed');
    const totalKg = completed.reduce((sum, b: any) => sum + (Number(b.actualWeightKg) || Number(b.weightKg) || 0), 0);
    
    // Impact calculations
    const carbonFactors: Record<string, number> = {
      'plastics': 1.5, 'pet': 1.5, 'hdpe': 1.7, 'metals': 1.5,
      'aluminium': 9.0, 'paper': 0.9, 'glass': 0.3, 'ewaste': 2.0,
      'default': 0.8
    };

    const totalCarbon = completed.reduce((sum: number, b: any) => {
      const type = (b.wasteType || '').toLowerCase();
      const factor = (carbonFactors[type] || carbonFactors.default || 0.8) as number;
      // Convert to tonnes for enterprise feel
      return sum + (((Number(b.actualWeightKg) || Number(b.weightKg) || 0) * factor) / 1000);
    }, 0);

    const breakdown = completed.reduce((acc: Record<string, number>, b: any) => {
      const type = b.wasteType || b.wasteType || 'Mixed';
      acc[type] = (acc[type] || 0) + (Number(b.actualWeightKg) || Number(b.weightKg) || 0);
      return acc;
    }, {});

    // Financial calculations based on actual Seller marketplace deals
    const marketplaceBookings = completed.filter((b: any) => b.bookingType === 'marketplace' || b.bookingType === 'marketplace_pickup' || !b.bookingType); // Include standard bookings if bookingType is missing
    const totalTransactionValue = marketplaceBookings.reduce((sum, b: any) => sum + (Number(b.totalPrice) || (Number(b.actualWeightKg) || Number(b.weightKg) || 0) * 35), 0);
    
    // Add marketplace Orders
    const completedOrders = receivedOrders.filter((o:any) => o.status === 'completed' || o.status === 'accepted');
    const orderValue = completedOrders.reduce((sum, o:any) => sum + (Number(o.totalPrice) || 0), 0);
    
    const lifetimeEarnings = totalTransactionValue + orderValue;

    // Calculate 6-month chart array
    const monthLabels = getMonthsList();
    const monthValues = new Array(6).fill(0);
    
    const d = new Date();
    const currentMonth = d.getMonth();
    const currentYear = d.getFullYear();

    [...marketplaceBookings, ...completedOrders].forEach((item: any) => {
      const dateStr = item.createdAt || item.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      
      const monthDiff = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
      
      if (monthDiff >= 0 && monthDiff < 6) {
        const index = 5 - monthDiff;
        monthValues[index] += (Number(item.totalPrice) || 0);
      }
    });

    let highestMonth = Math.max(...monthValues);
    if (highestMonth === 0) highestMonth = 1; // prevent divide by zero
    
    const months = monthLabels.map((label, i) => ({
      label,
      value: monthValues[i]
    }));

    const timeInMonths = parseInt(timeOnPlatform) || 1;
    const avgMonthly = lifetimeEarnings / timeInMonths;

    return { 
      totalKg, breakdown, count: completed.length + completedOrders.length, 
      totalCarbon, lifetimeEarnings, months, highestMonth, avgMonthly 
    };
  }, [bookings, receivedOrders, timeOnPlatform]);

  // ── PROFESSIONAL PROGRESSION (Tier System) ──
  const TIERS = [
    { name: 'Registered Collector', minJobs: 0, minKg: 0, icon: '🌱' },
    { name: 'Established Partner', minJobs: 5, minKg: 200, icon: '🤝' },
    { name: 'Bronze Partner', minJobs: 20, minKg: 1000, icon: '🥉' },
    { name: 'Silver Partner', minJobs: 50, minKg: 5000, icon: '🥈' },
    { name: 'Gold Partner', minJobs: 100, minKg: 20000, icon: '🥇' },
  ];

  const progression = useMemo(() => {
    let currentTierIdx = 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (stats.count >= TIERS[i].minJobs && stats.totalKg >= TIERS[i].minKg) {
        currentTierIdx = i;
        break;
      }
    }
    const current = TIERS[currentTierIdx];
    const next = TIERS[Math.min(currentTierIdx + 1, TIERS.length - 1)];
    const isMaxTier = currentTierIdx === TIERS.length - 1;

    // Progress toward next tier (use jobs as primary metric)
    const progress = isMaxTier ? 100 : Math.min(100, Math.round((stats.count / next.minJobs) * 100));
    const jobsRemaining = isMaxTier ? 0 : Math.max(0, next.minJobs - stats.count);

    return { current, next, progress, jobsRemaining, isMaxTier, currentTierIdx, allTiers: TIERS };
  }, [stats.count, stats.totalKg]);

  const level = progression.current.name;

  // ── DYNAMIC SKILL BADGES (with ranking history) ──
  const badges = useMemo(() => {
    const b: any[] = [];
    const completed = bookings.filter(b => b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');
    const total = completed.length + cancelled.length;
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 100;

    // Reliability badge
    if (completionRate >= 95 && completed.length >= 5) {
      b.push({ icon: ShieldCheck, color: 'emerald', title: 'Highly Reliable', desc: `${completionRate}% completion rate across ${total} jobs. Top-tier reliability.` });
    } else if (completionRate >= 80 && completed.length >= 3) {
      b.push({ icon: Briefcase, color: 'blue', title: 'Reliable Operator', desc: `${completionRate}% completion rate. Consistently delivers on commitments.` });
    }

    // Material specialization badges
    const breakdownEntries = Object.entries(stats.breakdown);
    breakdownEntries.sort((a, b) => (b[1] as number) - (a[1] as number));
    if (breakdownEntries.length > 0) {
      const [topMaterial, topKg] = breakdownEntries[0];
      if ((topKg as number) > 50) {
        const matName = topMaterial.charAt(0).toUpperCase() + topMaterial.slice(1);
        b.push({ icon: Activity, color: 'emerald', title: `${matName} Specialist`, desc: `Handled ${(topKg as number).toLocaleString()}kg of ${matName}. Verified expertise in this material category.` });
      }
    }

    // Volume badge
    if (stats.totalKg > 1000) {
      b.push({ icon: BarChart3, color: 'indigo', title: 'Volume Operator', desc: `Processed ${stats.totalKg.toLocaleString()}kg total. Demonstrated capacity for bulk-scale operations.` });
    }

    // Tenure badge
    const months = parseInt(timeOnPlatform) || 0;
    if (months >= 6) {
      b.push({ icon: Award, color: 'blue', title: 'Veteran Member', desc: `Active on Klinflow for ${months} months. Established network presence.` });
    }

    // Verification badge (from actual profile.isVerified)
    if (profile?.isVerified) {
      b.push({ icon: CheckCircle2, color: 'emerald', title: 'Klinflow Verified', desc: 'Identity and business credentials have been manually verified by the Klinflow team.' });
    }

    // Fallback
    if (b.length === 0) {
      b.push({ icon: ShieldCheck, color: 'blue', title: 'New Operator', desc: 'Complete 3+ jobs to begin earning professional badges and verifications.' });
    }
    return b;
  }, [stats, bookings, timeOnPlatform, profile?.isVerified]);


  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-800 min-h-screen transition-colors font-sans">
      
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600 transition-all">
        <div className="max-w-xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-3 px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">Circular Resume</h1>
                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mt-0.5">Professional Identity</p>
              </div>
            </div>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[11px] flex items-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              Share <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB NAVIGATION */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'activity', label: 'History & Impact' },
              { id: 'financial', label: 'Financial' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+7.5rem)] pb-12 max-w-xl mx-auto w-full space-y-6">

        {/* ── PROFESSIONAL IDENTITY CARD ── */}
        <div className="bg-slate-200 dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
            
            <div className="flex gap-5 items-start">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {profile?.avatarUrl ? (
                    <OptimizedImage src={getThumbnailUrl(profile.avatarUrl, { width: 200 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>
              
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{profile?.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {progression.current.icon} {level}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  {profile?.isVerified ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Klinflow Verified
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/settings/request-verification')}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/30 active:scale-95 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Get Verified
                    </button>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wide">
                      {profile?.county || profile?.estate || 'Nairobi, Kenya'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wide">
                      Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="flex flex-col md:items-end justify-center flex-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 md:text-right">Klinflow Trust Score</p>
                <div className="flex items-baseline gap-1 md:justify-end">
                  <span className="text-2xl font-black text-emerald-600 dark:text-white leading-none">{trustScore}</span>
                  <span className="text-[12px] font-bold text-slate-400">/ 1000</span>
                </div>
              </div>
              
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out"
                    strokeDasharray={`${Math.min(100, Math.max(0, (trustScore / 1000) * 100))}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-slate-700 dark:text-white">{Math.round((trustScore / 1000) * 100)}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <OverviewTab key="overview" profile={profile} stats={stats} level={level} trustScore={trustScore} badges={badges} timeOnPlatform={timeOnPlatform} progression={progression} />}
          {activeTab === 'activity' && <ActivityTab key="activity" bookings={bookings} stats={stats} />}
          {activeTab === 'financial' && <FinancialTab key="financial" data={stats} />}
        </AnimatePresence>

      </main>

      <ShareResumeModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        profile={profile}
        stats={stats}
        trustScore={trustScore}
        level={level}
      />
    </div>
  );
}
