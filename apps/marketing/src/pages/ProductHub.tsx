import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Warehouse,
  Scale,
  Users,
  Wallet,
  TrendingUp,
  Package,
  FileText,
  ShoppingCart,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Truck,
  ClipboardList,
  CircleDollarSign,
  Bell,
  Building2,
} from "lucide-react";
import Layout from "../layouts/Layout";

export default function ProductHub() {
  const isDarkMode = false;
  const [activeFeature, setActiveFeature] = useState(0);

  const hubImages = [
    "/products/hub/dashboard.webp",              // 0 - Dashboard
    "/products/hub/intake-verification.webp",    // 1 - Intake Verification
    "/products/hub/resident-requests.webp",      // 2 - Resident Requests
    "/products/hub/community-collections.webp",  // 3 - Community Collections
    "/products/hub/hub-home2.webp",              // 4 - Klin Discovery (Marketplace)
    "/products/hub/prices-page.webp",            // 5 - Price Intelligence
    "/products/hub/rfqs.webp",                   // 6 - Sourcing RFQs
  ];

  // ── DEEP DIVE FEATURES ───────────────────────────────────────
  const deepDiveFeatures = [
    {
      subtitle: "Dashboard",
      title: "Your hub operations at a glance.",
      description:
        "Monitor today's total collection, collection value, hub drop-offs, active pickups, and online agents in real time. Track weekly and monthly intake volume charts alongside live notifications for pending verifications, low stock alerts, and agent disbursement requests.",
      features: [
        "Live intake volume & collection value metrics",
        "Weekly & monthly hub activity trends",
        "Real-time alerts for verifications & disbursements",
      ],
      accentColor: "emerald",
      image: hubImages[0],
      icon: BarChart3,
    },
    {
      subtitle: "Intake Verification",
      title: "Scale readings, grading, and waybills.",
      description:
        "Verify incoming fleet and gate deliveries against trip manifests on the floor scale. Record gross and tare weights, apply optional moisture or dirt deduction percentages, grade material quality, and confirm verification to generate an instant digital waybill.",
      features: [
        "Claimed vs. scale net weight & discrepancy check",
        "Gross, tare & moisture/dirt deduction controls",
        "One-click verification & digital waybill generation",
      ],
      accentColor: "blue",
      image: hubImages[1],
      icon: Scale,
    },
    {
      subtitle: "Resident Requests",
      title: "Inspect requests and dispatch drivers.",
      description:
        "Review incoming household recyclable requests straight from the Client App feed. Inspect declared material photos, weights, and cashback values, filter open or direct hub requests, and track live pickup and fleet alerts as drivers accept and complete dispatches.",
      features: [
        "Live Client App feed with material photos & weights",
        "Open pool & hub-targeted direct request queues",
        "Real-time pickup & fleet dispatch alerts",
      ],
      accentColor: "indigo",
      image: hubImages[2],
      icon: Bell,
    },
    {
      subtitle: "Community Collections",
      title: "Coordinate neighborhood collection drives.",
      description:
        "Schedule, publish, and oversee community aggregation drives organized by your hub. Manage collection points or agent pickups, track resident RSVP pledges against estimated target weights, and transition drives from draft to active and completed.",
      features: [
        "Collection point & agent pickup drive scheduling",
        "Resident RSVP counts & pledged load tracking",
        "Full lifecycle controls: draft, published, active & complete",
      ],
      accentColor: "violet",
      image: hubImages[3],
      icon: Users,
    },
    {
      subtitle: "Klin Discovery",
      title: "Source verified lots on the Market Board.",
      description:
        "Browse verified recyclable lots across plastics, paper, cardboard, and metals from aggregators across the network. Filter by category, radius, or bulk availability, track your active bids and purchases, and place competitive bids directly from the Market Board.",
      features: [
        "Verified material lots with live pricing & stock",
        "Filter by category, radius & bulk availability",
        "Track active bids, purchases & field recommendations",
      ],
      accentColor: "blue",
      image: hubImages[4],
      icon: ShoppingCart,
    },
    {
      subtitle: "Price Intelligence",
      title: "Live commodity index & market movers.",
      description:
        "Track real-time scrap market benchmarks across glass, metals, paper, and plastics. Monitor 7-day and 30-day price changes, demand and supply indicators, bullish vs. bearish commodities, and the top 5 gainers and losers so your hub always prices competitively.",
      features: [
        "Live KES/kg benchmarks with 7D & 30D trends",
        "Demand & supply signals across all categories",
        "Top 5 Market Movers (gainers & losers) tracker",
      ],
      accentColor: "teal",
      image: hubImages[5],
      icon: TrendingUp,
    },
    {
      subtitle: "Sourcing RFQs",
      title: "Broadcast bulk procurement requests.",
      description:
        "Post structured Requests for Quotation with target weights, grades, target prices, and delivery preferences to suppliers and scrap dealers across Kenya. Compare incoming quotes, review bidder ratings in real time, and manage your active demand pipeline.",
      features: [
        "Broadcast bulk RFQs with target weight & price",
        "Compare supplier quotes & bidder ratings",
        "Live RFQ notifications for new bids & deadlines",
      ],
      accentColor: "amber",
      image: hubImages[6],
      icon: FileText,
    },
  ];

  // ── WHY KLINFLOW HUB ────────────────────────────────────────
  const valueProps = [
    {
      icon: Zap,
      title: "Faster Intake",
      desc: "Digital weighing and verification replaces paper manifests. Process more materials in less time.",
      color: "emerald",
    },
    {
      icon: CircleDollarSign,
      title: "Instant Payouts",
      desc: "Pay agents the moment intake is verified. No more cash on the facility floor.",
      color: "blue",
    },
    {
      icon: Globe,
      title: "B2B Market Access",
      desc: "Sell processed materials directly to verified buyers through the integrated marketplace.",
      color: "violet",
    },
    {
      icon: Shield,
      title: "Full Transparency",
      desc: "Every intake, payment, and transaction is logged digitally. Complete audit trail from source to sale.",
      color: "amber",
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
          1. HERO — Light Architectural Canvas + Framed Dashboard
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-20 md:pt-40 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-[#edf3f9]">
        {/* Subtle architectural grid lines */}
        <div
          className="absolute inset-0 opacity-[0.45] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full">
          {/* Centered Copy */}
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 bg-[#085078]/10 text-[#085078] border border-[#085078]/20"
            >
              <Warehouse className="w-3.5 h-3.5 text-[#1178ab]" />
              Material Operating System (MOS)
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-slate-900"
            >
              Run your Collection Hub{" "}
              <span className="text-lime-500">With Ease.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base md:text-lg font-normal leading-relaxed mb-9 max-w-2xl mx-auto text-slate-600"
            >
              Klinflow MOS brings intake verification, fleet coordination,
              real-time inventory, instant agent payouts, and B2B sales into a
              single enterprise platform.
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
                Book a Demo
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link
                to="/products/B2B"
                className="px-7 py-3.5 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
              >
                View B2B Market
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </motion.div>
          </div>

          {/* Full-Width Dashboard Window */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-20 max-w-6xl mx-auto"
          >
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-[0_25px_70px_-15px_rgba(15,23,42,0.18)]">
              <img
                src={hubImages[0]}
                alt="Klinflow Hub Dashboard"
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. WHY KLINFLOW HUB — Clean Editorial Value Props
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 px-6 relative overflow-hidden bg-white">
        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-14 md:mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-[#1178ab]"
            >
              Why Klinflow Hub
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 text-slate-900"
            >
              Replace paperwork with a{" "}
              <span className="text-[#1178ab]">unified platform.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto text-slate-600"
            >
              Most facilities still rely on manual logs, cash payments, and
              disconnected spreadsheets. Klinflow MOS digitizes your entire
              operation from gate to sale.
            </motion.p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-6 border-t border-slate-100">
            {valueProps.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.45 }}
                  className="group pl-4 border-l-2 border-[#1178ab]/25 hover:border-[#1178ab] transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f0f7fc] border border-[#1178ab]/15 text-[#1178ab] flex items-center justify-center mb-4 group-hover:bg-[#1178ab] group-hover:text-white transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-slate-900">
                    {v.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {v.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. FEATURES — Interactive Module Showcase
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 overflow-hidden relative bg-gradient-to-br from-[#085078] via-[#0c5d8a] to-[#063854]">
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10 relative z-10">
          {/* Header */}
          <div className="text-center mb-10 md:mb-12">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-lime-400"
            >
              Platform Modules
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white"
            >
              Built for{" "}
              <span className="text-lime-400">high-volume facilities.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg max-w-2xl mx-auto text-sky-100/90"
            >
              From receiving materials at the gate to selling on the B2B market
              — every module works together seamlessly.
            </motion.p>
          </div>

          {/* Unified Brand Pill Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {deepDiveFeatures.map((item, i) => {
              const isActive = activeFeature === i;
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 border whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-lime-400 text-slate-950 border-lime-400 shadow-lg shadow-black/20"
                      : "bg-white/10 border-white/20 text-sky-100 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.subtitle}
                </button>
              );
            })}
          </div>

          {/* Content — Details left, Framed Screenshot right */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left — Text */}
              <div className="lg:col-span-4 bg-white/[0.08] backdrop-blur-md rounded-2xl border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/20">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/15">
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-lime-400">
                    <CurrentFeatureIcon className="w-4 h-4" />
                    {currentFeature.subtitle}
                  </span>
                  <span className="text-xs font-mono font-semibold tabular-nums text-sky-100/70">
                    0{activeFeature + 1} / 0{deepDiveFeatures.length}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight text-white leading-snug">
                  {currentFeature.title}
                </h3>
                <p className="text-sm sm:text-base mb-6 leading-relaxed text-sky-100/90">
                  {currentFeature.description}
                </p>

                <ul className="space-y-3 pt-5 border-t border-white/15">
                  {currentFeature.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-lime-400" />
                      <span className="text-sm font-medium text-white/95">
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right — Framed Screenshot */}
              <div className="lg:col-span-8 lg:w-[112%]">
                <div className="rounded-2xl overflow-hidden border border-white/20 bg-white shadow-2xl shadow-black/30">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-400">
                      {currentFeature.subtitle}
                    </span>
                    <div className="w-10" />
                  </div>
                  <img
                    src={currentFeature.image}
                    alt={currentFeature.subtitle}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HOW IT WORKS — Connected 4-Step Pipeline
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-24 px-6 relative overflow-hidden bg-white">
        <div className="max-w-[90rem] mx-auto md:px-6 lg:px-10 relative z-10">
          <div className="text-center mb-14 md:mb-16">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs font-bold uppercase tracking-[0.25em] mb-3 text-[#1178ab]"
            >
              How It Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 text-slate-900"
            >
              From intake to sale, in one flow.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto text-slate-600"
            >
              Klinflow Hub connects every stage of your facility&apos;s
              operations into a simple, auditable workflow.
            </motion.p>
          </div>

          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Connecting pipeline line on desktop */}
            <div className="hidden lg:block absolute top-6 left-[12%] right-[12%] h-px bg-slate-200 z-0" />

            {[
              {
                step: "01",
                title: "Receive",
                desc: "Agents and sellers deliver materials to your facility. Log the intake, verify weights, and grade quality.",
                icon: Scale,
              },
              {
                step: "02",
                title: "Pay",
                desc: "Approve the intake and trigger instant payouts to agents via M-Pesa or bank transfer. No cash needed.",
                icon: Wallet,
              },
              {
                step: "03",
                title: "Track",
                desc: "Materials are added to your inventory automatically. Monitor stock levels and plan processing.",
                icon: Package,
              },
              {
                step: "04",
                title: "Sell",
                desc: "List processed materials on the B2B marketplace. Receive bids from verified buyers and close deals.",
                icon: ShoppingCart,
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="relative z-10 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-6 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-[#085078] text-white flex items-center justify-center shadow-md shadow-[#085078]/15">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#1178ab] bg-[#f0f7fc] px-2.5 py-1 rounded-md border border-[#1178ab]/15">
                    STEP {s.step}
                  </span>
                </div>
                <h4 className="text-lg font-bold mb-2 text-slate-900">
                  {s.title}
                </h4>
                <p className="text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 px-6 relative overflow-hidden bg-gradient-to-br from-[#085078] via-[#0a3f5e] to-[#05263a]">
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Ready to modernize
            <br />
            <span className="text-lime-400">your facility?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg text-sky-100/85 mb-10 max-w-2xl mx-auto"
          >
            Join the facilities already using Klinflow Hub to manage intake,
            fleet agents, inventory, and B2B sales — all from one platform.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Link
              to="/contact"
              className="px-8 py-4 sm:px-10 bg-lime-400 text-slate-950 hover:bg-lime-300 font-bold rounded-full shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
