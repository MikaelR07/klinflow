import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Home, Truck, Info, ChevronRight, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import L from 'leaflet';
// @ts-ignore
window.L = L;
import { toast } from 'sonner';

import { useBookingStore, useAuthStore, useServiceStore, usePriceStore, useSystemStore, useNotificationStore, useCollectiveStore } from '@klinflow/core';
import { supabase } from '@klinflow/supabase';
import { compressImage } from '@klinflow/core/utils/imageUtils';

import BookPickupAgentStep from '../../features/bookPickup/BookPickupAgentStep';
import PostTradeSummaryStep from '../../features/postTrade/PostTradeSummaryStep';

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

export default function RequestGroupPickup() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile = useAuthStore(s => (s as any).profile);
  const userId = useAuthStore(s => (s as any).userId);
  const { fetchSwarmById } = useCollectiveStore();

  const {
    aiSuggestions, selectedTime, selectTime, createBooking,
    liveAgents, fetchNearbyAgents, subscribeToAgents, cleanupAgents,
    generateTimeSuggestions
  } = useBookingStore();

  const fetchCategories = useServiceStore(s => s.fetchCategories);
  const fetchPrices = usePriceStore(s => s.fetchPrices);
  const getCategoryPrice = usePriceStore(s => s.getCategoryPrice);
  const fetchConfig = useSystemStore(s => s.fetchConfig);

  const [step, setStep] = useState(1);
  const [swarm, setSwarm] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [customLocation] = useState(profile?.location || { estate: 'Current Location', latitude: -1.2635, longitude: 36.8048 });
  const [photos, setPhotos] = useState<any[]>([]);
  const [customDescription, setCustomDescription] = useState('');

  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [showAllContributors, setShowAllContributors] = useState(false);

  const [isManualTime, setIsManualTime] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [customTime, setCustomTime] = useState('09:00');

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
    generateTimeSuggestions();
    subscribeToAgents(lat, lng);
    loadSwarm();

    return () => cleanupAgents();
  }, [id]);

  const quantity = swarm?.current_weight || 0;

  const center: [number, number] = [customLocation.latitude || -1.2635, customLocation.longitude || 36.8048];

  const filteredAgents = liveAgents.filter((agent: any) => {
    let lat = agent.location?.latitude;
    let lon = agent.location?.longitude;
    if (!lat || !lon) return false;

    // Hierarchy: show hubs & independents on map, fleet drivers only when their hub is selected
    const isFleetDriver = agent.agentAccountType === 'fleet_driver';
    const isCompany = agent.agentAccountType === 'company_admin';
    const isIndependent = agent.agentAccountType === 'independent';

    if (isCompany || isIndependent) return true;
    if (isFleetDriver && agent.companyId === selectedCompanyId) return true;

    return false;
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPhotos((prev: any[]) => [...prev, ...newFiles].slice(0, 3));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleBook = async () => {
    let uploadToastId: string | number | null = null;
    setIsSubmitting(true);
    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        uploadToastId = toast.loading(`Uploading proof photos...`);
        const uploadPromises = photos.map(async (p, i) => {
          const compressed = await compressImage(p, { maxWidth: 1024, quality: 0.7 });
          const fileName = `${userId}/${Date.now()}-${i}-${compressed.name?.replace(/\s/g, '_')}`;
          const { data, error } = await supabase.storage.from('pickups').upload(fileName, compressed);
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage.from('pickups').getPublicUrl(data.path);
          return publicUrlData.publicUrl;
        });
        photoUrls = await Promise.all(uploadPromises);
        toast.dismiss(uploadToastId);
      }

      const timeString = isManualTime ? `${customDate} @ ${customTime}` : ((selectedTime as any)?.time || 'ASAP');

      const prices = usePriceStore.getState().prices;
      const matchedCategory = prices.find((p: any) => p.label === swarm.material || p.material_name === swarm.material);
      const wasteTypeSlug = matchedCategory?.slug || matchedCategory?.id || swarm.material.toLowerCase().replace(/\s+/g, '-');

      const bookingData = {
        wasteType: wasteTypeSlug,
        weight: quantity,
        estate: customLocation.estate,
        latitude: customLocation.latitude,
        longitude: customLocation.longitude,
        time: timeString,
        amount: 0,
        totalPrice: quantity * (getCategoryPrice(swarm.material) || 0),
        photoUrl: photoUrls[0] || null, // For backward compatibility
        agentId: selectedAgent?.id || null,
        notes: customDescription || '',
        bookingType: selectedTime?.type || 'any',
        swarmId: swarm.id,
        isGroupPickup: true
      };

      const result = await createBooking(bookingData);
      
      if (!result) {
        throw new Error('Database operation failed. Please ensure the latest migrations are applied.');
      }

      await useNotificationStore.getState().addNotification(
        "New Group Pickup! 🏘️",
        `A high-density community drive for ${quantity}kg of ${swarm.material} is available in ${customLocation.estate}.`,
        'info',
        'agent',
        selectedAgent?.id || null,
        { wasteType: swarm.material, isGroup: true }
      );

      setShowEscrowModal(false);
      toast.success("Group Pickup Requested Successfully!");
      navigate('/my-bookings');
    } catch (error: any) {
      if (uploadToastId) toast.dismiss(uploadToastId);
      console.error('Group pickup error:', error);
      toast.error('Failed to request pickup', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-[100dvh] flex items-center justify-center"><span className="animate-pulse font-bold text-emerald-600">Loading Drive...</span></div>;
  }

  // Get top 3 contributors
  const sortedParticipants = [...participants].sort((a, b) => b.pledged_weight - a.pledged_weight).slice(0, 3);

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 border-b border-slate-200 dark:border-slate-900/70 max-w-lg mx-auto">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="w-11 h-11 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-500 transition-colors" />
          </button>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-none">Group Pickup</h1>
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

      <div className="flex-1 space-y-0 pb-2 pt-[calc(env(safe-area-inset-top,1rem)+4rem)] relative max-w-lg mx-auto w-full px-1.5">
        {step === 1 && (
          <div className="bg-emerald-700 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 mb-4 flex items-center justify-between mx-3">
            <div>
              <p className="text-[10px] font-bold text-slate-200 dark:text-emerald-400 capitalize tracking-widest mb-1">Community pickup</p>
              <h3 className="text-sm font-black text-slate-200 dark:text-emerald-100 capitalize">{swarm?.material} • {quantity} KG</h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-200 dark:text-emerald-400 capitalize tracking-widest mb-1">Contributors</p>
              <p className="text-sm font-black text-slate-200 dark:text-emerald-100">{participants.length}</p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 px-3">
              {/* TOP CONTRIBUTORS */}
              {sortedParticipants.length > 0 && (
                <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-tight mb-3 flex items-center gap-2">
                    <span className="text-lg">🏆</span> Community Heroes
                  </h4>
                  <div className="flex flex-col gap-2">
                    {sortedParticipants.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{p.profiles?.name || 'Resident'}</span>
                        <span className="text-[10px] font-black text-emerald-600">{p.pledged_weight} KG</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-tight block">Logistics Notes</label>
                <textarea
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g. Tell the guard you are here for the Klinflow Community Drive. Materials are at House 4, 12, and 18."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-32 resize-none transition-all placeholder:text-slate-400 font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-900 dark:text-white capitalize tracking-tight block">Upload Proof Photos</label>
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((p, idx) => (
                    <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                      <img src={typeof p === 'string' ? p : URL.createObjectURL(p)} alt="Proof" className="w-full h-full object-cover" />
                      <button onClick={() => removePhoto(idx)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 3 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/50 flex flex-col items-center justify-center text-emerald-500 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                      <UploadCloud className="w-6 h-6 mb-1 opacity-50" />
                      <span className="text-[10px] font-bold tracking-widest">UPLOAD</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="px-3">
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
            </motion.div>
          )}

          {step === 3 && (() => {
            const isMixed = swarm?.material === 'Mixed Recyclables';
            const estimatedRevenue = isMixed
              ? participants.reduce((acc, p) => acc + (p.pledged_weight * (getCategoryPrice(p.material) || 0)), 0)
              : quantity * (getCategoryPrice(swarm?.material) || 0);

            const estimatedGFP = quantity * 2;

            return (
              <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-6 px-1.5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight italic px-2">Group Pickup Summary</h2>
                
                {/* ── MATERIAL PREVIEW ── */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                  {photos.length > 0 ? (
                    <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 relative">
                      <img
                        src={typeof photos[0] === 'string' ? photos[0] : URL.createObjectURL(photos[0])}
                        alt="Material Preview"
                        className="w-full h-full object-cover"
                      />
                      {photos.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                          + {photos.length - 1} More
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No Image Provided</span>
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 p-2 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-0">
                  <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-4">Logistics Breakdown</p>

                  <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Community Pickup</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-white mt-0.5">{participants.length} Residents</span>
                    </div>
                    <span className="text-sm font-semibold text-primary capitalize tracking-widest font-mono">{quantity} KG</span>
                  </div>

                  <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Agent Assigned</span>
                      <span className="text-xs text-slate-400 mt-0.5">
                        {selectedAgent ? (selectedAgent.name || selectedAgent.full_name || 'Selected Agent') : (selectedCompanyId ? 'Selected Partner' : 'Open Pool (Fastest Available)')}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-500 capitalize tracking-widest px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 rounded-md">Awaiting Dispatch</span>
                  </div>

                  <div className="bg-emerald-600 dark:bg-primary rounded-xl p-4 mt-6 relative overflow-hidden shadow-sm">
                    <div className="relative z-10 space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-white/20">
                        <span className="text-[10px] font-black text-white capitalize tracking-widest">Total Value</span>
                        <span className="text-xs font-bold text-white/90">
                          {isMixed ? 'Multi-Material Rates' : `KSh ${(getCategoryPrice(swarm?.material) || 0).toLocaleString()} /kg`}
                        </span>
                      </div>
                      
                      {/* Breakdown List */}
                      <div className="space-y-2 pb-2 border-b border-white/20">
                        {(showAllContributors ? participants : participants.slice(0, 4)).map((p, idx) => {
                          const rate = getCategoryPrice(p.material || swarm?.material) || 0;
                          const userTotal = p.pledged_weight * rate;
                          const userGfp = p.pledged_weight * 2;
                          return (
                            <div key={idx} className="flex justify-between items-center text-white">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold capitalize truncate max-w-[100px]">{p.profiles?.name || 'Resident'}</span>
                                <span className="text-[10px] text-slate-50 capitalize">{p.pledged_weight}kg {p.material || swarm?.material} @ {rate}/kg</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[11px] font-black block">KSh {Math.round(userTotal).toLocaleString()}</span>
                                <span className="text-[9px] text-white font-semibold">+{userGfp} GFP</span>
                              </div>
                            </div>
                          );
                        })}
                        {participants.length > 4 && (
                          <button 
                            onClick={() => setShowAllContributors(!showAllContributors)}
                            className="w-full text-center py-1.5 mt-1 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold text-white transition-colors"
                          >
                            {showAllContributors ? 'Show Less' : `View ${participants.length - 4} More Contributors`}
                          </button>
                        )}
                      </div>

                      <div className="flex justify-between items-end pt-1">
                        <div>
                          <p className="text-[10px] font-black text-white capitalize tracking-widest mb-1">GRAND TOTAL</p>
                          <h3 className="text-2xl font-black text-white tracking-tighter">KSh {Math.round(estimatedRevenue).toLocaleString()}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white capitalize tracking-widest mb-1">TOTAL GFP</p>
                          <h3 className="text-lg font-black text-white/90 tracking-tighter">{estimatedGFP}</h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                      The Agent will weigh and verify each participant's contribution upon arrival. Payouts and GFP will be automatically distributed to individual Klinflow wallets based on their specific verified weight.
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        <div className="h-14" />
        <div className="mb-12 space-y-6 px-3">
          {step < 3 ? (
            <button
              disabled={isSubmitting || (step === 2 && !selectedTime && !isManualTime) || (step === 1 && photos.length === 0)}
              onClick={() => setStep(step + 1)}
              className="w-full p-4 bg-emerald-600 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 "
            >
              <span>CONTINUE</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              disabled={isSubmitting}
              onClick={() => setShowEscrowModal(true)}
              className="w-full p-5 bg-emerald-600 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span>CONFIRM GROUP PICKUP</span>
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
                <div className="w-16 h-16 bg-emerald-600/10 rounded-3xl flex items-center justify-center">
                  <Truck className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Confirm Group Pickup</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    This will dispatch an agent to collect {quantity}kg from your neighborhood. Once completed, payouts and GFP will be automatically split among the {participants.length} contributors.
                  </p>
                </div>
                <button
                  disabled={isSubmitting}
                  onClick={() => handleBook()}
                  className={`w-full p-5 bg-emerald-600 shadow-emerald-600/30 text-white rounded-2xl font-semibold text-sm active:scale-95 transition-all flex items-center justify-center gap-3`}
                >
                  {isSubmitting ? <span className="animate-pulse">DISPATCHING...</span> : <span>REQUEST PICKUP</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
