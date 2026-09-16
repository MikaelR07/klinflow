import React, { useEffect, useState } from 'react';
import { useMarketIntelligenceStore } from '@klinflow/core/stores/marketIntelligenceStore';
import { CommodityTrend } from '@klinflow/core/stores/marketIntelligenceStore.types';
import MarketKpis from './PriceDashboard/components/MarketKpis';
import MaterialPricesTable from './PriceDashboard/components/MaterialPricesTable';
import MaterialDetailsPanel from './PriceDashboard/components/MaterialDetailsPanel';
import MarketInsightsSidebar from './PriceDashboard/components/MarketInsightsSidebar';

export default function PriceDashboard() {
  const { fetchIntelligence, isLoading } = useMarketIntelligenceStore();
  const [selectedMaterial, setSelectedMaterial] = useState<CommodityTrend | null>(null);

  useEffect(() => {
    fetchIntelligence();
  }, [fetchIntelligence]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      
      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in custom-scrollbar space-y-6 pb-12">
        
        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Price Intelligence Dashboard</h1>
              <span className="font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Commodity Index
              </span>
            </div>
            <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest">
              Real-time scrap market benchmarks, 7-day velocity trends, and regional demand intelligence.
            </p>
          </div>
        </div>

        {/* MAIN 2-COLUMN SECTION */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
          
          {/* MAIN LEFT SECTION (3 COLS): KPIs + PRICES TABLE */}
          <div className="xl:col-span-3 space-y-6">
            <MarketKpis />
            <MaterialPricesTable onSelectMaterial={setSelectedMaterial} />
          </div>

          {/* MARKET INSIGHTS SIDEBAR (RIGHT 1 COL) */}
          <div className="xl:col-span-1 space-y-6">
            <MarketInsightsSidebar />
          </div>

        </div>
      </div>
      
      {/* MODAL OVERLAYS */}
      <MaterialDetailsPanel 
        selectedMaterial={selectedMaterial} 
        onClose={() => setSelectedMaterial(null)} 
      />
    </div>
  );
}
