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
    <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Valuation</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">Provide proof and set your asking price.</p>
      </div>

      {/* PHOTO CAPTURE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize">Visual Proof <span className="text-xs text-slate-400 ml-1">({photos.length}/4)</span></h3>
          {photos.length > 0 && (
            <button onClick={() => setPhotos([])} className="text-xs font-semibold text-rose-500 capitalize tracking-widest">Clear All</button>
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
              className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-900/70"
            >
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Camera</p>
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
              className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-900/70"
            >
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Gallery</p>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((p: any, idx: number) => (
              <div key={idx} className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
                <img
                  src={typeof p === 'string' ? p : URL.createObjectURL(p)}
                  alt={`Proof ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setPhotos(photos.filter((_: any, i: number) => i !== idx))}
                  className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {photos.length < 4 && (
              <button
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-800"
              >
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Add Angle</p>
              </button>
            )}
          </div>
        )}

        {photos.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
              Take multiple images! Clear photos help buyers verify quality instantly and approve your asking price faster.
            </p>
          </div>
        )}
      </div>

      {/* ASKING PRICE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Set Your Asking Price</h3>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-500 capitalize tracking-widest">Market: KSh {liveRatePerKg}</span>
          </div>
        </div>
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">KSh</div>
          <input
            type="number"
            value={customPricePerKg !== null ? customPricePerKg : ''}
            onChange={(e) => {
              const val = e.target.value;
              setCustomPricePerKg(val === '' ? null : parseFloat(val));
            }}
            placeholder={String(liveRatePerKg)}
            className="w-full bg-white dark:bg-slate-900/70 border-2 border-slate-100 dark:border-slate-800 p-5 rounded-2xl text-lg font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all px-16 text-center"
          />
          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">/ KG</div>
        </div>
      </div>

      {/* MATERIAL DESCRIPTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize tracking-widest">Material Description</h3>
          <span className="text-xs font-semibold text-slate-400">Optional</span>
        </div>
        <div className="bg-white dark:bg-slate-900/70 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm group">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-slate-400 mt-1" />
            <textarea
              rows={2}
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Tell the buyer and agent more about the quality or collection specifics..."
              className="w-full bg-transparent text-sm text-slate-700 dark:text-white outline-none placeholder:text-slate-300 placeholder:text-[11px] resize-none"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
