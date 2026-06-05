import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PostTradeMaterialStep({
  searchQuery,
  setSearchQuery,
  wasteType,
  setWasteType,
  quantity,
  setQuantity,
  categories,
  setSelectedSubItem,
  getPriceForMaterial
}: any) {
  return (
    <motion.div key="p1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 leading-tight">What asset are you looking to trade today?</p>
      </div>

      <div className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search waste categories (e.g. plastic, metal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-900/70 p-4 pl-11 pr-10 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold dark:text-white outline-none focus:border-emerald-500/50 focus:ring-2 ring-emerald-500/20 transition-all shadow-sm"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
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

        <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Select Material Type</h3>
        <div className="grid grid-cols-2 gap-4">
          {categories.filter((cat: any) =>
            (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
          ).map((cat: any) => {
            const isSelected = wasteType?.id === cat.id;
            const identifier = (cat.slug || cat.id || '').toLowerCase();
            let bgImage = cat.image_url;
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
                    label: cat.label,
                    price_per_unit: getPriceForMaterial(cat.id),
                    unit: 'kg',
                    slug: cat.slug || cat.id
                  });
                }}
                className={`relative h-32 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group overflow-hidden border-2 ${isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-100 dark:border-slate-800 hover:border-emerald-500/40'
                  }`}
                style={bgImage ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.6)), url(${bgImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {!bgImage && <div className={`absolute inset-0 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                {!bgImage && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-emerald-500/10 transition-colors z-0" />}

                <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${bgImage ? 'bg-white/10 backdrop-blur-md' : (isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800/50')
                  }`}>
                  {cat.icon || '📦'}
                </div>
                <span className={`relative z-10 text-xs font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : (isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')
                  }`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
        {categories.filter((cat: any) =>
          (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
        ).length === 0 && (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-500">No categories found matching "{searchQuery}"</p>
            </div>
          )}
      </div>

      <div className="space-y-3 pb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Est. Weight (KG)</h3>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">{quantity} KG</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-[1.25rem] space-y-4">
          <input
            type="range"
            min="1"
            max="100"
            step="0.5"
            value={quantity || 1}
            onChange={(e) => setQuantity(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-200 dark:bg-slate-900/70 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="relative group">
            <input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="12.5"
              className="w-full bg-slate-50 dark:bg-slate-900/70 p-3 rounded-xl text-base font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all text-center"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
