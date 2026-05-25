import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, PackageCheck, MapPin, Phone, Truck, ShieldCheck, Clock, CheckCircle2, Eye, Info, Navigation, Activity } from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { format } from 'date-fns';

const STATUS_PIPELINE = [
  'agent_assigned',
  'agent_on_the_way',
  'arrived',
  'pickup_completed',
  'in_transit',
  'delivered',
];

const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'pending_coordination': return { label: 'Pending', color: 'bg-amber-100 text-amber-700' };
    case 'pickup_scheduled': return { label: 'Scheduled', color: 'bg-blue-100 text-blue-700' };
    case 'agent_assigned': return { label: 'Assigned', color: 'bg-indigo-100 text-indigo-700' };
    case 'agent_on_the_way': return { label: 'En Route', color: 'bg-purple-100 text-purple-700' };
    case 'arrived': return { label: 'Arrived', color: 'bg-emerald-100 text-emerald-700' };
    case 'pickup_completed': return { label: 'Picked Up', color: 'bg-teal-100 text-teal-700' };
    case 'in_transit': return { label: 'In Transit', color: 'bg-sky-100 text-sky-700' };
    case 'delivered': return { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700' };
    case 'material_verification': return { label: 'Verifying', color: 'bg-orange-100 text-orange-700' };
    default: return { label: status?.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-700' };
  }
};

export default function ActivePickupDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isCompanyAdmin = profile?.agentAccountType === 'company_admin';

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('fulfillment_orders')
        .select(`
          *,
          rfq:rfqs(*),
          proposal:rfq_offers(*, seller:profiles!rfq_offers_seller_id_fkey(name, company_name)),
          agent:profiles!fulfillment_orders_assigned_agent_id_fkey(name, phone, avatar_url),
          verifications:material_verifications(*)
        `)
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setOrder(data);
      }
      setLoading(false);
    };

    fetchOrder();

    if (id) {
      const channel = supabase.channel(`fulfillment_${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'fulfillment_orders',
          filter: `id=eq.${id}`
        }, () => {
          fetchOrder();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeImageIndex) {
      setActiveImageIndex(newIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-800">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-800 p-4">
        <PackageCheck className="w-12 h-12 text-slate-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Pickup Not Found</h2>
        <button onClick={() => navigate(-1)} className="px-6 py-2 bg-blue-500 text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  const statusConfig = getStatusDisplay(order.status);
  const verification = order.verifications?.[0]; // Assuming one verification per order for simplicity
  const images = verification?.photos || order.rfq?.images || [];

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-slate-50 dark:bg-slate-800 pb-16 transition-colors">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-amber-500 transition-colors" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Pickup Details</h1>
            <p className="text-[10px] font-bold text-amber-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Live Monitoring
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)]">
        {/* ── IMAGE CAROUSEL ── */}
        {images.length > 0 && (
          <div className="relative h-[250px] w-full overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm bg-slate-900">
            <div
              onScroll={handleScroll}
              className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
            >
              {images.map((url: string, index: number) => (
                <div key={index} className="w-full h-full shrink-0 snap-center">
                  <img
                    src={url}
                    alt={`Pickup photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

            {images.length > 1 && (
              <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                <span>{activeImageIndex + 1} / {images.length}</span>
                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}

            {images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {images.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === activeImageIndex ? 'w-4 bg-emerald-500' : 'w-1.5 bg-white/40'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ORDER DETAILS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Info className="w-4 h-4" /> Pickup Details
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Material Requested</p>
              <h2 className="text-[15px] font-black text-slate-900 dark:text-white capitalize leading-tight">{order.rfq?.category || 'Material'}</h2>
            </div>
            
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Volume</p>
              <p className="text-[15px] font-black text-emerald-600 leading-none">{order.proposal?.offered_weight}kg</p>
            </div>

            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Seller Name</p>
              <p className="text-[13px] font-bold text-slate-900 dark:text-white capitalize leading-tight">
                {order.proposal?.seller?.company_name || order.proposal?.seller?.name || 'Unknown Seller'}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Offer Price</p>
              <p className="text-[13px] font-bold text-emerald-600 leading-tight">
                KSh {order.proposal?.offered_price}
              </p>
            </div>

            <div className="col-span-2 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p>
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">{order.pickup_address || order.rfq?.pickup_area || 'Address not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TRACKING PROGRESS (Horizontal) ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800/40 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4" /> Live Progress
            </h3>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>

          {/* Row 1: Steps 1-3 */}
          <div className="flex items-start relative mb-6">
            {STATUS_PIPELINE.slice(0, 3).map((step, i) => {
              const currentIdx = STATUS_PIPELINE.indexOf(order.status);
              const isCompleted = i < currentIdx || currentIdx === -1 && ['completed', 'delivered'].includes(order.status);
              const isCurrent = i === currentIdx;
              const stepDisplay = getStatusDisplay(step);
              return (
                <div key={step} className="flex flex-col items-center flex-1 relative">
                  {i < 2 && (
                    <div className={`absolute top-2.5 left-[50%] w-full h-[2px] ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ zIndex: 0 }} />
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 mb-2 relative z-10 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                    isCurrent ? 'bg-white border-blue-500 dark:bg-slate-900 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 
                    'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                  }`} />
                  <p className={`text-[9px] font-bold text-center uppercase tracking-wider leading-tight transition-colors px-1 ${
                    isCompleted ? 'text-slate-900 dark:text-white' :
                    isCurrent ? 'text-blue-600 dark:text-blue-400' :
                    'text-slate-400'
                  }`}>
                    {stepDisplay.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Row 2: Steps 4-6 */}
          <div className="flex items-start relative">
            {STATUS_PIPELINE.slice(3).map((step, i) => {
              const realIdx = i + 3;
              const currentIdx = STATUS_PIPELINE.indexOf(order.status);
              const isCompleted = realIdx < currentIdx || currentIdx === -1 && ['completed', 'delivered'].includes(order.status);
              const isCurrent = realIdx === currentIdx;
              const stepDisplay = getStatusDisplay(step);
              return (
                <div key={step} className="flex flex-col items-center flex-1 relative">
                  {i < 2 && (
                    <div className={`absolute top-2.5 left-[50%] w-full h-[2px] ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} style={{ zIndex: 0 }} />
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 transition-all duration-300 mb-2 relative z-10 ${
                    isCompleted ? 'bg-emerald-500 border-emerald-500' : 
                    isCurrent ? 'bg-white border-blue-500 dark:bg-slate-900 shadow-[0_0_0_4px_rgba(59,130,246,0.2)]' : 
                    'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                  }`} />
                  <p className={`text-[9px] font-bold text-center uppercase tracking-wider leading-tight transition-colors px-1 ${
                    isCompleted ? 'text-slate-900 dark:text-white' :
                    isCurrent ? 'text-blue-600 dark:text-blue-400' :
                    'text-slate-400'
                  }`}>
                    {stepDisplay.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>



        {/* ── AGENT INFO ── */}
        {order.agent && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-100 dark:border-slate-800/40 shadow-sm flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {order.agent.avatar_url ? (
                  <img src={order.agent.avatar_url} alt="Agent" className="w-full h-full object-cover" />
                ) : (
                  '👤'
                )}
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned Agent</p>
                <p className="text-sm font-black text-slate-900 dark:text-white leading-none">{order.agent.name}</p>
              </div>
            </div>
            {order.agent.phone && (
              <a href={`tel:${order.agent.phone}`} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-blue-500 flex items-center justify-center active:scale-95 transition-all">
                <Phone className="w-5 h-5" />
              </a>
            )}
          </div>
        )}

        {/* ── VERIFICATION DATA (If Available) ── */}
        {verification && (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-800/40 shadow-sm space-y-4">
            <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Verified Material Info
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest mb-0.5">Verified Weight</p>
                <h2 className="text-[15px] font-black text-emerald-700 dark:text-emerald-400 capitalize leading-tight">{verification.verified_weight}kg</h2>
              </div>
              
              <div>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest mb-0.5">Quality Grade</p>
                <p className="text-[15px] font-black text-emerald-700 dark:text-emerald-400 leading-none capitalize">{verification.quality_grade}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
