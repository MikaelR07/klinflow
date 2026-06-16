/**
 * MarketIntel RFQs Tab — Live Buyer Requests
 * Extracted from MarketIntelligenceHub.tsx
 */
import { ArrowUpRight, Search, ShieldCheck, MapPin, Handshake, AlertCircle, CircleCheck, Package, Flame, Bookmark, Scale, Clock, User, Recycle } from 'lucide-react';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
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
      className="space-y-1 pb-5 px-1.5"
    >
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Buy Requests</h3>
          <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 ml-0.5 bg-emerald-50 dark:bg-emerald-900/30 px-1 py-0.5 rounded">Live</span>
        </div>
        <button className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700">
          {filteredRFQs.length} Open <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      {filteredRFQs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">No RFQs Found</h3>
          <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] mx-auto font-medium">There are currently no active buyer requests matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredRFQs.map((rfq) => (
            <div key={rfq.id} className="bg-white dark:bg-slate-900 -mx-1.5 p-2 px-3 border-y border-slate-100 dark:border-slate-800 shadow-sm transition-colors group">
              {/* Row 1: Tags & Price */}
              <div className="flex justify-between items-start mb-1">
                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                  <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 rounded text-[9px] font-bold">
                    <Recycle className="w-3 h-3" />
                    {rfq.material}
                  </span>
                  {rfq.price > 50 && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 rounded text-[9px] font-bold">
                      <Flame className="w-3 h-3" />
                      High Value
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-2 mt-4">
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500  leading-none">
                      KSh {rfq.price} <span className="text-[10px] text-slate-400 font-semibold">/kg</span>
                    </p>
                  </div>
                  <button className="text-slate-300 hover:text-slate-400 dark:text-slate-600 transition-colors">
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Buyer Profile */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {(rfq as any).sellerImage || (rfq as any).avatar ? (
                    <img src={getThumbnailUrl((rfq as any).sellerImage || (rfq as any).avatar, { width: 150 })} className="w-full h-full object-cover" alt={rfq.company} />
                  ) : (
                    <User className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    <h4 className="text-[14px] font-semibold text-slate-900 dark:text-white leading-none">{rfq.company}</h4>
                    {rfq.verified && <CircleCheck className="w-4 h-4 text-blue-500" fill="currentColor" stroke="white" strokeWidth={2} />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                    {rfq.verified && (
                      <span className="flex items-center gap-0.5 ">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" /> Verified Buyer
                      </span>
                    )}
                   
                  </div>
                </div>
              </div>

              {/* Row 3: Key Details */}
              <div className="flex items-center gap-6 border-t border-slate-200 dark:border-slate-800 pt-2 pb-2 ">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                    <Scale className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.quantity}</p>
                    <p className="text-[9px] font-semibold text-slate-400 leading-none">Quantity</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-none mb-0.5">{rfq.region}</p>
                    <p className="text-[9px] font-semibold text-slate-400 leading-none">Location</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-rose-500 leading-none mb-0.5">{rfq.deadline}</p>
                    <p className="text-[9px] font-semibold text-slate-400 leading-none">Deadline</p>
                  </div>
                </div>
                
              </div>

              {/* Row 4: Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  {(rfq as any).postedAt ? `Posted ${(rfq as any).postedAt}` : 'Posted 3 hrs ago'}
                </div>
                <div className="flex items-center gap-1.5">
                  
                  <button 
                    onClick={() => navigate(`/rfq/${rfq.id}`)}
                    className="px-3 py-1.5 bg-primary text-white text-[12px] font-bold rounded-lg flex items-center gap-1 transition-colors "
                  >
                    Respond <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
