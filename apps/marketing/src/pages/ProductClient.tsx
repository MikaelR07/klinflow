import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Truck,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Handshake,
  BarChart3,
  Brain,
  Leaf,
  LineChart,
  ShieldCheck,
  Users,
  ChevronRight,
  Zap,
  TrendingUp,
  EyeOff,
  SearchX,
  ClockAlert,
  ShieldAlert,
  Minimize2,
  RouteOff,
  Recycle,
  Star,
  Package,
  MapPin,
} from "lucide-react";
import Layout from "../layouts/Layout";

export default function ProductClient() {
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

  const sliderImages = [
    "/products/client/resident-home.webp",
    "/products/client/seller-home.webp",
    "/products/client/market-price.webp",
    "/products/client/book-pickup.webp",
    "/products/client/impact-analysis.webp",
    "/products/client/collective-hub.webp",
    "/products/client/client-wallet.webp"
  ];

  // ── PROBLEM / SOLUTION PAIRS ─────────────────────────────────
  const problemSolutionPairs = [
    {
      id: "opaque-pricing",
      number: "01",
      problem: {
        title: "Opaque Pricing",
        desc: "Most households and small sellers don't know what their recyclables are actually worth. Buyers set the price, and sellers just have to accept it.",
        icon: EyeOff,
      },
      solution: {
        label: "Live Market Prices",
        desc: "See real-time buying prices for every material category so you always know what your recyclables are worth before you sell.",
        icon: TrendingUp,
      },
    },
    {
      id: "limited-access",
      number: "02",
      problem: {
        title: "Limited Market Access",
        desc: "Finding reliable buyers is difficult. Most sellers depend on whoever shows up at their door, limiting their options and what they can earn.",
        icon: SearchX,
      },
      solution: {
        label: "Verified Buyer Network",
        desc: "Connect directly with verified recycling agents and buyers through our marketplace. List your materials and receive competitive offers.",
        icon: Users,
      },
    },
    {
      id: "small-volumes",
      number: "03",
      problem: {
        title: "Small Volumes Earn Less",
        desc: "Buyers often only want large quantities. If you only have a few kilos, you're stuck with lower prices or can't sell at all.",
        icon: Minimize2,
      },
      solution: {
        label: "Group Collections",
        desc: "Pool your recyclables with neighbours through Group Pickups. Together, you meet volume requirements and unlock better prices for everyone.",
        icon: Handshake,
      },
    },
    {
      id: "inefficient-collections",
      number: "04",
      problem: {
        title: "Unreliable Pickups",
        desc: "Scheduling a collection is hit or miss. You don't know when someone will come, if they'll show up, or what they'll pay once they arrive.",
        icon: RouteOff,
      },
      solution: {
        label: "Scheduled Pickups",
        desc: "Book a pickup and get matched with a verified collector near you. Track their arrival in real time and confirm everything on-site.",
        icon: Truck,
      },
    },
    {
      id: "delayed-payments",
      number: "05",
      problem: {
        title: "Delayed Payments",
        desc: "Cash transactions lead to disputes, and many sellers wait days to get paid. There's no record of what was collected or what was owed.",
        icon: ClockAlert,
      },
      solution: {
        label: "Instant Payouts",
        desc: "Get paid directly into your Klinflow wallet as soon as your materials are verified. Withdraw to M-Pesa or bank at any time.",
        icon: Zap,
      },
    },
    {
      id: "lack-of-trust",
      number: "06",
      problem: {
        title: "Lack of Trust",
        desc: "Disagreements over weight, material quality, and final price are common. Without records, there's no way to resolve disputes fairly.",
        icon: ShieldAlert,
      },
      solution: {
        label: "Full Transparency",
        desc: "Every collection is recorded with verified weights, agreed prices, and digital receipts. You always have a clear record of every transaction.",
        icon: ShieldCheck,
      },
    },
  ];

  // ── DEEP DIVE FEATURES ───────────────────────────────────────
  const deepDiveFeatures = [
    {
      subtitle: "For Residents",
      title: "Schedule a pickup in seconds.",
      description:
        "Whether you're a household clearing out recyclables or a small business with regular waste, simply post a pickup request. Klinflow matches you with a verified collector near you who arrives at your door, weighs everything on-site, and pays you instantly through the app.",
      features: [
        "One-tap pickup booking",
        "On-site weighing & verification",
        "Instant wallet payout",
      ],
      accentColor: "blue",
      image: "/products/client/book-pickup.webp",
      icon: Truck,
    },
    {
      subtitle: "For Sellers",
      title: "List, sell, earn — on your terms.",
      description:
        "The Klinflow Marketplace puts you in control. Create listings for your sorted recyclables, set your own prices, and receive offers from verified buyers. Whether you have 5 kilos of PET bottles or a tonne of scrap metal, there's a buyer on the platform looking for exactly what you have.",
      features: [
        "Create material listings with photos",
        "Receive and compare buyer offers",
        "Track orders from offer to payout",
      ],
      accentColor: "violet",
      image: "/products/client/seller-home.webp",
      icon: ShoppingBag,
    },
    {
      subtitle: "Market Intelligence",
      title: "Know exactly what your materials are worth.",
      description:
        "Access live market prices across all material categories. See what PET, HDPE, cardboard, metals, and more are trading at right now. Use pricing trends to decide the best time to sell and make sure you're always getting a fair deal.",
      features: [
        "Live price tickers across 50+ materials",
        "Historical trend charts",
        "Price alerts when rates go up",
      ],
      accentColor: "emerald",
      image: "/products/client/market-price.webp",
      icon: LineChart,
    },

    {
      subtitle: "Group Pickups",
      title: "Collect together. Earn more together.",
      description:
        "Join or create a Group Pickup with people in your area. Pool your recyclables to meet volume minimums that unlock better per-kilo rates from buyers. Payouts are split fairly based on each person's contribution.",
      features: [
        "Create or join community groups",
        "Pool materials for better rates",
        "Fair payout distribution",
      ],
      accentColor: "amber",
      image: "/products/client/collective-hub.webp",
      icon: Users,
    },
    {
      subtitle: "Digital Wallet",
      title: "Your earnings, always accessible.",
      description:
        "Every payout goes directly into your Klinflow Wallet. View your balance, track transaction history, and withdraw to M-Pesa or your bank account whenever you want. No cash handling, no delays.",
      features: [
        "Instant payouts after verification",
        "M-Pesa & bank withdrawals",
        "Full transaction history",
      ],
      accentColor: "emerald",
      image: "/products/client/client-wallet.webp",
      icon: Wallet,
    },
    {
      subtitle: "Impact Tracking",
      title: "See the difference you're making.",
      description:
        "Every kilogram you recycle through Klinflow is tracked. View your personal environmental impact — carbon offset, materials diverted from landfills, and your contribution to a cleaner community. Real numbers, not estimates.",
      features: [
        "Carbon offset metrics",
        "Total weight diverted from landfill",
        "Personal impact reports",
      ],
      accentColor: "teal",
      image: "/products/client/impact-analysis.webp",
      icon: Leaf,
    },
  ];

  // ── COLOR UTILITY ────────────────────────────────────────────
  const accent = (color: string, type: "text" | "bg" | "border" | "ring") => {
    const map: Record<string, Record<string, string>> = {
      blue: { text: "text-blue-500", bg: "bg-blue-500", border: "border-blue-500/20", ring: "ring-blue-500/10" },
      violet: { text: "text-violet-500", bg: "bg-violet-500", border: "border-violet-500/20", ring: "ring-violet-500/10" },
      emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500/20", ring: "ring-emerald-500/10" },
      amber: { text: "text-amber-500", bg: "bg-amber-500", border: "border-amber-500/20", ring: "ring-amber-500/10" },
      teal: { text: "text-teal-500", bg: "bg-teal-500", border: "border-teal-500/20", ring: "ring-teal-500/10" },
    };
    return map[color]?.[type] || "";
  };

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative pt-36 pb-32 md:pt-40 md:pb-44 overflow-hidden">
        {/* Background — dark slate, not green */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-emerald-500/10" />
          
        </div>

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-md font-medium mb-8 bg-primary/10 backdrop-blur-md text-primary border border-primary/20">
                Residents & Sellers
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.08] text-slate-900">
                Turn Recyclables
                <br />
                <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                  Into Instant Value.
                </span>
              </h1>

              <p className="text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl text-slate-600">
                Whether you're a household with a bag of plastic bottles or a
                scrap dealer with lots of recyclable materials — Klinflow connects you to
                verified buyers, access real-time market prices, and receive payouts for your materials.
              </p>

              <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  to="/contact"
                  className="flex-1 sm:flex-none px-6 py-3.5 sm:px-8 sm:py-4 bg-primary text-white hover:bg-primary/90 font-bold rounded-full active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap shadow-xl shadow-primary/20"
                >
                  Get Started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link
                  to="/products/agent"
                  className="flex-1 sm:flex-none px-6 py-3.5 sm:px-8 sm:py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                >
                  Become a Collector{" "}
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
                  src={sliderImages[1]}
                  alt="Resident Home"
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
                  src={sliderImages[6]}
                  alt="Seller Home"
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
              d="M0,20 Q720,80 1440,20 L1440,120 L0,120 Z"
              fill={isDarkMode ? "#103349" : "#f8fafc"}
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          2. WHO IS IT FOR — Quick persona cards
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-16 px-6 relative overflow-hidden ${
          isDarkMode ? "bg-surface-900" : "bg-slate-50"
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 md:mb-20">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-xs font-bold uppercase tracking-[0.25em] mb-4 ${
                isDarkMode ? "text-slate-500" : "text-slate-400"
              }`}
            >
              Built for two personas
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] ${
                isDarkMode ? "text-white" : "text-amber-500"
              }`}
            >
              One app, two experiences.
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10">
            {[
              {
                persona: "Residents",
                tagline: "Recycle from home",
                desc: "Schedule doorstep pickups for your household recyclables. A verified collector comes to you, weighs everything, and pays you on the spot through the app.",
                features: [
                  "Book pickups in one tap",
                  "Track your collector in real time",
                  "Earn into your wallet instantly",
                  "View your environmental impact",
                ],
                icon: Recycle,
                color: "blue",
                image: sliderImages[0],
              },
              {
                persona: "Sellers",
                tagline: "Sell at the best price",
                desc: "List your sorted recyclable materials on the Klinflow marketplace. Receive offers from multiple verified buyers, compare prices, and sell on your own terms.",
                features: [
                  "Create marketplace listings",
                  "Get competitive buyer offers",
                  "Access live market prices",
                  "Join Group Pickups for better rates",
                ],
                icon: TrendingUp,
                color: "violet",
                image: sliderImages[1],
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative rounded-3xl overflow-hidden border group ${
                  isDarkMode
                    ? "bg-surface-950 border-slate-800 hover:border-slate-700"
                    : "bg-slate-50 border-slate-200 hover:border-slate-300"
                } transition-all duration-300 flex flex-col lg:flex-row items-center gap-6 lg:gap-8`}
              >
                {/* Phone mockup */}
                <div className="relative w-[220px] sm:w-[280px] shrink-0 my-6 lg:ml-8">
                  <div className={`aspect-[9/19] rounded-[2rem] overflow-hidden border-2 shadow-2xl ${
                    isDarkMode ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"
                  } group-hover:shadow-3xl transition-shadow duration-500`}>
                    <img
                      src={card.image}
                      alt={card.persona}
                      className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 lg:py-10 lg:pr-8 lg:pl-0 flex-1">
                  <p
                    className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${accent(card.color, "text")}`}
                  >
                    {card.tagline}
                  </p>
                  <h3
                    className={`text-xl sm:text-2xl font-bold mb-3 ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {card.persona}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed mb-6 ${
                      isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {card.desc}
                  </p>
                  <ul className="space-y-2.5">
                    {card.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 ${accent(card.color, "text")}`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            isDarkMode ? "text-slate-300" : "text-slate-700"
                          }`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. WHY KLINFLOW EXISTS — Interactive Split Spotlight
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
              The Problem We Solve
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
              Recycling in Africa is broken.
              <br />
              <span className={isDarkMode ? "text-sky-300" : "text-[#1178ab]"}>
                We&apos;re fixing it.
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
              Traditional recycling is fragmented, opaque, and unfair.
              Klinflow replaces guesswork with transparency, delayed payments
              with instant payouts, and unreliable pickups with a verified
              network.
            </motion.p>
          </div>

          {/* Interactive Split Spotlight */}
          {(() => {
            const currentIssue =
              problemSolutionPairs.find((p) => p.id === activeIssue) ||
              problemSolutionPairs[0];
            if (!currentIssue) return null;
            const ProblemIcon = currentIssue.problem.icon;
            const SolutionIcon = currentIssue.solution.icon;
            const currentIndex = problemSolutionPairs.findIndex(
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
                  {problemSolutionPairs.map((item) => {
                    const isSelected = item.id === currentIssue.id;
                    const RowIcon = item.problem.icon;
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
                          {item.number}
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
                            {currentIssue.number} / 0{problemSolutionPairs.length}
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
                            {problemSolutionPairs.map((p) => (
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
                                problemSolutionPairs[
                                  (currentIndex + 1) %
                                    problemSolutionPairs.length
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
          4. DEEP DIVE FEATURES — Horizontal tabs + stage card
      ═══════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-28 px-6 overflow-hidden relative ${
          isDarkMode ? "bg-surface-900" : "bg-primary/20"
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
              Everything you need, built in.
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
              From scheduling your first pickup to tracking your impact on
              the environment — every step is covered.
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

              {/* Right — Phone Image (bigger) */}
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
          5. FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
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
            Start turning your recyclables
            <br />
            into real earnings.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto"
          >
            Join residents and sellers across Kenya who are already using
            Klinflow to sell smarter, earn more, and make a measurable
            environmental impact.
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
              Contact Sales{" "}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
