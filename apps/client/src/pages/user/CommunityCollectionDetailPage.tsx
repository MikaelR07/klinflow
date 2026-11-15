import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, MapPin, Users,
  Building2, Truck, CheckCircle2, AlertCircle, Scale,
  Share2, ShieldCheck, Check, Info, Sparkles, X, ChevronRight,
  Camera, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCommunityCollectionsStore,
  type CommunityCollection
} from '../../stores/communityCollectionsStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

export default function CommunityCollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s: any) => s.profile);

  // If a seller accesses this page, redirect away
  if (profile?.role === 'seller') {
    navigate('/', { replace: true });
    return null;
  }

  const { collections, joinCollection, setActiveTab } = useCommunityCollectionsStore();
  const collection = collections.find(c => c.id === id);

  // Join Modal state
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [estimatedWeight, setEstimatedWeight] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [materialImage, setMaterialImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMaterialImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setMaterialImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-center p-6">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-3" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Collection Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested community collection drive could not be located.
        </p>
        <button
          onClick={() => navigate('/community-collections')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Collections
        </button>
      </div>
    );
  }

  const hasJoined = Boolean(collection.residentParticipation?.hasJoined);
  const isCompleted = collection.status === 'completed';

  const progressPercent = collection.estimatedTargetWeightKg
    ? Math.min(100, Math.round((collection.currentEstimatedWeightKg / collection.estimatedTargetWeightKg) * 100))
    : 0;

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);

    const weightNum = parseFloat(estimatedWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setJoinError('Please enter a valid positive weight in kilograms.');
      return;
    }

    const res = joinCollection(collection.id, weightNum);
    if (!res.success) {
      setJoinError(res.error || 'Failed to join collection.');
      return;
    }

    setIsJoinModalOpen(false);
    handleRemoveImage();
    setEstimatedWeight('');
    toast.success(`You've joined ${collection.name}!`, {
      description: `Estimated weight of ${weightNum.toFixed(1)} kg recorded for hub route planning.`,
    });
  };

  const handleBack = () => {
    if (hasJoined && !isCompleted) {
      setActiveTab('active');
    } else if (isCompleted) {
      setActiveTab('completed');
    } else {
      setActiveTab('discover');
    }
    navigate('/community-collections');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* ── SOLID WHITE FIXED TOP NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Back to collections"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center max-w-[210px] px-1">
            <h1 className="text-sm font-bold text-slate-600 dark:text-white truncate">
              {collection.name}
            </h1>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 capitalize truncate">
              {collection.location}
            </span>
          </div>

          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
            isCompleted
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              : hasJoined
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300/40'
              : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
          }`}>
            {isCompleted ? 'Completed' : hasJoined ? 'Active' : 'Open'}
          </span>
        </div>
      </header>

      {/* ── MAIN CONTENT (Flows directly on the page, no floating wrapper cards) ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)] pb-[calc(11rem+env(safe-area-inset-bottom,0px))] space-y-6">
        
        {/* ── COVER IMAGE HERO ── */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-xs">
          <img
            src={collection.image}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

          {/* Method & Participants Badges */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg font-medium">
              {collection.collectionMethod === 'collection_point' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Drop-off Point</span>
                </>
              ) : (
                <>
                  <Truck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Agent Pickup</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg font-medium">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>{collection.participantCount} Joined</span>
            </div>
          </div>
        </div>

        {/* ── TITLE & ORGANIZER (Directly on the page) ── */}
        <div className="space-y-2">
          {/* Collection Name + Material Pills on same row */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-600 dark:text-white leading-tight">
              {collection.name}
            </h2>
            <div className="flex flex-wrap justify-end gap-1 shrink-0">
              {collection.acceptedMaterials.map(mat => (
                <span
                  key={mat}
                  className="text-[10px] font-bold capitalize tracking-wider px-2 py-0.5 rounded-md bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40"
                >
                  {mat}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Organized by <strong className="text-emerald-600 dark:text-slate-200">{collection.organizingHub}</strong></span>
          </div>
        </div>

        {/* ── PARTICIPATION STATUS (When Joined or Completed) ── */}
        {hasJoined && !isCompleted && (
          <div className="p-4 bg-amber-500/20 border border-amber-500/30 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>You're participating in this drive</span>
              </div>
              <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                RSVP Confirmed
              </span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              Your Estimated Contribution: <strong className="font-bold text-sm text-amber-950 dark:text-white">{collection.residentParticipation?.estimatedWeightKg} kg</strong>
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
              * Weight estimate assists hub logistical planning. Actual volume is weighed on  scales upon collection.
            </p>
          </div>
        )}

        {isCompleted && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Drive Successfully Completed</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-emerald-500/20">
                <span className="text-[10px] text-slate-500 block">Total Recovered:</span>
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {collection.actualAcceptedWeightKg || collection.currentEstimatedWeightKg} kg
                </span>
              </div>
              {collection.residentParticipation?.actualAcceptedWeightKg !== undefined ? (
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-slate-500 block">Your Intake Weight:</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {collection.residentParticipation.actualAcceptedWeightKg} kg
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] text-slate-500 block">Completed On:</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {collection.completedAt || collection.scheduledDate}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── COLLECTION PROGRESS & VOLUME (Wrapped in gradient card) ── */}
        {!isCompleted && (
          <div className="rounded-2xl p-4 bg-gradient-to-r from-primary to-emerald-600 text-white shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-emerald-100 font-medium">Community Progress</span>
              <span className="text-white font-bold">
                {collection.currentEstimatedWeightKg}kg of {collection.estimatedTargetWeightKg || '—'}kg ({progressPercent}%)
              </span>
            </div>

            {collection.estimatedTargetWeightKg && (
              <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-emerald-100/90">
              <span>{collection.participantCount} residents joined</span>
              {collection.minParticipantsThreshold && (
                <span>Min. threshold: {collection.minParticipantsThreshold} participants</span>
              )}
            </div>
          </div>
        )}

        {/* ── LOGISTICS & SCHEDULE (Directly on the page with clean dividers) ── */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold capitalize tracking-wider text-slate-600 dark:text-slate-400">
            Logistics & Schedule
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-600 dark:text-white text-sm">
                  {collection.scheduledDate}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 inline text-emerald-600" />
                  {collection.startTime} – {collection.endTime}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-600 dark:text-white text-sm">
                  {collection.location}
                </p>
                {collection.collectionPointAddress && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-200">Drop-off Point:</span> {collection.collectionPointAddress}
                  </p>
                )}
                {collection.pickupAreaInstructions && (
                  <p className="text-slate-600 dark:text-slate-300 text-xs mt-1">
                    <span className="font-semibold text-slate-600 dark:text-slate-200">Pickup Area:</span> {collection.pickupAreaInstructions}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl shrink-0 mt-0.5">
                {collection.collectionMethod === 'collection_point' ? (
                  <Building2 className="w-4 h-4" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-600 dark:text-white text-sm">
                  {collection.collectionMethod === 'collection_point' ? 'Drop-off Collection' : 'Curbside Agent Sweep'}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  {collection.collectionMethod === 'collection_point'
                    ? 'Bring your bagged recyclables directly to the designated drop-off station during the collection window.'
                    : 'Place your prepared bundles outside your gate or unit door for collection by authorized fleet agents.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCEPTED MATERIALS & PREPARATION (Directly on page) ── */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-semibold capitalize tracking-wider text-slate-500 dark:text-slate-400">
            Accepted Recyclables & Instructions
          </h3>

          <div className="flex flex-wrap gap-2">
            {collection.acceptedMaterials.map(mat => (
              <span
                key={mat}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 border border-slate-200 dark:border-slate-800 shadow-2xs"
              >
                {mat}
              </span>
            ))}
          </div>

          {collection.preparationInstructions && (
            <div className="p-3.5 bg-emerald-600/20 border border-emerald-500/20 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Preparation Instructions:</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {collection.preparationInstructions}
              </p>
            </div>
          )}
        </div>


      </main>

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      <footer className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-4 py-3">
        {!hasJoined && !isCompleted ? (
          <div className="space-y-1.5">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Join Collection Drive</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              Free community participation · Enter estimated kg for logistics planning
            </p>
          </div>
        ) : hasJoined && !isCompleted ? (
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  You're Participating
                </p>
                <p className="text-[11px] text-slate-500">
                  Pledged: {collection.residentParticipation?.estimatedWeightKg} kg
                </p>
              </div>
            </div>
            <button
              onClick={handleBack}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
            >
              View Active Drives
            </button>
          </div>
        ) : (
          <div className="text-center py-1">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              This community drive has completed
            </p>
            <p className="text-[11px] text-slate-400">
              Recovered {collection.actualAcceptedWeightKg || collection.currentEstimatedWeightKg} kg of recyclables
            </p>
          </div>
        )}
      </footer>

      {/* ── JOIN PARTICIPATION MODAL ── */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsJoinModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(env(safe-area-inset-bottom,1rem)+1.25rem)] shadow-2xl border border-slate-100 dark:border-slate-800 z-10"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-emerald-600 dark:text-white">
                  Join Community Collection
                </h3>
                <button
                  onClick={() => {
                    setIsJoinModalOpen(false);
                    handleRemoveImage();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600 dark:text-white block mb-1">
                    How much material do you expect to bring?
                  </label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                    Enter your estimated weight in kilograms.
                  </p>

                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      autoFocus
                      value={estimatedWeight}
                      onChange={e => setEstimatedWeight(e.target.value)}
                      placeholder="e.g. 10.5"
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      kg
                    </span>
                  </div>

                  {joinError && (
                    <p className="text-xs text-rose-600 font-medium mt-1.5">
                      {joinError}
                    </p>
                  )}
                </div>

                {/* Optional Material Proof Image */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-600 dark:text-white">
                      Material Photo (Proof)
                    </label>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-2">
                    Upload a photo of your sorted materials to help hub agents plan load volume.
                  </p>

                  {imagePreview ? (
                    <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group">
                      <img
                        src={imagePreview}
                        alt="Material preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg backdrop-blur-xs transition-colors"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/70 group">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        <Camera className="w-4 h-4" />
                        <span className="text-xs font-semibold">Take or upload a photo</span>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, or WebP</span>
                    </label>
                  )}
                </div>

                <div className="p-3 bg-amber-600 dark:bg-slate-800/50 rounded-xl text-[12px] text-slate-500 leading-relaxed space-y-1">
                  <p className="font-semibold text-amber-100 dark:text-slate-300">
                    Why an estimated weight?
                  </p>
                  <p className='text-amber-200 dark:text-amber-300'>
                    This estimate helps the organizing hub prepare intake scales and transport capacity. Payouts and records are calculated solely on verified weight weighed during intake.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinModalOpen(false);
                      handleRemoveImage();
                    }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Join Collection</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
