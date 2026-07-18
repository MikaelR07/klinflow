import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Wallet,
  Truck,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Handshake,
  Layout as LayoutIcon,
  BarChart3,
  Brain,
  Leaf,
  LineChart,
  ShieldCheck,
  Users,
  Smartphone,
  Network,
  Activity,
  Globe,
  ChevronRight,
  PlayCircle,
  Pause,
  Play,
  Zap,
  DollarSign,
  TrendingUp,
  EyeOff,
  SearchX,
  Weight,
  RouteOff,
  ClockAlert,
  ShieldAlert,
  Minimize2,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

type ProblemSolutionPairData = {
  id: string;
  number: string;
  problem: {
    title: string;
    desc: string;
    icon: React.ElementType;
  };
  solution: {
    label: string;
    desc: string;
    icon: React.ElementType;
  };
};

const problemSolutionPairs: ProblemSolutionPairData[] = [
  {
    id: "opaque-pricing",
    number: "01",
    problem: {
      title: "Opaque Pricing",
      desc: "Most households and independent sellers have little visibility into current market rates. Pricing is often dictated by middlemen, leading to inconsistent valuations and reduced earnings.",
      icon: EyeOff,
    },
    solution: {
      label: "Live Market Intelligence",
      desc: "Access real-time prices across multiple recyclable categories, historical market trends, and intelligent valuation tools to make informed selling decisions.",
      icon: TrendingUp,
    },
  },

  {
    id: "limited-access",
    number: "02",
    problem: {
      title: "Limited Market Access",
      desc: "Finding reliable buyers can be difficult and time-consuming. Many sellers depend on informal networks that limit competition and pricing opportunities.",
      icon: SearchX,
    },
    solution: {
      label: "Verified Buyer Network",
      desc: "Connect directly with verified recyclers, aggregators, and industrial off-takers through a trusted digital marketplace.",
      icon: Users,
    },
  },

  {
    id: "small-volumes",
    number: "03",
    problem: {
      title: "Small Volumes Earn Less",
      desc: "Many recyclers only accept large quantities, leaving households and small-scale collectors unable to access premium pricing tiers.",
      icon: Minimize2,
    },
    solution: {
      label: "Community Swarms",
      desc: "Pool recyclable materials with nearby users to meet industrial minimums, unlock better rates, and maximize collective earnings.",
      icon: Handshake,
    },
  },

  {
    id: "inefficient-collections",
    number: "04",
    problem: {
      title: "Inefficient Collections",
      desc: "Collection processes are fragmented, difficult to coordinate, and often lack visibility into pickup schedules or agent activity.",
      icon: RouteOff,
    },
    solution: {
      label: "Smart Logistics",
      desc: "Schedule pickups, track agents in real time, and benefit from optimized collection routes that reduce delays and improve reliability.",
      icon: Truck,
    },
  },

  {
    id: "delayed-payments",
    number: "05",
    problem: {
      title: "Delayed Payments",
      desc: "Cash-based transactions create uncertainty, disputes, and delays, leaving sellers waiting to receive compensation.",
      icon: ClockAlert,
    },
    solution: {
      label: "Instant Digital Payouts",
      desc: "Receive secure payments directly into your Klinflow Wallet immediately after materials are verified and processed.",
      icon: Zap,
    },
  },

  {
    id: "lack-of-trust",
    number: "06",
    problem: {
      title: "Lack of Trust",
      desc: "Disagreements around weight, material grading, and final payouts create friction across the recycling value chain.",
      icon: ShieldAlert,
    },
    solution: {
      label: "End-to-End Transparency",
      desc: "Every transaction is digitally verified with collection records, weight confirmations, receipts, and a complete audit trail.",
      icon: ShieldCheck,
    },
  },
];

function ArrowConnector({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center w-20 flex-shrink-0 relative" aria-hidden="true">
      <svg width="80" height="24" viewBox="0 0 80 24" fill="none" className="overflow-visible">
        <motion.path
          d="M 0 12 Q 20 4 40 12 Q 60 20 80 12"
          stroke={isDarkMode ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.4)"}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />
        <motion.circle
          r="3"
          fill={isDarkMode ? "#34d399" : "#10b981"}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ offsetPath: "path('M 0 12 Q 20 4 40 12 Q 60 20 80 12')" }}
        />
        <motion.circle
          r="2"
          fill={isDarkMode ? "#34d399" : "#10b981"}
          opacity={0.5}
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: ["0%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.7 }}
          style={{ offsetPath: "path('M 0 12 Q 20 4 40 12 Q 60 20 80 12')" }}
        />
      </svg>
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-b-[5px] border-l-[7px] border-t-transparent border-b-transparent ${isDarkMode ? "border-l-emerald-400/60" : "border-l-emerald-500/60"}`}
      />
    </div>
  );
}

function ProblemSolutionPair({
  pair,
  index,
  isDarkMode,
}: {
  pair: ProblemSolutionPairData;
  index: number;
  isDarkMode: boolean;
}) {
  const ProblemIcon = pair.problem.icon;
  const SolutionIcon = pair.solution.icon;

  return (
    <motion.article
      role="listitem"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex flex-col lg:flex-row items-stretch gap-0 lg:gap-0"
    >
      {/* Desktop: Pair Number left of row */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.08 + 0.1, type: "spring", stiffness: 180 }}
        className={`hidden lg:flex w-11 h-11 flex-shrink-0 items-center justify-center rounded-xl self-center mr-3 text-sm font-black tracking-tight ${isDarkMode ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800/50" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
      >
        {pair.number}
      </motion.div>

      {/* Problem Card */}
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={`flex-1 min-w-0 p-5 sm:p-6 rounded-2xl border transition-shadow duration-300 hover:shadow-lg group
          ${isDarkMode ? "bg-rose-950/20 border-rose-800/30 hover:shadow-rose-900/20" : "bg-rose-50/80 border-rose-100 hover:shadow-rose-200/50"}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isDarkMode ? "bg-rose-900/40 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
            <ProblemIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold mb-1 leading-tight ${isDarkMode ? "text-rose-200" : "text-rose-900"}`}>{pair.problem.title}</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-rose-300/70" : "text-rose-700/70"}`}>{pair.problem.desc}</p>
          </div>
        </div>
      </motion.div>

      {/* Mobile: Pair number + vertical connector between cards */}
      <div className="flex lg:hidden items-center gap-3 py-2.5 px-1">
        <span className={`text-[10px] font-black tracking-widest ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>{pair.number}</span>
        <div className={`flex-1 h-px ${isDarkMode ? "bg-emerald-800/40" : "bg-emerald-200"}`} />
        <ChevronRight className={`w-3.5 h-3.5 -rotate-90 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`} />
      </div>

      {/* Desktop: Arrow connector between cards */}
      <ArrowConnector isDarkMode={isDarkMode} />

      {/* Solution Card */}
      <motion.div
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className={`flex-1 min-w-0 p-5 sm:p-6 rounded-2xl border transition-shadow duration-300 hover:shadow-lg group
          ${isDarkMode ? "bg-emerald-950/20 border-emerald-800/30 hover:shadow-emerald-900/20" : "bg-emerald-50/80 border-emerald-100 hover:shadow-emerald-200/50"}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${isDarkMode ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
            <SolutionIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm sm:text-base font-bold mb-1 leading-tight ${isDarkMode ? "text-emerald-200" : "text-emerald-900"}`}>{pair.solution.label}</h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-emerald-300/70" : "text-emerald-700/70"}`}>{pair.solution.desc}</p>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}

export default function ProductClient() {
  const { isDarkMode } = useThemeStore();
  const [activeCard, setActiveCard] = useState(0);
  const [isCardPaused, setIsCardPaused] = useState(false);
  const [activeCard2, setActiveCard2] = useState(0);
  const [isCardPaused2, setIsCardPaused2] = useState(false);
  const [activeIssue, setActiveIssue] = useState(0);
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
    "/products/client/collective-hub.webp"
  ];

  const deepDiveCards = [
    {
      subtitle: "Market Intelligence",
      subtitleColor: "text-primary",
      title: "Never guess the value of waste again.",
      description: "Access live market prices for different material grades. Whether you have a few kilos of PET bottles or tons of industrial copper, Klinflow provides real-time tickers and trends so you sell at the optimal time. Our platform tracks over 50 material categories and automatically alerts you when market conditions are optimal to lock in the highest profit margins.",
      features: ['Live Price Tickers', 'Historical Trend Graphs', 'Automated AI Valuation Estimates'],
      featureColor: "text-primary",
      bgFeatureColor: "bg-primary/20",
      image: "/products/client/market-price.webp"
    },
    {
      subtitle: "B2B Trading & RFQs",
      subtitleColor: "text-blue-500",
      title: "Direct access to industrial buyers.",
      description: "Create listings, receive competitive bids, and track Request for Quotation (RFQ) proposals. We connect bulk sellers directly to verified recyclers and industrial off-takers, bypassing traditional middlemen. Upload cryptographic proof of quality, negotiate minimum viable volumes, and finalize legally-binding escrow smart contracts instantly.",
      features: ['Direct Listing Creation', 'Real-time Bid Management', 'RFQ Proposal Tracking'],
      featureColor: "text-blue-500",
      bgFeatureColor: "bg-blue-500/20",
      image: "/products/client/RFQ.webp"
    },
    {
      subtitle: "Frictionless Logistics",
      subtitleColor: "text-purple-500",
      title: "Verified pickups, right at your doorstep.",
      description: "Post a collection request and let the network come to you. Verified Klinflow Agents handle the weighing and grading on-site using cryptographic verification, ensuring absolute transparency. Track the entire journey via GPS, view the agent's historical ratings, and manage bulk collections without breaking a sweat.",
      features: ['Geo-fenced Agent Tracking', 'On-site Digital Weighing Integration', 'Secure QR Handshake'],
      featureColor: "text-purple-500",
      bgFeatureColor: "bg-purple-500/20",
      image: "/products/client/book-pickup.webp"
    },
    {
      subtitle: "FinTech Integration",
      subtitleColor: "text-emerald-500",
      title: "Instant payouts. Zero delays.",
      description: "The moment an Agent verifies your materials, funds are instantly released into your Klinflow Wallet. Withdraw directly to M-Pesa or your bank account in seconds. Monitor detailed transaction ledgers, automate tax reporting, and leverage micro-loans backed by your consistent trading volume.",
      features: ['In-app Digital Wallet', 'Instant M-Pesa Integration', 'Detailed Transaction Ledgers'],
      featureColor: "text-emerald-500",
      bgFeatureColor: "bg-emerald-500/20",
      image: "/products/client/client-wallet.webp"
    },
   
  ];

  useEffect(() => {
    if (isCardPaused) return;
    const timer = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % deepDiveCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCardPaused, deepDiveCards.length]);

  const deepDiveCards2 = [
    {
      subtitle: "AI Analysis",
      subtitleColor: "text-blue-500",
      title: "Smart material recognition.",
      description: "Instantly analyze materials using advanced AI to determine their value and recycling potential. Snap a picture and get real-time insights.",
      features: ['Real-time Image Analysis', 'Material Classification', 'Value Estimation'],
      featureColor: "text-blue-500",
      bgFeatureColor: "bg-blue-500/20",
      image: "/products/client/ai-analysis.webp"
    },
    {
      subtitle: "Impact Analysis",
      subtitleColor: "text-emerald-500",
      title: "Track your environmental footprint.",
      description: "Visualize your positive impact on the environment. Track carbon offset, materials saved from landfills, and your overall contribution to a greener planet.",
      features: ['Carbon Offset Tracking', 'Waste Reduction Metrics', 'Personalized Impact Reports'],
      featureColor: "text-emerald-500",
      bgFeatureColor: "bg-emerald-500/20",
      image: "/products/client/impact-analysis.webp"
    },
    {
      subtitle: "Smart Contracts",
      subtitleColor: "text-amber-500",
      title: "Secure and transparent agreements.",
      description: "Leverage blockchain-powered smart contracts to ensure secure, transparent, and immutable agreements with verified buyers and aggregators.",
      features: ['Immutable Records', 'Automated Execution', 'Dispute Resolution'],
      featureColor: "text-amber-500",
      bgFeatureColor: "bg-amber-500/20",
      image: "/products/client/contracts.webp"
    },
     {
      subtitle: "Collaborative Growth",
      subtitleColor: "text-amber-500",
      title: "Pool resources. Maximize profits.",
      description: "Join \"Swarms\" with other local sellers to aggregate small quantities into bulk industrial orders, unlocking premium tier pricing from top-tier recyclers. Communicate via encrypted channels, vote on acceptable RFQs, and watch payouts distribute perfectly pro-rata according to each member's exact contribution weight.",
      features: ['Swarm Creation & Discovery', 'Group Chat & Negotiation', 'Pro-rata Payout Distribution'],
      featureColor: "text-amber-500",
      bgFeatureColor: "bg-amber-500/20",
      image: "/products/client/collective-hub.webp"
    }
  ];

  useEffect(() => {
    if (isCardPaused2) return;
    const timer = setInterval(() => {
      setActiveCard2((prev) => (prev + 1) % deepDiveCards2.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCardPaused2, deepDiveCards2.length]);

  return (
    <Layout>
      {/* 1. HERO SECTION */}
      <section className="relative pt-24 pb-16 md:pt-40 md:pb-32 min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Layer */}
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
          <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/8 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <div className="max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 relative z-10 w-full mt-4 lg:-mt-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side: Text */}
            <div className="max-w-2xl">
              {/* Pill */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 ${isDarkMode ? "bg-surface-900 text-slate-200 border border-white/10" : "bg-white/80 backdrop-blur-sm text-slate-600 shadow-sm border border-slate-100"}`}>
                <div className="w-2 h-2 rounded-full bg-primary" />
                Multi Persona Application
              </div>
              
              {/* Heading */}
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1] ${isDarkMode ? "text-white" : "text-[#0f172a]"}`}
              >
                Recycling Made,<br />
                 Rewarding<br />
                <span className="text-primary">and Transparent.</span>
              </h1>
              
              {/* Subheading */}
              <p
                className={`text-base md:text-lg font-medium leading-relaxed mb-10 max-w-xl ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}
              >
               The Klinflow Client App empowers residents,Businesses, and material sellers to participate in the circular economy through a seamless digital experience. Schedule collections, access real-time market prices, connect with verified buyers, join community Group Pickups, track your environmental impact, and receive secure payouts—all from a single, intelligent platform designed to make recycling simple, transparent, and rewarding.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-row flex-wrap gap-3 sm:gap-4">
                <Link to="/contact" className="flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 bg-primary text-white font-bold rounded-full  active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
                  Get Started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
                <button
                  className={`flex-1 sm:flex-none px-4 py-3 sm:px-8 sm:py-4 rounded-full font-bold transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap ${
                    isDarkMode 
                      ? "bg-surface-900 text-white hover:bg-surface-700 border border-white/10" 
                      : "bg-white text-slate-900 shadow-sm hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  Watch Demo <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
              </div>
            </div>

            {/* Right side: Static Images Side by Side */}
            <div className="relative flex justify-center lg:justify-end mt-16 lg:mt-0 perspective-[1000px] h-[450px] sm:h-[550px] md:h-[600px] items-center">
              {/* Image 1 (Left/Back) */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? -15 : -30, rotate: 0, y: 0 }}
                animate={{ opacity: 1, x: isMobile ? "-25%" : "-45%", rotate: 0, y: isMobile ? -15 : -30 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3, delay: 0.2 }}
                className={`absolute w-[200px] sm:w-[240px] md:w-[280px] aspect-[1/2] rounded-[2rem] overflow-hidden border shadow-2xl z-10 ${isDarkMode ? "border-white/10 bg-surface-900" : "border-slate-200 bg-white"}`}
              >
                 <img src={sliderImages[2]} alt="Client App Home" className="w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/5" />
              </motion.div>

              {/* Image 2 (Right/Front) */}
              <motion.div
                initial={{ opacity: 0, x: isMobile ? 15 : 30, rotate: 0, y: 20 }}
                animate={{ opacity: 1, x: isMobile ? "25%" : "45%", rotate: 0, y: isMobile ? 15 : 30 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.3, delay: 0.4 }}
                className={`absolute w-[200px] sm:w-[240px] md:w-[280px] aspect-[1/2] rounded-[2rem] overflow-hidden border z-20 ${isDarkMode ? "border-white/10 bg-surface-900 shadow-[0_20px_40px_rgba(0,0,0,0.4)]" : "border-slate-200 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.15)]"}`}
              >
                 <img src={sliderImages[1]} alt="Client App Seller" className="w-full h-full object-cover" />
              </motion.div>
            </div>
          </div>
        </div>
      </section>


  {/* 3. WHY KLINFLOW EXISTS */}

<section
  className={`py-10 md:py-24 px-6 relative overflow-hidden ${
    isDarkMode ? "bg-surface-900" : "bg-slate-50"
  }`}
>
  {/* Background Grid */}
  <div
    className={`absolute inset-0 ${
      isDarkMode ? "opacity-[0.04]" : "opacity-[0.03]"
    }`}
    style={{
      backgroundImage:
        "radial-gradient(circle, currentColor 1px, transparent 1px)",
      backgroundSize: "32px 32px",
    }}
  />

{/* Glow Effects */}



  <div className="max-w-7xl mx-auto relative z-10">
    {/* Header */}
    <div className="max-w-3xl mx-auto mb-16 md:mb-20 text-center">
      <div className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-6">
        Why Klinflow Exists
      </div>

  <h2
    className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-6 ${
      isDarkMode ? "text-white" : "text-slate-900"
    }`}
  >
    Built to solve the biggest inefficiencies in the recycling value chain.
  </h2>

  <p
    className={`text-base md:text-lg leading-relaxed max-w-2xl mx-auto ${
      isDarkMode ? "text-slate-400" : "text-slate-600"
    }`}
  >
    Traditional recycling systems are fragmented, opaque, and difficult
    to scale. Klinflow replaces manual processes with a connected digital
    ecosystem that makes recycling more transparent, efficient, and
    rewarding for residents and sellers.
  </p>
</div>

{/* Interactive Bento Grid & Flipping Solution */}
<div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-center relative">
  {/* Animated SVG Lines Background */}
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0">
    {[
      "M 25 25 C 40 25, 50 50, 65 50",
      "M 45 25 C 55 25, 60 50, 65 50",
      "M 45 75 C 55 75, 60 50, 65 50"
    ].map((d, i) => (
      <g key={i}>
        <path d={d} stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="1" fill="none" vectorEffect="non-scaling-stroke" />
        {activeIssue === i && (
          <motion.path 
            d={d} 
            stroke="#10b981" 
            strokeWidth="3" 
            fill="none" 
            vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0, opacity: 0 }} 
            animate={{ pathLength: 1, opacity: [0, 1, 0] }} 
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} 
          />
        )}
      </g>
    ))}
  </svg>

  {/* LEFT SIDE: Issues Bento Grid */}
  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 relative z-10">
    {problemSolutionPairs.map((item, i) => (
      <button
        key={item.id}
        onClick={() => setActiveIssue(i)}
        className={`text-left p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col ${activeIssue === i ? (isDarkMode ? "bg-surface-950 border-primary" : "bg-white border-primary shadow-lg shadow-primary/10 scale-[1.02]") : (isDarkMode ? "bg-surface-900/50 border-slate-600 " : "bg-slate-50 border-slate-200")}`}
      >
        <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-5 transition-colors duration-300 ${activeIssue === i ? "bg-primary text-white shadow-lg shadow-primary/30" : (isDarkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-100 text-rose-600")}`}>
          <item.problem.icon className="w-4 h-4 sm:w-6 sm:h-6" />
        </div>
        <h4 className={`text-sm sm:text-lg font-bold mb-1.5 sm:mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{item.problem.title}</h4>
        <p className={`text-[10px] sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{item.problem.desc}</p>
      </button>
    ))}
  </div>

  {/* RIGHT SIDE: Solution Card */}
  <div className="lg:col-span-4 relative z-10 perspective-[1000px] mt-6 lg:mt-0 flex flex-col justify-center">
    <AnimatePresence mode="wait">
      {(() => {
         const activeItem = problemSolutionPairs[activeIssue];
         const SolutionIcon = activeItem.solution.icon;
         return (
           <motion.div
             key={activeIssue}
             initial={{ rotateY: -90, opacity: 0, scale: 0.9 }}
             animate={{ rotateY: 0, opacity: 1, scale: 1 }}
             exit={{ rotateY: 90, opacity: 0, scale: 0.9 }}
             transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
             className={`w-full max-w-[400px] mx-auto lg:ml-auto lg:mr-0 p-5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border shadow-xl flex flex-col ${isDarkMode ? "bg-emerald-900/20 border-emerald-500/30 shadow-emerald-900/20" : "bg-emerald-50 border-emerald-200 shadow-emerald-500/10"}`}
           >
             <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-primary text-white flex items-center justify-center mb-3 lg:mb-4 shadow-lg shadow-primary/30">
               <SolutionIcon className="w-4 h-4 lg:w-5 lg:h-5" />
             </div>
             <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-1.5 lg:mb-2">The Klinflow Solution</div>
             <h3 className={`text-base lg:text-lg font-bold mb-1.5 lg:mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{activeItem.solution.label}</h3>
             <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? "text-emerald-100/70" : "text-emerald-900/70"}`}>{activeItem.solution.desc}</p>
           </motion.div>
         );
      })()}
    </AnimatePresence>
  </div>
</div>


  </div>
</section>


      {/* 4. DEEP DIVE CAROUSEL */}
      <section className={`py-20 md:py-24 px-6 overflow-hidden relative ${isDarkMode ? "bg-surface-950" : "bg-white"}`}>
        {/* LINE GRID background */}
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.05]" : "opacity-[0.3]"}`}
          style={{
            backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side: Text that updates based on activeCard */}
            <div className="order-2 lg:order-1 relative flex flex-col justify-between">
              <div className="relative min-h-[550px] sm:min-h-[450px] md:min-h-[380px] lg:min-h-[420px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                  <div className={`${deepDiveCards[activeCard].subtitleColor} font-bold tracking-widest text-sm uppercase mb-4`}>{deepDiveCards[activeCard].subtitle}</div>
                  <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {deepDiveCards[activeCard].title}
                  </h2>
                  <p className={`text-lg mb-8 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {deepDiveCards[activeCard].description}
                  </p>
                  <ul className="space-y-4 mb-8">
                    {deepDiveCards[activeCard].features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${deepDiveCards[activeCard].bgFeatureColor} flex items-center justify-center ${deepDiveCards[activeCard].featureColor}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
              </div>
            </div>

            {/* Right side: Image that updates based on activeCard */}
            <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end perspective-[1000px] min-h-[500px]">
              <div className="relative max-w-[280px] md:max-w-[320px] w-full flex items-center aspect-[1/2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard}
                    initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center w-full"
                  >
                    <div className={`rounded-[2rem] overflow-hidden border transition-all duration-500 shadow-2xl ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-200 bg-white"}`}>
                      <img src={deepDiveCards[activeCard].image} alt={deepDiveCards[activeCard].subtitle} className="w-full h-auto object-cover" />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls overlay */}
                <button 
                  onClick={() => setIsCardPaused(!isCardPaused)}
                  className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${isDarkMode ? "bg-black/40 border-white/10 text-white hover:bg-black/60" : "bg-white/40 border-white/40 text-slate-900 hover:bg-white/60"}`}
                >
                  {isCardPaused ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                </button>

                <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2 z-20">
                  {deepDiveCards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveCard(i)}
                      className={`w-2 h-2 rounded-full transition-all ${activeCard === i ? "w-6 bg-primary" : "bg-primary/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. DEEP DIVE CAROUSEL 2 */}
      <section className={`py-20 md:py-24 px-6 overflow-hidden relative ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}>
        {/* LINE GRID background */}
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.05]" : "opacity-[0.3]"}`}
          style={{
            backgroundImage: `linear-gradient(${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"} 1px, transparent 1px), linear-gradient(90deg, ${isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left side: Image that updates based on activeCard2 */}
            <div className="order-1 lg:order-1 relative flex justify-center lg:justify-start perspective-[1000px] min-h-[500px]">
              <div className="relative max-w-[280px] md:max-w-[320px] w-full flex items-center aspect-[1/2]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard2}
                    initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center w-full"
                  >
                    <div className={`rounded-[2rem] overflow-hidden border transition-all duration-500 shadow-2xl ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-200 bg-white"}`}>
                      <img src={deepDiveCards2[activeCard2].image} alt={deepDiveCards2[activeCard2].subtitle} className="w-full h-auto object-cover" />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Controls overlay */}
                <button 
                  onClick={() => setIsCardPaused2(!isCardPaused2)}
                  className={`absolute top-4 right-4 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${isDarkMode ? "bg-black/40 border-white/10 text-white hover:bg-black/60" : "bg-white/40 border-white/40 text-slate-900 hover:bg-white/60"}`}
                >
                  {isCardPaused2 ? <Play className="w-4 h-4 ml-0.5" /> : <Pause className="w-4 h-4" />}
                </button>

                <div className="absolute -bottom-10 left-0 right-0 flex justify-center gap-2 z-20">
                  {deepDiveCards2.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveCard2(i)}
                      className={`w-2 h-2 rounded-full transition-all ${activeCard2 === i ? "w-6 bg-primary" : "bg-primary/30"}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right side: Text that updates based on activeCard2 */}
            <div className="order-2 lg:order-2 relative flex flex-col justify-between">
              <div className="relative min-h-[550px] sm:min-h-[450px] md:min-h-[380px] lg:min-h-[420px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCard2}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0"
                  >
                  <div className={`${deepDiveCards2[activeCard2].subtitleColor} font-bold tracking-widest text-sm uppercase mb-4`}>{deepDiveCards2[activeCard2].subtitle}</div>
                  <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {deepDiveCards2[activeCard2].title}
                  </h2>
                  <p className={`text-lg mb-8 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {deepDiveCards2[activeCard2].description}
                  </p>
                  <ul className="space-y-4 mb-8">
                    {deepDiveCards2[activeCard2].features.map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${deepDiveCards2[activeCard2].bgFeatureColor} flex items-center justify-center ${deepDiveCards2[activeCard2].featureColor}`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMBINED: HOW IT WORKS + ECOSYSTEM */}
      <section className={`py-24 px-6 relative overflow-hidden ${isDarkMode ? "bg-surface-900" : "bg-slate-50"}`}>
        {/* Dot grid background */}
        <div
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.06]" : "opacity-[0.04]"}`}
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section header */}
          <div className="text-center mb-20">
            <span className="uppercase tracking-[0.3em] text-primary text-xs font-bold mb-3 block">Platform Overview</span>
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              How It Works & Who's Connected
            </h2>
            <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              A simple 4-step pipeline powered by an ecosystem of connected apps.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* LEFT — How It Works: Circular orbit */}
            <div className="lg:col-span-5 relative w-full aspect-square max-w-[450px] mx-auto lg:mr-auto">
              {/* Center label */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full flex flex-col items-center justify-center z-20 shadow-xl border-2 border-primary/30 ${isDarkMode ? "bg-surface-950" : "bg-white"}`}>
                <span className="text-primary text-2xl font-black">4</span>
                <span className={`text-xs font-bold ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>Steps</span>
              </div>

              {/* Orbit ring */}
              <div className={`absolute inset-[20%] rounded-full border-2 border-dashed ${isDarkMode ? "border-white/40" : "border-slate-200"}`} />

              {/* Static nodes with animated connector lines */}
              <div className="absolute inset-0">
                {[
                  { step: "01", title: "Post Request", desc: "List materials or schedule pickup.", icon: Smartphone, color: "text-blue-500", angle: -45 },
                  { step: "02", title: "Agent Matches", desc: "Nearest verified agent dispatched.", icon: Truck, color: "text-purple-500", angle: 45 },
                  { step: "03", title: "Verify & Weigh", desc: "Cryptographic QR verification.", icon: ShieldCheck, color: "text-amber-500", angle: 135 },
                  { step: "04", title: "Get Paid", desc: "Instant wallet payout.", icon: Wallet, color: "text-emerald-500", angle: -135 },
                ].map((s, i) => {
                  const rad = (s.angle * Math.PI) / 180;
                  const ORBIT_RADIUS = 100; // radius in pixels for connector line
                  const radiusPct = 38; // percentage from center for node placement
                  const x = 50 + radiusPct * Math.cos(rad);
                  const y = 50 + radiusPct * Math.sin(rad);
                  return (
                    <div
                      key={i}
                      className="absolute"
                      style={{ top: `${y}%`, left: `${x}%`, transform: "translate(-50%, -50%)" }}
                    >
                      {/* CENTER CONNECTOR */}
                      <div
                        className={`absolute left-1/2 top-1/2 origin-left z-0 overflow-hidden ${
                          isDarkMode ? "bg-white/10" : "bg-slate-200"
                        }`}
                        style={{
                          width: `${ORBIT_RADIUS}px`,
                          height: "2px",
                          transform: `
                            rotate(${s.angle + 180}deg)
                            translateX(0px)
                          `,
                        }}
                      >
                        {[0, 1].map((j) => (
                          <motion.div
                            key={j}
                            className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${s.color.replace('text-', 'bg-')} shadow-[0_0_8px_2px_currentColor]`}
                            initial={{ left: "0%", opacity: 0 }}
                            animate={{ left: "100%", opacity: [0, 1, 1, 0] }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                              delay: j * 1,
                            }}
                          />
                        ))}
                      </div>

                      {/* NODE */}
                      <div className={`relative z-10 w-28 md:w-32 p-3 rounded-2xl text-center shadow-lg border ${isDarkMode ? "bg-surface-950 border-white/10" : "bg-white border-slate-200"} hover:scale-105 transition-transform`}>
                        <div className={`w-10 h-10 mx-auto rounded-xl bg-primary/10 ${s.color} flex items-center justify-center mb-2`}>
                          <s.icon className="w-5 h-5" />
                        </div>
                        <div className="text-[10px] font-bold text-primary tracking-widest mb-0.5">{s.step}</div>
                        <h4 className={`text-xs font-bold mb-0.5 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{s.title}</h4>
                        <p className={`text-[10px] leading-tight ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{s.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT — Ecosystem: 2×2 square */}
            <div className="lg:col-span-7">
              <div className="mb-6">
                <span className="uppercase tracking-[0.3em] text-primary text-xs font-bold mb-2 block">Connected Ecosystem</span>
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  Part of a Massive Network
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    icon: Truck,
                    title: "Agent App",
                    desc: "Verified agents handle your pickups, weigh materials on-site with calibrated digital scales, and complete cryptographic handshakes to lock in your transaction.",
                    color: "text-blue-500",
                    bg: "bg-blue-500/10",
                    border: "border-blue-500/20"
                  },
                  {
                    icon: LayoutIcon,
                    title: "Hub App",
                    desc: "Local recycling hubs aggregate materials from multiple agents, grade and sort inventory, and prepare bulk industrial-grade shipments for off-takers.",
                    color: "text-purple-500",
                    bg: "bg-purple-500/10",
                    border: "border-purple-500/20"
                  },
                  {
                    icon: Globe,
                    title: "Fleet App",
                    desc: "Fleet operators manage vehicle dispatch, optimise collection routes, and track real-time capacity across their entire logistics network.",
                    color: "text-amber-500",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20"
                  },
                  {
                    icon: Activity,
                    title: "Admin Dashboard",
                    desc: "Platform administrators monitor system health, verify agents, manage compliance, and oversee the financial settlement layer in real time.",
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20"
                  },
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * i, duration: 0.5 }}
                    className={`p-4 sm:p-5 rounded-xl sm:rounded-2xl border ${isDarkMode ? `bg-surface-950 ${node.border}` : `bg-white ${node.border}`} shadow-sm transition-all group relative overflow-hidden`}
                  >
                    <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${node.bg} blur-3xl opacity-0 group-hover:opacity-60 transition-opacity`} />
                    <div className="relative z-10">
                      <div className={`w-8 h-8 sm:w-11 h-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${node.bg} ${node.color} group-hover:scale-110 transition-transform`}>
                        <node.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h4 className={`text-sm sm:text-base font-bold mb-1.5 sm:mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{node.title}</h4>
                      <p className={`text-[10px] sm:text-xs leading-relaxed line-clamp-4 sm:line-clamp-none ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{node.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FINAL CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-6">
            Ready to turn waste into wealth?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of residents and sellers leveraging the Klinflow platform today.
          </p>
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link  to="/contact" className="flex-1 sm:flex-none sm:w-auto px-6 py-4 sm:px-10 sm:py-5 bg-white text-primary font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap">
              Contact Sales <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
