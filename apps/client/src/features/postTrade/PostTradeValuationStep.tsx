import { Camera, Smartphone, X, AlertCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PostTradeValuationStep({
  photos,
  setPhotos,
  liveRatePerKg,
  customPricePerKg,
  setCustomPricePerKg,
  customDescription,
  setCustomDescription
}: any) {
  return (
    <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-8">
      <div className="space-y-0.5 px-1">
        <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Valuation</h2>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Provide proof and set your asking price.</p>
      </div>

      {/* ── UNIFIED VALUATION CARD ── */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-5">
        {/* PHOTO CAPTURE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight capitalize">
              Visual Proof <span className="text-slate-400 font-semibold ml-1">({photos.length}/4)</span>
            </h3>
            {photos.length > 0 && (
              <button onClick={() => setPhotos([])} className="text-[11px] font-bold text-rose-500 capitalize tracking-wider">
                Clear All
              </button>
            )}
          </div>

          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from((e.target as HTMLInputElement).files || []);
              if (files.length > 0) {
                const newPhotos = [...photos, ...files].slice(0, 4);
                setPhotos(newPhotos);
                toast.success(`${newPhotos.length} Photo${newPhotos.length > 1 ? 's' : ''} Uploaded!`);
              }
            }}
          />

          {photos.length === 0 ? (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.capture = 'environment';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0] || null;
                    if (file) setPhotos((prev: any[]) => [...prev, file].slice(0, 4));
                  };
                  input.click();
                }}
                className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500/40 transition-colors group bg-white dark:bg-slate-900"
              >
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Camera</p>
              </button>

              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.multiple = true;
                  input.onchange = (e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    setPhotos((prev: any[]) => [...prev, ...files].slice(0, 4));
                  };
                  input.click();
                }}
                className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500/40 transition-colors group bg-white dark:bg-slate-900"
              >
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Gallery</p>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {photos.map((p: any, idx: number) => (
                <div key={idx} className="relative h-28 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 group">
                  <img
                    src={typeof p === 'string' ? p : URL.createObjectURL(p)}
                    alt={`Proof ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setPhotos(photos.filter((_: any, i: number) => i !== idx))}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photos.length < 4 && (
                <button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="h-28 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-emerald-500/40 transition-colors group bg-white dark:bg-slate-900"
                >
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize tracking-wider">Add Angle</p>
                </button>
              )}
            </div>
          )}

          {photos.length === 0 && (
            <div className="bg-amber-50/90 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                Clear photos help buyers verify quality and approve your asking price faster.
              </p>
            </div>
          )}
        </div>

        {/* ASKING PRICE */}
        <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">Set Your Asking Price</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10.5px] font-bold text-slate-600 dark:text-slate-300">Market: KSh {liveRatePerKg}</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">KSh</div>
            <input
              type="number"
              value={customPricePerKg !== null ? customPricePerKg : ''}
              onChange={(e) => {
                const val = e.target.value;
                setCustomPricePerKg(val === '' ? null : parseFloat(val));
              }}
              placeholder={String(liveRatePerKg)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 py-4 px-14 rounded-xl text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all text-center tabular-nums"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">/ KG</div>
          </div>
        </div>

        {/* MATERIAL DESCRIPTION */}
        <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">Material Description</h3>
            <span className="text-[11px] font-semibold text-slate-400">Optional</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5">
            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <textarea
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Tell the buyer and agent more about the quality or collection specifics..."
                className="w-full bg-transparent text-xs font-medium text-slate-800 dark:text-white outline-none placeholder:text-slate-400 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
