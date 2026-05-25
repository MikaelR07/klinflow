import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Phone, Navigation, CheckCircle, ShieldCheck, Truck, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import VerificationWorkflowModal from '../../components/fulfillment/VerificationWorkflowModal';
import { toast } from 'sonner';

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

export default function NavigatePickupPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { updateFulfillmentStatus } = useFulfillmentStore();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [roadPath, setRoadPath] = useState<[number, number][]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('fulfillment_orders')
        .select(`
          *,
          rfq:rfqs(*),
          proposal:rfq_offers(*, seller:profiles!rfq_offers_seller_id_fkey(name, company_name, phone))
        `)
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setOrder(data);
        if (data.status === 'arrived' || data.status === 'pickup_completed' || data.status === 'in_transit' || data.status === 'delivered') {
          setHasArrived(true);
          setIsExpanded(true);
        }
      }
      setLoading(false);
    };

    fetchOrder();

    if (id) {
      const channel = supabase.channel(`fulfillment_nav_${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'fulfillment_orders',
          filter: `id=eq.${id}`
        }, () => {
          fetchOrder(); // Refetch on change
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const agentPos: [number, number] = profile?.location?.latitude ? [profile.location.latitude, profile.location.longitude as number] : [-1.2921, 36.8219];
  const clientPos: [number, number] = order?.rfq?.latitude ? [order.rfq.latitude, order.rfq.longitude as number] : [-1.2851, 36.8119];

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

  const handleConfirmArrival = async () => {
    if (!order) return;
    try {
      await updateFulfillmentStatus(order.id, 'arrived');
      setHasArrived(true);
      setIsExpanded(true);
      toast.success("Arrival Confirmed", { description: "Please proceed with material verification." });
    } catch (error) {
      toast.error("Failed to confirm arrival");
    }
  };

  // When verification completes, order status updates, causing a refetch.
  // If status is pickup_completed, we could redirect back to the list.
  useEffect(() => {
    if (order?.status === 'pickup_completed') {
      toast.success("Verification Completed!");
      navigate('/pickups');
    }
  }, [order?.status, navigate]);

  if (loading || !order) {
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
          className="py-3 px-6 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  const sellerName = order.proposal?.seller?.company_name || order.proposal?.seller?.name || 'Seller';
  const sellerPhone = order.proposal?.seller?.phone || '+254700000000';
  const location = order.pickup_address || order.rfq?.pickup_area || 'Address not specified';
  const material = order.rfq?.category || 'Material';

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

      {/* Map View */}
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

      {/* MISSION CONTROL SHEET */}
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
          if (info.offset.y > 50) setIsExpanded(false);
          if (info.offset.y < -50) setIsExpanded(true);
        }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.2)] rounded-t-[3.5rem] p-6 pb-32 cursor-grab active:cursor-grabbing"
      >
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex flex-col items-center pb-4 group"
        >
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-1 group-hover:bg-emerald-500 transition-colors" />
          <div className="text-xs font-semibold text-slate-300 capitalize tracking-[0.3em] group-hover:text-emerald-500 transition-colors">
            {isExpanded ? 'Slide Down to Map' : 'Slide Up for Details'}
          </div>
        </button>
        
        <div className="max-w-md mx-auto">
          <div className="flex gap-2 mb-6">
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Seller</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{sellerName.split(' ')[0]}</span>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Location</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{location}</span>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
              <span className="text-[9px] font-bold text-slate-400 capitalize tracking-widest mb-1">Material</span>
              <span className="text-[10px] font-black text-slate-900 dark:text-white capitalize truncate w-full">{material}</span>
            </div>
            
            <button 
              onClick={() => window.location.href = `tel:${sellerPhone}`}
              className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-emerald-500/30 shrink-0 self-center"
            >
              <Phone className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6 font-semibold text-xs capitalize tracking-widest">
             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center gap-3">
                <Clock className="w-4 h-4 text-emerald-500" />
                <div className="flex flex-col">
                   <span className="text-xs text-slate-400">Scheduled Date</span>
                   <span className="dark:text-white leading-none mt-0.5">{order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString() : 'ASAP'}</span>
                </div>
             </div>

             {order.rfq?.notes && (
               <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 p-4 rounded-2xl flex items-start gap-3">
                  <Truck className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div className="flex flex-col">
                     <span className="text-xs text-emerald-600">Request Notes</span>
                     <span className="dark:text-slate-300 normal-case font-semibold mt-1 leading-relaxed italic">
                       "{order.rfq.notes}"
                     </span>
                  </div>
               </div>
             )}
          </div>

          <div className="space-y-6">
            {!hasArrived ? (
              <div className="space-y-4">
                <button 
                  onClick={handleConfirmArrival}
                  className="w-full py-5 bg-emerald-500 text-white font-semibold text-sm rounded-2xl shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all group tracking-widest"
                >
                  <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  I HAVE ARRIVED
                </button>

                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 p-4 rounded-2xl flex items-start gap-3">
                  <Navigation className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-xs font-semibold text-blue-700/70 dark:text-blue-300/70 leading-relaxed capitalize tracking-tight">
                    Map is live. Follow the dashed line to reach the seller.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pt-2 pb-4">
                <button 
                  onClick={() => setIsVerificationModalOpen(true)}
                  className="w-full py-5 bg-amber-500 text-white font-semibold text-sm rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all group"
                >
                  <ShieldCheck className="w-5 h-5 animate-pulse fill-white" />
                  START MATERIAL VERIFICATION
                </button>
                <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/30 p-4 rounded-2xl flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5" />
                  <p className="text-xs font-semibold text-amber-700/70 dark:text-amber-300/70 leading-relaxed capitalize tracking-tight">
                    You have arrived. Please verify material weight, quality, and collect the 6-digit code from the seller.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <VerificationWorkflowModal 
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        order={order}
      />
    </div>
  );
}
