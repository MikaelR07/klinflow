import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Navigation,
  Zap,
  Brain,
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
  Gauge,
  Users,
  Package,
  ChevronRight,
  Play,
  Pause,
  Star,
  Briefcase,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

export default function ProductAgent() {
  const { isDarkMode } = useThemeStore();
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeShowcase, setActiveShowcase] = useState(0);
  const [isShowcasePaused, setIsShowcasePaused] = useState(false);
  const [activeShowcase2, setActiveShowcase2] = useState(0);
  const [isShowcasePaused2, setIsShowcasePaused2] = useState(false);
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
  ];

  const showcaseCards = [
    {
      subtitle: "Mission Control",
      subtitleColor: "text-blue-500",
      title: "Your command center for collection ops.",
      description:
        "The Agent Dashboard gives you a real-time tactical overview of your active missions, pending pickups, earnings summary, and performance metrics. See everything at a glance — available jobs in your zone, your daily route, current wallet balance, and live notifications from the network. It's mission control, built for speed.",
      features: [
        "Live Job Feed",
        "Daily Earnings Tracker",
        "Zone-Based Dispatch",
      ],
      featureColor: "text-blue-500",
      bgFeatureColor: "bg-blue-500/20",
      image: agentImages[0],
    },
    {
      subtitle: "Smart Routing",
      subtitleColor: "text-cyan-500",
      title: "AI-optimized routes. Maximum yield.",
      description:
        "Stop wasting fuel and time on inefficient routes. Klinflow's Route Optimizer analyzes pickup density, traffic patterns, material volumes, and hub proximity to generate the most profitable multi-stop route for your shift. Accept jobs along optimized corridors and watch your per-hour earnings climb.",
      features: [
        "Multi-stop Optimization",
        "Fuel Cost Estimator",
        "Live Traffic Integration",
      ],
      featureColor: "text-cyan-500",
      bgFeatureColor: "bg-cyan-500/20",
      image: agentImages[1],
    },
    {
      subtitle: "Market Intelligence",
      subtitleColor: "text-indigo-500",
      title: "Know what every kilogram is worth.",
      description:
        "Access real-time market prices for every recyclable category before you even start collecting. The Agent Market view shows live buy/sell rates, trending materials, and price alerts so you can prioritize high-value collections and negotiate confidently with clients on the ground.",
      features: [
        "Real-time Price Feeds",
        "Material Trend Alerts",
        "Category Breakdown",
      ],
      featureColor: "text-indigo-500",
      bgFeatureColor: "bg-indigo-500/20",
      image: agentImages[2],
    },
  ];

  const showcaseCards2 = [
    {
      subtitle: "Verification Engine",
      subtitleColor: "text-violet-500",
      title: "Grade, weigh, verify. Cryptographically.",
      description:
        "Every collection you process is verified on-site using Klinflow's HygeneX grading engine. Photograph materials, log weights with calibrated digital scales, and generate a cryptographic proof-of-quality that locks in the transaction. No disputes, no chargebacks — just verified, transparent handshakes.",
      features: [
        "AI Material Grading",
        "Digital Scale Integration",
        "QR Cryptographic Seal",
      ],
      featureColor: "text-violet-500",
      bgFeatureColor: "bg-violet-500/20",
      image: agentImages[3],
    },
    {
      subtitle: "Agent Wallet",
      subtitleColor: "text-emerald-500",
      title: "Instant payouts. Zero waiting.",
      description:
        "The moment a Hub confirms your delivery, your commission hits your Klinflow Wallet instantly. Withdraw to M-Pesa or bank in seconds. Track every transaction, view detailed commission breakdowns per job, and access micro-loans backed by your collection history and performance score.",
      features: [
        "Instant M-Pesa Withdrawal",
        "Commission Breakdown",
        "Performance-backed Loans",
      ],
      featureColor: "text-emerald-500",
      bgFeatureColor: "bg-emerald-500/20",
      image: agentImages[4],
    },
  ];

  const agentChallenges = [
    {
      id: "inconsistent-jobs",
      problem: {
        title: "Inconsistent Job Flow",
        desc: "Agents waste hours waiting for collection requests. Without a centralized dispatch, finding profitable jobs is a daily gamble.",
        icon: Clock,
      },
      solution: {
        label: "AI Mission Dispatch",
        desc: "Smart job matching based on your location, vehicle capacity, and material specialization. Never idle — jobs come to you.",
        icon: Target,
      },
    },
    {
      id: "manual-routing",
      problem: {
        title: "Manual Route Planning",
        desc: "Plotting collection routes by hand leads to wasted fuel, missed time windows, and suboptimal earnings per shift.",
        icon: Route,
      },
      solution: {
        label: "Route Optimizer Engine",
        desc: "AI-driven multi-stop route planning that minimizes fuel cost and maximizes collections per hour across your zone.",
        icon: Navigation,
      },
    },
    {
      id: "delayed-payments",
      problem: {
        title: "Delayed Payments",
        desc: "Traditional collection work means waiting days or weeks for payment. Cash flow uncertainty kills agent retention.",
        icon: Wallet,
      },
      solution: {
        label: "Instant Escrow Settlement",
        desc: "Commission is triggered the moment the Hub accepts your intake. Withdraw instantly to M-Pesa or bank.",
        icon: Zap,
      },
    },
    {
      id: "no-insights",
      problem: {
        title: "No Performance Insights",
        desc: "Without data, agents can't improve. There's no visibility into which zones, materials, or times yield the best returns.",
        icon: BarChart3,
      },
      solution: {
        label: "HygeneX AI Coach",
        desc: "Real-time earning optimization tips based on material hotspots, market prices, and your historical performance data.",
        icon: Brain,
      },
    },
  ];

  useEffect(() => {
    if (isShowcasePaused) return;
    const timer = setInterval(() => {
      setActiveShowcase((prev) => (prev + 1) % showcaseCards.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isShowcasePaused, showcaseCards.length]);

  useEffect(() => {
    if (isShowcasePaused2) return;
    const timer = setInterval(() => {
      setActiveShowcase2((prev) => (prev + 1) % showcaseCards2.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isShowcasePaused2, showcaseCards2.length]);

  return (
    <Layout>
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 md:pt-40 md:pb-32 min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 ${isDarkMode ? "bg-surface-950" : "bg-transparent"}`}
          />
          <div
            className={`absolute inset-0 ${isDarkMode ? "opacity-[0.3]" : "opacity-[0.8]"}`}
            style={{
              backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/8 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full mt-4 lg:-mt-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Text */}
            <div className="max-w-2xl">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${isDarkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-100"}`}
              >
                <Truck className="w-4 h-4" />
                Agent Mission Control
              </div>

              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] ${isDarkMode ? "text-white" : "text-[#0f172a]"}`}
              >
                Collect and
                <br />
                Earn More.
                <br />
                <span className="text-blue-500">with Klinflow.</span>
              </h1>

              <p
                className={`text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
                Whether you're an independent agent, a fleet driver, or managing an entire collection company, Klinflow equips you with the tools and insights to streamline your operations, boost your income, and unlock the full potential of the circular economy. Klinflow streamlines dispatch, pickup verification, route optimization, and payouts through one intelligent platform built for circular logistics.
              </p>

              <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                <Link to="/contact" className="flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
                  Apply to Join Fleet{" "}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <Link to="/contact"
                  className={`flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                    isDarkMode
                      ? "bg-surface-800 text-white hover:bg-surface-700 border border-white/10"
                      : "bg-white text-slate-900 shadow-sm hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  Earning Calculator(coming soon) 
                </Link>
              </div>
            </div>

            {/* Right: Two static images */}
            <div className="relative flex justify-center lg:justify-end mt-16 lg:mt-0 perspective-[1000px] h-[450px] sm:h-[550px] md:h-[600px] items-center">
              <motion.div
                initial={{ opacity: 0, x: isMobile ? -15 : -30, y: 0 }}
                animate={{
                  opacity: 1,
                  x: isMobile ? "-20%" : "-45%",
                  y: isMobile ? -15 : -30,
                }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                  delay: 0.2,
                }}
                className={`absolute w-[200px] sm:w-[240px] md:w-[280px] aspect-[1/2] rounded-[2rem] overflow-hidden border shadow-2xl z-10 ${isDarkMode ? "border-white/10 bg-surface-900" : "border-slate-200 bg-white"}`}
              >
                <img
                  src={agentImages[0]}
                  alt="Agent App Home"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/5" />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: isMobile ? 15 : 30, y: 20 }}
                animate={{
                  opacity: 1,
                  x: isMobile ? "20%" : "45%",
                  y: isMobile ? 15 : 30,
                }}
                transition={{
                  duration: 0.8,
                  type: "spring",
                  bounce: 0.3,
                  delay: 0.4,
                }}
                className={`absolute w-[200px] sm:w-[240px] md:w-[280px] aspect-[1/2] rounded-[2rem] overflow-hidden border z-20 ${isDarkMode ? "border-white/10 bg-surface-900 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "border-slate-200 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.15)]"}`}
              >
                <img
                  src={agentImages[1]}
                  alt="Agent Jobs View"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      

      {/* ═══════════════════════════════════════════════════════════════════
          3. WHY AGENTS CHOOSE KLINFLOW — Interactive Bento + Flip Card
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-32 px-6 relative overflow-hidden ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}
      >
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.04]" : "opacity-[0.03]"}`}
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto mb-16 md:mb-20 text-center">
            <div className="inline-flex items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-500 mb-6">
              Why Agents Choose Klinflow
            </div>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Built for the agents who move the circular economy forward.
            </h2>
            <p
              className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              Traditional collection work is unpredictable, underpaid, and
              unsupported. Klinflow gives agents the professional tools,
              guaranteed income, and real-time intelligence to build a
              sustainable career.
            </p>
          </div>

          {/* Interactive Grid */}
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center relative">
            {/* LEFT: Bento Grid of Problems */}
            <div className="lg:col-span-8 grid grid-cols-2 gap-3 sm:gap-4 relative z-10">
              {agentChallenges.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setActiveFeature(i)}
                  className={`text-left p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col ${activeFeature === i ? (isDarkMode ? "bg-surface-950 border-blue-500" : "bg-white border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]") : isDarkMode ? "bg-surface-900/50 border-surface-900" : "bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white"}`}
                >
                  <div
                    className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 transition-colors duration-300 ${activeFeature === i ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" : isDarkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-100 text-rose-600"}`}
                  >
                    <item.problem.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <h4
                    className={`text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                  >
                    {item.problem.title}
                  </h4>
                  <p
                    className={`text-[10px] sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                  >
                    {item.problem.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* RIGHT: Flipping Solution Card */}
            <div className="lg:col-span-4 relative z-10 perspective-[1000px] mt-6 lg:mt-0 h-full flex flex-col justify-center min-h-[250px] lg:min-h-[280px]">
              <AnimatePresence mode="wait">
                {(() => {
                  const activeItem = agentChallenges[activeFeature];
                  const SolutionIcon = activeItem.solution.icon;
                  return (
                    <motion.div
                      key={activeFeature}
                      initial={{ rotateY: -90, opacity: 0, scale: 0.9 }}
                      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                      exit={{ rotateY: 90, opacity: 0, scale: 0.9 }}
                      transition={{
                        duration: 0.5,
                        type: "spring",
                        bounce: 0.3,
                      }}
                      className={`absolute inset-0 w-full p-6 lg:p-8 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col justify-center ${isDarkMode ? "bg-blue-900/20 border-blue-500/30" : "bg-blue-50 border-blue-200"}`}
                    >
                      <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-4 lg:mb-6 shadow-lg shadow-blue-500/30">
                        <SolutionIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mb-2 lg:mb-3">
                        The Klinflow Solution
                      </div>
                      <h3
                        className={`text-lg lg:text-xl font-bold mb-2 lg:mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {activeItem.solution.label}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-blue-100/70" : "text-blue-900/70"}`}
                      >
                        {activeItem.solution.desc}
                      </p>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. DEEP DIVE FEATURE SHOWCASE — Tabbed Layout (unique from Client's carousel)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-32 px-6 overflow-hidden relative ${isDarkMode ? "bg-surface-950" : "bg-white"}`}
      >
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.3]" : "opacity-[0.7]"}`}
          style={{
            backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <div className="inline-flex items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-500 mb-6">
              Deep Dive
            </div>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Every screen, purpose-built for agents.
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Tabbed feature list */}
            <div className="order-2 lg:order-1 space-y-3">
              {showcaseCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveShowcase(i);
                    setIsShowcasePaused(true);
                  }}
                  className={`w-full text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
                    activeShowcase === i
                      ? isDarkMode
                        ? "bg-surface-950 border-blue-500/40 shadow-lg"
                        : "bg-white border-blue-500 shadow-lg shadow-blue-500/5"
                      : isDarkMode
                        ? "bg-surface-900 border-surface-900"
                        : "bg-slate-50/50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Progress indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          activeShowcase === i
                            ? "bg-blue-500 text-white"
                            : isDarkMode
                              ? "bg-surface-800 text-slate-500"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${card.subtitleColor}`}
                      >
                        {card.subtitle}
                      </span>
                      <h3
                        className={`text-sm sm:text-base font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {card.title}
                      </h3>
                      <div className="mt-3">
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {card.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {card.features.map((feat) => (
                            <span
                              key={feat}
                              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${card.featureColor} ${card.bgFeatureColor}`}
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Phone mockup */}
            <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end perspective-[1000px] min-h-[500px]">
              <div className="relative max-w-[280px] md:max-w-[320px] w-full flex items-center aspect-[1/2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeShowcase}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center w-full"
                  >
                    <div
                      className={`rounded-[2rem] overflow-hidden border transition-all duration-500 shadow-2xl ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-200 bg-white"}`}
                    >
                      <img
                        src={showcaseCards[activeShowcase].image}
                        alt={showcaseCards[activeShowcase].subtitle}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Pause / Play */}
                <button
                  onClick={() => setIsShowcasePaused(!isShowcasePaused)}
                  className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${isDarkMode ? "bg-black/40 border-white/10 text-white hover:bg-black/60" : "bg-white/40 border-white/40 text-slate-900 hover:bg-white/60"}`}
                >
                  {isShowcasePaused ? (
                    <Play className="w-4 h-4 ml-0.5" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4.5. DEEP DIVE FEATURE SHOWCASE 2 — Flipped Alignment
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-24 px-6 overflow-hidden relative ${isDarkMode ? "bg-surface-950" : "bg-white"}`}
      >
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.3]" : "opacity-[0.5]"}`}
          style={{
            backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left: Phone mockup (Flipped) */}
            <div className="order-1 lg:order-1 relative flex justify-center lg:justify-start perspective-[1000px] min-h-[500px]">
              <div className="relative max-w-[280px] md:max-w-[320px] w-full flex items-center aspect-[1/2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeShowcase2}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center w-full"
                  >
                    <div
                      className={`rounded-[2rem] overflow-hidden border transition-all duration-500 shadow-2xl ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-200 bg-white"}`}
                    >
                      <img
                        src={showcaseCards2[activeShowcase2].image}
                        alt={showcaseCards2[activeShowcase2].subtitle}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Pause / Play */}
                <button
                  onClick={() => setIsShowcasePaused2(!isShowcasePaused2)}
                  className={`absolute top-4 right-4 z-30 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${isDarkMode ? "bg-black/40 border-white/10 text-white hover:bg-black/60" : "bg-white/40 border-white/40 text-slate-900 hover:bg-white/60"}`}
                >
                  {isShowcasePaused2 ? (
                    <Play className="w-4 h-4 ml-0.5" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Right: Tabbed feature list (Flipped) */}
            <div className="order-2 lg:order-2 space-y-3">
              {showcaseCards2.map((card, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setActiveShowcase2(i);
                    setIsShowcasePaused2(true);
                  }}
                  className={`w-full text-left p-5 sm:p-6 rounded-2xl border transition-all duration-300 ${
                    activeShowcase2 === i
                      ? isDarkMode
                        ? "bg-surface-950 border-blue-500/40 shadow-lg"
                        : "bg-white border-blue-500 shadow-lg shadow-blue-500/5"
                      : isDarkMode
                        ? "bg-surface-900 border-surface-900"
                        : "bg-slate-50/50 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Progress indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
                          activeShowcase2 === i
                            ? "bg-blue-500 text-white"
                            : isDarkMode
                              ? "bg-surface-800 text-slate-500"
                              : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${card.subtitleColor}`}
                      >
                        {card.subtitle}
                      </span>
                      <h3
                        className={`text-sm sm:text-base font-bold mt-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {card.title}
                      </h3>
                      <div className="mt-3">
                        <p
                          className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
                        >
                          {card.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {card.features.map((feat) => (
                            <span
                              key={feat}
                              className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold ${card.featureColor} ${card.bgFeatureColor}`}
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. AGENT PERFORMANCE DASHBOARD — Unique to Agent page
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-32 px-6 relative overflow-hidden ${isDarkMode ? "bg-surface-900" : "bg-slate-50"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Dashboard Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`p-8 sm:p-12 rounded-3xl border relative overflow-hidden ${isDarkMode ? "bg-surface-950 border-white/5" : "bg-white border-slate-200 shadow-xl"}`}
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <Gauge className="w-64 h-64 text-blue-500" />
              </div>
              <div className="relative z-10 space-y-8">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      label: "Efficiency Rating",
                      value: "98.4%",
                      color: "text-blue-500",
                    },
                    {
                      label: "Avg. Payout Time",
                      value: "Instant",
                      color: "text-emerald-500",
                    },
                    {
                      label: "Jobs This Week",
                      value: "47",
                      color: "text-indigo-500",
                    },
                    {
                      label: "Client Rating",
                      value: "4.92★",
                      color: "text-amber-500",
                    },
                  ].map((s, i) => (
                    <div key={i}>
                      <p
                        className={`text-[10px] sm:text-xs font-bold ${s.color} uppercase tracking-widest mb-1.5`}
                      >
                        {s.label}
                      </p>
                      <p
                        className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}
                      >
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Activity bars */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    This Week's Activity
                  </p>
                  <div className="flex gap-2">
                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-16 rounded-lg overflow-hidden flex flex-col justify-end ${isDarkMode ? "bg-white/5" : "bg-slate-100"}`}
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Text */}
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-500 mb-6">
                Performance Dashboard
              </div>
              <h2
                className={`text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Your career stats, always at your fingertips.
              </h2>
              <p
                className={`text-base md:text-lg leading-relaxed mb-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Track everything that matters — efficiency ratings, earnings
                trends, job completion rates, and client feedback. Klinflow
                turns raw data into actionable insights so you can optimize
                every shift.
              </p>
              <ul className="space-y-4">
                {[
                  "GPS Mission Dispatch System",
                  "Built-in HygeneX Grading Engine",
                  "Automated Fuel & Cost Tracking",
                  "Instant Reward Points Redemption",
                  "Weekly Performance Reports",
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 text-sm font-bold ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. AGENT TOOLKIT — Feature Grid (unique layout)
      ═══════════════════════════════════════════════════════════════════ */}
      <section
        className={`py-20 md:py-32 px-6 ${isDarkMode ? "bg-surface-950" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-sm font-medium text-blue-500 mb-6">
              Agent Toolkit
            </div>
            <h2
              className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Everything you need. Nothing you don't.
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Navigation,
                title: "Route Optimizer",
                desc: "AI-driven multi-stop route planning. Minimize fuel, maximize collections per shift.",
                color: "blue",
              },
              {
                icon: Zap,
                title: "Instant Settlement",
                desc: "Commission triggered the moment the Hub accepts your intake. Zero waiting.",
                color: "amber",
              },
              {
                icon: Brain,
                title: "HygeneX AI Coach",
                desc: "Real-time earning optimization based on hotspots, market trends, and fleet data.",
                color: "indigo",
              },
              {
                icon: Shield,
                title: "Verified Identity",
                desc: "KYC-verified agent profiles with trust scores. Build reputation, unlock premium jobs.",
                color: "emerald",
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                desc: "Get notified about high-value pickups, surge pricing zones, and urgent collection requests.",
                color: "violet",
              },
              {
                icon: Briefcase,
                title: "Career Growth",
                desc: "Level up from Rookie to Elite Agent. Higher tiers unlock better commissions and priority dispatch.",
                color: "cyan",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={`group p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 hover:shadow-xl ${isDarkMode ? "bg-surface-900 border-surface-900" : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white"}`}
              >
                <div
                  className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-${f.color}-500/10 text-${f.color}-500 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <h3
                  className={`text-sm sm:text-xl font-bold mb-2 sm:mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {f.title}
                </h3>
                <p
                  className={`text-[10px] sm:text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. FINAL CTA
      ═══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Ready to join the fleet?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Whether you're an independent collector or managing a fleet,
            Klinflow gives you the platform to scale your collection operations
            into a professional career.
          </p>
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link to="/contact" className="flex-1 sm:flex-none sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white text-blue-600 font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
              Contact Fleet Sales <ArrowRight className="w-5 h-5" />
            </Link>
            
          </div>
        </div>
      </section>
    </Layout>
  );
}
