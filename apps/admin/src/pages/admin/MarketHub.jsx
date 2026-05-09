import { useState, useEffect } from 'react';
import { 
  Coins, TrendingUp, RefreshCcw, 
  Save, AlertCircle, Sparkles, Plus, X, Trash2, ToggleLeft, ToggleRight, Edit2,
  ShieldCheck, Activity, Truck, Package, Scale, Layers, Zap, Wallet
} from 'lucide-react';
import { usePriceStore, useAuthStore, useSystemStore, useServiceStore, useAdminStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function MarketHub() {
  const { prices, fetchPrices, updatePrice, addPrice, deletePrice } = usePriceStore();
  const { config, fetchConfig, updateConfig } = useSystemStore();
  const { 
    allCategories, fetchAllCategories, addCategory, 
    updateCategory, toggleCategory, deleteCategory 
  } = useServiceStore();
  const { stats, refreshDashboardStats } = useAdminStore();
  
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const [editingFeeKey, setEditingFeeKey] = useState(null);
  const [editFeeValue, setEditFeeValue] = useState('');
  
  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ label: '', icon: '📦', description: '' });
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({});

  // Material management state
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', category: 'Recyclables', price: '' });

  // Deletion modals state
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingMaterial, setDeletingMaterial] = useState(null);

  useEffect(() => {
    fetchPrices();
    fetchConfig();
    fetchAllCategories();
    refreshDashboardStats();
  }, []);

  const handleAddCategory = async () => {
    if (!newCat.label.trim()) return toast.error('Category name required');
    const result = await addCategory(newCat);
    if (result.success) {
      toast.success('Category Added');
      setShowAddCategory(false);
      setNewCat({ label: '', icon: '📦', description: '' });
      await fetchAllCategories();
    }
  };

  const handleUpdateCategory = async (id) => {
    const result = await updateCategory(id, editCatData);
    if (result.success) {
      toast.success('Category Updated');
      setEditingCatId(null);
      await fetchAllCategories();
    }
  };

  const handleToggleCategory = async (id, currentState) => {
    const result = await toggleCategory(id, !currentState);
    if (result.success) {
      toast.success(currentState ? 'Category Disabled' : 'Category Enabled');
      await fetchAllCategories();
    }
  };

  const handleDeleteCategory = (id, label) => {
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

  const handleSavePrice = async (id) => {
    const numValue = parseFloat(editValue);
    if (isNaN(numValue) || numValue < 0) return toast.error('Invalid Price');

    const result = await updatePrice(id, numValue);
    if (result.success) {
      toast.success('Market Rate Updated');
      setEditingId(null);
      await fetchPrices();
    }
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.name.trim() || newMaterial.price === '') return toast.error('Name and price required');
    const result = await addPrice(newMaterial.name, newMaterial.category, parseFloat(newMaterial.price));
    if (result.success) {
      toast.success('Material Added');
      setShowAddMaterial(false);
      setNewMaterial({ name: '', category: 'Recyclables', price: '' });
      await fetchPrices();
    }
  };

  const handleSaveFee = async (key) => {
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
      
      {/* 🔮 HUB HEADER */}
      <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 text-white p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
               <Coins className="w-6 h-6 text-primary" />
               <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Service Marketplace</span>
            </div>
            <h1 className="text-5xl font-semibold tracking-tight">Market Hub</h1>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Define global material categories and monitor the operational capabilities of your PaaS tenants.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Active Materials</p>
                <p className="text-3xl font-semibold text-white">{prices.length}</p>
             </div>
             <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center backdrop-blur-md">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Network Capacity</p>
                <p className="text-3xl font-semibold text-primary">Dynamic</p>
             </div>
          </div>
        </div>
      </div>

      {/* ⚙️ SYSTEM FEES SECTION */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-4">
           <Zap className="w-5 h-5 text-amber-500" />
           <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Global System Fees</h2>
           <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <p className="text-xs text-slate-400 font-medium px-4 -mt-4">
          Configure core platform economics, including withdrawal thresholds and platform-wide guardrails.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {systemFees.map((fee, index) => {
             const icons = {
               'fee_pickup': Truck,
               'fee_logistics': Activity,
               'fee_min_payout': Wallet,
               'fee_min_pickup': ShieldCheck
             };
             const Icon = icons[fee.key] || Activity;

             return (
               <div key={fee.key || index} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-amber-500/30 transition-all">
                  <div className="flex items-center justify-between mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                     </div>
                     <button 
                       onClick={() => {
                         if (editingFeeKey === fee.key) {
                           handleSaveFee(fee.key);
                         } else {
                           setEditingFeeKey(fee.key);
                           setEditFeeValue((fee.value ?? 0).toString());
                         }
                       }}
                       className="text-xs font-semibold text-amber-600 uppercase tracking-widest hover:underline"
                     >
                       {editingFeeKey === fee.key ? 'Save Change' : 'Edit Fee'}
                     </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{fee.label}</p>
                  <div className="flex items-baseline gap-2">
                     {editingFeeKey === fee.key ? (
                       <input 
                         autoFocus
                         type="number"
                         value={editFeeValue}
                         onChange={(e) => setEditFeeValue(e.target.value)}
                         className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-2xl font-semibold text-amber-600 outline-none border border-amber-200"
                       />
                     ) : (
                       <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{fee.value}</h3>
                     )}
                     <span className="text-xs font-semibold text-slate-500 uppercase">{fee.unit}</span>
                  </div>
               </div>
             );
           })}
        </div>
      </section>

      {/* 📊 NETWORK CAPABILITIES MONITOR */}
      <section className="space-y-6">
        <div className="flex items-center gap-4 px-4">
           <Scale className="w-5 h-5 text-indigo-500" />
           <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Service Envelopes</h2>
           <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>
        <p className="text-xs text-slate-400 font-medium px-4 -mt-4">
          Overview of the operational limits (Min/Max weights) currently set by individual agents and companies.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
           <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Avg. Min Weight</p>
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{(stats?.avgMinWeight || 0).toFixed(1)}<span className="text-sm font-semibold text-slate-400 ml-1">KG</span></h3>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Avg. Max Capacity</p>
              <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{Math.round(stats?.avgMaxCapacity || 0)}<span className="text-sm font-semibold text-slate-400 ml-1">KG</span></h3>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Most Popular Cat.</p>
              <h3 className="text-xl font-semibold text-indigo-500">Plastics</h3>
           </div>
           <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm border-indigo-500/20">
              <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Matching Success</p>
              <h3 className="text-3xl font-semibold text-indigo-600">94%</h3>
           </div>
        </div>
      </section>

      {/* 📦 GLOBAL CATEGORIES SECTION */}
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
        <p className="text-xs text-slate-400 font-medium px-4">These are the standard categories agents and companies can choose to support in their individual service profiles.</p>

        {showAddCategory && (
          <div className="mx-4 p-6 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">New Global Category</h3>
              <button onClick={() => setShowAddCategory(false)} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input 
                placeholder="Icon (emoji)" 
                value={newCat.icon} 
                onChange={(e) => setNewCat({...newCat, icon: e.target.value})} 
                className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl outline-none"
              />
              <input 
                placeholder="Category Name" 
                value={newCat.label} 
                onChange={(e) => setNewCat({...newCat, label: e.target.value})} 
                className="col-span-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
              />
            </div>
            <input 
              placeholder="Short description" 
              value={newCat.description} 
              onChange={(e) => setNewCat({...newCat, description: e.target.value})} 
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
            <button 
              onClick={handleAddCategory}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors"
            >
              Save Global Category
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-4">
          {allCategories.map((cat, index) => (
            <div key={cat.id || index} className={`p-5 rounded-[2rem] border shadow-sm transition-all ${
              cat.is_active 
                ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' 
                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 opacity-50'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl shrink-0">
                  {cat.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{cat.label}</h4>
                  <p className="text-xs text-slate-400 font-medium truncate">{cat.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                    className={`p-2 transition-colors ${cat.is_active ? 'text-emerald-500' : 'text-slate-300'}`}
                  >
                    {cat.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(cat.id, cat.label)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 💹 REFERENCE MARKET RATES */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
             <Activity className="w-5 h-5 text-emerald-500" />
             <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Reference Market Rates</h2>
             <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>
          <button 
            onClick={() => setShowAddMaterial(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" /> Add Material
          </button>
        </div>
        <p className="text-xs text-slate-400 font-medium px-4 -mt-6">
          The platform's suggested prices. Individual companies can override these in their own service profiles.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
          {prices.map((item, index) => (
            <div key={item.id || index} className="glass p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Coins className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs font-semibold tracking-tighter uppercase">STABLE</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">{item.label}</h3>
              
              <div className="flex items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                {editingId === item.id ? (
                  <div className="flex-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-400">KES</span>
                      <input 
                        autoFocus
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-xl font-semibold text-primary"
                      />
                  </div>
                ) : (
                  <div className="flex-1">
                      <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                        KSh {item.price_per_kg.toLocaleString()}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter">SUGGESTED / KG</p>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (editingId === item.id) {
                      handleSavePrice(item.id);
                    } else {
                      setEditingId(item.id);
                      setEditValue(item.price_per_kg.toString());
                    }
                  }}
                  className={`p-3 rounded-xl transition-all ${
                    editingId === item.id 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-primary'
                  }`}
                >
                  {editingId === item.id ? <Save className="w-5 h-5" /> : <RefreshCcw className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── DELETE CATEGORY MODAL ── */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingCategory(null)} />
           <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[3rem] p-8 shadow-2xl space-y-6 text-center">
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
                <button onClick={() => setDeletingCategory(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-semibold text-[11px] uppercase tracking-widest">Cancel</button>
                <button onClick={executeDeleteCategory} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-semibold text-[11px] uppercase tracking-widest">Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
