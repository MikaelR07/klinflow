import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Users,
  Factory,
  ShoppingCart,
  ArrowRight,
  ArrowLeft,
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
  Check,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";
import HygeneXSection from "../components/HygeneXSection";

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
    title: "Residents & Small Producers",
    description:
      "Homes, estates, cafeterias, and small businesses that produce waste and want to seamlessly dispose of it while earning money.",
    features: [
      {
        title: "On-Demand Disposal",
        desc: "Easily schedule pickups for accumulated waste directly from your location.",
      },
      {
        title: "Earn Money",
        desc: "Get paid instantly for disposing of your recyclable materials.",
      },
      {
        title: "Broad Coverage",
        desc: "Suitable for individual households, small businesses, and cafeterias.",
      },
      {
        title: "Eco-Friendly",
        desc: "Contribute to a cleaner environment while earning rewards.",
      },
    ],
  },
  {
    id: "collectors",
    label: "Agents",
    icon: Truck,
    angle: 240,
    title: "Field Agents",
    description:
      "The active workforce collecting materials in the field, divided into organized fleet agents and independent individual agents.",
    features: [
      {
        title: "Field Collection",
        desc: "Actively gather materials from residents and sellers in the network.",
      },
      {
        title: "Tiered Operations",
        desc: "Operate flexibly as an individual agent or as part of a managed fleet.",
      },
      {
        title: "Route Optimization",
        desc: "Use intelligent mapping to navigate efficiently to collection points.",
      },
      {
        title: "Instant Settlements",
        desc: "Receive swift, guaranteed payments upon successful material delivery.",
      },
    ],
  },
  {
    id: "recyclers",
    label: "Recyclers",
    icon: Factory,
    angle: 0,
    title: "Large-Scale Recyclers",
    description:
      "The big players and industrial buyers dealing with massive material volumes, purchasing directly from hubs and major collectors.",
    features: [
      {
        title: "High-Volume Purchasing",
        desc: "Source and buy massive quantities of sorted, high-quality materials.",
      },
      {
        title: "Direct Hub Access",
        desc: "Procure materials seamlessly from established hubs across the network.",
      },
      {
        title: "Scalable Operations",
        desc: "Manage and process huge influxes of recyclables efficiently.",
      },
      {
        title: "Reliable Supply",
        desc: "Maintain a steady, dependable flow of essential raw materials.",
      },
    ],
  },
  {
    id: "enterprises",
    label: "Businesses",
    icon: Building2,
    angle: 60,
    title: "Corporate Businesses",
    description:
      "Corporate entities and enterprises that integrate recycling seamlessly into their operations via the Klinflow ecosystem.",
    features: [
      {
        title: "Corporate Recycling",
        desc: "Seamlessly integrate end-to-end waste management into daily operations.",
      },
      {
        title: "ESG Compliance",
        desc: "Easily meet and report on environmental and sustainability goals.",
      },
      {
        title: "Impact Tracking",
        desc: "Monitor and report on corporate recycling achievements transparently.",
      },
      {
        title: "Sustainable Partnerships",
        desc: "Connect with a reliable green ecosystem for responsible disposal.",
      },
    ],
  },
  {
    id: "buyers",
    label: "Sellers",
    icon: ShoppingCart,
    angle: 120,
    title: "Small Collectors & Sellers",
    description:
      "Small collectors, independent pickers, and informal scrappers who gather and sell recyclable materials for a living.",
    features: [
      {
        title: "Earn a Living",
        desc: "Turn daily waste picking into a reliable and sustainable income stream.",
      },
      {
        title: "Easy Selling",
        desc: "Quickly connect with agents and hubs to sell your gathered materials.",
      },
      {
        title: "Fair Pricing",
        desc: "Access transparent, competitive, and guaranteed market rates.",
      },
      {
        title: "Direct Trade",
        desc: "Sell sorted recyclables easily and securely within the ecosystem.",
      },
    ],
  },
  {
    id: "circular",
    label: "Company Owners",
    icon: Recycle,
    angle: 300,
    title: "Company & Hub Owners",
    description:
      "Operators equipped with the MOS software to effectively manage their hubs and coordinate their fleet operations.",
    features: [
      {
        title: "Hub Management (MOS)",
        desc: "Full operational control over your hubs via the advanced MOS software.",
      },
      {
        title: "Fleet Coordination",
        desc: "Seamlessly manage, track, and dispatch your associated fleet agents.",
      },
      {
        title: "Inventory Control",
        desc: "Track material intake, processing, and outbound sales with precision.",
      },
      {
        title: "Operational Analytics",
        desc: "Monitor the entire flow of your business operations in real-time.",
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
  const hygenexScrollRef = useRef<HTMLDivElement>(null);

  const scrollHygenex = (direction: 'left' | 'right') => {
    if (hygenexScrollRef.current) {
      const scrollAmount = window.innerWidth > 768 ? 450 : 300;
      hygenexScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: "smooth" });
    }
  };

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

  const [productMousePos, setProductMousePos] = useState({ x: 0, y: 0, xPct: 0, yPct: 0 });
  const [isProductGridHovered, setIsProductGridHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width) * 2 - 1;
    const yPct = (y / rect.height) * 2 - 1;

    setMousePos({ x, y, xPct, yPct });
  };

  const handleProductMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const xPct = (x / rect.width) * 2 - 1;
    const yPct = (y / rect.height) * 2 - 1;

    setProductMousePos({ x, y, xPct, yPct });
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
              className={`absolute inset-0 opacity-[0.06] ${isDarkMode ? "text-emerald-600" : "text-emerald-600/60"}`}
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
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 max-w-xl lg:max-w-2xl -translate-y-8 lg:-translate-y-16"
            >
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
            </motion.div>
            {/* Right Column: 3D Perspective Hero Image Carousel */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-7 relative w-full mt-16 lg:mt-0 z-20 lg:ml-12 lg:translate-x-10"
            >
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
                    src="/landing-page/hero/hero1.webp"
                    alt="Klinflow Platform Dashboard"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                </div>
              </div>
              {/* Subtle shadow beneath the 3D card */}
              <div className="absolute -bottom-4 left-[15%] right-[5%] h-10 blur-2xl rounded-full bg-primary/10" />
            </motion.div>
          </div>
        </div>
      </section>

     

      {/* ── ACHIEVEMENTS MARQUEE ───────────────────────────────────────── */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="py-16 md:py-24 relative overflow-hidden bg-transparent"
      >
        <div 
          className="relative flex overflow-hidden w-full mb-8"
          style={{ 
            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', 
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' 
          }}
        >
          <div className="flex w-max animate-marquee hover:pause">
            {[0, 1].map((key) => (
              <div key={key} className="flex shrink-0 items-center gap-8 md:gap-16 px-4 md:px-8">
                {[
                  "3M+ Kg Material Recovered",
                  "5,000+ Active Agents",
                  "870K+ Value Distributed",
                  "50+ Hubs Powered",
                  "99.9% Pricing Accuracy",
                  "100k+ App Downloads"
                ].map((achievement, i) => (
                  <div key={`achieve-${key}-${i}`} className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {achievement}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center relative z-10">
          <span className="text-sm font-medium text-slate-500">Milestones achieved by the Klinflow network</span>
        </div>
      </motion.section>

      {/* INTERCONNECTED ECOSYSTEM SECTION */}
      <section
        className={`relative overflow-hidden py-16 md:py-16 bg-gradient-to-br from-emerald-600 to-primary`}
      >
        {/* DOT GRID */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255, 255, 255, 0.8) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6">
          <motion.header 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            <span className={`uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-3 block text-emerald-100`}>
              Interconnected Ecosystem
            </span>

            <h2
              className="text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4 text-white"
            >
              One Platform.{" "}
              <span className="text-amber-400">Every Participant.</span>
            </h2>

            <p
              className={`text-sm sm:text-base md:text-lg mx-auto font-normal leading-relaxed text-emerald-50`}
            >
              Every stakeholder in the recycling value chain achieves more when operating as part of a connected network.
              We bring every actor in the value chain together through one intelligent platform that streamlines material collection & logistics coordination, inventory management, marketplace operations, transactions, and payments across the entire ecosystem.
              We enable faster coordination, stronger partnerships, and more efficient resource recovery at every stage of the circular economy.
            </p>
          </motion.header>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* ECOSYSTEM DIAGRAM */}
            <motion.figure 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative h-[460px] sm:h-[500px] lg:h-[650px] w-full flex items-center justify-center -mt-10 lg:mt-0 overflow-visible"
            >
              <div className="absolute inset-0 flex items-center justify-center transform scale-[0.55] sm:scale-[0.70] lg:scale-[0.90] origin-center transition-transform duration-500">
                {/* RING */}
                <div
                  className={`absolute w-[520px] h-[520px] rounded-full border ${
                    isDarkMode ? "border-white/30" : "border-emerald-300/60"
                  }`}
                />

                {/* CENTER GLOW */}
                <div className={`absolute w-72 h-72 blur-3xl rounded-full ${isDarkMode ? "bg-primary/20" : "bg-white/20"}`} />

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
                      : "bg-emerald-50 border border-emerald-200 shadow-2xl"
                  }`}
                >
                  <img
                    src="/landing-page/app-logo.webp"
                    alt="Klinflow"
                    className="w-24 h-24 md:w-28 md:h-28 object-contain"
                  />
                  <span className={`mt-1 text-[12px] md:text-xs font-black uppercase tracking-[0.3em] text-center leading-wide ${isDarkMode ? "text-primary" : "text-emerald-700"}`}>
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
                            ? (isDarkMode ? "bg-primary" : "bg-amber-400")
                            : isDarkMode
                              ? "bg-white/30"
                              : "bg-emerald-300"
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
                    w-28 h-28 rounded-full
                    flex flex-col items-center justify-center
                    transition-all duration-500
                    ${
                      active
                        ? isDarkMode 
                          ? "bg-amber-400 text-white scale-110 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
                          : "bg-amber-400 text-amber-950 scale-110 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
                        : isDarkMode
                          ? "bg-surface-900 border border-white/10 text-white"
                          : "bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-lg"
                    }
                  `}
                      >
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="text-[12px] font-semibold">
                          {node.label}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </motion.figure>

            {/* CONTENT PANEL */}
            <motion.article
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className={`rounded-[32px] p-6 md:p-6 ${
                isDarkMode
                  ? "bg-surface-900 border border-white/10"
                  : "bg-emerald-50 border border-emerald-100 shadow-2xl"
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
                  <span className={`uppercase tracking-[0.2em] text-xs font-bold ${isDarkMode ? "text-primary" : "text-emerald-700"}`}>
                    Ecosystem Participant
                  </span>

                  <h3 className={`mt-1 text-xl md:text-2xl font-black ${isDarkMode ? "text-white" : "text-emerald-950"}`}>
                    {ecosystemNodes[activeNode]?.title}
                  </h3>

                  <p className={`mt-2 md:mt-3 text-sm md:text-base leading-relaxed ${isDarkMode ? "text-slate-400" : "text-emerald-800"}`}>
                    {ecosystemNodes[activeNode]?.description}
                  </p>

                  <div className="mt-6 md:mt-8 grid gap-4">
                    {ecosystemNodes[activeNode]?.features.map((feature) => (
                      <div
                        key={feature.title}
                        className="flex items-start gap-4"
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${isDarkMode ? "bg-primary" : "bg-emerald-500"}`} />
                        <div className="flex flex-col">
                          <span className={`text-sm md:text-base font-bold ${isDarkMode ? "text-white" : "text-emerald-950"}`}>
                            {feature.title}
                          </span>
                          <span className={`text-xs md:text-sm mt-1 ${isDarkMode ? "text-slate-400" : "text-emerald-800"}`}>
                            {feature.desc}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.article>
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
               Our Platform exists to modernize the recycling industry through artificial intelligence and intelligent digital infrastructure. Our AI-powered ecosystem unifies material collection, recovery, logistics, processing, and marketplace trading into a single connected ecosystem. By seamlessly connecting every participant in the value chain, Klinflow transforms recyclable materials from an overlooked liability into a traceable, valuable, and monetizable resource accelerating the transition to a smarter, digitalized, and sustainable circular economy.
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
                    <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-300  font-medium leading-tight hidden sm:block">
                      {stat.sub}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-7 relative w-full mt-12 lg:mt-0 z-20 lg:ml-12"
            >
              <div
                className={`rounded-[1rem] border relative flex items-center justify-center overflow-hidden shadow-2xl w-full aspect-[4/3] sm:aspect-video lg:aspect-[16/11] ${isDarkMode ? "border-slate-800 bg-surface-900 shadow-black/40" : "border-slate-200 bg-white shadow-slate-300/40"}`}
              >
                <img
                  src="/landing-page/asset.webp"
                  alt="Thesis Asset"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* CORE PRODUCT SUITE ──────────────────────────────────── */}
      <section
        className={`py-16 md:py-32 relative z-10 border-t perspective-[1000px] overflow-hidden ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}
        onMouseMove={handleProductMouseMove}
        onMouseEnter={() => setIsProductGridHovered(true)}
        onMouseLeave={() => setIsProductGridHovered(false)}
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{
              rotateX: isProductGridHovered ? productMousePos.yPct * -4 : 0,
              rotateY: isProductGridHovered ? productMousePos.xPct * 4 : 0,
              scale: 1.1
            }}
            transition={{ type: "spring", stiffness: 50, damping: 20 }}
            className="absolute inset-[-20%] w-[140%] h-[140%]"
          >
            {/* Base Faint Grid */}
            <div
              className={`absolute inset-0 opacity-[0.05] ${isDarkMode ? "text-white" : "text-slate-900"}`}
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />
            {/* Highlight Spotlight Grid */}
            <motion.div
              animate={{ opacity: isProductGridHovered ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 opacity-[0.05] ${isDarkMode ? "text-primary" : "text-primary/40"}`}
              style={{
                backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                WebkitMaskImage: `radial-gradient(500px circle at calc(10% + ${productMousePos.x}px) calc(10% + ${productMousePos.y}px), black 0%, transparent 100%)`,
                maskImage: `radial-gradient(500px circle at calc(10% + ${productMousePos.x}px) calc(10% + ${productMousePos.y}px), black 0%, transparent 100%)`,
              }}
            />
          </motion.div>
        </div>
        
        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-12 text-center max-w-3xl mx-auto"
          >
            <div className="text-xs font-bold uppercase tracking-[0.3em] mb-4 text-primary">
              The Platform
            </div>
            <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-700 dark:text-white mb-6">
              Native Product Suite
            </h3>
            <p className=" text-slate-700 dark:text-slate-300 font-medium">
              Multi Persona Specialized applications, one unified circular economy. Built for every stakeholder in the recycling value chain.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-6 gap-4 max-w-6xl mx-auto"
          >
            {/* Resident App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-emerald-700 border border-emerald-600/50 hover:border-emerald-500 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <User className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                Resident App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-emerald-100">
                Designed for households to quickly schedule on-demand pickups, receive AI valuations, and get paid instantly in cash and receive Green Fuel Point.
              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-emerald-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> On-demand Pickups & Scheduling</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Real-time AI valuations via HygeneX</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Instant Digital Wallet Payouts</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Personalized AI Recycling Coach</li>
              </ul>
            </div>

            {/* Seller App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-lime-600 border border-lime-700/50 hover:border-lime-600 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                Seller App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-lime-100">
                Built for scrappers, micro-collectors, and bulk waste producers to manage daily material collection,trading and connections.
              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-lime-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Group Collection Contracts (Crowdsourced Fulfillment)</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Dynamic Pricing & Bidding System</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Real-Time RFQ Push Notifications</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Proof-of-Material Image Uploads</li>
              </ul>
            </div>

            {/* Solo Agent App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-green-700 border border-green-700/50 hover:border-green-600 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                Solo Agent App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-green-100">
                Built for on-ground aggregators and scouts to evaluate materials, dispatch tasks, and manage seller relationships.
              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-green-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> On-the-spot AI Material Grading</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Instant Digital Payouts to Sellers</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Local CRM & Relationship Management</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Live Local Market Pricing Feeds</li>
              </ul>
            </div>

            {/* Fleet Driver App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-blue-700 border border-blue-700/50 hover:border-blue-600 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                Fleet Driver App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-blue-100">
                Built for logistics teams to optimize pickups, track vehicle capacity, and ensure efficient and safe transit.
              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-blue-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> AI Multi-stop Route Optimization</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Live Vehicle Capacity Tracking</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Digital Proof of Collection (e-Sign)</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Fleet Maintenance & Revenue Tracking</li>
              </ul>
            </div>

            {/* Hub App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-teal-700 border border-teal-700/50 hover:border-teal-600 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                Hub Command App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-teal-100">
                The enterprise control center for Aggregators and Material Recovery Facilities to scale operations.
              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-teal-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Hyper-Local RFQ Broadcasting</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Multi-Agent Enterprise Architecture</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Automated Fulfillment Tracking</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Segregated "Market" vs "My RFQ" Views</li>
              </ul>
            </div>
            
            {/* Business App */}
            <div className="col-span-1 md:col-span-3 lg:col-span-2 p-8 rounded-[32px] relative overflow-hidden group transition-all flex flex-col justify-start min-h-[240px] bg-emerald-600 border border-emerald-800/50 hover:border-emerald-700 shadow-2xl">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 relative z-10 bg-white/10">
                <LineChart className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-bold mb-3 relative z-10 text-white">
                B2B Business App
              </h4>
              <p className="text-sm leading-relaxed relative z-10 mb-4 text-emerald-100">
                Designed for large-scale industrial buyers to secure consistent high-volume material lots through transparent escrow trades and verifies material provenance.              </p>
              <ul className="mt-auto space-y-2 text-xs font-medium relative z-10 text-emerald-50">
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Full Supply Chain Traceability</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Escrow-secured B2B Trading</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Verified Material Provenance</li>
                <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-lime-400 mt-1.5 shrink-0" /> Live Commodity Dashboard</li>
              </ul>
            </div>
          </motion.div>

          <div className="mt-12 flex justify-center relative z-20">
            <Link
              to="/gallery"
              className={`px-8 py-3 rounded-md font-medium text-sm transition-colors flex items-center gap-2 border ${isDarkMode ? "bg-emerald-800 hover:bg-surface-700 text-white border-white/5" : "bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm"}`}
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

      {/* ── HYGENEX AI ─────────────────────────────────────────────────── */}
      <HygeneXSection />

      {/* ── IMPACT STORY SECTION ───────────────────────────────────────────── */}
      <section className={`py-16 md:py-24 px-6 relative z-10 ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left Image */}
          <div className="w-56 h-56 md:w-80 md:h-80 shrink-0 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 -rotate-6 transition-transform hover:-rotate-3">
            <img src="/landing-page/hygenex/hygenex-woman.webp" alt="Empowered Resident" className="w-full h-full object-cover object-top scale-105" />
          </div>
          
          {/* Center Text */}
          <div className="flex-1 text-center max-w-2xl mx-auto px-4">
            <div className="text-xs font-bold uppercase tracking-[0.2em] mb-4 text-primary">
              Real-World Impact
            </div>
            <h3 className="text-2xl md:text-4xl font-black tracking-tight mb-6">
              Empowering Communities. <br className="hidden md:block" /> Changing Lives.
            </h3>
            <p className={`text-sm md:text-base leading-relaxed font-medium ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Klinflow isn't just an enterprise platform; it's a catalyst for global change. By transforming everyday waste into a verifiable digital asset, we're creating sustainable, dignified income streams for millions of sellers and independent collection agents. Our technology bridges the gap between grassroots collectors and massive industrial processors—ensuring transparent pricing, cleaner neighborhoods, and a thriving circular economy where every stakeholder benefits from doing the right thing.
            </p>
          </div>

          {/* Right Image */}
          <div className="w-56 h-56 md:w-80 md:h-80 shrink-0 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 rotate-6 transition-transform hover:rotate-3">
            <img src="/landing-page/hygenex/hygenex-man.webp" alt="Empowered Operator" className="w-full h-full object-cover object-top scale-105" />
          </div>
        </div>
      </section>

      {/* ── CONVERSION CTA ────────────────────────────────────────────────── */}
      <section
        className={`py-24 px-6 relative overflow-hidden border-t ${isDarkMode ? "bg-emerald-700 border-white/5" : "bg-primary border-primary"}`}
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
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-primary-dark text-white font-medium px-8 py-3 rounded-md transition-colors text-sm"
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
