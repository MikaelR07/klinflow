import { motion } from "framer-motion";
import {
  Truck,
  Navigation,
  Zap,
  Briefcase,
  ShieldCheck,
  Brain,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Activity,
  MapPin,
} from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

export default function ProductAgent() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      {/* ── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-24 md:pt-32 pb-16 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}
          />
          <div
            className={`absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full`}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 text-blue-500 font-bold uppercase tracking-widest text-xs mb-6">
                <Truck className="w-4 h-4" /> Platform Two: Agent Mission
                Control
              </div>
              <h1
                className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-8 ${isDarkMode ? "text-white" : "text-slate-900"}`}
              >
                Scale Your Earnings <br className="hidden sm:block" />
                As A{" "}
                <span className="text-blue-500 italic">Collection Pro.</span>
              </h1>
              <p
                className={`text-base md:text-xl font-medium leading-relaxed mb-10 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
              >
                Klinflow provides independent agents and fleet drivers with the
                tactical tools to find, verify, and monetize circular assets
                with surgical precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
                  Apply to Join Fleet
                </button>
                <button
                  className={`px-8 py-4 border rounded-2xl font-bold transition-all ${isDarkMode ? "border-white/10 text-white hover:bg-white/5" : "border-slate-200 text-slate-900 hover:bg-slate-50"}`}
                >
                  Agent Earning Calculator
                </button>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden border border-white/5 shadow-2xl relative w-full max-h-[520px] object-contain mx-auto bg-surface-900">
                <img
                  src="/grid/agent-home.webp"
                  alt="Agent Terminal: Mission Control"
                  loading="lazy"
                  className="w-full h-620px object-contain mx-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating UI Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute -top-14 -right-28 p-6 rounded-2xl bg-white dark:bg-surface-800 shadow-2xl border border-slate-100 dark:border-white/5 max-w-[260px] hidden sm:block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Next Mission
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      Kilimani Sector
                    </p>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full w-[70%] bg-blue-600" />
                </div>
                <p className="text-xs text-slate-400 font-medium mt-2">
                  700m to high-yield collection point.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AGENT TACTICAL FEATURES ─────────────────────────────────────────── */}
      <section
        className={`py-16 md:py-32 px-6 ${isDarkMode ? "bg-surface-950" : "bg-white"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: "Route Optimizer",
                desc: "AI-driven multi-stop route planning ensures maximum collections with minimum fuel cost and carbon footprint.",
                icon: Navigation,
                color: "blue",
              },
              {
                title: "Instant Escrow Settlement",
                desc: "Collect and verify materials on-site. Your commission is triggered the moment the Hub accepts your intake.",
                icon: Zap,
                color: "amber",
              },
              {
                title: "HygeneX AI Coach",
                desc: "Real-time earning optimization tips based on material hotspots, market prices, and fleet availability.",
                icon: Brain,
                color: "indigo",
              },
            ].map((f) => (
              <div key={f.title} className="group">
                <div
                  className={`w-14 h-14 rounded-2xl bg-${f.color}-500/10 text-${f.color}-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="w-7 h-7" />
                </div>
                <h3
                  className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}
                >
                  {f.title}
                </h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE MONITORING ─────────────────────────────────────────── */}
      <section
        className={`py-16 md:py-32 px-6 ${isDarkMode ? "bg-surface-950" : "bg-slate-50"}`}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
          <div className="order-2 lg:order-1">
            <div className="p-12 rounded-2xl bg-surface-950 border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
                <TrendingUp className="w-64 h-64 text-blue-500" />
              </div>
              <div className="relative z-10 space-y-12">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">
                      Efficiency Rating
                    </p>
                    <p className="text-4xl font-bold text-white">98.4%</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                      Avg. Payout Time
                    </p>
                    <p className="text-4xl font-bold text-white">Instant</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Today's Fleet Activity
                  </p>
                  <div className="flex gap-2">
                    {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 h-12 bg-white/5 rounded-lg overflow-hidden flex flex-col justify-end"
                      >
                        <motion.div
                          initial={{ height: 0 }}
                          whileInView={{ height: `${h}%` }}
                          className="w-full bg-blue-600/50"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-500 mb-6">
              Tactical Excellence
            </h2>
            <h3
              className={`text-3xl md:text-4xl font-bold tracking-tighter mb-8 ${isDarkMode ? "text-white" : "text-slate-900"}`}
            >
              The HUD for High-Yield Logistics.
            </h3>
            <p
              className={`text-lg font-medium leading-relaxed mb-12 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}
            >
              Agents are the backbone of the circular economy. We equip you with
              high-precision tracking, AI verification, and financial tools to
              turn your logistics work into a professional, profitable career.
            </p>
            <ul className="space-y-6">
              {[
                "GPS Mission Dispatch System",
                "Built-in HygeneX Grading Engine",
                "Automated Fuel & Cost Tracking",
                "Instant Reward Points Redemption",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 text-sm font-bold text-slate-500"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── RECRUITMENT CTA ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-32 px-6">
        <div
          className={`max-w-7xl mx-auto p-8 md:p-20 rounded-2xl relative overflow-hidden text-center bg-blue-600`}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "30px 30px",
            }}
          />
          <div className="max-w-2xl mx-auto relative z-10 text-white">
            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tighter mb-8">
              Ready to Join the Fleet?
            </h2>
            <p className="text-lg font-medium mb-10 opacity-80 leading-relaxed">
              Whether you are an individual collector or a company owner,
              Klinflow gives you the platform to scale your collection
              operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-10 py-5 bg-white text-blue-600 font-bold rounded-2xl shadow-2xl active:scale-95 transition-all">
                Apply as an Agent
              </button>
              <button className="w-full sm:w-auto px-10 py-5 border border-white/20 bg-blue-700/30 text-white rounded-2xl font-bold transition-all hover:bg-blue-700/50">
                Contact Fleet Sales
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
