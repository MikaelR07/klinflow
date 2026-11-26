import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Minus,
  Search,
  MessageSquare,
  Phone,
  Mail,
  ArrowRight,
  Sparkles,
  Package,
  Truck,
  Warehouse,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import Layout from '../layouts/Layout';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  icon: React.ElementType;
  description: string;
  questions: FAQItem[];
}

const faqs: FAQCategory[] = [
  {
    category: 'Platform Overview',
    icon: Sparkles,
    description: 'How Klinflow connects households, collectors, recovery hubs, and industrial buyers.',
    questions: [
      {
        q: 'What is Klinflow and how do the apps fit together?',
        a: 'Klinflow is a connected operating platform for the recycling value chain. Residents and sellers list recyclables on the Client App; verified collectors and fleet drivers fulfill pickups on the Agent App; recovery hubs verify weights, manage inventory, and disburse payouts on the Hub MOS; and processors source bulk lots on the B2B Marketplace.',
      },
      {
        q: 'Where does Klinflow currently operate?',
        a: 'Klinflow is built for recycling operations in Kenya, with active workflows supporting Nairobi recovery hubs, local collection agents, and regional B2B aggregators. If you operate a collection yard or processing facility elsewhere in East Africa, reach out to our team to discuss onboarding.',
      },
      {
        q: 'How much does it cost to use Klinflow?',
        a: 'The Client App for residents and sellers and the Agent App for collectors are free to use. Recovery hubs and B2B businesses license the Hub MOS and B2B Marketplace on plans tailored to facility volume and team size.',
      },
      {
        q: 'Can one organization operate both a Recovery Hub and buy on the B2B Market?',
        a: 'Yes. The Hub MOS is directly integrated with the Klinflow B2B Marketplace, which supports both buying and selling in one platform. From your MOS workspace, your hub can list or auction off verified, sorted inventory directly to bulk buyers — and just as easily browse supplier listings or post Sourcing RFQs to buy extra materials and increase your hub stock.',
      },
    ],
  },
  {
    category: 'Residents & Sellers',
    icon: Package,
    description: 'Listing recyclables, community collection drives, weighing, and payouts.',
    questions: [
      {
        q: 'How do I sell my recyclables through the Client App?',
        a: 'Create a listing in the Client App by selecting your material category, entering the estimated weight or bag count, adding a photo, and confirming your pickup location. Nearby collectors or hub-dispatched fleet drivers can accept the request and collect directly from your doorstep.',
      },
      {
        q: 'What materials are accepted on Klinflow?',
        a: 'Accepted categories depend on local hub demand and commonly include PET bottles, HDPE containers, LDPE film, PP plastics, OCC cardboard, mixed paper, glass bottles, aluminum UBC cans, and sorted scrap metals. Clean, dry, and separated materials earn the best rates.',
      },
      {
        q: 'What are Community Collections?',
        a: 'Community Collections are scheduled neighborhood collection drives organized by local recovery hubs. Residents can sign up ahead of time, enter the estimated amount of recyclables they plan to bring, and either drop them off at a set collection point or meet an assigned pickup team during the scheduled hours.',
      },
      {
        q: 'How are final weights and payouts calculated?',
        a: 'When your materials are collected or dropped off, the weight is measured on a scale and logged digitally at the current KES/kg rate. Once verified, your payout is credited to your in-app wallet for withdrawal via M-Pesa or bank transfer.',
      },
    ],
  },
  {
    category: 'Agents & Fleet Drivers',
    icon: Truck,
    description: 'Onboarding, pickup dispatch, manifest PINs, and hub gate verification.',
    questions: [
      {
        q: 'How do I become a verified Klinflow collection agent?',
        a: 'Download the Agent App and complete registration with your national ID details, phone number, and payout account. Once verified by your local hub or operations team, you receive a Klin-ID and can start accepting pickup jobs or hub dispatches.',
      },
      {
        q: 'How does fleet manifest verification work at the hub gate?',
        a: 'Fleet drivers arriving with collected stops present their trip manifest or 6-digit verification PIN at the hub gate. The intake operator pulls up the manifest in the Hub MOS, weighs each material line on the floor scale, and issues a digital waybill.',
      },
      {
        q: 'Why might a hub apply a weight deduction during intake?',
        a: 'If a delivery contains excess moisture, dirt, or non-recyclable contamination, the intake operator can record a transparent moisture or dirt deduction percentage alongside the gross and tare weights. You can see the exact net accepted kilograms on your digital receipt.',
      },
      {
        q: 'When do agents get paid after delivering to a hub?',
        a: 'As soon as the intake operator confirms the scale verification and generates the waybill in the Hub MOS, the payout is queued for instant disbursement to your agent wallet or M-Pesa.',
      },
    ],
  },
  {
    category: 'Hub MOS Software',
    icon: Warehouse,
    description: 'Gate intake, scale verification, inventory ledger, and price intelligence.',
    questions: [
      {
        q: 'What does the Hub MOS manage?',
        a: 'The Hub Material Operating System (MOS) gives recovery hub teams one workspace for gate intake management, scale verification with gross/tare/deduction tracking, resident pickup dispatch, community collection drives, inventory ledgers, agent disbursements, and B2B sales.',
      },
      {
        q: 'Can we handle walk-in sellers alongside fleet drivers?',
        a: 'Yes. The Intake Terminal supports three dedicated workflows: Fleet Delivery Receiving with manifest verification, Registered Agent Intake via Klin-ID or phone lookup, and Walk-in & Drop-off Intake for ad-hoc residents and scrap sellers.',
      },
      {
        q: 'How does Price Intelligence help our hub set buying rates?',
        a: 'Price Intelligence tracks live KES/kg commodity benchmarks, 7-day and 30-day price changes, supply/demand signals, and top market movers across plastics, paper, glass, and metals so you can adjust facility buying prices without guessing.',
      },
      {
        q: 'Can we manage multiple recovery hubs under one organization?',
        a: 'Yes. Organizations can operate multiple hub locations with role-based access for gate operators, dispatchers, and finance leads while keeping inventory and financial records cleanly separated per facility.',
      },
    ],
  },
  {
    category: 'B2B Marketplace',
    icon: ShoppingCart,
    description: 'Verified material lots, Sourcing RFQs, bidding, and bulk procurement.',
    questions: [
      {
        q: 'How do recyclers and manufacturers source bulk materials?',
        a: 'Buyers can either browse verified material lots directly on the Market Board (filtering by material category, location radius, and available kilograms) or broadcast a Sourcing RFQ specifying target weight, grade, target price, and delivery method.',
      },
      {
        q: 'How do Sourcing RFQs work?',
        a: 'Create an RFQ with your required material, grade, target weight, KES/kg target price, and deadline. Verified aggregators and hubs submit competing quotes, which you can review side by side along with supplier ratings before awarding.',
      },
      {
        q: 'Can hubs sell processed stock directly on the B2B Market?',
        a: 'Yes. Once materials are verified and recorded in your hub inventory, you can list baled cardboard, PET flakes, HDPE regrind, or aluminum bales on the marketplace and manage incoming bids directly.',
      },
    ],
  },
  {
    category: 'Payments & Support',
    icon: Wallet,
    description: 'Disbursements, dispute resolution, and reaching our operations team.',
    questions: [
      {
        q: 'What payout methods are supported?',
        a: 'Klinflow supports digital wallet settlements with withdrawals to M-Pesa mobile money and Kenyan bank accounts. Every payout is tied to a verified intake receipt or completed B2B order for clear reconciliation.',
      },
      {
        q: 'What happens if there is a weight or quality disagreement?',
        a: 'Every intake records claimed weight, gross scale weight, tare weight, deductions, and operator notes on a digital waybill. If a dispute is raised, support and hub managers can review the exact intake log and resolve adjustments transparently.',
      },
      {
        q: 'How can I request a demo or get help with an active pickup?',
        a: 'For Hub MOS or B2B onboarding demos, submit a request through our Contact page or email support@klinflow.com. For live pickup or dispatch assistance, contact our operations desk via phone or WhatsApp at +254 113 787 588.',
      },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>('Platform Overview-0');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredCategories = faqs
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter((q) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          q.q.toLowerCase().includes(query) ||
          q.a.toLowerCase().includes(query) ||
          cat.category.toLowerCase().includes(query)
        );
      }),
    }))
    .filter((cat) => {
      if (selectedCategory !== 'all' && cat.category !== selectedCategory) {
        return false;
      }
      return cat.questions.length > 0;
    });

  const totalQuestions = faqs.reduce((acc, cat) => acc + cat.questions.length, 0);
  const matchingCount = filteredCategories.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );

  return (
    <Layout>
      <div className="w-full bg-white">
        {/* ── 1. CLEAN LIGHT HELP-CENTER HEADER ── */}
        <section className="pt-36 pb-14 md:pt-44 md:pb-16 px-6 bg-gradient-to-b from-[#edf3f9] via-[#f5f8fc] to-white border-b border-slate-200/80">
          <div className="max-w-5xl mx-auto text-center">
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#085078]/10 text-[#085078] border border-[#085078]/15 mb-5"
            >
              Help Desk &amp; Documentation
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-5 leading-[1.08]"
            >
              How can we <span className="text-[#1178ab]">help you?</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              Clear answers on selling recyclables, field collection, Hub MOS
              operations, and trading on the Klinflow B2B Marketplace.
            </motion.p>

            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="relative max-w-2xl mx-auto"
            >
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics — e.g. M-Pesa payouts, waybills, RFQs, PET bottles..."
                className="w-full pl-12 pr-24 py-4 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200/90 shadow-lg shadow-slate-900/5 outline-none text-sm sm:text-base focus:border-[#1178ab] focus:ring-2 focus:ring-[#1178ab]/15 transition-all"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-900 px-2.5 py-1 rounded-md bg-slate-100 cursor-pointer"
                >
                  Clear
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  {totalQuestions} articles
                </span>
              )}
            </motion.div>

            {/* Quick Horizontal Category Filter Pills (Mobile & Quick Jump) */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-7 lg:hidden">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                  selectedCategory === 'all'
                    ? 'bg-[#085078] text-white border-[#085078]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                All ({totalQuestions})
              </button>
              {faqs.map((cat) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    selectedCategory === cat.category
                      ? 'bg-[#085078] text-white border-[#085078]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. KNOWLEDGE BASE CONTENT (SIDEBAR INDEX + HAIRLINE ACCORDION) ── */}
        <section className="py-16 md:py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Left Column: Clean Borderless Category Index */}
              <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-28 space-y-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-3">
                    Topics
                  </p>
                  <nav className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer border-l-2 ${
                        selectedCategory === 'all'
                          ? 'border-[#1178ab] text-[#085078] bg-[#f0f7fc]'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Topics</span>
                      <span className="text-xs font-mono text-slate-400 tabular-nums">
                        {totalQuestions}
                      </span>
                    </button>

                    {faqs.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = selectedCategory === cat.category;
                      return (
                        <button
                          key={cat.category}
                          type="button"
                          onClick={() => setSelectedCategory(cat.category)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer border-l-2 ${
                            isActive
                              ? 'border-[#1178ab] text-[#085078] bg-[#f0f7fc]'
                              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 truncate pr-2">
                            <Icon
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-[#1178ab]' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{cat.category}</span>
                          </span>
                          <span className="text-xs font-mono text-slate-400 tabular-nums">
                            {cat.questions.length}
                          </span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Understated Direct Help Note */}
                <div className="pt-6 border-t border-slate-200/80 px-3">
                  <p className="text-sm font-bold text-slate-900 mb-1.5">
                    Need hands-on assistance?
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Our operations team can walk you through Hub MOS setup or
                    resolve an active pickup issue.
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1178ab] hover:text-[#085078] transition-colors"
                  >
                    <span>Contact our team</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </aside>

              {/* Right Column: Hairline-Divided FAQ Accordions */}
              <div className="lg:col-span-8">
                {searchQuery && (
                  <p className="text-xs font-medium text-slate-500 mb-6">
                    Showing <span className="font-bold text-slate-900">{matchingCount}</span>{' '}
                    {matchingCount === 1 ? 'result' : 'results'} for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}

                {filteredCategories.length === 0 ? (
                  <div className="py-16 px-6 rounded-2xl border border-slate-200/80 bg-slate-50/70 text-center">
                    <Search className="w-10 h-10 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      No matching questions found
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                      We couldn&apos;t find any answers matching &ldquo;{searchQuery}&rdquo;. Try a broader keyword or reset your filters.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#085078] text-white hover:bg-[#0a6191] transition-colors cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-14">
                    {filteredCategories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <div key={category.category}>
                          {/* Category Header */}
                          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#f0f7fc] border border-[#1178ab]/15 text-[#085078] flex items-center justify-center shrink-0 mt-0.5">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                  {category.category}
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                  {category.description}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-400 shrink-0 pt-1">
                              {category.questions.length} Qs
                            </span>
                          </div>

                          {/* Minimalist Hairline Accordion Rows */}
                          <div className="divide-y divide-slate-200/80 border-b border-slate-200/80">
                            {category.questions.map((faq, qIdx) => {
                              const id = `${category.category}-${qIdx}`;
                              const isOpen = openIndex === id;
                              return (
                                <div key={qIdx} className="group">
                                  <button
                                    type="button"
                                    onClick={() => toggleFAQ(id)}
                                    className="w-full py-5 flex items-start justify-between text-left gap-4 cursor-pointer focus:outline-none"
                                  >
                                    <span
                                      className={`text-base sm:text-[17px] font-semibold tracking-tight transition-colors ${
                                        isOpen
                                          ? 'text-[#085078]'
                                          : 'text-slate-900 group-hover:text-[#1178ab]'
                                      }`}
                                    >
                                      {faq.q}
                                    </span>
                                    <span
                                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors mt-0.5 ${
                                        isOpen
                                          ? 'bg-[#085078] text-white'
                                          : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                                      }`}
                                    >
                                      {isOpen ? (
                                        <Minus className="w-3.5 h-3.5" />
                                      ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {isOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                      >
                                        <p className="pb-6 pr-10 text-sm sm:text-base leading-relaxed text-slate-600">
                                          {faq.a}
                                        </p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. HAIRLINE-DIVIDED SUPPORT BAR ── */}
        <section className="py-16 md:py-20 px-6 bg-[#edf3f9] border-t border-slate-200/80">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-slate-300/70">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#1178ab] block mb-2">
                  Support Channels
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Still have questions?
                </h3>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold bg-[#085078] text-white hover:bg-[#0a6191] transition-all shadow-md shadow-[#085078]/15 self-start md:self-auto"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Open Contact Desk</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-300/70">
              <div className="py-5 md:py-0 md:pr-8 first:pt-0">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base mb-1.5">
                  <Mail className="w-4 h-4 text-[#1178ab]" />
                  <span>Email Support</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  For account help, wallet payouts, and general platform questions.
                </p>
                <a
                  href="mailto:support@klinflow.com"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#085078] hover:underline"
                >
                  <span>support@klinflow.com</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="py-5 md:py-0 md:px-8">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base mb-1.5">
                  <Phone className="w-4 h-4 text-[#1178ab]" />
                  <span>Hotline &amp; WhatsApp</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Live pickup and dispatch support, Monday to Friday, 8am – 6pm EAT.
                </p>
                <a
                  href="tel:+254113787588"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#085078] hover:underline"
                >
                  <span>+254 (0) 113 787 588</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="py-5 md:py-0 md:pl-8 last:pb-0">
                <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base mb-1.5">
                  <Warehouse className="w-4 h-4 text-[#1178ab]" />
                  <span>Hub MOS &amp; B2B Demos</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  Schedule a walkthrough for your recovery facility or trading team.
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#085078] hover:underline"
                >
                  <span>Request a Demo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
