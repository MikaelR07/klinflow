/**
 * Market Hub
 * Refactored: UI components extracted into `components/MarketHub`
 */
import { useState, useEffect } from 'react';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useSystemStore } from '@klinflow/core/stores/systemStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAdminStore } from '@klinflow/core/stores/adminStore';
import { toast } from 'sonner';

import { MarketHubHeader, MarketHubNetworkCapabilities } from '../../features/marketHub/MarketHubHeader';
import MarketHubSystemFees from '../../features/marketHub/MarketHubSystemFees';
import MarketHubGlobalCategories from '../../features/marketHub/MarketHubGlobalCategories';
import MarketHubReferenceRates from '../../features/marketHub/MarketHubReferenceRates';
import MarketHubModals from '../../features/marketHub/MarketHubModals';

export default function MarketHub() {
  const { prices, fetchPrices, updatePrice, addPrice } = usePriceStore();
  const { config, fetchConfig, updateConfig } = useSystemStore();
  const {
    allCategories, fetchAllCategories, addCategory,
    updateCategory, toggleCategory, deleteCategory,
    materialPrices, fetchMaterialPrices,
    addMaterialPrice, updateMaterialPrice, deleteMaterialPrice
  } = useServiceStore();
  const { stats, refreshDashboardStats } = useAdminStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [editingFeeKey, setEditingFeeKey] = useState<string | null>(null);
  const [editFeeValue, setEditFeeValue] = useState('');

  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', icon: '📦', description: '', image_url: '' });
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatData, setEditCatData] = useState<any>({});
  const [uploading, setUploading] = useState(false);

  // Material management state
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', category: 'Recyclables', price: '' });

  // Deletion modals state
  const [deletingCategory, setDeletingCategory] = useState<{ id: string; label: string } | null>(null);

  // Inline subcategory rows for new category creation
  const [newCatMaterials, setNewCatMaterials] = useState<{ name: string; price: string }[]>([]);

  // Inline editing for materials in edit modal
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editMatName, setEditMatName] = useState('');
  const [editMatPrice, setEditMatPrice] = useState('');
  const [newEditMat, setNewEditMat] = useState({ name: '', price: '' });

  useEffect(() => {
    fetchPrices();
    fetchConfig();
    fetchAllCategories();
    fetchMaterialPrices();
    refreshDashboardStats();
  }, []);

  const handleAddCategory = async () => {
    if (!newCat.label.trim()) return toast.error('Category name required');
    const result = await addCategory(newCat);
    if (result.success) {
      // Save any subcategories that were added inline
      for (const mat of newCatMaterials) {
        if (mat.name.trim() && mat.price) {
          await addMaterialPrice(mat.name.trim(), newCat.label, parseFloat(mat.price));
        }
      }
      toast.success('Category Added');
      setShowAddCategory(false);
      setNewCat({ label: '', icon: '📦', description: '', image_url: '' });
      setNewCatMaterials([]);
      await fetchAllCategories();
      await fetchMaterialPrices();
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const result = await updateCategory(id, editCatData);
    if (result.success) {
      toast.success('Category Updated');
      setEditingCatId(null);
      await fetchAllCategories();
    }
  };

  const handleToggleCategory = async (id: string, currentState: boolean) => {
    const result = await toggleCategory(id, !currentState);
    if (result.success) {
      toast.success(currentState ? 'Category Disabled' : 'Category Enabled');
      await fetchAllCategories();
    }
  };

  const handleDeleteCategory = (id: string, label: string) => {
    setDeletingCategory({ id, label });
  };

  const executeDeleteCategory = async () => {
    if (!deletingCategory) return;
    const result = await deleteCategory(deletingCategory.id);
    if (result.success) {
      toast.success('Category Deleted');
      await fetchAllCategories();
    }
    setDeletingCategory(null);
  };

  const handleSavePrice = async (id: string) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0) return toast.error('Invalid Price');

    const result = await updatePrice(id, numValue);
    if (result.success) {
      toast.success('Market Rate Updated');
      setEditingId(null);
      await fetchPrices();
      await fetchAllCategories();
    }
  };

  const handleSaveFee = async (key: string) => {
    const numValue = parseFloat(editFeeValue);
    if (isNaN(numValue) || numValue < 0) return toast.error('Invalid Fee');

    const result = await updateConfig(key, numValue);
    if (result.success) {
      toast.success('System Fee Updated');
      setEditingFeeKey(null);
    }
  };

  const systemFees = Object.values(config);

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <MarketHubHeader activeMaterialsCount={prices.length} />

      <MarketHubSystemFees
        systemFees={systemFees as any}
        editingFeeKey={editingFeeKey}
        editFeeValue={editFeeValue}
        setEditingFeeKey={setEditingFeeKey}
        setEditFeeValue={setEditFeeValue}
        handleSaveFee={handleSaveFee}
      />

      <MarketHubNetworkCapabilities stats={stats as any} />

      <MarketHubGlobalCategories
        allCategories={allCategories as any}
        materialPrices={materialPrices as any}
        showAddCategory={showAddCategory}
        setShowAddCategory={setShowAddCategory}
        newCat={newCat}
        setNewCat={setNewCat}
        newCatMaterials={newCatMaterials}
        setNewCatMaterials={setNewCatMaterials}
        uploading={uploading}
        setUploading={setUploading}
        handleAddCategory={handleAddCategory}
        handleToggleCategory={handleToggleCategory}
        setEditingCatId={setEditingCatId}
        setEditCatData={setEditCatData}
        handleDeleteCategory={handleDeleteCategory}
        editingId={editingId}
        editValue={editValue}
        setEditingId={setEditingId}
        setEditValue={setEditValue}
        handleSavePrice={handleSavePrice}
        updateMaterialPrice={updateMaterialPrice as any}
      />

      <MarketHubModals
        editingCatId={editingCatId}
        setEditingCatId={setEditingCatId}
        editCatData={editCatData}
        setEditCatData={setEditCatData}
        uploading={uploading}
        setUploading={setUploading}
        materialPrices={materialPrices as any}
        editingMatId={editingMatId}
        setEditingMatId={setEditingMatId}
        editMatName={editMatName}
        setEditMatName={setEditMatName}
        editMatPrice={editMatPrice}
        setEditMatPrice={setEditMatPrice}
        updateMaterialPrice={updateMaterialPrice as any}
        deleteMaterialPrice={deleteMaterialPrice as any}
        newEditMat={newEditMat}
        setNewEditMat={setNewEditMat}
        addMaterialPrice={addMaterialPrice as any}
        handleUpdateCategory={handleUpdateCategory}
        deletingCategory={deletingCategory}
        setDeletingCategory={setDeletingCategory}
        executeDeleteCategory={executeDeleteCategory}
      />
    </div>
  );
}
