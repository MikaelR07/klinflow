import { Truck, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostTradeSummaryStep({
  wasteType,
  quantity,
  pickupMode,
  profile,
  isManualTime,
  customDate,
  customTime,
  selectedHub,
  assetValue,
  logisticsFee
}: any) {
  return (
    <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Post Summary</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">Review your trade details before confirming.</p>
      </div>

      {/* ── MATERIAL PREVIEW ── */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
          {wasteType?.icon || '📦'}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{wasteType?.label}</h3>
          <p className="text-xs font-semibold text-emerald-600 capitalize tracking-widest mt-1">{quantity} KG Stock</p>
        </div>
      </div>

      {/* ── LOGISTICS SUMMARY (CONTEXTUAL) ── */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {pickupMode === 'pickup' ? <Truck className="w-5 h-5" /> : <Home className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Collection Method</p>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{pickupMode === 'pickup' ? 'Agent Dispatch' : 'Self Drop-off'}</h4>
          </div>
        </div>

        {pickupMode === 'pickup' ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 capitalize">Target Address</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">{profile?.location?.estate || 'My Location'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 capitalize">Pickup Time</span>
              <span className="text-xs font-semibold text-emerald-600">{isManualTime ? `${customDate} @ ${customTime}` : 'ASAP (4-12 mins)'}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 capitalize">Drop-off Hub</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedHub?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400 capitalize">Hub Address</span>
              <span className="text-xs font-semibold text-slate-500">{selectedHub?.address}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── FINANCIAL BREAKDOWN ── */}
      <div className="bg-emerald-600 dark:bg-primary rounded-[2rem] p-8 relative overflow-hidden shadow-2xl border border-white/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/20 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-white">
              <span className="text-[10px] font-black capitalize tracking-widest">Gross Value</span>
              <span className="text-sm font-bold">KSh {assetValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-white/90">
              <span className="text-[10px] font-black capitalize tracking-widest">Logistics Fee</span>
              <span className="text-sm font-bold">- KSh {pickupMode === 'pickup' ? logisticsFee : 0}</span>
            </div>
            <div className="pt-4 border-t border-white/20 flex justify-between items-center">
              <span className="text-[10px] font-black text-white capitalize tracking-widest">EST. REVENUE</span>
              <div className="text-right">
                <h3 className="text-3xl font-black text-white tracking-tighter">KSh {(assetValue - (pickupMode === 'pickup' ? logisticsFee : 0)).toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-white/95 capitalize tracking-widest mt-1.5 flex items-center justify-end gap-1.5">
                  PAYOUT: AWAITING VERIFICATION
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
