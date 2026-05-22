/**
 * Post Trade Page — 4-Step Marketplace Flow
 */
import { useState, useEffect } from 'react';
import {
  Sparkles, Clock, Mic, Camera, Check, ChevronRight,
  ArrowLeft, MapPin, Edit2, Scale, Calendar, Info,
  ShoppingBag, Trash2, Wallet, Zap, Star, Plus,
  ArrowUpRight, Info as InfoIcon, Truck, ShieldCheck, Smartphone,
  User, Home, Lock, Shield, CheckCircle2, AlertCircle, TrendingUp,
  Hammer, FileText, GlassWater, Bell, Recycle, X, Search
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { useMarketplaceStore } from '@klinflow/core/stores/marketplaceStore';
import { uploadFile } from '@klinflow/core/lib/storage';
import { MATERIAL_TYPES } from '@klinflow/core/stores/assetStore';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';


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

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}

export default function PostTrade() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const userId = useAuthStore(s => s.userId);
  const selectedTime = useBookingStore(s => s.selectedTime);
  const selectTime = useBookingStore(s => s.selectTime);
  const createBooking = useBookingStore(s => s.createBooking);
  const liveAgents = useBookingStore(s => s.liveAgents);
  const fetchNearbyAgents = useBookingStore(s => s.fetchNearbyAgents);
  const subscribeToAgents = useBookingStore(s => s.subscribeToAgents);
  const cleanupAgents = useBookingStore(s => s.cleanupAgents);
  const liveWeavers: any[] = []; // Placeholder until weaver store is built
  const categories = useServiceStore(s => s.categories);
  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const prices = usePriceStore(s => s.prices);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const getPriceForMaterial = usePriceStore(s => s.getPriceForMaterial);
  const fetchConfig = useSystemStore(s => s.fetchConfig);
  const getConfigValue = useSystemStore(s => s.getConfigValue);

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteType, setWasteType] = useState<any>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<any>(null);
  const [quantity, setQuantity] = useState<any>(1);
  const [customLocation, setCustomLocation] = useState(profile?.location || { estate: 'Westlands', latitude: -1.2635, longitude: 36.8048 });
  const [photos, setPhotos] = useState<any[]>([]); // Array of up to 4 photos
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);

  // New: Hybrid Model State
  const [pickupMode, setPickupMode] = useState('pickup'); // 'pickup' | 'dropoff'
  const [selectedHub, setSelectedHub] = useState<any>(null);
  const [drillDownCompany, setDrillDownCompany] = useState<any>(null); // Tracking company drill-down

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

  const weaverIcon = L.divIcon({
    className: 'custom-weaver-icon',
    html: `<div class="w-8 h-8 rounded-xl bg-indigo-600 border-2 border-white shadow-xl flex items-center justify-center"><span class="text-xs">🏪</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  const [isManualTime, setIsManualTime] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [customTime, setCustomTime] = useState('09:00');
  const [paymentNumber, setPaymentNumber] = useState(profile?.phone || '');
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
  const estimatedGFP = Math.floor(quantity * 5 * xpMultiplier);
  const hubBonus = pickupMode === 'dropoff' ? 20 : 0; // Extra KSh for dropping off
  const askingPrice = customPricePerKg !== null ? customPricePerKg : liveRatePerKg;
  const assetValue = Math.round(quantity * (askingPrice + hubBonus));
  const netCost = Math.max(0, finalPrice - assetValue);

  const { createListing } = useMarketplaceStore();

  const handleBook = async () => {
    let uploadToastId = null;
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
          return supabase.storage.from('pickups').getPublicUrl(data.path).data.publicUrl;
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
    <div className="flex flex-col min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-800 max-w-lg mx-auto">
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

      <div className="flex-1 space-y-0 pb-2 pt-[calc(env(safe-area-inset-top,1rem)+5rem)] relative max-w-lg mx-auto w-full px-5">
        <AnimatePresence mode="wait">

          {/* ── STEP 1: MATERIAL & WEIGHT ── */}
          {step === 1 && (
            <motion.div key="p1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="space-y-1">

                <p className="text-sm font-medium text-slate-500 leading-tight">What asset are you looking to trade today?</p>
              </div>

              <div className="space-y-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search waste categories (e.g. plastic, metal)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 p-4 pl-11 pr-10 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-semibold dark:text-white outline-none focus:border-emerald-500/50 focus:ring-2 ring-emerald-500/20 transition-all shadow-sm"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
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

                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Select Material Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {categories.filter(cat =>
                    (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((cat) => {
                    const isSelected = wasteType?.id === cat.id;
                    const imageMap = {
                      'paper': '/material-categories/boxes.webp',
                      'plastic': '/material-categories/plastic.webp',
                      'ewaste': '/material-categories/E-waste.webp',
                      'metal': '/material-categories/metal.webp',
                      'organic': '/material-categories/organic-waste.webp',
                      'general': '/material-categories/general-waste.webp',
                      'recyclable': '/material-categories/recyclables.webp',
                      'glass': '/material-categories/glasses.webp',
                      'appliances': '/material-categories/bulky-item.webp',
                      'bulky': '/material-categories/bulky-sofas.webp',
                    };
                    const bgImage = (imageMap as any)[cat.slug || cat.id];

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setWasteType(cat);
                          setSelectedSubItem({
                            id: `cat-${cat.id}`,
                            label: cat.label,
                            price_per_unit: getPriceForMaterial(cat.id),
                            unit: 'kg',
                            slug: cat.slug || cat.id
                          });
                        }}
                        className={`relative h-32 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group overflow-hidden border-2 ${isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'border-slate-100 dark:border-slate-800 hover:border-emerald-500/40'
                          }`}
                        style={bgImage ? {
                          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0.6)), url(${bgImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {!bgImage && <div className={`absolute inset-0 ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-slate-100 dark:bg-slate-800'}`} />}
                        {!bgImage && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-bl-3xl -mr-4 -mt-4 group-hover:bg-emerald-500/10 transition-colors z-0" />}

                        <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${bgImage ? 'bg-white/10 backdrop-blur-md' : (isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-50 dark:bg-slate-800/50')
                          }`}>
                          {cat.icon || '📦'}
                        </div>
                        <span className={`relative z-10 text-xs font-black capitalize tracking-widest text-center leading-none italic ${bgImage ? 'text-white' : (isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')
                          }`}>
                          {cat.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {categories.filter(cat =>
                  (cat.label || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (cat.slug || '').toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                    <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500">No categories found matching "{searchQuery}"</p>
                    </div>
                  )}
              </div>

              <div className="space-y-3 pb-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Est. Weight (KG)</h3>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">{quantity} KG</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-900 p-4 rounded-[1.25rem] space-y-4">
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="0.5"
                    value={quantity || 1}
                    onChange={(e) => setQuantity(parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="relative group">
                    <input
                      type="number"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="12.5"
                      className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-base font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all text-center"
                    />
                  </div>
                </div>
              </div>


            </motion.div>
          )}

          {/* ── STEP 2: VALUATION & PROOF ── */}
          {step === 2 && (
            <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 pb-12">
              <div className="space-y-1">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Valuation</h2>
                <p className="text-sm font-medium text-slate-500 leading-tight">Provide proof and set your asking price.</p>
              </div>

              {/* PHOTO CAPTURE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize">Visual Proof <span className="text-xs text-slate-400 ml-1">({photos.length}/4)</span></h3>
                  {photos.length > 0 && (
                    <button onClick={() => setPhotos([])} className="text-xs font-semibold text-rose-500 capitalize tracking-widest">Clear All</button>
                  )}
                </div>

                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from((e.target as HTMLInputElement).files || []);
                    if (files.length > 0) {
                      const newPhotos = [...photos, ...files].slice(0, 4);
                      setPhotos(newPhotos);
                      toast.success(`${newPhotos.length} Photo${newPhotos.length > 1 ? 's' : ''} Uploaded!`);
                    }
                  }}
                />

                {photos.length === 0 ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0] || null;
                          if (file) setPhotos(prev => [...prev, file].slice(0, 4));
                        };
                        input.click();
                      }}
                      className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-800 shadow-sm"
                    >
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Camera</p>
                    </button>

                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.multiple = true;
                        input.onchange = (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          setPhotos(prev => [...prev, ...files].slice(0, 4));
                        };
                        input.click();
                      }}
                      className="flex-1 h-24 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-800 shadow-sm"
                    >
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest">Gallery</p>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((p, idx) => (
                      <div key={idx} className="relative h-32 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm group">
                        <img
                          src={typeof p === 'string' ? p : URL.createObjectURL(p)}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {photos.length < 4 && (
                      <button
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-800"
                      >
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <Camera className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Add Angle</p>
                      </button>
                    )}
                  </div>
                )}

                {photos.length === 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-relaxed">
                      Take multiple images! Clear photos help buyers verify quality instantly and approve your asking price faster.
                    </p>
                  </div>
                )}
              </div>

              {/* ASKING PRICE */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Set Your Asking Price</h3>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-500 capitalize tracking-widest">Market: KSh {liveRatePerKg}</span>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">KSh</div>
                  <input
                    type="number"
                    value={customPricePerKg !== null ? customPricePerKg : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomPricePerKg(val === '' ? null : parseFloat(val));
                    }}
                    placeholder={String(liveRatePerKg)}
                    className="w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 p-5 rounded-2xl text-lg font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all px-16 text-center"
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">/ KG</div>
                </div>
              </div>

              {/* MATERIAL DESCRIPTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize tracking-widest">Material Description</h3>
                  <span className="text-xs font-semibold text-slate-400">Optional</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm group">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-slate-400 mt-1" />
                    <textarea
                      rows={2}
                      value={customDescription}
                      onChange={(e) => setCustomDescription(e.target.value)}
                      placeholder="Tell the buyer and agent more about the quality or collection specifics..."
                      className="w-full bg-transparent text-sm font-semibold text-slate-700 dark:text-white outline-none placeholder:text-slate-300 resize-none"
                    />
                  </div>
                </div>
              </div>




            </motion.div>
          )}

          {/* ── STEP 3: COLLECTION METHOD ── */}
          {step === 3 && (
            <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
              <div className="space-y-1">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Collection Method</h2>
                <p className="text-sm font-medium text-slate-500 leading-tight">How would you like to get your materials to us?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPickupMode('pickup')}
                  className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'pickup' ? 'border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-500/5' : 'border-slate-200 bg-white'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Truck className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold leading-tight ${pickupMode === 'pickup' ? 'text-emerald-600' : 'text-slate-900'}`}>Dispatch Agent</p>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">We come to you</p>
                  </div>
                </button>

                <button
                  onClick={() => setPickupMode('dropoff')}
                  className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'dropoff' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-white'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'dropoff' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-bold leading-tight ${pickupMode === 'dropoff' ? 'text-emerald-600' : 'text-slate-900'}`}>Self Drop-off</p>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">Bring to a Hub</p>
                  </div>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize tracking-widest">Market Demand</h3>
                    {drillDownCompany && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <button onClick={() => setDrillDownCompany(null)} className="text-xs font-bold text-indigo-600 capitalize hover:underline">All Agents</button>
                        <span className="text-xs text-slate-400">/</span>
                        <span className="text-xs font-bold text-slate-500 capitalize">{drillDownCompany.companyName || drillDownCompany.name}</span>
                      </div>
                    )}
                  </div>
                  {liveWeavers?.length > 0 && (
                    <div className="flex items-center gap-1.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span className="text-xs font-semibold text-indigo-600 capitalize tracking-widest">{liveWeavers.length} Collectors Nearby</span>
                    </div>
                  )}
                </div>
                <div className="h-64 -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group">
                  <MapContainer center={center as [number, number]} zoom={13} zoomControl={false} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ChangeView center={center as [number, number]} />
                    <Marker position={center as [number, number]} {...({ icon: userIcon } as any)} />

                    {pickupMode === 'dropoff' ? (
                      nearbyHubs.map((hub: any) => (
                        <Marker key={hub.id} position={[hub.hubLocation.lat, hub.hubLocation.lng]} {...({ icon: hubIcon } as any)} eventHandlers={{ click: () => { setSelectedHub(hub); toast.success(`${hub.name || hub.companyName} Selected`); } }}>
                          {/* @ts-ignore */}
                          <Popup className="compact-popup">
                            <div className="p-3 text-center">
                              <h4 className="text-xs font-semibold text-slate-900">{hub.name || hub.companyName}</h4>
                              <p className="text-xs text-slate-500 mt-1 capitalize tracking-widest">{hub.hubAddress}</p>
                              <p className="text-xs font-semibold text-emerald-500 mt-1">{hub.distance.toFixed(1)}km away</p>
                            </div>
                          </Popup>
                        </Marker>
                      ))
                    ) : (
                      <>
                        {/* Drill-down View Logic */}
                        {drillDownCompany ? (
                          // Show only agents belonging to this company
                          liveAgents.filter((a: any) => a.companyId === drillDownCompany.id && !a.isHubActive).map((agent: any) => (
                            <Marker key={agent.id} position={[agent.location?.latitude || center[0], agent.location?.longitude || center[1]]} {...({ icon: agentIcon(selectedAgent?.id === agent.id) } as any)} eventHandlers={{ click: () => { setSelectedAgent(agent); toast.success(`Fleet Agent Targeted`); } }}>
                              <Popup className="compact-popup"><div className="p-1 px-2 min-w-[80px] text-center"><h4 className="text-xs font-semibold text-slate-900 leading-tight">{agent.name || 'Agent'}</h4><div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 capitalize"><Star className="w-2 h-2 fill-emerald-500" /><span>4.9</span></div></div></Popup>
                            </Marker>
                          ))
                        ) : (
                          <>
                            {/* Initial View: Independent Agents & Company Markers */}
                            {liveAgents.filter(a => !a.isHubActive).reduce((acc, agent) => {
                              if (agent.agentAccountType === 'company_admin' || (agent.role === 'agent' && !agent.companyId)) {
                                acc.push(agent);
                              }
                              return acc;
                            }, [] as any[]).map(entity => {
                              const isCompany = entity.agentAccountType === 'company_admin';
                              return (
                                <Marker
                                  key={entity.id}
                                  position={[entity.location?.latitude || center[0], entity.location?.longitude || center[1]]}
                                  {...({ icon: isCompany ? companyIcon(drillDownCompany?.id === entity.id) : agentIcon(selectedAgent?.id === entity.id) } as any)}
                                  eventHandlers={{
                                    click: () => {
                                      if (isCompany) {
                                        setDrillDownCompany(entity);
                                        toast(`Showing ${entity.companyName || entity.name}'s Fleet`, { icon: '🏢' });
                                      } else {
                                        setSelectedAgent(entity);
                                        toast.success(`Independent Agent Targeted`);
                                      }
                                    }
                                  }}
                                >
                                  {/* @ts-ignore */}
                                  <Popup className="compact-popup">
                                    <div className="p-1 px-2 min-w-[80px] text-center">
                                      <h4 className="text-xs font-semibold text-slate-900 leading-tight">{isCompany ? (entity.companyName || entity.name) : (entity.name || 'Agent')}</h4>
                                      <div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 capitalize">
                                        {isCompany ? <span>VIEW FLEET</span> : <><Star className="w-2 h-2 fill-emerald-500" /><span>4.9</span></>}
                                      </div>
                                    </div>
                                  </Popup>
                                </Marker>
                              );
                            })}
                          </>
                        )}

                        {liveWeavers?.map(weaver => (
                          <Marker key={weaver.id} position={[weaver.location?.latitude || (center[0] + 0.005), weaver.location?.longitude || (center[1] + 0.005)] as [number, number]} {...({ icon: weaverIcon } as any)}>
                            {/* @ts-ignore */}
                            <Popup className="compact-popup">
                              <div className="p-2 text-center">
                                <h4 className="text-xs font-semibold text-indigo-600 capitalize tracking-tight">{weaver.businessName || 'Collector'}</h4>
                                <p className="text-xs font-semibold text-slate-400 mt-0.5">READY TO BUY</p>
                              </div>
                            </Popup>
                          </Marker>
                        ))}
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>

              {pickupMode === 'dropoff' ? (
                <div className="space-y-3">
                  {selectedHub ? (
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                      <div className="w-14 h-14 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg"><Check className="w-8 h-8" /></div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold dark:text-white">{selectedHub.name || selectedHub.companyName}</h3>
                        <p className="text-xs font-semibold text-emerald-600 capitalize tracking-widest mt-1">Drop-off: {selectedHub.hubAddress} ({selectedHub.distance.toFixed(1)}km)🏢</p>
                      </div>
                      <button onClick={() => setSelectedHub(null)} className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs">Change</button>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-2xl text-center bg-emerald-50/10">
                      <MapPin className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-bounce-slow" />
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Select the nearest Hub on the map</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* SELECTED AGENT CARD (with deselect) */}
                  {selectedAgent ? (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg text-lg">🚛</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedAgent.name || 'Agent'}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 capitalize">
                            <Star className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                            <span>4.9</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Targeted</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedAgent(null); toast('Agent deselected', { icon: '🔄' }); }}
                        className="p-2 px-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs capitalize tracking-widest active:scale-95 transition-all"
                      >
                        Change
                      </button>
                    </motion.div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/50">
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Tap an agent on the map to target (optional)</p>
                    </div>
                  )}

                  {/* ASAP BUTTON */}
                  <button
                    onClick={() => { selectTime({ time: 'ASAP', type: 'any', discount: 0, label: 'Agents available' }); setIsManualTime(false); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-emerald-600 border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-emerald-600/10'}`}>
                      <Zap className={`w-5 h-5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                      <p className={`text-[10px] font-bold mt-0.5 leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-400'}`}>First available agent</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'border-white bg-white' : 'border-slate-200'}`}>
                      {!isManualTime && (selectedTime as any)?.time === 'ASAP' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
                    </div>
                  </button>

                  {/* SCHEDULE LATER */}
                  <button
                    onClick={() => setIsManualTime(true)}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${isManualTime ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 shadow-xl' : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-white/10'}`}
                  >
                    <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 ${isManualTime ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                      <Clock className={`w-5 h-5 ${isManualTime ? 'text-emerald-600' : 'text-slate-400'}`} />
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
              )}

              {isManualTime && pickupMode === 'pickup' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
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

          {/* ── STEP 4: POST SUMMARY ── */}
          {step === 4 && (
            <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
              <div className="space-y-1">
                <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Post Summary</h2>
                <p className="text-sm font-medium text-slate-500 leading-tight">Review your trade details before confirming.</p>
              </div>

              {/* ── MATERIAL PREVIEW ── */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                  {wasteType?.icon || '📦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{wasteType?.label}</h3>
                  <p className="text-xs font-semibold text-emerald-600 capitalize tracking-widest mt-1">{quantity} KG Stock</p>
                </div>
              </div>

              {/* ── LOGISTICS SUMMARY (CONTEXTUAL) ── */}
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {pickupMode === 'pickup' ? <Truck className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Collection Method</p>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{pickupMode === 'pickup' ? 'Agent Dispatch' : 'Self Drop-off'}</h4>
                  </div>
                </div>

                {pickupMode === 'pickup' ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 capitalize">Target Address</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{profile?.location?.estate || 'My Location'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 capitalize">Pickup Time</span>
                      <span className="text-xs font-semibold text-emerald-600">{isManualTime ? `${customDate} @ ${customTime}` : 'ASAP (4-12 mins)'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 capitalize">Drop-off Hub</span>
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedHub?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-slate-400 capitalize">Hub Address</span>
                      <span className="text-xs font-semibold text-slate-500">{selectedHub?.address}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── FINANCIAL BREAKDOWN ── */}
              <div className="bg-emerald-600 dark:bg-emerald-700 rounded-[2rem] p-8 relative overflow-hidden shadow-2xl border border-white/20">
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-white/20 rounded-full blur-3xl" />
                <div className="relative z-10 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-white">
                      <span className="text-[10px] font-black capitalize tracking-widest">Gross Value</span>
                      <span className="text-sm font-bold">KSh {assetValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-white/90">
                      <span className="text-[10px] font-black capitalize tracking-widest">Logistics Fee</span>
                      <span className="text-sm font-bold">- KSh {pickupMode === 'pickup' ? logisticsFee : 0}</span>
                    </div>
                    <div className="pt-4 border-t border-white/20 flex justify-between items-center">
                      <span className="text-[10px] font-black text-white capitalize tracking-widest">EST. REVENUE</span>
                      <div className="text-right">
                        <h3 className="text-3xl font-black text-white tracking-tighter">KSh {(assetValue - (pickupMode === 'pickup' ? logisticsFee : 0)).toLocaleString()}</h3>
                        <p className="text-[10px] font-bold text-white/95 capitalize tracking-widest mt-1.5 flex items-center justify-end gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          PAYOUT: AWAITING VERIFICATION
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
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
              className="w-full p-5 bg-emerald-700 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30"
            >
              <span>CONTINUE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={() => initialMode === 'sell' ? handleBook() : setShowEscrowModal(true)}
              className="w-full p-5 bg-emerald-700 text-white rounded-2xl font-semibold text-sm shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3"
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
                  className={`w-full p-5 ${pickupMode === 'pickup' ? 'bg-emerald-600 shadow-emerald-600/30' : 'bg-slate-900 shadow-slate-900/30'} text-white rounded-2xl font-semibold text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3`}
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
