/**
 * BookPickup Step 3 — Marketplace Summary & Pricing Breakdown
 * Extracted from BookPickup.tsx for modularity.
 */
import { Info as InfoIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface BookPickupSummaryStepProps {
  selected: any;
  quantity: number;
  activeRate: number;
  xpMultiplier: number;
  estimatedGFP: number;
  selectedAgent: any;
  selectedCompanyId: string | null;
  photo?: string | File | null;
}

export default function BookPickupSummaryStep({
  selected, quantity, activeRate,
  xpMultiplier, estimatedGFP,
  selectedAgent, selectedCompanyId, photo
}: BookPickupSummaryStepProps) {
  return (
    <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight italic px-2">Marketplace Summary</h2>
      
      {/* ── MATERIAL PREVIEW ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {photo ? (
          <div className="w-full aspect-video bg-slate-100 dark:bg-slate-800 relative">
            <img
              src={typeof photo === 'string' ? photo : URL.createObjectURL(photo)}
              alt="Material Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full aspect-video bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">No Image Provided</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-0">
        <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-4">Pickup Breakdown</p>

        {/* Material Info */}
        <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Recyclable Material</span>
            <span className="text-xs text-slate-400">{selected?.label || 'Waste'}</span>
          </div>
          <span className="text-sm font-semibold text-primary capitalize tracking-widest font-mono">{quantity} KG</span>
        </div>

        {/* Agent Info */}
        <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Agent Assigned</span>
            <span className="text-xs text-slate-400">
              {selectedAgent ? (selectedAgent.name || selectedAgent.full_name || 'Selected Agent') : (selectedCompanyId ? 'Selected Partner' : 'Open Pool (Fastest Available)')}
            </span>
          </div>
          <span className="text-xs font-semibold text-primary capitalize tracking-widest">{selectedAgent || selectedCompanyId ? 'Direct Request' : 'Open Request'}</span>
        </div>

        {/* Wallet Status */}
        <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Payment Status</span>
            <span className="text-xs text-slate-400">Via Klinflow Wallet</span>
          </div>
          <span className="text-xs font-semibold text-orange-500 capitalize tracking-widest">Awaiting Verification</span>
        </div>

        {/* Estimated Reward Display */}
        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2 mb-4 mt-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-primary capitalize tracking-widest leading-none">Environmental XP</span>
              <span className="text-xs text-slate-400 mt-1">Tier Multiplier: {xpMultiplier}x</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-primary font-mono">{estimatedGFP} GFP</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="pt-4 flex gap-2">
          <InfoIcon className="w-3 h-3 text-slate-400 shrink-0" />
          <p className="text-xs font-medium text-slate-400 leading-tight italic">
            Final KSh payout will be determined by the agent using digital scales upon arrival.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl text-center relative overflow-hidden  transition-all bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 mt-6">

        <div className="space-y-4">
          <p className="text-xs font-semibold capitalize tracking-[0.3em] text-primary mb-4">Direct Verification</p>
          <h3 className="text-2xl font-semibold tracking-tighter mt-1  text-slate-900 dark:text-white">Payout on Weight Verification</h3>
          <p className="text-xs font-semibold text-slate-400 mt-4 leading-relaxed">
            Agents have Different Rates Currently We're Using <span className="text-slate-900 dark:text-white">KSh {activeRate}/kg</span> {selectedAgent || selectedCompanyId ? 'rate offered by your selected partner' : 'standard market rate'}.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
