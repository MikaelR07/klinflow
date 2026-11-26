import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  BarChart3,
  TrendingUp,
  ShoppingCart,
  FileText,
  Package,
  MessageSquare,
  Wallet,
  Building2,
  Shield,
  Zap,
  Globe,
  Users,
  ClipboardList,
  Search,
  Bell,
  LayoutDashboard,
  CircleDollarSign,
  Handshake,
} from "lucide-react";
import Layout from "../layouts/Layout";

export default function ProductBusiness() {
  const isDarkMode = false;
  const [activeFeature, setActiveFeature] = useState(0);

  const b2bImages = [
    "/products/b2b/b2b-dashboard.webp",     // 0
    "/products/b2b/b2b-market.webp",         // 1
    "/products/b2b/b2b-listings.webp",       // 2
    "/products/b2b/b2b-prices.webp",         // 3
    "/products/b2b/b2b-rfqs.webp",           // 4
    "/products/b2b/b2b-submitted-bids.webp", // 5
    "/products/b2b/b2b-inventory.webp",      // 6
    "/products/b2b/b2b-messages.webp",       // 7
    "/products/b2b/b2b-wallet.webp",         // 8
  ];

  // ── DEEP DIVE FEATURES ───────────────────────────────────────
  const deepDiveFeatures = [
    {
      subtitle: "Dashboard",
      title: "Your business at a glance.",
      description:
        "Get a real-time overview of your operations — active orders, pending RFQs, inventory levels, wallet balance, and marketplace activity. The executive dashboard surfaces the numbers that matter so you can make decisions faster.",
      features: [
        "Real-time operations overview",
        "Key metrics and activity feed",
        "Quick-access navigation to every module",
      ],
      accentColor: "indigo",
      image: b2bImages[0],
      icon: LayoutDashboard,
    },
    {
      subtitle: "Marketplace",
      title: "Buy and sell materials at scale.",
      description:
        "Browse the Klinflow marketplace to discover recyclable material listings from verified suppliers. Filter by material type, location, quantity, and price. Place bids on listings or create your own to reach buyers across the network.",
      features: [
        "Browse verified material listings",
        "Filter by type, price, and location",
        "Place and manage bids",
      ],
      accentColor: "blue",
      image: b2bImages[1],
      icon: ShoppingCart,
    },
    {
      subtitle: "My Listings",
      title: "List your materials for sale.",
      description:
        "Create detailed material listings with quantities, grades, pricing, and photos. Publish them to the marketplace where verified buyers can discover and bid on your stock. Track all your active and completed listings in one place.",
      features: [
        "Create listings with full details",
        "Track bids received on your listings",
        "Manage active and completed sales",
      ],
      accentColor: "emerald",
      image: b2bImages[2],
      icon: Package,
    },
    {
      subtitle: "Market Prices",
      title: "Track live material prices.",
      description:
        "Access real-time market prices across all recyclable categories — plastics, metals, paper, electronics, and more. Monitor price trends, compare regional rates, and use live data to inform your buying and selling decisions.",
      features: [
        "Live price tickers by category",
        "Price trend tracking",
        "Regional rate comparisons",
      ],
      accentColor: "teal",
      image: b2bImages[3],
      icon: TrendingUp,
    },
    {
      subtitle: "RFQs",
      title: "Source materials through structured procurement.",
      description:
        "Create Requests for Quotation to source specific materials at the quantities and prices you need. Broadcast RFQs to the network, review incoming bids from suppliers, compare offers, and award contracts — all from one workflow.",
      features: [
        "Create and broadcast RFQs",
        "Compare bids side by side",
        "Award and track contracts",
      ],
      accentColor: "violet",
      image: b2bImages[4],
      icon: FileText,
    },
    {
      subtitle: "Submitted Bids",
      title: "Track every bid you've made.",
      description:
        "Monitor all your submitted bids in one place. See which bids are pending, accepted, or declined. Follow up on promising opportunities and keep a clear record of your procurement activity across the marketplace.",
      features: [
        "View all active and past bids",
        "Track acceptance status",
        "Quick follow-up on pending bids",
      ],
      accentColor: "amber",
      image: b2bImages[5],
      icon: ClipboardList,
    },
    {
      subtitle: "Inventory",
      title: "Manage your material yard.",
      description:
        "Keep track of all materials in your yard or warehouse. Log stock by material type and grade, monitor quantities in real time, and plan your sales or shipments. The inventory module keeps your operations organized and audit-ready.",
      features: [
        "Stock tracking by material and grade",
        "Real-time quantity monitoring",
        "Shipment and sales planning",
      ],
      accentColor: "emerald",
      image: b2bImages[6],
      icon: Package,
    },
    {
      subtitle: "Messages",
      title: "Communicate directly with partners.",
      description:
        "Chat with buyers, sellers, and partners directly within the platform. Negotiate deals, share documents, coordinate deliveries, and keep all your business communication in one secure, organized thread.",
      features: [
        "In-app messaging with any partner",
        "Deal negotiation threads",
        "Delivery coordination",
      ],
      accentColor: "blue",
      image: b2bImages[7],
      icon: MessageSquare,
    },
    {
      subtitle: "Wallet",
      title: "Your finances in one place.",
      description:
        "Manage all your business finances through the Klinflow Wallet. Receive payments from buyers, pay suppliers, track every transaction, and withdraw funds to your bank or mobile money account. Full transparency on every shilling.",
      features: [
        "Receive and send payments",
        "Full transaction history",
        "Bank and M-Pesa withdrawals",
      ],
      accentColor: "emerald",
      image: b2bImages[8],
      icon: Wallet,
    },
  ];

  // ── WHO IS IT FOR ────────────────────────────────────────────
  const personas = [
    {
      title: "Recyclers & Processors",
      desc: "Buy raw materials from the network, manage your inventory yard, and sell processed goods — all from one dashboard.",
      icon: Building2,
      color: "indigo",
    },
    {
      title: "Material Traders",
      desc: "Source and resell recyclable materials. Use RFQs to find the best prices and the marketplace to reach more buyers.",
      icon: TrendingUp,
      color: "emerald",
    },
    {
      title: "Waste Management Companies",
      desc: "Manage procurement at scale. Track supplier bids, monitor inventory, and keep your finances transparent and organized.",
      icon: Users,
      color: "violet",
    },
  ];

  // ── COLOR UTILITY ────────────────────────────────────────────
  const accent = (color: string, type: "text" | "bg" | "border") => {
    const map: Record<string, Record<string, string>> = {
      blue: { text: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500/20" },
      indigo: { text: "text-indigo-500", bg: "bg-indigo-500", border: "border-indigo-500/20" },
      violet: { text: "text-violet-500", bg: "bg-violet-500", border: "border-violet-500/20" },
      emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500/20" },
      amber: { text: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500/20" },
      teal: { text: "text-teal-500", bg: "bg-teal-500", border: "border-teal-500/20" },
    };
    return map[color]?.[type] || "";
  };

  const currentFeature = deepDiveFeatures[activeFeature] ?? deepDiveFeatures[0]!;
  const CurrentFeatureIcon = currentFeature.icon;

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO — Light Architectural Trading Canvas + Full-Width Stage
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#edf3f9]">
        {/* Subtle architectural grid */}
        <div
          className="absolute inset-0 opacity-[0.45] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full">
          {/* Centered Executive Copy */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-[#085078]/10 text-[#085078] border border-[#085078]/20"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              B2B Material Exchange
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-slate-900"
            >
              Where Verified Supply{" "}
              <span className="text-[#1178ab]">Meets Industrial Demand.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-lg font-normal leading-relaxed mb-9 max-w-2xl mx-auto text-slate-600"
            >
              Klinflow B2B Market connects recyclers, processors, and material
              traders on one structured exchange. Source via RFQs, track live
              prices, manage yard inventory, and settle payments seamlessly.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-row flex-wrap justify-center gap-3 sm:gap-4"
            >
              <Link
                to="/contact"
                className="px-7 py-3.5 bg-[#085078] text-white hover:bg-[#0a6191] font-bold rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-xl shadow-[#085078]/20"
              >
                Request Access
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                to="/products/hub"
                className="px-7 py-3.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              >
                Explore MOS Hub
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </motion.div>
          </div>

          {/* Full-Width Marketplace Exchange Frame */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 max-w-6xl mx-auto"
          >
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-[0_25px_70px_-15px_rgba(15,23,42,0.18)]">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                </div>
                <div className="px-3 py-0.5 rounded-md bg-white border border-slate-200/80 text-[11px] font-medium text-slate-400">
                  market.klinflow.com
                </div>
                <div className="w-10" />
              </div>
              <img
                src={b2bImages[1]}
                alt="Klinflow B2B Marketplace"
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. WHO IT'S FOR — Hairline-Divided 3-Column Strip
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 px-6 relative overflow-hidden bg-white">
        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14 pb-8 border-b border-slate-200/80">
            <div className="max-w-2xl">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-[#1178ab]"
              >
                Who It&apos;s For
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] text-slate-900"
              >
                Built for <span className="text-[#1178ab]">industrial scale</span>{" "}
                in the circular economy.
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base leading-relaxed max-w-md text-slate-600"
            >
              Whether you&apos;re sourcing feedstock, trading commodities, or
              managing multi-site procurement — Klinflow structures every deal.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
            {personas.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.08, duration: 0.45 }}
                  className="py-6 md:py-2 md:px-8 first:pt-0 first:md:pl-0 last:pb-0 last:md:pr-0 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl bg-[#f0f7fc] border border-[#1178ab]/15 text-[#085078] flex items-center justify-center group-hover:bg-[#085078] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-400">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2.5 text-slate-900">
                    {p.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                    {p.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. PLATFORM MODULES — Dark Executive Sidebar + Large Stage
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 overflow-hidden relative bg-[#091521]">
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10 relative z-10">
          {/* Header */}
          <div className="max-w-3xl mb-12 md:mb-14">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-lime-400"
            >
              Exchange &amp; Procurement Suite
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white"
            >
              Everything your trading desk needs.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg text-slate-300/90"
            >
              Nine integrated modules covering sourcing, live pricing,
              procurement RFQs, yard inventory, and instant settlement.
            </motion.p>
          </div>

          {/* Vertical Sidebar + Large Stage */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left — Compact Vertical Module List */}
            <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
              {deepDiveFeatures.map((item, i) => {
                const isActive = activeFeature === i;
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveFeature(i)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer border ${
                      isActive
                        ? "bg-white/10 border-lime-400/50 text-white shadow-lg shadow-black/20"
                        : "bg-transparent border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? "bg-lime-400 text-slate-950"
                          : "bg-white/[0.06] text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold truncate">
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      className={`hidden lg:block w-4 h-4 shrink-0 transition-transform ${
                        isActive ? "text-lime-400 translate-x-0.5" : "text-slate-600"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            {/* Right — Large Framed Screenshot + Bottom Details Strip */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* Large Screenshot Frame */}
                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-slate-900 shadow-2xl shadow-black/40">
                    <div className="px-4 py-2.5 bg-slate-900/90 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                        <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        market.klinflow.com — {currentFeature.subtitle}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        0{activeFeature + 1}/0{deepDiveFeatures.length}
                      </span>
                    </div>
                    <img
                      src={currentFeature.image}
                      alt={currentFeature.subtitle}
                      className="w-full h-auto object-cover"
                    />
                  </div>

                  {/* Module Details Bar Below Screenshot */}
                  <div className="rounded-2xl bg-white/[0.05] border border-white/10 p-6 sm:p-7 grid md:grid-cols-12 gap-6 items-center">
                    <div className="md:col-span-7">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-400 mb-2">
                        <CurrentFeatureIcon className="w-4 h-4" />
                        <span>{currentFeature.subtitle}</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                        {currentFeature.title}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {currentFeature.description}
                      </p>
                    </div>
                    <ul className="md:col-span-5 space-y-2.5 md:border-l md:border-white/10 md:pl-6">
                      {currentFeature.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-lime-400" />
                          <span className="text-xs sm:text-sm font-medium text-slate-200">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. WHY KLINFLOW B2B — Asymmetric Split + 2x2 Bento Grid
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 px-6 relative overflow-hidden bg-[#edf3f9]">
        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Sticky Heading */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-[#1178ab]"
              >
                Why Klinflow B2B Market
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.12] text-slate-900 mb-4"
              >
                Trade smarter.{" "}
                <span className="text-[#1178ab]">Scale faster.</span>
              </motion.h2>
              <p className="text-base leading-relaxed text-slate-600">
                Built for transparency, verified counterparties, and instant
                settlement across Africa&apos;s recycling supply chain.
              </p>
            </div>

            {/* Right 2x2 Grid */}
            <div className="lg:col-span-8 grid sm:grid-cols-2 gap-5">
              {[
                {
                  icon: Globe,
                  title: "Open Marketplace",
                  desc: "Access a network of verified buyers and sellers across the recycling industry.",
                },
                {
                  icon: Handshake,
                  title: "Structured Procurement",
                  desc: "Source materials through formal RFQs with transparent bidding and awarding.",
                },
                {
                  icon: CircleDollarSign,
                  title: "Integrated Payments",
                  desc: "Handle all payments through a built-in wallet with M-Pesa and bank withdrawals.",
                },
                {
                  icon: Shield,
                  title: "Verified Partners",
                  desc: "Every business on the platform is verified. Trade with confidence and full transparency.",
                },
              ].map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.45 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f0f7fc] border border-[#1178ab]/15 text-[#085078] flex items-center justify-center mb-4">
                    <v.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-2 text-slate-900">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {v.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. FINAL CTA — Contained Split Banner Card
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#085078] via-[#0a5a87] to-[#063854] p-8 sm:p-12 lg:p-14 shadow-2xl shadow-[#085078]/20">
            <div
              className="absolute inset-0 opacity-[0.07] pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
                  Ready to grow your{" "}
                  <span className="text-lime-400">recycling business?</span>
                </h2>
                <p className="text-sm sm:text-base text-sky-100/90 leading-relaxed">
                  Join the Klinflow B2B platform to access verified partners,
                  structured RFQ procurement, and integrated wallet settlement.
                </p>
              </div>
              <div className="shrink-0">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-lime-400 text-slate-950 hover:bg-lime-300 font-bold rounded-full shadow-xl shadow-black/15 hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base whitespace-nowrap"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
