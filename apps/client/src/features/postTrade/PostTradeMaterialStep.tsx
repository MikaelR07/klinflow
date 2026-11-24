import { Search, X, Camera, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { callHygeneXAgent } from '@klinflow/core/lib/hygenexAgent';

export default function PostTradeMaterialStep({
  searchQuery,
  setSearchQuery,
  wasteType,
  setWasteType,
  quantity,
  setQuantity,
  categories,
  setSelectedSubItem,
  getPriceForMaterial,
  selectedSubcategory,
  setSelectedSubcategory,
  grade,
  setGrade,
  userId
}: any) {
  const materialPrices = useServiceStore(s => s.materialPrices);
  const [isIdentifying, setIsIdentifying] = useState(false);

  const handleAIScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !wasteType) return;

    setIsIdentifying(true);
    const toastId = toast.loading('HygeneX is analyzing your material...');
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = (reader.result as string).split(',')[1];
        
        const validSubcategories = materialPrices
          .filter(m => m.category === wasteType.label)
          .map(m => m.material_name);

        const result = await callHygeneXAgent.visionScan(
          userId,
          base64Image,
          wasteType.label,
          validSubcategories
        );

        if (result && result.material && validSubcategories.includes(result.material)) {
          setSelectedSubcategory(result.material);
          
          const subItem = materialPrices.find(m => m.material_name === result.material);
          if (subItem) {
            setSelectedSubItem({
              id: `sub-${subItem.id}`,
              label: subItem.material_name,
              price_per_unit: subItem.price_per_kg,
              unit: 'kg',
              slug: subItem.material_name.toLowerCase().replace(/\s+/g, '-')
            });
          }
          toast.success(`Identified as ${result.material}`, { id: toastId });
        } else {
          toast.error('Could not confidently identify the material. Please select manually.', { id: toastId });
        }
      };
    } catch (err) {
      console.error('AI Scan Error:', err);
      toast.error('Failed to analyze image.', { id: toastId });
    } finally {
      setIsIdentifying(false);
    }
  };

  return (
    <motion.div key="p1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
     
      <div className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search waste categories (e.g. plastic, metal)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/70 p-4 pl-11 pr-10 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 text-xs font-semibold dark:text-white outline-none focus:border-emerald-500/50 focus:ring-2 ring-emerald-500/20 transition-all"
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
        <div className="grid grid-cols-2 gap-2.5">
          {categories.filter((cat: any) =>
            (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
          ).map((cat: any) => {
            const isSelected = wasteType?.id === cat.id;
            const identifier = (cat.slug || cat.id || '').toLowerCase();
            const catLabel = (cat.label || (cat as any).name || '').toLowerCase();
            let bgImage = cat.image_url;
            if (!bgImage) {
              if (identifier.includes('textile') || identifier.includes('clothes') || catLabel.includes('textile') || catLabel.includes('clothes')) bgImage = '/material-categories/textile.webp';
              else if (identifier.includes('paper') || identifier.includes('cardboard') || identifier.includes('box')) bgImage = '/material-categories/boxes.webp';
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
            const imgPath = bgImage || '/material-categories/recyclables.webp';
            const priceVal = getPriceForMaterial(cat.id) || cat.price_per_unit || cat.price_per_kg || 0;
            const displayPrice = priceVal ? `Upto ${priceVal}/kg` : 'Tap to select';

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
                className={`bg-slate-50 dark:bg-slate-800/70 rounded-2xl border overflow-hidden text-left active:scale-95 transition-all ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/70 dark:border-slate-700/60 hover:border-emerald-500/40'
                }`}
              >
                <div className="h-24 w-full bg-slate-200/60 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={imgPath}
                    alt={cat.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate leading-tight">
                    {cat.label}
                  </p>
                  <p className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                    {displayPrice}
                  </p>
                </div>
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

      {/* ── UNIFIED MATERIAL DETAILS, AI SCAN & WEIGHT CARD ── */}
      <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 p-4 space-y-5 mb-6">
        {wasteType && (
          <>
            {/* Specific Material Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-white tracking-tight block">
                Specific Material Type
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => {
                  setSelectedSubcategory(e.target.value);
                  const subItem = materialPrices.find(m => m.material_name === e.target.value);
                  if (subItem) {
                    setSelectedSubItem({
                      id: `sub-${subItem.id}`,
                      label: subItem.material_name,
                      price_per_unit: subItem.price_per_kg,
                      unit: 'kg',
                      slug: subItem.material_name.toLowerCase().replace(/\s+/g, '-')
                    });
                  }
                }}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" disabled>Select specific material...</option>
                {materialPrices
                  .filter(m => m.category === wasteType.label || m.category === wasteType.slug || m.category === wasteType.id)
                  .map(m => (
                    <option key={m.id} value={m.material_name}>{m.material_name}</option>
                  ))}
              </select>
            </div>

            {/* Material Grade / Quality */}
            <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-4 space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-white tracking-tight block">
                Material Grade / Quality
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="Premium">Premium</option>
                <option value="Standard">Standard</option>
                <option value="Mixed">Mixed</option>
                <option value="Low Grade">Low Grade</option>
              </select>
            </div>

            {/* AI Material Scanner */}
            <div className="border-t border-slate-200/70 dark:border-slate-700/60 pt-4">
              <div className="bg-white dark:bg-slate-900 border border-indigo-200/70 dark:border-indigo-800/50 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      Not sure? Let AI identify it
                    </p>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                      Snap a photo to auto-detect material type.
                    </p>
                  </div>
                </div>
                <label className={`shrink-0 flex items-center gap-1.5 px-3 py-2 ${isIdentifying ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'} text-white rounded-xl font-bold text-[11px] cursor-pointer transition-all`}>
                  {isIdentifying ? (
                    <span className="animate-pulse">Scanning...</span>
                  ) : (
                    <>
                      <Camera className="w-3.5 h-3.5" />
                      <span>Scan</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleAIScan} className="hidden" />
                    </>
                  )}
                </label>
              </div>
            </div>
          </>
        )}

        {/* Est. Weight (KG) */}
        <div className={`${wasteType ? 'border-t border-slate-200/70 dark:border-slate-700/60 pt-4' : ''} space-y-3`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">Est. Weight (KG)</h3>
            <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full text-[11px] font-bold">
              {quantity || 0} KG
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="0.5"
            value={quantity || 1}
            onChange={(e) => setQuantity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="relative">
            <input
              type="number"
              value={quantity || ''}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="12.5"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 p-3 rounded-xl text-base font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all text-center tabular-nums"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
