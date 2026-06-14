/**
 * BookPickup Step 1 — Material Selection, Quantity, Photo & Description
 * Extracted from BookPickup.tsx for modularity.
 */
import { useMemo } from 'react';
import {
  Camera, Info, Trash2, Smartphone, Search, X, Scale
} from 'lucide-react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@klinflow/ui';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import type { BookPickupCategory } from './bookPickup.types';

interface BookPickupMaterialStepProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  wasteType: any;
  setWasteType: (w: any) => void;
  selectedSubItem: any;
  setSelectedSubItem: (s: any) => void;
  quantity: any;
  setQuantity: (q: any) => void;
  photo: any;
  setPhoto: (p: any) => void;
  customDescription: string;
  setCustomDescription: (d: string) => void;
  categories: BookPickupCategory[];
  isLoading: boolean;
}

export default function BookPickupMaterialStep({
  searchQuery, setSearchQuery,
  wasteType, setWasteType,
  selectedSubItem, setSelectedSubItem,
  quantity, setQuantity,
  photo, setPhoto,
  customDescription, setCustomDescription,
  categories, isLoading
}: BookPickupMaterialStepProps) {

  // Memoize the image URL to prevent flickering on re-renders (like when typing)
  const photoPreviewUrl = useMemo(() => {
    if (!photo) return null;
    return typeof photo === 'string' ? photo : URL.createObjectURL(photo);
  }, [photo]);

  return (
    <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
      <div className="space-y-2.5">
        {!wasteType ? (
          <div className="space-y-2.5">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight italic ml-1">What are we picking up today?</h3>

            {categories.length === 0 && isLoading ? (
              <div className="grid grid-cols-2 gap-4 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800/80 rounded-xl" />
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/80 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Premium Category Search Input */}
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search waste categories (e.g. plastic, metal)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 p-4 pl-11 pr-10 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold dark:text-white outline-none focus:border-primary/50 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1">
                  {categories.filter(cat =>
                    (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).sort((a, b) => {
                    const aSlug = (a.slug || a.id || '').toLowerCase();
                    const bSlug = (b.slug || b.id || '').toLowerCase();
                    const aLabel = (a.label || '').toLowerCase();
                    const bLabel = (b.label || '').toLowerCase();

                    const isABulky = aSlug.includes('bulky') || aSlug.includes('appliance') || aLabel.includes('bulky') || aLabel.includes('appliance');
                    const isBBulky = bSlug.includes('bulky') || bSlug.includes('appliance') || bLabel.includes('bulky') || bLabel.includes('appliance');

                    if (isABulky && !isBBulky) return 1;
                    if (!isABulky && isBBulky) return -1;
                    return 0;
                  }).map((cat) => {
                    const identifier = ((cat as any).slug || (cat as any).id || '').toLowerCase();
                    let bgImage = (cat as any).image_url;
                    if (!bgImage) {
                      if (identifier.includes('paper') || identifier.includes('cardboard') || identifier.includes('box')) bgImage = '/material-categories/boxes.webp';
                      else if (identifier.includes('plastic')) bgImage = '/material-categories/plastic.webp';
                      else if (identifier.includes('ewaste') || identifier.includes('e-waste') || identifier.includes('electronic')) bgImage = '/material-categories/E-waste.webp';
                      else if (identifier.includes('metal')) bgImage = '/material-categories/metal.webp';
                      else if (identifier.includes('organic') || identifier.includes('food')) bgImage = '/material-categories/organic-waste.webp';
                      else if (identifier.includes('general') || identifier.includes('trash')) bgImage = '/material-categories/general-waste.webp';
                      else if (identifier.includes('glass')) bgImage = '/material-categories/glasses.webp';
                      else if (identifier.includes('appliance')) bgImage = '/material-categories/bulky-item.webp';
                      else if (identifier.includes('bulky') || identifier.includes('sofa') || identifier.includes('furniture')) bgImage = '/material-categories/bulky-sofas.webp';
                      else if (identifier.includes('recycl')) bgImage = '/material-categories/recyclables.webp';
                    }

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setWasteType(cat);
                          setSelectedSubItem({
                            id: `cat-${cat.id}`,
                            label: `${cat.label} (Mixed)`,
                            price_per_unit: usePriceStore.getState().getCategoryPrice(cat.id) || 0,
                            unit: 'kg',
                            slug: cat.slug || cat.id
                          });
                        }}
                        className="relative h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md group hover:border-primary/40 overflow-hidden"
                        style={bgImage ? {
                          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {!bgImage && <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/10 transition-colors" />}
                        <div className={`w-8 h-8 ${bgImage ? 'bg-white/10 backdrop-blur-md' : 'bg-slate-50 dark:bg-slate-800/50'} rounded-xl flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
                          {cat.icon || '📦'}
                        </div>
                        <span className={`text-[10px] font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}

                  {categories.filter(cat =>
                    (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                      <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                        <p className="text-xs font-semibold text-slate-500">No categories found matching "{searchQuery}"</p>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[28px] border border-primary/20 relative shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xl text-white">{wasteType.icon}</div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold dark:text-white leading-none">{wasteType.label}</h3>
              <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mt-1">Ready for pickup</p>
            </div>
            <button onClick={() => { setWasteType(null); setSelectedSubItem(null); setSearchQuery(''); }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-primary capitalize tracking-widest">Change</button>
          </div>
        )}
      </div>

      {wasteType && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold capitalize tracking-widest text-slate-400 ml-2">Estimated Quantity</h2>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
            <input
              type="range"
              min="1"
              max="100"
              value={quantity || 1}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex items-center gap-4">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-xl font-semibold dark:text-white active:scale-95 transition-transform shrink-0">-</button>
              <div className="flex-1 text-center relative group">
                <input
                  type="number"
                  min="1"
                  value={quantity || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setQuantity(isNaN(val) ? '' : Math.max(1, val));
                  }}
                  onBlur={() => {
                    if (!quantity || quantity < 1) setQuantity(1);
                  }}
                  className="w-full bg-transparent text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter text-center outline-none appearance-none"
                  style={{ MozAppearance: 'textfield' }}
                />
                <p className="text-xs font-semibold capitalize tracking-widest text-primary mt-0.5">KG</p>
              </div>
              <button onClick={() => setQuantity((quantity || 0) + 1)} className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center text-xl font-semibold text-white shadow-md active:scale-95 transition-transform shrink-0">+</button>
            </div>
          </div>
        </div>
      )}

      {wasteType && (
        <div className="space-y-4 pt-2 animate-slide-up">
          <h2 className="text-xs font-semibold capitalize tracking-widest text-slate-400 ml-2">Recyclables Proof (Optional)</h2>

          {/* Photo Capture */}
          <div className="relative group">
            {photo ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary shadow-xl">
                <OptimizedImage
                  src={photoPreviewUrl as string}
                  className="w-full h-full object-cover"
                  wrapperClassName="w-full h-full"
                />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <label className="flex-1 flex flex-col items-center justify-center aspect-[1.5/1] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1.5">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize tracking-widest italic">Take Photo</p>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    capture="environment"
                    onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                  />
                </label>

                <label className="flex-1 flex flex-col items-center justify-center aspect-[1.5/1] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-1.5">
                    <Smartphone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize tracking-widest italic">From Gallery</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Item Description (Always Visible for Mission Context) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Special Instructions</p>
            <textarea
              placeholder="e.g. 'Leave at the back gate'..."
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-semibold dark:text-white outline-none focus:border-primary/50 focus:ring-2 ring-primary/20 transition-all shadow-sm min-h-[80px] resize-none"
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
