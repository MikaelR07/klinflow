import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  Package, Scale, Leaf, MapPin, 
  Download, Printer, ChevronLeft, 
  BarChart3, Activity, PieChart,
  Calendar, Building2, UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@cleanflow/core';

// CO2 Offset Multipliers (KG CO2 saved per KG material recycled)
// Source: EPA / Industry averages
const CO2_MULTIPLIERS = {
  recyclable: 1.5, // Mixed plastic
  ewaste: 2.2,
  organic: 0.8,
  hazardous: 1.2,
  metal: 4.5,
  glass: 0.3,
  plastic: 2.0,
  paper: 1.1,
};

const MATERIAL_LABELS = {
  recyclable: 'Plastics',
  ewaste: 'E-Waste',
  organic: 'Organic',
  hazardous: 'Hazardous',
  metal: 'Scrap Metal',
  glass: 'Glassware',
  plastic: 'PET Plastic',
  paper: 'Paper/Cardboard',
};

export default function EnvironmentalReport() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all'); // 'all' | 'month' | 'quarter'
  const reportRef = useRef();

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    let query = supabase
      .from('bookings')
      .select('id, waste_type, actual_weight_kg, estate, updated_at, agent_id')
      .eq('status', 'completed');

    const { data: bookings, error } = await query;
    if (!error) setData(bookings || []);
    setLoading(false);
  };

  // ── Metrics Aggregation ──────────────────────────────────────────
  const stats = useMemo(() => {
    const materialMap = {};
    const estateMap = {};
    let totalKg = 0;
    let totalCO2 = 0;

    data.forEach(b => {
      const kg = b.actual_weight_kg || 0;
      const type = b.waste_type?.toLowerCase() || 'recyclable';
      const estate = b.estate || 'Unknown';

      totalKg += kg;
      totalCO2 += kg * (CO2_MULTIPLIERS[type] || 1.0);

      materialMap[type] = (materialMap[type] || 0) + kg;
      estateMap[estate] = (estateMap[estate] || 0) + kg;
    });

    return {
      totalKg,
      totalCO2,
      byMaterial: Object.entries(materialMap)
        .map(([type, weight]) => ({
          type,
          label: MATERIAL_LABELS[type] || type,
          weight,
          co2: weight * (CO2_MULTIPLIERS[type] || 1.0),
          pct: totalKg > 0 ? (weight / totalKg) * 100 : 0
        }))
        .sort((a, b) => b.weight - a.weight),
      byEstate: Object.entries(estateMap)
        .map(([name, weight]) => ({ name, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 8)
    };
  }, [data]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20 print:p-0 print:space-y-4">
      
      {/* ── ACTION BAR (HIDDEN IN PRINT) ── */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm print:hidden">
        <button 
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-sm font-semibold text-slate-500"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Hub
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-semibold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* ── THE REPORT DOCUMENT ── */}
      <div ref={reportRef} className="bg-white dark:bg-slate-950 p-12 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl print:shadow-none print:border-none print:rounded-none print:p-0">
        
        {/* REPORT HEADER */}
        <div className="flex justify-between items-start border-b-4 border-primary pb-8 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                <Leaf className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Environmental Impact Report</h1>
            </div>
            <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-[0.3em]">CleanFlow PaaS Ecosystem · Quarterly Disclosure</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Report Reference</p>
            <p className="text-sm font-mono font-semibold dark:text-white">CF-EIR-{new Date().getFullYear()}-{(Math.random() * 10000).toFixed(0)}</p>
            <p className="text-xs text-slate-500 mt-1">{new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })}</p>
          </div>
        </div>

        {/* EXECUTIVE SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-[2rem] border border-emerald-100 dark:border-emerald-800/30">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white mb-4">
              <Scale className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Total Diversion</p>
            <h2 className="text-4xl font-semibold text-slate-900 dark:text-white">{stats.totalKg.toLocaleString()}<span className="text-sm ml-1 font-semibold">KG</span></h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Waste recovered from landfills</p>
          </div>

          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-[2rem] border border-indigo-100 dark:border-indigo-800/30">
            <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Carbon Offset</p>
            <h2 className="text-4xl font-semibold text-slate-900 dark:text-white">{stats.totalCO2.toLocaleString()}<span className="text-sm ml-1 font-semibold">KG CO₂e</span></h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Estimated greenhouse gas reduction</p>
          </div>

          <div className="p-6 bg-slate-900 rounded-[2rem] text-white">
             <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center text-primary mb-4">
               <MapPin className="w-5 h-5" />
             </div>
             <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Communities Served</p>
             <h2 className="text-4xl font-semibold">{Object.keys(stats.byEstate).length}</h2>
             <p className="text-[10px] text-slate-500 font-semibold mt-1">Active collection catchment areas</p>
          </div>
        </div>

        {/* MATERIAL BREAKDOWN */}
        <div className="space-y-8">
           <div>
             <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
               <PieChart className="w-4 h-4 text-primary" /> Material Stream Recovery
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {stats.byMaterial.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold dark:text-white">{m.label}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{m.weight.toLocaleString()} KG · {m.pct.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                       <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${m.pct}%` }} />
                    </div>
                  </div>
                ))}
             </div>
           </div>

           {/* ESTATE PERFORMANCE */}
           <div className="pt-8 border-t border-slate-100 dark:border-white/5">
             <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
               <Building2 className="w-4 h-4 text-indigo-500" /> Top Collection Estates
             </h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.byEstate.map((e, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase truncate">{e.name}</p>
                    <p className="text-xl font-semibold dark:text-white mt-1">{e.weight.toLocaleString()} <span className="text-[10px] text-slate-400">KG</span></p>
                  </div>
                ))}
             </div>
           </div>
        </div>

        {/* VERIFICATION STATEMENT */}
        <div className="mt-16 pt-8 border-t-2 border-slate-100 dark:border-white/5 grid grid-cols-2 gap-10 italic">
           <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase not-italic">Data Verification</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                This data is aggregated from verified weight logs captured by agents during the "Log Materials" phase of pickup. 
                All weights are subject to warehouse audit at the central processing hub.
              </p>
           </div>
           <div className="text-right flex flex-col items-end">
              <div className="w-24 h-12 bg-slate-100 dark:bg-slate-800 rounded flex items-center justify-center text-slate-300 font-mono text-[8px] mb-2 uppercase border border-dashed border-slate-300">
                 DIGITAL SIGNATURE
              </div>
              <p className="text-[10px] font-semibold text-slate-900 dark:text-white not-italic uppercase tracking-widest">CleanFlow Logistics Hub</p>
              <p className="text-[9px] text-slate-500 not-italic">Automated Systems Branch</p>
           </div>
        </div>

        {/* PRINT FOOTER */}
        <div className="hidden print:block mt-12 text-center text-[8px] text-slate-300 uppercase tracking-[0.5em]">
           CleanFlow PaaS · Sustainomics Engine · Verified Environmental Data
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 2cm; }
        }
      `}</style>
    </div>
  );
}
