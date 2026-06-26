import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
  Globe,
  Database,
  Network,
  Cpu,
  Layers,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Truck,
  Users,
  Wallet,
  Building2,
  Factory,
  UserCircle,
  Warehouse,
  Scale,
  AlertTriangle,
  Zap,
  TrendingDown,
  Clock,
  ShieldAlert
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

// ── DATA ──────────────────────────────────────────────────────────

const operationalCapabilities = [
  {
    number: "01",
    title: "Intake & Weighbridge Management",
    subtitle: "Digitize the entire drop-off workflow",
    description: "The core bottleneck for any recycling facility is the physical intake process. Klinflow Hub replaces manual weighing, paper manifests, and verbal negotiations with a fully digital workflow.",
    capabilities: [
      "Direct IoT integration with digital floor scales — weights are captured automatically, eliminating manual entry errors and fraud",
      "Multi-channel intake for Fleet Agents, Individual Agents, and Walk-in Sellers through specialized workflows with PIN and Klin-ID verification",
      "Instant digital weighbridge tickets and goods-received notes (GRNs) sent directly to the supplier's app",
      "Material grading interfaces for quality control staff to classify incoming loads by type, grade, and contamination level"
    ],
    icon: Scale,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    image: "/products/hub/intake-verification.webp",
  },
  {
    number: "02",
    title: "Queue & Facility Traffic Control",
    subtitle: "Eliminate gate congestion",
    description: "High-volume facilities process dozens of vehicles daily. Without digital coordination, trucks idle for hours, bays sit empty, and throughput collapses.",
    capabilities: [
      "Real-time queue visibility showing every inbound vehicle, their expected tonnage, arrival time, and current status",
      "Bay assignment system that routes vehicles to specific unloading bays based on material type and availability",
      "Live turnaround time tracking to identify and eliminate operational bottlenecks",
      "Maintenance scheduling for bays to prevent unexpected downtime"
    ],
    icon: Truck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    image: "/products/hub/queue-management.webp",
  },
  {
    number: "03",
    title: "Supplier Network & Agent CRM",
    subtitle: "Build a verified supply chain",
    description: "Hubs depend on a reliable network of collection agents and fleet operators. Klinflow Hub acts as a purpose-built supplier CRM for the recycling industry.",
    capabilities: [
      "KYC and supplier onboarding workflows capturing identification, vehicle details, and mobile money payment information",
      "Tiered pricing and contract management — set dynamic walk-in rates while maintaining fixed pricing for enterprise fleet contracts",
      "Supplier performance scoring based on delivery consistency, material quality, and contamination history",
      "Complete transaction history and relationship analytics per supplier"
    ],
    icon: Users,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    image: "/products/hub/supplier-page.webp",
  },
  {
    number: "04",
    title: "Automated Financial Operations",
    subtitle: "Eliminate cash from the facility floor",
    description: "Cash-heavy operations create security risks, reconciliation nightmares, and payment delays that damage supplier relationships. Klinflow digitizes the entire financial workflow.",
    capabilities: [
      "Automated M-PESA B2C payouts triggered instantly the moment a weighbridge ticket is verified and approved",
      "Centralized digital treasury with pre-loaded funds, real-time balance tracking, and payout history",
      "Dispute & Exceptions workspace for contaminated or disputed loads — managers can enforce 'split-difference' payouts digitally",
      "Exportable financial ledgers, cash-flow dashboards, and reconciliation reports"
    ],
    icon: Wallet,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    image: "/products/hub/dispute-page.webp",
  },
  {
    number: "05",
    title: "Dynamic Pricing Intelligence",
    subtitle: "Protect margins at scale",
    description: "Static price boards and ad-hoc negotiations make margins impossible to control. Klinflow Hub provides a centralized pricing engine that adapts to market conditions.",
    capabilities: [
      "Set and enforce base prices per material category, subcategory, and grade across the entire facility",
      "Tier-based pricing for different supplier types — walk-in agents, contracted fleets, and enterprise partners",
      "Real-time negotiation tools allowing authorized managers to adjust rates for specific loads within guardrails",
      "Historical pricing analytics and margin tracking across all material streams"
    ],
    icon: TrendingUp,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    image: "/products/hub/prices-page.webp",
  },
  {
    number: "06",
    title: "Inventory & Traceability",
    subtitle: "Track every gram from gate to sale",
    description: "Once materials enter your facility, they must be tracked through sorting, processing, batching, and outbound dispatch. Klinflow turns loose intake into structured, auditable inventory.",
    capabilities: [
      "Real-time stockpile dashboards showing current tonnage across all material categories and processing zones",
      "Multi-warehouse tracking — Sorting Area, Processing Line, Finished Goods, Outbound Staging",
      "Full end-to-end traceability from the original collection agent back to the household or source zone",
      "Automated B2B marketplace listings for processed, baled, or crushed materials ready for industrial buyers"
    ],
    icon: Boxes,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    image: "/products/hub/hub-home2.webp",
  },
];

const platformModules = [
  {
    title: "Intake Operations",
    desc: "Digitize material receiving, weighing, grading, and verification with direct IoT scale integration.",
    features: ["Digital Weighbridge", "Material Grading", "Instant GRNs", "Queue Control"],
    icon: Scale,
    colSpan: "md:col-span-2 lg:col-span-3",
    bg: "bg-blue-500/10",
    color: "text-blue-500"
  },
  {
    title: "Supplier Network",
    desc: "Manage suppliers, fleets, contracts, and compliance from a single workspace.",
    features: ["KYC Onboarding", "Contract Pricing", "Performance Scoring"],
    icon: Users,
    colSpan: "md:col-span-2 lg:col-span-2",
    bg: "bg-indigo-500/10",
    color: "text-indigo-500"
  },
  {
    title: "Inventory Intelligence",
    desc: "Track materials from raw intake through processing to finished goods.",
    features: ["Stockpile Tracking", "Multi-Zone Storage", "Yield Analytics"],
    icon: Boxes,
    colSpan: "md:col-span-2 lg:col-span-2",
    bg: "bg-emerald-500/10",
    color: "text-emerald-500"
  },
  {
    title: "Commercial & Financial",
    desc: "Manage pricing, B2B sales, automated agent payouts, and general ledger reconciliation.",
    features: ["M-PESA Payouts", "Dynamic Pricing", "B2B Marketplace", "Disputes"],
    icon: Wallet,
    colSpan: "md:col-span-2 lg:col-span-3",
    bg: "bg-amber-500/10",
    color: "text-amber-500"
  },
  {
    title: "Compliance & ESG",
    desc: "Full end-to-end traceability and automated carbon impact reporting for corporate buyers.",
    features: ["Origin Traceability", "CO2 Saved Metrics", "Export Docs"],
    icon: ShieldCheck,
    colSpan: "md:col-span-4 lg:col-span-5",
    bg: "bg-rose-500/10",
    color: "text-rose-500"
  }
];

const materialCategories = [
  { 
    id: 'plastics', name: "Plastics", icon: Layers, 
    subtypes: [
      { name: "PET Clear", desc: "Water bottles, clear containers" },
      { name: "HDPE", desc: "Milk jugs, shampoo bottles" },
      { name: "LDPE", desc: "Shrink wrap, grocery bags" }
    ]
  },
  { 
    id: 'metals', name: "Metals", icon: Cpu, 
    subtypes: [
      { name: "Aluminum", desc: "Cans, foil, window frames" },
      { name: "Copper", desc: "Wire, pipes, motors" },
      { name: "Steel & Iron", desc: "Appliances, structural steel" }
    ]
  },
  { 
    id: 'paper', name: "Paper & Board", icon: Database, 
    subtypes: [
      { name: "OCC (Cardboard)", desc: "Corrugated boxes" },
      { name: "Mixed Paper", desc: "Office paper, magazines" }
    ]
  },
  { 
    id: 'glass', name: "Glass", icon: Globe, 
    subtypes: [
      { name: "Clear Glass", desc: "Bottles, jars" },
      { name: "Colored Glass", desc: "Amber, green bottles" }
    ]
  },
  { 
    id: 'ewaste', name: "E-Waste", icon: Plug, 
    subtypes: [
      { name: "Circuit Boards", desc: "Motherboards, RAM" },
      { name: "Batteries", desc: "Lead-acid, Li-ion" }
    ]
  }
];

function Plug(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </svg>
  );
}

export default function ProductHub() {
  const { isDarkMode } = useThemeStore();
  const [activeMaterial, setActiveMaterial] = useState(materialCategories[0].id);

  return (
    <Layout>
      {/* ── 1. HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-32 overflow-hidden min-h-[80vh] flex items-center">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 ${isDarkMode ? "bg-[#0A0A0A]" : "bg-[#F8F9FA]"}`} />
          {/* Tech Grid Pattern */}
          <div className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "invert" : ""}`}
            style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
          {/* Glows */}
          <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-emerald-500/10 blur-[150px] rounded-full pointer-events-none" />
        </div>
        
        <div className="max-w-[90rem] mx-auto px-6 relative z-10 w-full mt-[-2rem] md:mt-[-4rem]">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left side: Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left"
            >
              <div className="inline-flex items-center justify-center lg:justify-start gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase tracking-[0.2em] mb-8 w-fit mx-auto lg:mx-0">
                <Warehouse className="w-3.5 h-3.5" /> Core Infrastructure
              </div>

              <h1 className={`text-5xl md:text-6xl xl:text-6xl font-bold tracking-tight mb-6 leading-[1.1] ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                The Operating System for <br className="hidden lg:block" />
                <span className="text-slate-500">Modern Recycling Hubs.</span>
              </h1>
              <p className={`text-lg md:text-xl font-medium max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Digitize intake, automate supplier payments, manage inventory, optimize material flows, and fulfill enterprise contracts from a single platform. Built for high-volume operations, Klinflow Hub eliminates paperwork and brings total financial and operational transparency to your facility.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/contact" className={`px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95 ${isDarkMode ? "bg-white text-black hover:bg-slate-200 shadow-white/10" : "bg-black text-white hover:bg-slate-800"}`}>
                  Book a Demo <ArrowRight className="w-4 h-4" />
                </Link>
                <button className={`px-8 py-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 active:scale-95 ${isDarkMode ? "border-white/20 text-white hover:bg-white/5" : "border-slate-300 text-slate-900 hover:bg-slate-50"}`}>
                  Explore the Platform
                </button>
              </div>
            </motion.div>

            {/* Right side: Image content */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 relative perspective-[2000px] z-20"
            >
              <div className="relative transform rotate-y-[-10deg] rotate-x-[5deg] scale-105 md:scale-110 lg:scale-[1.2] hover:rotate-y-0 hover:rotate-x-0 hover:scale-[1.25] transition-all duration-700 ease-out mt-12 lg:mt-0 lg:ml-12 origin-center lg:origin-left">
                {/* Image Glow */}
                <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-[2rem] pointer-events-none" />

                <div 
                  className={`relative rounded-2xl overflow-hidden border shadow-2xl ${isDarkMode ? "bg-surface-900 border-white/10 shadow-black/50" : "bg-white border-slate-200 shadow-slate-300/50"}`}
                >
                  <div className={`h-10 border-b flex items-center px-4 gap-2 ${isDarkMode ? "border-white/5 bg-surface-950" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400/50" />
                    </div>
                  </div>
                  <img
                    src="/products/hub/hub-home2.webp"
                    alt="Klinflow Hub Operating System"
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. SCALING OPERATIONS (Alternating Layout) ─────────────── */}
      <section className={`relative py-20 lg:py-32 overflow-hidden ${isDarkMode ? "bg-[#050505]" : "bg-slate-50"}`}>
        {/* Line Grid Background */}
        <div 
          className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "invert" : ""}`}
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />
        <div className="max-w-[90rem] mx-auto px-6 space-y-20 lg:space-y-28 relative z-10">
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-20">
            <h2 className={`text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-4 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>Scaling Operations</h2>
            <h3 className={`text-4xl md:text-5xl font-bold tracking-tighter mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Everything a modern recycling facility <br className="hidden md:block" /> needs to operate at scale.
            </h3>
            <p className={`text-lg md:text-xl font-medium leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              Most facilities run on paper manifests, cash payouts, and disconnected spreadsheets. Klinflow Hub replaces all of it with a single, integrated operating system purpose-built for high-volume material recovery.
            </p>
          </div>

          {operationalCapabilities.map((cap, index) => {
            const CapIcon = cap.icon;
            return (
              <div key={cap.number} className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
                
                {/* Text Content */}
                <div className={`lg:col-span-5 ${index % 2 === 1 ? 'lg:order-2' : 'lg:order-1'}`}>
                  <div className={`w-12 h-12 rounded-xl ${cap.bg} flex items-center justify-center mb-8 border ${cap.color.replace('text-', 'border-').replace('500', '500/20')}`}>
                    <CapIcon className={`w-5 h-5 ${cap.color}`} />
                  </div>
                  
                  <h4 className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] mb-3 ${cap.color}`}>
                    Module {cap.number} // {cap.title}
                  </h4>
                  
                  <h3 className={`text-3xl md:text-4xl font-bold tracking-tighter mb-6 leading-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {cap.subtitle}
                  </h3>
                  
                  <p className={`text-lg leading-relaxed mb-8 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                    {cap.description}
                  </p>

                  {/* Capability Bullets */}
                  <div className="space-y-4">
                    {cap.capabilities.map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-md shrink-0 mt-0.5 flex items-center justify-center ${cap.bg}`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${cap.color}`} />
                        </div>
                        <p className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image Content */}
                <div className={`lg:col-span-7 ${index % 2 === 1 ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="relative group">
                    <div className={`absolute -inset-4 md:-inset-8 rounded-[2rem] border transition-all duration-500 ${isDarkMode ? "bg-white/[0.02] border-white/5 group-hover:bg-white/[0.04]" : "bg-slate-200/50 border-slate-200 group-hover:bg-slate-200"}`} />
                    
                    <div className="relative rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0F172A] ring-1 ring-black/5">
                      <div className="flex items-center px-4 py-3 bg-[#1E293B] border-b border-white/5">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        </div>
                      </div>
                      <img
                        src={cap.image}
                        alt={cap.title}
                        loading="lazy"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </section>

      {/* ── 3. PLATFORM & IMPACT COMBINED ──────────────────────────────────────── */}
      <section className={`relative py-24 px-6 overflow-hidden ${isDarkMode ? "bg-[#050505]" : "bg-emerald-50/50"}`}>
        {/* Dotted Background */}
        <div 
          className={`absolute inset-0 ${isDarkMode ? "opacity-[0.2] text-emerald-900" : "opacity-[0.05] text-emerald-900"}`}
          style={{ backgroundImage: "radial-gradient(circle at center, currentColor 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
        />
        <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 relative z-10">
          
          {/* LEFT: Platform Bento Grid (8 columns) */}
          <div className="lg:col-span-8">
            <div className="mb-12">
              <h2 className={`text-3xl md:text-5xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                One Platform. <span className="text-slate-400">Every Operation.</span>
              </h2>
              <p className={`text-lg max-w-2xl ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                A completely unified suite of operational modules designed specifically for material recovery and processing facilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {platformModules.map((mod, i) => {
                const ModIcon = mod.icon;
                // Adjust colSpans for the 2-col layout - the last one takes full width
                const isFullWidth = i === 4; 
                return (
                  <div 
                    key={i} 
                    className={`${isFullWidth ? "md:col-span-2" : ""} p-8 rounded-3xl border relative overflow-hidden group transition-all duration-300 ${isDarkMode ? "bg-surface-900 border-white/10 hover:border-white/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-xl shadow-slate-200/20"}`}
                  >
                    <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${mod.bg}`} />
                    
                    <div className="relative z-10 h-full flex flex-col">
                      <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center ${mod.bg}`}>
                        <ModIcon className={`w-6 h-6 ${mod.color}`} />
                      </div>
                      
                      <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{mod.title}</h3>
                      <p className={`text-sm leading-relaxed mb-8 flex-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {mod.desc}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mt-auto">
                        {mod.features.map((feature, j) => (
                          <span key={j} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${isDarkMode ? "bg-surface-800 border-white/5 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Business Impact (4 columns) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className={`p-8 md:p-10 rounded-3xl h-full border ${isDarkMode ? "bg-surface-950 border-white/10" : "bg-white border-slate-200 shadow-2xl shadow-slate-200/40"}`}>
              <h2 className={`text-sm font-bold uppercase tracking-widest mb-2 ${isDarkMode ? "text-emerald-500" : "text-emerald-600"}`}>
                Business Impact
              </h2>
              <h3 className={`text-3xl font-bold tracking-tight mb-10 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                The Economics of <br className="hidden lg:block"/> Better Operations.
              </h3>
              
              <div className="flex flex-col gap-2">
                {[
                  { value: "70%", label: "Faster Intake", desc: "Automated weighing & digital grading.", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { value: "90%", label: "Less Delays", desc: "Zero manual data entry at the gate.", icon: TrendingDown, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { value: "100%", label: "Traceability", desc: "Full audit trail from supplier to buyer.", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                  { value: "< 2m", label: "Payout Time", desc: "Instant mobile money disbursement.", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
                  { value: "Zero", label: "Cash on Site", desc: "Eliminate theft and reconciliation errors.", icon: ShieldAlert, color: "text-rose-500", bg: "bg-rose-500/10" },
                  { value: "Live", label: "Inventory", desc: "Real-time stockpile and material yields.", icon: Boxes, color: "text-violet-500", bg: "bg-violet-500/10" },
                ].map((metric, i) => (
                  <div key={i} className={`flex items-start gap-5 p-4 md:p-5 rounded-2xl border transition-colors ${isDarkMode ? "bg-surface-900/80 border-white/5 hover:border-white/10" : "bg-white/80 border-slate-100 hover:border-slate-200 backdrop-blur-sm"}`}>
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl shrink-0 flex items-center justify-center mt-1 ${metric.bg}`}>
                      <metric.icon className={`w-5 h-5 md:w-6 md:h-6 ${metric.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl md:text-2xl font-black tracking-tighter leading-none mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                        {metric.value}
                      </p>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                        {metric.label}
                      </p>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        {metric.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── 5. BUILT FOR EVERY MATERIAL (Interactive Tree) ───────────────────────────────── */}
      <section className={`relative py-18 md:py-24 px-6 overflow-hidden ${isDarkMode ? "bg-[#0A0A0A]" : "bg-[#F8F9FA]"}`}>
        {/* Line Grid Background */}
        <div 
          className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "invert" : ""}`}
          style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <h2 className={`text-3xl md:text-5xl font-bold tracking-tight mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Built for Every Material Stream.
          </h2>
          <p className={`text-lg max-w-2xl mx-auto mb-16 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
            Configure custom grades, pricing, and processing workflows for any type of recyclable material your facility handles.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-16 relative z-10">
            {materialCategories.map((cat) => {
              const isActive = activeMaterial === cat.id;
              const CatIcon = cat.icon;
              return (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveMaterial(cat.id)}
                  className={`flex items-center gap-2 md:gap-3 px-5 py-3 rounded-xl border transition-all duration-300 font-bold ${
                    isActive 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                      : (isDarkMode ? "bg-surface-900 border-white/10 text-slate-400 hover:text-white hover:bg-surface-800" : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50")
                  }`}
                >
                  <CatIcon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? "text-white" : ""}`} />
                  <span className="text-sm md:text-base">{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Animated Connecting Line */}
          <div className="relative h-16 w-full max-w-2xl mx-auto mb-8 hidden md:block">
             <motion.div 
               initial={{ height: 0 }}
               animate={{ height: "100%" }}
               className={`absolute top-0 left-1/2 w-0.5 -translate-x-1/2 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} 
             />
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: "100%" }}
               transition={{ delay: 0.2 }}
               className={`absolute bottom-0 left-0 h-0.5 ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} 
             />
          </div>

          <div className="max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeMaterial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {materialCategories.find(c => c.id === activeMaterial)?.subtypes.map((subtype, i) => (
                  <div key={i} className={`p-6 rounded-2xl border text-left relative ${isDarkMode ? "bg-surface-900 border-white/10" : "bg-white border-slate-200 shadow-xl shadow-slate-200/30"}`}>
                    {/* Tiny connector line from top */}
                    <div className={`absolute -top-6 left-1/2 w-0.5 h-6 -translate-x-1/2 hidden md:block ${isDarkMode ? "bg-white/10" : "bg-slate-200"}`} />
                    <div className={`w-2 h-2 rounded-full absolute -top-[3px] left-1/2 -translate-x-1/2 hidden md:block ${isDarkMode ? "bg-white/20" : "bg-slate-300"}`} />

                    <h4 className={`text-lg font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{subtype.name}</h4>
                    <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>{subtype.desc}</p>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── 6. ECOSYSTEM VISUALIZATION (Dynamic Hub-and-Spoke) ───────────────────────────────── */}
      <section className="relative py-24 md:py-24 px-6 overflow-hidden bg-[#064E3B] border-t border-emerald-800">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-full opacity-40 blur-[120px] bg-emerald-400 rounded-full mix-blend-overlay" />
        </div>
        
        <div className="max-w-[1200px] mx-auto text-center relative z-10 mb-8 md:mb-2">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white">
            Connected Across the Ecosystem.
          </h2>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-emerald-100/80">
            The intelligence layer connecting upstream collection with downstream demand. Klinflow orchestrates data, materials, and money across the entire supply chain.
          </p>
        </div>

        {/* The Hub-and-Spoke Network Map (Desktop) */}
        <div className="relative w-full max-w-[1200px] mx-auto h-[500px] hidden md:block">
          
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="none">
            {/* Background Paths */}
            <path d="M 150 150 C 300 150, 350 300, 500 300" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="3" strokeDasharray="6 6" />
            <path d="M 150 300 L 500 300" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="3" strokeDasharray="6 6" />
            <path d="M 150 450 C 300 450, 350 300, 500 300" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="3" strokeDasharray="6 6" />
            
            <path d="M 500 300 C 650 300, 700 200, 850 200" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="3" strokeDasharray="6 6" />
            <path d="M 500 300 C 650 300, 700 400, 850 400" fill="none" stroke="rgba(52, 211, 153, 0.2)" strokeWidth="3" strokeDasharray="6 6" />

            {/* Animated Particles flowing In */}
            <circle r="4" fill="#6ee7b7" filter="drop-shadow(0 0 4px #6ee7b7)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 150 150 C 300 150, 350 300, 500 300" />
            </circle>
            <circle r="4" fill="#6ee7b7" filter="drop-shadow(0 0 4px #6ee7b7)">
              <animateMotion dur="2.5s" repeatCount="indefinite" path="M 150 300 L 500 300" />
            </circle>
            <circle r="4" fill="#6ee7b7" filter="drop-shadow(0 0 4px #6ee7b7)">
              <animateMotion dur="3.5s" repeatCount="indefinite" path="M 150 450 C 300 450, 350 300, 500 300" />
            </circle>

            {/* Animated Particles flowing Out */}
            <circle r="4" fill="#10b981" filter="drop-shadow(0 0 6px #10b981)">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 500 300 C 650 300, 700 200, 850 200" />
            </circle>
            <circle r="4" fill="#10b981" filter="drop-shadow(0 0 6px #10b981)">
              <animateMotion dur="2.8s" repeatCount="indefinite" path="M 500 300 C 650 300, 700 400, 850 400" />
            </circle>
          </svg>

          {/* Floating Data Labels */}
          <div className="absolute left-[32.5%] top-[37.5%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-900/80 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">Material Intake</div>
          <div className="absolute left-[32.5%] top-[50%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-900/80 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">Agent Payouts</div>
          <div className="absolute left-[32.5%] top-[62.5%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-900/80 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">Fleet Logistics</div>

          <div className="absolute left-[67.5%] top-[41.6%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-900/80 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">Market Intelligence</div>
          <div className="absolute left-[67.5%] top-[58.3%] -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-emerald-900/80 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300 uppercase tracking-wider backdrop-blur-md">Contract Fulfillment</div>

          {/* Supply (Upstream) Nodes */}
          <div className="absolute left-[15%] top-[25%] -translate-x-1/2 -translate-y-1/2 w-48 bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl z-20 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center mb-2"><Users className="w-5 h-5 text-emerald-400" /></div>
            <h4 className="font-bold text-white text-sm mb-1">Sellers</h4>
            <p className="text-[10px] text-emerald-200/70">Households & Businesses</p>
          </div>

          <div className="absolute left-[15%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-48 bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl z-20 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center mb-2"><UserCircle className="w-5 h-5 text-blue-400" /></div>
            <h4 className="font-bold text-white text-sm mb-1">Agents</h4>
            <p className="text-[10px] text-emerald-200/70">Independent Collectors</p>
          </div>

          <div className="absolute left-[15%] top-[75%] -translate-x-1/2 -translate-y-1/2 w-48 bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl z-20 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center mb-2"><Truck className="w-5 h-5 text-emerald-400" /></div>
            <h4 className="font-bold text-white text-sm mb-1">Fleets</h4>
            <p className="text-[10px] text-emerald-200/70">Company Vehicles</p>
          </div>

          {/* Core Processing Hub */}
          <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.5)] border-8 border-emerald-200 z-30">
            <div className="absolute inset-0 rounded-full border border-emerald-400 animate-ping opacity-30" />
            <Warehouse className="w-12 h-12 text-emerald-900 mb-2" />
            <h4 className="font-black text-emerald-900 dark:text-white text-xl tracking-tight">Klinflow MOS</h4>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-200 font-bold tracking-widest uppercase mt-1">Intelligence Layer</p>
          </div>

          {/* Demand (Downstream) Nodes */}
          <div className="absolute left-[85%] top-[33.3%] -translate-x-1/2 -translate-y-1/2 w-48 bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl z-20 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center mb-2"><Globe className="w-5 h-5 text-indigo-400" /></div>
            <h4 className="font-bold text-white text-sm mb-1">The Market</h4>
            <p className="text-[10px] text-emerald-200/70">Global Price Signals</p>
          </div>

          <div className="absolute left-[85%] top-[66.6%] -translate-x-1/2 -translate-y-1/2 w-48 bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex flex-col items-center text-center shadow-2xl z-20 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-emerald-900 rounded-full flex items-center justify-center mb-2"><Factory className="w-5 h-5 text-amber-400" /></div>
            <h4 className="font-bold text-white text-sm mb-1">Industrial Buyers</h4>
            <p className="text-[10px] text-emerald-200/70">Factories & Exporters</p>
          </div>

        </div>

        {/* Mobile Fallback (Vertical List) */}
        <div className="md:hidden flex flex-col gap-6 relative z-10 mt-12">
          <div className="flex flex-col items-center gap-4">
             <div className="w-full bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 bg-emerald-900 rounded-full flex items-center justify-center shrink-0"><Users className="w-6 h-6 text-emerald-400" /></div>
                <div className="text-left">
                  <h4 className="font-bold text-white text-lg">Supply Network</h4>
                  <p className="text-sm text-emerald-200/70">Sellers, Agents, and Fleets</p>
                </div>
             </div>
             
             <div className="h-10 w-0.5 bg-emerald-500/50" />

             <div className="w-full bg-white border-4 border-emerald-200 rounded-3xl p-4 flex items-center gap-4 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0"><Warehouse className="w-6 h-6 text-emerald-900" /></div>
                <div className="text-left">
                  <h4 className="font-black text-emerald-900 text-xl">Klinflow Hub</h4>
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Intelligence Layer</p>
                </div>
             </div>

             <div className="h-10 w-0.5 bg-emerald-500/50" />

             <div className="w-full bg-[#043d2e] border border-emerald-700/50 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                <div className="w-12 h-12 bg-emerald-900 rounded-full flex items-center justify-center shrink-0"><Factory className="w-6 h-6 text-amber-400" /></div>
                <div className="text-left">
                  <h4 className="font-bold text-white text-lg">Demand Network</h4>
                  <p className="text-sm text-emerald-200/70">Markets and Industrial Buyers</p>
                </div>
             </div>
          </div>
        </div>
      </section>

     

      {/* ── 8. FINAL CTA ─────────────────────────────────────────────── */}
      <section className={`py-24 px-6 text-center ${isDarkMode ? "bg-[#0A0A0A]" : "bg-slate-900"}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-[1.1] ${isDarkMode ? "text-white" : "text-slate-50"}`}>
            Build the Digital Backbone of Your Recycling Operation.
          </h2>
          <p className={`text-lg md:text-xl font-medium mb-12 max-w-2xl mx-auto ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Join the next generation of recycling businesses using Klinflow to manage material intake, supplier networks, inventory, payments, and buyer fulfillment from a single platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/contact" className={`px-10 py-5 rounded-full font-bold transition-all flex items-center justify-center gap-2 ${isDarkMode ? "bg-white text-black hover:bg-slate-200" : "bg-black text-white hover:bg-slate-800"}`}>
              Book a Demo <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
