import { Link } from 'react-router-dom';
import {
  Recycle,
  Heart,
  Sparkles,
  ArrowRight,
  Truck,
  Warehouse,
  Users,
  Scale,
  Quote,
} from 'lucide-react';
import Layout from '../layouts/Layout';

const problems = [
  {
    icon: Users,
    title: "Households & Shops",
    desc: "Most people want to recycle, but don't know who will pick up their waste or what it's worth. Valuable plastics, cardboard, and metals end up dumped in landfills instead of reused.",
  },
  {
    icon: Truck,
    title: "Collectors & Drivers",
    desc: "Scrap collectors work hard every day, but often deal with unfair middlemen, fluctuating prices, and delayed cash payments for the materials they gather.",
  },
  {
    icon: Warehouse,
    title: "Recycling Centers & Hubs",
    desc: "Hub managers struggle with paper records, lost inventory, and disorganized deliveries, making it difficult to track what comes in, pay workers, and grow.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Request a Pickup",
    desc: "A household or business uses the app to list their recyclables and pick a convenient time for collection.",
  },
  {
    step: "02",
    title: "Weigh & Confirm",
    desc: "A local collector arrives with a scale, weighs the materials, and logs the exact kilograms directly into their phone.",
  },
  {
    step: "03",
    title: "Instant Digital Payment",
    desc: "The seller gets paid immediately through their phone, with clear rates per kilogram and no hidden deductions.",
  },
  {
    step: "04",
    title: "Bulk Delivery to Factories",
    desc: "Recycling centers sort the materials into clean batches and sell them directly to factories that turn them into new goods.",
  },
];

const values = [
  {
    icon: Heart,
    title: "Fairness for Workers",
    desc: "Waste collectors and drivers do vital work for our towns and cities. We build our tools so they get fair prices, steady work, and respect.",
  },
  {
    icon: Sparkles,
    title: "Simple & Easy Tools",
    desc: "Software shouldn't be complicated. Our apps are lightweight, fast, and easy to learn in a few minutes on any smartphone.",
  },
  {
    icon: Scale,
    title: "Honest Measurements",
    desc: "Accurate weights, transparent pricing per kilogram, and direct payments. What you collect is exactly what you get paid for.",
  },
  {
    icon: Recycle,
    title: "Real Community Impact",
    desc: "We measure our success by clean streets, less trash in rivers, and honest livelihoods created across local neighborhoods.",
  },
];

const journey = [
  {
    period: "The Starting Point",
    title: "Seeing the Real Problem",
    desc: "We noticed how much clean plastic and paper was dumped on roadsides while local recycling workshops struggled to find reliable materials. The gap wasn't a lack of waste, but a lack of simple tools to connect people.",
  },
  {
    period: "The First Tools",
    title: "Digitizing Street Collections",
    desc: "We created mobile apps so local collectors could schedule pickups, weigh items accurately, and get paid digitally without paper receipts or middleman deductions.",
  },
  {
    period: "Hub Operations",
    title: "Software for Recycling Centers",
    desc: "We developed simple software for recycling yard managers to record daily intake from collectors, track material piles, and pay drivers smoothly.",
  },
  {
    period: "Connecting to Industry",
    title: "Direct Sales to Factories",
    desc: "Today, we help recycling centers connect directly with manufacturers and mills that need clean, sorted raw materials in bulk.",
  },
];

export default function AboutUs() {
  return (
    <Layout>
      <div>
        {/* ── 1. HERO BANNER ── */}
        <section className="relative pt-36 pb-28 md:pt-44 md:pb-36 overflow-hidden bg-gradient-to-br from-[#085078] via-[#0c5d8a] to-[#063854] text-white">
          {/* Dotted Grid Overlay */}
          <div
            className="absolute inset-0 opacity-[0.08] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 bg-white/15 border border-white/20 text-sky-100 backdrop-blur-md">
                <Recycle className="w-3.5 h-3.5 text-lime-400" />
                About Klinflow
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.08]">
                Building Simple Software for a{' '}
                <span className="text-lime-400">Cleaner Future.</span>
              </h1>

              <p className="text-base sm:text-lg text-sky-100/90 font-normal leading-relaxed max-w-2xl mx-auto">
                Klinflow connects everyday people, local scrap collectors, and
                recycling centers through easy mobile and web tools — turning
                everyday recyclables into fair income and dependable operations.
              </p>
            </div>
          </div>

          {/* Curved Bottom Wave */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <svg
              className="w-full h-16 md:h-24"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M0,20 Q720,140 1440,20 L1440,120 L0,120 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </section>

        {/* ── 2. THE CHALLENGE (Hairline-Divided 3-Column Strip) ── */}
        <section className="py-20 md:py-24 px-6 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14 pb-8 border-b border-slate-200/80">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] block mb-3">
                  The Challenge
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                  Why Recycling Needed Better Tools
                </h2>
              </div>
              <p className="text-base leading-relaxed text-slate-600 max-w-md">
                Recycling should be simple, but without basic software, the
                process gets stuck on paper clipboards, unfair pricing, and
                missed pickups.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80">
              {problems.map((item, i) => (
                <div
                  key={i}
                  className="py-6 md:py-2 md:px-8 first:pt-0 first:md:pl-0 last:pb-0 last:md:pr-0 group"
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-11 h-11 rounded-xl bg-[#f0f7fc] border border-[#1178ab]/15 flex items-center justify-center text-[#085078] group-hover:bg-[#085078] group-hover:text-white transition-colors">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono font-bold tracking-widest text-slate-400">
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2.5 text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. HOW IT WORKS (Connected 4-Step Pipeline) ── */}
        <section className="py-20 md:py-24 px-6 bg-[#edf3f9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] block mb-3">
                How It Works
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">
                Making Recycling Work for Everyone
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                Our apps connect every step of the journey so nothing gets lost
                and everyone gets treated fairly.
              </p>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              {/* Desktop connector line */}
              <div className="hidden lg:block absolute top-5 left-[10%] right-[10%] h-px bg-slate-300/80 z-0" />

              {howItWorks.map((item, idx) => (
                <div key={idx} className="relative z-10 flex flex-col">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="w-10 h-10 rounded-xl bg-[#085078] text-white font-mono text-sm font-bold flex items-center justify-center shadow-md shadow-[#085078]/15">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. OUR JOURNEY / MILESTONES (Preserved Alternating Timeline) ── */}
        <section className="py-20 md:py-28 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] block mb-3">
                Our Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">
                How Klinflow Grew
              </h2>
              <p className="text-base leading-relaxed text-slate-600">
                From street-level collection tests to complete software systems
                for recycling hubs.
              </p>
            </div>

            {/* Timeline Container */}
            <div className="relative">
              {/* Central Vertical Line */}
              <div className="absolute top-4 bottom-4 w-[2px] left-4 sm:left-6 md:left-1/2 md:-translate-x-1/2 bg-gradient-to-b from-[#1178ab] via-slate-300 to-emerald-500" />

              <div className="space-y-8 md:space-y-12">
                {journey.map((item, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                    <div
                      key={idx}
                      className={`relative flex items-center ${
                        isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                      }`}
                    >
                      {/* Timeline Center Node Dot */}
                      <div className="absolute left-4 sm:left-6 md:left-1/2 -translate-x-1/2 top-7 md:top-1/2 md:-translate-y-1/2 z-10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-[#1178ab] border-4 border-white shadow-md" />
                      </div>

                      {/* Timeline Card */}
                      <div
                        className={`w-full pl-10 sm:pl-14 md:pl-0 md:w-1/2 relative ${
                          isEven ? 'md:pr-12' : 'md:pl-12'
                        }`}
                      >
                        {/* Horizontal connector line on desktop */}
                        <div
                          className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-[2px] w-12 ${
                            isEven ? 'right-0' : 'left-0'
                          } bg-[#1178ab]/35`}
                        />

                        <div className="p-6 sm:p-7 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5 transition-all duration-300">
                          <span className="text-xs font-bold text-[#1178ab] uppercase tracking-wider block mb-1.5">
                            {item.period}
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold mb-2.5 text-slate-900">
                            {item.title}
                          </h3>
                          <p className="text-sm sm:text-base leading-relaxed text-slate-600">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {/* Empty Space for the other side on desktop */}
                      <div className="hidden md:block md:w-1/2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. OUR CORE VALUES (Asymmetric Split Editorial Grid) ── */}
        <section className="py-20 md:py-24 px-6 bg-[#edf3f9]">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              <div className="lg:col-span-4 lg:sticky lg:top-28">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] block mb-3">
                  What We Stand For
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-slate-900">
                  Our Guiding Principles
                </h2>
                <p className="text-base leading-relaxed text-slate-600">
                  The real everyday values that guide how we build our software
                  and treat every person in the recycling chain.
                </p>
              </div>

              <div className="lg:col-span-8 grid sm:grid-cols-2 gap-x-8 gap-y-10">
                {values.map((v, i) => (
                  <div
                    key={i}
                    className="pl-5 border-l-2 border-[#1178ab]/35 hover:border-[#1178ab] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-[#085078] mb-4 shadow-xs">
                      <v.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-900">
                      {v.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {v.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 6. THE FOUNDER'S NOTE (Clean Editorial Quote) ── */}
        <section className="py-20 md:py-24 px-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="pl-6 sm:pl-10 border-l-4 border-[#085078]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] mb-5">
                <Quote className="w-4 h-4" />
                <span>A Note From The Founder</span>
              </div>

              <blockquote className="text-xl sm:text-2xl md:text-[26px] font-medium leading-relaxed mb-8 text-slate-800">
                &ldquo;We started Klinflow because we believed that cleaning up
                our communities shouldn&apos;t depend on disorganized,
                paper-based systems. When you give everyday people fair, fast
                payment for their recyclables and give local recycling centers
                reliable software to run their work, recycling stops being a
                chore and becomes an honest, dependable livelihood for entire
                families.&rdquo;
              </blockquote>

              <div className="flex items-center gap-4 pt-6 border-t border-slate-200/80">
                <div className="w-11 h-11 rounded-full bg-[#085078] text-white font-bold flex items-center justify-center text-sm">
                  VM
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    Victor Michael
                  </h4>
                  <p className="text-xs font-medium text-[#1178ab]">
                    Founder, Klinflow
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 7. CALL TO ACTION ── */}
        <section className="px-6 pb-20 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-gradient-to-r from-[#085078] via-[#0a5a87] to-[#063854] text-white relative overflow-hidden shadow-2xl shadow-[#085078]/20">
              <div
                className="absolute inset-0 opacity-[0.07] pointer-events-none"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="max-w-2xl">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                    Ready to Work With Us?
                  </h2>
                  <p className="text-sky-100/90 text-sm sm:text-base leading-relaxed">
                    Whether you want to sell household recyclables, collect in
                    your area, or run your recycling center with our software,
                    we&apos;d love to hear from you.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-bold bg-lime-400 text-slate-950 hover:bg-lime-300 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                  >
                    Contact Us <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/faq"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all border border-white/25 whitespace-nowrap"
                  >
                    Read Common Questions
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
