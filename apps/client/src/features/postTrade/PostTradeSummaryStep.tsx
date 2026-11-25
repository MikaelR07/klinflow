import { Truck, Home, Package, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostTradeSummaryStep({
  wasteType,
  selectedSubcategory,
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
  askingPrice,
  hideFinancials
}: any) {
  const netRevenue = assetValue - (pickupMode === 'pickup' ? logisticsFee : 0);

  return (
    <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-8">
      <div className="space-y-0.5 px-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Trade Summary</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Review your trade details before confirming.</p>
      </div>

      {/* ── MATERIAL PREVIEW & TARGET ── */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl overflow-hidden">
        {photos && photos.length > 0 ? (
          <div className="w-full aspect-video bg-slate-100 dark:bg-slate-900 relative">
            <div className={`flex ${photos.length > 1 ? 'overflow-x-auto snap-x snap-mandatory' : ''} hide-scrollbar w-full h-full`}>
              {photos.map((p: any, idx: number) => (
                <div key={idx} className="min-w-full h-full shrink-0 snap-center relative">
                  <img
                    src={typeof p === 'string' ? p : URL.createObjectURL(p)}
                    alt={`Proof ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {photos.length > 1 && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-white text-[10px] font-bold">
                      {idx + 1} / {photos.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video bg-slate-100/80 dark:bg-slate-800/80 flex flex-col items-center justify-center gap-1.5 border-b border-slate-200/70 dark:border-slate-700/60">
            <Package className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Image Provided</span>
          </div>
        )}

        <div className="p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {(!photos || photos.length === 0) && (
              <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">Target Material</p>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate leading-tight mt-0.5">
                {selectedSubcategory || wasteType?.label}
              </h3>
              {selectedSubcategory && (
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                  {wasteType?.label}
                </p>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">Stock Weight</p>
            <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
              {quantity} KG
            </p>
          </div>
        </div>
      </div>

      {/* ── UNIFIED COLLECTION & FINANCIAL BREAKDOWN CARD ── */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-4">
        {/* Collection Method */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pickupMode === 'pickup' ? 'bg-amber-100/90 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-emerald-100/90 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
              {pickupMode === 'pickup' ? <Truck className="w-4 h-4" /> : <Home className="w-4 h-4" />}
            </div>
            <div>
              <p className="text-[10.5px] font-semibold text-slate-400 dark:text-slate-500">Collection Method</p>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {pickupMode === 'pickup' ? 'Agent Dispatch' : 'Self Drop-off'}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs">
            {pickupMode === 'pickup' ? (
              <>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Target Address</span>
                  <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{profile?.location?.estate || 'My Location'}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Pickup Time</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">{isManualTime ? `${customDate} @ ${customTime}` : 'ASAP (1–2 Hours)'}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Drop-off Hub</span>
                  <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{selectedHub?.name || 'Selected Hub'}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Hub Address</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{selectedHub?.address || '—'}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Financial Breakdown */}
        {!hideFinancials && (
          <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-4 space-y-3">
            <p className="text-xs font-bold text-slate-800 dark:text-white">Financial Breakdown</p>

            <div className="space-y-2 text-xs">
              {askingPrice != null && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Asking Price</span>
                  <span className="font-bold text-slate-800 dark:text-white tabular-nums">KSh {askingPrice.toLocaleString()} /kg</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  Gross Value {askingPrice != null ? `(${askingPrice.toLocaleString()} × ${quantity}kg)` : ''}
                </span>
                <span className="font-bold text-slate-800 dark:text-white tabular-nums">KSh {assetValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Logistics Fee</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {pickupMode === 'pickup' && logisticsFee > 0 ? `- KSh ${logisticsFee}` : 'Free (KSh 0)'}
                </span>
              </div>
            </div>

            <div className="bg-emerald-950 text-white rounded-xl p-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Est. Net Revenue</p>
                <p className="text-[10.5px] text-emerald-100/80 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                  Payout upon verification
                </p>
              </div>
              <p className="text-xl font-extrabold tracking-tight tabular-nums shrink-0">
                KSh {netRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
