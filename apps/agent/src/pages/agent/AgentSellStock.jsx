import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Scale, 
  Image as ImageIcon, 
  FileText, 
  TrendingUp, 
  CheckCircle2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { useAuthStore, supabase, compressImage } from '@cleanflow/core';
import { toast } from 'sonner';

const CATEGORIES = [
  { id: 'plastic', label: 'Plastic', subcategories: ['PET-A', 'PET-B', 'HDPE', 'LDPE', 'PP'] },
  { id: 'metal', label: 'Metal', subcategories: ['Aluminum', 'Copper', 'Steel', 'Brass'] },
  { id: 'paper', label: 'Paper', subcategories: ['Cardboard', 'Office Paper', 'Newspaper'] },
  { id: 'e-waste', label: 'E-Waste', subcategories: ['Batteries', 'Circuit Boards', 'Screens'] },
];

export default function AgentSellStock() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    price: '',
    weight: '',
    minOrder: '',
    description: '',
    image: null,
    imageUrl: ''
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.subcategory || !formData.price || !formData.weight) {
      toast.error("Missing Technical Data", { description: "Please fill all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = '';

      // 1. Upload Image if exists (with compression)
      if (formData.image) {
        const compressed = await compressImage(formData.image, { maxWidth: 1024, quality: 0.7 });
        const fileExt = compressed.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `listings/${profile.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('marketplace')
          .upload(filePath, compressed);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('marketplace')
          .getPublicUrl(filePath);
        
        finalImageUrl = publicUrl;
      }

      // 2. Create Listing
      const { error } = await supabase.from('marketplace_listings').insert({
        seller_id: profile.id,
        material: formData.subcategory,
        category: formData.category,
        price_per_kg: parseFloat(formData.price),
        quantity: parseFloat(formData.weight),
        min_order: parseFloat(formData.minOrder || 0),
        description: formData.description,
        photo: finalImageUrl,
        status: 'active',
        source_type: 'agent'
      });

      if (error) throw error;

      toast.success("Listing Live! 🚀", {
        description: `${formData.subcategory} is now visible to Weavers.`
      });
      navigate('/warehouse');
    } catch (err) {
      console.error(err);
      toast.error("Failed to post listing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 p-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Sell Stock Terminal</h1>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">Direct-to-Weaver Trade</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        
        {/* ── IMAGE UPLOAD ── */}
        <div className="relative group">
          <label className="block w-full aspect-video rounded-[2.5rem] bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all shadow-sm">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Upload Material Photo</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">High Quality Required</p>
                </div>
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        </div>

        {/* ── MATERIAL CLASSIFICATION ── */}
        <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Material Classification</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <div className="relative">
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Subcategory (Grade)</label>
              <div className="relative">
                <select 
                  disabled={!formData.category}
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500/20 transition-all disabled:opacity-50"
                >
                  <option value="">Select Subcategory</option>
                  {CATEGORIES.find(c => c.id === formData.category)?.subcategories.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── PRICING & VOLUME ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-4 h-4 text-emerald-500" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pricing</h2>
            </div>
            <div className="space-y-1">
              <input 
                type="number"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className="w-full bg-transparent text-2xl font-black text-slate-900 dark:text-white tracking-tighter placeholder:text-slate-200 focus:outline-none"
              />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">KSh per KG</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-blue-500" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Volume</h2>
            </div>
            <div className="space-y-1">
              <input 
                type="number"
                placeholder="0"
                value={formData.weight}
                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                className="w-full bg-transparent text-2xl font-black text-slate-900 dark:text-white tracking-tighter placeholder:text-slate-200 focus:outline-none"
              />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total KG</p>
            </div>
          </div>
        </div>

        {/* ── SECONDARY SPECS ── */}
        <div className="space-y-4 bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Technical Specs</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Minimum Order (KG)</label>
              <input 
                type="number"
                placeholder="e.g. 100"
                value={formData.minOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, minOrder: e.target.value }))}
                className="w-full h-14 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description / Notes</label>
              <textarea 
                placeholder="e.g. Pre-sorted color-free PET-A. Cleaned and baled."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              POST LISTING TO MARKETPLACE
            </>
          )}
        </button>

      </form>
    </div>
  );
}
