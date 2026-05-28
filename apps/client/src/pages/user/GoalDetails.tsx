/**
 * GoalDetails.tsx — View community goal details, progress, participants, and contribute.
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Target, Scale, MapPin, Users, Clock,
  ChevronRight, X, CheckCircle2, AlertTriangle, Award, ShieldCheck
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import type { CollectiveGoal, GoalParticipant } from '@klinflow/core/stores/collectiveStore';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function GoalDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const { fetchGoalById, joinGoal } = useCollectiveStore();

  const [goal, setGoal] = useState<CollectiveGoal | null>(null);
  const [participants, setParticipants] = useState<GoalParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [pledgeWeight, setPledgeWeight] = useState('');
  const [joining, setJoining] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const result = await fetchGoalById(id);
    setGoal(result.goal);
    setParticipants(result.participants);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleJoin = async () => {
    if (!pledgeWeight || Number(pledgeWeight) <= 0) return toast.error('Enter a valid weight');
    if (!id || !profile?.id) return;

    setJoining(true);
    const { success } = await joinGoal(id, profile.id, Number(pledgeWeight));
    setJoining(false);

    if (success) {
      toast.success('Contribution pledged!');
      setShowJoin(false);
      setPledgeWeight('');
      loadData();
    } else {
      toast.error('Failed to contribute. Try again.');
    }
  };

  const percentage = goal ? Math.min(100, Math.round((goal.current_weight / goal.target_weight) * 100)) : 0;
  const alreadyJoined = participants.some(p => p.user_id === profile?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800">
        <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800 px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-500">Goal not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-emerald-600 uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

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
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tighter leading-tight">Goal Details</h1>
              <p className="text-[10px] font-bold text-emerald-600 capitalize tracking-widest flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Community Mission
              </p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] pb-32 max-w-lg mx-auto w-full px-1.5 space-y-5">

        {/* Progress Hero Card */}
        <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -right-2 -bottom-6 w-24 h-24 bg-white/5 rounded-full" />

          <div className="relative z-10 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] font-bold text-emerald-200 uppercase tracking-widest mb-1">Community Goal</p>
                <h2 className="text-2xl text-white tracking-tight">{goal.title}</h2>
              </div>
              <div className="relative w-[72px] h-[72px] flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="36" cy="36" r="30" className="stroke-white/20" strokeWidth="5" fill="none" />
                  <circle cx="36" cy="36" r="30" className="stroke-emerald-400" strokeWidth="5" fill="none" strokeDasharray="188" strokeDashoffset={188 - (188 * percentage) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-sm font-black text-white">{percentage}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold">
                <span>{goal.current_weight.toLocaleString()} KG</span>
                <span>{goal.target_weight.toLocaleString()} KG</span>
              </div>
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }} />
              </div>
            </div>

            {goal.reward && (
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 w-fit">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest">{goal.reward}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {goal.description && (
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">About This Goal</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{goal.description}</p>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estate</p>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{goal.estate}</p>
          </div>
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Contributors</p>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{participants.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remaining</p>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{Math.max(0, goal.target_weight - goal.current_weight).toLocaleString()} KG</p>
          </div>
          <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Created</p>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {new Date(goal.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Contributors ({participants.length})</h3>
          </div>
          {participants.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-xs text-slate-400">No contributions yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {participants.map((p) => (
                <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {(p.profiles?.name || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.profiles?.name || 'Anonymous'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{p.status}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{p.pledged_weight} KG</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-700 p-4 pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)]">
        {alreadyJoined ? (
          <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> You've Contributed
          </div>
        ) : (
          <button
            onClick={() => setShowJoin(true)}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Contribute Stock <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contribute Modal */}
      <AnimatePresence>
        {showJoin && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2rem] p-6 pb-8 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold dark:text-white">Contribute to Goal</h2>
                <button onClick={() => setShowJoin(false)} className="p-2 rounded-full bg-slate-100 dark:bg-slate-700"><X className="w-4 h-4 text-slate-500" /></button>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-xl p-4 flex items-center gap-3 border border-emerald-100 dark:border-emerald-500/20">
                <ShieldCheck className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{goal.title}</p>
                  <p className="text-[10px] text-emerald-600/70 dark:text-emerald-300/60">Remaining: {Math.max(0, goal.target_weight - goal.current_weight).toLocaleString()} KG needed</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Your Pledge (KG)</label>
                <input
                  type="number"
                  value={pledgeWeight}
                  onChange={(e) => setPledgeWeight(e.target.value)}
                  placeholder="e.g. 100"
                  min={1}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {joining ? (
                  <><div className="w-4 h-4 border-2 border-emerald-300 border-t-white rounded-full animate-spin" /> Pledging...</>
                ) : (
                  'Confirm Contribution'
                )}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
