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
  logisticsFee,
  photos,
  askingPrice
}: any) {
  return (
    <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Post Summary</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">Review your trade details before confirming.</p>
      </div>

      {/* ── MATERIAL PREVIEW ── */}
      <div className="bg-white dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
        {photos && photos.length > 0 ? (
          <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 relative">
            <div className={`flex ${photos.length > 1 ? 'overflow-x-auto snap-x snap-mandatory' : ''} hide-scrollbar w-full h-full`}>
              {photos.map((p: any, idx: number) => (
                <div key={idx} className="min-w-full h-full shrink-0 snap-center relative">
                  <img
                    src={typeof p === 'string' ? p : URL.createObjectURL(p)}
                    alt={`Proof ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-white text-[10px] font-bold tracking-widest">
                      {idx + 1} / {photos.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No Image</span>
          </div>
        )}
        <div className="p-5 bg-white dark:bg-slate-900/70 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Target Material</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight leading-none">{wasteType?.label}</h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Stock Weight</p>
            <p className="text-sm font-black text-emerald-600 capitalize tracking-widest">{quantity} KG</p>
          </div>
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
      <div className="bg-emerald-600 dark:bg-primary rounded-[1rem] p-4 relative overflow-hidden  border border-white/20">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/20 rounded-full blur-3xl" />
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            {askingPrice != null && (
              <div className="flex justify-between items-center text-white">
                <span className="text-[10px] font-black capitalize tracking-widest">Asking Price</span>
                <span className="text-sm font-bold">KSh {askingPrice.toLocaleString()} /kg</span>
              </div>
            )}
            <div className="flex justify-between items-center text-white">
              <span className="text-[10px] font-black capitalize tracking-widest">Gross Value</span>
              <span className="text-sm font-bold">KSh {assetValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-white/90">
              <span className="text-[10px] font-black capitalize tracking-widest">Logistics Fee</span>
              <span className="text-sm font-bold">- KSh {pickupMode === 'pickup' ? logisticsFee : 0}</span>
            </div>
            <div className="pt-4 border-t border-white/60 flex justify-between items-center">
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
