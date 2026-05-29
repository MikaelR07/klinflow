/**
 * Book Pickup Page — 3-Page Progressive Flow
 */
import { useState, useEffect } from 'react';
import {
  Sparkles, Clock, Mic, Camera, Check, ChevronRight,
  ArrowLeft, MapPin, Edit2, Scale, Calendar, Info,
  ShoppingBag, Trash2, Wallet, Zap, Star, Plus,
  ArrowUpRight, Info as InfoIcon, Truck, ShieldCheck, Smartphone,
  User, Home, Lock, Shield, CheckCircle2, AlertCircle, TrendingUp, X, Search
} from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
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
import { OptimizedImage } from '@klinflow/ui';
import { uploadFile } from '@klinflow/core/lib/storage';
import { MATERIAL_TYPES } from '@klinflow/core/stores/assetStore';
import { compressImage } from '@klinflow/core/utils/imageUtils';

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

      <div className="px-5 pt-[calc(env(safe-area-inset-top,1rem)+2rem)]">
        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div key="p1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="space-y-2.5">
                {!wasteType ? (
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight italic ml-1">What are we picking up today?</h3>

                    {categories.length === 0 && isLoading ? (
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 animate-pulse flex flex-col items-center justify-center gap-3">
                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800/80 rounded-xl" />
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/80 rounded-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* Premium Category Search Input */}
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Search waste categories (e.g. plastic, metal)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 p-4 pl-11 pr-10 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold dark:text-white outline-none focus:border-primary/50 focus:ring-2 ring-primary/20 transition-all shadow-sm"
                          />
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                            <Search className="w-4 h-4" />
                          </div>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery('')}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {categories.filter(cat =>
                            (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).sort((a, b) => {
                            const aSlug = (a.slug || a.id || '').toLowerCase();
                            const bSlug = (b.slug || b.id || '').toLowerCase();
                            const aLabel = (a.label || '').toLowerCase();
                            const bLabel = (b.label || '').toLowerCase();

                            const isABulky = aSlug.includes('bulky') || aSlug.includes('appliance') || aLabel.includes('bulky') || aLabel.includes('appliance');
                            const isBBulky = bSlug.includes('bulky') || bSlug.includes('appliance') || bLabel.includes('bulky') || bLabel.includes('appliance');

                            if (isABulky && !isBBulky) return 1;
                            if (!isABulky && isBBulky) return -1;
                            return 0;
                          }).map((cat) => {
                            const identifier = ((cat as any).slug || (cat as any).id || '').toLowerCase();
                            let bgImage = (cat as any).image_url;
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
                                onClick={() => {
                                  setWasteType(cat);
                                  setSelectedSubItem({
                                    id: `cat-${cat.id}`,
                                    label: `${cat.label} (Mixed)`,
                                    price_per_unit: usePriceStore.getState().getCategoryPrice(cat.id) || 0,
                                    unit: 'kg',
                                    slug: cat.slug || cat.id
                                  });
                                }}
                                className="relative h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-md group hover:border-primary/40 overflow-hidden"
                                style={bgImage ? {
                                  backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.8)), url(${bgImage})`,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center'
                                } : {}}
                              >
                                {!bgImage && <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-primary/10 transition-colors" />}
                                <div className={`w-10 h-10 ${bgImage ? 'bg-white/10 backdrop-blur-md' : 'bg-slate-50 dark:bg-slate-800/50'} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
                                  {cat.icon || '📦'}
                                </div>
                                <span className={`text-xs font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                  {cat.label}
                                </span>
                              </button>
                            );
                          })}

                          {categories.filter(cat =>
                            (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).length === 0 && (
                              <div className="col-span-2 py-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <Info className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                <p className="text-xs font-semibold text-slate-500">No categories found matching "{searchQuery}"</p>
                              </div>
                            )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[28px] border border-primary/20 relative shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xl text-white">{wasteType.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xs font-semibold dark:text-white leading-none">{wasteType.label}</h3>
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mt-1">Ready for pickup</p>
                    </div>
                    <button onClick={() => { setWasteType(null); setSelectedSubItem(null); setSearchQuery(''); }} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-primary capitalize tracking-widest">Change</button>
                  </div>
                )}
              </div>

              {wasteType && (
                <div className="space-y-3">
                  <h2 className="text-xs font-semibold capitalize tracking-widest text-slate-400 ml-2">Estimated Quantity</h2>
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quantity || 1}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center gap-4">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-xl font-semibold dark:text-white active:scale-95 transition-transform shrink-0">-</button>
                      <div className="flex-1 text-center relative group">
                        <input
                          type="number"
                          min="1"
                          value={quantity || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setQuantity(isNaN(val) ? '' : Math.max(1, val));
                          }}
                          onBlur={() => {
                            if (!quantity || quantity < 1) setQuantity(1);
                          }}
                          className="w-full bg-transparent text-3xl font-semibold text-slate-900 dark:text-white tracking-tighter text-center outline-none appearance-none"
                          style={{ MozAppearance: 'textfield' }} // Hide Firefox spinners
                        />
                        <p className="text-xs font-semibold capitalize tracking-widest text-primary mt-0.5">KG</p>
                      </div>
                      <button onClick={() => setQuantity((quantity || 0) + 1)} className="w-10 h-10 rounded-[14px] bg-primary flex items-center justify-center text-xl font-semibold text-white shadow-md active:scale-95 transition-transform shrink-0">+</button>
                    </div>
                  </div>
                </div>
              )}

              {wasteType && (
                <div className="space-y-4 pt-2 animate-slide-up">
                  <h2 className="text-xs font-semibold capitalize tracking-widest text-slate-400 ml-2">Recyclables Proof (Optional)</h2>

                  {/* Photo Capture */}
                  <div className="relative group">
                    {photo ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-primary shadow-xl">
                        <OptimizedImage
                          src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
                          className="w-full h-full object-cover"
                          wrapperClassName="w-full h-full"
                        />
                        <button
                          onClick={() => setPhoto(null)}
                          className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-xl shadow-lg active:scale-95 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center aspect-[1.5/1] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-1.5">
                            <Camera className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize tracking-widest italic">Take Photo</p>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            capture="environment"
                            onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                          />
                        </label>

                        <label className="flex-1 flex flex-col items-center justify-center aspect-[1.5/1] bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-1.5">
                            <Smartphone className="w-5 h-5 text-indigo-600" />
                          </div>
                          <p className="text-[10px] font-black text-slate-900 dark:text-white capitalize tracking-widest italic">From Gallery</p>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => setPhoto(e.target.files ? e.target.files[0] : null)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Item Description (Always Visible for Mission Context) */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Special Instructions</p>
                    <textarea
                      placeholder="e.g. 'Leave at the back gate'..."
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs font-semibold dark:text-white outline-none focus:border-primary/50 focus:ring-2 ring-primary/20 transition-all shadow-sm min-h-[80px] resize-none"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight italic leading-tight">
                      {selectedCompanyId ? `Fleet Dispatch` : 'Nearby\nPartners'}
                    </h2>
                    {selectedCompanyId && (
                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => setSelectedCompanyId(null)} className="text-xs font-semibold text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">Clear Selection ✕</button>
                      </div>
                    )}
                  </div>
                </div>

                {filteredAgents?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative shrink-0">
                      <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
                      <Zap className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold capitalize tracking-widest text-primary mb-0.5">Collectors Nearby</h4>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                        {filteredAgents.length} {filteredAgents.length === 1 ? 'collector' : 'collectors'} found in your area. ETA: ~{Math.max(4, 12 - filteredAgents.length * 2)} mins.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="h-64 -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group">
                  <MapContainer center={center as [number, number]} zoom={13} zoomControl={false} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={center as any} {...({ icon: userIcon } as any)} />

                    {filteredAgents.map(agent => {
                      const isCompany = agent.agentAccountType === 'company_admin';
                      const isSelected = selectedAgent?.id === agent.id || selectedCompanyId === agent.id;

                      return (
                        <Marker
                          key={agent.id}
                          position={[agent.location?.latitude || center[0], agent.location?.longitude || center[1]]}
                          {...({ icon: agentIcon(isSelected, isCompany) } as any)}
                          eventHandlers={{
                            click: () => {
                              if (isCompany) {
                                setSelectedCompanyId(agent.id);
                                toast.success(`Hub Selected`);
                              } else {
                                setSelectedAgent(agent);
                                toast.success(`Agent Targeted`);
                              }
                            }
                          }}
                        >
                          {/* @ts-ignore */}
                          <Popup maxWidth={160} className="compact-popup">
                            <div className="p-0.5 text-center leading-tight">
                              <h4 className="text-xs font-semibold text-slate-900 truncate">
                                {isCompany ? (agent.companyName || 'Fleet Hub') : agent.name || 'Agent'}
                              </h4>
                              <div className="flex items-center justify-center gap-0.5 text-xs font-semibold text-emerald-500 capitalize mt-0.5">
                                <Star className="w-2 h-2 fill-emerald-500" />
                                <span>{agent.rating?.toFixed(1) || '4.9'}</span>
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Active Selection Cards */}
                {(selectedAgent || selectedCompanyId) && (
                  <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-primary/20 shadow-xl mt-3 animate-slide-up">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                          {selectedCompanyId && !selectedAgent ? '🏢' : '🚛'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-primary capitalize tracking-widest leading-none">
                            {selectedCompanyId && !selectedAgent ? 'Fleet Hub Selected' : 'Targeting Agent'}
                          </p>
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                            {selectedAgent ? selectedAgent.name : (liveAgents.find(a => a.id === selectedCompanyId)?.companyName || 'Selected Hub')}
                          </h4>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedAgent(null);
                          setSelectedCompanyId(null);
                          toast.success("Selection Cleared");
                        }}
                        className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Fleet Drivers List for Selected Hub */}
                {selectedCompanyId && !selectedAgent && (
                  <div className="space-y-3 mt-4 animate-slide-up">
                    <h3 className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Available Fleet Agents</h3>
                    {liveAgents.filter(a => a.agentAccountType === 'fleet_driver' && a.companyId === selectedCompanyId).length > 0 ? (
                      <div className="space-y-2">
                        {liveAgents.filter(a => a.agentAccountType === 'fleet_driver' && a.companyId === selectedCompanyId).map(agent => (
                          <button
                            key={agent.id}
                            onClick={() => setSelectedAgent(agent)}
                            className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary transition-all active:scale-95 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Truck className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-semibold dark:text-white leading-none mb-1">{agent.name || 'Fleet Agent'}</p>
                                <p className="text-[10px] font-semibold capitalize tracking-widest text-slate-400">
                                  {agent.isOnline ? '🟢 Online' : '⚪ Offline'}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                        <p className="text-xs font-semibold text-slate-400">No agents currently available for this hub.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Preferred Agent Search */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm mt-3.5">
                  <h2 className="text-[10px] font-semibold capitalize tracking-widest text-slate-400 mb-2.5">Search by Name or Invite Code (Optional)</h2>
                  <input
                    type="text"
                    placeholder="e.g. Klinflow Hub, Agent John..."
                    className="w-full bg-slate-50 dark:bg-slate-900 py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold dark:text-white outline-none focus:border-primary/50 focus:ring-2 ring-primary/20 transition-all"
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      if (!query) return;
                      const match = liveAgents.find(a =>
                        a.name?.toLowerCase().includes(query) ||
                        a.companyName?.toLowerCase().includes(query) ||
                        a.fleetInviteCode?.toLowerCase() === query
                      );
                      if (match) {
                        if (match.agentAccountType === 'company_admin') {
                          setSelectedCompanyId(match.id);
                          setSelectedAgent(null);
                        } else {
                          setSelectedAgent(match);
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {aiSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {/* SMART ASAP BUTTON */}
                  <button
                    onClick={() => { selectTime({ time: 'ASAP', type: 'asap' }); setIsManualTime(false); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-primary border-primary ' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-primary/10'}`}>
                      <Zap className={`w-5 h-5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                      <p className={`text-[10px] font-bold mt-0.5 leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-400'}`}>
                        {(() => {
                          const hubs = filteredAgents.filter(a => a.agentAccountType === 'company_admin').length;
                          const agents = filteredAgents.filter(a => a.agentAccountType === 'independent' || a.agentAccountType === 'fleet_driver').length;

                          if (hubs > 0 && agents > 0) return `${hubs} Hubs & ${agents} Agents ready`;
                          if (hubs > 0) return `${hubs} Fleet Hubs available`;
                          if (agents > 0) return `${agents} Agents ready nearby`;
                          return 'No partners nearby';
                        })()}
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'border-white bg-white' : 'border-slate-200'}`}>
                      {!isManualTime && (selectedTime as any)?.time === 'ASAP' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                    </div>
                  </button>

                  {/* SCHEDULE LATER */}
                  <button
                    onClick={() => setIsManualTime(true)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${isManualTime ? 'bg-slate-800 dark:bg-slate-800 border-slate-600 shadow-xl' : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-white/10'}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isManualTime ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <Clock className={`w-5 h-5 ${isManualTime ? 'text-primary' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-[13px] font-semibold leading-tight ${isManualTime ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Schedule Later</p>
                      <p className={`text-[10px] font-bold mt-0.5 leading-tight ${isManualTime ? 'text-white/50' : 'text-slate-400'}`}>Pick a date & time</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isManualTime ? 'border-white bg-white' : 'border-slate-200'}`}>
                      {isManualTime && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
                    </div>
                  </button>
                </div>
              ) : (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-3xl border border-orange-100 dark:border-orange-900/30 text-center space-y-3">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center mx-auto text-orange-500"><AlertCircle className="w-6 h-6" /></div>
                  <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 capitalize tracking-widest">No Agents Online</h3>
                  <p className="text-[11px] font-semibold text-orange-700/70 dark:text-orange-400/70 leading-relaxed">All agents are currently offline. You can schedule a pickup for later!</p>
                  <button onClick={() => setIsManualTime(true)} className="px-6 py-3 bg-orange-500 text-white rounded-xl text-xs font-semibold capitalize tracking-widest shadow-lg shadow-orange-500/20">Schedule a Pickup</button>
                </div>
              )}

              {isManualTime && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Date</span>
                    <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Time</span>
                    <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight italic px-2">Marketplace Summary</h2>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-0">
                <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-4">Pickup Breakdown</p>

                {/* Material Info */}
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Recyclable Material</span>
                    <span className="text-xs text-slate-400">{selected?.label || 'Waste'}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary capitalize tracking-widest font-mono">{quantity} KG</span>
                </div>

                {/* Wallet Status */}
                <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Status</span>
                    <span className="text-xs text-slate-400">Via Klinflow Wallet</span>
                  </div>
                  <span className="text-xs font-semibold text-orange-500 capitalize tracking-widest">Verified Weight</span>
                </div>

                {/* Estimated Reward Display */}
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2 mb-4 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-primary capitalize tracking-widest leading-none">Environmental XP</span>
                      <span className="text-xs text-slate-400 mt-1">Tier Multiplier: {xpMultiplier}x</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-primary font-mono">{estimatedGFP} GFP</span>
                    </div>
                  </div>
                </div>

                {/* Note */}
                <div className="pt-4 flex gap-2">
                  <InfoIcon className="w-3 h-3 text-slate-400 shrink-0" />
                  <p className="text-xs font-medium text-slate-400 leading-tight italic">
                    Final KSh payout will be determined by the agent using digital scales upon arrival.
                  </p>
                </div>
              </div>

              <div className="p-8 rounded-3xl text-center relative overflow-hidden shadow-2xl transition-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mt-6">

                <div className="space-y-6">
                  <p className="text-xs font-semibold capitalize tracking-[0.3em] text-primary mb-4">Direct Verification</p>
                  <h3 className="text-3xl font-semibold tracking-tighter mt-1 italic text-slate-900 dark:text-white">Weight Verified Payout</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-4 leading-relaxed">
                    You will be paid instantly to your wallet based on the <span className="text-slate-900 dark:text-white">KSh {activeRate}/kg</span> {selectedAgent || selectedCompanyId ? 'rate offered by your selected partner' : 'standard market rate'}.
                  </p>
                </div>
              </div>
            </motion.div>
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
      <AnimatePresence>
        {showEscrowModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-28">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEscrowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[3rem] p-8 pb-10 shadow-2xl overflow-hidden">
              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center">
                  {preselectedCompanyName ? <span className="text-3xl">🏢</span> : <CheckCircle2 className="w-8 h-8 text-primary" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
                    {preselectedCompanyName ? `Book with ${preselectedCompanyName}` : 'Confirm Pickup Request'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {preselectedCompanyName
                      ? `Your request goes directly to ${preselectedCompanyName}. They will dispatch an agent to you.`
                      : 'An agent will be dispatched to your location to weigh and collect your items.'}
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleBook()}
                  className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <span className="animate-pulse tracking-widest">OPTIMIZING & DISPATCHING...</span> : <><span>DISPATCH AGENT NOW</span><Truck className="w-4 h-4" /></>}
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
