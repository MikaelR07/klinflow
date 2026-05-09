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
  Hammer, FileText, GlassWater, Bell, Recycle, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { toast } from 'sonner';

import { 
  useBookingStore, useAuthStore, useServiceStore, usePriceStore,
  useSystemStore, useNotificationStore, useMarketplaceStore, uploadFile, MATERIAL_TYPES, supabase, compressImage
} from '@cleanflow/core';

// ── COMPACT MAP ICONS ───────────────────────────────────────────

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center"><span class="text-xs">🏠</span></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const agentIcon = (isSelected) => L.divIcon({
  className: 'custom-agent-icon',
  html: `<div class="relative w-7 h-7 rounded-lg ${isSelected ? 'bg-emerald-600' : 'bg-emerald-500'} border-2 border-white shadow-xl flex items-center justify-center transition-all"><span class="text-xs">🚛</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const companyIcon = (isSelected) => L.divIcon({
  className: 'custom-company-icon',
  html: `<div class="relative w-8 h-8 rounded-xl ${isSelected ? 'bg-indigo-600' : 'bg-indigo-500'} border-2 border-white shadow-xl flex items-center justify-center transition-all scale-110"><span class="text-xs">🏢</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}

export default function PostTrade() {
  const navigate = useNavigate();
  const { profile, userId } = useAuthStore();
  const { 
    selectedTime, selectTime, createBooking, 
    liveAgents, fetchNearbyAgents, 
    subscribeToAgents, cleanupAgents
  } = useBookingStore();
  const liveWeavers = []; // Placeholder until weaver store is built
  const { categories, fetchCategories } = useServiceStore();
  const { prices, fetchPrices, getPriceForMaterial } = usePriceStore();
  const { fetchConfig, getConfigValue } = useSystemStore();

  const [step, setStep] = useState(1);
  const [wasteType, setWasteType] = useState(null);
  const [selectedSubItem, setSelectedSubItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customLocation, setCustomLocation] = useState(profile?.location || { estate: 'Westlands', latitude: -1.2635, longitude: 36.8048 });
  const [photos, setPhotos] = useState([]); // Array of up to 4 photos
  const [customDescription, setCustomDescription] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  
  // New: Hybrid Model State
  const [pickupMode, setPickupMode] = useState('pickup'); // 'pickup' | 'dropoff'
  const [selectedHub, setSelectedHub] = useState(null);
  const [drillDownCompany, setDrillDownCompany] = useState(null); // Tracking company drill-down
  
  const query = new URLSearchParams(useLocation().search);
  const initialMode = query.get('mode'); // 'service' | 'sell'

  const getDistance = (lat1, lon1, lat2, lon2) => {
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

  const center = [customLocation.latitude || -1.2635, customLocation.longitude || 36.8048];

  const nearbyHubs = liveAgents
    .filter(a => a.is_hub_active && a.hub_location?.lat)
    .map(hub => ({
      ...hub,
      distance: getDistance(center[0], center[1], hub.hub_location.lat, hub.hub_location.lng)
    }))
    .sort((a, b) => a.distance - b.distance);

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
  const [customPricePerKg, setCustomPricePerKg] = useState(null);

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
          slug: generalCat.id
        });
      }
    }

    return () => cleanupAgents();
  }, [initialMode, categories.length]);

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
  const xpMultiplier = profile?.subscription_tier === 'standard' ? 1.5 : profile?.subscription_tier === 'premium' ? 2 : 1;
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
      let photoUrls = [];
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
        location: pickupMode === 'dropoff' ? (selectedHub?.name || 'CleanFlow Hub') : customLocation.estate,
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
        null 
      );

      toast.success("Collection Posted! 📈");
      navigate('/my-trades');
    } catch (err) {
      console.error('Submission error:', err);
      toast.error("Posting Failed", { description: err.message });
    } finally {
      if (uploadToastId) toast.dismiss(uploadToastId);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F2F3F4] dark:bg-slate-900 overscroll-none px-2">
      
      {/* ── NAVIGATION HEADER ── */}
      <div className="px-1 pt-2 pb-2 flex items-center justify-between">
         <button 
           onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} 
           className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 active:scale-95 transition-all"
         >
           <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
         </button>
         <div className="flex flex-col items-end">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Step {step} of 4</span>
            <div className="flex gap-1 mt-1">
               {[1, 2, 3, 4].map(i => (<div key={i} className={`h-1 rounded-full transition-all ${i === step ? 'w-6 bg-emerald-600' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} />))}
            </div>
         </div>
      </div>

      <div className="px-0">
        <AnimatePresence mode="wait">
          
          {/* ── STEP 1: MATERIAL & WEIGHT ── */}
          {step === 1 && (
            <motion.div key="p1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
               <div className="space-y-1">
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">New Trade</h2>
                  <p className="text-sm font-medium text-slate-500 leading-tight">What asset are you looking to trade today?</p>
               </div>

               <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Select Material Type</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => {
                      const isSelected = wasteType?.id === cat.id;
                      const imageMap = {
                        'ewaste': '/placeholder-images/material-categories/optimized/E-waste.webp',
                        'metal': '/placeholder-images/material-categories/optimized/metal.webp',
                        'organic': '/placeholder-images/material-categories/optimized/organic-waste.webp',
                        'general': '/placeholder-images/material-categories/optimized/general-waste.webp',
                        'recyclable': '/placeholder-images/material-categories/optimized/plastic.webp',
                        'glass': '/placeholder-images/material-categories/optimized/glasses.webp',
                        'appliances': '/placeholder-images/material-categories/optimized/appliances.webp',
                        'bulky': '/placeholder-images/material-categories/optimized/bulky-item.webp',
                      };
                      const bgImage = imageMap[cat.slug || cat.id];

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
                              slug: cat.id
                            });
                          }}
                          className={`relative h-32 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all group overflow-hidden border-2 ${
                            isSelected 
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
                          
                          <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${
                            bgImage ? 'bg-white/10 backdrop-blur-md' : (isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-slate-50 dark:bg-slate-900/50')
                          }`}>
                            {cat.icon || '📦'}
                          </div>
                          <span className={`relative z-10 text-xs font-black uppercase tracking-widest text-center leading-none italic ${
                            bgImage ? 'text-white' : (isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white')
                          }`}>
                            {cat.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
               </div>

               <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Est. Weight (KG)</h3>
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold">{quantity} KG</div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-4 rounded-[1.25rem] space-y-4">
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
            <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
               <div className="space-y-1">
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Valuation</h2>
                  <p className="text-sm font-medium text-slate-500 leading-tight">Provide proof and set your asking price.</p>
               </div>

               {/* PHOTO CAPTURE */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight uppercase">Visual Proof <span className="text-xs text-slate-400 ml-1">({photos.length}/4)</span></h3>
                    {photos.length > 0 && (
                      <button onClick={() => setPhotos([])} className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Clear All</button>
                    )}
                  </div>
                  
                  <input 
                    type="file" 
                    id="photo-upload" 
                    accept="image/*" 
                    capture="environment"
                    multiple
                    className="hidden" 
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        const newPhotos = [...photos, ...files].slice(0, 4);
                        setPhotos(newPhotos);
                        toast.success(`${newPhotos.length} Photo${newPhotos.length > 1 ? 's' : ''} Staged! 📸`);
                      }
                    }} 
                  />

                  {photos.length === 0 ? (
                    <button 
                      onClick={() => document.getElementById('photo-upload').click()}
                      className="w-full h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tap to Add Photo</p>
                    </button>
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
                          onClick={() => document.getElementById('photo-upload').click()}
                          className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group bg-white dark:bg-slate-900"
                        >
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <Camera className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Add Angle</p>
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
                        Snap multiple angles! Clear photos help weavers verify quality instantly and approve your acquisition price without inspection.
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
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Market: KSh {liveRatePerKg}</span>
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
                        placeholder={liveRatePerKg}
                       className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-5 rounded-2xl text-lg font-semibold dark:text-white outline-none focus:border-emerald-500 transition-all px-16 text-center"
                     />
                     <div className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">/ KG</div>
                  </div>
               </div>

               {/* MATERIAL DESCRIPTION */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">Material Description</h3>
                     <span className="text-xs font-semibold text-slate-400">Optional</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm group">
                     <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-slate-400 mt-1" />
                        <textarea 
                          rows="2"
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          placeholder="Describe your material to buyer..."
                          className="w-full bg-transparent text-sm font-semibold text-slate-700 dark:text-white outline-none placeholder:text-slate-300 resize-none"
                        />
                     </div>
                  </div>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                    Tell the buyer and agent more about the quality or collection specifics.
                  </p>
               </div>

               {/* ESTIMATED VALUE CARD */}
               <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full" />
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-1">Your Est. Revenue</p>
                        <h3 className="text-3xl font-semibold text-white tracking-tighter">KSh {assetValue.toLocaleString()}</h3>
                     </div>
                     <div className="text-right">
                        <p className="text-xs font-semibold text-white/40 leading-none">Net Payout</p>
                        <p className="text-xs font-semibold text-emerald-400/70 uppercase tracking-widest mt-1">Pending Verification</p>
                     </div>
                  </div>
               </div>


            </motion.div>
          )}

          {/* ── STEP 3: COLLECTION METHOD ── */}
          {step === 3 && (
            <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Collection Method</h2>
                  <p className="text-sm font-medium text-slate-500 leading-tight">How would you like to get your materials to us?</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPickupMode('pickup')}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      pickupMode === 'pickup' ? 'border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-500/5' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${pickupMode === 'pickup' ? 'text-emerald-600' : 'text-slate-900'}`}>Dispatch Agent</p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">We come to you</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => setPickupMode('dropoff')}
                    className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                      pickupMode === 'dropoff' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center ${pickupMode === 'dropoff' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      <Home className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-semibold ${pickupMode === 'dropoff' ? 'text-emerald-600' : 'text-slate-900'}`}>Self Drop-off</p>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">Bring to a Hub</p>
                    </div>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight uppercase tracking-widest">Market Demand</h3>
                      {drillDownCompany && (
                        <div className="flex items-center gap-1 mt-0.5">
                           <button onClick={() => setDrillDownCompany(null)} className="text-xs font-bold text-indigo-600 uppercase hover:underline">All Agents</button>
                           <span className="text-xs text-slate-400">/</span>
                           <span className="text-xs font-bold text-slate-500 uppercase">{drillDownCompany.company_name || drillDownCompany.name}</span>
                        </div>
                      )}
                    </div>
                    {liveWeavers?.length > 0 && (
                      <div className="flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">{liveWeavers.length} Collectors Nearby</span>
                      </div>
                    )}
                  </div>
                  <div className="h-[200px] w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group">
                     <MapContainer center={center} zoom={13} zoomControl={false} className="h-full w-full z-0">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ChangeView center={center} />
                        <Marker position={center} icon={userIcon} />
                        
                        {pickupMode === 'dropoff' ? (
                          nearbyHubs.map(hub => (
                            <Marker key={hub.id} position={[hub.hub_location.lat, hub.hub_location.lng]} icon={hubIcon} eventHandlers={{ click: () => { setSelectedHub(hub); toast.success(`${hub.name || hub.company_name} Selected`, { icon: '🏢' }); }}}>
                               <Popup className="compact-popup">
                                 <div className="p-3 text-center">
                                   <h4 className="text-xs font-semibold text-slate-900">{hub.name || hub.company_name}</h4>
                                   <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{hub.hub_address}</p>
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
                              liveAgents.filter(a => a.company_id === drillDownCompany.id && !a.is_hub_active).map(agent => (
                                <Marker key={agent.id} position={[agent.location?.latitude || center[0], agent.location?.longitude || center[1]]} icon={agentIcon(selectedAgent?.id === agent.id)} eventHandlers={{ click: () => { setSelectedAgent(agent); toast.success(`Fleet Agent Targeted`, { icon: '🚛' }); }}}>
                                   <Popup className="compact-popup"><div className="p-1 px-2 min-w-[80px] text-center"><h4 className="text-xs font-semibold text-slate-900 leading-tight">{agent.name || 'Agent'}</h4><div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 uppercase"><Star className="w-2 h-2 fill-emerald-500" /><span>4.9</span></div></div></Popup>
                                </Marker>
                              ))
                            ) : (
                              <>
                                {/* Initial View: Independent Agents & Company Markers */}
                                {liveAgents.filter(a => !a.is_hub_active).reduce((acc, agent) => {
                                  if (agent.agent_account_type === 'company_admin' || (agent.role === 'agent' && !agent.company_id)) {
                                    acc.push(agent);
                                  }
                                  return acc;
                                }, []).map(entity => {
                                  const isCompany = entity.agent_account_type === 'company_admin';
                                  return (
                                    <Marker 
                                      key={entity.id} 
                                      position={[entity.location?.latitude || center[0], entity.location?.longitude || center[1]]} 
                                      icon={isCompany ? companyIcon(drillDownCompany?.id === entity.id) : agentIcon(selectedAgent?.id === entity.id)} 
                                      eventHandlers={{ click: () => { 
                                        if (isCompany) {
                                          setDrillDownCompany(entity);
                                          toast(`Showing ${entity.company_name || entity.name}'s Fleet`, { icon: '🏢' });
                                        } else {
                                          setSelectedAgent(entity);
                                          toast.success(`Independent Agent Targeted`, { icon: '🚛' });
                                        }
                                      }}}
                                    >
                                       <Popup className="compact-popup">
                                         <div className="p-1 px-2 min-w-[80px] text-center">
                                           <h4 className="text-xs font-semibold text-slate-900 leading-tight">{isCompany ? (entity.company_name || entity.name) : (entity.name || 'Agent')}</h4>
                                           <div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 uppercase">
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
                              <Marker key={weaver.id} position={[weaver.location?.latitude || (center[0] + 0.005), weaver.location?.longitude || (center[1] + 0.005)]} icon={weaverIcon}>
                                <Popup className="compact-popup">
                                  <div className="p-2 text-center">
                                    <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-tight">{weaver.business_name || 'Collector'}</h4>
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
                            <h3 className="text-sm font-semibold dark:text-white">{selectedHub.name || selectedHub.company_name}</h3>
                            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-1">Drop-off: {selectedHub.hub_address} ({selectedHub.distance.toFixed(1)}km)🏢</p>
                         </div>
                         <button onClick={() => setSelectedHub(null)} className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs">Change</button>
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-2xl text-center bg-emerald-50/10">
                         <MapPin className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-bounce-slow" />
                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Select the nearest Hub on the map</p>
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
                                <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 uppercase">
                                  <Star className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                                  <span>4.9</span>
                                </div>
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Targeted</span>
                              </div>
                           </div>
                           <button 
                             onClick={() => { setSelectedAgent(null); toast('Agent deselected', { icon: '🔄' }); }}
                             className="p-2 px-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs uppercase tracking-widest active:scale-95 transition-all"
                           >
                             Change
                           </button>
                        </motion.div>
                      ) : (
                        <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-900/50">
                           <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Tap an agent on the map to target (optional)</p>
                        </div>
                      )}

                     {/* ASAP BUTTON */}
                     <button 
                       onClick={() => { selectTime({ time: 'ASAP', type: 'any', discount: 0, label: 'Agents available' }); setIsManualTime(false); }} 
                       className={`w-full p-6 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${!isManualTime && selectedTime?.time === 'ASAP' ? 'bg-emerald-600 border-primary shadow-xl shadow-primary/20' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}
                     >
                       <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 ${!isManualTime && selectedTime?.time === 'ASAP' ? 'bg-white/20' : 'bg-emerald-600/10'}`}>
                         <Zap className={`w-7 h-7 ${!isManualTime && selectedTime?.time === 'ASAP' ? 'text-white' : 'text-emerald-600'}`} />
                       </div>
                       <div className="flex-1">
                         <p className={`text-lg font-semibold leading-tight ${!isManualTime && selectedTime?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                         <p className={`text-[11px] font-semibold mt-0.5 ${!isManualTime && selectedTime?.time === 'ASAP' ? 'text-white/70' : 'text-slate-400'}`}>First available agent</p>
                       </div>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${!isManualTime && selectedTime?.time === 'ASAP' ? 'border-white bg-white' : 'border-slate-200'}`}>
                         {!isManualTime && selectedTime?.time === 'ASAP' && <div className="w-3 h-3 rounded-full bg-emerald-600" />}
                       </div>
                     </button>

                     {/* SCHEDULE LATER */}
                     <button 
                       onClick={() => setIsManualTime(true)} 
                       className={`w-full p-5 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${isManualTime ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 shadow-xl' : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-white/10'}`}
                     >
                       <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 ${isManualTime ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-900'}`}>
                         <Clock className={`w-6 h-6 ${isManualTime ? 'text-emerald-600' : 'text-slate-400'}`} />
                       </div>
                       <div className="flex-1">
                         <p className={`text-sm font-semibold leading-tight ${isManualTime ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Schedule Later</p>
                         <p className={`text-xs font-semibold mt-0.5 ${isManualTime ? 'text-white/50' : 'text-slate-400'}`}>Pick a date & time</p>
                       </div>
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isManualTime ? 'border-white bg-white' : 'border-slate-200'}`}>
                         {isManualTime && <div className="w-3 h-3 rounded-full bg-slate-900" />}
                       </div>
                     </button>
                  </div>
               )}

               {isManualTime && pickupMode === 'pickup' && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Date</span>
                       <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
                    </div>
                    <div className="space-y-1">
                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest ml-1">Time</span>
                       <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
                    </div>
                 </motion.div>
               )}
            </motion.div>
          )}

          {/* ── STEP 4: POST SUMMARY ── */}
          {step === 4 && (
            <motion.div key="p4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Post Summary</h2>
                  <p className="text-sm font-medium text-slate-500 leading-tight">Review your trade details before confirming.</p>
                </div>

                {/* ── MATERIAL PREVIEW ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex items-center gap-6">
                   <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                      {wasteType?.icon || '📦'}
                   </div>
                   <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{wasteType?.label}</h3>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-1">{quantity} KG Stock</p>
                   </div>
                </div>

                {/* ── LOGISTICS SUMMARY (CONTEXTUAL) ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                   <div className="flex items-center gap-3 pb-4 border-b border-slate-50 dark:border-slate-800">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                         {pickupMode === 'pickup' ? <Truck className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                      </div>
                      <div>
                         <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Collection Method</p>
                         <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{pickupMode === 'pickup' ? 'Agent Dispatch' : 'Self Drop-off'}</h4>
                      </div>
                   </div>

                   {pickupMode === 'pickup' ? (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Target Address</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{profile?.location?.estate || 'My Location'}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Pickup Time</span>
                            <span className="text-xs font-semibold text-emerald-600">{isManualTime ? `${customDate} @ ${customTime}` : 'ASAP (4-12 mins)'}</span>
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Drop-off Hub</span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">{selectedHub?.name}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-slate-400 uppercase">Hub Address</span>
                            <span className="text-xs font-semibold text-slate-500">{selectedHub?.address}</span>
                         </div>
                      </div>
                   )}
                </div>

                {/* ── FINANCIAL BREAKDOWN ── */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-white/50">
                         <span className="text-xs font-semibold uppercase tracking-widest">Gross Value</span>
                         <span className="text-sm font-semibold">KSh {assetValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-400">
                         <span className="text-xs font-semibold uppercase tracking-widest">Logistics Fee</span>
                         <span className="text-sm font-semibold">- KSh {pickupMode === 'pickup' ? logisticsFee : 0}</span>
                      </div>
                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                         <span className="text-xs font-semibold text-white uppercase tracking-widest">Net Revenue</span>
                         <div className="text-right">
                            <h3 className="text-3xl font-semibold text-emerald-400 tracking-tighter">KSh {(assetValue - (pickupMode === 'pickup' ? logisticsFee : 0)).toLocaleString()}</h3>
                            <p className="text-xs font-semibold text-white/30 uppercase tracking-[0.2em] mt-1">Paid to Wallet</p>
                         </div>
                      </div>
                   </div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── UNIFIED GLOBAL ACTION BUTTON ── */}
        <div className="mt-8 space-y-6">
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
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-amber-700">Dispatch Notice</h4>
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
                      <h4 className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Zero Charges</h4>
                      <p className="text-[11px] font-medium text-emerald-800/70 dark:text-emerald-400 leading-relaxed mt-1">
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
                       <button onClick={() => setPickupMode('dropoff')} className="flex-1 py-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-lg text-xs font-semibold text-rose-600 uppercase tracking-widest">Switch to Drop-off</button>
                       <button onClick={() => setIsManualTime(true)} className="flex-1 py-2 bg-rose-500 rounded-lg text-xs font-semibold text-white uppercase tracking-widest">Schedule Later</button>
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
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEscrowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
             <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-8 pb-10 shadow-2xl overflow-hidden">
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
                     onClick={() => handleBook({ amount: 0 })}
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
                   <button onClick={() => setShowEscrowModal(false)} className="w-full text-xs font-semibold text-slate-400 uppercase tracking-widest mt-4">Go Back</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
