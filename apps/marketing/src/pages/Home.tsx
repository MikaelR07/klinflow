import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Users,
  Factory,
  ShoppingCart,
  Zap,
  ArrowRight,
  ChevronRight,
  Search,
  Shield,
  Recycle,
  Handshake,
  Truck,
  Layout as LayoutIcon,
  Briefcase,
  LineChart,
  User,
  Building2,
  Package,
  Warehouse,
  ExternalLink,
  Brain,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";
import DownloadSection from "../components/DownloadSection";
import GlassMockup from "../components/GlassMockup";

// ── CORE LOOP DATA ──────────────────────────────────────────────────
const loopSteps = [
  {
    id: 1,
    title: "Post Waste",
    desc: "Residents schedule pickups via Client App.",
    icon: Package,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: 2,
    title: "Collect & Verify",
    desc: "Agents verify weight and grade via Agent App.",
    icon: Truck,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    id: 3,
    title: "Instant Payout",
    desc: "Sustainomics engine triggers escrow release.",
    icon: Handshake,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
  },
  {
    id: 4,
    title: "Hub Intake",
    desc: "Materials processed and sold at scale via Hub App.",
    icon: Warehouse,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
];
// ECOSYSTEM DATA
const ecosystemNodes = [
  {
    id: "communities",
    label: "Residents",
    icon: Users,
    angle: 180,
    title: "Communities & Residents",
    description:
      "Households and community members can easily pool their recyclable waste, request pickups, and get rewarded instantly, fostering a cleaner and greener environment.",
    features: [
      {
        title: "Pickup Requests",
        desc: "Schedule convenient waste pickups directly from your location.",
      },
      {
        title: "Community Swarms",
        desc: "Join local community efforts to pool recyclables and increase value.",
      },
      {
        title: "Rewards & Wallet",
        desc: "Earn digital tokens or cash instantly for your sorted materials.",
      },
      {
        title: "Impact Tracking",
        desc: "Monitor your personal environmental contribution and carbon offset.",
      },
    ],
  },
  {
    id: "collectors",
    label: "Agents",
    icon: Truck,
    angle: 240,
    title: "Logistics Agents",
    description:
      "Agents coordinate pickups, manage fleet routes, and ensure swift transportation of materials from residents to the aggregation hubs.",
    features: [
      {
        title: "Route Optimization",
        desc: "AI-driven mapping to find the most efficient pickup paths.",
      },
      {
        title: "Job Marketplace",
        desc: "Access a live feed of available pickup requests in your vicinity.",
      },
      {
        title: "Instant Settlements",
        desc: "Get paid immediately upon successful material delivery to hubs.",
      },
      {
        title: "Fleet Management",
        desc: "Monitor vehicle status, driver performance, and operational costs.",
      },
    ],
  },
  {
    id: "recyclers",
    label: "Recyclers",
    icon: Factory,
    angle: 0,
    title: "Recycling Facilities",
    description:
      "Recyclers gain steady access to high-quality, pre-sorted materials with full supply chain visibility and streamlined procurement.",
    features: [
      {
        title: "Material Sourcing",
        desc: "Procure verified and graded recyclables directly from the platform.",
      },
      {
        title: "Inventory Visibility",
        desc: "Track incoming shipments and manage your warehouse stock.",
      },
      {
        title: "Supply Analytics",
        desc: "Analyze procurement trends, pricing patterns, and volume metrics.",
      },
      {
        title: "Verified Suppliers",
        desc: "Work with vetted hubs and agents for consistent material quality.",
      },
    ],
  },
  {
    id: "enterprises",
    label: "Businesses",
    icon: Building2,
    angle: 60,
    title: "Enterprise Partners",
    description:
      "Corporate businesses can manage their ESG reporting, comply with environmental regulations, and achieve zero-waste goals transparently.",
    features: [
      {
        title: "ESG Reporting",
        desc: "Generate automated, verifiable sustainability and compliance reports.",
      },
      {
        title: "Compliance Tracking",
        desc: "Stay ahead of local and international environmental regulations.",
      },
      {
        title: "Impact Analytics",
        desc: "Measure the exact volume of waste diverted from landfills.",
      },
      {
        title: "Carbon Visibility",
        desc: "Calculate and monitor carbon emissions saved through recycling.",
      },
    ],
  },
  {
    id: "buyers",
    label: "Sellers",
    icon: ShoppingCart,
    angle: 120,
    title: "Material Sellers",
    description:
      "Hub owners and aggregators can list their sorted materials on the marketplace to connect with top-tier buyers and recyclers.",
    features: [
      {
        title: "RFQ Marketplace",
        desc: "Publish and respond to Requests for Quotation seamlessly.",
      },
      {
        title: "Verified Listings",
        desc: "Showcase graded materials to a network of trusted buyers.",
      },
      {
        title: "Market Intelligence",
        desc: "Access real-time pricing data to sell at the best possible rates.",
      },
      {
        title: "Secure Transactions",
        desc: "Guarantee safe, escrow-backed payments for large volume trades.",
      },
    ],
  },
  {
    id: "circular",
    label: "Company Owner",
    icon: Recycle,
    angle: 300,
    title: "Company Administration",
    description:
      "Platform administrators have a bird's-eye view of the entire circular ecosystem, managing operations, finance, and platform growth.",
    features: [
      {
        title: "Ecosystem Oversight",
        desc: "Monitor all transactions, material flows, and user activities globally.",
      },
      {
        title: "Financial Controls",
        desc: "Manage escrow systems, payouts, and platform revenue.",
      },
      {
        title: "System Analytics",
        desc: "Deep-dive into performance metrics and macro-level impact data.",
      },
      {
        title: "User Governance",
        desc: "Verify new partners, handle disputes, and maintain platform integrity.",
      },
    ],
  },
];

const appCards = [
  {
    title: "Client Dashboard",
    desc: "Household waste management & B2B seller listings.",
    img: "/grid/seller-home.webp",
    path: "/products/client",
    icon: User,
    color: "emerald",
  },
  {
    title: "Agent Terminal",
    desc: "Mission control for independent agents and fleet drivers.",
    img: "/grid/agent-home.webp",
    path: "/products/agent",
    icon: Truck,
    color: "blue",
  },
  {
    title: "Fleet Admin",
    desc: "B2B management for recycling centers and fleet companies.",
    img: "/grid/business-home.webp",
    path: "/products/fleet",
    icon: Building2,
    color: "indigo",
  },
  {
    title: "Hub Command",
    desc: "Industrial-grade intake and material processing system.",
    img: "/grid/Hub-home.webp",
    path: "/products/hub",
    icon: Warehouse,
    color: "rose",
  },
];

export default function Home() {
  const { isDarkMode } = useThemeStore();
  const [selectedImage, setSelectedImage] = useState<
    (typeof screenshots)[0] | null
  >(null);
  const [activeNode, setActiveNode] = useState(0);
  const [isAutoPaused, setIsAutoPaused] = useState(false);
  const [heroImageIndex, setHeroImageIndex] = useState(0);

  const heroCarouselImages = [
    "/products/fleet-manager/manager-dashboard.webp",
    "/landing-page/hero/hero1.webp",
    "/products/fleet-manager/marketplace-view.webp",
    "/products/fleet-manager/market-prices.webp",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroImageIndex((prev) => (prev + 1) % heroCarouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAutoPaused) return;

    const interval = setInterval(() => {
      setActiveNode((prev) =>
        prev === ecosystemNodes.length - 1 ? 0 : prev + 1,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPaused]);

  const screenshots = [
    {
      src: "/grid/agent-home.webp",
      alt: "Agent Terminal - Tactical Mission Control",
    },
    {
      src: "/grid/seller-home.webp",
      alt: "Merchant Dashboard - Marketplace Trade Hub",
    },
    {
      src: "/grid/book-pickup.webp",
      alt: "Resident Terminal - Mission Request Interface",
    },
    {
      src: "/grid/business-home.webp",
      alt: "B2B Business Portal - Bulk Material Sourcing",
    },
    // {
    //   src: "/grid/Resident-home.webp",
    //   alt: "Resident Dashboard - Household Waste Management",
    // },
    {
      src: "/grid/Hub-home.webp",
      alt: "Hub Command Center - Industrial Intake",
    },
    {
      src: "/grid/admin-dashboard.webp",
      alt: "System Administration - Global Network Stats",
    },
    // {
    //   src: "/grid/company-owner-home.webp",
    //   alt: "Fleet Admin - Logistics Company Management",
    // },
    {
      src: "/grid/agent-dashboard.webp",
      alt: "Agent Analytics - Performance & Earnings Tracking",
    },
  ];

  return (
    <Layout>
      {/* HERO SECTION ─────────────────────────────────────────── */}
      <section className={`relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-[70vh] md:min-h-[85vh] flex items-center ${isDarkMode ? "bg-surface-950" : "bg-white"}`}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 ${isDarkMode ? "opacity-[0.2]" : "opacity-[0.8]"}`}
            style={{
              backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-[400px] h-[400px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 relative z-20 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <div className="lg:col-span-5 max-w-xl lg:max-w-2xl -translate-y-8 lg:-translate-y-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 ${isDarkMode ? "bg-primary/10 border-primary/20" : "bg-emerald-50 border-primary/20"}`}
              >
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-primary-dark dark:text-primary">
                  The Infrastructure for Circular Assets
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-8 leading-[1.1] ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Technical infrastructure defining{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark">
                  the next generation of circular recovery.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-sm sm:text-base md:text-base font-medium leading-relaxed mb-10 ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}
              >
                Klinflow aims to redefine how recyclable materials are collected, traded, and monetized. Through integrated mobile applications, smart logistics tools, marketplace technology, and community-driven collection networks, we empower residents, sellers, agents, and recycling businesses to participate in a transparent and efficient recycling ecosystem. By transforming waste streams into economic opportunities, Klinflow unlocks new value chains while supporting environmental impact, job creation, and sustainable urban development.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-row items-stretch gap-2 sm:gap-4 w-full"
              >
                <Link
                  to="/contact"
                  className="flex-1 sm:flex-none btn-primary flex flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm capitalize tracking-wide px-2 py-3 sm:px-6 text-center leading-tight"
                >
                  <span>Contact Us</span> <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 hidden sm:inline" />
                </Link>
              </motion.div>
            </div>

            {/* Right Column: 3D Perspective Hero Image Carousel */}
            <div className="lg:col-span-7 relative w-full mt-16 lg:mt-0 z-20 lg:ml-12 lg:translate-x-10">
              <div
                style={{ perspective: "1200px" }}
                className="w-full"
              >
                <div
                  className={`rounded-[1rem] border relative flex items-center justify-center overflow-hidden shadow-slate-600 dark:shadow-none shadow-2xl scale-105 lg:scale-[1.12] origin-center w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/11] ${isDarkMode ? "bg-white/5 border-white/10 shadow-black/40" : "bg-slate-50 border-slate-200 shadow-slate-300/50"}`}
                  style={{
                    transform: "rotateY(-12deg) rotateX(4deg)",
                    transformOrigin: "top center",
                    transition: "transform 0.5s ease",
                  }}
                >
                  <AnimatePresence>
                    <motion.img
                      key={heroImageIndex}
                      src={heroCarouselImages[heroImageIndex]}
                      alt="Klinflow Platform Preview"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      fetchPriority="high"
                      className="absolute inset-0 w-full h-full object-fill object-center"
                    />
                  </AnimatePresence>
                </div>
              </div>
              {/* Subtle shadow beneath the 3D card */}
              <div className={`absolute -bottom-4 left-[15%] right-[5%] h-10 blur-2xl rounded-full ${isDarkMode ? "bg-primary/10" : "bg-slate-300/30"}`} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STRATEGIC VISION ────────────────────────────────────── */}
      <section
        id="vision"
        className={`py-16 md:py-32 relative overflow-hidden transition-colors ${isDarkMode ? "bg-surface-900 border-b border-white/5" : "bg-white border-b border-slate-200"}`}
      >
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] blur-[120px] opacity-20 rounded-full bg-primary/5 pointer-events-none`}
        />

        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <motion.div
              className="lg:col-span-5 max-w-xl lg:max-w-2xl"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm font-black uppercase tracking-widest text-primary mb-2 font-mono">
                Our Goal
              </h2>
              <h3
                className={`text-2xl sm:text-3xl md:text-4xl font-black mb-8 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                A Future Where <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark italic">
                  Waste is an Asset.
                </span>
              </h3>
              <p
                className={`text-sm sm:text-base md:text-lg font-medium leading-relaxed mb-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Klinflow is more than a recycling platform—it is the
                infrastructure powering a modern circular economy. By connecting
                households, waste collectors, recyclers, and industrial buyers
                through a single digital ecosystem, Klinflow transforms waste
                from an overlooked liability into a traceable, monetizable
                resource. Through real-time tracking, intelligent logistics,
                automated incentives, and transparent marketplace transactions,
                we are building the systems that make sustainable resource
                recovery scalable, profitable, and accessible to everyone.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-6">
                {[
                  {
                    label: "Traceability",
                    val: "100%",
                    sub: "Source to Recycler",
                  },
                  { label: "Rewards", val: "Instant", sub: "Digital Payouts" },
                  {
                    label: "AI Operations",
                    val: "24/7",
                    sub: "Predictive Analytics",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`p-3 sm:p-6 rounded-2xl border flex flex-col justify-center ${isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200"}`}
                  >
                    <div className="text-lg sm:text-2xl font-black text-primary mb-1">
                      {stat.val}
                    </div>
                    <div
                      className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest mb-1 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}
                    >
                      {stat.label}
                    </div>
                    <div className="text-[9px] sm:text-xs text-slate-500 font-medium leading-tight hidden sm:block">
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-7 relative w-full mt-12 lg:mt-0 z-20 lg:ml-8">
              <div
                className={`rounded-[2rem] border relative flex items-center justify-center overflow-hidden shadow-2xl scale-105 lg:scale-[1.15] origin-center lg:origin-left w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/11] ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <img
                  src="/landing-page/asset.webp"
                  alt="Thesis Asset"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERCONNECTED ECOSYSTEM SECTION */}
      <section
        className={`relative overflow-hidden py-16 md:py-16 ${
          isDarkMode ? "bg-surface-950" : "bg-slate-50"
        }`}
      >
        {/* DOT GRID */}

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6">
          <header className="text-left max-w-2xl mb-8 md:mb-3">
            <span className="uppercase tracking-[0.3em] text-primary text-[10px] md:text-xs font-bold mb-3 block">
              Interconnected Ecosystem
            </span>

            <h2
              className={`text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4 ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              One Platform.{" "}
              <span className="text-primary">Every Stakeholder.</span>
            </h2>

            <p
              className={`text-sm md:text-base max-w-xl leading-relaxed ${
                isDarkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Klinflow powers the entire circular economy by connecting
              communities, collectors, transporters, recyclers, enterprises and
              buyers through one intelligent platform.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* ECOSYSTEM */}

            <figure className="relative h-[460px] sm:h-[500px] lg:h-[650px] w-full flex items-center justify-center -mt-10 lg:mt-0 overflow-visible">
              <div className="absolute inset-0 flex items-center justify-center transform scale-[0.55] sm:scale-[0.70] lg:scale-[0.90] origin-center transition-transform duration-500">
                {/* RING */}

                <div
                  className={`absolute w-[520px] h-[520px] rounded-full border ${
                    isDarkMode ? "border-white/10" : "border-green-300"
                  }`}
                />

                {/* CENTER GLOW */}

                <div className="absolute w-72 h-72 bg-primary/20 blur-3xl rounded-full" />

                {/* CENTER */}

                <motion.div
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                  }}
                  className={`relative z-20 w-60 h-60 rounded-full flex flex-col items-center justify-center ${
                    isDarkMode
                      ? "bg-surface-900 border border-white/10"
                      : "bg-white border border-green-400 shadow-2xl"
                  }`}
                >
                  <img
                    src="/landing-page/app-logo.webp"
                    alt="Klinflow"
                    className="w-24 h-24 md:w-28 md:h-28 object-contain"
                  />
                  <span className="mt-1 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-primary text-center leading-wide">
                    Klinflow
                    <br />
                    Ecosystem
                  </span>
                </motion.div>

                {ecosystemNodes.map((node, index) => {
                  const angle = (node.angle * Math.PI) / 180;
                  const ORBIT_RADIUS = 240;
                  const x = Math.cos(angle) * ORBIT_RADIUS;
                  const y = Math.sin(angle) * ORBIT_RADIUS;

                  const active = activeNode === index;

                  const Icon = node.icon;

                  return (
                    <div
                      key={node.id}
                      className="absolute"
                      style={{
                        left: "50%",
                        top: "50%",
                        transform: `
                    translate(-50%, -50%)
                    translate(${x}px, ${y}px)
                  `,
                      }}
                    >
                      {/* CENTER CONNECTOR */}

                      <div
                        className={`absolute left-1/2 top-1/2 origin-left  ${
                          active
                            ? "bg-primary"
                            : isDarkMode
                              ? "bg-white/10"
                              : "bg-slate-200"
                        }`}
                        style={{
                          width: `${ORBIT_RADIUS}px`,
                          height: "2px",
                          transform: `
                      rotate(${node.angle}deg)
                      translateX(-${ORBIT_RADIUS}px)
                    `,
                        }}
                      >
                        {active && (
                          <>
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.8)]"
                                initial={{ left: "0%", opacity: 0 }}
                                animate={{
                                  left: "100%",
                                  opacity: [0, 1, 1, 0],
                                }}
                                transition={{
                                  duration: 1.5,
                                  repeat: Infinity,
                                  ease: "linear",
                                  delay: i * 0.5,
                                }}
                              />
                            ))}
                          </>
                        )}
                      </div>

                      {/* NODE */}

                      <button
                        onClick={() => {
                          setActiveNode(index);
                          setIsAutoPaused(true);
                        }}
                        className={`
                    relative z-20
                    w-24 h-24 rounded-full
                    flex flex-col items-center justify-center
                    transition-all duration-500

                    ${
                      active
                        ? "bg-primary text-white scale-110 shadow-[0_0_40px_rgba(34,197,94,0.45)]"
                        : isDarkMode
                          ? "bg-surface-900 border border-white/10 text-white"
                          : "bg-white border border-slate-200 text-slate-700 shadow-lg"
                    }
                  `}
                      >
                        <Icon className="w-6 h-6 mb-1" />

                        <span className="text-[10px] font-semibold">
                          {node.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </figure>

            {/* CONTENT PANEL */}

            <article
              className={`rounded-[32px] p-6 md:p-6 ${
                isDarkMode
                  ? "bg-surface-900 border border-white/10"
                  : "bg-white border border-slate-200 shadow-2xl"
              }`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={ecosystemNodes[activeNode].id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -20,
                  }}
                  transition={{
                    duration: 0.4,
                  }}
                >
                  <span className="uppercase tracking-[0.2em] text-primary text-xs font-bold">
                    Ecosystem Participant
                  </span>

                  <h3
                    className={`mt-1 text-xl md:text-xl lg:text-xl font-black ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {ecosystemNodes[activeNode].title}
                  </h3>

                  <p
                    className={`mt-2 md:mt-2 text-sm md:text-base leading-relaxed ${
                      isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {ecosystemNodes[activeNode].description}
                  </p>

                  <div className="mt-6 md:mt-8 grid gap-3 md:gap-4">
                    {ecosystemNodes[activeNode].features.map((feature) => (
                      <div
                        key={feature.title}
                        className="flex items-start gap-4"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />

                        <div className="flex flex-col">
                          <span
                            className={`text-sm md:text-base font-bold leading-none ${
                              isDarkMode ? "text-slate-200" : "text-slate-800"
                            }`}
                          >
                            {feature.title}
                          </span>
                          <span
                            className={`text-xs md:text-sm mt-1.5 leading-relaxed ${
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            {feature.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </article>
          </div>
        </div>
      </section>
      {/* ── SHOWCASE BANNER ────────────────────────────────────────────── */}
      <section
        className={`hidden md:flex w-full relative z-10 px-4 md:px-6 mt-8 md:mt-16 mb-16 md:mb-20 justify-center`}
      >
        <div
          className={`max-w-7xl w-full rounded-[2rem] border overflow-hidden relative shadow-2xl ${isDarkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
        >
          <img
            src="/landing-page/banner3.webp"
            alt="Klinflow Platform Showcase"
            className="w-full h-auto object-cover"
          />
        </div>
      </section>
      {/* CORE PRODUCT SUITE ──────────────────────────────────── */}
      <section
        className={`py-16 md:py-32 relative z-10 ${isDarkMode ? "bg-surface-900" : "bg-slate-50/50"}`}
      >
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="mb-8 text-left max-w-7xl mx-auto">
            <div
              className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${isDarkMode ? "text-primary" : "text-primary-dark"}`}
            >
              The Platform
            </div>
            <h3
              className={`text-3xl md:text-5xl font-bold tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              Native Product Suite
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-10 max-w-7xl mx-auto">
            {[
              {
                title: "Seller App",
                desc: "Book pickups, track earnings, and manage collections effortlessly.",
                img: "/grid/seller-home.webp",
              },
              {
                title: "Agent App",
                desc: "Optimize routes, manage bookings, and update in real-time.",
                img: "/grid/agent-home.webp",
              },
              {
                title: "Impact Analysis",
                desc: "Track buyer & seller behaviour and price patterns using our AI",
                img: "/grid/agent-dashboard.webp",
              },
              {
                title: "Business App",
                desc: "Manage inventory, sort materials, and track hub performance reports.",
                img: "/grid/business-home.webp",
              },
              {
                title: "Market Intelligence",
                desc: "Monitor the klinflow marketplace prices and sell at your preferred time",
                img: "/grid/prices.webp",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col text-left group cursor-pointer"
                onClick={() =>
                  setSelectedImage({ src: item.img, alt: item.title })
                }
              >
                <div
                  className={`rounded-[2rem] border overflow-hidden mb-6 transition-all duration-500 ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-200 bg-white shadow-xl group-hover:shadow-2xl"}`}
                >
                  <img
                    src={item.img}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <h4
                  className={`text-base md:text-xl font-bold mb-2 md:mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {item.title}
                </h4>
                <p
                  className={`text-xs md:text-sm font-medium leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}
                >
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-20 flex justify-center">
            <Link
              to="/gallery"
              className="px-8 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-95 bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-lg shadow-emerald-500/20 flex items-center gap-2"
            >
              View Ecosystem Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HYGENEX AI: Material Valuation ───────────────────────────────── */}
      <section
        className={`py-24 relative overflow-hidden ${isDarkMode ? "bg-surface-950" : "bg-white"}`}
      >
        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-5 max-w-xl lg:max-w-2xl">
            <div className="inline-flex items-center gap-2 text-indigo-500 font-bold uppercase tracking-widest text-xs mb-6">
              <Brain className="w-5 h-5" /> The Sustainomics Engine
            </div>
            <h3
              className={`text-2xl sm:text-3xl md:text-5xl font-bold mb-8 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              The Source of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 italic">
                Material Value.
              </span>
            </h3>
            <p
              className={`text-sm sm:text-base md:text-xl font-medium leading-relaxed mb-12 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              HygeneX is our proprietary AI engine that powers the entire
              ecosystem. It identifies 50+ material types, grades quality
              instantly, and provides a real-time "Oracle" price for every gram
              you collect.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4">
              {[
                {
                  title:
                    "Residents schedule pickups, receive weight-based valuation, and receive payouts in real time via Cash rewards and GreenFuel Points",
                  icon: Shield,
                },
                {
                  title:
                    "Agents leverage AI grading, Our on spot material Marketplace and multi-stop route optimization to maximize hourly commission yield.",
                  icon: LineChart,
                },
                {
                  title:
                    "Industrial buyers secure consistent supply of material lots through transparent B2B escrow trades and logistics tracking.",
                  icon: Handshake,
                },
              ].map((f, i) => (
                <div
                  key={i}
                  className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border flex flex-col lg:flex-row gap-3 lg:gap-6 items-start ${isDarkMode ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100"}`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <p className="text-[10px] sm:text-sm text-slate-500 font-semibold leading-tight sm:leading-relaxed">
                    {f.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sustainomics Engine Image */}
          <div className="lg:col-span-7 relative w-full perspective-[2000px] z-20 mt-12 lg:mt-0">
            <div className="relative transform rotate-y-[-10deg] rotate-x-[5deg] scale-105 md:scale-110 lg:scale-[1.2] transition-all duration-700 ease-out lg:ml-12 origin-center lg:origin-left">
              <div
                className={`w-full h-[400px] md:h-[600px] rounded-[2rem] border relative flex items-center justify-center overflow-hidden shadow-2xl ${isDarkMode ? "bg-[#0F172A] border-white/10 shadow-indigo-500/10" : "bg-slate-50 border-slate-200 shadow-slate-200/50"}`}
              >
                <img
                  src="/landing-page/HygeneX.webp"
                  alt="HygeneX Sustainomics Engine"
                  className="w-full h-full object-cover md:scale-[1.1] relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONVERSION CTA ────────────────────────────────────────────────── */}
      <section
        className={`py-24 px-6 relative overflow-hidden ${isDarkMode ? "bg-surface-900 border-t border-white/5" : "bg-slate-900"}`}
      >
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-8">
            Ready to <br /> Scale with Us?
          </h2>
          <p className="text-sm sm:text-base md:text-2xl font-medium mb-12 opacity-80 leading-relaxed text-slate-300">
            Join the network that is defining the next generation of circular
            logistics. Deploy your fleet, process your waste, or trade verified
            assets at scale.
          </p>
        </div>
      </section>
      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-950/95 backdrop-blur-xl p-6"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full max-h-[60vh] flex items-center justify-center"
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl border-4 border-white/10"
            />
            <button
              className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold uppercase tracking-widest text-xs hover:text-primary transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              Close Preview <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
