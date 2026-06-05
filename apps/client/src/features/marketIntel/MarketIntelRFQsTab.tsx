/**
 * MarketIntel RFQs Tab — Live Buyer Requests
 * Extracted from MarketIntelligenceHub.tsx
 */
import { ArrowUpRight, Search, ShieldCheck, MapPin, Handshake, AlertCircle, CircleCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MarketIntelRFQ } from './marketIntel.types';

interface MarketIntelRFQsTabProps {
  filteredRFQs: MarketIntelRFQ[];
  navigate: (path: string) => void;
}

export default function MarketIntelRFQsTab({ filteredRFQs, navigate }: MarketIntelRFQsTabProps) {
  return (
    <motion.div
      key="rfqs-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 pb-5"
    >
      <div className="flex items-center justify-between px-2 pt-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Buy Requests</h3>
        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
          {filteredRFQs.length} Open
        </span>
      </div>

      {filteredRFQs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No RFQs Found</h3>
          <p className="text-[11px] text-slate-500 mt-2 max-w-[240px] mx-auto font-medium">There are currently no active buyer requests matching your criteria.</p>
        </div>
      ) : (
        filteredRFQs.map((rfq) => (
          <div key={rfq.id} className="bg-white dark:bg-slate-900 rounded-[1rem] px-4 py-3.5 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
            {/* Row 1: Company, Material, Price */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{rfq.company}</h4>
                {rfq.verified && (
                  <CircleCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white shrink-0 ml-3">KSh {rfq.price}<span className="text-[10px] text-slate-400 font-semibold">/kg</span></p>
            </div>

            {/* Row 2: Material + Inline Meta */}
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
              <span className="text-primary/80">{rfq.material}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="flex items-center gap-1"><Handshake className="w-3 h-3" />{rfq.quantity}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="flex items-center gap-1 truncate capitalize"><MapPin className="w-3 h-3" />{rfq.region}</span>
            </div>

            {/* Row 3: Deadline, Offers, Action */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-[10px] font-bold capitalise tracking-widest">
                <span className="flex items-center gap-1 text-rose-500">
                  <AlertCircle className="w-3 h-3" />Deadline: {rfq.deadline}
                </span>
                {rfq.offersSubmitted > 0 && (
                  <span className="text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-2.5">
                    {rfq.offersSubmitted} Offers
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate(`/rfq/${rfq.id}`)}
                className="flex items-center gap-1 text-[10px] font-bold text-white bg-primary px-3 py-1.5 rounded-lg active:scale-95 transition-all uppercase tracking-widest"
              >
                Respond <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))
      )}
    </motion.div>
  );
}
