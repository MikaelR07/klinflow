/**
 * Bulk Sourcing Hub — Industrial RFQ System (Alibaba Style)
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Search, Plus, Filter, 
  ArrowLeft, ArrowRight, Building2, 
  Clock, Scale, Tag, BadgeCheck,
  FileText, Send, CheckCircle2, AlertCircle,
  X, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function BulkSourcingHub() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('open'); // 'open', 'my-requests'

  // Dynamic RFQ State
  const [rfqs, setRfqs] = useState([
    { 
      id: 'RFQ-102', 
      material: 'PET Plastic Grade A', 
      quantity: 5000, 
      targetPrice: 45, 
      buyer: 'Coca-Cola Africa',
      location: 'Nairobi, KE',
      isVerified: true,
      deadline: '4h 22m',
      quotes: 4,
      lastBid: '12m ago',
      status: 'High Interest'
    },
    { 
      id: 'RFQ-105', 
      material: 'Baled HDPE Clear', 
      quantity: 2000, 
      targetPrice: 65, 
      buyer: 'Uni-Plastics',
      location: 'Mombasa, KE',
      isVerified: true,
      deadline: '1h 05m',
      quotes: 1,
      lastBid: '45m ago',
      status: 'Urgent'
    },
    { 
      id: 'RFQ-108', 
      material: 'Industrial Cardboard', 
      quantity: 10000, 
      targetPrice: 15, 
      buyer: 'Kapa Oil',
      location: 'Thika, KE',
      isVerified: true,
      deadline: '2d 12h',
      quotes: 0,
      lastBid: null,
      status: 'New'
    },
  ]);

  const [newRfq, setNewRfq] = useState({ material: '', quantity: '', targetPrice: '' });
  const [bidData, setBidData] = useState({ price: '', deliveryDate: '', notes: '' });

  const handlePostRfq = () => {
    if (!newRfq.material || !newRfq.quantity) return;
    
    const request = {
      id: `RFQ-${Math.floor(1000 + Math.random() * 9000)}`,
      ...newRfq,
      buyer: 'You (Weaver)',
      location: 'Your Yard',
      isVerified: true,
      deadline: '7d 00h',
      quotes: 0,
      lastBid: null,
      status: 'New'
    };

    setRfqs([request, ...rfqs]);
    setIsPosting(false);
    setNewRfq({ material: '', quantity: '', targetPrice: '' });
    toast.success("Broadcast Sent! 🚀", {
      description: "Your sourcing request is now live in the Global Hub."
    });
  };

  const handleSubmitBid = () => {
    toast.success("Quote Submitted! ✅", {
      description: `Your offer for ${isBidding.material} has been sent to the buyer.`
    });
    setIsBidding(null);
    setBidData({ price: '', deliveryDate: '', notes: '' });
  };

  return (
    <div className="animate-fade-in -mt-5 -mx-2 pb-24">
      {/* ── TOP NAV ── */}
      <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 relative">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 active:scale-95 transition-all z-10">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-base font-bold text-slate-900 dark:text-white">Request for quotation</h1>
        </div>

        <div className="w-10" /> {/* Ghost element for symmetry */}
      </div>

      <div className="space-y-6 mt-2 pb-24">
        {/* ── ANALYTICS STRIP ── */}
        <div className="grid grid-cols-3 gap-2 px-4">
          <div className="bg-blue-600 rounded-[0.45rem] p-3 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
            <TrendingUp className="absolute top-0 right-0 w-12 h-12 text-white/10 -mr-2 -mt-2" />
            <p className="text-[7px] font-bold uppercase tracking-widest opacity-80 mb-1">Open Requests</p>
            <h3 className="text-xl font-black leading-none">1.2k<span className="text-xs ml-0.5 opacity-60 font-medium">T</span></h3>
          </div>
          
          <div className="bg-white dark:bg-slate-800 rounded-[0.45rem] p-3 border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market</p>
            <div className="flex items-center gap-1">
              <h3 className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase">Bullish</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>

          <button 
            onClick={() => navigate('/procurement/create')}
            className="bg-indigo-600 rounded-[0.45rem] p-3 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden active:scale-95 transition-all text-left group"
          >
            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
              <Plus className="w-3 h-3 text-white" />
            </div>
            <FileText className="absolute bottom-0 right-0 w-10 h-10 text-white/10 -mr-2 -mb-2" />
            <p className="text-[7px] font-bold uppercase tracking-widest opacity-80 mb-1">Quick Action</p>
            <h3 className="text-sm font-black leading-none">Write quote</h3>
          </button>
        </div>

        {/* ── SEARCH ── */}
        <div className="px-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search material requests..." 
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[0.45rem] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white shadow-sm"
            />
          </div>
        </div>

        {/* ── TAB SELECTOR ── */}
        <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-[0.45rem] mx-4">
          <button 
            onClick={() => setActiveTab('open')}
            className={`flex-1 py-2 rounded-[0.4rem] text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'open' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            Global Requests
          </button>
          <button 
            onClick={() => setActiveTab('my-requests')}
            className={`flex-1 py-2 rounded-[0.4rem] text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'my-requests' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            My Sourcing
          </button>
        </div>

        <div className="space-y-4 px-4">
          {(activeTab === 'open' ? rfqs : rfqs.filter(r => r.buyer === 'You (Weaver)')).map((rfq) => (
            <motion.div 
              key={rfq.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/procurement/${rfq.id}`)}
              className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[0.45rem] p-5 shadow-sm group hover:border-blue-500/30 transition-all active:scale-[0.98] cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                    rfq.status === 'Urgent' ? 'bg-rose-500 text-white animate-pulse' : 
                    rfq.status === 'New' ? 'bg-blue-600 text-white' : 
                    'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {rfq.status}
                  </span>
                  {rfq.lastBid && (
                    <span className="text-[7px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" /> Last bid {rfq.lastBid}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Ends in {rfq.deadline}
                </span>
              </div>

              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{rfq.material}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">{rfq.buyer}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-xs font-bold text-slate-400">{rfq.location}</span>
                    {rfq.isVerified && (
                      <div className="flex items-center gap-1 ml-1 bg-blue-500/5 px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-3 h-3 text-blue-500" />
                        <span className="text-xs font-black text-blue-600 uppercase">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Target Price</p>
                  <p className="text-lg font-bold text-blue-600 font-mono">KSh {rfq.targetPrice}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-5 border-t border-slate-50 dark:border-slate-700/50">
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Volume</p>
                  <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300">
                    <Scale className="w-3 h-3" />
                    <span className="text-[11px] font-bold">{rfq.quantity.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-center border-x border-slate-50 dark:border-slate-700/50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quotes</p>
                  <div className="flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300">
                    <FileText className="w-3 h-3" />
                    <span className="text-[11px] font-bold">{rfq.quotes} Bids</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="w-full h-full text-blue-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1">
                    Submit <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.div>
        ))}
      </div>
    </div>



    </div>
  );
}

