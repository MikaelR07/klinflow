/**
 * MarketHub Global Categories
 * Extracted from MarketHub.tsx
 */
import { Layers, Plus, X, Trash2, ToggleLeft, ToggleRight, Edit2, Coins, TrendingUp, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@klinflow/core/lib/storage';
import { useState } from 'react';
import type { MarketHubCategory, MarketHubMaterial } from './marketHub.types';

interface MarketHubGlobalCategoriesProps {
  allCategories: MarketHubCategory[];
  materialPrices: MarketHubMaterial[];
  showAddCategory: boolean;
  setShowAddCategory: (show: boolean) => void;
  newCat: any;
  setNewCat: (cat: any) => void;
  newCatMaterials: { name: string; price: string }[];
  setNewCatMaterials: (mats: { name: string; price: string }[] | ((prev: any) => any)) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  handleAddCategory: () => void;
  handleToggleCategory: (id: string, currentState: boolean) => void;
  setEditingCatId: (id: string) => void;
  setEditCatData: (data: any) => void;
  handleDeleteCategory: (id: string, label: string) => void;
  editingId?: string | null;
  editValue?: string;
  setEditingId?: (id: string | null) => void;
  setEditValue?: (val: string) => void;
  handleSavePrice?: (id: string) => void;
  updateMaterialPrice?: (id: string, updates: { price_per_kg: number }) => Promise<{ success: boolean }>;
}

export default function MarketHubGlobalCategories({
  allCategories, materialPrices,
  showAddCategory, setShowAddCategory,
  newCat, setNewCat,
  newCatMaterials, setNewCatMaterials,
  uploading, setUploading,
  handleAddCategory, handleToggleCategory,
  setEditingCatId, setEditCatData, handleDeleteCategory,
  editingId, editValue, setEditingId, setEditValue, handleSavePrice, updateMaterialPrice
}: MarketHubGlobalCategoriesProps) {

  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editMatValue, setEditMatValue] = useState('');

  const saveMatPrice = async (id: string) => {
    if (!updateMaterialPrice) return;
    const numValue = parseFloat(editMatValue);
    if (isNaN(numValue) || numValue < 0) return toast.error('Invalid Price');

    const result = await updateMaterialPrice(id, { price_per_kg: numValue });
    if (result.success) {
      toast.success('Material price updated');
      setEditingMatId(null);
    } else {
      toast.error('Failed to update price');
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Layers className="w-5 h-5 text-indigo-500" />
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Global Pickup Categories</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <button
          onClick={() => setShowAddCategory(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" /> Define Category
        </button>
      </div>
      <p className="text-xs text-slate-400 font-medium px-4">Define platform-wide categories, manage reference market rates, and set specific pricing for material sub-grades.</p>

      {/* ADD CATEGORY FORM */}
      {showAddCategory && (
        <div className="mx-4 p-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">New Global Category</h3>
            <button onClick={() => setShowAddCategory(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Icon (emoji)"
              value={newCat.icon}
              onChange={(e) => setNewCat({ ...newCat, icon: e.target.value })}
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl outline-none"
            />
            <input
              placeholder="Category Name"
              value={newCat.label}
              onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
              className="col-span-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
            />
          </div>
          <input
            placeholder="Short description"
            value={newCat.description}
            onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
          />

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Category Cover Image (Optional)</label>
            {newCat.image_url ? (
              <div className="relative rounded-[1rem] overflow-hidden aspect-video border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm mx-auto">
                <img src={newCat.image_url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setNewCat((prev: any) => ({ ...prev, image_url: '' }))}
                  className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1rem] p-4 cursor-pointer bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors max-w-sm mx-auto w-full">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {uploading ? 'Uploading Cover...' : 'Click to Upload Image'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(true);
                    try {
                      const url = await uploadFile('material-categories', file);
                      setNewCat((prev: any) => ({ ...prev, image_url: url }));
                      toast.success('Cover image uploaded!');
                    } catch (err) {
                      console.error(err);
                      toast.error('Upload failed');
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Subcategories / Materials</label>
              <button
                type="button"
                onClick={() => setNewCatMaterials((prev: any) => [...prev, { name: '', price: '' }])}
                className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:text-indigo-700"
              >
                <Plus className="w-3 h-3" /> Add Material
              </button>
            </div>
            {newCatMaterials.length === 0 && (
              <div className="text-center py-3 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-medium">No materials added yet. Click "Add Material" above.</p>
              </div>
            )}
            {newCatMaterials.map((mat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  placeholder="Material name (e.g. PET Plastic)"
                  value={mat.name}
                  onChange={(e) => {
                    const updated = [...newCatMaterials];
                    updated[idx].name = e.target.value;
                    setNewCatMaterials(updated);
                  }}
                  className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                />
                <input
                  placeholder="KSh/kg"
                  type="number"
                  value={mat.price}
                  onChange={(e) => {
                    const updated = [...newCatMaterials];
                    updated[idx].price = e.target.value;
                    setNewCatMaterials(updated);
                  }}
                  className="w-24 px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-right"
                />
                <button
                  type="button"
                  onClick={() => setNewCatMaterials((prev: any) => prev.filter((_: any, i: number) => i !== idx))}
                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddCategory}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors"
          >
            Save Global Category
          </button>
        </div>
      )}

      {/* CATEGORY CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 px-4">
        {allCategories.map((cat, index) => {
          const catMaterials = materialPrices.filter(m => m.category === cat.label || m.category === cat.id || m.category === cat.slug);

          return (
            <div key={cat.id || index} className={`relative flex flex-col overflow-hidden rounded-[1rem] border shadow-xl shadow-slate-200/20 dark:shadow-none transition-all duration-300 ${cat.is_active
              ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/60 dark:border-slate-800 hover:border-indigo-500/30'
              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 grayscale hover:grayscale-0'
              }`}>

              {/* CARD HEADER */}
              <div className="p-6 pb-0 flex gap-4 relative z-10">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0 overflow-hidden relative shadow-inner bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-800 border border-slate-100 dark:border-slate-700/50">
                  {cat.image_url ? (
                    <img src={cat.image_url} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                  ) : (
                    cat.icon || '📦'
                  )}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate tracking-tight">{cat.label}</h4>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{cat.description || 'Global Category'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 shrink-0 -mt-2 -mr-2">
                  <button
                    onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                    className={`p-2 transition-colors ${cat.is_active ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}
                    title={cat.is_active ? "Disable Category" : "Enable Category"}
                  >
                    {cat.is_active ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCatId(cat.id);
                      setEditCatData(cat);
                    }}
                    className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.label)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BASE RATE SECTION */}
              <div className="px-6 py-1 mt-4 bg-slate-50/50 dark:bg-slate-800/30 border-y border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Coins className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Base Market Rate</span>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[9px] font-bold uppercase tracking-widest">Suggested</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {editingId === cat.id ? (
                    <div className="flex-1 flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm">
                      <span className="text-xs font-semibold text-slate-400">KSh</span>
                      <input
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue?.(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-base font-bold text-indigo-600 dark:text-indigo-400 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                        <span className="text-sm font-semibold text-slate-400 mr-1">KSh</span>
                        {Number(cat.price_per_kg || 0).toLocaleString()}
                        <span className="text-sm font-semibold text-slate-400 ml-1">/kg</span>
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (editingId === cat.id) {
                        handleSavePrice?.(cat.id);
                      } else {
                        setEditingId?.(cat.id);
                        setEditValue?.(cat.price_per_kg?.toString() || '0');
                      }
                    }}
                    className={`p-3 rounded-xl transition-all ${editingId === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700'
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700'
                      }`}
                  >
                    {editingId === cat.id ? <Save className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* SUBCATEGORIES SECTION */}
              <div className="p-6 pt-4 flex-1 flex flex-col bg-white dark:bg-slate-900">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tracked Materials & Sub-grades</p>
                <div className="space-y-2 flex-1">
                  {catMaterials.length > 0 ? (
                    catMaterials.map((mat, i) => (
                      <div key={mat.id || i} className="group/mat flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 px-3 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate pr-2">{mat.material_name}</span>

                        {editingMatId === mat.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="number"
                              value={editMatValue}
                              onChange={e => setEditMatValue(e.target.value)}
                              className="w-16 px-2 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg outline-none text-right"
                            />
                            <button onClick={() => saveMatPrice(mat.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                              <span className="opacity-70 font-semibold mr-0.5">KSh</span> {mat.price_per_kg} <span className="opacity-50">/kg</span>
                            </span>
                            <button
                              onClick={() => { setEditingMatId(mat.id); setEditMatValue(mat.price_per_kg?.toString() || '0'); }}
                              className="p-1.5 text-slate-300 hover:text-emerald-500 opacity-0 group-hover/mat:opacity-100 transition-all bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800"
                              title="Edit Material Price"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full min-h-[60px] flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-100 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">No materials defined</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
