/**
 * Book Pickup Page — 3-Page Progressive Flow
 * Refactored: UI steps extracted into dedicated components.
 */
import { useState, useEffect } from 'react';
import {
  ArrowLeft, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useMap } from 'react-leaflet';
import { AnimatePresence } from 'framer-motion';
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
import { supabase } from '@klinflow/supabase';
import { uploadFile } from '@klinflow/core/lib/storage';
import { MATERIAL_TYPES } from '@klinflow/core/stores/assetStore';
import { compressImage } from '@klinflow/core/utils/imageUtils';

import BookPickupMaterialStep from '../../features/bookPickup/BookPickupMaterialStep';
import BookPickupAgentStep from '../../features/bookPickup/BookPickupAgentStep';
import BookPickupSummaryStep from '../../features/bookPickup/BookPickupSummaryStep';
import BookPickupConfirmModal from '../../features/bookPickup/BookPickupConfirmModal';

// ── COMPACT MAP ICONS ───────────────────────────────────────────

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center"><span class="text-xs">🏠</span></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const agentIcon = (isSelected: boolean, isCompany = false) => L.divIcon({
  className: 'custom-agent-icon',
  html: `<div class="relative w-8 h-8 rounded-xl ${isSelected ? 'bg-primary' : isCompany ? 'bg-slate-900' : 'bg-emerald-500'} border-2 border-white shadow-xl flex items-center justify-center transition-all">
    <span class="text-[12px]">${isCompany ? '🏢' : '🚛'}</span>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}

export default function BookPickup() {
  const navigate = useNavigate();
  const { profile } = useAuthStore() as any;
  const {
    aiSuggestions, selectedTime, selectTime, createBooking,
    liveAgents, fetchNearbyAgents, subscribeToAgents, cleanupAgents,
    generateTimeSuggestions
  } = useBookingStore();
  const { categories, fetchCategories, isLoading } = useServiceStore();
  const { prices, fetchPrices, getPriceForMaterial } = usePriceStore();
  const { fetchConfig, getConfigValue } = useSystemStore();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const rescheduleId = location.state?.rescheduleId;
  const { bookings } = useBookingStore();

  const [wasteType, setWasteType] = useState<any>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<any>(1);
  const [customLocation, setCustomLocation] = useState(profile?.location || { estate: 'Nairobi', latitude: -1.2635, longitude: 36.8048 });

  // ── RESCHEDULE DATA LOADING ──
  useEffect(() => {
    if (rescheduleId && bookings.length > 0) {
      const existing = bookings.find(b => b.id === rescheduleId);
      if (existing) {
        // Find waste type category
        const cat = categories.find(c => c.slug === existing.wasteType || c.id === existing.wasteType);
        if (cat) {
          setWasteType(cat);
          setSelectedSubItem({
            id: `cat-${cat.id}`,
            label: `${cat.label} (Mixed)`,
            price_per_unit: usePriceStore.getState().getCategoryPrice(cat.id) || 0,
            unit: 'kg',
            slug: cat.slug || cat.id
          });
        }
        setQuantity(existing.bags || existing.actualWeightKg || 1);
        setCustomDescription(existing.notes || '');
        setCustomLocation({
          estate: existing.estate,
          latitude: existing.latitude,
          longitude: existing.longitude
        });
        // Parse time slot if possible
        if (existing.timeSlot?.includes('@')) {
          const parts = existing.timeSlot.split(' @ ');
          if (parts.length === 2) {
            setCustomDate(parts[0]!.trim());
            setCustomTime(parts[1]!.trim());
            setIsManualTime(true);
          }
        }
        if (existing.photoUrl) {
          setPhoto(existing.photoUrl);
        }
      }
    }
  }, [rescheduleId, bookings, categories]);


  useEffect(() => {
    // ── SMART GEOLOCATION: Detect current position if no saved profile location ──
    if (!profile?.location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCustomLocation({
            estate: 'Current Location',
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => console.log('[Booking] GPS Permission Denied or Failed', err),
        { enableHighAccuracy: true }
      );
    }
  }, [profile?.id]);

  const [photo, setPhoto] = useState<any>(null);
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  const [isManualTime, setIsManualTime] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [customTime, setCustomTime] = useState('09:00');
  const [paymentNumber, setPaymentNumber] = useState(profile?.phone || '');

  // ── WHITE-LABEL: Pre-select agent from Company Profile CTA ──
  const [searchParams] = useSearchParams();
  const preselectedAgentId = searchParams.get('agentId');
  const preselectedCompanyName = searchParams.get('companyName') ? decodeURIComponent(searchParams.get('companyName') as any) : null;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchPrices();
    fetchConfig();
    fetchNearbyAgents();
    generateTimeSuggestions();
    subscribeToAgents();

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    return () => {
      cleanupAgents();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [categories.length, cleanupAgents, fetchCategories, fetchConfig, fetchNearbyAgents, fetchPrices, generateTimeSuggestions, subscribeToAgents]);

  // Pre-select agent if coming from CompanyProfile
  useEffect(() => {
    if (preselectedAgentId && liveAgents.length > 0) {
      const match = liveAgents.find(a => a.id === preselectedAgentId);
      if (match) setSelectedAgent(match);
    }
  }, [preselectedAgentId, liveAgents]);

  // ── DYNAMIC AGENT FILTERING ──
  const selected = selectedSubItem || wasteType;
  const [selectedCompanyId, setSelectedCompanyId] = useState(preselectedAgentId);

  // ── PROXIMITY UTILITY ──
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const filteredAgents = liveAgents.filter(agent => {
    // 0. GPS & Distance Filter (Prevent "Far Away" Agents)
    let lat = agent.location?.latitude;
    let lon = agent.location?.longitude;

    if (!lat || !lon) {
      if (agent.companyId) {
        const company = liveAgents.find(a => a.id === agent.companyId);
        if (company?.location?.latitude && company?.location?.longitude) {
          lat = company.location.latitude;
          lon = company.location.longitude;
          // Mutate agent location for map plotting with a tiny visual offset so they don't completely overlap
          agent.location = {
            ...agent.location,
            latitude: lat + (Math.random() - 0.5) * 0.003,
            longitude: lon + (Math.random() - 0.5) * 0.003
          };
        }
      }
    }

    const hasValidGPS = lat && lon;
    if (!hasValidGPS) return false;

    const distance = getDistance(
      customLocation.latitude, customLocation.longitude,
      lat, lon
    );

    // Only show agents within 20km (Standard Logistics Range)
    if (distance > 20) return false;

    const isFleetDriver = agent.agentAccountType === 'fleet_driver';
    const isCompany = agent.agentAccountType === 'company_admin';
    const isIndependent = agent.agentAccountType === 'independent';

    // 1. Hierarchy Check
    let isHierarchyMatch = false;
    if (isCompany || isIndependent) isHierarchyMatch = true;
    if (isFleetDriver && agent.companyId === selectedCompanyId) isHierarchyMatch = true;

    if (!isHierarchyMatch) return false;

    // 2. Material filter (Dynamic Fleet Inheritance)
    let configToUse = agent.config;

    // If it's a fleet driver, dynamically grab the company owner's live config!
    if (isFleetDriver && agent.companyId) {
      const company = liveAgents.find(a => a.id === agent.companyId);
      if (company) {
        configToUse = company.config;
      }
    }

    const config = Array.isArray(configToUse) ? configToUse[0] : configToUse;
    if (!config || !config.accepted_materials || config.accepted_materials.length === 0) return true;
    return config.accepted_materials.includes(selected?.slug || '');
  });

  // ── PRICING (Powered by Market Hub & Agent Overrides) ──
  // If the user targets a Fleet Driver, dynamically fetch the Company Admin's pricing rules
  let rawSelectedConfig = selectedAgent?.config;
  if (selectedAgent?.agentAccountType === 'fleet_driver' && selectedAgent?.companyId) {
    const company = liveAgents.find(a => a.id === selectedAgent.companyId);
    if (company) {
      rawSelectedConfig = company.config;
    }
  }

  const selectedConfig = Array.isArray(rawSelectedConfig) ? rawSelectedConfig[0] : rawSelectedConfig;
  const customRate = selectedConfig?.custom_rates?.[selected?.slug || selected?.id];
  const activeRate = customRate !== undefined ? Number(customRate) : (selected?.price_per_unit || 0);
  const processingFee = activeRate * quantity;

  // Aggregator Logic: Logistics Fee is 0 by default (paid to partners)
  const baseLogisticsFee = 0;
  const logisticsFee = selectedConfig?.base_logistics_fee !== undefined
    ? Number(selectedConfig.base_logistics_fee)
    : baseLogisticsFee;

  // ── PLATFORM FEE (Goes to Klinflow) ──
  const userTier = profile?.subscription_tier || profile?.subscriptionTier || 'lite';
  const isSubscriber = userTier !== 'lite';
  const platformFee = 0; // Completely removed platform fee


  // Aggregator Logic: No platform-wide minimum (minimums are agent-specific)
  const minPickupFee = 0;

  const baseTotal = processingFee;
  const finalPrice = baseTotal; // Simplified: Pure material value

  // Unified Oracle Match: Using IDs for 100% accuracy
  const liveRatePerKg = usePriceStore.getState().getCategoryPrice(selected?.id || wasteType?.id || '');

  // XP Boost Logic (Based on new tier benefits)
  const xpMultiplier = userTier === 'standard' ? 2 : userTier === 'premium' ? 3.5 : 1;
  const estimatedGFP = Math.floor(quantity * 2 * xpMultiplier);

  const handleBook = async () => {
    setIsSubmitting(true);
    try {
      let photoUrl = null;
      if (photo && typeof photo !== 'string') {
        const compressed = await compressImage(photo, { maxWidth: 1024, quality: 0.7 });
        photoUrl = await uploadFile('pickups', compressed, profile?.id);
      }
      const timeString = isManualTime ? `${customDate} @ ${customTime}` : ((selectedTime as any)?.time || 'ASAP');

      const bookingData = {
        wasteType: selected.slug || selected.id,
        weight: quantity,
        estate: customLocation.estate,
        latitude: customLocation.latitude,
        longitude: customLocation.longitude,
        time: timeString,
        amount: 0,
        totalPrice: finalPrice,
        photoUrl: photoUrl || (rescheduleId ? bookings.find(b => b.id === rescheduleId)?.photoUrl : null),
        agentId: selectedAgent?.id || null,
        notes: customDescription || '',
        bookingType: selectedTime?.type || 'any',
      };

      if (rescheduleId) {
        // Update existing booking
        const { rescheduleBooking } = useBookingStore.getState();
        await rescheduleBooking(rescheduleId, customDate, timeString, bookingData);
      } else {
        // Create new booking
        await createBooking(bookingData);
      }


      // Instantly notify the specific agent (or all available agents if none selected)
      await useNotificationStore.getState().addNotification(
        "New Dispatch Mission! 🚛",
        `A pickup request for ${quantity}kg of ${selected.label || (selected.slug || selected.id)} is available in ${customLocation.estate || 'your area'}.`,
        'info', // type
        'agent', // target role
        selectedAgent?.id || null, // targeted agent if manually selected
        { wasteType: selected.slug || selected.id } // metadata for client-side filtering
      );

      setShowEscrowModal(false);
      toast.success("Pickup Requested!");
      navigate('/my-bookings');
    } catch (err) {
      console.error('Booking error:', err);
      toast.error("Booking Failed", { description: err instanceof Error ? err.message : 'An unknown error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const center = [customLocation.latitude || -1.2635, customLocation.longitude || 36.8048];

  return (
    <div className="space-y-6 pb-12">

      {/* ── HEADER (FIXED TOP NAV) ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-3 px-5 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-900/70">
        <div className="flex items-center justify-between">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/')} className="p-2.5 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </button>
          <div className="flex flex-col items-end">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white capitalize tracking-tighter italic leading-none">Step {step} <span className="text-slate-300 dark:text-slate-700 not-italic">/</span> 3</h1>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map(i => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'w-2 bg-slate-100 dark:bg-slate-800'}`} />))}
            </div>
          </div>
        </div>
      </div>

      <div className="px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+2rem)]">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <BookPickupMaterialStep
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              wasteType={wasteType}
              setWasteType={setWasteType}
              selectedSubItem={selectedSubItem}
              setSelectedSubItem={setSelectedSubItem}
              quantity={quantity}
              setQuantity={setQuantity}
              photo={photo}
              setPhoto={setPhoto}
              customDescription={customDescription}
              setCustomDescription={setCustomDescription}
              categories={categories}
              isLoading={isLoading}
            />
          )}

          {step === 2 && (
            <BookPickupAgentStep
              center={center as [number, number]}
              userIcon={userIcon}
              filteredAgents={filteredAgents}
              liveAgents={liveAgents}
              selectedAgent={selectedAgent}
              setSelectedAgent={setSelectedAgent}
              selectedCompanyId={selectedCompanyId}
              setSelectedCompanyId={setSelectedCompanyId}
              agentIcon={agentIcon}
              aiSuggestions={aiSuggestions}
              selectedTime={selectedTime}
              selectTime={selectTime}
              isManualTime={isManualTime}
              setIsManualTime={setIsManualTime}
              customDate={customDate}
              setCustomDate={setCustomDate}
              customTime={customTime}
              setCustomTime={setCustomTime}
            />
          )}

          {step === 3 && (
            <BookPickupSummaryStep
              selected={selected}
              quantity={quantity}
              activeRate={activeRate}
              xpMultiplier={xpMultiplier}
              estimatedGFP={estimatedGFP}
              selectedAgent={selectedAgent}
              selectedCompanyId={selectedCompanyId}
            />
          )}
        </AnimatePresence>

        {/* ── INLINE ACTION BUTTON ── */}
        <div className="mt-8">
          <button
            disabled={isSubmitting || (step === 1 && !wasteType) || (step === 2 && !selectedTime && !isManualTime)}
            onClick={() => step < 3 ? setStep(step + 1) : setShowEscrowModal(true)}
            className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm  active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
          >
            <span>{step === 3 ? 'CONFIRM BOOKING' : 'CONTINUE'}</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── BOOKING CONFIRMATION MODAL ── */}
      <BookPickupConfirmModal
        showEscrowModal={showEscrowModal}
        setShowEscrowModal={setShowEscrowModal}
        isSubmitting={isSubmitting}
        handleBook={handleBook}
        preselectedCompanyName={preselectedCompanyName}
      />

    </div>
  );
}
