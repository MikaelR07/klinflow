/**
 * RFQ Details — Industrial Bidding Terminal
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Scale, Clock, Building2, 
  BadgeCheck, FileText, Send, CheckCircle2,
  ShieldCheck, AlertCircle, TrendingUp, Info,
  MessageSquare, History, Phone, Mail, MapPin
} from 'lucide-react';
import { toast } from 'sonner';

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bidData, setBidData] = useState({ price: '', deliveryDate: '', notes: '' });

  // Mock Request Data (In real app, fetch by id)
  const rfq = {
    id: id || 'RFQ-102',
    material: 'PET Plastic Grade A',
    quantity: 5000,
    targetPrice: 45,
    buyer: 'Coca-Cola Africa',
    location: 'Nairobi, KE',
    isVerified: true,
    deadline: '4h 22m',
    quotes: 4,
    lastBid: '12m ago',
    description: 'Looking for high-purity Grade A PET flakes. Must be washed and free of PVC contamination. Monthly requirement of 10-20 tons for the next 12 months.',
    specs: [
      { label: 'Color', value: 'Clear/Light Blue' },
      { label: 'Form', value: 'Hot Washed Flakes' },
      { label: 'Moisture', value: '< 1%' },
      { label: 'PVC Content', value: '< 50 ppm' }
    ],
    marketPulse: {
      lowest: 38,
      average: 46,
      highest: 52
    },
    logistics: {
      incoterms: 'FOB (Free on Board)',
      inspection: 'SGS / Intertek Required',
      payment: 'Net 15 (After Verification)',
      port: 'ICD Embakasi, Nairobi'
    },
    buyerHistory: {
      joined: '2022',
      totalTrades: 145,
      rating: 4.9
    }
  };

  const stages = ['Posted', 'Quoting', 'Negotiating', 'Awarded'];
  const currentStage = 1; // 'Quoting'

  const handleBidSubmit = () => {
    if (!bidData.price || !bidData.deliveryDate) {
      toast.error("Please fill in the offer details");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Offer Broadcasted! 🚀", {
        description: `Your quote for ${rfq.material} has been sent to the buyer.`
      });
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="bg-white shadow-sm dark:bg-slate-900 min-h-screen">
      <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 min-h-screen relative animate-fade-in overflow-hidden shadow-sm">
        
        {/* ── IMMERSIVE HERO IMAGE (KILIMALL STYLE) ── */}
        <div className="relative h-64 overflow-hidden">
          <img 
            src="/images/pet_flakes.png" 
            alt={rfq.material}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20" />
          
          {/* Floating Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm active:scale-95 transition-all">
              <ArrowLeft className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
            <div className="flex gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="space-y-6 pt-6 px-4 pb-48">
          
          {/* ── TITLE SECTION ── */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-xs font-black uppercase tracking-widest">Live RFQ</span>
              <span className="px-2 py-0.5 rounded-md bg-white shadow-sm dark:bg-slate-800 text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> Ends in {rfq.deadline}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{rfq.material}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{rfq.buyer}</span>
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{rfq.location}</span>
            </div>
          </div>
          
          {/* ── LIFECYCLE TIMELINE ── */}
          <div className="py-8 border-y border-slate-50 dark:border-slate-800">
            <div className="flex items-center justify-between relative px-4">
              <div className="absolute top-[14px] left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
              <div 
                className="absolute top-[14px] left-0 h-0.5 bg-blue-600 z-0 transition-all duration-500" 
                style={{ width: `${(currentStage / (stages.length - 1)) * 100}%` }}
              />
              {stages.map((stage, i) => (
                <div key={stage} className="relative z-10 flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-black transition-all duration-300 ${i <= currentStage ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-black uppercase tracking-[0.1em] mt-3 ${i <= currentStage ? 'text-blue-600' : 'text-slate-700'}`}>
                    {stage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-[0.45rem] border border-slate-100 dark:border-slate-700">
              <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest mb-1">Total Requirement</p>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />
                <span className="text-xl font-black text-slate-900 dark:text-white">{rfq.quantity.toLocaleString()} <span className="text-xs opacity-40">KG</span></span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-[0.45rem] border border-slate-100 dark:border-slate-700">
              <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest mb-1">Target Price</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-xl font-black text-slate-900 dark:text-white">KSh {rfq.targetPrice} <span className="text-xs opacity-40">/KG</span></span>
              </div>
            </div>
          </div>

          {/* ── MARKET PULSE (Competitive Intel) ── */}
          <div className="bg-indigo-600 rounded-[0.45rem] p-5 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
            <TrendingUp className="absolute top-0 right-0 w-24 h-24 text-white/10 -mr-4 -mt-4" />
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-80 flex items-center gap-2">
              <Info className="w-3 h-3" /> Competitive Price Pulse
            </h3>
            <div className="grid grid-cols-3 gap-4 relative z-10">
              <div className="text-center">
                <p className="text-[7px] font-bold uppercase tracking-widest opacity-60 mb-1">Lowest Bid</p>
                <p className="text-sm font-black">KSh {rfq.marketPulse.lowest}</p>
              </div>
              <div className="text-center border-x border-white/10">
                <p className="text-[7px] font-bold uppercase tracking-widest opacity-60 mb-1">Avg Market</p>
                <p className="text-sm font-black">KSh {rfq.marketPulse.average}</p>
              </div>
              <div className="text-center">
                <p className="text-[7px] font-bold uppercase tracking-widest opacity-60 mb-1">Highest Bid</p>
                <p className="text-sm font-black">KSh {rfq.marketPulse.highest}</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-1/3 ml-[15%]" />
            </div>
          </div>

          {/* Requirement Description */}
          <div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-3">Buyer's Brief</p>
            <p className="text-sm text-slate-900 dark:text-slate-300 leading-relaxed font-medium">
              {rfq.description}
            </p>
          </div>

          {/* Technical Specs Table */}
          <div className="bg-white dark:bg-slate-800 rounded-[0.45rem] overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Technical Specs</h3>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="p-0">
              {rfq.specs.map((spec, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 bg-slate-50/20 dark:bg-transparent">
                  <span className="text-xs font-bold text-slate-700 uppercase">{spec.label}</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── LOGISTICS TERMINAL ── */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-[0.45rem] p-5 border border-slate-100 dark:border-slate-700">
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" /> Trade & Shipping Terms
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Loading Port</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{rfq.logistics.port}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Inspection Policy</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{rfq.logistics.inspection}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[7px] font-bold text-slate-700 uppercase tracking-widest">Payment Terms</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{rfq.logistics.payment}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Buyer Profile Mini */}
          <div className="bg-slate-900 rounded-[0.45rem] p-5 text-white">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl font-black">
                {rfq.buyer.charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold leading-none">{rfq.buyer}</h4>
                <p className="text-xs text-slate-700 mt-1 uppercase tracking-widest">Verified Trader • Since {rfq.buyerHistory.joined}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-4">
              <div className="text-center">
                <p className="text-xs text-slate-800 uppercase mb-1">Trades</p>
                <p className="text-xs font-black">{rfq.buyerHistory.totalTrades}</p>
              </div>
              <div className="text-center border-x border-white/5">
                <p className="text-xs text-slate-800 uppercase mb-1">Rating</p>
                <p className="text-xs font-black text-emerald-400">★ {rfq.buyerHistory.rating}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-800 uppercase mb-1">Status</p>
                <p className="text-xs font-black text-blue-400 uppercase">Trusted</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── BIDDING TERMINAL ── */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl z-50">
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <p className="absolute top-2 left-3 text-[7px] font-black text-slate-700 uppercase">Your Offer /KG</p>
                <input 
                  type="number" 
                  value={bidData.price}
                  onChange={(e) => setBidData({...bidData, price: e.target.value})}
                  placeholder={rfq.targetPrice}
                  className="w-full pt-5 pb-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black dark:text-white focus:border-blue-500 outline-none"
                />
              </div>
              <div className="relative">
                <p className="absolute top-2 left-3 text-[7px] font-black text-slate-700 uppercase">Earliest Ship</p>
                <input 
                  type="date" 
                  value={bidData.deliveryDate}
                  onChange={(e) => setBidData({...bidData, deliveryDate: e.target.value})}
                  className="w-full pt-5 pb-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black dark:text-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <button 
              onClick={handleBidSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 text-sm font-black uppercase tracking-widest transition-all ${
                isSubmitting ? 'bg-white shadow-sm text-slate-700' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><History className="w-5 h-5" /></motion.div>
              ) : (
                <>Submit Quote <Send className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
