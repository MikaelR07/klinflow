/**
 * Post Bulk Trade Page — Allows Swarm Creators to post the bulk drive to the marketplace
 */
import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Home, Truck, Info, ShieldCheck, AlertCircle, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
// @ts-ignore
window.L = L;
import { toast } from 'sonner';

import { useBookingStore, useAuthStore, useServiceStore, usePriceStore, useSystemStore, useNotificationStore, useMarketplaceStore, useCollectiveStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';

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

export default function PostBulkTrade() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => (s as any).profile);
  const userId = useAuthStore(s => (s as any).userId);
  const { fetchSwarmById } = useCollectiveStore();

  const selectedTime = useBookingStore(s => s.selectedTime);
  const selectTime = useBookingStore(s => s.selectTime);
  const liveAgents = useBookingStore(s => s.liveAgents);
  const fetchNearbyAgents = useBookingStore(s => s.fetchNearbyAgents);
  const subscribeToAgents = useBookingStore(s => s.subscribeToAgents);
  const cleanupAgents = useBookingStore(s => s.cleanupAgents);

  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const fetchConfig = useSystemStore(s => s.fetchConfig);
  const getConfigValue = useSystemStore(s => s.getConfigValue);

  const [step, setStep] = useState(1);
  const [swarm, setSwarm] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [customLocation] = useState(profile?.location || { estate: 'Westlands', latitude: -1.2635, longitude: 36.8048 });
  const [photos, setPhotos] = useState<any[]>([]);
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  // Hybrid Model State
  const [pickupMode, setPickupMode] = useState('pickup');
  const [selectedHub, setSelectedHub] = useState<any>(null);
  const [drillDownCompany, setDrillDownCompany] = useState<any>(null);

  const center: [number, number] = [customLocation.latitude || -1.2635, customLocation.longitude || 36.8048];
  const nearbyHubs = liveAgents
    .filter((a: any) => a.isHubActive && a.hubLocation?.lat)
    .map((hub: any) => ({ ...hub, distance: hub.distance_km || 999 }))
    .sort((a: any, b: any) => a.distance - b.distance);

  const hubIcon = L.divIcon({ className: 'custom-hub-icon', html: `<div class="w-8 h-8 rounded-xl bg-emerald-600 border-2 border-white shadow-xl flex items-center justify-center animate-bounce-slow"><span class="text-xs">🏢</span></div>`, iconSize: [32, 32], iconAnchor: [16, 32] });

  const [isManualTime, setIsManualTime] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [customTime, setCustomTime] = useState('09:00');
  const [customPricePerKg, setCustomPricePerKg] = useState<number | null>(null);

  useEffect(() => {
    const loadSwarm = async () => {
      if (!id) return;
      setLoading(true);
      const result = await fetchSwarmById(id);
      if (result.swarm) {
        setSwarm(result.swarm);
        setParticipants(result.participants);
      } else {
        toast.error("Swarm not found");
        navigate('/community-collective');
      }
      setLoading(false);
    };

    fetchCategories();
    fetchPrices();
    fetchConfig();
    const lat = customLocation.latitude || -1.2635;
    const lng = customLocation.longitude || 36.8048;
    fetchNearbyAgents(lat, lng);
    subscribeToAgents(lat, lng);
    loadSwarm();

    return () => cleanupAgents();
  }, [id]);

  const getCategoryPrice = usePriceStore(s => s.getCategoryPrice);
  const liveRatePerKg = getCategoryPrice(swarm?.material || '');
  const quantity = swarm?.current_weight || 0;

  const logisticsFee = pickupMode === 'dropoff' ? 0 : getConfigValue('fee_pickup', 200);
  const hubBonus = pickupMode === 'dropoff' ? 20 : 0;
  const askingPrice = customPricePerKg !== null ? customPricePerKg : (liveRatePerKg || 0);
  const assetValue = Math.round(quantity * (askingPrice + hubBonus));

  const { createListing } = useMarketplaceStore();

  const handleBook = async () => {
    let uploadToastId: string | number | null = null;
    setIsSubmitting(true);
    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        uploadToastId = toast.loading(`Uploading proof...`);
        const uploadPromises = photos.map(async (p, i) => {
          const compressed = await compressImage(p, { maxWidth: 1024, quality: 0.7 });
          const fileName = `${userId}/${Date.now()}-${i}-${compressed.name?.replace(/\s/g, '_')}`;
          const { data, error } = await supabase.storage.from('pickups').upload(fileName, compressed);
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage.from('pickups').getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        });
        photoUrls = await Promise.all(uploadPromises);
      }

      // Identify top contributors for metadata
      const sortedParticipants = [...participants].sort((a, b) => b.pledged_weight - a.pledged_weight);
      const topContributors = sortedParticipants.slice(0, 3).map(p => p.profiles?.name || 'Verified Member');

      await createListing({
        material: swarm.material,
        quantity: quantity,
        pricePerKg: askingPrice,
        location: pickupMode === 'dropoff' ? (selectedHub?.name || 'Klinflow Hub') : swarm.estate,
        latitude: pickupMode === 'dropoff' ? selectedHub?.lat : customLocation.latitude,
        longitude: pickupMode === 'dropoff' ? selectedHub?.lng : customLocation.longitude,
        photoUrl: photoUrls.length > 0 ? photoUrls[0] : null,
        description: customDescription,
        grade: 'Standard',
        swarm_id: swarm.id,
        is_bulk_drive: true,
        group_metadata: {
          contributorCount: participants.length,
          topContributors: topContributors
        }
      });

      await useNotificationStore.getState().addNotification(
        "Community Bulk Drive! 🏆",
        `${swarm.estate} just listed ${quantity}kg of ${swarm.material} as a bulk drive!`,
        'success',
        'agent'
      );

      toast.success("Bulk Drive Posted to Marketplace!");
      navigate('/my-trades');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error("Posting Failed", { description: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      if (uploadToastId) toast.dismiss(uploadToastId);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-900/70 max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Bulk Drive Trade</h1>
            <p className="text-[10px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-1">Step {step} of 3</p>
          </div>

          <div className="w-11 h-11 flex items-center justify-center">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-4 bg-emerald-500' : 'w-1.5 bg-slate-100 dark:bg-slate-800'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-0 pb-2 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] relative max-w-lg mx-auto w-full px-1.5">
        <AnimatePresence mode="wait">
          {/* ── PRE-FILLED INFO ── */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-indigo-400 capitalize tracking-widest mb-1">Community Bulk Drive</p>
              <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 capitalize">{swarm?.material} • {quantity} KG</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-indigo-400 capitalize tracking-widest mb-1">Contributors</p>
              <p className="text-sm font-black text-indigo-900 dark:text-indigo-100">{participants.length}</p>
            </div>
          </div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <PostTradeValuationStep
              key="step-1"
              photos={photos}
              setPhotos={setPhotos}
              liveRatePerKg={liveRatePerKg}
              customPricePerKg={customPricePerKg}
              setCustomPricePerKg={setCustomPricePerKg}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
            />
          )}

          {step === 2 && (
            <PostTradeCollectionStep
              key="step-2"
              pickupMode={pickupMode}
              setPickupMode={setPickupMode}
              drillDownCompany={drillDownCompany}
              setDrillDownCompany={setDrillDownCompany}
              liveWeavers={[]}
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

          {step === 3 && (
            <PostTradeSummaryStep
              key="step-3"
              wasteType={{ label: swarm?.material }}
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

        <div className="mt-12 space-y-6">
          {step < 3 ? (
            <button
              disabled={
                isSubmitting ||
                (step === 2 && pickupMode === 'pickup' && !selectedTime && !isManualTime) ||
                (step === 2 && pickupMode === 'dropoff' && !selectedHub)
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
              onClick={() => setShowEscrowModal(true)}
              className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>CONFIRM BULK TRADE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showEscrowModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-28">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEscrowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 pb-10 shadow-2xl overflow-hidden">
              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-indigo-600/10 rounded-3xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Confirm Bulk Listing</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    This bulk drive will be posted to the agent marketplace. Once an agent accepts, the payout will be automatically split proportionally among the {participants.length} contributors.
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleBook()}
                  className={`w-full p-5 bg-indigo-600 shadow-indigo-600/30 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3`}
                >
                  {isSubmitting ? <span className="animate-pulse">POSTING BULK DRIVE...</span> : <span>POST TO MARKETPLACE</span>}
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
