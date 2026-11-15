import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Calendar, MapPin, Users,
  Building2, Truck, ChevronRight, CheckCircle2,
  Clock, Scale, Sparkles, Filter, Check, X,
  Camera, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useCommunityCollectionsStore,
  type CommunityCollection,
  type SupportedMaterial,
  type CollectionMethod
} from '../../stores/communityCollectionsStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

const MATERIAL_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'Plastic', label: 'Plastic' },
  { id: 'Paper', label: 'Paper' },
  { id: 'Metal', label: 'Metal' },
  { id: 'Glass', label: 'Glass' },
  { id: 'Other', label: 'Other' },
];

/** Format YYYY-MM-DD → DD/MM/YYYY */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

const METHOD_FILTERS: Array<{ id: string; label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'collection_point', label: 'Collection points' },
  { id: 'agent_pickup', label: 'Agent pickups' },
];

export default function CommunityCollectionsPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s: any) => s.profile);

  // If a seller somehow accesses this page, redirect away
  if (profile?.role === 'seller') {
    navigate('/', { replace: true });
    return null;
  }

  const {
    collections,
    searchQuery,
    selectedMaterial,
    selectedMethod,
    activeTab,
    setSearchQuery,
    setSelectedMaterial,
    setSelectedMethod,
    setActiveTab,
    joinCollection,
  } = useCommunityCollectionsStore();

  // Modal RSVP state
  const [joiningCollection, setJoiningCollection] = useState<CommunityCollection | null>(null);
  const [estimatedWeight, setEstimatedWeight] = useState('');
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

  // Tab counts
  const counts = useMemo(() => {
    const discover = collections.filter(c => c.status !== 'completed' && !c.residentParticipation?.hasJoined).length;
    const active = collections.filter(c => c.status !== 'completed' && c.residentParticipation?.hasJoined).length;
    const completed = collections.filter(c => c.status === 'completed').length;
    return { discover, active, completed };
  }, [collections]);

  // Filtered collections for the selected tab
  const displayedCollections = useMemo(() => {
    return collections.filter(c => {
      // 1. Tab partitioning
      if (activeTab === 'discover') {
        if (c.status === 'completed' || c.residentParticipation?.hasJoined) return false;
      } else if (activeTab === 'active') {
        if (c.status === 'completed' || !c.residentParticipation?.hasJoined) return false;
      } else if (activeTab === 'completed') {
        if (c.status !== 'completed') return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        const matchesMat = c.acceptedMaterials.some(m => m.toLowerCase().includes(q));
        if (!matchesName && !matchesLoc && !matchesMat) return false;
      }

      // 3. Material filter
      if (selectedMaterial !== 'All') {
        if (!c.acceptedMaterials.includes(selectedMaterial as SupportedMaterial)) {
          return false;
        }
      }

      // 4. Method filter
      if (selectedMethod !== 'All') {
        if (c.collectionMethod !== selectedMethod) {
          return false;
        }
      }

      return true;
    });
  }, [collections, activeTab, searchQuery, selectedMaterial, selectedMethod]);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joiningCollection) return;
    setJoinError(null);

    const weightNum = parseFloat(estimatedWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      setJoinError('Please enter a valid positive weight in kilograms.');
      return;
    }

    const res = joinCollection(joiningCollection.id, weightNum);
    if (!res.success) {
      setJoinError(res.error || 'Failed to join collection.');
      return;
    }

    toast.success(`You've joined ${joiningCollection.name}!`, {
      description: `Estimated weight of ${weightNum.toFixed(1)} kg recorded for route planning.`,
    });
    setJoiningCollection(null);
    setEstimatedWeight('');
    handleRemoveImage();
  };

  return (
    <div className="flex flex-col min-h-full pb-8 bg-white dark:bg-slate-800 transition-colors">
      {/* ── FIXED TOP NAV (Header + Search + Tabs + Material Pills - SOLID OPAQUE WHITE) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 transition-all duration-300 shadow-xs">
        {/* Row 1: Centered Title Header */}
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-2 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-xl text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <h1 className="text-base sm:text-lg font-bold text-primary dark:text-white leading-tight">
              Community Collections
            </h1>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 capitalize tracking-wide">
              Join Group Drop-offs and collections
            </span>
          </div>

          <div className="w-9" aria-hidden="true" />
        </div>

        {/* Row 2: Main Navigation Tabs (Discover / Active / Completed) in TopNav */}
        <div className="px-4 pb-2">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'discover'
                  ? 'bg-primary dark:bg-slate-900 text-slate-100 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Discover</span>
              {counts.discover > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'discover'
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {counts.discover}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'active'
                  ? 'bg-amber-600 dark:bg-slate-900 text-slate-100 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Active</span>
              {counts.active > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white">
                  {counts.active}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'completed'
                  ? 'bg-emerald-600 dark:bg-slate-900 text-slate-100 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Completed</span>
              {counts.completed > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'completed'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {counts.completed}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Row 3: Search Input in TopNav (Below tabs) */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by collection, estate, or material..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Row 4: Material Category Filter Tabs in TopNav */}
        <div className="px-4 pb-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {MATERIAL_FILTERS.map(mat => (
            <button
              key={mat.id}
              onClick={() => setSelectedMaterial(mat.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                selectedMaterial === mat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/50'
              }`}
            >
              {mat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE BODY CONTENT ── */}
      <div className="space-y-2.5 pt-[calc(env(safe-area-inset-top,1rem)+11rem)] px-1">
        {/* ── HERO BANNER (Image from vectors) ── */}
        <div className="relative overflow-hidden rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 aspect-[2.6/1] sm:aspect-[3.2/1] max-h-48 w-full bg-slate-100 dark:bg-slate-800">
          <img
            src="/vectors/community-collection.webp"
            alt="Community Collection"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* ── COLLECTION METHOD FILTERS (Left-aligned, 12px, no 'Method:' label) ── */}
        <div className="flex items-center justify-start gap-1.5 pt-1 px-1 overflow-x-auto no-scrollbar">
          {METHOD_FILTERS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`px-3.5 py-1.5 rounded-xl text-[12px] transition-all ${
                selectedMethod === m.id
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs font-semibold'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-slate-700/50 font-medium'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── COLLECTION CARDS (bg-slate-50, w-28 h-28 image, updated details layout) ── */}
        <div className="space-y-1 pt-1">
          {displayedCollections.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center mx-auto mb-2 text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                <Filter className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                No collections found
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs mx-auto">
                {searchQuery || selectedMaterial !== 'All' || selectedMethod !== 'All'
                  ? 'No collections match your active filter criteria.'
                  : activeTab === 'active'
                  ? 'You have not joined any upcoming collections yet. Check the Discover tab to RSVP!'
                  : activeTab === 'completed'
                  ? 'No completed collections on record yet.'
                  : 'No upcoming community drives scheduled right now.'}
              </p>
              {(searchQuery || selectedMaterial !== 'All' || selectedMethod !== 'All') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedMaterial('All');
                    setSelectedMethod('All');
                  }}
                  className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            displayedCollections.map(collection => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                activeTab={activeTab}
                onClick={() => navigate(`/community-collections/${collection.id}`)}
                onJoinClick={(col) => setJoiningCollection(col)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── QUICK JOIN PARTICIPATION MODAL ── */}
      <AnimatePresence>
        {joiningCollection && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJoiningCollection(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 pb-[calc(env(safe-area-inset-bottom,1rem)+1.25rem)] shadow-2xl border border-slate-100 dark:border-slate-800 z-10"
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Join Collection Drive
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px] mt-0.5">
                    {joiningCollection.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setJoiningCollection(null);
                    handleRemoveImage();
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleJoinSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white block mb-1">
                    How much material do you expect to bring?
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
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
                      className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-base font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    <label className="text-xs font-bold text-slate-900 dark:text-white">
                      Material Photo (Proof)
                    </label>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
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

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500 leading-relaxed space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    Why estimated weight?
                  </p>
                  <p>
                    This estimate helps the hub prepare scale capacity and vehicle routing. Materials are weighed on calibrated scales during physical intake.
                  </p>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setJoiningCollection(null);
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
                    <span>Confirm RSVP</span>
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

/**
 * Reusable Collection Card with:
 * - Background: bg-slate-50 dark:bg-slate-800/80
 * - Image Holder: w-28 h-28
 * - Details Layout:
 *   1. Materials name as small text (top left)
 *   2. Collection type (top right: Drop-off or Agent pickup)
 *   3. Collection name (below materials)
 *   4. Location (below name)
 *   5. Progress bar with volume collected out of all: e.g. 80kg of 300kg (27%)
 *   6. Bottom right: Join collection button
 */
function CollectionCard({
  collection,
  activeTab,
  onClick,
  onJoinClick,
}: {
  collection: CommunityCollection;
  activeTab: 'discover' | 'active' | 'completed';
  onClick: () => void;
  onJoinClick: (collection: CommunityCollection) => void;
}) {
  const isCompleted = activeTab === 'completed' || collection.status === 'completed';
  const targetKg = collection.estimatedTargetWeightKg || 100;
  const currentKg = isCompleted
    ? (collection.actualAcceptedWeightKg || collection.currentEstimatedWeightKg || 0)
    : (collection.currentEstimatedWeightKg || 0);
  const percentage = Math.min(100, Math.round((currentKg / targetKg) * 100));

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 shadow-xs hover:shadow-md transition-all p-3 flex gap-3 cursor-pointer group active:scale-[0.99] relative overflow-hidden"
    >
      {/* ── LEFT: IMAGE HOLDER (w-28 h-28) ── */}
      <div className="w-28 h-28 shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-900 relative border border-slate-200/60 dark:border-slate-700/60">
        <img
          src={collection.image}
          alt={collection.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* ── RIGHT: DETAILS ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Row 1: Materials name (small text) on Left & Collection type on Top Right */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-bold capitalize tracking-wider text-emerald-600 dark:text-emerald-400 truncate">
              {collection.acceptedMaterials.join(' · ')}
            </span>

            {/* Top Right: Collection Type (Drop-off or Agent pickup) */}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1 ${
              collection.collectionMethod === 'collection_point'
                ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'
                : 'bg-blue-100/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60'
            }`}>
              {collection.collectionMethod === 'collection_point' ? (
                <>
                  <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Drop-off</span>
                </>
              ) : (
                <>
                  <Truck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Agent Pickup</span>
                </>
              )}
            </span>
          </div>

          {/* Row 2: Collection Name (below materials) */}
          <h3 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-white leading-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-1">
            {collection.name}
          </h3>

          {/* Row 3: Location (below collection name) */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 line-clamp-1">
            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
            <span className="truncate">{collection.location}</span>
          </p>
        </div>

        {/* Row 4: Progress Bar with Volume collected out of all: e.g. 80kg of 300kg (27%) */}
        <div className="my-1">
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-600 dark:text-slate-400">
            <span>
              {currentKg}kg of {collection.estimatedTargetWeightKg ? `${collection.estimatedTargetWeightKg}kg` : '—'} ({percentage}%)
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Row 5: Schedule on Left & Join Collection button on Bottom Right */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate mr-2">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">{formatDate(collection.scheduledDate)}</span>
          </div>

          {/* Bottom Right: Action Button */}
          {activeTab === 'discover' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoinClick(collection);
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-1 shrink-0"
            >
              <span>Join Collection</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          ) : activeTab === 'active' ? (
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-800/50 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-amber-500" />
              <span>{collection.residentParticipation?.estimatedWeightKg ?? 0} kg Joined</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
