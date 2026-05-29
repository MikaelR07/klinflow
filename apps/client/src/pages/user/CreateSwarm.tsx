/**
 * CreateSwarm.tsx — Full-page form for starting a new logistics swarm.
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Scale, MapPin, ChevronRight, Zap, Camera, X, FileText, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCollectiveStore, useServiceStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

export default function CreateSwarm() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const createSwarm = useCollectiveStore(s => s.createSwarm);
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const [material, setMaterial] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error('You can only upload up to 3 photos');
      return;
    }
    const newPhotos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPhotos([...photos, ...newPhotos].slice(0, 3));
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleSubmit = async () => {
    if (!material) return toast.error('Select a material type');
    if (!targetWeight || Number(targetWeight) < 10) return toast.error('Target must be at least 10 KG');
    if (Number(initialWeight) < 0 || Number(initialWeight) > Number(targetWeight)) return toast.error('Initial weight cannot exceed target weight');
    if (photos.length < 1) return toast.error('Please upload at least 1 photo');

    setLoading(true);

    try {
      let uploadToastId = toast.loading(`Uploading ${photos.length} image${photos.length > 1 ? 's' : ''}...`);

      const uploadPromises = photos.map(async (p, i) => {
        const compressed = await compressImage(p.file, { maxWidth: 1024, quality: 0.8 });
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const fileName = `swarm_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${profile?.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('swarms')
          .upload(filePath, compressed);

        if (error) throw error;

        return supabase.storage.from('swarms').getPublicUrl(data.path).data.publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      toast.dismiss(uploadToastId);

      const { success, data: newSwarm } = await createSwarm({
        creator_id: profile?.id,
        estate: estateName,
        material,
        target_weight: Number(targetWeight),
        current_weight: Number(initialWeight) || 0,
        description: description.trim(),
        images: imageUrls,
        status: 'active',
      });

      if (success && newSwarm) {
        if (Number(initialWeight) > 0) {
          const { error: joinError } = await supabase
            .from('swarm_participants')
            .insert({
              swarm_id: newSwarm.id,
              user_id: profile?.id,
              pledged_weight: Number(initialWeight),
              status: 'pledged'
            });
          if (joinError) console.error("Error adding initial participant:", joinError);
        }
        
        toast.success('Swarm created successfully!');
        navigate('/community-collective');
      } else {
        toast.error('Failed to create swarm. Try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload images or create swarm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Start a Swarm</h1>
              <p className="text-[10px] font-bold text-indigo-600 capitalize tracking-widest flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Neighbourhood Collection
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] pb-10 max-w-lg mx-auto w-full px-2 space-y-6">

        {/* Info Banner */}
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex gap-3">
          <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">How Swarms Work</p>
            <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70 leading-relaxed">
              Set a target weight for your neighbourhood. Other sellers in <span className="font-bold">{estateName}</span> can join and pledge their recyclables. Once the target is reached, you can request a bulk pickup.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Collection Location</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{estateName}</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">Only sellers in your estate will see and be able to join this swarm.</p>
        </div>

        {/* Material Selection */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Select Material</p>
          <div className="grid grid-cols-2 gap-4">
            {categories.map((cat) => {
              const isSelected = material === cat.label;
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
                  onClick={() => setMaterial(cat.label)}
                  className={`relative h-32 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group overflow-hidden border-2 ${isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-100 dark:border-slate-800 hover:border-indigo-500/40'
                    }`}
                  style={bgImage ? {
                    backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.6)), url(${bgImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                >
                  {!bgImage && <div className={`absolute inset-0 ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                  {!bgImage && <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-indigo-500/10 transition-colors z-0" />}

                  <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${bgImage ? 'bg-white/10 backdrop-blur-md' : (isSelected ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800/50')
                    }`}>
                    {cat.icon || '📦'}
                  </div>
                  <span className={`relative z-10 text-xs font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : (isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white')
                    }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Weight */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Weight (KG)</p>
          </div>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="e.g. 500"
            min={10}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400">Minimum 10 KG. Set a realistic target for your neighbourhood.</p>
        </div>

        {/* Initial Weight */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Contribution (KG)</p>
          </div>
          <input
            type="number"
            value={initialWeight}
            onChange={(e) => setInitialWeight(e.target.value)}
            placeholder="e.g. 50"
            min={0}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400">How much are you contributing right now? This helps build momentum.</p>
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description (Optional)</p>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the materials, condition, or any other details..."
            rows={3}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Visual Proof */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Visual Proof</p>
            </div>
            <p className="text-[10px] font-bold text-indigo-600">{photos.length} / 3</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                <img src={p.preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}

            {photos.length < 3 && (
              <label className="relative aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 flex items-center justify-center transition-colors">
                  <Camera className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Add Photo</span>
              </label>
            )}
          </div>
          <p className="text-[10px] text-slate-400">Add 1 to 3 photos of the materials you are starting the swarm with.</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !material || !targetWeight || photos.length === 0} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>Launch Swarm <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </main>
    </div>
  );
}
