/**
 * My Trades Page — list of user's waste trades with marketplace status
 */
import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CalendarClock,
  Zap,
  HandCoins,
  ArrowRight,
  Store,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  Coins,
  Scale,
  MapPin,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingStore } from "@klinflow/core/stores/bookingStore";
import { WASTE_TYPES } from "@klinflow/core/data/mockData";
import { supabase } from "@klinflow/supabase";
import { getThumbnailUrl } from "@klinflow/core/utils/imageUtils";
import { OptimizedImage } from "@klinflow/ui";
import EmptyState from "@klinflow/ui/components/EmptyState";
import { toast } from "sonner";

const statusConfig = {
  completed: {
    label: "Settled",
    color:
      "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
    icon: CheckCircle2,
  },
  "in-progress": {
    label: "In Transit",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    icon: Truck,
  },
  pending: {
    label: "Waiting Approval",
    color:
      "bg-amber-100 text-orange-700 dark:bg-amber-500/20 dark:text-amber-400",
    icon: Clock,
  },
  confirmed: {
    label: "Trade Active",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    icon: HandCoins,
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
    icon: Clock,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
    icon: XCircle,
  },
  counter_offer_pending: {
    label: "Action Required",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
    icon: Zap,
  },
};

const TABS = ["Active", "Settled", "Cancelled"];

const TradeCounter = ({
  count,
  active,
}: {
  count: number;
  active: boolean;
}) => (
  <span
    className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full transition-all ${
      active
        ? "bg-emerald-600 text-white scale-110 shadow-sm shadow-emerald-500/30"
        : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
    }`}
  >
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

  // Smart ID Detection: Only flag long hexadecimal strings (UUIDs)
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      val,
    ) ||
    (/^[0-9a-f]{15,}$/i.test(val) && !val.includes(" "));

  if (isUUID) {
    return "Recyclable Load";
  }

  // Clean up hyphens and capitalize
  return val
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const TIME_SLOTS = [
  { id: "morning", label: "09:00 AM", value: "09:00 AM" },
  { id: "noon", label: "12:00 PM", value: "12:00 PM" },
  { id: "afternoon", label: "04:00 PM", value: "04:00 PM" },
];

const to12h = (time24: string | null) => {
  if (!time24 || typeof time24 !== "string" || !time24.includes(":"))
    return time24 || "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  const hours = parts[0];
  const minutes = parts[1];
  const h = parseInt(hours || "0");
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
};

const to24h = (time12: string | null) => {
  if (!time12 || typeof time12 !== "string") return "";
  const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match || !match[1] || !match[2] || !match[3]) return "";
  let h = parseInt(match[1] || "0");
  const m = match[2];
  const ampm = (match[3] || "").toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m}`;
};

export default function MyTrades() {
  const navigate = useNavigate();
  const {
    bookings,
    fetchBookings,
    cancelBooking,
    clearBookingHistory,
    rescheduleBooking,
  } = useBookingStore();
  const [activeTab, setActiveTab] = useState("Active");
  const [expandedId, setExpandedId] = useState<string | null>(null); // For active trade full-screen
  const [expandedSettledId, setExpandedSettledId] = useState<string | null>(
    null,
  ); // For settled dropdown
  const [reschedulingTrade, setReschedulingTrade] = useState<any>(null);
  const [newDate, setNewDate] = useState(
    new Date().toLocaleDateString("en-CA"),
  );
  const [newTime, setNewTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings
    .filter((b: any) => {
      if (activeTab === "Active")
        return (
          b.status === "pending" ||
          b.status === "confirmed" ||
          b.status === "scheduled" ||
          b.status === "in-progress" ||
          b.status === "counter_offer_pending"
        );
      if (activeTab === "Settled") return b.status === "completed";
      if (activeTab === "Cancelled") return b.status === "cancelled";
      return true;
    })
    // ── SAFETY: ENSURE NO REDUNDANT/DUPLICATE CARDS ──
    .filter(
      (v: any, i: number, a: any[]) => a.findIndex((t) => t.id === v.id) === i,
    )
    .slice(
      0,
      activeTab === "Settled" || activeTab === "Cancelled" ? 12 : undefined,
    );

  const handleCancel = (id: string) => {
    cancelBooking(id);
    setActiveTab("Cancelled");
    toast.success("Trade Cancelled", {
      description: `Trade ${id} has been moved to history.`,
    });
  };

  const handleRescheduleSubmit = async () => {
    if (!reschedulingTrade) return;
    setIsSubmitting(true);
    try {
      const result = await rescheduleBooking(
        reschedulingTrade.id,
        newDate,
        newTime,
        {
          wasteType: reschedulingTrade.wasteType,
          weight: reschedulingTrade.actualWeightKg || reschedulingTrade.bags,
          estate: reschedulingTrade.estate,
          latitude: reschedulingTrade.latitude,
          longitude: reschedulingTrade.longitude,
          notes: reschedulingTrade.notes,
          agentId: reschedulingTrade.agentId,
          photoUrl: reschedulingTrade.photoUrl,
        },
      );

      if (result.success) {
        toast.success("Trade Rescheduled!", {
          description: `Your pickup is now set for ${newDate} at ${newTime}.`,
        });
        setReschedulingTrade(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast.error("Reschedule failed", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearHistory = async (type: string) => {
    try {
      await clearBookingHistory(type);
      const label = type === "completed" ? "Settled" : "Cancelled";
      toast.success(`${label} History Cleared`, {
        description: "Past trades have been archived.",
      });
    } catch (err) {
      toast.error("Failed to clear history", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  };

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)] px-4 border-b border-slate-200 dark:border-slate-800  z-50 transition-colors">
        <div className="max-w-lg mx-auto space-y-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 shrink-0 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
            </button>
            <div className="text-center">
              <h1 className="text-base font-bold text-slate-900 dark:text-white capitalize tracking-widest leading-none">
                Trade History
              </h1>
              <p className="text-[9px] font-bold text-slate-500 capitalize tracking-[0.2em] mt-0.5">
                View All Your Trades Activities{" "}
              </p>
            </div>
            <div className="w-8" /> {/* Spacer */}
          </div>

          {/* Integrated Tab Nav */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl">
            {TABS.map((tab) => {
              const tabCount = bookings
                .filter((b: any) => {
                  if (tab === "Active")
                    return (
                      b.status === "pending" ||
                      b.status === "confirmed" ||
                      b.status === "scheduled" ||
                      b.status === "in-progress" ||
                      b.status === "counter_offer_pending"
                    );
                  if (tab === "Settled") return b.status === "completed";
                  if (tab === "Cancelled") return b.status === "cancelled";
                  return false;
                })
                .filter(
                  (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
                ).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${
                    activeTab === tab
                      ? "bg-primary dark:primary shadow-sm text-white dark:text-white font-black"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  <span className="truncate">{tab}</span>
                  {tabCount > 0 && (
                    <span
                      className={`px-1 py-0.2 text-[8px] font-bold rounded ${
                        activeTab === tab
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                      }`}
                    >
                      {tabCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={`flex-1 space-y-0 pb-24 ${!expandedId ? "pt-[calc(env(safe-area-inset-top,1rem)+4.25rem)]" : "pt-0"} relative max-w-lg mx-auto w-full`}
      >
        <div className="space-y-0 pt-1">
          <AnimatePresence mode="wait">
            {expandedId ? (
              /* ── FULL-SCREEN ACTIVE TRADE DETAIL ── */
              <motion.div
                key="trade-focus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed top-0 left-0 right-0 bottom-[64px] z-[50] bg-slate-50 dark:bg-slate-800 flex flex-col"
              >
                {(() => {
                  const b = bookings.find(
                    (x: any) => x.id === expandedId,
                  ) as any;
                  if (!b) return null;
                  const materialVal = b.wasteType;
                  const waste = WASTE_TYPES?.find(
                    (w: any) => w.slug === materialVal || w.id === materialVal,
                  );
                  const status =
                    (statusConfig as any)[b.status] ||
                    (statusConfig as any).pending;
                  return (
                    <>
                      {/* ── FIXED TOP NAV ── */}
                      <div className="fixed top-0 left-0 right-0 z-[51] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                        <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                          <button
                            onClick={() => setExpandedId(null)}
                            className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0"
                          >
                            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                          </button>
                          <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">
                              Trade Details
                            </h1>
                            <p className="text-[10px] font-bold text-primary capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />{" "}
                              Marketplace Trade
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-14">
                        {/* ── IMAGE CAROUSEL ── */}
                        <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                          {(() => {
                            const photoUrl = b?.photoUrl;
                            return photoUrl ? (
                              <OptimizedImage
                                src={getThumbnailUrl(photoUrl, { width: 800 })}
                                className="w-full h-full object-cover"
                                wrapperClassName="w-full h-full"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                                <div className="text-5xl mb-3">
                                  {waste?.icon || "♻️"}
                                </div>
                                <p className="text-[10px] font-bold tracking-widest uppercase">
                                  No photo attached
                                </p>
                              </div>
                            );
                          })()}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />
                        </div>
                        {/* ── SPECIFICATIONS CARD ── */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                Material
                              </p>
                              <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                                {waste?.label || formatMaterial(materialVal)}
                              </h2>
                            </div>
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md ${status.color} border border-current/20 bg-current/10`}
                            >
                              <status.icon className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">
                                {status.label}
                              </span>
                            </div>
                          </div>

                          <hr className="border-slate-100 dark:border-slate-800/60" />

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                              <Tag className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Trade ID
                                </p>
                                <p className="text-xs font-black text-slate-900 dark:text-white font-mono uppercase">
                                  CF-{b.id?.slice(0, 8)}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Trade Value
                                </p>
                                <p className="text-xs font-black text-emerald-600 leading-none">
                                  KSh{" "}
                                  {(
                                    b.totalPrice ||
                                    b.amount ||
                                    0
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Quantity
                                </p>
                                <p className="text-xs font-black text-slate-900 dark:text-white capitalize">
                                  {b.actualWeightKg || b.bags || 0} KG
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Location
                                </p>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate max-w-[120px]">
                                  {b.estate || "Pickup point"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 shadow-sm">
                          <p className="text-[9px] font-bold text-slate-400 capitalize tracking-widest">
                            Material Description
                          </p>
                          <p
                            className={`text-sm ${b.notes && !b.notes.startsWith("Marketplace trade") ? "text-slate-800 dark:text-slate-200 leading-relaxed font-medium" : "text-slate-400 dark:text-slate-500 italic"}`}
                          >
                            {b.notes && !b.notes.startsWith("Marketplace trade")
                              ? b.notes
                              : "No description provided."}
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">
                              Scheduled
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {b.date ||
                                new Date(b.createdAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                            </span>
                          </div>
                          {b.time && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">
                                Time
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                {b.time}
                              </span>
                            </div>
                          )}
                          {b.estate && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">
                                Location
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                                {b.estate}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setExpandedId(null)}
                          className="w-full py-4 bg-white dark:bg-emerald-700 text-slate-100 border border-slate-200 dark:border-slate-700/50 rounded-2xl font-bold text-[10px] capitalize tracking-[0.2em] active:scale-95 transition-all shadow-sm"
                        >
                          Back to Trades
                        </button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : (
              /* ── MAIN LIST VIEW ── */
              <motion.div
                key="list-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-0 pb-32"
              >
                {filteredBookings.length === 0 ? (
                  <div className="pt-10">
                    <EmptyState
                      icon={Store}
                      title={`No ${activeTab.toLowerCase()} trades`}
                      subtitle={
                        activeTab === "Settled"
                          ? "No settled trades in your ledger yet."
                          : activeTab === "Active"
                            ? "You have no active recyclable postings."
                            : "Your cancelled history will appear here."
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-0">
                    {filteredBookings.map((b: any) => {
                      const materialVal = b.wasteType;
                      const waste = WASTE_TYPES?.find?.(
                        (w: any) =>
                          w.slug === materialVal || w.id === materialVal,
                      );
                      const status =
                        (statusConfig as any)[b.status] ||
                        (statusConfig as any).pending;
                      const isSettledOpen = expandedSettledId === b.id;

                      {
                        /* ── SETTLED TAB: Dropdown accordion card ── */
                      }
                      if (activeTab === "Settled") {
                        return (
                          <div
                            key={b.id}
                            className="bg-white dark:bg-slate-900/60 transition-all border-b border-slate-100 dark:border-slate-700 relative overflow-hidden"
                          >
                            {/* Header row - always visible */}
                            <button
                              onClick={() =>
                                setExpandedSettledId(
                                  isSettledOpen ? null : b.id,
                                )
                              }
                              className="w-full py-3 px-3.5 flex gap-3 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors text-left"
                            >
                              <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                                {b.photoUrl ? (
                                  <OptimizedImage
                                    src={getThumbnailUrl(b.photoUrl, {
                                      width: 150,
                                    })}
                                    className="w-full h-full object-cover"
                                    wrapperClassName="w-full h-full"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                                    {waste?.icon || "♻️"}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {/* Row 1: Material & Price */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">
                                      {waste?.label ||
                                        formatMaterial(materialVal)}
                                    </h3>
                                    <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                                      SETTLED
                                    </span>
                                  </div>
                                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">
                                    KSh{" "}
                                    {(
                                      b.totalPrice ||
                                      b.amount ||
                                      0
                                    ).toLocaleString()}
                                  </span>
                                </div>

                                {/* Row 2: Location/Trade */}
                                <div className="flex items-center justify-between mt-0.5">
                                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                    <Tag className="w-2.5 h-2.5 text-indigo-500" />{" "}
                                    CF-{b.id?.slice(0, 8)}
                                  </p>
                                </div>

                                {/* Row 3: Timestamp & Quantity */}
                                <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                    <Clock className="w-2.5 h-2.5 text-slate-400" />{" "}
                                    {b.updatedAt || b.createdAt
                                      ? new Date(
                                          b.updatedAt || b.createdAt,
                                        ).toLocaleString([], {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "Pending"}
                                  </p>
                                  <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                    <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">
                                      Qty:
                                    </span>
                                    <Scale className="w-2.5 h-2.5" />{" "}
                                    {b.actualWeightKg || b.bags || 0} KG
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center justify-center text-slate-300">
                                {isSettledOpen ? (
                                  <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                              </div>
                            </button>

                            {/* Dropdown detail row */}
                            <AnimatePresence>
                              {isSettledOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    {/* ── SPECIFICATIONS GRID ── */}
                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="flex items-start gap-3">
                                        <Tag className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            Trade ID
                                          </p>
                                          <p className="text-xs font-black text-slate-900 dark:text-white font-mono uppercase">
                                            CF-{b.id?.slice(0, 8)}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            Quantity
                                          </p>
                                          <p className="text-xs font-black text-slate-900 dark:text-white">
                                            {b.actualWeightKg || b.bags || 0} KG
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            Settled Amount
                                          </p>
                                          <p className="text-xs font-black text-emerald-600">
                                            KSh{" "}
                                            {(
                                              b.totalPrice ||
                                              b.amount ||
                                              0
                                            ).toLocaleString()}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-start gap-3">
                                        <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                            Completed
                                          </p>
                                          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            {new Date(
                                              b.updatedAt || b.createdAt,
                                            ).toLocaleString([], {
                                              month: "short",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      {
                        /* ── ACTIVE / CANCELLED TAB: Original card ── */
                      }
                      return (
                        <div
                          key={b.id}
                          className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                        >
                          <button
                            onClick={() => setExpandedId(b.id)}
                            className="w-full flex gap-3 text-left"
                          >
                            <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                              {b.photoUrl ? (
                                <OptimizedImage
                                  src={getThumbnailUrl(b.photoUrl, {
                                    width: 150,
                                  })}
                                  className="w-full h-full object-cover"
                                  wrapperClassName="w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                  {waste?.icon || "♻️"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              {/* Row 1: Material & Price */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <h3 className="text-[11px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">
                                    {waste?.label ||
                                      formatMaterial(materialVal)}
                                  </h3>
                                  <span
                                    className={`px-1 py-0.5 rounded text-[8px] font-bold ${status.color} flex items-center gap-0.5 shrink-0`}
                                  >
                                    {status.label}
                                  </span>
                                </div>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">
                                  KSh{" "}
                                  {(
                                    b.totalPrice ||
                                    b.amount ||
                                    0
                                  ).toLocaleString()}
                                </span>
                              </div>

                              {/* Row 2: Location/Trade */}
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                  <Tag className="w-2.5 h-2.5 text-indigo-500" />{" "}
                                  CF-{b.id?.slice(0, 8)}
                                </p>
                              </div>

                              {/* Row 3: Timestamp & Quantity */}
                              <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                                <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                  <Clock className="w-2.5 h-2.5 text-slate-400" />{" "}
                                  {b.updatedAt || b.createdAt
                                    ? new Date(
                                        b.updatedAt || b.createdAt,
                                      ).toLocaleString([], {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Pending"}
                                </p>
                                <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                  <span className="text-[9px] text-slate-400 not-italic font-bold mr-1 opacity-70">
                                    Qty:
                                  </span>
                                  <Scale className="w-2.5 h-2.5" />{" "}
                                  {b.actualWeightKg || b.bags || 0} KG
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-center text-slate-300">
                              <ArrowRight className="w-4 h-4 text-slate-300" />
                            </div>
                          </button>
                        </div>
                      );
                    })}

                    {(activeTab === "Cancelled" || activeTab === "Settled") && (
                      <div className="flex justify-center pt-20 pb-12 px-4 w-full">
                        <button
                          onClick={() =>
                            handleClearHistory(
                              activeTab === "Settled"
                                ? "completed"
                                : "cancelled",
                            )
                          }
                          className="text-[10px] font-bold text-rose-600 dark:text-rose-400 capitalize tracking-[0.15em] bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/30 shadow-sm px-6 py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear {activeTab} History
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RESCHEDULE MODAL ── */}
        <AnimatePresence>
          {reschedulingTrade && (
            <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setReschedulingTrade(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-[2.5rem] rounded-b-2xl p-8 pb-10 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-6" />

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                      <CalendarClock className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Reschedule Trade
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">
                        CF-{reschedulingTrade.id?.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest ml-1">
                        Quick Select Slot
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => setNewTime(slot.value)}
                            className={`py-3 px-1 rounded-xl text-[11px] font-bold capitalize tracking-tight transition-all border ${
                              newTime === slot.value
                                ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500"
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest ml-1">
                          New Date
                        </label>
                        <input
                          type="text"
                          value={newDate}
                          placeholder="YYYY-MM-DD"
                          onFocus={(e) => (e.target.type = "date")}
                          onBlur={(e) =>
                            !e.target.value && (e.target.type = "text")
                          }
                          onChange={(e) => setNewDate(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 capitalize tracking-widest ml-1">
                          Custom Time
                        </label>
                        <input
                          type="text"
                          value={newTime}
                          placeholder="02:30 PM"
                          onFocus={(e) => {
                            const val24 = to24h(newTime);
                            e.target.type = "time";
                            if (val24) e.target.value = val24;
                          }}
                          onBlur={(e) => {
                            const val12 = to12h(e.target.value);
                            e.target.type = "text";
                            if (val12) setNewTime(val12);
                          }}
                          onChange={(e) => {
                            if (e.target.type === "time") {
                              setNewTime(to12h(e.target.value));
                            } else {
                              setNewTime(e.target.value);
                            }
                          }}
                          className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium text-amber-800/70 dark:text-amber-400 leading-relaxed">
                      Rescheduling will reset the trade status to **Pending
                      Approval** so the agent can confirm they are available for
                      the new slot.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setReschedulingTrade(null)}
                      className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold text-xs capitalize tracking-widest rounded-2xl active:scale-95 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isSubmitting}
                      onClick={handleRescheduleSubmit}
                      className="flex-[2] py-4 bg-indigo-600 text-white font-bold text-xs capitalize tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? "Updating..." : "Confirm New Time"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
