/**
 * JoinSwarm.tsx — Form for a seller to join a swarm with detailed pledge information.
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, Truck, Scale, ChevronRight, Camera, X, FileText, Image as ImageIcon, Zap } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';
import { toast } from 'sonner';

export default function JoinSwarm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const fetchSwarmById = useCollectiveStore(s => s.fetchSwarmById);
  const joinSwarm = useCollectiveStore(s => s.joinSwarm);

  const [swarm, setSwarm] = useState<any>(null);
  const [targetWeight, setTargetWeight] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSwarmById(id).then(res => {
        setSwarm(res.swarm);
        setFetching(false);
      });
    }
  }, [id]);

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
    if (!targetWeight || Number(targetWeight) <= 0) return toast.error('Please enter a valid weight');
    if (photos.length < 1) return toast.error('Please upload at least 1 photo for visual proof');
    if (!id || !profile?.id) return;

    setLoading(true);

    try {
      let uploadToastId = toast.loading(`Uploading ${photos.length} image${photos.length > 1 ? 's' : ''}...`);

      const uploadPromises = photos.map(async (p, i) => {
        const compressed = await compressImage(p.file, { maxWidth: 1024, quality: 0.8 });
        const fileExt = compressed.name.split('.').pop() || 'jpg';
        const fileName = `pledge_${Date.now()}_${i}.${fileExt}`;
        const filePath = `${profile.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('swarms')
          .upload(filePath, compressed);

        if (error) throw error;

        return supabase.storage.from('swarms').getPublicUrl(data.path).data.publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      toast.dismiss(uploadToastId);

      const { success } = await joinSwarm({
        swarm_id: id,
        user_id: profile.id,
        pledged_weight: Number(targetWeight),
        material: swarm?.material,
        description: description.trim(),
        images: imageUrls,
        status: 'pledged'
      });

      if (success) {
        toast.success('You have successfully joined the swarm!');
        navigate(`/community-collective/swarm/${id}`, { replace: true });
      } else {
        toast.error('Failed to join the swarm. Try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload images or join swarm');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Join Swarm</h1>
              <p className="text-[10px] font-bold text-indigo-600 capitalize tracking-widest flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> {swarm?.material}
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] pb-10 max-w-lg mx-auto w-full px-1.5 space-y-6">

        {/* Info Banner */}
        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex gap-3">
          <Zap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-indigo-800 dark:text-indigo-300 mb-1">Target Material: {swarm?.material}</p>
            <p className="text-[11px] text-indigo-700/70 dark:text-indigo-300/70 leading-relaxed">
              You are providing {swarm?.material} for this swarm. Please provide clear photos and a description of the condition.
            </p>
          </div>
        </div>

        {/* Target Weight */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pledged Weight (KG)</p>
          </div>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="e.g. 50"
            min={1}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Condition Details (Optional)</p>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the condition, cleanliness, or any other notes about your materials..."
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
          <p className="text-[10px] text-slate-400">Add 1 to 3 clear photos of your contribution.</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !targetWeight || photos.length === 0}
          className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
              Joining...
            </>
          ) : (
            <>Confirm Pledge <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </main>
    </div>
  );
}
