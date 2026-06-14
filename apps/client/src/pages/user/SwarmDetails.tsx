/**
 * SwarmDetails.tsx — View swarm details, progress, participants, and join.
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Truck, Scale, MapPin, Users, Clock,
  CheckCircle2, AlertTriangle, FileText, Image as ImageIcon,
  Edit3, Trash2, ChevronDown
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useCollectiveStore } from '@klinflow/core';
import type { Swarm, SwarmParticipant } from '@klinflow/core/stores/collectiveStore';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';

export default function SwarmDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => s.profile);
  const { fetchSwarmById, joinSwarm, deleteSwarm } = useCollectiveStore();

  const [swarm, setSwarm] = useState<Swarm | null>(null);
  const [participants, setParticipants] = useState<SwarmParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [expandedParticipantId, setExpandedParticipantId] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const result = await fetchSwarmById(id);
    setSwarm(result.swarm);
    setParticipants(result.participants);

    const { data } = await supabase
      .from('marketplace_listings')
      .select('id')
      .eq('swarm_id', id)
      .maybeSingle();

    if (data) {
      setIsPosted(true);
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handleDelete = () => {
    if (!id || !profile?.id || swarm?.creator_id !== profile.id) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!id) return;
    setShowDeleteModal(false);
    const { success } = await deleteSwarm(id);
    if (success) {
      toast.success('Swarm deleted successfully');
      navigate('/community-collective');
    } else {
      toast.error('Failed to delete swarm');
    }
  };

  const percentage = swarm ? Math.min(100, Math.round((swarm.current_weight / swarm.target_weight) * 100)) : 0;
  const alreadyJoined = participants.some(p => p.user_id === profile?.id);

  if (loading) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-[64px] z-[50] bg-[#F2F3F4] dark:bg-slate-800 overflow-hidden max-w-lg mx-auto">
        {/* Skeleton Hero Image */}
        <div className="w-full aspect-[4/5] sm:aspect-square bg-slate-200 dark:bg-slate-800/80 animate-pulse relative">
          {/* Skeleton Back Button */}
          <div
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
            className="absolute left-6 z-20 w-10 h-10 bg-black/10 dark:bg-black/20 rounded-full"
          />
        </div>

        {/* Skeleton Content Sheet */}
        <div className="bg-[#F2F3F4] dark:bg-slate-800 px-2 pt-2 pb-2 space-y-4 rounded-t-2xl -mt-32 relative z-10 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
          {/* Top Card Skeleton */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 h-[104px] animate-pulse" />

          {/* Progress Card Skeleton */}
          <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-700/40 h-[116px] animate-pulse" />

          {/* Stats Card Skeleton */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 h-[132px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!swarm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FF] dark:bg-slate-800 px-6 text-center">
        <AlertTriangle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-500">Swarm not found</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-xs font-bold text-indigo-600 uppercase tracking-widest">Go Back</button>
      </div>
    );
  }

  return (
    <div className="fixed top-0 left-0 right-0 bottom-[34px] z-[50] bg-slate-50 dark:bg-slate-800 flex flex-col max-w-lg mx-auto">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[1001] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Swarm Details</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Community Collection
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-14">
        {/* ── IMAGE CAROUSEL ── */}
        <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
          {swarm.images && swarm.images.length > 0 ? (
            <div className={`flex ${swarm.images.length > 1 ? 'overflow-x-auto snap-x snap-mandatory' : ''} no-scrollbar w-full h-full`}>
              {swarm.images.map((img, idx) => (
                <div key={idx} className="w-full h-full shrink-0 snap-center">
                  <img src={img} alt={`Swarm sample ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
              <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
              <p className="text-[10px] font-bold tracking-widest uppercase">No images provided</p>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

          {swarm.images && swarm.images.length > 1 && (
            <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
              <span>1 / {swarm.images.length}</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
            </div>
          )}
        </div>

        {/* ── SPECIFICATIONS CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target Material</p>
              <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                {swarm.material}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${swarm.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' : 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 border border-slate-200 dark:border-slate-500/20'}`}>
                {swarm.status === 'active' ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{swarm.status}</span>
              </div>
              {swarm.creator_id === profile?.id && (
                <button
                  onClick={() => navigate(`/community-collective/swarm/${swarm.id}/edit`)}
                  className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center active:scale-95 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </button>
              )}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Volume</p>
                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">{swarm.target_weight} KG</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 capitalize block truncate max-w-[120px]">{swarm.estate}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Created On</p>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{new Date(swarm.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {swarm.closes_at && (
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{new Date(swarm.closes_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Progress Card (Professional Neutral Style) */}
        <div className="bg-white dark:bg-slate-900/60 p-5 rounded-xl border border-slate-700/40 flex flex-col justify-center text-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
            Swarm Progress
          </p>

          <p className="text-xl font-black text-green-600 dark:text-slate-100 leading-none">
            {percentage}% Complete
          </p>

          <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold mt-1.5">
            {swarm.current_weight} / {swarm.target_weight} KG collected
          </p>

          <div className="h-2 w-full bg-slate-700/50 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <div
              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Swarm Stats Card */}
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Target Weight</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight capitalize">{swarm.target_weight} KG</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Collected</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{swarm.current_weight} KG</p>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shrink-0">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Members</p>
                <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight capitalize">{participants.length}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Remaining</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{Math.max(0, swarm.target_weight - swarm.current_weight)} KG</p>
            </div>
          </div>
        </div>



        {/* Description Card */}
        {swarm.description && (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-3">Description</h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{swarm.description}</p>
          </div>
        )}

        {/* Participants Card */}
        <div className="bg-white dark:bg-slate-900/60 p-0 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4">
            <h4 className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Participants ({participants.length})</h4>
          </div>
          {participants.length === 0 ? (
            <div className="px-5 pb-5 text-center">
              <p className="text-xs text-slate-400">No one has joined yet. Be the first!</p>
            </div>
          ) : (
            <div>
              {participants.map((p, idx) => {
                const isExpanded = expandedParticipantId === p.id;
                const hasDetails = p.description || (p.images && p.images.length > 0);

                return (
                  <div key={p.id}>
                    {idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-700 mx-5" />}
                    <div
                      onClick={() => hasDetails && setExpandedParticipantId(isExpanded ? null : p.id)}
                      className={`px-5 py-3.5 flex items-center justify-between ${hasDetails ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 font-bold text-xs">
                          {(p.profiles?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize tracking-tight">{p.profiles?.name || 'Creator'}</p>
                          <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest flex items-center gap-1">
                            {p.status} {p.description && '• notes'} {p.images && p.images.length > 0 && '• photo'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{p.pledged_weight} KG</p>
                        {hasDetails && (
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </div>
                    </div>

                    {isExpanded && hasDetails && (
                      <div className="px-5 pb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                          {p.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 italic">"{p.description}"</p>
                          )}
                          {p.images && p.images.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              {p.images.map((img: string, i: number) => (
                                <img key={i} src={img} alt="Proof" className="w-full h-20 rounded-lg object-cover border border-slate-200 dark:border-slate-600 shadow-sm" />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Creator Actions */}
        {swarm.creator_id === profile?.id && (
          <div className="pt-2">
            {isPosted ? (
              <div className="w-full bg-indigo-600 dark:bg-indigo-900/20 p-5 rounded-3xl border border-indigo-100 dark:border-indigo-800 text-center">
                <Truck className="w-6 h-6 text-white mx-auto mb-2" />
                <p className="text-sm font-semibold text-indigo-100 dark:text-indigo-300 leading-relaxed">
                  Material posted awaiting buyer response you'll be notified. Check on your inventory page for response.
                </p>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleDelete}
                  className={`${(profile?.role === 'user' || swarm.current_weight > 0) ? 'flex-1' : 'w-full'} py-4 bg-red-500 dark:bg-slate-800 text-white border border-rose-100 dark:border-rose-900/30 rounded-2xl font-semibold text-xs capitalize tracking-widest active:scale-[0.97] transition-all flex items-center justify-center gap-2`}
                >
                  <Trash2 className="w-4 h-4 shrink-0" /> Delete
                </button>
                {profile?.role === 'user' ? (
                  <button
                    onClick={() => navigate(`/community-collective/swarm/${swarm.id}/request-pickup`)}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs capitalize tracking-[0.1em] active:scale-[0.97] transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/20"
                  >
                    <Truck className="w-4 h-4 shrink-0" /> Request Group Pickup
                  </button>
                ) : (
                  swarm.current_weight > 0 && (
                    <button
                      onClick={() => navigate(`/community-collective/swarm/${swarm.id}/post-trade`)}
                      className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xs capitalize tracking-[0.1em] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4 shrink-0" /> Post Bulk Trade
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA — only visible to non-creators */}
        {swarm.creator_id !== profile?.id && (
          <div className="flex gap-3 pt-2">
            {alreadyJoined ? (
              <div className="flex-1 py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl font-semibold text-xs capitalize tracking-widest flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> You've Joined This Swarm
              </div>
            ) : (
              <button
                onClick={() => navigate(`/community-collective/swarm/${swarm.id}/join`)}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-semibold text-xs capitalize tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              >
                <Truck className="w-4 h-4" /> Join This Swarm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete this Swarm?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This action cannot be undone. All collected progress and participant data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3.5 bg-rose-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-rose-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
