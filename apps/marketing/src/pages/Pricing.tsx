import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, HelpCircle, Star, Quote, Minus, ChevronDown } from "lucide-react";
import { useThemeStore } from "@klinflow/core/stores/themeStore";
import Layout from "../layouts/Layout";

const pricingTiers = [
  {
    name: "Resident",
    badge: "For Households",
    price: "Free",
    subtext: "You keep 95% of the payouts",
    pitch: "Turn household waste into instant cash. The 5% fee helps us build better services and expand our network.",
    features: [
      "Voice-activated pickup scheduling",
      "Unlimited AI Image Valuations",
      "Instant digital wallet payouts",
      "GreenFuel Points rewards"
    ],
    cta: "Download App",
    link: "/products/client",
    popular: false,
    color: "emerald"
  },
  {
    name: "Seller",
    badge: "For Scrappers",
    price: "Free",
    subtext: "You keep 95% of the earnings",
    pitch: "A transparent trading floor for your materials. The 5% fee helps us build better services and expand our network.",
    features: [
      "Dynamic Market-rate Matching",
      "Group Contract Pledging for higher margins",
      "Real-time demand alerts",
      "Proof-of-material image uploads"
    ],
    cta: "Start Selling",
    link: "/products/client",
    popular: false,
    color: "emerald"
  },
  {
    name: "Solo Agent",
    badge: "Individual Collectors",
    price: "KSh 1,500",
    biannualPrice: "KSh 1,350",
    yearlyPrice: "KSh 1,200",
    subtext: "per month",
    pitch: "Your intelligent co-driver. Maximize your daily collections and route efficiency effortlessly.",
    features: [
      "HygeneX Route Optimization map",
      "On-the-spot conversational material grading",
      "Pending job radar & live dispatch",
      "Individual revenue tracking dashboard"
    ],
    cta: "Join as Agent",
    link: "/products/agent",
    popular: false,
    color: "blue"
  },
  {
    name: "Hub Suite",
    badge: "For Aggregators & Logistics",
    price: "KSh 25,000",
    biannualPrice: "KSh 23,000",
    yearlyPrice: "KSh 21,500",
    subtext: "per month base fee",
    pitch: "The complete operating system for your recycling logistics. Includes Hub app, Owner dashboard, and 3 driver licenses.",
    features: [
      "Company Owner full admin dashboard",
      "Hub Command App (MOS) for facility management",
      "Includes 3 Fleet Driver licenses",
      "Predictive Analytics & automated RFQ generation",
      "Additional drivers at KSh 1,500/month"
    ],
    cta: "Get Hub Suite",
    link: "/products/hub",
    popular: true,
    color: "primary"
  },
  {
    name: "Enterprise Trade",
    badge: "For Industrial B2B Buyers",
    price: "Custom",
    subtext: "Volume Pricing",
    pitch: "Secure consistent, traceable supply lots and realize your corporate sustainability goals.",
    features: [
      "Full Supply Chain Traceability",
      "Verified ESG & Carbon Offset Reporting",
      "Escrow-secured Bulk Sourcing",
      "Dedicated Account Manager & API access"
    ],
    cta: "Contact Sales",
    link: "/contact",
    popular: false,
    color: "slate"
  }
];

const featureCategories = [
  {
    name: "Platform Access",
    features: [
      { name: "Voice-activated Scheduling", resident: true, seller: true, agent: false, fleet: false, enterprise: false },
      { name: "Unlimited AI Image Valuations", resident: true, seller: true, agent: true, fleet: true, enterprise: false },
      { name: "Instant Digital Payouts", resident: true, seller: true, agent: false, fleet: false, enterprise: false },
      { name: "GreenFuel Points Rewards", resident: true, seller: false, agent: false, fleet: false, enterprise: false },
      { name: "Dynamic Market-rate Matching", resident: false, seller: true, agent: false, fleet: false, enterprise: false },
      { name: "Group Contract Pledging", resident: false, seller: true, agent: false, fleet: false, enterprise: false },
    ]
  },
  {
    name: "Logistics & Fleet",
    features: [
      { name: "HygeneX Route Optimization", resident: false, seller: false, agent: true, fleet: true, enterprise: false },
      { name: "Live Dispatch & Pending Job Radar", resident: false, seller: false, agent: true, fleet: true, enterprise: false },
      { name: "Hub Command App (MOS)", resident: false, seller: false, agent: false, fleet: true, enterprise: false },
      { name: "Company Admin Dashboard", resident: false, seller: false, agent: false, fleet: true, enterprise: false },
      { name: "Predictive Analytics & RFQs", resident: false, seller: false, agent: false, fleet: true, enterprise: false },
    ]
  },
  {
    name: "Enterprise Trade",
    features: [
      { name: "Full Supply Chain Traceability", resident: false, seller: false, agent: false, fleet: false, enterprise: true },
      { name: "Verified ESG & Carbon Reporting", resident: false, seller: false, agent: false, fleet: false, enterprise: true },
      { name: "Escrow-secured Bulk Sourcing", resident: false, seller: false, agent: false, fleet: false, enterprise: true },
      { name: "API Access & Integrations", resident: false, seller: false, agent: false, fleet: false, enterprise: true },
      { name: "Dedicated Account Manager", resident: false, seller: false, agent: false, fleet: false, enterprise: true },
    ]
  }
];

const appComparisons = [
  {
    app: "Solo Agent App",
    description: "Compare the basic free version with the premium intelligent co-driver.",
    features: [
      { name: "Daily Pickups Route Mapping", basic: "Up to 5 stops", premium: "Unlimited stops" },
      { name: "AI Material Grading", basic: "Manual entry", premium: "Automated via camera" },
      { name: "Live Dispatch Radar", basic: false, premium: true },
      { name: "CRM Contacts", basic: "Up to 20", premium: "Unlimited" },
      { name: "Revenue Tracking Dashboard", basic: "Basic summary", premium: "Advanced Analytics" },
    ]
  },
  {
    app: "Hub Suite",
    description: "Compare the standard aggregator Hub with the full enterprise Fleet Suite.",
    features: [
      { name: "Driver Licenses Included", basic: "1 License", premium: "3 Licenses (Add more for 1.5k/mo)" },
      { name: "RFQ Broadcasting", basic: "Up to 5 / month", premium: "Unlimited" },
      { name: "Automated Dispatch Rules", basic: false, premium: true },
      { name: "Predictive Market Analytics", basic: false, premium: true },
      { name: "Dedicated Company Owner Dashboard", basic: false, premium: true },
    ]
  },
  {
    app: "Enterprise Trade",
    description: "Compare standard enterprise access with fully customized trade agreements.",
    features: [
      { name: "Verified ESG & Carbon Reporting", basic: "Standard exports", premium: "Custom audit reports" },
      { name: "Escrow-secured Bulk Sourcing", basic: "Standard rates", premium: "Negotiated volume discounts" },
      { name: "API Access & Integrations", basic: false, premium: true },
      { name: "Dedicated Account Manager", basic: false, premium: true },
      { name: "Custom SLA & Uptime Guarantee", basic: false, premium: true },
    ]
  }
];

const faqs = [
  {
    q: "Why is there a 5% fee for Residents and Sellers?",
    a: "We believe you should keep the vast majority of the value you create. The small 5% platform fee allows us to maintain the servers, improve the HygeneX AI features, and continuously expand the Klinflow network so you can get even better prices for your materials."
  },
  {
    q: "What happens if my fleet has more than 10 drivers?",
    a: "The Fleet Suite includes 10 driver licenses out of the box. Any additional driver you want to add to your network will cost just KSh 650 per month, allowing you to scale your logistics operations affordably."
  },
  {
    q: "Do I need to sign a long-term contract?",
    a: "No. Solo Agent and Fleet Suite plans are billed month-to-month and you can cancel anytime. For Enterprise Trade customers, we offer customized annual agreements based on procurement volume."
  },
  {
    q: "How does payout work for free tier users?",
    a: "When your materials are collected or traded, 95% of the total transaction value is instantly routed to your Klinflow digital wallet. You can withdraw this to your bank account or convert it to GreenFuel Points at any time."
  }
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Resident",
    quote: "Klinflow makes recycling so easy. The AI values my plastics instantly and I get paid directly to my digital wallet!"
  },
  {
    name: "John M.",
    role: "Scrap Seller",
    quote: "The group contract pledging has completely changed my business. I'm getting much better margins now on bulk materials."
  },
  {
    name: "David T.",
    role: "Fleet Driver",
    quote: "The route optimization is a lifesaver. I collect twice as much in the same amount of time with the smart map."
  },
  {
    name: "EcoCorp Hub",
    role: "Aggregator",
    quote: "Broadcasting RFQs and having the AI handle initial negotiations saves our facility hours of manual work every single day."
  }
];

export default function Pricing() {
  const { isDarkMode } = useThemeStore();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'biannual' | 'yearly'>('yearly');
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  return (
    <Layout>
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? "text-white" : "text-slate-900"}`}
            style={{
              backgroundImage: `linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-6 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            Fair Pricing for<br className="hidden md:block" />
            <span className="text-primary italic">Unlimited Value.</span>
          </h1>
          <p className={`max-w-2xl mx-auto text-base md:text-lg mb-10 ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Whether you are a small scale seller, collector or an enterprise sourcing tons of recyclables, our ecosystem is designed to align incentives and accelerate the circular economy.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className={`flex p-1 rounded-full ${isDarkMode ? "bg-surface-800 border border-white/10" : "bg-slate-100 border border-slate-200"}`}>
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly' ? "bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setBillingCycle('biannual')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === 'biannual' ? "bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                6 Months
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full hidden sm:inline-block">Save 10%</span>
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? "bg-white dark:bg-surface-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
              >
                Yearly
                <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full hidden sm:inline-block">Save 20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-4 items-start">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`relative flex flex-col h-full rounded-3xl p-6 md:p-8 transition-all duration-300 hover:-translate-y-1 ${
                  tier.popular 
                    ? `border-2 border-primary shadow-[0_0_40px_rgba(34,197,94,0.15)] ${isDarkMode ? "bg-surface-900" : "bg-white"}`
                    : `border ${isDarkMode ? "border-white/10 bg-surface-900 hover:bg-surface-900/50" : "border-slate-200 bg-white hover:shadow-xl"}`
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">
                    Recommended
                  </div>
                )}
                
                <div className="mb-6">
                  <span className={`text-[10px] font-bold uppercase tracking-widest mb-2 block ${tier.popular ? "text-primary" : "text-slate-500"}`}>
                    {tier.badge}
                  </span>
                  <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className={`text-2xl md:text-3xl font-black ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {billingCycle === 'yearly' && (tier as any).yearlyPrice ? (tier as any).yearlyPrice : billingCycle === 'biannual' && (tier as any).biannualPrice ? (tier as any).biannualPrice : tier.price}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {tier.subtext} {billingCycle === 'yearly' && (tier as any).yearlyPrice ? "(billed annually)" : billingCycle === 'biannual' && (tier as any).biannualPrice ? "(billed bi-annually)" : ""}
                  </span>
                </div>



                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${tier.popular ? "bg-primary/20 text-primary" : (isDarkMode ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700")}`}>
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                        <span className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to={tier.link}
                  className={`mt-auto flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-colors ${
                    tier.popular
                      ? "bg-primary hover:bg-primary-dark text-white"
                      : isDarkMode
                        ? "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200"
                  }`}
                >
                  {tier.cta} <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed App Comparisons (Accordion) */}
      <section className={`py-24 border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block">
              In-Depth Look
            </span>
            <h2 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Basic vs Premium
            </h2>
            <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
              A detailed breakdown of feature limits and capabilities for our specialized applications.
            </p>
          </div>

          <div className="space-y-4">
            {appComparisons.map((comp, idx) => (
              <div 
                key={idx} 
                className={`border rounded-2xl overflow-hidden transition-all ${isDarkMode ? "bg-surface-900 border-white/10" : "bg-white border-slate-200"}`}
              >
                <button
                  onClick={() => setOpenAccordion(openAccordion === idx ? null : idx)}
                  className={`w-full flex items-center justify-between p-6 md:p-8 text-left transition-colors ${isDarkMode ? "hover:bg-surface-800" : "hover:bg-slate-50"}`}
                >
                  <div>
                    <h3 className={`text-xl font-bold mb-1 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                      {comp.app}
                    </h3>
                    <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      {comp.description}
                    </p>
                  </div>
                  <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isDarkMode ? "text-slate-400" : "text-slate-500"} ${openAccordion === idx ? "rotate-180" : ""}`} />
                </button>
                
                <motion.div
                  initial={false}
                  animate={{ height: openAccordion === idx ? "auto" : 0, opacity: openAccordion === idx ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <div className={`p-6 md:p-8 pt-0 border-t ${isDarkMode ? "border-white/10" : "border-slate-100"}`}>
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px] mt-6">
                        <div className="grid grid-cols-5 mb-4 border-b pb-4 border-slate-200 dark:border-white/10">
                          <div className={`col-span-3 font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Feature</div>
                          <div className={`col-span-1 text-center font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Basic</div>
                          <div className={`col-span-1 text-center font-bold text-primary`}>Premium</div>
                        </div>

                        {comp.features.map((feat, fIdx) => (
                          <div key={fIdx} className={`grid grid-cols-5 py-3 border-b border-dashed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
                            <div className={`col-span-3 text-sm flex items-center ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                              {feat.name}
                            </div>
                            <div className="col-span-1 flex items-center justify-center text-sm font-medium text-slate-500 dark:text-slate-400">
                              {typeof feat.basic === 'boolean' ? (
                                feat.basic ? <Check className="w-5 h-5 text-emerald-500" /> : <Minus className={`w-4 h-4 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
                              ) : (
                                feat.basic
                              )}
                            </div>
                            <div className="col-span-1 flex items-center justify-center text-sm font-bold text-primary">
                              {typeof feat.premium === 'boolean' ? (
                                feat.premium ? <Check className="w-5 h-5 text-emerald-500" /> : <Minus className={`w-4 h-4 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
                              ) : (
                                feat.premium
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className={`py-24 border-t ${isDarkMode ? "bg-surface-950 border-white/5" : "bg-white border-slate-200"}`}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block">
              Compare Plans
            </span>
            <h2 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Find the right fit for your role
            </h2>
            <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
              A detailed breakdown of everything included in each tier of the Klinflow ecosystem.
            </p>
          </div>

          <div className="overflow-x-auto pb-8">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-7 mb-8 border-b pb-4 border-slate-200 dark:border-white/10">
                <div className="col-span-2"></div>
                <div className={`col-span-1 text-center font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Resident</div>
                <div className={`col-span-1 text-center font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Seller</div>
                <div className={`col-span-1 text-center font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Solo Agent</div>
                <div className={`col-span-1 text-center font-bold text-primary`}>Hub Suite</div>
                <div className={`col-span-1 text-center font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>Enterprise</div>
              </div>

              {/* Categories & Features */}
              {featureCategories.map((cat, idx) => (
                <div key={idx} className="mb-8">
                  <div className={`font-bold text-lg mb-4 grid grid-cols-7 border-b pb-2 ${isDarkMode ? "text-slate-300 border-white/10" : "text-slate-700 border-slate-200"}`}>
                    <div className="col-span-7">{cat.name}</div>
                  </div>
                  {cat.features.map((feat, fIdx) => (
                    <div key={fIdx} className={`grid grid-cols-7 py-3 border-b border-dashed hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${isDarkMode ? "border-white/5" : "border-slate-100"}`}>
                      <div className={`col-span-2 text-sm pl-4 flex items-center ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {feat.name}
                      </div>
                      {[feat.resident, feat.seller, feat.agent, feat.fleet, feat.enterprise].map((hasFeature, colIdx) => (
                        <div key={colIdx} className="col-span-1 flex items-center justify-center">
                          {hasFeature ? (
                            <Check className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Minus className={`w-4 h-4 ${isDarkMode ? "text-slate-700" : "text-slate-300"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-24 border-t ${isDarkMode ? "bg-transparent border-white/5" : "bg-slate-50 border-slate-200"}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <HelpCircle className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className={`text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Frequently Asked Questions
            </h2>
            <p className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
              Everything you need to know about pricing and payments on Klinflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                className={`rounded-2xl border p-6 md:p-8 ${isDarkMode ? "bg-surface-900 border-white/10" : "bg-white border-slate-200"}`}
              >
                <h3 className={`font-semibold text-base md:text-lg mb-3 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                  {faq.q}
                </h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`py-24 border-t ${isDarkMode ? "bg-surface-950 border-white/5" : "bg-white border-slate-200"}`}>
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-4 block">
              Trusted by the Network
            </span>
            <h2 className={`text-3xl sm:text-4xl font-bold tracking-tight mb-4 ${isDarkMode ? "text-white" : "text-slate-900"}`}>
              Don't just take our word for it.
            </h2>
            <p className={`text-base ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              See how Klinflow is transforming operations for every type of stakeholder in the circular economy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <div 
                key={i} 
                className={`relative rounded-3xl p-8 border flex flex-col justify-between ${isDarkMode ? "bg-surface-900 border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <div>
                  <div className="flex items-center gap-1 mb-6 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <Quote className={`w-8 h-8 mb-4 opacity-20 ${isDarkMode ? "text-white" : "text-slate-900"}`} />
                  <p className={`text-sm italic leading-relaxed mb-8 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    "{t.quote}"
                  </p>
                </div>
                <div className="mt-auto">
                  <h4 className={`font-bold ${isDarkMode ? "text-white" : "text-slate-900"}`}>
                    {t.name}
                  </h4>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-primary" : "text-primary"}`}>
                    {t.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
