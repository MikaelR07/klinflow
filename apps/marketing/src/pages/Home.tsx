import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Users,
  Factory,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Search,
  Shield,
  Recycle,
  Handshake,
  Truck,
  LineChart,
  User,
  Building2,
  Package,
  Warehouse,
  Brain,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

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
  const [activeNode, setActiveNode] = useState(0);
  const [selectedImage, setSelectedImage] = useState<
    (typeof screenshots)[0] | null
  >(null);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

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

  const [mousePos, setMousePos] = useState({ x: 0, y: 0, xPct: 0, yPct: 0 });
  const [isGridHovered, setIsGridHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width) * 2 - 1;
    const yPct = (y / rect.height) * 2 - 1;

    setMousePos({ x, y, xPct, yPct });
  };

  return (
    <Layout>
      {/* HERO SECTION ─────────────────────────────────────────── */}
      <section 
        className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden min-h-[70vh] md:min-h-[85vh] flex items-center bg-transparent perspective-[1000px]"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsGridHovered(true)}
        onMouseLeave={() => setIsGridHovered(false)}
      >
        {/* Background Interactive Grid Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <motion.div
            animate={{
              rotateX: isGridHovered ? mousePos.yPct * -6 : 0,
              rotateY: isGridHovered ? mousePos.xPct * 6 : 0,
              scale: 1.15
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="absolute inset-[-20%] w-[140%] h-[140%]"
          >
            {/* Base Faint Grid */}
            <div
              className={`absolute inset-0 opacity-[0.04] ${isDarkMode ? "text-white" : "text-slate-900"}`}
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            {/* Highlight Spotlight Grid */}
            <motion.div
              animate={{ opacity: isGridHovered ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 opacity-[0.06] ${isDarkMode ? "text-emerald-600/40" : "text-emerald-700/50"}`}
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                // Offset the mask because the parent is 140% sized and centered
                WebkitMaskImage: `radial-gradient(350px circle at calc(10% + ${mousePos.x}px) calc(10% + ${mousePos.y}px), black 0%, transparent 100%)`,
                maskImage: `radial-gradient(350px circle at calc(10% + ${mousePos.x}px) calc(10% + ${mousePos.y}px), black 0%, transparent 100%)`,
              }}
            />
          </motion.div>
        </div>
        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 relative z-20 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <div className="lg:col-span-5 max-w-xl lg:max-w-2xl -translate-y-8 lg:-translate-y-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-8">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  The ecosystem for Circular Assets
                </span>
              </div>

              <h1 className={`text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-[1.1] ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                TECHNICAL INFRASTRUCTURE FOR <span className="text-primary">MODERN RECYCLING.</span>
              </h1>

              <p className={`text-sm sm:text-base md:text-lg font-normal leading-relaxed mb-10 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                Klinflow is a unified platform redefining how recyclable materials are collected, traded, and monetized. Through integrated mobile applications, intelligent logistics, Digital marketplace, and connected collection networks, we empower residents, sellers, agents, Businesses and recycling facilities to participate in a transparent, efficient and data-driven circular economy.
              </p>

              <div className="flex flex-row items-stretch gap-4 w-full">
                <Link
                  to="/contact"
                  className="bg-primary hover:bg-primary-dark text-white border border-primary-dark font-medium px-6 py-3 rounded-md transition-colors text-sm"
                >
                  Contact Us
                </Link>
                <Link
                  to="/products/client"
                  className={`bg-transparent font-medium px-6 py-3 rounded-md transition-colors text-sm ${isDarkMode ? "hover:bg-white/5 text-slate-300 border border-slate-700" : "hover:bg-slate-100 text-slate-700 border border-slate-300"}`}
                >
                  View Products
                </Link>
              </div>
            </div>
            {/* Right Column: 3D Perspective Hero Image Carousel */}
            <div className="lg:col-span-7 relative w-full mt-16 lg:mt-0 z-20 lg:ml-12 lg:translate-x-10">
              <div
                style={{ perspective: "1200px" }}
                className="w-full"
              >
                <div
                  className={`rounded-[1rem] border relative flex items-center justify-center overflow-hidden shadow-2xl scale-105 lg:scale-[1.15] origin-center lg:origin-left w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/11] transition-transform duration-500 hover:rotate-0 hover:scale-[1.15] ${isDarkMode ? "border-slate-800 bg-surface-900 shadow-black/40" : "border-slate-200 bg-white shadow-slate-300/40"}`}
                  style={{
                    transform: "rotateY(-12deg) rotateX(4deg)",
                    transformOrigin: "top center",
                    transition: "transform 0.5s ease",
                  }}
                >
                  <img
                    src="/landing-page/hero/eco.webp"
                    alt="Klinflow Platform Dashboard"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
              </div>
              {/* Subtle shadow beneath the 3D card */}
              <div className="absolute -bottom-4 left-[15%] right-[5%] h-10 blur-2xl rounded-full bg-primary/10" />
            </div>
          </div>
        </div>
      </section>

     

      {/* ── ACHIEVEMENTS MARQUEE ───────────────────────────────────────── */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-transparent">
        <div 
          className="relative flex overflow-hidden w-full mb-8"
          style={{ 
            maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)' 
          }}
        >
          <div className="flex w-max animate-marquee hover:pause">
            <div className="flex shrink-0 items-center gap-8 md:gap-16 px-4 md:px-8">
              {[
                "10M+ Kg Material Recovered",
                "5,000+ Active Agents",
                "$2M+ Value Distributed",
                "50+ Hubs Powered",
                "99.9% Pricing Accuracy",
                "100k+ App Downloads"
              ].map((achievement, i) => (
                <div key={`achieve1-${i}`} className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {achievement}
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-8 md:gap-16 px-4 md:px-8">
              {[
                "2M+ Kg Material Recovered",
                "5,000+ Active Agents",
                "KSH 950K+ Value Distributed",
                "50+ Hubs Powered",
                "99.9% Pricing Accuracy",
                "100k+ App Downloads"
              ].map((achievement, i) => (
                <div key={`achieve2-${i}`} className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {achievement}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center relative z-10">
          <span className="text-sm font-medium text-slate-500">Milestones achieved by the Klinflow network</span>
        </div>
      </section>

      {/* INTERCONNECTED ECOSYSTEM SECTION */}
      <section
        className={`relative overflow-hidden py-16 md:py-16 ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}
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
          <header className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
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
              className={`text-sm md:text-base max-w-xl mx-auto leading-relaxed ${
                isDarkMode ? "text-slate-300" : "text-slate-600"
              }`}
            >
             Every participant in the recycling value chain operates more effectively when connected. Klinflow synchronizes the movement of materials, logistics, inventory, payments, and marketplace transactions across the entire value chain, enabling every stakeholder to operate within one connected, transparent, and intelligent ecosystem.
            </p>
          </header>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* ECOSYSTEM DIAGRAM */}
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

                {/* CENTER LOGO */}
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

                      {/* NODE BUTTON */}
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
                  key={ecosystemNodes[activeNode]?.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="uppercase tracking-[0.2em] text-primary text-xs font-bold">
                    Ecosystem Participant
                  </span>

                  <h3 className="mt-1 text-xl md:text-2xl font-black text-slate-800 dark:text-white">
                    {ecosystemNodes[activeNode]?.title}
                  </h3>

                  <p className="mt-2 md:mt-3 text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                    {ecosystemNodes[activeNode]?.description}
                  </p>

                  <div className="mt-6 md:mt-8 grid gap-4">
                    {ecosystemNodes[activeNode]?.features.map((feature) => (
                      <div
                        key={feature.title}
                        className="flex items-start gap-4"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <div className="flex flex-col">
                          <span className="text-sm md:text-base font-bold text-slate-700 dark:text-white">
                            {feature.title}
                          </span>
                          <span className="text-xs md:text-sm mt-1 text-slate-600 dark:text-slate-400">
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
       {/* ── STRATEGIC VISION ────────────────────────────────────── */}
      <section
        id="vision"
        className={`py-16 md:py-32 relative overflow-hidden border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}
      >
        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            <motion.div
              className="lg:col-span-5 max-w-xl lg:max-w-2xl"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-sm font-black uppercase tracking-widest text-primary mb-2 font-mono">
                Strategic Vision
              </h2>
              <h3 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-8 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                A Future Where <br />
                <span className="text-primary italic">
                  Waste is an Asset.
                </span>
              </h3>
              <p className={`text-sm sm:text-base md:text-lg font-normal leading-relaxed mb-10 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
               Our Platform exists to modernize the recycling industry through artificial intelligence and intelligent digital infrastructure. Our AI-powered ecosystem unifies material collection, recovery, logistics, processing, and marketplace trading into a single connected ecosystem. By seamlessly connecting every participant in the value chain, Klinflow transforms recyclable materials from an overlooked liability into a traceable, valuable, and monetizable resource accelerating the transition to a smarter, more transparent, and sustainable circular economy.
              </p>

              <div className="grid grid-cols-3 gap-2 sm:gap-6">
                {[
                  {
                    label: "Traceability",
                    val: "100%",
                    sub: "Source to Recycler",
                  },
                  { label: "Payouts", val: "Instant", sub: "Digital Wallet & Cash" },
                  {
                    label: "Marketplace",
                    val: "24/7",
                    sub: "Sell at your price",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`p-4 sm:p-6 rounded-md flex flex-col justify-center ${isDarkMode ? "bg-surface-900 border border-surface-900" : "bg-slate-50 border border-slate-200"}`}
                  >
                    <div className="text-lg sm:text-2xl font-black text-primary mb-1">
                      {stat.val}
                    </div>
                    <div className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {stat.label}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight hidden sm:block">
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="lg:col-span-7 relative w-full mt-12 lg:mt-0 z-20 lg:ml-12">
              <div
                className={`rounded-[1rem] border relative flex items-center justify-center overflow-hidden shadow-2xl w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/11] ${isDarkMode ? "border-slate-800 bg-surface-900 shadow-black/40" : "border-slate-200 bg-white shadow-slate-300/40"}`}
              >
                <img
                  src="/landing-page/asset.webp"
                  alt="Thesis Asset"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CORE PRODUCT SUITE ──────────────────────────────────── */}
      <section
        className={`py-16 md:py-32 relative z-10 border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className={`absolute inset-0 opacity-[0.05] ${isDarkMode ? "text-white" : "text-slate-900"}`}
            style={{
              backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>
        
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-primary">
              The Platform
            </div>
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-700 dark:text-white mb-6">
              Native Product Suite
            </h3>
            <p className=" text-slate-700 dark:text-slate-300 font-medium">
              Four specialized applications, one unified circular economy. Built for every stakeholder in the recycling value chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {/* Resident App */}
            <div className={`col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] ${isDarkMode ? "bg-surface-900 border border-white/10 hover:border-white/20" : "bg-white border border-slate-200 shadow-2xl"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                <User className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-slate-700"}`} />
              </div>
              <h4 className={`text-xl font-bold mb-3 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Resident App
              </h4>
              <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Designed for households to quickly schedule on-demand pickups, receive AI valuations, and get paid instantly in Cash or GreenFuel Points.
              </p>
            </div>

            {/* Seller App */}
            <div className={`col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] ${isDarkMode ? "bg-surface-900 border border-white/10 hover:border-white/20" : "bg-white border border-slate-200 shadow-2xl"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                <Building2 className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-slate-700"}`} />
              </div>
              <h4 className={`text-xl font-bold mb-3 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Seller App
              </h4>
              <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Built for bulk waste producers and institutional clients to manage large collections, track detailed reporting, and ensure regulatory compliance.
              </p>
            </div>

            {/* Agent App */}
            <div className={`col-span-1 md:col-span-6 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] ${isDarkMode ? "bg-surface-900 border border-white/10 hover:border-white/20" : "bg-white border border-slate-200 shadow-2xl"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                <Truck className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-slate-700"}`} />
              </div>
              <h4 className={`text-xl font-bold mb-3 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Agent & Fleet App
              </h4>
              <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Built for field agents to leverage multi-stop AI route optimization, perform on-spot material grading, and manage daily collections efficiently.
              </p>
            </div>

            {/* Hub App */}
            <div className={`col-span-1 md:col-span-3 lg:col-span-3 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] ${isDarkMode ? "bg-surface-900 border border-white/10 hover:border-white/20" : "bg-white border border-slate-200 shadow-2xl"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                <Warehouse className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-slate-700"}`} />
              </div>
              <h4 className={`text-xl font-bold mb-3 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                Hub Command App
              </h4>
              <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                The control center for Material Recovery Facilities (MOS) and fleet owners to manage logistics, inventory processing workflows, and comprehensive live analytics.
              </p>
            </div>

            {/* Business App */}
            <div className={`col-span-1 md:col-span-3 lg:col-span-3 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] ${isDarkMode ? "bg-surface-900 border border-white/10 hover:border-white/20" : "bg-white border border-slate-200 shadow-2xl"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 ${isDarkMode ? "bg-white/10" : "bg-slate-100"}`}>
                <LineChart className={`w-6 h-6 ${isDarkMode ? "text-white" : "text-slate-700"}`} />
              </div>
              <h4 className={`text-xl font-bold mb-3 relative z-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                B2B Business App
              </h4>
              <p className={`text-sm leading-relaxed relative z-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Designed for large-scale industrial buyers to secure consistent high-volume material lots through transparent escrow trades and verified material provenance.
              </p>
            </div>
          </div>

          <div className="mt-12 flex justify-center relative z-20">
            <Link
              to="/gallery"
              className={`px-8 py-3 rounded-md font-medium text-sm transition-colors flex items-center gap-2 border ${isDarkMode ? "bg-surface-800 hover:bg-surface-700 text-white border-white/5" : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"}`}
            >
              Explore Gallery <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUSTED BY MARQUEE ─────────────────────────────────────────── */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-transparent">
        <div 
          className="relative flex overflow-hidden w-full mb-8"
          style={{ 
            maskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 25%, black 75%, transparent 100%)' 
          }}
        >
          <div className="flex w-max animate-marquee hover:pause">
            <div className="flex shrink-0 items-center gap-8 md:gap-16 px-4 md:px-8">
              {[
                "EcoPlastics Ltd",
                "GreenEarth Recycling",
                "TerraCycle",
                "EnviroSave",
                "ReCycle Africa",
                "Circular Economy Fund"
              ].map((partner, i) => (
                <div key={`partner1-${i}`} className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity">
                  {partner}
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-8 md:gap-16 px-4 md:px-8">
              {[
                "EcoPlastics Ltd",
                "GreenEarth Recycling",
                "TerraCycle",
                "EnviroSave",
                "ReCycle Africa",
                "Circular Economy Fund"
              ].map((partner, i) => (
                <div key={`partner2-${i}`} className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity">
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center relative z-10">
          <span className="text-sm font-medium text-slate-500">Trusted by fast companies across the globe</span>
        </div>
      </section>

      {/* ── HYGENEX AI: Material Valuation ───────────────────────────────── */}
      <section
        className={`py-24 relative overflow-hidden border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-white border-slate-200"}`}
      >
        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-5 max-w-xl lg:max-w-2xl">
            <div className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-xs mb-6">
              <Brain className="w-5 h-5" /> The Sustainomics Engine
            </div>
            <h3 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-8 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              The Source of <br />
              <span className="text-primary italic">
                Material Value.
              </span>
            </h3>
            <p className={`text-sm sm:text-base md:text-lg font-normal leading-relaxed mb-10 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}> 
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
                  className={`p-4 sm:p-6 rounded-[32px] border flex flex-col lg:flex-row gap-3 lg:gap-6 items-start ${isDarkMode ? "bg-surface-900 border-white/10" : "bg-white border-slate-200 shadow-2xl"}`}
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <p className={`text-[12px] sm:text-sm font-normal leading-tight sm:leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {f.title}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sustainomics Image */}
          <div className="lg:col-span-7 relative w-full z-20 mt-12 lg:mt-0 flex justify-center lg:ml-12 xl:ml-16">
            <div className="relative group w-full perspective-1000">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent opacity-30 "></div>
              <img
                src="/landing-page/HygeneX.webp"
                alt="HygeneX Dashboard"
                fetchPriority="low"
                className="relative w-full h-auto object-cover rounded-lg transform transition-transform duration-500 group-hover:scale-[1.02] "
                style={{
                  transformStyle: "preserve-3d",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                }}
              />
              {/* Highlight sweep effect */}
              <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONVERSION CTA ────────────────────────────────────────────────── */}
      <section
        className={`py-24 px-6 relative overflow-hidden border-t ${isDarkMode ? "bg-emerald-700 border-white/5" : "bg-emerald-700 border-emerald-600"}`}
      >
        <div className="max-w-4xl mx-auto text-center relative z-10 text-white">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-8">
            Ready to <br /> Scale with Us?
          </h2>
          <p className="text-sm sm:text-base md:text-lg font-medium mb-12 leading-relaxed text-slate-200">
            Join the network that is defining the next generation of circular
            logistics. Deploy your fleet, process your Recyclables, or trade verified
            assets at scale.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-medium px-8 py-3 rounded-md transition-colors text-sm"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
      {/* LIGHTBOX MODAL */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-6"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-3xl w-full max-h-[60vh] flex items-center justify-center"
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="max-w-full max-h-[60vh] object-contain rounded-md border border-slate-800"
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
