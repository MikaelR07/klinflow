/**
 * Post Trade Page — 4-Step Marketplace Flow
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, CheckCircle2, Home, Truck, Info, ShieldCheck, AlertCircle, ChevronRight, ArrowUpRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
// @ts-ignore
window.L = L;
import { toast } from 'sonner';

import { useBookingStore } from '@klinflow/core/stores/bookingStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { usePriceStore } from '@klinflow/core/stores/priceStore';
import { useSystemStore } from '@klinflow/core/stores/systemStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';

import PostTradeMaterialStep from '../../features/postTrade/PostTradeMaterialStep';
import PostTradeValuationStep from '../../features/postTrade/PostTradeValuationStep';
import PostTradeCollectionStep from '../../features/postTrade/PostTradeCollectionStep';
import PostTradeSummaryStep from '../../features/postTrade/PostTradeSummaryStep';

// ── COMPACT MAP ICONS ───────────────────────────────────────────

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center"><span class="text-xs">🏠</span></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const agentIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-agent-icon',
  html: `<div class="relative w-7 h-7 rounded-lg ${isSelected ? 'bg-emerald-600' : 'bg-emerald-500'} border-2 border-white shadow-xl flex items-center justify-center transition-all"><span class="text-xs">🚛</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const companyIcon = (isSelected: boolean) => L.divIcon({
  className: 'custom-company-icon',
  html: `<div class="relative w-8 h-8 rounded-xl ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'} border-2 border-white shadow-xl flex items-center justify-center transition-all scale-110"><span class="text-xs">🏢</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

export default function PostTrade() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);
  const userId = useAuthStore(s => (s as any).userId);
  const selectedTime = useBookingStore(s => s.selectedTime);
  const selectTime = useBookingStore(s => s.selectTime);
  const liveAgents = useBookingStore(s => s.liveAgents);
  const fetchNearbyAgents = useBookingStore(s => s.fetchNearbyAgents);
  const subscribeToAgents = useBookingStore(s => s.subscribeToAgents);
  const cleanupAgents = useBookingStore(s => s.cleanupAgents);
  const liveWeavers: any[] = []; // Placeholder until weaver store is built
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const getPriceForMaterial = usePriceStore(s => s.getPriceForMaterial);
  const fetchConfig = useSystemStore(s => s.fetchConfig);
  const getConfigValue = useSystemStore(s => s.getConfigValue);

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteType, setWasteType] = useState<any>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<any>(1);
  const [customLocation] = useState(profile?.location || { estate: 'Westlands', latitude: -1.2635, longitude: 36.8048 });
  const [photos, setPhotos] = useState<any[]>([]); // Array of up to 4 photos
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  // Hybrid Model State
  const [pickupMode, setPickupMode] = useState('pickup'); // 'pickup' | 'dropoff'
  const [selectedHub, setSelectedHub] = useState<any>(null);
  const [drillDownCompany, setDrillDownCompany] = useState<any>(null);

  const query = new URLSearchParams(useLocation().search);
  const initialMode = query.get('mode'); // 'service' | 'sell'

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const center: [number, number] = [customLocation.latitude || -1.2635, customLocation.longitude || 36.8048];

  const nearbyHubs = liveAgents
    .filter((a: any) => a.isHubActive && a.hubLocation?.lat)
    .map((hub: any) => ({
      ...hub,
      distance: getDistance(center[0], center[1], hub.hubLocation!.lat, hub.hubLocation!.lng)
    }))
    .sort((a: any, b: any) => a.distance - b.distance);

  const hubIcon = L.divIcon({
    className: 'custom-hub-icon',
    html: `<div class="w-8 h-8 rounded-xl bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center animate-bounce-slow"><span class="text-xs">🏢</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const [isManualTime, setIsManualTime] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [customTime, setCustomTime] = useState('09:00');
  const [customPricePerKg, setCustomPricePerKg] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchPrices();
    fetchConfig();
    fetchNearbyAgents();
    subscribeToAgents();

    if (initialMode === 'service') {
      const generalCat = categories.find(c => c.id === 'general');
      if (generalCat) {
        setWasteType(generalCat);
        setSelectedSubItem({
          id: `cat-${generalCat.id}`,
          label: `${generalCat.label} (Mixed)`,
          price_per_unit: 0,
          unit: 'kg',
          slug: generalCat.slug || generalCat.id
        });
      }
    }

    return () => cleanupAgents();
  }, [initialMode, categories.length, cleanupAgents, fetchCategories, fetchConfig, fetchNearbyAgents, fetchPrices, subscribeToAgents]);

  // ── PRICING (Powered by Market Hub) ──
  const selected = selectedSubItem || wasteType;
  const processingFee = selected ? (selected.price_per_unit || 0) * quantity : 0;
  const logisticsFee = pickupMode === 'dropoff' ? 0 : getConfigValue('fee_pickup', 200);
  const minPickupFee = pickupMode === 'dropoff' ? 0 : getConfigValue('fee_min_pickup', 200);

  const baseTotal = processingFee + logisticsFee;
  const subtotal = Math.max(baseTotal, minPickupFee);
  const discountAmount = selectedTime ? (subtotal * (selectedTime.discount / 100)) : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);

  // Unified Oracle Match: Using IDs for 100% accuracy
  const liveRatePerKg = usePriceStore.getState().getCategoryPrice(selected?.id || wasteType?.id || '');

  // XP Boost Logic
  const xpMultiplier = profile?.subscriptionTier === 'standard' ? 1.5 : profile?.subscriptionTier === 'premium' ? 2 : 1;
  const hubBonus = pickupMode === 'dropoff' ? 20 : 0; // Extra KSh for dropping off
  const askingPrice = customPricePerKg !== null ? customPricePerKg : liveRatePerKg;
  const assetValue = Math.round(quantity * (askingPrice + hubBonus));

  const { createListing } = useMarketplaceStore();

  const handleBook = async () => {
    let uploadToastId: string | number | null = null;
    setIsSubmitting(true);
    try {
      // 1. Process & Upload Photos (Multi-Angle Proof)
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        uploadToastId = toast.loading(`Optimizing & Uploading ${photos.length} image${photos.length > 1 ? 's' : ''}...`);

        const uploadPromises = photos.map(async (p, i) => {
          // A. Client-side Compression
          const compressed = await compressImage(p, { maxWidth: 1024, quality: 0.7 });

          // B. Upload to Storage
          const fileName = `${userId}/${Date.now()}-${i}-${compressed.name?.replace(/\s/g, '_')}`;
          const { data, error } = await supabase.storage
            .from('pickups')
            .upload(fileName, compressed);

          if (error) throw error;
          const { data: publicUrlData } = supabase.storage.from('pickups').getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        });

        photoUrls = await Promise.all(uploadPromises);
      }

      // 2. Create Marketplace Listing
      await createListing({
        material: selected.label || selected.slug,
        quantity: quantity,
        pricePerKg: askingPrice,
        location: pickupMode === 'dropoff' ? (selectedHub?.name || 'Klinflow Hub') : customLocation.estate,
        latitude: pickupMode === 'dropoff' ? selectedHub?.lat : customLocation.latitude,
        longitude: pickupMode === 'dropoff' ? selectedHub?.lng : customLocation.longitude,
        photoUrl: photoUrls.length > 0 ? photoUrls[0] : null, // Principal photo
        description: customDescription,
        grade: 'Standard'
      });

      // 3. Notify the Market (Agents & Weavers)
      await useNotificationStore.getState().addNotification(
        "New Material for Sale! ♻️",
        `${profile?.name} listed ${quantity}kg of ${selected.label || selected.slug} at KSh ${askingPrice}/kg.`,
        'info',
        'agent', // Notify Agents
        null,
        { wasteType: selected.slug } // Metadata for client-side filtering
      );

      toast.success("Collection Posted!");
      navigate('/my-trades');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error("Posting Failed", { description: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      if (uploadToastId) toast.dismiss(uploadToastId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-900/70 max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">New Trade</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Step {step} of 4</p>
          </div>

          <div className="w-11 h-11 flex items-center justify-center">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-100 dark:bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-0 pb-2 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] relative max-w-lg mx-auto w-full px-1.5">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: MATERIAL & WEIGHT ── */}
          {step === 1 && (
            <PostTradeMaterialStep
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              wasteType={wasteType}
              setWasteType={setWasteType}
              quantity={quantity}
              setQuantity={setQuantity}
              categories={categories}
              setSelectedSubItem={setSelectedSubItem}
              getPriceForMaterial={getPriceForMaterial}
            />
          )}

          {/* ── STEP 2: VALUATION & PROOF ── */}
          {step === 2 && (
            <PostTradeValuationStep
              photos={photos}
              setPhotos={setPhotos}
              liveRatePerKg={liveRatePerKg}
              customPricePerKg={customPricePerKg}
              setCustomPricePerKg={setCustomPricePerKg}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
            />
          )}

          {/* ── STEP 3: COLLECTION METHOD ── */}
          {step === 3 && (
            <PostTradeCollectionStep
              pickupMode={pickupMode}
              setPickupMode={setPickupMode}
              drillDownCompany={drillDownCompany}
              setDrillDownCompany={setDrillDownCompany}
              liveWeavers={liveWeavers}
              center={center}
              userIcon={userIcon}
              nearbyHubs={nearbyHubs}
              hubIcon={hubIcon}
              setSelectedHub={setSelectedHub}
              selectedHub={selectedHub}
              liveAgents={liveAgents}
              agentIcon={agentIcon}
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              companyIcon={companyIcon}
              selectTime={selectTime}
              setIsManualTime={setIsManualTime}
              isManualTime={isManualTime}
              selectedTime={selectedTime}
              customDate={customDate}
              setCustomDate={setCustomDate}
              customTime={customTime}
              setCustomTime={setCustomTime}
            />
          )}

          {/* ── STEP 4: POST SUMMARY ── */}
          {step === 4 && (
            <PostTradeSummaryStep
              wasteType={wasteType}
              quantity={quantity}
              pickupMode={pickupMode}
              profile={profile}
              isManualTime={isManualTime}
              customDate={customDate}
              customTime={customTime}
              selectedHub={selectedHub}
              assetValue={assetValue}
              logisticsFee={logisticsFee}
              photos={photos}
              askingPrice={askingPrice}
            />
          )}
        </AnimatePresence>

        {/* ── UNIFIED GLOBAL ACTION BUTTON ── */}
        <div className="mt-12 space-y-6">
          {step < 4 ? (
            <button
              disabled={
                isSubmitting ||
                (step === 1 && (!wasteType || !quantity)) ||
                (step === 3 && pickupMode === 'pickup' && !selectedTime && !isManualTime) ||
                (step === 3 && pickupMode === 'dropoff' && !selectedHub)
              }
              onClick={() => setStep(step + 1)}
              className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
            >
              <span>CONTINUE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={() => initialMode === 'sell' ? handleBook() : setShowEscrowModal(true)}
              className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm  active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>CONFIRM TRADE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* ── STEP 3 NOTICES (BELOW BUTTON) ── */}
          {step === 3 && (
            <div className="space-y-4 pb-8">
              {/* ── PICKUP CHARGES NOTICE ── */}
              {pickupMode === 'pickup' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold capitalize tracking-widest text-amber-700">Dispatch Notice</h4>
                    <p className="text-[11px] font-medium text-amber-800/70 dark:text-amber-400 leading-relaxed mt-1">
                      A logistics fee of **KSh {logisticsFee}** applies for agent collection to cover fuel and transport costs.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── FREE DROP-OFF NOTICE ── */}
              {pickupMode === 'dropoff' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold capitalize tracking-widest text-emerald-700">Zero Charges</h4>
                    <p className="text-[11px] font-medium text-emerald-800/70 dark:text-amber-400 leading-relaxed mt-1">
                      Self drop-offs are **completely free**. You will receive 100% of your waste value without any deductions.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── COMPACT NO AGENTS FALLBACK ── */}
              {pickupMode === 'pickup' && liveAgents.length === 0 && (
                <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-rose-900 dark:text-white">No Agents Online Nearby</h4>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-rose-800/70 dark:text-rose-400 leading-tight">
                    No active agents nearby right now. Please **Schedule for Later** or switch to **Self Drop-off** to finish.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPickupMode('dropoff')} className="flex-1 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold text-rose-600 capitalize tracking-widest">Switch to Drop-off</button>
                    <button onClick={() => setIsManualTime(true)} className="flex-1 py-2 bg-rose-500 rounded-lg text-xs font-semibold text-white capitalize tracking-widest">Schedule Later</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BOOKING CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {showEscrowModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-28">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEscrowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 pb-10 shadow-2xl overflow-hidden">
              <div className="relative space-y-6">
                <div className={`w-16 h-16 ${pickupMode === 'pickup' ? 'bg-emerald-600/10' : 'bg-blue-600/10'} rounded-3xl flex items-center justify-center`}>
                  {pickupMode === 'pickup' ? <CheckCircle2 className="w-8 h-8 text-emerald-600" /> : <Home className="w-8 h-8 text-blue-600" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    {pickupMode === 'pickup' ? 'Confirm Trade Listing' : 'Confirm Hub Drop-off'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {pickupMode === 'pickup'
                      ? 'Your listing will be posted to the marketplace. An agent will be dispatched to verify your stock and facilitate payment.'
                      : `Your trade will be posted. Please drop off the items at ${selectedHub?.name || 'the selected hub'} to complete the verification.`}
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleBook()}
                  className={`w-full p-5 ${pickupMode === 'pickup' ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-slate-900 shadow-slate-900/30'} text-white rounded-2xl font-semibold text-sm  active:scale-95 transition-all flex items-center justify-center gap-3`}
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">{pickupMode === 'pickup' ? 'DISPATCHING AGENT...' : 'POSTING TRADE...'}</span>
                  ) : (
                    <>
                      <span>{pickupMode === 'pickup' ? 'DISPATCH AGENT NOW' : 'POST TRADE & DROP-OFF'}</span>
                      {pickupMode === 'pickup' ? <Truck className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
                <button onClick={() => setShowEscrowModal(false)} className="w-full text-xs font-semibold text-slate-400 capitalize tracking-widest mt-4">Go Back</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
