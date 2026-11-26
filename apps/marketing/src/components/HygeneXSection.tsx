import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  Brain, Target, Zap, Settings, Shield,
  Users, Truck, ShoppingCart, Building2, LineChart, DollarSign,
  Database, CheckCircle, TrendingUp, ShieldCheck, Activity,
  Signal, Wifi, Battery, Map
} from "lucide-react";

// Reusable components

const colorThemes: Record<string, any> = {
  cyan: {
    card: { light: "bg-cyan-500", dark: "bg-cyan-500" },
    iconBg: { light: "bg-cyan-100", dark: "bg-cyan-900/30" },
    icon: { light: "text-cyan-600", dark: "text-cyan-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-cyan-500", dark: "bg-cyan-400" },
    feat: { light: "text-white", dark: "text-cyan-100/70" }
  },
  emerald: {
    card: { light: "bg-emerald-500", dark: "bg-emerald-500" },
    iconBg: { light: "bg-emerald-100", dark: "bg-emerald-900/30" },
    icon: { light: "text-emerald-600", dark: "text-emerald-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-emerald-500", dark: "bg-emerald-400" },
    feat: { light: "text-white", dark: "text-emerald-100/70" }
  },
  amber: {
    card: { light: "bg-amber-500", dark: "bg-amber-500" },
    iconBg: { light: "bg-amber-100", dark: "bg-amber-900/30" },
    icon: { light: "text-amber-600", dark: "text-amber-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-amber-500", dark: "bg-amber-400" },
    feat: { light: "text-white", dark: "text-amber-100/70" }
  },
  blue: {
    card: { light: "bg-blue-500", dark: "bg-blue-500" },
    iconBg: { light: "bg-blue-100", dark: "bg-blue-900/30" },
    icon: { light: "text-blue-600", dark: "text-blue-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-blue-500", dark: "bg-blue-400" },
    feat: { light: "text-white", dark: "text-blue-100/70" }
  },
  purple: {
    card: { light: "bg-purple-500", dark: "bg-purple-500" },
    iconBg: { light: "bg-purple-100", dark: "bg-purple-900/30" },
    icon: { light: "text-purple-600", dark: "text-purple-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-purple-500", dark: "bg-purple-400" },
    feat: { light: "text-white", dark: "text-purple-100/70" }
  },
  lime: {
    card: { light: "bg-lime-500", dark: "bg-lime-500" },
    iconBg: { light: "bg-lime-100", dark: "bg-lime-900/30" },
    icon: { light: "text-lime-600", dark: "text-lime-400" },
    text: { light: "text-white", dark: "text-white" },
    dot: { light: "bg-lime-500", dark: "bg-lime-400" },
    feat: { light: "text-white", dark: "text-lime-100/70" }
  }
};

const FeatureList = ({ features, theme, isDarkMode }: { features: string[], theme: any, isDarkMode: boolean }) => (
  <ul className="mt-4 space-y-2">
    {features.map((feat, i) => (
      <li key={i} className="flex items-start gap-2">
        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${isDarkMode ? theme.dot.dark : theme.dot.light}`} />
        <span className={`text-xs font-medium ${isDarkMode ? theme.feat.dark : theme.feat.light}`}>
          {feat}
        </span>
      </li>
    ))}
  </ul>
);

const EnterpriseCard = ({ title, icon: Icon, features, delay, colorKey, isDarkMode }: any) => {
  const theme = colorThemes[colorKey] || colorThemes.emerald;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative p-4 lg:p-5 rounded-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 z-10 
        ${isDarkMode ? theme.card.dark : theme.card.light}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDarkMode ? theme.iconBg.dark : theme.iconBg.light}`}>
          <Icon className={`w-5 h-5 ${isDarkMode ? theme.icon.dark : theme.icon.light}`} />
        </div>
        <h3 className={`text-lg font-bold ${isDarkMode ? theme.text.dark : theme.text.light}`}>{title}</h3>
      </div>
      <FeatureList features={features} theme={theme} isDarkMode={isDarkMode} />
    </motion.div>
  );
};

const SVGConnectors = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const pathColor = isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.1)";
  const dotColor = isDarkMode ? "rgba(52, 211, 153, 1)" : "rgba(5, 150, 105, 1)";
  
  return (
    <div className="absolute inset-0 pointer-events-none hidden lg:block z-0">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGradL" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={pathColor} />
          </linearGradient>
          <linearGradient id="lineGradR" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={pathColor} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Left lines connecting to center */}
        <path id="pathL1" d="M 28 18 C 35 18, 40 40, 45 45" fill="none" stroke="url(#lineGradL)" strokeWidth="0.5" />
        <path id="pathL2" d="M 28 45 C 35 45, 40 45, 45 45" fill="none" stroke="url(#lineGradL)" strokeWidth="0.5" />
        <path id="pathL3" d="M 28 72 C 35 72, 40 50, 45 45" fill="none" stroke="url(#lineGradL)" strokeWidth="0.5" />

        {/* Right lines connecting to center */}
        <path id="pathR1" d="M 72 18 C 65 18, 60 40, 55 45" fill="none" stroke="url(#lineGradR)" strokeWidth="0.5" />
        <path id="pathR2" d="M 72 45 C 65 45, 60 45, 55 45" fill="none" stroke="url(#lineGradR)" strokeWidth="0.5" />
        <path id="pathR3" d="M 72 72 C 65 72, 60 50, 55 45" fill="none" stroke="url(#lineGradR)" strokeWidth="0.5" />

        {/* Animated Dots flowing left to center */}
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="4s" repeatCount="indefinite" path="M 28 18 C 35 18, 40 40, 45 45" />
        </circle>
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="5s" repeatCount="indefinite" path="M 28 45 C 35 45, 40 45, 45 45" />
        </circle>
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="4.5s" repeatCount="indefinite" path="M 28 72 C 35 72, 40 50, 45 45" />
        </circle>

        {/* Animated Dots flowing right to center */}
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="4.2s" repeatCount="indefinite" path="M 72 18 C 65 18, 60 40, 55 45" />
        </circle>
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="4.8s" repeatCount="indefinite" path="M 72 45 C 65 45, 60 45, 55 45" />
        </circle>
        <circle r="0.5" fill={dotColor} filter="url(#glow)">
          <animateMotion dur="5.2s" repeatCount="indefinite" path="M 72 72 C 65 72, 60 50, 55 45" />
        </circle>
      </svg>
    </div>
  );
};

export default function HygeneXSection() {
  const isDarkMode = false;
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const phoneY = useTransform(scrollYProgress, [0, 1], [60, -60]);

  return (
    <section 
      ref={sectionRef}
      className={`relative w-full py-12 lg:py-16 overflow-hidden transition-colors duration-500 border-y ${
        isDarkMode 
          ? "bg-surface-950 border-white/5" 
          : "bg-gradient-to-br from-emerald-700 via-emerald-800 to-primary border-slate-200"
      }`}
    >
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
        <div 
          className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "text-white" : "text-white"}`}
          style={{
            backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter mb-4 ${isDarkMode ? "text-white" : "text-white"}`}
          >
            Know the <span className="text-lime-500">Mind</span> Behind the <span className="text-lime-500">Scenes</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className={`text-sm md:text-base font-medium leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-100"}`}
          >
HygeneX is our proprietary AI engine that powers the entire ecosystem. It identifies 50+ material types, grades quality instantly, and provides a real-time "Oracle" price for every gram you collect.          </motion.p>
        </div>

        {/* 3-COLUMN LAYOUT */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 items-center justify-between min-h-[500px]">
          
          <SVGConnectors isDarkMode={isDarkMode} />

          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-6 lg:pr-8 w-full max-w-md mx-auto lg:max-w-none relative z-10 order-2 lg:order-1">
            <EnterpriseCard 
              title="Residents"
              icon={Users}
              colorKey="cyan"
              isDarkMode={isDarkMode}
              delay={0.1}
              features={["Smart pickup scheduling", "GFP rewards & insights", "Recycling education", "Impact tracking"]}
            />
            <EnterpriseCard 
              title="Agents & Fleet"
              icon={Truck}
              colorKey="emerald"
              isDarkMode={isDarkMode}
              delay={0.2}
              features={["Route optimization", "Capacity prediction", "Fuel optimization", "Driver performance insights"]}
            />
            <EnterpriseCard 
              title="Marketplace"
              icon={ShoppingCart}
              colorKey="amber"
              isDarkMode={isDarkMode}
              delay={0.3}
              features={["Buyer matching", "Material scoring", "Dynamic pricing", "Demand prediction"]}
            />
          </div>

          {/* CENTER COLUMN (HERO ENGINE) */}
          <div className="flex flex-col items-center justify-center relative z-20 w-full py-8 lg:py-0 order-1 lg:order-2">
            
            {/* Animated Gyroscope Orbits (Opening & Closing Illusion) */}
            <div className="absolute w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] flex items-center justify-center pointer-events-none z-0" style={{ perspective: "800px" }}>
               {[
                 { size: "w-[220px] h-[220px] sm:w-[260px] sm:h-[260px]", color: "border-cyan-500/40", dot: "bg-cyan-400", dur: 6 },
                 { size: "w-[245px] h-[245px] sm:w-[290px] sm:h-[290px]", color: "border-emerald-500/40", dot: "bg-emerald-400", dur: 8 },
                 { size: "w-[270px] h-[270px] sm:w-[320px] sm:h-[320px]", color: "border-amber-500/40", dot: "bg-amber-400", dur: 10 },
                 { size: "w-[295px] h-[295px] sm:w-[350px] sm:h-[350px]", color: "border-blue-500/40", dot: "bg-blue-400", dur: 12 },
                 { size: "w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]", color: "border-purple-500/40", dot: "bg-purple-400", dur: 14 },
                 { size: "w-[345px] h-[345px] sm:w-[410px] sm:h-[410px]", color: "border-lime-500/40", dot: "bg-lime-400", dur: 16 }
               ].map((ring, i) => (
                 <motion.div 
                    key={i}
                    animate={{ 
                      rotateX: [75, -75, 75], 
                      rotateZ: [0, 360]
                    }}
                    transition={{ 
                      rotateX: { duration: ring.dur / 2, repeat: Infinity, ease: "easeInOut" },
                      rotateZ: { duration: ring.dur, repeat: Infinity, ease: "linear" }
                    }}
                    className={`absolute ${ring.size} rounded-full border ${ring.color}`}
                    style={{ transformStyle: "preserve-3d" }}
                 >
                    {/* The Orbiting Dot */}
                    <div 
                      className={`absolute w-3 h-3 rounded-full ${ring.dot}`}
                      style={{ 
                        top: "-2px", 
                        left: "50%", 
                        marginLeft: "-6px",
                        boxShadow: "0 0 15px currentColor" 
                      }}
                    />
                 </motion.div>
               ))}
            </div>

            {/* Central Glass Engine */}
            <div className={`relative w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] rounded-full flex flex-col items-center justify-center backdrop-blur-2xl border shadow-xl z-10
              ${isDarkMode 
                ? "bg-surface-900/90 border-white/10" 
                : "bg-white/90 border-slate-200"}`}
            >
              <div className="relative z-10 flex flex-col items-center">
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  HygeneX <span className="text-emerald-500">AI</span>
                </h3>
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Intelligence Engine
                </span>
              </div>
            </div>

            {/* Capability Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-12 max-w-[280px] relative z-20">
              {[
                { icon: Brain, label: "Predict" },
                { icon: Zap, label: "Optimize" },
                { icon: Settings, label: "Automate" },
                { icon: Target, label: "Recommend" },
                { icon: Shield, label: "Protect" }
              ].map((chip, i) => (
                <div 
                  key={i}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors
                    ${isDarkMode 
                      ? "bg-surface-900/50 border-white/10 text-slate-300 hover:text-white hover:border-emerald-500/50" 
                      : "bg-white/80 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300"}`}
                >
                  <chip.icon className={`w-3.5 h-3.5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
                  <span className="text-[10px] font-bold">{chip.label}</span>
                </div>
              ))}
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6 lg:pl-8 w-full max-w-md mx-auto lg:max-w-none relative z-10 order-3 lg:order-3">
             <EnterpriseCard 
              title="Hub Operations"
              icon={Building2}
              colorKey="blue"
              isDarkMode={isDarkMode}
              delay={0.4}
              features={["Material verification", "Inventory forecasting", "Intake intelligence", "Anomaly detection"]}
            />
            <EnterpriseCard 
              title="Sales & Market"
              icon={LineChart}
              colorKey="purple"
              isDarkMode={isDarkMode}
              delay={0.5}
              features={["Demand forecasting", "Price trends", "Buyer recommendations", "Revenue optimization"]}
            />
            <EnterpriseCard 
              title="Finance"
              icon={DollarSign}
              colorKey="lime"
              isDarkMode={isDarkMode}
              delay={0.6}
              features={["Revenue forecasting", "Fraud detection", "Cost optimization", "Automated payouts"]}
            />
          </div>
        </div>

       

        {/* BOTTOM METRICS */}
        <div className="mt-12 lg:mt-16 border-t pt-10 relative z-20 border-slate-200 dark:border-white/10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Prediction Accuracy", value: "+23%", icon: Target },
              { label: "Route Savings", value: "18%", icon: Map },
              { label: "Fraud Reduction", value: "30%", icon: ShieldCheck },
              { label: "Demand Forecast", value: "92%", icon: TrendingUp },
              { label: "Agent Productivity", value: "45%", icon: Users }
            ].map((metric, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`flex flex-col items-center justify-center p-4 text-center rounded-2xl border
                  ${isDarkMode 
                    ? "bg-surface-950 border-white/5" 
                    : "bg-white border-slate-200"}`}
              >
                <metric.icon className={`w-4 h-4 mb-3 ${isDarkMode ? "text-emerald-500/60" : "text-emerald-500/60"}`} />
                <span className={`text-2xl font-black mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>{metric.value}</span>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{metric.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING SMARTPHONE MOCKUP (DESKTOP ONLY) */}
      <motion.div 
        style={{ y: phoneY }}
        className="hidden xl:block absolute bottom-60 right-28 w-[260px] z-30 pointer-events-none"
      >
        <div className={`relative w-full rounded-[36px] p-3 border-[6px] shadow-2xl backdrop-blur-sm
          ${isDarkMode 
            ? "bg-surface-900/90 border-surface-950 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
            : "bg-white/90 border-slate-400 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"}`}
        >
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-2xl z-50" />
          
          <div className={`w-full h-full rounded-[24px] overflow-hidden p-4 ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}>
            
            {/* Mock Header */}
            <div className="flex justify-between items-center mb-6 mt-1">
              <span className={`text-[8px] font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>9:41</span>
              <div className="flex gap-1 items-center">
                <Signal className={`w-3 h-3 ${isDarkMode ? "text-white" : "text-slate-900"}`} />
                <Wifi className={`w-3 h-3 ${isDarkMode ? "text-white" : "text-slate-900"}`} />
                <Battery className={`w-3.5 h-3.5 ${isDarkMode ? "text-white" : "text-slate-900"}`} />
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-6">
              <img src="/landing-page/app-logo.webp" className="w-5 h-5" alt="K" />
              <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>HygeneX Insights</span>
            </div>

            {/* Mock Content */}
            <div className={`p-3 rounded-xl mb-3 border ${isDarkMode ? "bg-surface-900 border-white/5" : "bg-white border-slate-200"}`}>
              <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Today's Market Insight</span>
              <span className={`text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"} block mb-1`}>PET Plastic (Clean)</span>
              <span className={`text-xl font-black ${isDarkMode ? "text-white" : "text-slate-900"} block mb-1.5`}>KES 45 / kg</span>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold">
                <TrendingUp className="w-2.5 h-2.5" />
                +12.5% vs yesterday
              </div>
            </div>

            <h5 className={`text-[10px] font-bold mb-2 ${isDarkMode ? "text-white" : "text-slate-900"}`}>Top Opportunities</h5>
            <div className="space-y-2">
              {[
                { name: "Plastics Buyer", dist: "2.1 km away", match: "High Match" },
                { name: "Paper Mill", dist: "3.7 km away", match: "High Match" },
                { name: "Metal Processor", dist: "11 km away", match: "Medium Match" }
              ].map((opp, i) => (
                <div key={i} className={`p-2.5 rounded-lg border flex items-center justify-between ${isDarkMode ? "bg-surface-900 border-white/5" : "bg-white border-slate-200"}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Target className="w-3 h-3 text-emerald-500" />
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold block ${isDarkMode ? "text-white" : "text-slate-900"}`}>{opp.name}</span>
                      <span className="text-[8px] text-slate-500">{opp.dist}</span>
                    </div>
                  </div>
                  <span className={`text-[8px] font-bold ${opp.match === 'High Match' ? 'text-emerald-500' : 'text-amber-500'}`}>{opp.match}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </motion.div>

    </section>
  );
}
