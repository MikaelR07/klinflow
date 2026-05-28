/**
 * CreateGoal.tsx — Full-page form for creating a community goal.
 */
import { useState } from 'react';
import { ArrowLeft, Target, Scale, MapPin, ChevronRight, Award, ShieldCheck, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import { toast } from 'sonner';

export default function CreateGoal() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const createGoal = useCollectiveStore(s => s.createGoal);
  const estateName = profile?.location?.estate || profile?.estate || 'Nairobi';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [reward, setReward] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Give your goal a title');
    if (!targetWeight || Number(targetWeight) < 50) return toast.error('Target must be at least 50 KG');

    setLoading(true);
    const { success } = await createGoal({
      creator_id: profile.id,
      estate: estateName,
      title: title.trim(),
      description: description.trim(),
      target_weight: Number(targetWeight),
      reward: reward.trim(),
      status: 'active',
    });
    setLoading(false);

    if (success) {
      toast.success('Community goal created!');
      navigate('/community-collective');
    } else {
      toast.error('Failed to create goal. Try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600/60 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3.5 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Create a Goal</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Community Mission
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] pb-10 max-w-lg mx-auto w-full px-4 space-y-6">

        {/* Info Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">Community Goals</p>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70 leading-relaxed">
              Rally your <span className="font-bold">{estateName}</span> community around a shared recycling target. Members can pledge their recyclables to help reach the goal and earn the reward together.
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estate</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{estateName}</p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Goal Title</p>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. The 5-Ton Challenge"
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
          />
        </div>

        {/* Description */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description (Optional)</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the goal and why it matters to the community..."
            rows={3}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300 resize-none"
          />
        </div>

        {/* Target Weight */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Weight (KG)</p>
          </div>
          <input
            type="number"
            value={targetWeight}
            onChange={(e) => setTargetWeight(e.target.value)}
            placeholder="e.g. 5000"
            min={50}
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400">Minimum 50 KG. Think big — the community can achieve great things together!</p>
        </div>

        {/* Reward */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Community Reward (Optional)</p>
          </div>
          <input
            type="text"
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder="e.g. Community Health Day, Free Waste Tools"
            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400">What does the community earn when this goal is achieved?</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !title || !targetWeight}
          className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-emerald-300 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>Launch Goal <ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </main>
    </div>
  );
}
