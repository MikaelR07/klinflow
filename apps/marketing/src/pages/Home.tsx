import React, { useState, useEffect, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import {
  Users,
  Factory,
  ShoppingCart,
  ArrowRight,
  ChevronRight,
  Recycle,
  Handshake,
  Truck,
  User,
  Building2,
  Package,
  Warehouse,
  Check,
  ChevronUp,
  Activity,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
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
    badge: "Consumer & Producer",
    icon: Users,
    image: "/landing-page/interconnected/Residents_ Turn Waste Into Value.webp",
    gradient: "from-emerald-500 via-teal-600 to-cyan-700",
    glowColor: "rgba(16, 185, 129, 0.4)",
    tagline: "Household & Local Waste Generation",
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
    badge: "Field Logistics",
    icon: Truck,
    image: "/landing-page/interconnected/agents.webp",
    gradient: "from-blue-600 via-cyan-600 to-teal-700",
    glowColor: "rgba(59, 130, 246, 0.4)",
    tagline: "Mobile Collection & Verification",
    title: "Field Agents",
    description:
      "The active workforce collecting materials in the field, divided into organized fleet agents and independent individual agents.",
    features: [
      {
        title: "Unlimited Collection Opportunities",
        desc: "Collect as much as you can and earn as much as you want.",
      },
      {
        title: "Choose Your Role",
        desc: "Operate flexibly as an individual agent or as part of a managed fleet.",
      },
      {
        title: "Smart Routing",
        desc: "Use intelligent mapping to navigate efficiently to collection points.",
      },
      {
        title: "Resale at your Convinience",
        desc: "Sell your materials to buyers of your choice through the market place.",
      },
    ],
  },
  {
    id: "recyclers",
    label: "Recyclers",
    badge: "Industrial Sourcing",
    icon: Factory,
    image: "/landing-page/interconnected/large-recyler.webp",
    gradient: "from-amber-500 via-orange-600 to-amber-800",
    glowColor: "rgba(245, 158, 11, 0.4)",
    tagline: "High-Volume Intake & Processing",
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
    badge: "Corporate ESG",
    icon: Building2,
    image: "/landing-page/interconnected/business.webp",
    gradient: "from-purple-600 via-indigo-600 to-blue-800",
    glowColor: "rgba(147, 51, 234, 0.4)",
    tagline: "ESG Compliance & Zero-Waste Ops",
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
    badge: "Scrap & Collection",
    icon: ShoppingCart,
    image: "/landing-page/interconnected/seller.webp",
    gradient: "from-teal-500 via-emerald-600 to-green-700",
    glowColor: "rgba(20, 184, 166, 0.4)",
    tagline: "Scrappers & Waste Aggregators",
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
    label: "Hub Owners",
    badge: "Hub & Fleet Management",
    icon: Recycle,
    image: "/landing-page/interconnected/hubs.webp",
    gradient: "from-slate-700 via-emerald-700 to-slate-900",
    glowColor: "rgba(16, 185, 129, 0.4)",
    tagline: "MOS Software & Fleet Command",
    title: "Hub Owners",
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

const tradedMaterials = [
  {
    id: "paper",
    name: "Paper & Cardboard",
    category: "Paper & Packaging",
    spec: "Baled OCC • Kraft • Shredded Bulk",
    demandBadge: "High Volume Demand",
    image: "/landing-page/materials/boxes.webp",
    items: ["Corrugated Cardboard", "Kraft Paper & Bags", "Office Paper (White Ledger)", "Newspaper & Magazines", "Cartons (Tetra Pak)", "Paperboard Boxes", "Shredded Paper", "Egg Cartons", "Paper Tubes & Cores", "Manila Envelopes"],
  },
  {
    id: "plastic",
    name: "Plastics",
    category: "Plastics & Packaging",
    spec: "Sorted Polymers • Flakes • Regrind",
    demandBadge: "Critical Industrial Need",
    image: "/landing-page/materials/plastic.webp",
    items: ["PET", "HDPE", "PVC", "LDPE", "PP", "PS", "ABS", "Polycarbonate (PC)", "Nylon / Polyamide", "Mixed Rigid Plastics"],
  },
  {
    id: "metal",
    name: "Metals & Scrap",
    category: "Metals & Alloys",
    spec: "Sheared • Shredded • Ingot Ready",
    demandBadge: "Instant Settlement",
    image: "/landing-page/materials/metal.webp",
    items: ["Aluminum Cans (UBC)", "Copper Wire & Tubing", "Brass Scrap", "Stainless Steel", "Cast Iron", "Mild Steel & Rebar", "Zinc Scrap", "Lead (Batteries)", "Tin-Plated Steel Cans", "Mixed Ferrous Scrap"],
  },
  {
    id: "glass",
    name: "Glass Bottles & Cullet",
    category: "Glass & Cullet",
    spec: "Color-Sorted • Crushed Cullet",
    demandBadge: "Continuous Plant Intake",
    image: "/landing-page/materials/glasses.webp",
    items: ["Clear / Flint Glass", "Amber / Brown Glass", "Green Glass", "Beverage Bottles", "Food Jars", "Crushed Cullet", "Flat / Window Glass", "Borosilicate Glass", "Refillable Bottles"],
  },
  {
    id: "organic",
    name: "Organic Waste",
    category: "Organics & Biomass",
    spec: "Commercial Feedstock • Biofuel Ready",
    demandBadge: "Bulk Commercial Lots",
    image: "/landing-page/materials/organic-waste.webp",
    items: ["Fruit & Vegetable Scraps", "Kitchen Food Waste", "Garden & Yard Trimmings", "Agricultural Residue (Husks, Stalks)", "Spent Grain & Brewery Waste", "Sawdust & Wood Shavings", "Animal Manure", "Coffee Grounds & Tea Leaves", "Coconut Shells & Coir"],
  },
  {
    id: "textile",
    name: "Textiles & Fabrics",
    category: "Textiles & Garments",
    spec: "Sorted Rags • Mill Waste • Yarn Scrap",
    demandBadge: "High Export Demand",
    image: "/landing-page/materials/textile.webp",
    items: ["Cotton Scraps & Off-Cuts", "Polyester Fabrics", "Denim & Jeans", "Wool & Knits", "Nylon & Synthetic Blends", "Tailor Shop Offcuts", "Worn Clothing & Shoes", "Industrial Wipers & Rags", "Carpet & Upholstery Fibers", "Leather Scraps"],
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
    path: "/products/B2B",
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
  const isDarkMode = false;
  const [activeNode, setActiveNode] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [selectedImage, setSelectedImage] = useState<
    (typeof screenshots)[0] | null
  >(null);
  const [isAutoPaused, setIsAutoPaused] = useState(false);

  // Helper to calculate shortest angular offset for rotating directly to a selected node
  const handleSelectNode = (targetIndex: number) => {
    setIsAutoPaused(true);
    if (targetIndex === activeNode) return;
    const total = ecosystemNodes.length;
    const diff = (targetIndex - activeNode + total) % total;
    const shortestStep = diff > 3 ? diff - total : diff;
    setWheelRotation((prev) => prev + shortestStep * 60);
    setActiveNode(targetIndex);
  };

  // Toggle freeze on click: active image toggles pause/play, other images select and freeze
  const handleNodeClick = (targetIndex: number) => {
    if (targetIndex === activeNode) {
      setIsAutoPaused((prev) => !prev);
    } else {
      handleSelectNode(targetIndex);
    }
  };

  // Apparent angle on the wheel relative to the 0° right focal point
  const getRelativeAngle = (index: number) => {
    const total = ecosystemNodes.length;
    let diff = (index - activeNode) % total;
    if (diff < -total / 2) diff += total;
    if (diff > total / 2) diff -= total;
    return diff * 60;
  };

  useEffect(() => {
    if (isAutoPaused) return;

    // Slow, gentle rotation cadence: 7 seconds per role
    const interval = setInterval(() => {
      setWheelRotation((prev) => prev + 60);
      setActiveNode((prev) => (prev + 1) % ecosystemNodes.length);
    }, 7000);

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
        className="relative pt-36 pb-0 md:pt-32 md:pb-20 overflow-hidden min-h-[70vh] md:min-h-[85vh] flex flex-col justify-center bg-gradient-to-tl from-[#1178ab] to-[#085078]"
      >
        {/* Subtle geometric dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="max-w-[1600px] mx-auto pl-6 md:pl-12 lg:pl-20 pr-6 relative z-20 w-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Text */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-5 max-w-xl lg:max-w-2xl -translate-y-4 lg:-translate-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 mb-4 rounded-full">
                <span className="text-[10px] sm:text-xs font-semibold capitalize  tracking-[0.3em] text-blue-50">
                  Simplifying Material Recovery For EveryOne
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-5xl font-bold tracking-wider mb-6 leading-[1.1] text-white">
                THE PLATFORM TO TRADE<span className="text-lime-400"> RECYCLABLE MATERIALS.</span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-normal leading-relaxed mb-10 text-blue-50">
             KlinFlow is a digital operating and trading platform that helps waste recovery businesses manage operations, track recyclable materials and connect with commercial buyers, redefining how recyclable materials are collected, traded, and monetized. we empower our partners to participate in a transparent, efficient and data-driven circular economy.
              </p>

              <div className="flex flex-row items-stretch gap-4 w-full">
                <Link
                  to="/contact"
                  className="bg-white hover:bg-emerald-50 text-emerald-700 font-medium px-6 py-3 rounded-md transition-colors text-sm shadow-sm"
                >
                  Contact Us
                </Link>
                <Link
                  to="/products/client"
                  className="bg-transparent font-medium px-6 py-3 rounded-md transition-colors text-sm hover:bg-white/10 text-white border border-white/30"
                >
                  View Products
                </Link>
              </div>
            </motion.div>

            {/* Right Column: Bento Grid */}
            <div className="lg:col-span-7 relative w-full mt-10 lg:mt-0 z-20 lg:ml-20 lg:translate-x-6 grid grid-cols-2 gap-2 md:gap-2 h-[420px] md:h-[500px] lg:h-[560px]">

              {/* Card 1: Field Agent — tall left card */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative row-span-2 rounded-2xl overflow-hidden border border-white/15 shadow-lg shadow-black/20 cursor-pointer"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <img
                    src="/landing-page/hero/agent.webp"
                    alt="Field Agent"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
               
              </motion.div>

              {/* Card 2: Verified Seller — top right */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative rounded-2xl overflow-hidden border border-white/15 shadow-lg shadow-black/20 cursor-pointer"
              >
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <img
                    src="/landing-page/hero/seller.webp"
                    alt="Seller"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
              </motion.div>

              {/* Card 3: Instant Payout — bottom right */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="group relative rounded-2xl overflow-hidden border border-white/15 shadow-lg shadow-black/20 cursor-pointer"
              >
                <motion.div
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0"
                >
                  <img
                    src="/landing-page/hero/agent-pay-seller.webp"
                    alt="Agent Paying Seller"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                
              </motion.div>

            </div>
          </div>
        </div>

        {/* Bent/Wave Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg
            className="w-full h-32 md:h-40 lg:h-50"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0,30 Q720,200 1440,30 L1440,120 L0,120 Z"
              fill="#e0e9f5ff"
            />
          </svg>
        </div>
      </section>

      

      {/* INTERCONNECTED ECOSYSTEM SECTION */}
      <section
        className={`relative overflow-hidden py-16 md:py-16 bg-[#e0e9f5ff]`}
      >
        {/* DOT GRID */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(13, 128, 192, 0.8) 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <motion.header 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center max-w-3xl mx-auto mb-12 lg:mb-16"
          >
            {/* <span className={`uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold mb-3 block text-primary`}>
              Interconnected Ecosystem
            </span> */}

            <h2
              className={`text-2xl md:text-4xl lg:text-5xl font-black tracking-tight leading-[1.1] mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              One Platform.{" "}
              <span className="text-blue-500">Every Participant.</span>
            </h2>

            <p
              className={`text-sm sm:text-base md:text-lg mx-auto font-normal leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}
            >
              Every participant in the recycling value chain achieves more when operating as part of a connected network.
              We bring every actor in the value chain together through one intelligent platform that streamlines material collection & logistics coordination, inventory management, marketplace operations, transactions, and payments across the entire ecosystem.
            </p>
          </motion.header>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 xl:gap-16 items-center lg:translate-x-8 xl:translate-x-16">
            {/* ── LEFT: ROTATING SEMI-CIRCULAR WHEEL SHOWCASE (EQUAL 50% SIDE) ── */}
            <motion.figure 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="w-full relative h-[580px] sm:h-[640px] lg:h-[720px] flex items-center justify-start overflow-hidden lg:overflow-visible -mt-6 lg:mt-0"
            >
              {/* Responsive container scaled from left anchor on smaller screens */}
              <div className="relative w-full h-full flex items-center justify-start transform scale-[0.62] sm:scale-[0.75] md:scale-[0.85] lg:scale-[0.92] xl:scale-100 origin-left transition-transform duration-500">
                
                {/* ── CIRCULAR RING CONNECTING ALL CARDS ── */}
                <div
                  className={`absolute rounded-full pointer-events-none transition-colors duration-500 z-0 ${
                    isDarkMode
                      ? "border border-white/35 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                      : "border border-slate-600/65 shadow-[0_0_15px_rgba(0,0,0,0.04)]"
                  }`}
                  style={{
                    left: "90px",
                    top: "50%",
                    width: "600px",
                    height: "600px",
                    transform: "translate(-50%, -50%)",
                  }}
                />

                {/* ── PROFESSIONAL CENTER CARD WITH KLINFLOW LOGO & TEXT ── */}
                <div
                  className="absolute z-30 flex items-center justify-center pointer-events-auto"
                  style={{ left: "90px", top: "50%", transform: "translate(-50%, -50%)" }}
                >
                  {/* Subtle soft backdrop blur halo */}
                  <div
                    className={`absolute -inset-3 rounded-full blur-xl pointer-events-none ${
                      isDarkMode ? "bg-amber-400/15" : "bg-emerald-500/15"
                    }`}
                  />

                  {/* Central core emblem card */}
                  <div
                    className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 border ${
                      isDarkMode
                        ? "bg-slate-900 border-amber-400/30 text-white shadow-[0_0_35px_rgba(0,0,0,0.8)]"
                        : "bg-white border-emerald-200 text-slate-900 shadow-xl"
                    }`}
                  >
                    <img
                      src="/landing-page/app-logo.webp"
                      alt="Klinflow Platform"
                      className="w-10 h-10 sm:w-16 sm:h-16 object-contain drop-shadow"
                    />
                    <span
                      className={`text-[11px] font-black uppercase tracking-wider mt-1 text-center ${
                        isDarkMode ? "text-amber-400" : "text-emerald-900"
                      }`}
                    >
                      Klinflow
                    </span>
                  </div>
                </div>

                {/* ── ROTATING WHEEL CONTAINER (Spins slowly and smoothly) ── */}
                <motion.div
                  animate={{ rotate: wheelRotation }}
                  transition={{
                    duration: 2.2,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute pointer-events-none"
                  style={{
                    left: "90px",
                    top: "50%",
                    width: 0,
                    height: 0,
                    transformOrigin: "0% 0%",
                  }}
                >
                  {ecosystemNodes.map((node, index) => {
                    const isActive = activeNode === index;
                    const ORBIT_RADIUS = 300;

                    return (
                      <Fragment key={node.id}>
                        {/* ── CONNECTING LINE FROM CENTER TO IMAGE CARD ── */}
                        <div
                          className="absolute pointer-events-none origin-left z-0"
                          style={{
                            left: 0,
                            top: 0,
                            width: `${ORBIT_RADIUS}px`,
                            height: "1px",
                            transform: `rotate(${-index * 60}deg)`,
                          }}
                        >
                          <div
                            className={`w-full h-full transition-all duration-500 ${
                              isActive
                                ? isDarkMode
                                  ? "bg-gradient-to-r from-amber-400/60 via-amber-400/90 to-amber-300"
                                  : "bg-gradient-to-r from-emerald-600/70 via-emerald-600 to-emerald-700"
                                : isDarkMode
                                  ? "bg-gradient-to-r from-white/20 via-white/35 to-white/50"
                                  : "bg-gradient-to-r from-slate-500/50 via-slate-600/70 to-slate-700/85"
                            }`}
                          />

                          {/* Subtle photon pulse on the active line */}
                          {isActive && (
                            <div className="absolute inset-0 overflow-hidden">
                              {[0, 1].map((i) => (
                                <motion.div
                                  key={i}
                                  className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                                    isDarkMode
                                      ? "bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                                      : "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
                                  }`}
                                  initial={{ left: "0%", opacity: 0 }}
                                  animate={{
                                    left: "65%",
                                    opacity: [0, 1, 1, 0],
                                  }}
                                  transition={{
                                    duration: 1.8,
                                    repeat: Infinity,
                                    ease: "linear",
                                    delay: i * 0.9,
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* ── IMAGE NODE POSITIONED AT ORBIT RADIUS ── */}
                        <div
                          className={`absolute ${isActive ? "z-50" : "z-10"}`}
                          style={{
                            left: 0,
                            top: 0,
                            transform: `rotate(${-index * 60}deg) translateX(${ORBIT_RADIUS}px)`,
                            transformOrigin: "0% 0%",
                            zIndex: isActive ? 50 : 10,
                          }}
                        >
                          {/* Wrapper centering child over the orbital coordinate */}
                          <div className={`-translate-x-1/2 -translate-y-1/2 ${isActive ? "relative z-50" : "relative z-10"}`}>
                            {/* Counter-rotate child to keep contents 100% horizontal and upright */}
                            <motion.div
                              animate={{ rotate: -(wheelRotation - index * 60) }}
                              transition={{
                                duration: 2.2,
                                ease: [0.22, 1, 0.36, 1],
                              }}
                              className={`pointer-events-auto ${isActive ? "relative z-50" : "relative z-10"}`}
                            >
                              {/* ── UNIFIED CIRCULAR IMAGE ORB (Fully opaque so lines behind are hidden) ── */}
                              <motion.div
                                onClick={() => handleNodeClick(index)}
                                title={
                                  isActive
                                    ? isAutoPaused
                                      ? "Paused — Click to resume"
                                      : "Click image to freeze and read"
                                    : `Select ${node.label}`
                                }
                                animate={{
                                  scale: isActive ? 1.6 : 0.52,
                                  opacity: 1,
                                }}
                                whileHover={{
                                  scale: isActive ? 1.63 : 0.58,
                                  opacity: 1,
                                }}
                                transition={{
                                  duration: 0.45,
                                  ease: [0.25, 1, 0.5, 1],
                                }}
                                className={`
                                  relative cursor-pointer rounded-full
                                  w-52 h-52 sm:w-60 sm:h-60
                                  transition-all duration-300
                                  bg-slate-900
                                  ${
                                    isActive
                                      ? "shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 "
                                      : "shadow-md hover:shadow-xl z-10"
                                  }
                                `}
                              >
                                {/* CIRCULAR IMAGE */}
                                <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner bg-slate-900">
                                  <img
                                    src={node.image}
                                    alt={node.title}
                                    className={`w-full h-full object-cover transition-all duration-500 pointer-events-none ${
                                      isActive ? "brightness-100 hover:scale-105" : "brightness-[0.88] contrast-[0.98] hover:brightness-100 hover:scale-105"
                                    }`}
                                    loading="eager"
                                  />
                                  {/* Inactive card subtle tint; active card has no overlay */}
                                  {!isActive && (
                                    <div className="absolute inset-0 rounded-full bg-black/20 hover:bg-black/5 transition-opacity duration-300 pointer-events-none" />
                                  )}
                                </div>

                                {/* COMPACT BOTTOM ROLE LABEL BADGE */}
                                <div className="absolute -bottom-2 inset-x-0 flex justify-center pointer-events-none">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full font-bold capitalize tracking-wide shadow-md backdrop-blur-md transition-all duration-300 truncate max-w-[85%] text-center text-[10px] ${
                                      isActive
                                        ? isDarkMode
                                          ? "bg-slate-900/90 text-amber-400 border border-amber-400/30"
                                          : "bg-white/95 text-slate-900 border border-slate-200"
                                        : "bg-black/75 text-white/80 border border-white/10"
                                    }`}
                                  >
                                    {node.label}
                                  </span>
                                </div>
                              </motion.div>
                            </motion.div>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })}
                </motion.div>
              </div>
            </motion.figure>

            {/* ── RIGHT: SYNCHRONIZED DETAILS PANEL (BORDERLESS EDITORIAL) ── */}
            <motion.article
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className={`w-full ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={ecosystemNodes[activeNode]?.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* TOP META */}
                  <div className={`flex items-center justify-between gap-4 pb-4 border-b ${
                    isDarkMode ? "border-slate-800" : "border-slate-300/60"
                  }`}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      isDarkMode ? "bg-amber-400/15 text-amber-300 border border-amber-400/25" : "bg-[#1178ab]/15 text-[#085078] border border-[#1178ab]/25"
                    }`}>
                      {ecosystemNodes[activeNode]?.badge}
                    </span>
                    <span className={`text-xs font-mono font-semibold tabular-nums ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      0{activeNode + 1} / 0{ecosystemNodes.length}
                    </span>
                  </div>

                  {/* TITLE & DESCRIPTION */}
                  <h3 className={`mt-5 text-xl sm:text-2xl font-bold tracking-tight leading-snug ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {ecosystemNodes[activeNode]?.title}
                  </h3>

                  <p className={`mt-2.5 text-sm sm:text-base leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    {ecosystemNodes[activeNode]?.description}
                  </p>

                  {/* CAPABILITIES LIST (NO MINI-CARDS) */}
                  <div className={`mt-6 pt-6 border-t grid sm:grid-cols-2 gap-x-6 gap-y-5 ${
                    isDarkMode ? "border-slate-800" : "border-slate-300/60"
                  }`}>
                    {ecosystemNodes[activeNode]?.features.map((feature) => (
                      <div
                        key={feature.title}
                        className={`pl-3.5 border-l-2 ${
                          isDarkMode ? "border-amber-400/50" : "border-[#1178ab]/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Check className={`w-3.5 h-3.5 shrink-0 stroke-[2.75] ${
                            isDarkMode ? "text-amber-400" : "text-[#085078]"
                          }`} />
                          <span className={`text-sm font-semibold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                            {feature.title}
                          </span>
                        </div>
                        <p className={`text-xs sm:text-[13px] leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          {feature.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* QUICK ROLE SELECTOR */}
                  <div className={`mt-7 pt-5 border-t ${isDarkMode ? "border-slate-800" : "border-slate-300/60"}`}>
                    <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-2.5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Participant Roles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {ecosystemNodes.map((n, idx) => {
                        const isSelected = activeNode === idx;
                        const RoleIcon = n.icon;
                        return (
                          <button
                            key={n.id}
                            onClick={() => handleSelectNode(idx)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? isDarkMode
                                  ? "bg-amber-400 text-amber-950 shadow-sm"
                                  : "bg-[#085078] text-white shadow-sm"
                                : isDarkMode
                                  ? "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80"
                                  : "bg-white/70 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-300/70"
                            }`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>{n.label}</span>
                          </button>
                        );
                      })}
                    </div>
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
        className={`py-16 md:py-24 relative overflow-hidden border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}
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
              <h3 className={`text-3xl sm:text-4xl md:text-6xl font-bold mb-8 tracking-tighter ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                A Future Where <br />
                <span className="text-primary">
                  Waste is an Asset.
                </span>
              </h3>
              <p className={`text-sm sm:text-base md:text-base font-normal leading-relaxed mb-10 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
               Our Platform exists to modernize the recycling industry by implementing an intelligent digital infrastructure. Our ecosystem unifies material collection, recovery, logistics, processing, and marketplace trading into a single connected ecosystem. By seamlessly connecting every participant in the value chain, Klinflow transforms recyclable materials from an overlooked liability into a traceable, valuable, and monetizable resource accelerating the transition to a smarter, digitalized, and sustainable circular economy.
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
                    <div className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-600  font-medium leading-tight hidden sm:block">
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

      {/* ── TRUSTED BY MARQUEE ─────────────────────────────────────────── */}
      <section className={`py-12 md:py-16 relative overflow-hidden border-t ${isDarkMode ? 'bg-surface-950 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
        <div className="text-center relative z-10 mb-8">
          <span className={`text-xs font-bold uppercase tracking-[0.25em] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Trusted by growing companies across the globe</span>
        </div>
        <div 
          className="relative flex overflow-hidden w-full"
          style={{ 
            maskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)', 
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 80%, transparent 100%)' 
          }}
        >
          <div className="flex w-max animate-marquee hover:pause">
            <div className="flex shrink-0 items-center gap-10 md:gap-20 px-5 md:px-10">
              {[
                "EcoPlastics Ltd",
                "GreenEarth Recycling",
                "TerraCycle",
                "EnviroSave",
                "ReCycle Africa",
                "Circular Economy Fund"
              ].map((partner, i) => (
                <div key={`partner1-${i}`} className={`text-base md:text-lg lg:text-xl font-bold whitespace-nowrap opacity-100 transition-opacity text-slate-600`}>
                  {partner}
                </div>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-10 md:gap-20 px-5 md:px-10">
              {[
                "EcoPlastics Ltd",
                "GreenEarth Recycling",
                "TerraCycle",
                "EnviroSave",
                "ReCycle Africa",
                "Circular Economy Fund"
              ].map((partner, i) => (
                <div key={`partner2-${i}`} className={`text-base md:text-lg lg:text-xl font-bold whitespace-nowrap opacity-100 transition-opacity text-slate-600`}>
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── B2B MARKETPLACE & RECYCLABLE MATERIALS SECTION ──────────────────────────── */}
      <section
        id="materials"
        className={`py-20 md:py-28 relative z-10 border-t overflow-hidden transition-colors duration-300 bg-emerald-500/10`}
      >
        {/* Subtle dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.09] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="max-w-[1600px] mx-auto px-6 relative z-10">
          
          {/* ── PART 1: DESIGNATED B2B DIGITAL MARKETPLACE (ASYMMETRIC EDITORIAL LAYOUT) ── */}
          <div className="max-w-7xl mx-auto mb-20">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left — Concise Executive Pitch */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-5"
              >
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-emerald-800 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  B2B Digital Marketplace
                </span>

                <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 mb-5 leading-[1.12]">
                  Direct B2B Trading for{" "}
                  <span className="text-emerald-700">Recycled Commodities.</span>
                </h2>

                <p className="text-base leading-relaxed text-slate-700 mb-8">
                  Klinflow connects verified recovery hubs and aggregators
                  directly with recyclers and manufacturers. Browse verified
                  lots, broadcast bulk Sourcing RFQs, and settle every trade
                  with full weight and price transparency.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/products/B2B"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#085078] text-white hover:bg-[#0a6191] transition-all shadow-md shadow-[#085078]/15"
                  >
                    <span>Explore B2B Market</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/products/hub"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-white/80 text-slate-800 hover:bg-white border border-slate-300/70 transition-all"
                  >
                    <span>See Hub MOS</span>
                  </Link>
                </div>
              </motion.div>

              {/* Right — Clean Hairline-Divided 3-Row Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-7 bg-white/95 rounded-2xl border border-emerald-900/10 shadow-lg shadow-emerald-950/5 divide-y divide-slate-200/80"
              >
                {[
                  {
                    num: "01",
                    icon: Factory,
                    tag: "For Industrial Buyers",
                    title: "Structured Bulk Sourcing & RFQs",
                    desc: "Browse verified plastic, paper, glass, and metal lots by grade and location, or broadcast Sourcing RFQs to compare supplier quotes side by side.",
                  },
                  {
                    num: "02",
                    icon: Warehouse,
                    tag: "For Recovery Hubs",
                    title: "Direct Sales Straight from Inventory",
                    desc: "List processed bales and regrind directly from your Hub MOS inventory to reach verified buyers without middlemen cutting into your margins.",
                  },
                  {
                    num: "03",
                    icon: ShieldCheck,
                    tag: "Verified Settlement",
                    title: "Digital Waybills & Direct Payouts",
                    desc: "Every transaction is backed by verified scale weights, clear KES/kg pricing, and integrated wallet settlements via M-Pesa or bank transfer.",
                  },
                ].map((row) => {
                  const RowIcon = row.icon;
                  return (
                    <div
                      key={row.num}
                      className="p-6 sm:p-7 flex items-start gap-4 sm:gap-5"
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-600/15 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <RowIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-emerald-700">
                            {row.num}
                          </span>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {row.tag}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1.5">
                          {row.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600">
                          {row.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          </div>

          

          {/* ── PART 2: STANDARDIZED COMMODITIES CATALOG ── */}
          <div className="max-w-7xl mx-auto pt-14 border-t border-emerald-900/10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10"
            >
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#1178ab] block mb-3">
                  Standardized Commodities
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  Materials Collected &amp; Traded
                </h3>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-md">
                Every lot is sorted, weighed, and graded into industrial
                recyclable streams ready for local processing and bulk B2B
                trade.
              </p>
            </motion.div>

            {/* Clean Light Architectural Commodity Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tradedMaterials.map((material, idx) => (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group bg-white rounded-2xl border border-emerald-900/10 shadow-sm hover:shadow-xl hover:shadow-slate-900/5 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  {/* Top Image Header */}
                  <div className="relative h-48 overflow-hidden bg-slate-100">
                    <img
                      src={material.image}
                      alt={material.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/95 text-[#085078] shadow-xs">
                        {material.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#085078]/90 text-white backdrop-blur-sm">
                        {material.demandBadge}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 flex-1 flex flex-col">
                    <span className="text-xs font-medium text-[#1178ab] mb-1">
                      {material.spec}
                    </span>
                    <h4 className="text-xl font-bold tracking-tight text-slate-900 mb-4">
                      {material.name}
                    </h4>

                    {/* Visible Traded Grades */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {material.items.slice(0, 6).map((item, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#f0f7fc] text-slate-700 border border-[#1178ab]/15"
                        >
                          {item}
                        </span>
                      ))}
                      {material.items.length > 6 && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">
                          +{material.items.length - 6} more
                        </span>
                      )}
                    </div>

                    {/* Footer Action */}
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">
                        {material.items.length} graded streams
                      </span>
                      <Link
                        to="/products/B2B"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#085078] hover:text-[#1178ab] transition-colors"
                      >
                        <span>Trade on Exchange</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ── IMPACT STORY SECTION ───────────────────────────────────────────── */}
      <section
        id="impact"
        className={`py-20 md:py-28 px-6 relative z-10 overflow-hidden  transition-colors duration-300 bg-amber-100/20 border-slate-800
        `}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="lg:col-span-6 xl:col-span-7 text-left"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 mb-5">
                Real-World Impact
              </div>

              <h3 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-800 mb-6 leading-[1.15]">
                Empowering Communities. <br />
                <span className="text-amber-400">Changing Lives.</span>
              </h3>

              <p className="text-base sm:text-lg leading-relaxed font-normal text-slate-600 mb-8 max-w-2xl">
                Klinflow connects everyday recyclers with dependable buyers. By turning household and business recyclables into fair, immediate income, we make it easy for residents and local collectors to earn more while keeping neighborhoods clean. Our software connects neighborhood collectors directly to verified recycling hubs and manufacturers—bringing fair pricing, honest weights, and dependable livelihoods to local communities.
              </p>

              {/* Impact Highlights */}
              <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
                <div className="p-4 rounded-xl bg-white/5 border border-black/10 backdrop-blur-sm">
                  <div className="text-amber-400 font-black text-xl mb-1">Consistent Payouts</div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                    Instant, transparent payments directly to collection agents and neighborhood sellers.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-black/10 backdrop-blur-sm">
                  <div className="text-emerald-400 font-black text-xl mb-1">Direct to Industry</div>
                  <p className="text-xs sm:text-sm text-slate-600 leading-snug">
                    Connecting sorted materials directly to local recycling hubs and processing factories.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right: Images styled as falling cards */}
            <div className="lg:col-span-6 xl:col-span-5 relative w-full h-[520px] sm:h-[580px] md:h-[620px] lg:h-[640px] flex items-center justify-center">
              {/* Falling Image 1 (Resident/Seller - top left tilt) */}
              <motion.div
                initial={{ y: -80, opacity: 0, rotate: -22 }}
                whileInView={{ y: 0, opacity: 1, rotate: -10 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 60, damping: 14, delay: 0.1 }}
                whileHover={{ rotate: -4, scale: 1.03, y: -6 }}
                className="absolute top-2 sm:top-4 left-0 sm:left-2 md:left-0 z-10 w-60 sm:w-72 md:w-80 lg:w-[330px] rounded-3xl bg-slate-800/90 border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] cursor-pointer group"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src="/landing-page/hygenex/hygenex-woman.webp"
                    alt="Empowered Resident"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block mb-0.5">
                      Seller
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white drop-shadow leading-snug">
                      Sell and Earn
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Falling Image 2 (Operator/Agent - bottom right tilt) */}
              <motion.div
                initial={{ y: -120, opacity: 0, rotate: 26 }}
                whileInView={{ y: 0, opacity: 1, rotate: 12 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 50, damping: 13, delay: 0.28 }}
                whileHover={{ rotate: 5, scale: 1.03, y: -6 }}
                className="absolute bottom-14 sm:bottom-20 md:bottom-12 lg:bottom-16 -right-4 sm:-right-8 md:-right-10 lg:-right-32 z-20 w-60 sm:w-72 md:w-80 lg:w-[330px] rounded-3xl bg-slate-800/90 border border-white/15 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] cursor-pointer group"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden">
                  <img
                    src="/landing-page/hygenex/hygenex-man.webp"
                    alt="Empowered Operator"
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block mb-0.5">
                      Collection Agent
                    </span>
                    <p className="text-sm sm:text-base font-bold text-white drop-shadow leading-snug">
                      Be your Boss,Define your Pay
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
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
