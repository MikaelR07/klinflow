/**
 * MarketplaceInventory.jsx — Manage Live B2B Listings
 */
import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  MapPin,
  Scale,
  ChevronRight,
  Coins,
  Tag,
  AlertCircle,
  Clock,
  X,
  TrendingUp,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMarketplaceStore } from "@klinflow/core/stores/marketplaceStore";
import { useAuthStore } from "@klinflow/core/stores/authStore";
import { getThumbnailUrl } from "@klinflow/core/utils/imageUtils";
import { OptimizedImage } from "@klinflow/ui";
import EmptyState from "@klinflow/ui/components/EmptyState";
import { LoadingScreen } from "@klinflow/ui/components/Loading";
import { toast } from "sonner";
import { Virtuoso } from "react-virtuoso";
import { motion } from "framer-motion";

export default function MarketplaceInventory() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const myListings = useMarketplaceStore((s) => s.myListings);
  const fetchMyActivity = useMarketplaceStore((s) => s.fetchMyActivity);
  const deleteListing = useMarketplaceStore((s) => s.deleteListing);
  const clearClosedListings = useMarketplaceStore((s) => s.clearClosedListings);
  const isLoading = useMarketplaceStore((s) => s.isLoading);

  const [activeTab, setActiveTab] = useState("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteListing(selectedId!);
      setShowDeleteModal(false);
      setSelectedId(null);
      toast.success("Listing Cancelled", {
        description: "The item has been moved to your closed archives.",
      });
    } catch (err) {
      setShowDeleteModal(false);
      toast.error("Failed to remove", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  };

  const handleClearHistory = async () => {
    try {
      await clearClosedListings();
      toast.success("History Cleared", {
        description: "All closed listings have been removed.",
      });
    } catch (err) {
      toast.error("Failed to clear", {
        description:
          err instanceof Error ? err.message : "An unknown error occurred",
      });
    }
  };

  const selectedListing = myListings.find((l) => l.id === selectedId) || null;
  const displayQuantity = selectedListing
    ? selectedListing.quantity > 0
      ? selectedListing.quantity
      : (selectedListing as any).moq ||
        (selectedListing as any).initialQuantity ||
        500
    : 0;
  const estValue = selectedListing
    ? selectedListing.pricePerKg * displayQuantity
    : 0;

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = myListings.filter((l) => {
      const matchesSearch =
        !q ||
        (l.material && l.material.toLowerCase().includes(q)) ||
        String(l.quantity).includes(q) ||
        String(l.pricePerKg).includes(q);
      const matchesTab =
        activeTab === "active" ? l.status === "active" : l.status !== "active";
      return matchesSearch && matchesTab;
    });
    return activeTab === "active" ? list : list.slice(0, 10);
  }, [myListings, searchQuery, activeTab]);

  if (isLoading && myListings.length === 0) return <LoadingScreen />;

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV (Edge to Edge PWA Style) ── */}
      {!selectedId && (
        <div className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+1rem)]  px-4 border-b border-slate-200 dark:border-slate-600/60  z-50 transition-colors">
          <div className="max-w-lg mx-auto space-y-1.5">
            <div className="flex items-center gap-3.5">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-tight">
                  Marketplace Listings
                </h1>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                  What You have listed for sale
                </p>
              </div>
            </div>

            {/* SEARCH INPUT */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials, price, or quantity..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:font-medium placeholder:text-slate-400"
              />
            </div>

            {/* Integrated Tab Nav */}
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl">
              {["active", "closed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1.5 text-[10px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === tab
                      ? "bg-primary dark:bg-primary shadow-sm text-white dark:text-white font-black"
                      : "text-slate-500 bg-slate-300 dark:bg-slate-900 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        className={`flex-1 space-y-0 pb-10 ${!selectedId ? "pt-[calc(env(safe-area-inset-top,1rem)+8.2rem)]" : "pt-0"} relative max-w-lg mx-auto w-full`}
      >
        <main className="mt-0">
          {selectedId && selectedListing ? (
            /* ── FOCUSED DETAIL VIEW (Immersive Kilimall Style) ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-slate-50 dark:bg-slate-800 flex flex-col"
            >
              {/* ── FIXED TOP NAV ── */}
              <div className="fixed top-0 left-0 right-0 z-[10000] max-w-lg mx-auto bg-white/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-900 transition-all duration-300">
                <div className="pt-[calc(env(safe-area-inset-top,1rem)+0.75rem)] pb-3.5 px-4 flex items-center gap-3.5">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-primary transition-colors" />
                  </button>
                  <div>
                    <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">
                      Listing Details
                    </h1>
                    <p className="text-[10px] font-bold text-primary capitalize tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />{" "}
                      Live Marketplace
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+4.5rem)] pb-10">
                {/* ── IMAGE CAROUSEL ── */}
                <div className="relative h-[270px] w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-900">
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar h-full w-full">
                    {(selectedListing?.photoUrls &&
                    selectedListing.photoUrls.length > 0
                      ? selectedListing.photoUrls
                      : [selectedListing?.photoUrl]
                    ).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="flex-none w-full h-full snap-start"
                      >
                        {imgUrl ? (
                          <OptimizedImage
                            src={getThumbnailUrl(imgUrl, { width: 800 })}
                            className="w-full h-full object-cover"
                            wrapperClassName="w-full h-full"
                            alt={`${selectedListing.material} - View ${idx + 1}`}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                            <Package className="w-20 h-20 text-slate-200 opacity-50" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 pointer-events-none" />

                  {(selectedListing?.photoUrls &&
                  selectedListing.photoUrls.length > 0
                    ? selectedListing.photoUrls
                    : [selectedListing?.photoUrl]
                  ).length > 1 && (
                    <div className="absolute top-4 right-4 z-10 bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                      <span>
                        1 /{" "}
                        {
                          (selectedListing?.photoUrls &&
                          selectedListing.photoUrls.length > 0
                            ? selectedListing.photoUrls
                            : [selectedListing?.photoUrl]
                          ).length
                        }
                      </span>
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                  )}
                </div>

                {/* ── SPECIFICATIONS CARD ── */}
                <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800/40 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Material Type
                      </p>
                      <h2 className="text-[16px] font-bold text-indigo-700 dark:text-white capitalize leading-tight">
                        {selectedListing.material}
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20">
                      <Tag className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-bold uppercase tracking-wider leading-none mt-px">
                        {selectedListing.status === "active"
                          ? "Live Listing"
                          : selectedListing.status}
                      </span>
                    </div>
                  </div>

                  <hr className="border-slate-100 dark:border-slate-800/60" />

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Coins className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Asking Rate
                        </p>
                        <p className="text-xs font-black text-emerald-600 leading-none">
                          KSh {selectedListing.pricePerKg}/kg
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Scale className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          {selectedListing.status === "active"
                            ? "Inventory Load"
                            : "Total Load"}
                        </p>
                        <p className="text-xs font-black text-slate-900 dark:text-white capitalize">
                          {displayQuantity} KG
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
                          {selectedListing.location || "Nairobi Hub"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                          Posted On
                        </p>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          {new Date(
                            selectedListing.createdAt ||
                              selectedListing.createdAt,
                          ).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expected Value Card */}
                <div className="bg-emerald-600 dark:bg-emerald-800 p-5 rounded-2xl border border-emerald-500/20  flex flex-col justify-center text-center">
                  <p className="text-[10px] font-bold text-slate-200  capitalize tracking-widest mb-1">
                    {selectedListing.status === "sold"
                      ? "Settled Value"
                      : "Est. Total Value"}
                  </p>
                  <p className="text-xl font-black text-white leading-none">
                    KSh {estValue.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-300 font-bold capitalize mt-1.5">
                    {selectedListing.pricePerKg} × {displayQuantity}kg Total
                    Stock
                  </p>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <h4 className="text-[10px] font-black text-slate-400 capitalize tracking-[0.2em]">
                    Description
                  </h4>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    {(selectedListing as any).description ||
                      "No description provided"}
                  </p>
                </div>
                {/* Management Controls */}
                <div className="space-y-2">
                  {selectedListing.status === "active" ? (
                    <button
                      onClick={handleDelete}
                      className="w-full py-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl font-black text-xs capitalize tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Listing
                    </button>
                  ) : (
                    <div
                      className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 text-xs font-black capitalize tracking-[0.2em] ${
                        selectedListing.status === "sold"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
                          : selectedListing.status === "cancelled"
                            ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30"
                            : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30"
                      }`}
                    >
                      {selectedListing.status === "sold" && (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      {selectedListing.status === "cancelled" && (
                        <Ban className="w-4 h-4" />
                      )}
                      {selectedListing.status === "expired" && (
                        <Clock className="w-4 h-4" />
                      )}
                      <span>Status: {selectedListing.status}</span>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedId(null)}
                    className="w-full py-3.5 bg-white dark:bg-slate-900/50 text-slate-400 rounded-2xl font-black text-[10px] capitalize tracking-[0.2em] active:scale-95 transition-all"
                  >
                    Return to Inventory
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── MAIN LIST VIEW ── */
            <div className="space-y-0 pb-32">
              {filteredListings.length === 0 ? (
                <div className="py-20 px-4 text-center">
                  <EmptyState
                    icon={Package}
                    title={
                      activeTab === "active"
                        ? "No Live Listings"
                        : "No Past Listings"
                    }
                    subtitle={
                      activeTab === "active"
                        ? "Your marketplace posts will appear here."
                        : "Your history is currently empty."
                    }
                  />
                </div>
              ) : (
                <Virtuoso
                  useWindowScroll
                  data={filteredListings}
                  itemContent={(index, listing) => {
                    const itemQuantity =
                      listing.quantity > 0
                        ? listing.quantity
                        : (listing as any).moq ||
                          (listing as any).initialQuantity ||
                          500;
                    return (
                      <div
                        onClick={() => setSelectedId(listing.id)}
                        className="bg-white dark:bg-slate-900/60 py-3 px-3.5 shadow-sm border-b border-slate-100 dark:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center text-2xl border border-slate-100 dark:border-slate-800">
                            {listing.photoUrl ? (
                              <OptimizedImage
                                src={getThumbnailUrl(listing.photoUrl, {
                                  width: 150,
                                })}
                                className="w-full h-full object-cover"
                                wrapperClassName="w-full h-full"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-slate-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            {/* Row 1: Material & Price */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h3 className="text-[14px] font-bold text-slate-900 dark:text-white capitalize truncate tracking-tight">
                                  {listing.material}
                                </h3>
                                <span
                                  className={`px-1 py-0.5 rounded text-[8px] font-bold ${listing.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400"} flex items-center gap-0.5 shrink-0`}
                                >
                                  {listing.status === "active"
                                    ? "Live"
                                    : listing.status}
                                </span>
                              </div>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter shrink-0 ml-2">
                                KSh {listing.pricePerKg}/kg
                              </span>
                            </div>

                            {/* Row 2: Location -> Trade ID */}
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize truncate max-w-[150px]">
                                <Tag className="w-2.5 h-2.5 text-indigo-500" />{" "}
                                CF-{listing.id?.slice(0, 8)}
                              </p>
                            </div>

                            {/* Row 3: Timestamp & Quantity */}
                            <div className="flex items-center justify-between pt-1 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                              <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1 capitalize shrink-0">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />{" "}
                                {listing.createdAt
                                  ? new Date(listing.createdAt).toLocaleString(
                                      [],
                                      {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      },
                                    )
                                  : "ASAP"}
                              </p>
                              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 capitalize shrink-0">
                                <span className="text-[10px] text-slate-400 not-italic font-bold mr-1 opacity-70">
                                  Qty:
                                </span>
                                <Scale className="w-2.5 h-2.5" /> {itemQuantity} KG
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-center text-slate-300">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  }}
                  components={{
                    Footer: () =>
                      activeTab === "closed" ? (
                        <div className="pt-4 pb-12 px-4 flex justify-center">
                          <button
                            onClick={handleClearHistory}
                            className="px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-xl font-bold text-[10px] capitalize tracking-widest active:scale-95 transition-all flex items-center gap-1.5 shadow-sm hover:bg-rose-100 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Clear History
                          </button>
                        </div>
                      ) : null,
                  }}
                />
              )}
            </div>
          )}
        </main>

        {/* ── DELETE CONFIRMATION MODAL ── */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-fade-in">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
              onClick={() => setShowDeleteModal(false)}
            />
            <div className="relative w-full max-w-[300px] bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-800">
              <div className="h-24 bg-rose-500 flex items-center justify-center relative">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-rose-500" />
                </div>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-6 text-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight capitalize italic leading-none mb-1">
                  Cancel Listing?
                </h2>
                <p className="text-[10px] font-bold text-slate-500 capitalize tracking-widest mb-6">
                  Item will move to Closed tab
                </p>

                <div className="space-y-2">
                  <button
                    onClick={confirmDelete}
                    className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-xs capitalize tracking-widest shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                  >
                    Yes, Cancel
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-bold text-xs capitalize tracking-widest active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
