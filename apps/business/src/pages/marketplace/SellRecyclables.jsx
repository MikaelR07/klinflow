import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Upload, Loader2, Tag, Scale, Coins, Info, MapPin, Package } from 'lucide-react';
import { useMarketplaceStore, useAuthStore, uploadFile, compressImage } from '@cleanflow/core';
import { toast } from 'sonner';

export default function SellRecyclables() {
  const postListing = useMarketplaceStore(s => s.postListing);
  const isLoading = useMarketplaceStore(s => s.isLoading);
  const profile = useAuthStore(s => s.profile);
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    material: location.state?.material || '',
    quantity: location.state?.quantity || '',
    pricePerKg: '',
    description: location.state?.description || '',
    grade: 'Industrial Mix',
    unit: 'KG',
    moq: '1',
    photo: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2670&auto=format&fit=crop', 
  });
  const [photoFile, setPhotoFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.material || !formData.quantity || !formData.pricePerKg) {
      toast.error('Missing Fields', { description: 'Please fill in all required fields.' });
      return;
    }

    let finalPhoto = formData.photo;
    
    if (photoFile) {
      toast.info("Compressing and uploading listing photo...");
      try {
        const compressed = await compressImage(photoFile, { maxWidth: 1024, quality: 0.7 });
        finalPhoto = await uploadFile('marketplace', compressed, profile.id);
      } catch (err) {
        toast.error("Upload failed");
        return;
      }
    }

    await postListing({
      ...formData,
      photo: finalPhoto,
      quantity: Number(formData.quantity),
      pricePerKg: Number(formData.pricePerKg),
      moq: Number(formData.moq),
      seller: profile.name,
      location: profile.location?.estate || 'Nairobi',
    });
    
    navigate('/listings');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Post New Listing</h1>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="glass p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            
            {/* Material */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Material Type</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <select 
                  name="material" 
                  value={formData.material} 
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm appearance-none"
                  required
                >
                  <option value="" disabled>Select Material</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Paper">Paper</option>
                  <option value="Metal">Metal</option>
                  <option value="Glass">Glass</option>
                  <option value="Organic">Organic</option>
                  <option value="E-Waste">E-Waste</option>
                </select>
              </div>
            </div>

            {/* B2B Grade & Units */}
            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Material Grade</label>
                <select 
                  name="grade" 
                  value={formData.grade} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                >
                  <option value="Grade A">Grade A</option>
                  <option value="Grade B">Grade B</option>
                  <option value="Mixed Paper">Mixed Paper</option>
                  <option value="Recycled Pellets">Recycled Pellets</option>
                  <option value="Plastic Mix">Plastic Mix</option>
                  <option value="Industrial Mix">Industrial Mix</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Listing Unit</label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  {['KG', 'Tons'].map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, unit: u }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${formData.unit === u ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-500'}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Total Quantity ({formData.unit})</label>
                <div className="relative">
                  <Scale className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="number" 
                    name="quantity" 
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>
              {/* MOQ */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Min. Order (MOQ)</label>
                <div className="relative">
                  <Package className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="number" 
                    name="moq" 
                    placeholder="e.g. 1"
                    value={formData.moq}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Price / {formData.unit} (KES)</label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="number" 
                  name="pricePerKg" 
                  placeholder={`KES per ${formData.unit}...`}
                  value={formData.pricePerKg}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
              <div className="relative">
                <Info className="absolute left-4 top-3 h-5 w-5 text-slate-400" />
                <textarea 
                  name="description" 
                  placeholder="Describe the batch quality, cleanliness..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Listing Photo</label>
              <label className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-all group">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium text-slate-500">{photoFile ? photoFile.name : 'Tap to upload material photo'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPhotoFile(file);
                      setFormData(prev => ({ ...prev, photo: URL.createObjectURL(file) }));
                    }
                  }} 
                />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-primary hover:bg-emerald-600 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-primary/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'POST LISTING'}
          </button>
        </form>

        {/* Live Preview */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest pl-2">Live Preview</h2>
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-primary/30 overflow-hidden shadow-lg transform scale-[0.98] opacity-90 transition-all">
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative">
              <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute top-3 right-3">
                <span className="bg-white/90 dark:bg-slate-950/90 text-xs font-semibold text-primary px-2 py-1 rounded-full border border-primary/20">
                   AI MATCH SCORE: 95%
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">{formData.material || 'Material Name'} Batch</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3 text-primary" /> {profile.location?.estate || 'Your Location'}
              </p>
                <div className="flex justify-between items-end">
                  <div className="text-right">
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-tighter">Grade</div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-white uppercase">{formData.grade || 'Mix'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-primary leading-none">KES {formData.pricePerKg || '0'}</div>
                    <div className="text-xs text-slate-400 font-semibold uppercase tracking-tighter">per {formData.unit}</div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold uppercase text-slate-500">
                  <span>{formData.quantity || '0'} {formData.unit} Available</span>
                  <span>MOQ: {formData.moq || '1'} {formData.unit}</span>
                </div>
              </div>
          </div>
        </div>

      </div>

    </div>
  );
}
