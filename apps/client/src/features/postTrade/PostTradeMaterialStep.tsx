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
        <div className="grid grid-cols-3 gap-1">
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
                className={`relative h-20 rounded-xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all group overflow-hidden border-2 ${isSelected
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

                <div className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center text-sm group-hover:scale-110 transition-transform ${bgImage ? 'bg-white/10 backdrop-blur-md' : (isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800/50')
                  }`}>
                  {cat.icon || '📦'}
                </div>
                <span className={`relative z-10 text-[9px] font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : (isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')
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

      {wasteType && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">
              2. Specific Material Type
            </p>
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
              className="w-full p-3 rounded-xl bg-white dark:bg-slate-900/60 border 
                         border-slate-200 dark:border-slate-700 text-sm font-semibold 
                         text-slate-900 dark:text-white outline-none focus:border-emerald-500 
                         transition-all appearance-none"
            >
              <option value="" disabled>Select specific material...</option>
              {materialPrices
                .filter(m => m.category === wasteType.label || m.category === wasteType.slug || m.category === wasteType.id)
                .map(m => (
                  <option key={m.id} value={m.material_name}>{m.material_name}</option>
                ))}
            </select>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 
                          dark:from-indigo-900/20 dark:to-purple-900/20 
                          border border-indigo-100 dark:border-indigo-800/50 
                          rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <p className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 
                            uppercase tracking-widest">
                Not sure? Let AI identify it
              </p>
            </div>
            <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70 leading-relaxed">
              Take a photo of your material and our AI will identify the exact type for you.
            </p>
            <label className={`flex items-center justify-center gap-2 py-3 
                              ${isIdentifying ? 'bg-indigo-400' : 'bg-indigo-600 active:scale-95'} 
                              text-white rounded-xl font-bold text-xs 
                              uppercase tracking-widest cursor-pointer transition-all`}>
              {isIdentifying ? (
                <span className="animate-pulse">Identifying...</span>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Scan Material</span>
                  <input type="file" accept="image/*" capture="environment" 
                         onChange={handleAIScan} className="hidden" />
                </>
              )}
            </label>
          </div>
        </motion.div>
      )}

      <div className="space-y-3 pb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Est. Weight (KG)</h3>
          <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">{quantity} KG</div>
        </div>
        <div className="bg-emerald-800  border-2 border-slate-100 dark:border-slate-800 p-4 rounded-[1.25rem] space-y-2">
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
              className="w-full bg-emerald-700 text-white p-3 rounded-xl text-base font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all text-center"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
