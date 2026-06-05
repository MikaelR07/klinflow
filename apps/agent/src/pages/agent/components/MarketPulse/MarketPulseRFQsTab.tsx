import { Search, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { RFQ } from '../../types/marketPulse.types';

interface MarketPulseRFQsTabProps {
  filteredRFQs: RFQ[];
  navigate: (path: string) => void;
}

export default function MarketPulseRFQsTab({ filteredRFQs, navigate }: MarketPulseRFQsTabProps) {
  return (
    <motion.div
      key="rfqs-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-0.5"
    >
      {/* Discovery Entry */}
      <div className="px-4 py-2">
        <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest mb-1">Global Buy Requests</p>
        <p className="text-xs font-semibold text-slate-500">Businesses actively looking for materials right now.</p>
      </div>

      <div className="flex flex-col space-y-0.5">
        {filteredRFQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-800">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">No Requests Found</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px] mx-auto font-medium">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredRFQs.map((rfq) => (
            <div key={rfq.id} className="bg-white dark:bg-slate-800 rounded-none p-4 border-b border-slate-100 dark:border-slate-800/40 flex flex-col gap-3.5 group active:bg-slate-50 dark:active:bg-slate-850 transition-all">
              {/* Top Row: Company & Price */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mb-1.5 leading-none">Client Name:</p>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white capitalize tracking-tight leading-none">{rfq.company}</h4>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mb-1.5 leading-none">Offered Price</p>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-500 leading-none">KSh {rfq.price}<span className="text-[10px] text-slate-400 font-bold">/kg</span></p>
                </div>
              </div>

              {/* Middle row: Material, Quantity, and Deadline */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/40">
                <div>
                  <p className="text-xs text-slate-900 dark:text-white capitalize leading-none mb-1.5">
                    <span className="text-slate-400 font-bold mr-1">Material:</span>{rfq.material}
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-350 capitalize tracking-wide">
                    <span className="text-slate-400 mr-1">Required Weight:</span>{rfq.quantity}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600">
                  {rfq.deadline === 'Open' ? 'No Deadline' : `${rfq.deadline} Left`}
                </span>
              </div>

              {/* Meta details: Delivery, Offers */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold capitalize tracking-widest text-slate-400 dark:text-slate-500 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Delivery: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-0.5">{rfq.delivery}</span></span>
                </div>
                <div className="text-right">
                  Offers Submitted: <span className="text-slate-700 dark:text-slate-300 font-semibold normal-case ml-0.5">{rfq.offersSubmitted}</span>
                </div>
              </div>

              {/* Button */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => navigate(`/rfq/${rfq.id}`)}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider shadow-md shadow-primary/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  Fulfill Request <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
