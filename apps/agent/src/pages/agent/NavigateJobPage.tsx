/**
 * Navigate Job Page — Real-time tracking and mission control for agents
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, ArrowRight, Phone, Navigation, CheckCircle, User, Zap, Clock, Warehouse, Truck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNotificationStore, NOTIFICATION_TYPES } from '@klinflow/core/stores/notificationStore';
import { useAssetStore } from '@klinflow/core/stores/assetStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { supabase } from '@klinflow/supabase';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import type { AgentJob } from '@klinflow/core/stores/agentStore.types';
import type { Database } from '@klinflow/supabase';
import AIScannerModal from '@klinflow/ui/components/AIScannerModal';
import { toast } from 'sonner';

type BookingRow = Database['public']['Tables']['bookings']['Row'];
type BookingWithProfile = BookingRow & { profiles: { name: string | null; phone: string | null } | null };

// Custom Icons
const agentIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 rounded-[10px] bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-xs animate-bounce">⚡</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const clientIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white">👤</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function MapBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

export default function NavigateJobPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { activeJobs, fetchActiveJobs, arrivedJobIds, setJobArrived, fetchAgentConfig } = useAgentStore();
  const { addNotification } = useNotificationStore();
  
  const job = activeJobs.find(j => j.id === id);
  const { fetchCategories } = useServiceStore();
  const { verifyAsset } = useAssetStore();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [localJob, setLocalJob] = useState<AgentJob | null>(null);

  const activeJob = job || localJob;

  useEffect(() => {
    // If the specific job is missing from our local state, force a direct fetch
    if (!job && id) {
      const fetchDirect = async () => {
        const { data } = await supabase.from('bookings').select('*, profiles:user_id(name, phone)').eq('id', id).single();
        if (data) {
          const d = data as BookingWithProfile;
          setLocalJob({
            ...d,
            material: d.waste_type,
            location: d.estate || 'Unknown Location',
            time: d.time_slot || 'ASAP',
            userId: d.user_id,
            customerName: d.profiles?.name || undefined,
            phone: d.profiles?.phone || '',
            photos: d.photo_url ? [d.photo_url] : [],
            photoUrl: d.photo_url,
            pay: d.fee,
            bags: d.bags,
            actual_weight_kg: d.actual_weight_kg,
            is_market_trade: d.is_market_trade,
            notes: d.notes
          } as AgentJob);
        } else {
          fetchActiveJobs();
        }
      };
      fetchDirect();
    }
    
    fetchAgentConfig(); // Load rates for Smart Invoice
    fetchCategories(); // Load material names for dropdown
    
    // Sync local arrival state with global store
    if (id && arrivedJobIds.includes(id)) {
      setHasArrived(true);
    }
  }, [id, !!job, fetchActiveJobs]);

  // Auto-expand when arrived
  useEffect(() => {
    if (hasArrived) setIsExpanded(true);
  }, [hasArrived]);

  // Fallback to default Nairobi coords if missing
  const agentPos: [number, number] = profile?.location?.latitude ? [profile.location.latitude, profile.location.longitude as number] : [-1.2921, 36.8219];
  const clientPos: [number, number] = activeJob?.latitude ? [activeJob.latitude, activeJob.longitude as number] : [-1.2851, 36.8119];

  const [roadPath, setRoadPath] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!agentPos || !clientPos) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${agentPos[1]},${agentPos[0]};${clientPos[1]},${clientPos[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes.length > 0) {
          const points = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRoadPath(points);
        } else {
          setRoadPath([agentPos, clientPos]);
        }
      } catch (err) {
        setRoadPath([agentPos, clientPos]);
      }
    };
    fetchRoute();
  }, [agentPos[0], clientPos[0]]);

  if (!activeJob) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-800 items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6">
          <Navigation className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-pulse" />
        </div>
        
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Initializing Route
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-[240px]">
          Loading Mission Parameters And location Co-ordinates...
        </p>

        <button 
          onClick={() => navigate(-1)} 
          className="py-3 px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    );
  }



  return (
    <div className="flex flex-col space-y-6">
      {/* Top Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>


      </div>

      {/* Map View - Full Screen Background */}
      <div className="absolute inset-0 z-0">
        <MapContainer 
          center={clientPos} 
          zoom={14} 
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <MapBounds bounds={[agentPos, clientPos]} />

          <Polyline positions={roadPath.length > 0 ? roadPath : [agentPos, clientPos]} color="#00A651" weight={4} dashArray="10, 15" opacity={0.8} />
          
          <Marker position={agentPos} icon={agentIcon} />
          <Marker position={clientPos} icon={clientIcon} />
        </MapContainer>
      </div>

      {/* ── MISSION CONTROL SHEET (Intelligent Bottom Sheet) ── */}
      <motion.div 
        initial="peek"
        animate={isExpanded ? "expanded" : "peek"}
        variants={{
          peek: { y: '68%' },
          expanded: { y: '0%' }
        }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={(e, info) => {
          // If swiped down hard or past threshold
          if (info.offset.y > 50) setIsExpanded(false);
          // If swiped up hard or past threshold
          if (info.offset.y < -50) setIsExpanded(true);
        }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] rounded-t-[3.5rem] p-6 pb-32 cursor-grab active:cursor-grabbing"
      >
        {/* Interaction Handle */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex flex-col items-center pb-4 group"
        >
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-1 group-hover:bg-primary transition-colors" />
          <div className="text-xs font-semibold text-slate-300 capitalize tracking-[0.3em] group-hover:text-primary transition-colors">
            {isExpanded ? 'Slide Down to Map' : 'Slide Up for Details'}
          </div>
        </button>
        
        {/* Main Content */}
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Client</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{activeJob.customerName?.split(' ')[0] || activeJob.customer?.split(' ')[0] || 'Client'}</span>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Location</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{activeJob.location}</span>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Material</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{activeJob.material}</span>
            </div>
            
            <button 
              onClick={() => window.location.href = `tel:${activeJob.phone || '+254700000000'}`}
              className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-emerald-500/30 shrink-0 self-center"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6 font-semibold text-xs capitalize tracking-widest">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-accent" />
                <div className="flex flex-col">
                   <span className="text-xs text-slate-400">Scheduled Pickup Window</span>
                   <span className="dark:text-white leading-none mt-0.5">{activeJob.time}</span>
                </div>
             </div>

             {activeJob.notes && (
               <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-start gap-3">
                  <Truck className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex flex-col">
                     <span className="text-xs text-primary">Description</span>
                     <span className="dark:text-slate-300 normal-case font-semibold mt-1 leading-relaxed italic">
                       "{activeJob.notes.replace(/Est\. Total: KSh \d+( \| Item: )?/, '').replace(/^ \| /, '')}"
                     </span>
                  </div>
               </div>
             )}
          </div>

          {/* Scrollable details if expanded */}
          <div className="space-y-6">


            {!hasArrived ? (
              <div className="space-y-4">
                <button 
                  onClick={() => {
                    addNotification(
                      "Agent has Arrived!",
                      `${profile?.name || 'Agent'} has arrived at your location. Please meet them to begin the pickup.`,
                      NOTIFICATION_TYPES.SUCCESS,
                      'client',
                      activeJob.user_id || activeJob.userId
                    );
                    setHasArrived(true);
                    setJobArrived(activeJob.id);
                    toast.success("Welcome to Mission Site!", { description: "Please weigh the recyclables to complete pickup." });
                  }}
                  className="w-full py-5 bg-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 transition-all group tracking-widest"
                >
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  I HAVE ARRIVED
                </button>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 p-4 rounded-2xl flex items-start gap-3">
                  <Navigation className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 leading-relaxed capitalize tracking-tight">
                    Map is live. Follow the dashed line to reach the client.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2 pb-4">
                <button 
                  onClick={() => setIsScannerOpen(true)}
                  className="w-full py-5 bg-blue-600 text-white font-semibold text-sm rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 active:scale-95 transition-all group"
                >
                  <Zap className="w-5 h-5 animate-pulse fill-white" />
                  START AI SCAN (RECOMMENDED)
                </button>
                <button 
                  onClick={() => {
                    setIsScannerOpen(true);
                    // We need to tell the modal to start in manual mode
                    // We'll pass a prop or use a timeout to trigger it
                    setTimeout(() => {
                      const manualBtn = document.getElementById('manual-override-btn');
                      if (manualBtn) manualBtn.click();
                    }, 100);
                  }}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs capitalize tracking-[0.2em] rounded-2xl active:scale-95 transition-all border border-slate-200 dark:border-slate-800"
                >
                  Skip Scan & Use Manual Entry
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AIScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        booking={activeJob}
        onVerify={async (data) => {
          try {
            const isMarketTrade = !!(activeJob.is_market_trade || activeJob.booking_type === 'marketplace_pickup');
            
            if (isMarketTrade) {
              if (data.isCounterOffer) {
                // Submit Counter Offer (pauses trade, alerts seller)
                const { error } = await supabase.rpc('submit_counter_offer', {
                  p_booking_id: activeJob.id,
                  p_new_amount: data.counterOfferAmount
                });
                if (error) throw error;
                toast.success("Counter-Offer Sent!", { description: "Waiting for seller approval." });
                navigate('/trades');
                return;
              } else {
                // Marketplace logic: Pay seller the agreed amount instantly
                const { error } = await supabase.rpc('complete_booking_trade_payout', {
                  p_booking_id: activeJob.id,
                  p_actual_weight: data.weightKg,
                  p_payout_amount: activeJob.total_price || activeJob.pay || 0
                });
                if (error) throw error;
                await useAuthStore.getState().fetchProfile();
                toast.success("Verification Complete!", { description: "Funds transferred to seller." });
                navigate('/trades');
                return;
              }
            } else {
              // Standard service logic: Platform pays agent, awards GFP
              await verifyAsset(activeJob.id, {
                ...data,
                ownerId: activeJob.userId || activeJob.user_id
              });
              await useAuthStore.getState().fetchProfile();
              toast.success("Verification Complete!", { description: "Moving to next mission." });
              navigate('/jobs');
            }
          } catch (err) {
            toast.error("Verification failed.", { description: (err as Error).message || "Please try again." });
            throw err;
          }
        }}
      />
    </div>
  );
}
