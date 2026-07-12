import React, { useState } from 'react';
import { ChevronDown, MessageCircle, HelpCircle, Search } from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import Layout from '../layouts/Layout';

const faqs = [
  {
    category: "Getting Started",
    questions: [
      { q: "What is Klinflow?", a: "Klinflow is an end-to-end industrial waste management and recycling operating system. It connects households, independent collection agents, fleet logistics managers, and large-scale material processing hubs into a single unified digital ecosystem — streamlining the entire lifecycle of recyclable materials from source to sale." },
      { q: "Who is Klinflow designed for?", a: "Klinflow serves four distinct user groups: (1) Residents & Sellers who want to sell waste materials from their homes or businesses, (2) Collection Agents who pick up and transport materials, (3) Fleet Managers who oversee agent operations, dispatching, and vehicles, and (4) Hub Operators who manage industrial-scale material intake, sorting, processing, and resale." },
      { q: "Is Klinflow available in my country?", a: "Klinflow is currently operational across multiple African markets including Kenya, Nigeria, Ghana, and South Africa. We are actively expanding into Southeast Asia and Latin America. Contact our partnerships team to discuss availability in your region." },
      { q: "How much does Klinflow cost?", a: "Klinflow offers tiered pricing. The Client App (for sellers) and Agent App (for collectors) are completely free to download and use. The Hub MOS (Material Operating System) is licensed on a per-facility basis with volume-based pricing. Contact sales for a custom quote tailored to your operation's scale." },
    ]
  },
  {
    category: "Client / Seller App",
    questions: [
      { q: "How do I sell my recyclable waste?", a: "Download the Klinflow Client App, create an account, and post a listing for your materials. Specify the type (PET, HDPE, cardboard, metals, etc.), estimated weight, and your preferred pickup time. An available agent in your area will accept the job and come collect the materials directly from your location." },
      { q: "How do I get paid as a seller?", a: "Once an agent picks up your materials and they are verified at the processing hub, payment is instantly credited to your in-app wallet. You can withdraw funds to your bank account, mobile money (M-Pesa, MTN MoMo), or keep a balance for future transactions." },
      { q: "What types of materials can I sell?", a: "Klinflow supports a wide range of recyclable materials including PET bottles, HDPE containers, PP plastics, aluminum cans, cardboard, paper, glass, e-waste, copper, and ferrous/non-ferrous metals. The specific materials accepted depend on hub capabilities in your area." },
      { q: "Is there a minimum quantity to sell?", a: "There is no strict minimum for posting a listing, but agents are more likely to accept jobs with a reasonable volume. We recommend a minimum of 5kg for plastics and 10kg for paper/cardboard to make the pickup worthwhile for both parties." },
      { q: "Can I track my pickup in real-time?", a: "Yes. Once an agent accepts your pickup request, you can track their location in real-time on the map, receive ETA updates, and get instant notifications when they arrive at your location." },
    ]
  },
  {
    category: "Agent / Collector App",
    questions: [
      { q: "How do I become a Klinflow agent?", a: "Download the Klinflow Agent App and complete the onboarding process which includes identity verification (KYC), a brief training module on material identification, and linking your payment method. Once approved, you can immediately start accepting pickup requests in your service area." },
      { q: "How are agent payments processed?", a: "Agents earn based on the materials they collect. When materials are delivered to a processing hub and pass quality verification (weight, contamination check), the corresponding payment is instantly deposited into your in-app digital wallet. Withdrawals to bank accounts and mobile money are processed within 24 hours." },
      { q: "Can I choose which pickups to accept?", a: "Absolutely. The app shows you available pickup requests with material type, estimated weight, distance, and estimated earnings. You can accept or decline any job based on your preferences, schedule, and current location." },
      { q: "What happens if materials fail quality checks?", a: "If materials are rejected or downgraded at the hub due to contamination or misclassification, the payout is adjusted accordingly. The app provides detailed feedback on rejections so you can improve future collections. Persistent quality issues may trigger additional training modules." },
      { q: "Is there a rating system?", a: "Yes. Both sellers and hub operators rate agents after each transaction. Your rating affects your visibility in the job queue — higher-rated agents get priority access to premium pickup requests." },
    ]
  },
  {
    category: "Hub / MOS Software",
    questions: [
      { q: "What is the Hub MOS?", a: "The Hub Material Operating System (MOS) is Klinflow's enterprise-grade web dashboard for processing facility operators. It provides comprehensive tools for intake management, material verification, fleet coordination, automated financial disbursements, inventory tracking, batch processing, dispute resolution, and operational analytics." },
      { q: "Can I manage multiple hub locations?", a: "Yes. The Hub MOS supports multi-site operations with centralized reporting. Each facility can have its own team, inventory, and operational configuration while rolling up into a single executive dashboard for company-wide visibility." },
      { q: "How does the intake process work?", a: "Materials arriving at the hub go through a digital intake flow: agent check-in, material identification and weighing, quality grading (with optional AI-assisted contamination detection), photo documentation, and automated payout calculation. The entire process is paperless and produces an immutable audit trail." },
      { q: "What financial tools are included?", a: "The Hub MOS includes agent disbursement management, seller payouts, automated payment approvals, accounts receivable/payable tracking, expense management, procurement and purchase orders, invoice generation, and comprehensive financial reporting with export capabilities." },
      { q: "Is the data secure?", a: "Klinflow employs enterprise-grade security: AES-256 encryption at rest, TLS 1.3 in transit, Role-Based Access Control (RBAC), multi-factor authentication, immutable transaction ledgers, and SOC 2 Type II compliance. All financial data is processed through PCI DSS-compliant infrastructure." },
    ]
  },
  {
    category: "Fleet Management",
    questions: [
      { q: "What fleet management capabilities does Klinflow offer?", a: "Klinflow's Fleet Manager provides real-time GPS tracking of all agents and vehicles, intelligent route optimization, automated dispatch assignments, vehicle maintenance scheduling, fuel tracking, driver performance analytics, and comprehensive fleet reporting dashboards." },
      { q: "Can I set custom service zones?", a: "Yes. You can define geographic service boundaries (geofences) for your fleet operations. Agents are automatically assigned pickups within their designated zones, and alerts are triggered if vehicles leave their approved areas." },
      { q: "How does route optimization work?", a: "Our routing engine uses machine learning to optimize pickup sequences based on real-time traffic data, material volumes, vehicle capacity, driver availability, and time windows. This typically reduces fuel costs by 15-30% and increases daily pickup volumes by up to 40%." },
    ]
  },
  {
    category: "Technical & Integration",
    questions: [
      { q: "Does Klinflow integrate with existing ERP systems?", a: "Yes. The Klin API provides RESTful endpoints for integrating with SAP, Oracle, Microsoft Dynamics, and other ERP platforms. We also support webhook-based event streaming for real-time data synchronization with your existing business systems." },
      { q: "What is the Klin API?", a: "The Klin API is our developer platform that exposes programmatic access to material tracking, pricing intelligence, transaction data, fleet telemetry, and reporting endpoints. It enables third-party integrations, custom dashboards, and automated workflows." },
      { q: "What are the platform uptime guarantees?", a: "Klinflow maintains a 99.95% uptime SLA for enterprise customers. Our infrastructure is deployed across multiple availability zones with automatic failover, and we provide a public status page for real-time system health monitoring." },
    ]
  }
];

export default function FAQ() {
  const { isDarkMode } = useThemeStore();
  const [openIndex, setOpenIndex] = useState<string | null>("Getting Started-0");
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const toggleFAQ = (id: string) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const filteredFaqs = faqs.map(section => ({
    ...section,
    questions: section.questions.filter(faq => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q);
      }
      return true;
    })
  })).filter(section => {
    if (activeCategory && section.category !== activeCategory) return false;
    return section.questions.length > 0;
  });

  const categories = faqs.map(s => s.category);
  const totalQuestions = faqs.reduce((sum, s) => sum + s.questions.length, 0);

  return (
    <Layout>
      <div className="pb-20">
        
        {/* Hero */}
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-12">
          <div className="text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-8 border ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <HelpCircle className="w-3.5 h-3.5" /> Knowledge Base
            </div>
            <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Frequently Asked Questions
            </h1>
            <p className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {totalQuestions} answers covering every aspect of the Klinflow ecosystem — from selling your first kilo of waste to managing industrial-scale processing operations.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6">

          {/* Search & Category Filters */}
          <div className={`p-6 rounded-2xl border mb-10 ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="relative mb-5">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions... e.g. 'how do I get paid'"
                className={`w-full pl-12 pr-4 py-3.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDarkMode ? 'bg-surface-950 border-white/10 text-white placeholder:text-slate-500 focus:border-emerald-500/50' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500/50'}`}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!activeCategory ? (isDarkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white') : (isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200')}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeCategory === cat ? (isDarkMode ? 'bg-emerald-500 text-white' : 'bg-emerald-500 text-white') : (isDarkMode ? 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200')}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Sections */}
          {filteredFaqs.length === 0 ? (
            <div className="py-20 text-center">
              <Search className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No results found</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Try a different search term or browse all categories.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredFaqs.map((section, sIdx) => (
                <div key={sIdx}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1.5 h-7 bg-emerald-500 rounded-full" />
                    <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{section.category}</h2>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{section.questions.length}</span>
                  </div>
                  <div className="space-y-3">
                    {section.questions.map((faq, qIdx) => {
                      const id = `${section.category}-${qIdx}`;
                      const isOpen = openIndex === id;
                      return (
                        <div 
                          key={qIdx} 
                          className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                            isDarkMode 
                              ? isOpen ? 'bg-surface-900 border-emerald-500/30 shadow-lg shadow-emerald-500/5' : 'bg-surface-900 border-white/5 hover:border-white/10'
                              : isOpen ? 'bg-white border-emerald-200 shadow-lg shadow-emerald-500/5' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <button
                            onClick={() => toggleFAQ(id)}
                            className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                          >
                            <span className={`font-semibold pr-4 transition-colors ${isOpen ? 'text-emerald-500' : (isDarkMode ? 'text-slate-200 group-hover:text-white' : 'text-slate-800 group-hover:text-slate-900')}`}>
                              {faq.q}
                            </span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${isOpen ? 'bg-emerald-500/10 rotate-180' : (isDarkMode ? 'bg-white/5' : 'bg-slate-100')}`}>
                              <ChevronDown className={`w-4 h-4 transition-colors ${isOpen ? 'text-emerald-500' : 'text-slate-400'}`} />
                            </div>
                          </button>
                          {isOpen && (
                            <div className={`px-6 pb-6 text-sm leading-[1.8] ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Still have questions CTA */}
          <div className={`mt-20 p-10 sm:p-14 rounded-3xl text-center border relative overflow-hidden ${isDarkMode ? 'bg-surface-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/20'}`}>
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10">
              <MessageCircle className={`w-10 h-10 mx-auto mb-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Still have questions?</h3>
              <p className={`mb-8 max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Can't find the answer you're looking for? Our support team is available 24/7 to help.
              </p>
              <a href="/contact" className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25">
                Contact Support
              </a>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
