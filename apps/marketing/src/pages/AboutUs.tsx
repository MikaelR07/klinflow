import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Leaf, Factory, Zap, Globe2, Users, Truck, ChevronRight, ArrowRight, Heart, Award, TrendingUp, Building2 } from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import Layout from '../layouts/Layout';

const values = [
  { icon: Shield, title: "Uncompromising Integrity", desc: "Every transaction, every weight measurement, and every payout is recorded on an immutable ledger. Trust is not optional — it is engineered into every layer of our stack.", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Target, title: "Operational Excellence", desc: "We obsess over eliminating friction. Our tools are designed to reduce turnaround times, minimize manual errors, and maximize throughput across the entire material lifecycle.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: Leaf, title: "Environmental Impact", desc: "Every kilogram tracked on Klinflow is a kilogram diverted from landfill. We measure our success not just in revenue, but in the real-world environmental outcomes we drive.", color: "text-green-500", bg: "bg-green-500/10" },
  { icon: Factory, title: "Industrial Grade", desc: "Built for high-volume, continuous 24/7 operations. Our systems maintain 99.95% uptime with automatic failover, real-time monitoring, and enterprise SLA guarantees.", color: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: Heart, title: "Community First", desc: "We empower informal waste workers — providing them with digital identity, financial tools, safety training, and a pathway to formal economic participation.", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: TrendingUp, title: "Data-Driven Decisions", desc: "AI-powered pricing intelligence, contamination detection, route optimization, and predictive maintenance ensure every decision is backed by real-time data.", color: "text-amber-500", bg: "bg-amber-500/10" },
];

const timeline = [
  { year: "2023", title: "Founded", desc: "Klinflow was founded with a mission to digitize the informal waste economy and connect fragmented supply chains." },
  { year: "2024", title: "Platform Launch", desc: "Launched the Client App, Agent App, and first Hub MOS deployment. Onboarded our first 1,000 agents across East Africa." },
  { year: "2025", title: "Scale & Expansion", desc: "Expanded to West Africa and Southern Africa. Processed our 50 thousandth transaction. Launched Klin API for enterprise integrations." },
  { year: "2026", title: "Industrial AI", desc: "Deployed HygeneX AI for automated material grading. Reached 120K active agents, $85M+ in processed payouts, and 99.95% platform uptime." },
];

const leadership = [
  { name: "Victor Michael", role: "Chief Executive Officer", bio: "Former VP of Operations at a top African logistics firm. 15+ years building supply chain infrastructure across emerging markets." },
  { name: "Karen Viera", role: "Chief Technology Officer", bio: "Ex-Google engineer specializing in distributed systems and real-time data platforms. Led engineering at two Y Combinator-backed startups." },
  { name: "Gideon Mudoga", role: "Chief Operations Officer", bio: "20+ years in waste management and recycling. Previously managed the largest material recovery facility in Southern Africa." },
  { name: "Nicole Msimbi", role: "VP, Partnerships & Growth", bio: "Built strategic partnerships across 30+ African countries. Expert in cross-border trade facilitation and regulatory compliance." },
];

export default function AboutUs() {
  const { isDarkMode } = useThemeStore();

  return (
    <Layout>
      <div className="pb-20">
        
        {/* Hero */}
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-20">
          <div className="max-w-4xl">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <Globe2 className="w-3.5 h-3.5" /> About Klinflow
            </div>
            <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-8 leading-[1.05] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Industrializing the{' '}
              <span className="text-emerald-500">circular economy</span>, one transaction at a time.
            </h1>
            <p className={`text-xl leading-relaxed max-w-3xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Klinflow is the operating system for the global waste-to-value supply chain. We provide the infrastructure, intelligence, and financial rails that transform scattered informal recycling networks into efficient, traceable, and profitable operations.
            </p>
          </div>
        </div>

        {/* Stats Banner */}
        <div className="w-full relative py-20 bg-slate-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900"></div>
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
              {[
                { value: "50M+", label: "Tons Tracked", sub: "Across all hubs" },
                { value: "120K", label: "Active Agents", sub: "In 4 countries" },
                { value: "$85M", label: "Payouts Processed", sub: "Direct to wallets" },
                { value: "99.95%", label: "Platform Uptime", sub: "Enterprise SLA" },
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left">
                  <p className="text-4xl md:text-5xl font-black text-white mb-1 tracking-tight">{stat.value}</p>
                  <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">

          {/* Mission & Story */}
          <div className="py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24">
              <div>
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Our Mission</h2>
                <div className={`space-y-6 text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <p>
                    The global waste management industry generates over $2 trillion in economic value annually, yet much of the recycling supply chain — especially in emerging markets — remains informal, untracked, and financially excluded.
                  </p>
                  <p>
                    Millions of waste collectors operate without digital identity, banking access, or predictable income. Material recovery facilities lack the data infrastructure to optimize intake, enforce quality standards, or connect with global commodity markets.
                  </p>
                  <p>
                    <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>Klinflow exists to close these gaps.</strong> We built an integrated operating system that brings transparency, automation, and financial inclusion to every layer of the waste-to-value supply chain.
                  </p>
                </div>
              </div>
              
              <div>
                <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Our Approach</h2>
                <div className={`space-y-6 text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  <p>
                    We take an infrastructure-first approach. Rather than building a marketplace on top of broken processes, we re-engineered the entire operational backbone: digital intake workflows, automated quality grading, real-time fleet telemetry, and instant micropayment settlement.
                  </p>
                  <p>
                    Our four connected applications — the Client App for sellers, the Agent App for collectors, the Fleet Manager for logistics operators, and the Hub MOS for processing facilities — create a seamless data pipeline from the point of waste generation to final commodity sale.
                  </p>
                  <p>
                    Every transaction generates verified environmental impact data, enabling our partners to issue carbon credits, satisfy ESG reporting requirements, and demonstrate measurable sustainability outcomes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="py-16">
            <h2 className={`text-3xl md:text-4xl font-bold tracking-tight text-center mb-16 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Our Journey</h2>
            <div className="relative">
              <div className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'} hidden md:block`}></div>
              <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-2 md:gap-y-16">
                {timeline.map((item, i) => (
                  <div key={i} className={`relative ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:col-start-2'}`}>
                    <div className={`hidden md:flex absolute top-2 ${i % 2 === 0 ? 'right-0 -mr-[0.4rem]' : 'left-0 -ml-[0.4rem]'} w-3 h-3 rounded-full bg-emerald-500 ring-4 ${isDarkMode ? 'ring-surface-950' : 'ring-surface-50'}`}></div>
                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <span className="text-xs font-black text-emerald-500 tracking-widest uppercase">{item.year}</span>
                      <h3 className={`text-lg font-bold mt-1 mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                      <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Core Values */}
          <div className="py-20">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Our Core Values</h2>
              <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                The engineering and operational principles that guide everything we build.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((v, i) => (
                <div key={i} className={`p-7 rounded-2xl border transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-surface-900 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div className={`w-12 h-12 rounded-xl ${v.bg} flex items-center justify-center mb-5`}>
                    <v.icon className={`w-6 h-6 ${v.color}`} />
                  </div>
                  <h3 className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{v.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership */}
          <div className="py-20">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Leadership</h2>
              <p className={`text-lg max-w-2xl mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Industry veterans with deep expertise in logistics, technology, and sustainability.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {leadership.map((person, i) => (
                <div key={i} className={`p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-black ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                    {person.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{person.name}</h3>
                  <p className="text-xs font-bold text-emerald-500 mb-3">{person.role}</p>
                  <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{person.bio}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className={`p-12 md:p-16 rounded-[2rem] text-center border relative overflow-hidden ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-slate-900 border-slate-800'}`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <Zap className="w-10 h-10 mx-auto mb-5 text-emerald-400" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight">Ready to industrialize your operations?</h2>
              <p className="text-slate-300 max-w-xl mx-auto mb-8 text-lg">
                Join the largest network of automated material processing hubs and collection agents in Africa.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20">
                  Request a Demo <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/faq" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-white/10 text-white hover:bg-white/15 transition-all border border-white/10">
                  Read FAQ
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
