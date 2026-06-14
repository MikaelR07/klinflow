import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Navigation, ShieldCheck, CheckCircle2, Clock, Search, X, CheckCircle, PackageCheck } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';
import VerificationWorkflowModal from '../../components/fulfillment/VerificationWorkflowModal';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';

// Custom Icons
const agentIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 rounded-[10px] bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-xs animate-bounce">⚡</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const clientIconPending = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 bg-amber-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">👤</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const clientIconDone = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">✓</div>`,
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

export default function NavigateGroupPickupPage() {
  const { rfqId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { updateFulfillmentStatus } = useFulfillmentStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [roadPath, setRoadPath] = useState<[number, number][]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    if (rfqId) {
      const channel = supabase.channel(`fulfillment_nav_group_${rfqId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'fulfillment_orders',
          filter: `rfq_id=eq.${rfqId}`
        }, () => {
          fetchOrders();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [rfqId]);

  const fetchOrders = async () => {
    if (!rfqId) return;
    const { data, error } = await supabase
      .from('fulfillment_orders')
      .select(`
        *,
        rfq:rfqs(*),
        proposal:rfq_offers(*, seller:profiles!rfq_offers_seller_id_fkey(name, company_name, phone, klinflow_id, location))
      `)
      .eq('rfq_id', rfqId);

    if (!error && data) {
      setOrders(data);
      // If any order is arrived or beyond, mark as arrived to show the verification list
      const arrivedStates = ['arrived', 'material_verification', 'pickup_completed', 'in_transit', 'delivered', 'completed'];
      if (data.some(o => arrivedStates.includes(o.status))) {
        setHasArrived(true);
        setIsExpanded(true);
      }
    }
    setLoading(false);
  };

  // Agent location (fallback to default)
  const agentPos: [number, number] = profile?.location?.latitude ? [profile.location.latitude, profile.location.longitude as number] : [-1.2921, 36.8219];

  // Client locations — prefer seller's own location, fallback to RFQ pickup area
  const clientPositions = useMemo(() => {
    const positions = orders.map(o => {
      const sellerLoc = o.proposal?.seller?.location;
      if (sellerLoc?.latitude && sellerLoc?.longitude) {
        return [Number(sellerLoc.latitude), Number(sellerLoc.longitude)] as [number, number];
      }
      if (o.rfq?.latitude && o.rfq?.longitude) {
        return [o.rfq.latitude, o.rfq.longitude] as [number, number];
      }
      return null;
    }).filter(Boolean) as [number, number][];

    if (positions.length === 0) {
      positions.push([-1.2921, 36.8219]);
    }
    return positions;
  }, [orders]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!agentPos || clientPositions.length === 0) return;
      try {
        // Construct waypoints: agent -> client1 -> client2 ...
        const allPoints = [agentPos, ...clientPositions];
        const coordsStr = allPoints.map(p => `${p[1]},${p[0]}`).join(';');
        
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.code === 'Ok' && data.routes.length > 0) {
          const points = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setRoadPath(points);
        } else {
          // Fallback: straight lines
          setRoadPath([agentPos, ...clientPositions]);
        }
      } catch (err) {
        setRoadPath([agentPos, ...clientPositions]);
      }
    };
    fetchRoute();
  }, [agentPos[0], agentPos[1], clientPositions]);

  const handleConfirmArrival = async () => {
    try {
      // Mark all orders in group as arrived
      for (const order of orders) {
        if (['agent_on_the_way', 'agent_assigned', 'pending_coordination'].includes(order.status)) {
          await updateFulfillmentStatus(order.id, 'arrived');
        }
      }
      setHasArrived(true);
      setIsExpanded(true);
      toast.success("Arrival Confirmed", { description: "You can now begin verifying sellers." });
    } catch (error) {
      toast.error("Failed to confirm arrival");
    }
  };

  const handleCompleteGroupPickup = async () => {
    toast.success("Group Route Completed!");
    navigate('/pickups');
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-800 items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-6">
          <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
          Initializing Group Route
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-[240px]">
          Calculating optimized path for {orders.length} locations...
        </p>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => {
    const search = searchQuery.toLowerCase();
    const seller = o.proposal?.seller;
    if (!seller) return false;
    
    return (
      (seller.name && seller.name.toLowerCase().includes(search)) ||
      (seller.company_name && seller.company_name.toLowerCase().includes(search)) ||
      (seller.phone && seller.phone.toLowerCase().includes(search)) ||
      (seller.klinflow_id && seller.klinflow_id.toLowerCase().includes(search))
    );
  });

  const allCompleted = orders.length > 0 && orders.every(o => ['pickup_completed', 'completed', 'in_transit', 'delivered'].includes(o.status));

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-100 dark:bg-slate-900">
      <div className="absolute top-[calc(env(safe-area-inset-top,1rem)+1rem)] left-4 right-4 z-[1000] flex items-center justify-between pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-xl pointer-events-auto border border-slate-200 dark:border-slate-800 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        </button>
      </div>

      <div className="absolute inset-0 z-0">
        <MapContainer
          center={clientPositions.length > 0 ? clientPositions[0] : agentPos}
          zoom={14}
          zoomControl={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapBounds bounds={[agentPos, ...clientPositions]} />
          <Polyline positions={roadPath.length > 0 ? roadPath : [agentPos, ...clientPositions]} color="#3B82F6" weight={4} dashArray="10, 15" opacity={0.8} />
          <Marker position={agentPos} icon={agentIcon} />
          {orders.map((o, idx) => {
             const sellerLoc = o.proposal?.seller?.location;
             const pos = sellerLoc?.latitude && sellerLoc?.longitude
               ? [Number(sellerLoc.latitude), Number(sellerLoc.longitude)]
               : (o.rfq?.latitude && o.rfq?.longitude ? [o.rfq.latitude, o.rfq.longitude] : null);
             if (!pos) return null;
             const isDone = ['pickup_completed', 'completed', 'in_transit', 'delivered'].includes(o.status);
             const seller = o.proposal?.seller;
             const sellerName = seller?.company_name || seller?.name || 'Seller';
             const weight = o.proposal?.offered_weight || '?';
             return (
               <Marker key={o.id} position={pos as [number, number]} icon={isDone ? clientIconDone : clientIconPending}>
                 <Popup>
                   <div style={{ minWidth: 120, textAlign: 'center' }}>
                     <strong style={{ fontSize: 13 }}>{sellerName}</strong>
                     <br />
                     <span style={{ fontSize: 11, color: '#64748b' }}>{weight}kg expected</span>
                   </div>
                 </Popup>
               </Marker>
             );
          })}
        </MapContainer>
      </div>

      <motion.div
        initial="peek"
        animate={isExpanded ? "expanded" : "peek"}
        variants={{
          peek: { y: '80%' },
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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] rounded-t-[1rem] p-2 pb-8 cursor-grab active:cursor-grabbing flex flex-col h-[85vh]"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex flex-col items-center pb-4 group shrink-0"
        >
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-2 group-hover:bg-blue-500 transition-colors" />
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-blue-500 transition-colors">
            {isExpanded ? 'Slide Down to Map' : 'Slide Up for List'}
          </div>
        </button>

        <div className="max-w-md mx-auto w-full flex-1 flex flex-col overflow-hidden px-2">
          {!hasArrived ? (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 mb-4 shadow-sm text-center">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">Group Collection Route</h3>
                <p className="text-xs text-slate-500">Navigating to {orders.length} sellers</p>
              </div>
              <button
                onClick={handleConfirmArrival}
                className="w-full py-5 bg-blue-600 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all group tracking-widest shadow-lg shadow-blue-500/20"
              >
                <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                I HAVE ARRIVED AT LOCATION
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* SEARCH BAR */}
              <div className="relative mb-4 shrink-0">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by Klin ID, Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-10 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>

              {/* LIST */}
              <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                <div className="space-y-3">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-slate-500 font-medium">No sellers found matching search.</p>
                    </div>
                  ) : (
                    filteredOrders.map(order => {
                      const seller = order.proposal?.seller;
                      const isDone = ['pickup_completed', 'completed', 'in_transit', 'delivered'].includes(order.status);

                      return (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                              isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                              {seller?.name ? seller.name.charAt(0) : '?'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 dark:text-white truncate text-sm">{seller?.company_name || seller?.name || 'Seller'}</h4>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1.5">
                                <span className="font-mono text-slate-400">{seller?.klinflow_id}</span>
                                <span>•</span>
                                <span>{order.proposal?.offered_weight}kg expected</span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="shrink-0 ml-3">
                            {isDone ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Paid</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setIsVerificationModalOpen(true);
                                }}
                                className="px-4 py-2 bg-amber-500 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg active:scale-95 transition-transform shadow-md shadow-amber-500/20"
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* FIXED BOTTOM BUTTON IF ALL COMPLETED */}
              <div className="absolute bottom-6 left-4 right-4 max-w-md mx-auto">
                <button
                  onClick={handleCompleteGroupPickup}
                  className={`w-full py-4 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                    allCompleted 
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20 active:scale-95' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                  disabled={!allCompleted}
                >
                  <PackageCheck className="w-5 h-5" />
                  {allCompleted ? 'Complete Group Pickup' : 'Verify All Sellers to Finish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {isVerificationModalOpen && selectedOrder && (
        <VerificationWorkflowModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            fetchOrders(); // Refresh order status to show "Paid"
          }}
          order={selectedOrder}
        />
      )}
    </div>
  );
}
