/**
 * Agent Trade Hub — unified B2B dashboard for outbound marketplace listings and bids
 */
import { useState } from "react";
import {
  ArrowLeft,
  Search,
  Filter,
  Tag,
  Store,
  MessageSquareQuote,
  Clock,
  CheckCircle2,
  Package,
  HandCoins,
  ChevronRight,
  TrendingUp,
  MapPin,
  Scale
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import EmptyState from "@klinflow/ui/components/EmptyState";
import { OptimizedImage } from "@klinflow/ui";

const TABS = [
  { id: "Listings", label: "Listings" },
  { id: "Bids", label: "Bids" },
  { id: "Counters", label: "Counters" },
  { id: "History", label: "History" }
];

// Mock Data for the Trade Hub
const mockListings = [
  { id: "1", material: "PET Bottles (Clear)", quantity: 1500, price: 35, date: "2026-07-16T10:00:00Z", status: "active" },
  { id: "2", material: "HDPE Plastics", quantity: 800, price: 42, date: "2026-07-15T14:30:00Z", status: "active" },
  { id: "3", material: "Mixed Cardboard", quantity: 3200, price: 15, date: "2026-07-14T09:15:00Z", status: "active" },
];

const mockBids = [
  { id: "101", listingId: "1", material: "PET Bottles (Clear)", quantity: 1500, offeredPrice: 33, buyerName: "EcoPlast Industries", date: "2026-07-17T08:10:00Z" }
];

export default function AgentTradeHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Listings");
  const [searchQuery, setSearchQuery] = useState("");

  const getCount = (tab: string) => {
    if (tab === "Listings") return mockListings.length;
    if (tab === "Bids") return mockBids.length;
    return 0;
  };

  return (
    <div className="flex flex-col bg-[#F8F8FF] dark:bg-slate-800 transition-colors min-h-screen">
      {/* ── HEADER ── */}
      <div className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] px-4 border-b border-slate-200 dark:border-slate-800 z-50 transition-colors">
        <div className="max-w-lg mx-auto space-y-1.5">
          <div className="flex items-center gap-3.5">
            <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tighter leading-tight">B2B Trade Hub</h1>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                Marketplace Listings & Sales
              </p>
            </div>
          </div>

          {/* SEARCH & FILTER BAR */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search materials or buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:font-medium placeholder:text-slate-400"
              />
            </div>
            <button className="w-10 h-10 shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-colors active:scale-95">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-2">
            {TABS.map((tab) => {
              const count = getCount(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-1 rounded-xl text-[9px] flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-all border shrink-0 ${activeTab === tab.id
                    ? "bg-indigo-600 text-white border-transparent shadow-md"
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

      <div className="flex-1 space-y-0 pt-[calc(env(safe-area-inset-top,1rem)+8.5rem)] pb-24 relative max-w-lg mx-auto w-full px-1.5">
        
        {/* LISTINGS TAB */}
        {activeTab === "Listings" && (
          <motion.div key="listings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
            {mockListings.length === 0 ? (
              <div className="pt-10">
                <EmptyState icon={Tag} title="No Active Listings" subtitle="You have not posted any materials for sale to the B2B market." />
              </div>
            ) : (
              mockListings.map((item) => (
                <div key={item.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">{item.material}</h3>
                    <span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">Listed</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Quantity</p>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">{item.quantity} <span className="text-[10px]">KG</span></p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Asking Price</p>
                      <p className="text-sm font-black text-emerald-600">KSh {item.price}/kg</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                    <button className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Manage Listing</button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* BIDS TAB */}
        {activeTab === "Bids" && (
          <motion.div key="bids" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-2">
            {mockBids.length === 0 ? (
              <div className="pt-10">
                <EmptyState icon={MessageSquareQuote} title="No incoming bids" subtitle="You have no pending offers from buyers." />
              </div>
            ) : (
              mockBids.map((bid) => (
                <div key={bid.id} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                  
                  <div className="pl-2">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">{bid.material}</h3>
                      <p className="text-sm font-black text-emerald-600">KSh {bid.offeredPrice}/kg</p>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-semibold text-slate-500">{bid.buyerName}</p>
                      <p className="text-[10px] font-bold text-slate-400">{bid.quantity} KG Requested</p>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2.5 bg-white dark:bg-slate-800 text-rose-600 font-bold text-[10px] uppercase tracking-widest rounded-xl border border-rose-200 dark:border-rose-900/50">Decline</button>
                      <button className="flex-[2] py-2.5 bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-md">Review Offer</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* COUNTERS TAB */}
        {activeTab === "Counters" && (
          <motion.div key="counters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="pt-10">
              <EmptyState icon={HandCoins} title="No Active Counters" subtitle="No counter-offers pending your review." />
            </div>
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "History" && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="pt-10">
              <EmptyState icon={CheckCircle2} title="No Trade History" subtitle="Completed B2B sales will appear here." />
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
