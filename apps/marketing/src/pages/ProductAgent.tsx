import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Shield,
  Wallet,
  Bell,
  BarChart3,
  Clock,
  Target,
  Route,
  Users,
  Package,
  ChevronRight,
  Zap,
  ShieldCheck,
  Navigation,
  ClipboardList,
  Handshake,
  Eye,
  Timer,
  CircleDollarSign,
  FileSearch,
} from "lucide-react";
import Layout from "../layouts/Layout";

export default function ProductAgent() {
  const isDarkMode = false;
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeIssue, setActiveIssue] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const agentImages = [
    "/products/agent/agent-home.webp",
    "/products/agent/agent-jobs.webp",
    "/products/agent/agent-market.webp",
    "/products/agent/agent-materialDetail.webp",
    "/products/agent/agent-wallet.webp",
    "/products/agent/agent-notifications.webp",
    "/products/agent/agent-dashboard.webp",
    "/products/agent/agent-rfq.webp",
    "/products/agent/agent-bidHistory.webp",
    "/products/agent/market-price.webp",
  ];

  // ── PROBLEM / SOLUTION PAIRS ─────────────────────────────────
  const agentChallenges = [
    {
      id: "inconsistent-jobs",
      problem: {
        title: "Inconsistent Work",
        desc: "Agents spend hours looking for collection jobs. Without a centralized system, finding reliable work each day is unpredictable.",
        icon: Clock,
      },
      solution: {
        label: "Live Job Board",
        desc: "Browse available pickup requests in your area in real time. Accept jobs that match your route, capacity, and material specialization.",
        icon: Target,
      },
    },
    {
      id: "no-market-info",
      problem: {
        title: "No Price Visibility",
        desc: "Agents often don't know what materials are worth, making it hard to negotiate fairly or decide which collections are most profitable.",
        icon: Eye,
      },
      solution: {
        label: "Live Market Prices",
        desc: "See real-time buying and selling prices for every material category. Know exactly what each kilogram is worth before you collect.",
        icon: TrendingUp,
      },
    },
    {
      id: "delayed-payments",
      problem: {
        title: "Delayed Payments",
        desc: "Traditional collection work means waiting days or weeks for payment. Unpredictable cash flow makes it hard to plan and stay motivated.",
        icon: Timer,
      },
      solution: {
        label: "Instant Payouts",
        desc: "Earn directly into your Klinflow wallet after every verified delivery. Withdraw to M-Pesa or your bank account instantly.",
        icon: Zap,
      },
    },
    {
      id: "no-transparency",
      problem: {
        title: "No Transaction Records",
        desc: "Without digital records, disputes about weight, quality, and payment are common. There's no way to prove what was collected or agreed.",
        icon: FileSearch,
      },
      solution: {
        label: "Digital Verification",
        desc: "Every collection is logged with photos, weights, and digital receipts. Both you and the client have a clear, undeniable record.",
        icon: ShieldCheck,
      },
    },
  ];

  // ── DEEP DIVE FEATURES ───────────────────────────────────────
  const deepDiveFeatures = [
    {
      subtitle: "Home Dashboard",
      title: "Your daily command center.",
      description:
        "See everything at a glance — available jobs nearby, your collections for the day, active pickups, wallet balance, and live notifications. The dashboard adapts to your service zone so you always see what's relevant to your area.",
      features: [
        "Live job feed in your zone",
        "Daily collection overview",
        "Active pickup status",
      ],
      accentColor: "blue",
      image: agentImages[0],
      icon: Target,
    },
    {
      subtitle: "Available Jobs",
      title: "Find and accept pickups near you.",
      description:
        "Browse all available collection requests from residents and sellers in your area. Filter by material type, distance, or estimated value. Accept jobs with one tap and get navigation to the pickup location.",
      features: [
        "Location-based job matching",
        "Material type filters",
        "One-tap job acceptance",
      ],
      accentColor: "indigo",
      image: agentImages[1],
      icon: MapPin,
    },
    {
      subtitle: "Market Prices",
      title: "Know what every material is worth.",
      description:
        "Access real-time market prices across all recyclable categories. Check what PET, HDPE, metals, cardboard, and more are trading at before you start collecting. Use pricing data to prioritize high-value materials.",
      features: [
        "Live price tickers",
        "Material category breakdown",
        "Price trend indicators",
      ],
      accentColor: "emerald",
      image: agentImages[9],
      icon: TrendingUp,
    },
    {
      subtitle: "RFQ & Sourcing",
      title: "Source materials directly from sellers.",
      description:
        "Create Requests for Quotation (RFQs) to source specific materials from sellers in your network. Set your price, quantity requirements, and pickup terms. Manage incoming offers and close deals — all from the app.",
      features: [
        "Create and broadcast RFQs",
        "Review seller offers",
        "Track sourcing orders",
      ],
      accentColor: "violet",
      image: agentImages[7],
      icon: Handshake,
    },
    {
      subtitle: "Agent Wallet",
      title: "Your earnings, always accessible.",
      description:
        "Every verified collection earns directly into your Klinflow Wallet. View your balance, track commission breakdowns per job, and withdraw to M-Pesa or bank whenever you want. Full transaction history included.",
      features: [
        "Instant payout after delivery",
        "M-Pesa & bank withdrawals",
        "Per-job commission breakdown",
      ],
      accentColor: "emerald",
      image: agentImages[4],
      icon: Wallet,
    },
    {
      subtitle: "Bid History",
      title: "Track every bid you've made.",
      description:
        "Monitor all your active and past bids in one place. See which offers have been accepted, which are pending, and which were declined. The bid history gives you full visibility into your sourcing activity so you can follow up and close deals faster.",
      features: [
        "View active and past bids",
        "Track bid acceptance status",
        "Quick follow-up actions",
      ],
      accentColor: "amber",
      image: agentImages[8],
      icon: ClipboardList,
    },
    {
      subtitle: "Notifications",
      title: "Never miss an update.",
      description:
        "Stay on top of everything — new job alerts, bid responses, pickup confirmations, payment receipts, and system updates. All your notifications are organized in one feed so you can act on what matters without missing a thing.",
      features: [
        "Real-time job alerts",
        "Bid and order updates",
        "Payment confirmations",
      ],
      accentColor: "teal",
      image: agentImages[5],
      icon: Bell,
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

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-32 md:pt-40 md:pb-44 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#EDF8FE]" />
          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-medium mb-8 bg-blue-500/10 backdrop-blur-md text-blue-600 border border-blue-500/20">
                For Collection Agents
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-slate-900">
                Everything you need
                <br />
                <span className="bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
                  to run your collection business.
                </span>
              </h1>

              <p className="text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl text-slate-600">
                Whether you are an independent collector or fleet agent, the Klinflow Agent App gives you everything you need to run
                efficient collection operations — find jobs, verify
                materials, track payouts, manage your inventory, source from sellers,
                and get paid the moment you deliver.
              </p>

              <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  to="/contact"
                  className="flex-1 sm:flex-none px-6 py-3.5 sm:px-8 sm:py-4 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-xl shadow-blue-600/20"
                >
                  Become an Agent{" "}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  to="/products/client"
                  className="flex-1 sm:flex-none px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                >
                  I'm a Seller{" "}
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>

            {/* Right — Phone mockups */}
            <div className="relative flex justify-center lg:justify-end mt-16 lg:mt-0 h-[420px] sm:h-[480px] md:h-[560px] items-center">
              <motion.div
                initial={{ opacity: 0, x: -20, y: 0 }}
                animate={{
                  opacity: 1,
                  x: isMobile ? "-30%" : "-55%",
                  y: isMobile ? -20 : -20,
                }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                  delay: 0.2,
                }}
                className="absolute w-[200px] sm:w-[240px] md:w-[290px] aspect-[1/2] rounded-[2rem] overflow-hidden shadow-2xl z-10 border-2 border-white/60 bg-white/20 backdrop-blur-sm"
              >
                <img
                  src={agentImages[0]}
                  alt="Agent Home"
                  className="w-full h-full object-cover"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{
                  opacity: 1,
                  x: isMobile ? "30%" : "55%",
                  y: isMobile ? 10 : 20,
                }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                  delay: 0.4,
                }}
                className="absolute w-[200px] sm:w-[240px] md:w-[290px] aspect-[1/2] rounded-[2rem] overflow-hidden z-20 border-2 border-white/60 bg-white/20 backdrop-blur-sm shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
              >
                <img
                  src={agentImages[1]}
                  alt="Agent Jobs"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Curved Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg
            className="w-full h-32 md:h-40 lg:h-50"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,20 Q720,120 1440,20 L1440,120 L0,120 Z"
              fill={isDarkMode ? "#0B0F1A" : "#1e3a8a"}
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. WHY AGENTS CHOOSE KLINFLOW — Interactive Split Spotlight
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-28 px-6 relative overflow-hidden ${
          isDarkMode
            ? "bg-[#0B0F1A]"
            : "bg-gradient-to-b from-[#edf3f9] to-[#e4edf7]"
        }`}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: isDarkMode
              ? "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(17,120,171,0.14) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto mb-14 md:mb-16 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-xs font-bold uppercase tracking-[0.25em] mb-4 ${
                isDarkMode ? "text-sky-300/80" : "text-[#1178ab]"
              }`}
            >
              Why Klinflow
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Collection work,{" "}
              <span className={isDarkMode ? "text-sky-300" : "text-[#1178ab]"}>
                done right.
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${
                isDarkMode ? "text-slate-300/90" : "text-slate-600"
              }`}
            >
              Traditional collection is unpredictable, underpaid, and
              unstructured. Klinflow replaces guesswork with a professional
              platform built for agents.
            </motion.p>
          </div>

          {/* Interactive Split Spotlight */}
          {(() => {
            const currentIssue =
              agentChallenges.find((p) => p.id === activeIssue) ||
              agentChallenges[0];
            if (!currentIssue) return null;
            const ProblemIcon = currentIssue.problem.icon;
            const SolutionIcon = currentIssue.solution.icon;
            const currentIndex = agentChallenges.findIndex(
              (p) => p.id === currentIssue.id
            );

            return (
              <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                {/* LEFT: Numbered Pain Points List */}
                <div
                  className={`lg:col-span-5 divide-y border-y ${
                    isDarkMode
                      ? "divide-white/10 border-white/10"
                      : "divide-slate-200/80 border-slate-200/80"
                  }`}
                >
                  {agentChallenges.map((item, idx) => {
                    const isSelected = item.id === currentIssue.id;
                    const RowIcon = item.problem.icon;
                    const num = `0${idx + 1}`;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveIssue(item.id)}
                        className={`w-full text-left px-4 py-4 sm:py-5 flex items-center gap-4 transition-all duration-200 cursor-pointer border-l-2 ${
                          isSelected
                            ? isDarkMode
                              ? "border-lime-400 bg-white/[0.08]"
                              : "border-[#1178ab] bg-white shadow-sm"
                            : isDarkMode
                              ? "border-transparent hover:bg-white/[0.03]"
                              : "border-transparent hover:bg-white/60"
                        }`}
                      >
                        <span
                          className={`text-xs font-mono font-bold tabular-nums shrink-0 ${
                            isSelected
                              ? isDarkMode
                                ? "text-lime-400"
                                : "text-[#1178ab]"
                              : "text-slate-400"
                          }`}
                        >
                          {num}
                        </span>
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? isDarkMode
                                ? "bg-rose-500/20 text-rose-300"
                                : "bg-rose-50 text-rose-500 border border-rose-200/60"
                              : isDarkMode
                                ? "bg-white/[0.05] text-slate-400"
                                : "bg-white/80 text-slate-400 border border-slate-200/60"
                          }`}
                        >
                          <RowIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm sm:text-base font-semibold truncate transition-colors ${
                              isSelected
                                ? isDarkMode
                                  ? "text-white"
                                  : "text-slate-900"
                                : isDarkMode
                                  ? "text-slate-300"
                                  : "text-slate-700"
                            }`}
                          >
                            {item.problem.title}
                          </p>
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {item.solution.label}
                          </p>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                            isSelected
                              ? isDarkMode
                                ? "text-lime-400 translate-x-0.5"
                                : "text-[#1178ab] translate-x-0.5"
                              : "text-slate-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                {/* RIGHT: Spotlight Detail Panel */}
                <div className="lg:col-span-7 lg:sticky lg:top-28">
                  <div
                    className={`rounded-2xl p-6 sm:p-8 lg:p-9 border ${
                      isDarkMode
                        ? "bg-white/[0.06] backdrop-blur-md border-white/15 shadow-2xl shadow-black/25"
                        : "bg-white border-slate-200/80 shadow-xl shadow-slate-900/5"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentIssue.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {/* Top Meta */}
                        <div
                          className={`flex items-center justify-between gap-4 pb-5 border-b ${
                            isDarkMode ? "border-white/10" : "border-slate-100"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
                              isDarkMode ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Challenge &amp; Solution
                          </span>
                          <span className="text-xs font-mono font-semibold tabular-nums text-slate-400">
                            0{currentIndex + 1} / 0{agentChallenges.length}
                          </span>
                        </div>

                        {/* The Problem */}
                        <div className="mt-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                isDarkMode
                                  ? "bg-rose-500/15 border border-rose-400/20 text-rose-300"
                                  : "bg-rose-50 border border-rose-200/70 text-rose-600"
                              }`}
                            >
                              <ProblemIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p
                                className={`text-[11px] font-bold uppercase tracking-wider ${
                                  isDarkMode
                                    ? "text-rose-300/90"
                                    : "text-rose-600"
                                }`}
                              >
                                The Traditional Problem
                              </p>
                              <h3
                                className={`text-lg sm:text-xl font-bold leading-snug ${
                                  isDarkMode ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {currentIssue.problem.title}
                              </h3>
                            </div>
                          </div>
                          <p
                            className={`text-sm sm:text-base leading-relaxed pl-[52px] ${
                              isDarkMode ? "text-slate-300" : "text-slate-600"
                            }`}
                          >
                            {currentIssue.problem.desc}
                          </p>
                        </div>

                        {/* The Klinflow Solution */}
                        <div
                          className={`mt-7 rounded-xl p-5 sm:p-6 border ${
                            isDarkMode
                              ? "bg-[#0b4f75]/60 border-sky-400/25"
                              : "bg-[#f0f7fc] border-[#1178ab]/20"
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                                isDarkMode
                                  ? "bg-lime-400 text-slate-950 shadow-lime-400/20"
                                  : "bg-[#1178ab] text-white shadow-[#1178ab]/20"
                              }`}
                            >
                              <SolutionIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p
                                className={`text-[11px] font-bold uppercase tracking-wider ${
                                  isDarkMode
                                    ? "text-lime-300"
                                    : "text-[#085078]"
                                }`}
                              >
                                The Klinflow Way
                              </p>
                              <h4
                                className={`text-lg sm:text-xl font-bold leading-snug ${
                                  isDarkMode ? "text-white" : "text-slate-900"
                                }`}
                              >
                                {currentIssue.solution.label}
                              </h4>
                            </div>
                          </div>
                          <p
                            className={`text-sm sm:text-base leading-relaxed pl-[52px] ${
                              isDarkMode ? "text-slate-200" : "text-slate-700"
                            }`}
                          >
                            {currentIssue.solution.desc}
                          </p>
                        </div>

                        {/* Footer Stepper */}
                        <div
                          className={`mt-6 pt-5 border-t flex items-center justify-between gap-4 ${
                            isDarkMode ? "border-white/10" : "border-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            {agentChallenges.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                aria-label={`Select ${p.problem.title}`}
                                onClick={() => setActiveIssue(p.id)}
                                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                  p.id === currentIssue.id
                                    ? isDarkMode
                                      ? "w-6 bg-lime-400"
                                      : "w-6 bg-[#1178ab]"
                                    : isDarkMode
                                      ? "w-1.5 bg-white/25 hover:bg-white/45"
                                      : "w-1.5 bg-slate-200 hover:bg-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const next =
                                agentChallenges[
                                  (currentIndex + 1) % agentChallenges.length
                                ];
                              if (next) setActiveIssue(next.id);
                            }}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                              isDarkMode
                                ? "text-sky-300 hover:text-white"
                                : "text-[#1178ab] hover:text-[#085078]"
                            }`}
                          >
                            <span>Next Challenge</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. FEATURES — Horizontal tabs + stage card
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-20 px-6 overflow-hidden relative ${
          isDarkMode ? "bg-surface-900" : "bg-blue-500/20"
        }`}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-xs font-bold uppercase tracking-[0.25em] mb-4 ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Features
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              <span className="text-primary"> Built for how agents</span> actually work.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`text-lg max-w-2xl mx-auto ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              From finding your first job to managing your warehouse —
              everything is in one app.
            </motion.p>
          </div>

          {/* Horizontal Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10 md:mb-14">
            {deepDiveFeatures.map((item, i) => {
              const isActive = activeFeature === i;
              const Icon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border whitespace-nowrap ${
                    isActive
                      ? `${accent(item.accentColor, "bg")} text-white border-transparent shadow-lg`
                      : isDarkMode
                        ? "bg-white/[0.04] border-slate-700 text-slate-400 hover:bg-white/[0.08] hover:text-slate-300"
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.subtitle}
                </button>
              );
            })}
          </div>

          {/* Stage Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className={`max-w-6xl mx-auto p-8 sm:p-10 lg:p-14 rounded-3xl border flex flex-col lg:flex-row items-center gap-10 lg:gap-16 ${
                isDarkMode
                  ? "bg-white/[0.02] border-slate-800"
                  : "bg-white border-slate-200 shadow-sm"
              }`}
            >
              {/* Left — Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-bold uppercase tracking-[0.2em] mb-3 ${accent(deepDiveFeatures[activeFeature].accentColor, "text")}`}
                >
                  {deepDiveFeatures[activeFeature].subtitle}
                </p>
                <h3
                  className={`text-2xl sm:text-3xl font-bold mb-4 tracking-tight ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {deepDiveFeatures[activeFeature].title}
                </h3>
                <p
                  className={`text-sm sm:text-base mb-8 leading-relaxed ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {deepDiveFeatures[activeFeature].description}
                </p>
                <ul className="space-y-3">
                  {deepDiveFeatures[activeFeature].features.map(
                    (feat, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${accent(deepDiveFeatures[activeFeature].accentColor, "text")}`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode
                              ? "text-slate-300"
                              : "text-slate-700"
                          }`}
                        >
                          {feat}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* Right — Phone Image */}
              <div className="w-[260px] sm:w-[300px] md:w-[360px] shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className={`rounded-[2.5rem] overflow-hidden border-2 shadow-2xl ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <img
                    src={deepDiveFeatures[activeFeature].image}
                    alt={deepDiveFeatures[activeFeature].subtitle}
                    className="w-full h-auto object-cover"
                  />
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. HOW IT WORKS — Per agent type
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-28 px-6 relative overflow-hidden ${
          isDarkMode ? "bg-surface-950" : "bg-blue-500/20"
        }`}
      >
        <div
          className={`absolute inset-0 ${
            isDarkMode ? "opacity-[0.03]" : "opacity-[0.025]"
          }`}
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-14 md:mb-20">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-xs font-bold uppercase tracking-[0.25em] mb-4 ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              How It Works
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 ${
                isDarkMode ? "text-white" : "text-blue-500"
              }`}
            >
              One app, unlimited potential.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Whether you work solo, drive for a company, or manage your own
              fleet — the Klinflow Agent App adapts to how you operate.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                type: "Independent Agent",
                tagline: "Work on your own terms",
                desc: "You're a solo operator. Set your own service zone, find and accept pickup jobs, source materials through RFQs, manage your own warehouse, and sell directly to buyers or hubs. Full control over your schedule and earnings.",
                steps: [
                  "Set your service zone and go online",
                  "Accept jobs or create RFQs to source materials",
                  "Collect, verify, and log every pickup",
                  "Deliver and get paid instantly into your wallet",
                ],
                icon: Users,
                color: "blue",
              },
              {
                type: "Fleet Driver",
                tagline: "Collect for your company",
                desc: "You're part of a collection company. Your company assigns you jobs and routes. Pick up materials, verify and log weights, and deliver to your company's warehouse. Your earnings are tracked and paid out through the company.",
                steps: [
                  "Receive assigned jobs from your company",
                  "Navigate to pickup locations",
                  "Verify materials and log weights on-site",
                  "Deliver to the company warehouse",
                ],
                icon: Truck,
                color: "indigo",
              },
              {
                type: "Company Owner",
                tagline: "Manage your collection fleet",
                desc: "You run a collection company. Onboard and manage your fleet drivers, assign jobs, monitor pickups in real time, oversee your company warehouse, and track all payouts. Run your entire operation from one dashboard.",
                steps: [
                  "Register your company and onboard drivers",
                  "Assign jobs and manage fleet operations",
                  "Monitor collections and warehouse inventory",
                  "Track company earnings and driver payouts",
                ],
                icon: BarChart3,
                color: "violet",
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative rounded-2xl border p-7 sm:p-8 flex flex-col group transition-all duration-300 ${
                  isDarkMode
                    ? "bg-white/[0.02] border-slate-800 hover:border-slate-600"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:shadow-lg"
                }`}
              >
                {/* Icon + Type */}
                <div className="flex items-center gap-3.5 mb-5">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent(card.color, "bg")}/10 ${accent(card.color, "text")} group-hover:scale-110 transition-transform`}
                  >
                    <card.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {card.type}
                    </h3>
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${accent(card.color, "text")}`}
                    >
                      {card.tagline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p
                  className={`text-sm leading-relaxed mb-6 ${
                    isDarkMode ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {card.desc}
                </p>

                {/* Steps */}
                <div className="mt-auto space-y-3">
                  {card.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black mt-0.5 ${
                          isDarkMode
                            ? "bg-white/[0.06] text-slate-400"
                            : "bg-slate-200/80 text-slate-500"
                        }`}
                      >
                        {j + 1}
                      </div>
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-slate-300" : "text-slate-700"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(83, 176, 227, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(4, 74, 139, 0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6"
          >
            Ready to start collecting
            <br />
            and earning?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Join the growing network of Klinflow agents across Kenya.
            Flexible hours, instant pay, and real career growth in
            the circular economy.
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
              className="flex-1 sm:flex-none sm:w-auto px-8 py-4 sm:px-10 sm:py-5 bg-white text-slate-900 font-bold rounded-full shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              Apply to Join{" "}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
