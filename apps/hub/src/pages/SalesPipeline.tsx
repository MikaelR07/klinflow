import { useState, useRef, useCallback } from 'react';
import { 
  Search, Plus, Filter, MoreVertical, GripVertical,
  Building2, User, DollarSign, Calendar, Phone,
  Mail, ArrowUpRight, TrendingUp, Target, Trophy,
  X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── TYPES ──────────────────────────────────────────────────────────
interface Deal {
  id: string;
  company: string;
  contact: string;
  value: number;
  material: string;
  probability: number;
  daysInStage: number;
  priority: 'high' | 'medium' | 'low';
  lastActivity: string;
  avatar?: string;
}

interface Stage {
  id: string;
  label: string;
  color: string;
  bgGradient: string;
  dotColor: string;
  deals: Deal[];
}

// ── MOCK DATA ──────────────────────────────────────────────────────
const INITIAL_STAGES: Stage[] = [
  {
    id: 'lead',
    label: 'New Lead',
    color: 'text-slate-600 dark:text-slate-300',
    bgGradient: 'from-slate-500/10 to-slate-500/5',
    dotColor: 'bg-slate-400',
    deals: [
      { id: 'd1', company: 'Nairobi Bottlers Ltd', contact: 'James Mwangi', value: 1250000, material: 'PET Clear Flakes', probability: 10, daysInStage: 2, priority: 'high', lastActivity: '2 hrs ago' },
      { id: 'd2', company: 'Thika Plastics Inc', contact: 'Aisha Mohamed', value: 780000, material: 'HDPE Natural', probability: 15, daysInStage: 5, priority: 'medium', lastActivity: '1 day ago' },
    ]
  },
  {
    id: 'contacted',
    label: 'Contacted',
    color: 'text-blue-600 dark:text-blue-400',
    bgGradient: 'from-blue-500/10 to-blue-500/5',
    dotColor: 'bg-blue-500',
    deals: [
      { id: 'd3', company: 'East Africa Packaging', contact: 'Peter Ochieng', value: 3400000, material: 'OCC Cardboard', probability: 25, daysInStage: 3, priority: 'high', lastActivity: '4 hrs ago' },
    ]
  },
  {
    id: 'negotiating',
    label: 'Negotiating',
    color: 'text-amber-600 dark:text-amber-400',
    bgGradient: 'from-amber-500/10 to-amber-500/5',
    dotColor: 'bg-amber-500',
    deals: [
      { id: 'd4', company: 'Mombasa Steel Corp', contact: 'Hassan Ali', value: 5600000, material: 'Aluminium Scrap', probability: 50, daysInStage: 7, priority: 'high', lastActivity: '6 hrs ago' },
      { id: 'd5', company: 'Green Recyclers KE', contact: 'Sarah Wanjiku', value: 920000, material: 'Mixed Plastics', probability: 40, daysInStage: 4, priority: 'low', lastActivity: '2 days ago' },
    ]
  },
  {
    id: 'quote_sent',
    label: 'Quote Sent',
    color: 'text-purple-600 dark:text-purple-400',
    bgGradient: 'from-purple-500/10 to-purple-500/5',
    dotColor: 'bg-purple-500',
    deals: [
      { id: 'd6', company: 'Kamau & Sons Plastics', contact: 'David Kamau', value: 2100000, material: 'PET Bottles (Baled)', probability: 60, daysInStage: 2, priority: 'medium', lastActivity: '1 hr ago' },
    ]
  },
  {
    id: 'contract_signed',
    label: 'Contract Signed',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgGradient: 'from-indigo-500/10 to-indigo-500/5',
    dotColor: 'bg-indigo-500',
    deals: [
      { id: 'd7', company: 'Eldoret Paper Mills', contact: 'Grace Chebet', value: 4200000, material: 'White Office Paper', probability: 80, daysInStage: 1, priority: 'high', lastActivity: '30 min ago' },
    ]
  },
  {
    id: 'won',
    label: 'Won',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgGradient: 'from-emerald-500/10 to-emerald-500/5',
    dotColor: 'bg-emerald-500',
    deals: [
      { id: 'd8', company: 'Kisumu Glass Works', contact: 'Brian Otieno', value: 1800000, material: 'Clear Glass Cullet', probability: 100, daysInStage: 0, priority: 'medium', lastActivity: 'Today' },
    ]
  },
  {
    id: 'lost',
    label: 'Lost',
    color: 'text-rose-600 dark:text-rose-400',
    bgGradient: 'from-rose-500/10 to-rose-500/5',
    dotColor: 'bg-rose-500',
    deals: [
      { id: 'd9', company: 'Nakuru Metals Ltd', contact: 'Patrick Kipchoge', value: 650000, material: 'Copper Wire', probability: 0, daysInStage: 12, priority: 'low', lastActivity: '5 days ago' },
    ]
  },
];

// ── HELPER FUNCTIONS ───────────────────────────────────────────────
const formatCurrency = (value: number) => {
  if (value >= 1000000) return `KSh ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `KSh ${(value / 1000).toFixed(0)}K`;
  return `KSh ${value}`;
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high': return { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' };
    case 'medium': return { label: 'Med', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' };
    default: return { label: 'Low', bg: 'bg-slate-500/10', text: 'text-slate-500', dot: 'bg-slate-400' };
  }
};

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function SalesPipeline() {
  const [stages, setStages] = useState<Stage[]>(INITIAL_STAGES);
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedDeal, setDraggedDeal] = useState<{ deal: Deal; fromStageId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedDealStage, setSelectedDealStage] = useState<string>('');

  const scrollRef = useRef<HTMLDivElement>(null);

  // ── PIPELINE KPIs ────────────────────────────────────────────────
  const allDeals = stages.flatMap(s => s.deals);
  const totalPipelineValue = allDeals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = allDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const wonValue = stages.find(s => s.id === 'won')?.deals.reduce((sum, d) => sum + d.value, 0) || 0;
  const totalDeals = allDeals.length;
  const wonDeals = stages.find(s => s.id === 'won')?.deals.length || 0;
  const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

  // ── DRAG & DROP HANDLERS ─────────────────────────────────────────
  const handleDragStart = useCallback((deal: Deal, stageId: string) => {
    setDraggedDeal({ deal, fromStageId: stageId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(stageId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedDeal || draggedDeal.fromStageId === toStageId) {
      setDraggedDeal(null);
      return;
    }

    setStages(prev => {
      const updated = prev.map(stage => {
        if (stage.id === draggedDeal.fromStageId) {
          return { ...stage, deals: stage.deals.filter(d => d.id !== draggedDeal.deal.id) };
        }
        if (stage.id === toStageId) {
          // Update probability based on stage
          const probabilityMap: Record<string, number> = {
            lead: 10, contacted: 25, negotiating: 50,
            quote_sent: 60, contract_signed: 80, won: 100, lost: 0
          };
          const updatedDeal = { 
            ...draggedDeal.deal, 
            probability: probabilityMap[toStageId] ?? draggedDeal.deal.probability,
            daysInStage: 0 
          };
          return { ...stage, deals: [...stage.deals, updatedDeal] };
        }
        return stage;
      });
      return updated;
    });

    setDraggedDeal(null);
  }, [draggedDeal]);

  const handleDragEnd = useCallback(() => {
    setDraggedDeal(null);
    setDropTarget(null);
  }, []);

  // ── SEARCH FILTER ────────────────────────────────────────────────
  const filteredStages = stages.map(stage => ({
    ...stage,
    deals: stage.deals.filter(d =>
      d.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contact.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.material.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }));

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="shrink-0 p-4 md:p-6 pb-0 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Sales Pipeline</h1>
                <span className="font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] uppercase tracking-widest">CRM</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Manage deals across stages. Drag cards to move them through your pipeline.</p>
            </div>
            <div className="flex gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                />
              </div>
              <button className="p-2.5 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
              <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" /> New Deal
              </button>
            </div>
          </div>

          {/* ── KPI STRIP ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue), icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', trend: '+18%' },
              { label: 'Weighted Revenue', value: formatCurrency(weightedValue), icon: Target, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10', trend: '+12%' },
              { label: 'Deals Won', value: formatCurrency(wonValue), icon: Trophy, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', trend: '+8%' },
              { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', trend: `${totalDeals} deals` },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-[#131722] dark:text-white leading-none">{kpi.value}</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3 h-3" /> {kpi.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── KANBAN BOARD ───────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden p-4 md:px-6 md:py-4"
        >
          <div className="flex gap-4 h-full min-w-max pb-4">
            {filteredStages.map(stage => {
              const stageValue = stage.deals.reduce((sum, d) => sum + d.value, 0);
              const isDropping = dropTarget === stage.id && draggedDeal?.fromStageId !== stage.id;

              return (
                <div
                  key={stage.id}
                  className={`w-[300px] shrink-0 flex flex-col rounded-2xl border transition-all duration-200 ${
                    isDropping
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                      : 'border-[#e0e3eb] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                  }`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  {/* Column Header */}
                  <div className="shrink-0 px-4 py-3.5 border-b border-[#e0e3eb] dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                        <h3 className={`text-[11px] font-bold uppercase tracking-widest ${stage.color}`}>{stage.label}</h3>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/50 rounded-md px-1.5 py-0.5">{stage.deals.length}</span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400">{formatCurrency(stageValue)}</p>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
                    {stage.deals.length === 0 && (
                      <div className={`h-24 flex items-center justify-center border-2 border-dashed rounded-xl text-xs font-medium transition-colors ${
                        isDropping ? 'border-indigo-400 text-indigo-500' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}>
                        {isDropping ? 'Drop here' : 'No deals'}
                      </div>
                    )}

                    <AnimatePresence mode="popLayout">
                      {stage.deals.map(deal => {
                        const priority = getPriorityConfig(deal.priority);
                        const isDragging = draggedDeal?.deal.id === deal.id;

                        return (
                          <motion.div
                            key={deal.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 0.95 : 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            draggable
                            onDragStart={() => handleDragStart(deal, stage.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => { setSelectedDeal(deal); setSelectedDealStage(stage.label); }}
                            className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all group select-none"
                          >
                            {/* Card Header */}
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-[#131722] dark:text-white leading-tight truncate">{deal.company}</p>
                                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                    <User className="w-3 h-3 shrink-0" /> {deal.contact}
                                  </p>
                                </div>
                              </div>
                              <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                            </div>

                            {/* Material */}
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{deal.material}</p>

                            {/* Value & Probability */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-black text-[#131722] dark:text-white">{formatCurrency(deal.value)}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${priority.bg} ${priority.text}`}>
                                {priority.label}
                              </span>
                            </div>

                            {/* Probability Bar */}
                            <div className="mb-3">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Win Probability</span>
                                <span className="text-[10px] font-bold text-[#131722] dark:text-white">{deal.probability}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-500 ${
                                    deal.probability >= 80 ? 'bg-emerald-500' :
                                    deal.probability >= 50 ? 'bg-amber-500' :
                                    deal.probability >= 25 ? 'bg-blue-500' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${deal.probability}%` }}
                                />
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                              <span className="text-[10px] text-slate-400 font-medium">{deal.lastActivity}</span>
                              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {deal.daysInStage}d in stage
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {/* Column Footer — Add Deal */}
                  <div className="shrink-0 p-3 pt-0">
                    <button className="w-full py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Deal
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── DEAL DETAIL DRAWER ────────────────────────────────── */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeal(null)}
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 z-[100] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="shrink-0 px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#131722] dark:text-white">{selectedDeal.company}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full ${stages.find(s => s.label === selectedDealStage)?.dotColor || 'bg-slate-400'}`} />
                    {selectedDealStage}
                  </p>
                </div>
                <button onClick={() => setSelectedDeal(null)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Value Card */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full" />
                  <div className="absolute bottom-2 right-4 w-14 h-14 bg-white/5 rounded-full" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Deal Value</p>
                  <h3 className="text-2xl font-black">KSh {selectedDeal.value.toLocaleString()}</h3>
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-indigo-200">Probability</p>
                      <p className="text-sm font-bold">{selectedDeal.probability}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-indigo-200">Weighted</p>
                      <p className="text-sm font-bold">KSh {Math.round(selectedDeal.value * selectedDeal.probability / 100).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Details</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Contact</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedDeal.contact}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">+254 7XX XXX XXX</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700/50">
                      <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedDeal.contact.split(' ')[0].toLowerCase()}@{selectedDeal.company.split(' ')[0].toLowerCase()}.co.ke</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deal Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deal Information</h4>
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl divide-y divide-slate-100 dark:divide-slate-700/50">
                    {[
                      { label: 'Material', value: selectedDeal.material },
                      { label: 'Priority', value: getPriorityConfig(selectedDeal.priority).label },
                      { label: 'Days in Stage', value: `${selectedDeal.daysInStage} days` },
                      { label: 'Last Activity', value: selectedDeal.lastActivity },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center px-4 py-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                        <span className="text-xs font-bold text-[#131722] dark:text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Recent Activity</h4>
                  <div className="space-y-0">
                    {[
                      { action: 'Quote document sent via email', time: '2 hours ago', type: 'email' },
                      { action: 'Phone call — pricing discussion', time: '1 day ago', type: 'call' },
                      { action: 'Initial meeting scheduled', time: '3 days ago', type: 'meeting' },
                      { action: 'Lead created from RFQ response', time: '5 days ago', type: 'system' },
                    ].map((activity, idx) => (
                      <div key={idx} className="flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5" />
                          {idx < 3 && <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#131722] dark:text-white leading-snug">{activity.action}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-[#e0e3eb] dark:border-slate-800 flex gap-3">
                <button className="flex-1 py-2.5 rounded-xl border border-[#e0e3eb] dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Edit Deal
                </button>
                <button className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20">
                  Move Stage
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
