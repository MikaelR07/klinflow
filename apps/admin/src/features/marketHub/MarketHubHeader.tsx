/**
 * MarketHub Header & Dashboard Stats
 * Extracted from MarketHub.tsx
 */
import { Coins, Scale } from 'lucide-react';
import type { NetworkStats } from './marketHub.types';

interface MarketHubHeaderProps {
  activeMaterialsCount: number;
}

export function MarketHubHeader({ activeMaterialsCount }: MarketHubHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-[1rem] bg-slate-900 text-white p-4">
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="space-y-4 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Coins className="w-6 h-6 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary">Service Marketplace</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Market Hub</h1>
          <p className="text-slate-400 text-sm max-w-md leading-relaxed">
            Define global material categories and monitor the operational capabilities of your PaaS tenants.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Active Materials</p>
            <p className="text-2xl font-semibold text-white">{activeMaterialsCount}</p>
          </div>
          <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Network Capacity</p>
            <p className="text-2xl font-semibold text-primary">Dynamic</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MarketHubNetworkCapabilitiesProps {
  stats: NetworkStats;
}

export function MarketHubNetworkCapabilities({ stats }: MarketHubNetworkCapabilitiesProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4 px-4">
        <Scale className="w-5 h-5 text-indigo-500" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Operational Limits</h2>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
      <p className="text-xs text-slate-400 font-medium px-4 -mt-4">
        Overview of the operational limits (Min/Max weights) currently set by individual agents and companies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Avg. Min Weight</p>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{(stats?.avgMinWeight || 0).toFixed(1)}<span className="text-sm font-semibold text-slate-400 ml-1">KG</span></h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Avg. Max Capacity</p>
          <h3 className="text-3xl font-semibold text-slate-900 dark:text-white">{Math.round(stats?.avgMaxCapacity || 0)}<span className="text-sm font-semibold text-slate-400 ml-1">KG</span></h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Most Popular Cat.</p>
          <h3 className="text-xl font-semibold text-indigo-500">Plastics</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[1rem] border border-slate-100 dark:border-slate-800 shadow-sm border-indigo-500/20">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-2">Matching Success</p>
          <h3 className="text-3xl font-semibold text-indigo-600">94%</h3>
        </div>
      </div>
    </section>
  );
}
