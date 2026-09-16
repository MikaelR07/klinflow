import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Search, Plus, Filter, MoreVertical, GripVertical,
  Building2, User, DollarSign, Calendar, Phone,
  Mail, ArrowUpRight, TrendingUp, Target, Trophy,
  X, AlertCircle, RefreshCcw, Link, ArrowRight,
  ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';

const MotionDiv = motion.div as any;

// ── TYPES ──────────────────────────────────────────────────────────
interface Deal {
  id: string;
  buyer_id: string;
  buyers?: { name: string };
  contact_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  value: number;
  material: string;
  source: string | null;
  probability: number;
  stage: string;
  priority: 'high' | 'medium' | 'low';
  last_activity_at: string | null;
  created_at: string;
  notes: string | null;
}

interface Stage {
  id: string;
  label: string;
  color: string;
  bgGradient: string;
  dotColor: string;
  deals: Deal[];
}

const STAGES_CONFIG = [
  { id: 'lead', label: 'New Lead', color: 'text-slate-600 dark:text-slate-300', dotColor: 'bg-slate-400' },
  { id: 'contacted', label: 'Contacted', color: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500' },
  { id: 'negotiating', label: 'Negotiating', color: 'text-amber-600 dark:text-amber-400', dotColor: 'bg-amber-500' },
  { id: 'quote_sent', label: 'Quote Sent', color: 'text-purple-600 dark:text-purple-400', dotColor: 'bg-purple-500' },
  { id: 'contract_signed', label: 'Contract Signed', color: 'text-indigo-600 dark:text-indigo-400', dotColor: 'bg-indigo-500' },
  { id: 'won', label: 'Won', color: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'text-rose-600 dark:text-rose-400', dotColor: 'bg-rose-500' },
];

const formatCurrency = (value: number) => {
  return `KSh ${value.toLocaleString()}`;
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case 'high': return { label: 'High', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400' };
    case 'medium': return { label: 'Med', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' };
    default: return { label: 'Low', bg: 'bg-slate-500/10', text: 'text-slate-500' };
  }
};

const calculateDays = (dateStr: string | null) => {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
};

export default function SalesPipeline() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedDeal, setDraggedDeal] = useState<{ deal: Deal; fromStageId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  
  // Drawer states
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Deal>>({
    stage: 'lead', priority: 'medium', probability: 10, value: 0
  });

  const [buyersList, setBuyersList] = useState<{ id: string; name: string }[]>([]);

  const fetchDeals = async () => {
    if (!currentCompanyId) return;
    setIsLoading(true);
    
    const [dealsRes, buyersRes] = await Promise.all([
      supabase.from('sales_deals').select('*, buyers(name)').eq('company_id', currentCompanyId).order('created_at', { ascending: false }),
      supabase.from('buyers').select('id, name').eq('company_id', currentCompanyId)
    ]);

    if (!dealsRes.error && dealsRes.data) {
      setDeals(dealsRes.data as any);
    }
    if (!buyersRes.error && buyersRes.data) {
      setBuyersList(buyersRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDeals();
  }, [currentCompanyId]);

  // Derived KPIs
  const totalPipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const wonDeals = deals.filter(d => d.stage === 'won');
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const totalDeals = deals.length;
  const winRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  // Grouping by stage
  const stages: Stage[] = STAGES_CONFIG.map(config => ({
    ...config,
    bgGradient: '',
    deals: deals.filter(d => d.stage === config.id && (
      (d.buyers?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.contact_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.material.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  }));

  // Handlers
  const handleDeleteDeal = (e: React.MouseEvent, dealId: string) => {
    e.stopPropagation();
    setDealToDelete(dealId);
  };

  const confirmDeleteDeal = async () => {
    if (!dealToDelete) return;
    const { error } = await (supabase.from('sales_deals') as any).delete().eq('id', dealToDelete);
    if (!error) {
      setDeals(deals.filter(d => d.id !== dealToDelete));
      setDealToDelete(null);
    }
  };
  const handleDragStart = useCallback((deal: Deal, stageId: string) => {
    setDraggedDeal({ deal, fromStageId: stageId });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, stageId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (stageId) setDropTarget(stageId);

    // Auto-scroll when dragging near edges
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const scrollThreshold = 100;
      
      if (e.clientX < rect.left + scrollThreshold) {
        container.scrollBy({ left: -15, behavior: 'auto' });
      } else if (e.clientX > rect.right - scrollThreshold) {
        container.scrollBy({ left: 15, behavior: 'auto' });
      }
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = async (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedDeal || draggedDeal.fromStageId === toStageId) {
      setDraggedDeal(null);
      return;
    }

    const { deal } = draggedDeal;
    const probabilityMap: Record<string, number> = {
      lead: 10, contacted: 25, negotiating: 50,
      quote_sent: 60, contract_signed: 80, won: 100, lost: 0
    };
    
    const newProb = probabilityMap[toStageId] ?? deal.probability;

    // Optimistic UI update
    setDeals(prev => prev.map(d =>
      d.id === deal.id ? { ...d, stage: toStageId, probability: newProb, last_activity_at: new Date().toISOString() } : d
    ));
    setDraggedDeal(null);

    // Backend update
    await (supabase.from('sales_deals').update({
      stage: toStageId,
      probability: newProb,
      last_activity_at: new Date().toISOString()
    } as any) as any).eq('id', deal.id);
  };

  const handleDragEnd = useCallback(() => {
    setDraggedDeal(null);
    setDropTarget(null);
  }, []);

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    const newDeal = {
      ...formData,
      company_id: currentCompanyId,
    };

    const { data, error } = await (supabase.from('sales_deals').insert([newDeal as any]) as any).select('*, buyers(name)');
    if (!error && data && data.length > 0) {
      setDeals([data[0] as unknown as Deal, ...deals]);
      setIsAddDealOpen(false);
      setFormData({ stage: 'lead', priority: 'medium', value: 0, notes: '' });
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Panning Support
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsPanning(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeftState(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsPanning(false);
  const handleMouseUp = () => setIsPanning(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="shrink-0 p-4 md:px-6 md:pt-6 space-y-5">
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
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                />
              </div>
              <button onClick={() => setIsAddDealOpen(true)} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20">
                <Plus className="w-4 h-4" /> New Deal
              </button>
            </div>
          </div>

          {/* KPI STRIP */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Pipeline Value', value: formatCurrency(totalPipelineValue), icon: DollarSign, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Average Deal Size', value: totalDeals > 0 ? formatCurrency(totalPipelineValue / totalDeals) : 'KSh 0', icon: Target, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Deals Won', value: formatCurrency(wonValue), icon: Trophy, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Win Rate', value: `${winRate}%`, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
            ].map((kpi, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <p className="text-lg font-black text-[#131722] dark:text-white leading-none">{kpi.value}</p>
                </div>
              </div>
            ))}
            </div>
          </div>

        {/* KANBAN BOARD */}
        <div className="px-4 md:px-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-widest">Scroll horizontally to view more stages</span>
            <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="flex items-center gap-2 pr-2">
            <button 
              onClick={() => handleScroll('left')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => handleScroll('right')}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden group">
          {/* Gradient fade on the right to hint at more content */}
          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-slate-50 dark:from-[#0b0f19] to-transparent pointer-events-none z-20" />
          
          <div 
            ref={scrollContainerRef} 
            className={`h-full overflow-x-auto overflow-y-hidden p-4 md:px-6 pb-6 [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-track]:bg-slate-200/50 dark:[&::-webkit-scrollbar-track]:bg-slate-800/50 [&::-webkit-scrollbar-thumb]:bg-slate-400/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-500 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600 [&::-webkit-scrollbar-thumb]:rounded-full ${isPanning ? 'cursor-grabbing select-none' : 'cursor-grab'}`} 
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#94a3b8 transparent' }}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onDragOver={(e) => handleDragOver(e)}
          >
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <RefreshCcw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="flex gap-4 h-full min-w-max pb-4 items-start">
              {stages.map(stage => {
                const stageValue = stage.deals.reduce((sum, d) => sum + d.value, 0);
                const isDropping = dropTarget === stage.id && draggedDeal?.fromStageId !== stage.id;

                return (
                  <div
                    key={stage.id}
                    className={`w-[280px] shrink-0 flex flex-col rounded-2xl border transition-all duration-200 max-h-full ${
                      isDropping
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/5 shadow-lg shadow-indigo-500/10 scale-[1.01]'
                        : 'border-[#e0e3eb] dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50'
                    }`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <div className="shrink-0 px-4 py-3.5 border-b border-[#e0e3eb] dark:border-slate-800 sticky top-0 bg-inherit rounded-t-2xl z-10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                          <h3 className={`text-[11px] font-bold uppercase tracking-widest ${stage.color}`}>{stage.label}</h3>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700/50 rounded-md px-1.5 py-0.5">{stage.deals.length}</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400">{formatCurrency(stageValue)}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px] custom-scrollbar">
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
                            <MotionDiv
                              key={deal.id}
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: isDragging ? 0.5 : 1, y: 0, scale: isDragging ? 0.95 : 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.2 }}
                              draggable
                              onDragStart={() => handleDragStart(deal, stage.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => setSelectedDeal(deal)}
                              className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group select-none"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 text-slate-500">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-[#131722] dark:text-white leading-tight truncate">{(deal.buyers?.name || 'Unknown Buyer')}</p>
                                    <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                      <User className="w-3 h-3 shrink-0" /> {deal.contact_name}
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  onClick={(e) => handleDeleteDeal(e, deal.id)} 
                                  className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                  title="Delete Deal"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{deal.material}</p>

                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-black text-[#131722] dark:text-white">{formatCurrency(deal.value)}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${priority.bg} ${priority.text}`}>
                                  {priority.label}
                                </span>
                              </div>

                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lead Date</span>
                                  <span className="text-[10px] font-bold text-[#131722] dark:text-white flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-slate-400" />
                                    {new Date(deal.created_at).toLocaleDateString()}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[60%]">{deal.source || 'No source'}</span>
                                    <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1" title="Time in current stage">
                                      <Calendar className="w-3 h-3" /> {calculateDays(deal.last_activity_at)}d in stage
                                    </span>
                                  </div>
                                  {deal.notes && (
                                    <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                                      <p className="text-[9px] text-slate-500 italic line-clamp-2 leading-relaxed">{deal.notes}</p>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-end mt-1">
                                    <span className="text-[9px] text-slate-400 font-medium" title="Total lifetime of deal">
                                      {calculateDays(deal.created_at)}d total Life
                                    </span>
                                  </div>
                                </div>
                              </MotionDiv>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* DEAL DETAIL DRAWER */}
      <AnimatePresence>
        {selectedDeal && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDeal(null)}
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-[90]"
            />
            <MotionDiv
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 z-[100] flex flex-col shadow-2xl"
            >
              <div className="shrink-0 px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#131722] dark:text-white">{selectedDeal.buyers?.name || 'Unknown Buyer'}</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-widest">{STAGES_CONFIG.find(s => s.id === selectedDeal.stage)?.label}</p>
                </div>
                <button onClick={() => setSelectedDeal(null)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Deal Value</p>
                  <h3 className="text-2xl font-black">KSh {selectedDeal.value.toLocaleString()}</h3>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contact Details</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border">
                      <User className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact Name</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedDeal.contact_name}</p>
                      </div>
                    </div>
                    {selectedDeal.contact_phone && (
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border">
                        <Phone className="w-4 h-4 text-emerald-500" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                          <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedDeal.contact_phone}</p>
                        </div>
                      </div>
                    )}
                    {selectedDeal.contact_email && (
                      <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border">
                        <Mail className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                          <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedDeal.contact_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* ADD DEAL DRAWER */}
      <AnimatePresence>
        {isAddDealOpen && (
          <>
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddDealOpen(false)}
              className="fixed inset-0 bg-slate-950/30 backdrop-blur-sm z-[90]"
            />
            <MotionDiv
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-[#e0e3eb] dark:border-slate-800 z-[100] flex flex-col shadow-2xl"
            >
              <div className="shrink-0 px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#131722] dark:text-white">Create New Deal</h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">Add a new prospect to your pipeline</p>
                </div>
                <button onClick={() => setIsAddDealOpen(false)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddDeal} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Buyer Company *</label>
                  <select required value={formData.buyer_id || ''} onChange={e => setFormData({...formData, buyer_id: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select a buyer...</option>
                    {buyersList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Contact Name *</label>
                  <input required type="text" value={formData.contact_name || ''} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</label>
                    <input type="text" value={formData.contact_phone || ''} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Email</label>
                    <input type="email" value={formData.contact_email || ''} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Material Type *</label>
                  <input required type="text" value={formData.material || ''} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Value (KES) *</label>
                    <input required type="number" value={formData.value === 0 ? '' : formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deal Source</label>
                    <select value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                      <option value="">Select a source...</option>
                      <option value="Inbound Request">Inbound Request</option>
                      <option value="Outbound Sales">Outbound Sales</option>
                      <option value="Referral">Referral</option>
                      <option value="cold_call">Cold Call</option>
                      <option value="event">Event</option>
                    </select>
                    <p className="text-[10px] text-slate-500 mt-1.5 italic min-h-[16px]">
                      {formData.source === 'Inbound Request' ? 'They contacted us first (e.g., website form, incoming email).' :
                       formData.source === 'Outbound Sales' ? 'We actively reached out to them (e.g., targeted email campaigns).' :
                       formData.source === 'Referral' ? 'Recommended by an existing partner, client, or mutual connection.' :
                       formData.source === 'cold_call' ? 'We initiated contact via an unsolicited phone call.' :
                       formData.source === 'event' ? 'Met at a trade show, conference, or networking event.' :
                       'Select where this potential deal originated from.'}
                    </p>
                  </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Internal Notes (Optional)</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    maxLength={250}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white"
                    placeholder="Add important details to remember (max 250 chars)..."
                  />
                  <p className="text-[9px] text-slate-400 mt-1 text-right">
                    {(formData.notes?.length || 0)} / 250
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsAddDealOpen(false)} className="px-4 py-2 text-sm font-bold border rounded-xl hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700">Save Deal</button>
                </div>
              </form>
            </MotionDiv>
          </>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {dealToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDealToDelete(null)}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            />
            <MotionDiv
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl shadow-2xl p-6"
            >
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-[#131722] dark:text-white mb-2">Delete Deal</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this deal? This action cannot be undone and will permanently remove it from the pipeline.</p>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setDealToDelete(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteDeal}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
