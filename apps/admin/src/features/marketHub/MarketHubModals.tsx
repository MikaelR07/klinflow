/**
 * MarketHub Modals
 * Extracted from MarketHub.tsx
 */
import { X, Edit2, Trash2, Save, AlertCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { uploadFile } from '@klinflow/core/lib/storage';
import type { MarketHubMaterial } from './marketHub.types';

interface MarketHubModalsProps {
  editingCatId: string | null;
  setEditingCatId: (id: string | null) => void;
  editCatData: any;
  setEditCatData: (data: any) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  materialPrices: MarketHubMaterial[];
  editingMatId: string | null;
  setEditingMatId: (id: string | null) => void;
  editMatName: string;
  setEditMatName: (name: string) => void;
  editMatPrice: string;
  setEditMatPrice: (price: string) => void;
  updateMaterialPrice: (id: string, data: any) => Promise<{ success: boolean }>;
  deleteMaterialPrice: (id: string) => Promise<{ success: boolean }>;
  newEditMat: { name: string; price: string };
  setNewEditMat: (mat: any) => void;
  addMaterialPrice: (name: string, cat: string, price: number) => Promise<{ success: boolean }>;
  handleUpdateCategory: (id: string) => void;

  deletingCategory: { id: string; label: string } | null;
  setDeletingCategory: (cat: { id: string; label: string } | null) => void;
  executeDeleteCategory: () => void;
}

export default function MarketHubModals({
  editingCatId, setEditingCatId, editCatData, setEditCatData,
  uploading, setUploading,
  materialPrices, editingMatId, setEditingMatId,
  editMatName, setEditMatName, editMatPrice, setEditMatPrice,
  updateMaterialPrice, deleteMaterialPrice,
  newEditMat, setNewEditMat, addMaterialPrice,
  handleUpdateCategory,
  deletingCategory, setDeletingCategory, executeDeleteCategory
}: MarketHubModalsProps) {
  return (
    <>
      {/* ── EDIT CATEGORY MODAL ── */}
      {editingCatId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingCatId(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[1rem] p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">Edit Global Category</h3>
              <button onClick={() => setEditingCatId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Icon</label>
                <input
                  placeholder="Icon"
                  value={editCatData?.icon || ''}
                  onChange={(e) => setEditCatData({ ...editCatData, icon: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl outline-none"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Category Name</label>
                <input
                  placeholder="Category Name"
                  value={editCatData?.label || ''}
                  onChange={(e) => setEditCatData({ ...editCatData, label: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Short Description</label>
              <input
                placeholder="Short description"
                value={editCatData?.description || ''}
                onChange={(e) => setEditCatData({ ...editCatData, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>

            {/* Custom Category Image Uploader in Edit Modal */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block ml-1">Category Cover Image (Optional)</label>
              {editCatData?.image_url ? (
                <div className="relative rounded-[1rem] overflow-hidden aspect-video border border-slate-200 dark:border-slate-800 shadow-sm max-w-sm mx-auto">
                  <img src={editCatData.image_url} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditCatData((prev: any) => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1rem] p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors max-w-sm mx-auto w-full">
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
                        setEditCatData((prev: any) => ({ ...prev, image_url: url }));
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

            {/* Materials & Prices in Edit Modal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Materials & Prices</label>
              </div>
              {materialPrices.filter(m => m.category === editCatData?.label).length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {materialPrices
                    .filter(m => m.category === editCatData?.label)
                    .map((mat) => (
                      <div key={mat.id} className="flex items-center gap-2">
                        {editingMatId === mat.id ? (
                          <>
                            <input
                              value={editMatName}
                              onChange={(e) => setEditMatName(e.target.value)}
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl text-xs font-semibold outline-none"
                            />
                            <input
                              type="number"
                              value={editMatPrice}
                              onChange={(e) => setEditMatPrice(e.target.value)}
                              className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-indigo-300 dark:border-indigo-600 rounded-xl text-xs font-semibold outline-none text-right"
                            />
                            <button
                              onClick={async () => {
                                const updates: any = {};
                                if (editMatName.trim()) updates.material_name = editMatName.trim();
                                if (editMatPrice) updates.price_per_kg = parseFloat(editMatPrice);
                                const res = await updateMaterialPrice(mat.id, updates);
                                if (res.success) {
                                  toast.success('Material updated');
                                  setEditingMatId(null);
                                }
                              }}
                              className="p-2 text-emerald-500 hover:text-emerald-600 transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{mat.material_name}</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
                              KSh {mat.price_per_kg}/kg
                            </span>
                            <button
                              onClick={() => {
                                setEditingMatId(mat.id);
                                setEditMatName(mat.material_name);
                                setEditMatPrice(mat.price_per_kg.toString());
                              }}
                              className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={async () => {
                                const res = await deleteMaterialPrice(mat.id);
                                if (res.success) toast.success('Material removed');
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] text-slate-400 font-medium">No materials defined for this category yet.</p>
                </div>
              )}

              {/* Add new material row */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  placeholder="New material name"
                  value={newEditMat.name}
                  onChange={(e) => setNewEditMat((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                />
                <input
                  placeholder="KSh/kg"
                  type="number"
                  value={newEditMat.price}
                  onChange={(e) => setNewEditMat((prev: any) => ({ ...prev, price: e.target.value }))}
                  className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-right"
                />
                <button
                  onClick={async () => {
                    if (!newEditMat.name.trim() || !newEditMat.price) return toast.error('Name and price required');
                    const res = await addMaterialPrice(newEditMat.name.trim(), editCatData?.label, parseFloat(newEditMat.price));
                    if (res.success) {
                      toast.success('Material added');
                      setNewEditMat({ name: '', price: '' });
                    }
                  }}
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setEditingCatId(null); setEditingMatId(null); setNewEditMat({ name: '', price: '' }); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1rem] font-semibold text-[11px] uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleUpdateCategory(editingCatId)} className="flex-1 py-4 bg-indigo-600 text-white rounded-[1rem] font-semibold text-[11px] uppercase tracking-widest">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CATEGORY MODAL ── */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingCategory(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[1rem] p-8 shadow-2xl space-y-6 text-center">
            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Delete Category?</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                Are you sure you want to completely remove <span className="font-semibold text-slate-900 dark:text-white">"{deletingCategory.label}"</span>?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeletingCategory(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1rem] font-semibold text-[11px] uppercase tracking-widest">Cancel</button>
              <button onClick={executeDeleteCategory} className="flex-1 py-4 bg-rose-500 text-white rounded-[1rem] font-semibold text-[11px] uppercase tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
