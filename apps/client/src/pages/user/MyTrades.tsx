/**
 * My Trades & Offers Page — unified dashboard for marketplace bids and waste trades
 */
import { useState, useEffect } from "react";
import {
  Clock, CheckCircle2, Truck, XCircle, Zap, HandCoins, Store, Info, ChevronDown, ChevronUp, Tag, Coins, Scale, MapPin, ArrowLeft, Trash2, Check, X, MessageSquareQuote, Package, User, ChevronRight, Search, Filter, Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { useMarketplaceStore } from "@klinflow/core/stores/marketplaceStore";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { WASTE_TYPES } from "@klinflow/core/data/mockData";
import { supabase } from "@klinflow/supabase";
import { getThumbnailUrl } from "@klinflow/core/utils/imageUtils";
import { OptimizedImage } from "@klinflow/ui";
import EmptyState from "@klinflow/ui/components/EmptyState";
import { toast } from "sonner";
import { Booking, MarketplaceOffer } from "@klinflow/core/validation";

const statusConfig = {
  completed: { label: "Settled", color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400", icon: CheckCircle2 },
  "in-progress": { label: "In Transit", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: Truck },
  pending: { label: "Waiting Agent", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Clock },
  confirmed: { label: "Trade Active", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400", icon: HandCoins },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400", icon: XCircle },
  counter_offer_pending: { label: "Action Required", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400", icon: Zap },
};

const TABS = [
  { id: "Bids", label: "Bids" },
  { id: "Active", label: "Active" },
  { id: "Counters", label: "Counters" },
  { id: "History", label: "History" }
];

const TradeCounter = ({ count, active }: { count: number; active: boolean }) => (
  <span className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-all ${active ? "bg-emerald-600 text-white scale-110 shadow-sm shadow-emerald-500/30" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
    {count}
  </span>
);

const MATERIAL_LABELS = {
  plastic: "Plastic Bottles",
  paper: "Paper & Card",
  metal: "Scrap Metal",
  glass: "Glass Containers",
  organic: "Organic Waste",
  ewaste: "Electronic Waste",
  "e-waste": "Electronic Waste",
  electronic: "Electronic Waste",
  recyclable: "Mixed Recyclables",
  general: "General Stock",
  bulky: "Bulky Items",
  appliances: "Large Appliances",
};

const formatMaterial = (val: string | null) => {
  if (!val) return "Premium Load";
  const slug = val.toLowerCase();
  if ((MATERIAL_LABELS as any)[slug]) return (MATERIAL_LABELS as any)[slug];
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val) || (/^[0-9a-f]{15,}$/i.test(val) && !val.includes(" "));
  if (isUUID) return "Recyclable Load";
  return val.replace(/-/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
};

const TIME_SLOTS = [
  { id: "morning", label: "09:00 AM", value: "09:00 AM" },
  { id: "noon", label: "12:00 PM", value: "12:00 PM" },
  { id: "afternoon", label: "04:00 PM", value: "04:00 PM" },
];

export default function MyTrades() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { bookings, fetchBookings, cancelBooking, rescheduleBooking } = useBookingStore();
  const { receivedOffers, fetchIncomingOffers, acceptOffer, declineOffer, subscribeToReceivedOffers } = useMarketplaceStore();

  const [activeTab, setActiveTab] = useState("Bids");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedCounterId, setExpandedCounterId] = useState<string | null>(null);
  const [reschedulingTrade, setReschedulingTrade] = useState<any>(null);
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [newTime, setNewTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'cancelTrade' | 'declineOffer' | 'rejectCounter', id: string, title: string, message: string } | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchIncomingOffers();
    const channel = subscribeToReceivedOffers(profile?.id || "");
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleAccept = async (offer: MarketplaceOffer) => {
    try {
      await acceptOffer(offer);
      toast.success("Offer accepted! Trade initiated.");
      setSelectedOfferId(null);
      await fetchBookings();
      setActiveTab("Active");
    } catch (err) {
      toast.error("Failed to accept offer");
    }
  };

  const handleDeclineConfirm = async (offerId: string) => {
    try {
      await declineOffer(offerId);
      setSelectedOfferId(null);
      toast.info("Offer declined");
    } catch (err) {
      toast.error("Failed to decline offer");
    }
  };

  const pendingOffers = (receivedOffers || [])
    .filter((o) => o.status === "pending")
    .filter((o) => !searchQuery || o.material?.toLowerCase().includes(searchQuery.toLowerCase()) || o.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  
  const activeBookings = bookings.filter((b: any) => ["pending", "confirmed", "scheduled", "in-progress"].includes(b.status));
  const counterBookings = bookings.filter((b: any) => b.status === "counter_offer_pending");
  const historyBookings = bookings.filter((b: any) => ["completed", "cancelled"].includes(b.status));

  const filteredBookings = bookings.filter((b: any) => {
    if (activeTab === "Active") return ["pending", "confirmed", "scheduled", "in-progress"].includes(b.status);
    if (activeTab === "Counters") return b.status === "counter_offer_pending";
    if (activeTab === "History") return ["completed", "cancelled"].includes(b.status);
    return false;
  }).filter((b: any) => {
    if (!searchQuery) return true;
    const s = searchQuery.toLowerCase();
    const materialVal = b.wasteType;
    const wasteLabel = WASTE_TYPES?.find?.((w: any) => w.slug === materialVal || w.id === materialVal)?.label || materialVal;
    return (
      (wasteLabel && wasteLabel.toLowerCase().includes(s)) ||
      (b.estate && b.estate.toLowerCase().includes(s)) ||
      (b.id && b.id.toLowerCase().includes(s))
    );
  }).filter((v: any, i: number, a: any[]) => a.findIndex((t) => t.id === v.id) === i).slice(0, activeTab === "History" ? 20 : undefined);

  const selectedOffer = receivedOffers?.find((o: MarketplaceOffer) => o.id === selectedOfferId);

  const handleCancel = (id: string) => {
    cancelBooking(id);
    setActiveTab("History");
    toast.success("Trade Cancelled", { description: `Trade has been moved to history.` });
  };

  const handleAcceptCounterOffer = async (b: Booking) => {
    try {
      const { error } = await supabase.rpc("complete_booking_trade_payout", {
        p_booking_id: b.id,
        p_actual_weight: b.actualWeightKg || b.bags || 0,
        p_payout_amount: b.counterOfferAmount || 0,
      });
      if (error) throw error;
      toast.success("Counter-Offer Accepted", { description: "Funds have been transferred to your wallet." });
      fetchBookings();
      setActiveTab("History");
    } catch (error) {
      toast.error("Failed to accept offer", { description: error instanceof Error ? error.message : "An unknown error occurred" });
    }
  };

  const handleRejectCounterConfirm = async (id: string) => {
    cancelBooking(id);
    toast.info("Trade Cancelled", { description: "The counter-offer was rejected." });
    fetchBookings();
    setActiveTab("History");
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingTrade) return;
    setIsSubmitting(true);
    try {
      const result = await rescheduleBooking(reschedulingTrade.id, newDate, newTime, {
        wasteType: reschedulingTrade.wasteType, weight: reschedulingTrade.actualWeightKg || reschedulingTrade.bags,
        estate: reschedulingTrade.estate, latitude: reschedulingTrade.latitude, longitude: reschedulingTrade.longitude,
        notes: reschedulingTrade.notes, agentId: reschedulingTrade.agentId, photoUrl: reschedulingTrade.photoUrl,
      });

      if (result.success) {
        toast.success("Trade Rescheduled!", { description: `Your pickup is now set for ${newDate} at ${newTime}.` });
        setReschedulingTrade(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast.error("Reschedule failed", { description: err.message || "Failed to reschedule" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {!selectedOfferId && !expandedId && !reschedulingTrade && (
        <div className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] px-4 border-b border-slate-200 dark:border-slate-800 z-50 transition-colors">
          <div className="max-w-lg mx-auto space-y-1.5">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">Trades & Offers</h1>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                  View your Market offers and trade activities
                </p>
              </div>
            </div>

            {/* SEARCH & FILTER BAR */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search materials, locations, or names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:font-medium placeholder:text-slate-400"
                />
              </div>
              <button className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary transition-colors active:scale-95">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-2">
              {TABS.map((tab) => {
                const count = tab.id === "Bids" ? pendingOffers.length : tab.id === "Active" ? activeBookings.length : tab.id === "Counters" ? counterBookings.length : historyBookings.length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-1 rounded-xl text-[9px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all border shrink-0 ${activeTab === tab.id
                      ? "bg-primary text-white border-transparent"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] leading-none ${activeTab === tab.id
                      ? "bg-white/25 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 space-y-0 pb-24 ${!selectedOfferId && !expandedId && !reschedulingTrade ? "pt-[calc(env(safe-area-inset-top,1rem)+8rem)]" : "pt-0"} relative max-w-lg mx-auto w-full`}>
        
        {/* BIDS VIEW */}
        {activeTab === "Bids" && !selectedOfferId && (
          <motion.div key="bids-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {pendingOffers.length === 0 ? (
              <div className="pt-10">
                <EmptyState icon={MessageSquareQuote} title="No active bids yet" subtitle="You have no pending offers from buyers." />
              </div>
            ) : (
              pendingOffers.map((offer) => (
                <motion.div key={offer.id} onClick={() => setSelectedOfferId(offer.id)} className="bg-white dark:bg-slate-900/60 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  <div className="flex gap-3 pl-4 pr-3.5 py-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                      {offer.photo ? <OptimizedImage src={getThumbnailUrl(offer.photo, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" /> : <Package className="w-5 h-5 text-slate-200" />}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize truncate tracking-tight">{offer.material}</h3>
                          <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 flex items-center gap-0.5 shrink-0">BID</span>
                          {(offer.listing?.pickupMode === 'dropoff' || offer.listing?.pickup_mode === 'dropoff') && (
                            <span className="px-1 py-0.5 rounded text-[8px] font-semibold bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 flex items-center gap-0.5 shrink-0"><Home className="w-2.5 h-2.5" />DROP-OFF</span>
                          )}
                        </div>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">KSh {offer.offeredPrice}/kg</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[11px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]"><User className="w-3 h-3 text-slate-400" /> {offer.buyerName || "Buyer"}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0"><Clock className="w-2.5 h-2.5 text-slate-400" /> {offer.createdAt ? new Date(offer.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}</p>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0"><span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">Qty:</span><Scale className="w-2.5 h-2.5" /> {offer.quantity} KG</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-center text-slate-300"><ChevronRight className="w-4 h-4" /></div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* OFFER DETAIL VIEW */}
        <AnimatePresence mode="wait">
          {selectedOfferId && selectedOffer && (
            <motion.div key="offer-focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-0 left-0 right-0 bottom-[64px] z-[50] bg-slate-50 dark:bg-slate-800 flex flex-col">
              <div className="fixed top-0 left-0 right-0 z-[51] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                  <button onClick={() => setSelectedOfferId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Offer Details</h1>
                    <p className="text-[10px] font-bold text-emerald-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Incoming Bid</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-14">
                <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                  {selectedOffer.photo ? <OptimizedImage src={getThumbnailUrl(selectedOffer.photo, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400"><Package className="w-12 h-12 mb-2 opacity-50" /><span className="text-[10px] font-bold tracking-widest uppercase">No photo provided</span></div>}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material Type</p>
                        <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">{selectedOffer.material}</h2>
                      </div>
                      {(selectedOffer.listing?.pickupMode === 'dropoff' || selectedOffer.listing?.pickup_mode === 'dropoff') ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20">
                          <Home className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Self Drop-off</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-500 border border-amber-200 dark:border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Pending</span>
                        </div>
                      )}
                    </div>
                    <hr className="border-slate-100 dark:border-slate-800/60" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3"><User className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Agent Name</p><p className="text-xs font-black text-slate-900 dark:text-white capitalize">{selectedOffer.buyerName}</p></div></div>
                      <div className="flex items-start gap-3"><Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Agent Bid</p><p className="text-xs font-black text-emerald-600 leading-none">KSh {selectedOffer.offeredPrice}/kg</p></div></div>
                      <div className="flex items-start gap-3"><Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Requested Volume</p><p className="text-xs font-black text-slate-900 dark:text-white capitalize">{selectedOffer.quantity} KG</p></div></div>
                      <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pickup Location</p><span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[120px]">{selectedOffer.listing?.location || "Nairobi Hub"}</span></div></div>
                      <div className="flex items-start gap-3"><Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Time Sent</p><span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{selectedOffer.createdAt ? new Date(selectedOffer.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Just now"}</span></div></div>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-600 dark:bg-emerald-700 p-2 rounded-xl border border-emerald-500/20 flex flex-col justify-center text-center">
                  <p className="text-[10px] font-bold text-white dark:text-slate-200 capitalize tracking-widest mb-1">Expected Value</p>
                  <p className="text-xl font-black text-white dark:text-white leading-none">KSh {(parseFloat(selectedOffer.listing?.pricePerKg || '0') * parseFloat(selectedOffer.listing?.quantity || '0')).toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-200 dark:text-emerald-100 font-bold capitalize mt-1.5">{selectedOffer.listing?.pricePerKg} × {selectedOffer.listing?.quantity}kg Total Stock</p>
                </div>
                <div className="bg-green-600 dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-50 capitalize tracking-widest mb-3">Bid Comparison</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-100">Your Asking Price</span><span className="text-xs font-semibold text-slate-100 dark:text-white">KSh {selectedOffer.listing?.pricePerKg || "N/A"}/kg</span></div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-100">Buyer's Bid</span><span className="text-xs font-semibold text-emerald-200">KSh {selectedOffer.offeredPrice}/kg</span></div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-100">Difference</span>{(() => { const diff = (selectedOffer.offeredPrice || 0) - parseFloat(selectedOffer.listing?.pricePerKg || '0'); return (<span className={`text-xs font-semibold ${diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{diff >= 0 ? "+" : ""}{diff.toFixed(2)}/kg</span>); })()}</div>
                    <div className="h-px bg-slate-100 dark:bg-slate-700" />
                    <div className="flex items-center justify-between pt-1"><div className="flex flex-col"><span className="text-xs font-bold text-slate-100 dark:text-white capitalize tracking-widest">Your Pay</span><span className="text-[10px] font-semibold text-slate-200">KSh {selectedOffer.offeredPrice} × {selectedOffer.quantity}kg</span></div><span className="text-sm font-black text-emerald-200">KSh {(selectedOffer.offeredPrice * selectedOffer.quantity).toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setConfirmAction({ type: 'declineOffer', id: selectedOffer.id, title: 'Decline Offer', message: 'Are you sure you want to decline this bid?' })} className="flex-1 py-4 bg-red-600 text-white border border-rose-100 dark:border-rose-900/30 rounded-2xl font-semibold text-xs capitalize tracking-widest active:scale-[0.97] transition-all">Decline</button>
                  <button onClick={() => handleAccept(selectedOffer)} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-semibold text-xs capitalize tracking-[0.2em] active:scale-[0.97] transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Accept Offer</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ACTIVE, COUNTERS, HISTORY VIEW */}
        {activeTab !== "Bids" && !selectedOfferId && (
          <motion.div key="trades-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-0 pb-32">
            {filteredBookings.length === 0 ? (
              <div className="pt-10">
                <EmptyState icon={Store} title={`No ${activeTab.toLowerCase()} trades`} subtitle={activeTab === "History" ? "No history in your ledger yet." : activeTab === "Active" ? "You have no active recyclable postings." : "No counters pending."} />
              </div>
            ) : (
              <div className="space-y-0">
                {filteredBookings.map((b: any) => {
                  const materialVal = b.wasteType;
                  const waste = WASTE_TYPES?.find?.((w: any) => w.slug === materialVal || w.id === materialVal);
                  const status = (statusConfig as any)[b.status] || (statusConfig as any).pending;
                  const isCounterOpen = expandedCounterId === b.id;

                  if (activeTab === "Counters") {
                    return (
                      <div key={b.id} className="bg-white dark:bg-slate-900/60 shadow-sm border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                        <button onClick={() => setExpandedCounterId(isCounterOpen ? null : b.id)} className="w-full p-4 pl-5 flex items-center gap-4 text-left active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-xl shrink-0 border border-slate-100 dark:border-slate-700">
                              {b.photoUrl ? <OptimizedImage src={getThumbnailUrl(b.photoUrl, { width: 100 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" /> : <span>{waste?.icon || "📦"}</span>}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${status.color.split(' ')[0]} ${status.color.split(' ')[1]}`}>
                              <status.icon className="w-3 h-3" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize truncate">{waste?.label || formatMaterial(materialVal)}</h3>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                Counter Offer
                              </span>
                            </div>
                            <div className="flex items-end justify-between">
                              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate mb-0.5">{b.date || new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 line-through">
                                  KSh {(b.totalPrice || b.amount || 0).toLocaleString()}
                                </span>
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 leading-none mt-0.5">
                                  KSh {(b.counterOfferAmount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${isCounterOpen ? "rotate-180" : ""}`} />
                        </button>
                        <AnimatePresence>
                          {isCounterOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-800/50 mt-1">
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
                                  <div className="flex items-center gap-2 mb-2"><Zap className="w-4 h-4 text-amber-500" /><p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Agent proposes new terms:</p></div>
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Weight</p><p className="text-xs font-black text-slate-800 dark:text-white">{b.actualWeightKg} kg</p></div>
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-amber-100 dark:border-amber-800/30"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Value</p><p className="text-xs font-black text-emerald-600">KSh {b.counterOfferAmount}</p></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button onClick={() => setConfirmAction({ type: 'rejectCounter', id: b.id, title: 'Reject Counter', message: 'Are you sure you want to reject the new terms?' })} className="flex-1 py-2 bg-white dark:bg-slate-800 text-rose-600 font-bold text-[10px] uppercase tracking-widest rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">Reject</button>
                                    <button onClick={() => handleAcceptCounterOffer(b)} className="flex-1 py-2 bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-sm hover:bg-emerald-700 transition-colors">Accept</button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  // ACTIVE & HISTORY
                  const accentColor = b.status === 'completed' ? 'bg-emerald-500' : b.status === 'cancelled' ? 'bg-rose-500' : b.status === 'confirmed' ? 'bg-emerald-500' : b.status === 'in-progress' ? 'bg-blue-500' : 'bg-amber-500';
                  return (
                    <motion.div key={b.id} onClick={() => { setExpandedId(b.id); }} className="bg-white dark:bg-slate-900/60 shadow-sm border-b border-slate-100 dark:border-slate-800 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer relative overflow-hidden">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor}`} />
                      <div className="flex gap-3 relative z-10 pl-4 pr-3.5 py-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-2xl shrink-0 border border-slate-100 dark:border-slate-700">
                          {b.photoUrl ? <OptimizedImage src={getThumbnailUrl(b.photoUrl, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" /> : <span>{waste?.icon || "📦"}</span>}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-[14px] font-semibold text-slate-900 dark:text-white capitalize truncate tracking-tight">{waste?.label || formatMaterial(materialVal)}</h3>
                            </div>
                            <span className={`text-sm font-black tracking-tighter shrink-0 ml-2 ${b.status === 'cancelled' ? 'text-slate-400 line-through' : 'text-emerald-600 dark:text-emerald-400'}`}>KSh {(b.totalPrice || b.amount || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            {b.bookingType === 'dropoff' ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 shrink-0">
                                <Home className="w-2.5 h-2.5" />
                                <span className="mt-px">DROP-OFF</span>
                              </div>
                            ) : (
                              <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${status.color} shrink-0`}>
                                <status.icon className="w-2.5 h-2.5" />
                                <span className="mt-px">{status.label}</span>
                              </div>
                            )}
                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[100px]"><MapPin className="w-3 h-3 inline mr-0.5" /> {b.estate || "Pickup"}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0"><Clock className="w-2.5 h-2.5 text-slate-400" /> {b.date || new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0"><span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">Qty:</span><Scale className="w-2.5 h-2.5" /> {b.actualWeightKg || b.bags || 0} KG</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-center text-slate-300"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ACTIVE TRADE FULL SCREEN VIEW */}
        <AnimatePresence>
          {expandedId && !reschedulingTrade && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed top-0 left-0 right-0 bottom-0 z-[60] bg-slate-50 dark:bg-slate-800 flex flex-col">
              {(() => {
                const b = bookings.find((bk) => bk.id === expandedId);
                if (!b) return null;
                const materialVal = b.wasteType;
                const waste = WASTE_TYPES?.find?.((w: any) => w.slug === materialVal || w.id === materialVal);
                const status = (statusConfig as any)[b.status] || (statusConfig as any).pending;

                return (
                  <>
                    <div className="fixed top-0 left-0 right-0 z-[61] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                      <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <button onClick={() => setExpandedId(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0">
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                          </button>
                          <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">Trade Summary</h1>
                            <p className="text-[10px] font-bold text-emerald-500 capitalize tracking-widest flex items-center gap-1.5 mt-0.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Trade</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-3 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+5rem)]">
                      <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                        {b.photoUrl ? <OptimizedImage src={getThumbnailUrl(b.photoUrl, { width: 800 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400"><div className="text-5xl mb-3">{waste?.icon || "📦"}</div><p className="text-[10px] font-bold tracking-widest uppercase">No photo attached</p></div>}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                      </div>
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Material</p>
                            <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">{waste?.label || formatMaterial(materialVal)}</h2>
                          </div>
                          {b.bookingType === 'dropoff' ? (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border border-violet-200 dark:border-violet-500/20`}>
                              <Home className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">Self Drop-off</span>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${status.color} border border-current/20 bg-current/10`}>
                              <status.icon className="w-3.5 h-3.5" /><span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">{status.label}</span>
                            </div>
                          )}
                        </div>
                        <hr className="border-slate-100 dark:border-slate-800/60" />
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-start gap-3"><Tag className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Trade ID</p><p className="text-xs font-black text-slate-900 dark:text-white font-mono uppercase">CF-{b.id?.slice(0, 8)}</p></div></div>
                          <div className="flex items-start gap-3"><Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Trade Value</p><p className="text-xs font-black text-emerald-600 leading-none">KSh {(b.totalPrice || b.amount || 0).toLocaleString()}</p></div></div>
                          <div className="flex items-start gap-3"><Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Quantity</p><p className="text-xs font-black text-slate-900 dark:text-white capitalize">{b.actualWeightKg || b.bags || 0} KG</p></div></div>
                          <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /><div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p><span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[120px]">{b.estate || "Pickup point"}</span></div></div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest">Material Description</p>
                        <p className={`text-sm ${b.notes && !b.notes.startsWith("Marketplace trade") ? "text-slate-800 dark:text-slate-200 leading-relaxed font-medium" : "text-slate-400 dark:text-slate-500 italic"}`}>{b.notes && !b.notes.startsWith("Marketplace trade") ? b.notes : "No description provided."}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                        <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Scheduled</span><span className="text-xs font-bold text-slate-900 dark:text-white">{b.date || new Date(b.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span></div>
                        {b.time && <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Time</span><span className="text-xs font-bold text-slate-900 dark:text-white">{b.time}</span></div>}
                        {b.estate && <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Location</span><span className="text-xs font-bold text-slate-900 dark:text-white capitalize">{b.estate}</span></div>}
                      </div>

                      {!["completed", "cancelled"].includes(b.status) && (
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button onClick={() => setConfirmAction({ type: 'cancelTrade', id: b.id, title: 'Cancel Trade', message: 'Are you sure you want to cancel this trade?' })} className="flex items-center justify-center gap-2 py-3.5 bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-900/30 rounded-2xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all shadow-sm">
                            <Trash2 className="w-3.5 h-3.5" /> Cancel Trade
                          </button>
                          <button onClick={() => setReschedulingTrade(b)} className="flex items-center justify-center gap-2 py-3.5 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-900/30 rounded-2xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all shadow-sm">
                            <Clock className="w-3.5 h-3.5" /> Reschedule
                          </button>
                        </div>
                      )}

                      <button onClick={() => setExpandedId(null)} className="w-full py-4 bg-slate-900 dark:bg-slate-700 text-slate-100 border border-slate-800 dark:border-slate-600 rounded-2xl font-bold text-[10px] capitalize tracking-[0.2em] active:scale-95 transition-all shadow-sm">
                        Back to Trades
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONFIRMATION MODAL */}
        <AnimatePresence>
          {confirmAction && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-2">
                    <Trash2 className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="font-bold text-xl text-slate-900 dark:text-white">{confirmAction.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{confirmAction.message}</p>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <button onClick={() => setConfirmAction(null)} className="py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all">Keep It</button>
                  <button onClick={() => {
                    if (confirmAction.type === 'cancelTrade') {
                      handleCancel(confirmAction.id);
                      setExpandedId(null);
                    } else if (confirmAction.type === 'declineOffer') {
                      handleDeclineConfirm(confirmAction.id);
                    } else if (confirmAction.type === 'rejectCounter') {
                      handleRejectCounterConfirm(confirmAction.id);
                    }
                    setConfirmAction(null);
                  }} className="py-3.5 rounded-xl font-bold text-white bg-rose-600 active:scale-95 transition-all shadow-sm shadow-rose-600/20">Yes, Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* RESCHEDULE MODAL */}
        <AnimatePresence>
          {reschedulingTrade && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end justify-center">
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden shadow-2xl pb-[env(safe-area-inset-bottom,0px)] border-t border-slate-200 dark:border-slate-800">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div><h3 className="font-bold text-lg text-slate-900 dark:text-white">Reschedule Pickup</h3><p className="text-xs text-slate-500 dark:text-slate-400">Choose a new date and time.</p></div>
                  <button onClick={() => setReschedulingTrade(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 active:scale-95 transition-transform"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-5 space-y-5">
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">New Date</label><input type="date" value={newDate} min={new Date().toLocaleDateString("en-CA")} onChange={(e) => setNewDate(e.target.value)} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" /></div>
                  <div className="space-y-3"><label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">New Time Window</label><div className="grid grid-cols-3 gap-2">{TIME_SLOTS.map((slot) => (<button key={slot.id} onClick={() => setNewTime(slot.value)} className={`py-3 rounded-xl text-xs font-bold transition-all border ${newTime === slot.value ? "bg-primary text-white border-primary shadow-md shadow-primary/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"}`}>{slot.label}</button>))}</div></div>
                  <button onClick={handleRescheduleSubmit} disabled={isSubmitting} className="w-full py-4 mt-2 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? "Updating..." : "Confirm Schedule"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
