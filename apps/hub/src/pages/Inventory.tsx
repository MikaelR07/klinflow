import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw,
  Loader2,
  ChevronRight,
  History,
  Info,
  X,
  Layers,
  TrendingUp,
  ArrowLeft,
  CircleDollarSign,
  Calendar,
  User,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  supabase, 
  useAuthStore, 
  getCategoryBySlug, 
  getSubcategoryLabel, 
  usePriceStore,
  normalizeKeys,
  Asset,
  AssetSchema,
  safeParseArray
} from '@klinflow/core';
import { toast } from 'sonner';

interface CategoryGroup {
  id: string;
  label: string;
  weight: number;
  value: number;
  count: number;
  color: string;
  assets: Asset[];
}

interface SubCategoryGroup {
  id: string;
  label: string;
  weight: number;
  value: number;
  count: number;
  assets: Asset[];
}

export default function Inventory() {
  const { profile } = useAuthStore();
  const { prices, fetchPrices, getPriceForMaterial } = usePriceStore();
  
  // Navigation State
  const [viewLevel, setViewLevel] = useState<'category' | 'subcategory' | 'asset'>('category');
  const [selectedCategory, setSelectedCategory] = useState<CategoryGroup | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategoryGroup | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
    fetchInventory();
  }, [profile?.id]);

  const fetchInventory = async () => {
    if (!profile?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await ((supabase
        .from('assets') as any)
        .select('*, profiles:verifier_id(name, avatar_url)')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub')
        .order('created_at', { ascending: false }));

      if (error) throw error;
      const rawMapped = (data || []).map((a: any) => normalizeKeys(a));
      const validAssets = safeParseArray(AssetSchema, rawMapped, 'Hub Inventory Fetch');
      setAllAssets(validAssets);
    } catch (err) {
      console.error('[Inventory] Fetch Error:', err);
      toast.error("Failed to sync inventory");
    } finally {
      setIsLoading(false);
    }
  };

  // ── DATA MAPPING & CALCULATIONS ──
  
  // Level 1: Categories
  const categoryData = useMemo<CategoryGroup[]>(() => {
    const groups = allAssets.reduce<Record<string, CategoryGroup>>((acc, asset) => {
      const type = asset.materialType || 'Other';
      if (!acc[type]) {
        const catInfo = getCategoryBySlug(type);
        acc[type] = {
          id: type,
          label: catInfo?.label || type,
          weight: 0,
          value: 0,
          count: 0,
          color: getCategoryColor(type),
          assets: []
        };
      }
      const rate = getPriceForMaterial(type);
      acc[type].weight += Number(asset.weightKg) || 0;
      acc[type].value += (Number(asset.weightKg) || 0) * rate;
      acc[type].count += 1;
      acc[type].assets.push(asset);
      return acc;
    }, {});
    return Object.values(groups);
  }, [allAssets, prices]);

  // Level 2: Subcategories for selected category
  const subcategoryData = useMemo<SubCategoryGroup[]>(() => {
    if (!selectedCategory) return [];
    const groups = selectedCategory.assets.reduce<Record<string, SubCategoryGroup>>((acc, asset) => {
      const sub = asset.grade || 'Standard';
      if (!acc[sub]) {
        acc[sub] = {
          id: sub,
          label: getSubcategoryLabel(selectedCategory.id, sub),
          weight: 0,
          value: 0,
          count: 0,
          assets: []
        };
      }
      const rate = getPriceForMaterial(selectedCategory.id); // Base rate for simplicity
      acc[sub].weight += Number(asset.weightKg) || 0;
      acc[sub].value += (Number(asset.weightKg) || 0) * rate;
      acc[sub].count += 1;
      acc[sub].assets.push(asset);
      return acc;
    }, {});
    return Object.values(groups);
  }, [selectedCategory, prices]);

  const totalHubWeight = categoryData.reduce((acc, item) => acc + item.weight, 0);
  const totalHubValue = categoryData.reduce((acc, item) => acc + item.value, 0);

  function getCategoryColor(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('plastic')) return 'emerald';
    if (t.includes('metal')) return 'blue';
    if (t.includes('e-waste')) return 'amber';
    if (t.includes('paper')) return 'orange';
    if (t.includes('glass')) return 'sky';
    return 'indigo';
  }

  // ── NAVIGATION HANDLERS ──
  const handleCategoryClick = (cat: CategoryGroup) => {
    setSelectedCategory(cat);
    setViewLevel('subcategory');
  };

  const handleSubClick = (sub: SubCategoryGroup) => {
    setSelectedSub(sub);
    setViewLevel('asset');
  };

  const goBack = () => {
    if (viewLevel === 'asset') {
      setViewLevel('subcategory');
      setSelectedSub(null);
    } else if (viewLevel === 'subcategory') {
      setViewLevel('category');
      setSelectedCategory(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] dark:bg-slate-900 pb-32">
      
      <AnimatePresence mode="wait">
        {viewLevel === 'category' && (
          <motion.div 
            key="header-stats"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="p-4 space-y-6">
            {/* ── HEADER & GLOBAL STATS ── */}
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-3xl font-semibold text-slate-800 dark:text-white tracking-tight">Audit Terminal</h1>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Industrial Inventory Management</p>
               </div>
               <button onClick={fetchInventory} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center border border-slate-100 dark:border-white/5 active:scale-90 transition-all">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4 text-slate-400" />}
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-600 rounded-[2rem] p-5 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
                  <Package className="w-5 h-5 mb-4 opacity-60" />
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">Stock Weight</p>
                  <h3 className="text-2xl font-semibold">{totalHubWeight.toFixed(1)} <span className="text-xs">KG</span></h3>
               </div>
               <div className="bg-slate-900 dark:bg-slate-900 rounded-[2rem] p-5 text-white shadow-xl relative overflow-hidden border border-white/5">
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
                  <CircleDollarSign className="w-5 h-5 mb-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-1">Total Asset Value</p>
                  <h3 className="text-2xl font-semibold text-primary">KSh {totalHubValue.toLocaleString()}</h3>
               </div>
            </div>

            {/* ── DRILL-DOWN NAVIGATION (Only on Layer 1) ── */}
            <div className="py-2">
               <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
                  <button 
                    onClick={() => { setViewLevel('category'); setSelectedCategory(null); setSelectedSub(null); }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-white shadow-lg uppercase tracking-widest transition-all whitespace-nowrap"
                  >
                    Overview
                  </button>
               </div>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="px-4">
        <AnimatePresence mode="wait">
          
          {/* LAYER 1: CATEGORIES */}
          {viewLevel === 'category' && (
            <motion.div 
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               {categoryData.map((cat) => (
                 <div 
                   key={cat.id} 
                   onClick={() => handleCategoryClick(cat)}
                   className="glass p-5 rounded-[2.5rem] flex flex-col justify-between group active:scale-95 transition-all cursor-pointer border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden"
                 >
                    <div className="absolute -top-6 -right-6 w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors" />
                    
                    <div>
                       <div className={`w-12 h-12 rounded-2xl bg-${cat.color}-500/10 flex items-center justify-center text-${cat.color}-600 mb-4 shadow-inner`}>
                          <Package className="w-6 h-6" />
                       </div>
                       <h3 className="text-sm font-semibold text-slate-800 dark:text-white leading-tight mb-1">{cat.label}</h3>
                       <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{cat.count} Batches</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Weight</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-white">{cat.weight.toFixed(1)}kg</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold text-slate-400 uppercase">Value</span>
                          <span className="text-xs font-semibold text-emerald-600">KSh {cat.value.toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
               ))}
              </div>
            </motion.div>
          )}

          {/* LAYER 2: SUBCATEGORIES / GRADES */}
          {viewLevel === 'subcategory' && (
            <motion.div 
              key="subcategory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="pt-4 space-y-4">
               <div className="flex items-center justify-between mb-2">
                  <button onClick={goBack} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 active:scale-90 transition-all">
                     <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="text-right">
                     <h2 className="text-xl font-semibold text-slate-800 dark:text-white leading-none">{selectedCategory?.label}</h2>
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Select Grade to Audit</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {subcategoryData.map((sub) => (
                    <div 
                      key={sub.id} 
                      onClick={() => handleSubClick(sub)}
                      className="bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] border-2 border-slate-100 dark:border-white/5 flex flex-col justify-between active:scale-95 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                    >
                       <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                             <TrendingUp className="w-5 h-5" />
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                       </div>
                       
                       <div>
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-tight mb-1">{sub.label}</h4>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Grade {sub.id}</p>
                       </div>

                       <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                          <p className="text-sm font-semibold text-slate-800 dark:text-white">{sub.weight.toFixed(1)} KG</p>
                          <p className="text-xs font-semibold text-emerald-600">KSh {sub.value.toLocaleString()}</p>
                       </div>
                    </div>
                  ))}
               </div>
              </div>
            </motion.div>
          )}

          {/* LAYER 3: ASSET LISTING */}
          {viewLevel === 'asset' && (
            <motion.div 
              key="asset"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="pt-4 space-y-4">
               <div className="flex items-center justify-between mb-2">
                  <button onClick={goBack} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 active:scale-90 transition-all">
                     <ArrowLeft className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="text-right">
                     <h2 className="text-xl font-semibold text-slate-800 dark:text-white leading-none">{selectedSub?.label}</h2>
                     <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">Transaction History</p>
                  </div>
               </div>

               <div className="space-y-3">
                  {selectedSub?.assets.map((asset) => (
                    <div key={asset.id} className="glass p-5 rounded-[2rem] border border-slate-100 dark:border-white/5 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                             <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none mb-1">{(asset as any).profiles?.name || 'Agent'}</p>
                             <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{new Date(asset.createdAt).toLocaleDateString()}</p>
                             </div>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-base font-semibold text-slate-800 dark:text-white">{asset.weightKg} KG</p>
                          <div className="flex items-center justify-end gap-1 mt-0.5">
                             <ShieldCheck className="w-3 h-3 text-emerald-500" />
                             <p className="text-xs font-semibold text-emerald-500 uppercase tracking-widest">Audited</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
