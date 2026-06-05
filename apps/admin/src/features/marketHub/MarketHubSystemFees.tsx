/**
 * MarketHub System Fees
 * Extracted from MarketHub.tsx
 */
import { Zap, Activity, Truck, Wallet, ShieldCheck } from 'lucide-react';
import type { SystemFee } from './marketHub.types';

interface MarketHubSystemFeesProps {
  systemFees: SystemFee[];
  editingFeeKey: string | null;
  editFeeValue: string;
  setEditingFeeKey: (key: string | null) => void;
  setEditFeeValue: (val: string) => void;
  handleSaveFee: (key: string) => void;
}

export default function MarketHubSystemFees({
  systemFees, editingFeeKey, editFeeValue,
  setEditingFeeKey, setEditFeeValue, handleSaveFee
}: MarketHubSystemFeesProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-4">
        <Zap className="w-5 h-5 text-amber-500" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Global System Fees</h2>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-900" />
      </div>
      <p className="text-xs text-slate-400 font-medium px-4 -mt-4">
        Configure core platform economics, including withdrawal thresholds and platform-wide guardrails.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {systemFees.map((fee, index) => {
          const icons: Record<string, any> = {
            'fee_pickup': Truck,
            'fee_logistics': Activity,
            'fee_min_payout': Wallet,
            'fee_min_pickup': ShieldCheck
          };
          const Icon = icons[fee.key] || Activity;

          return (
            <div key={fee.key || index} className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-[1rem] bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <button
                  onClick={() => {
                    if (editingFeeKey === fee.key) {
                      handleSaveFee(fee.key);
                    } else {
                      setEditingFeeKey(fee.key);
                      setEditFeeValue((fee.value ?? 0).toString());
                    }
                  }}
                  className="text-xs font-semibold text-amber-600 uppercase tracking-widest hover:underline"
                >
                  {editingFeeKey === fee.key ? 'Save Change' : 'Edit Fee'}
                </button>
              </div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{fee.label}</p>
              <div className="flex items-baseline gap-2">
                {editingFeeKey === fee.key ? (
                  <input
                    autoFocus
                    type="number"
                    value={editFeeValue}
                    onChange={(e) => setEditFeeValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-2 rounded-xl text-2xl font-semibold text-amber-600 outline-none border border-amber-200"
                  />
                ) : (
                  <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{fee.value}</h3>
                )}
                <span className="text-xs font-semibold text-slate-500 uppercase">{fee.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
