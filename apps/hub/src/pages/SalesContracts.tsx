import { useState, useEffect } from 'react';
import { 
  FileSignature, Search, Filter, Plus, CalendarClock, 
  ShieldCheck, ArrowUpRight, CheckCircle2, AlertCircle,
  MoreVertical, RefreshCcw, Building2, Eye, FileText, X, Edit2, Trash2, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';

const MotionDiv = motion.div as any;

// Types
interface Contract {
  id: string;
  reference_id: string;
  title: string;
  buyer_id: string;
  buyers?: { name: string };
  type: string;
  status: 'active' | 'expiring' | 'negotiation' | 'expired';
  start_date: string | null;
  end_date: string | null;
  value: number;
  compliance_score: number;
  auto_renew: boolean;
  deal_id: string | null;
  notes: string | null;
}

interface PendingDeal {
  id: string;
  buyer_id: string;
  buyers?: { name: string };
  value: number;
  material: string;
  created_at: string;
  notes: string | null;
}

export default function SalesContracts() {
  const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expiring' | 'negotiation'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pendingDeals, setPendingDeals] = useState<PendingDeal[]>([]);
  const [buyersList, setBuyersList] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [blurredIds, setBlurredIds] = useState<string[]>([]);
  const [isCreatingNewBuyer, setIsCreatingNewBuyer] = useState(false);
  const [newBuyerName, setNewBuyerName] = useState('');
  
  const [formData, setFormData] = useState<Partial<Contract>>({
    status: 'negotiation',
    auto_renew: false,
    value: 0,
    compliance_score: 0,
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [currentCompanyId]);

  const fetchData = async () => {
    if (!currentCompanyId) return;
    setIsLoading(true);

    const [contractsRes, dealsRes, buyersRes] = await Promise.all([
      supabase.from('sales_contracts').select('*, buyers(name)').eq('company_id', currentCompanyId).order('created_at', { ascending: false }),
      supabase.from('sales_deals').select('id, buyer_id, buyers(name), value, material, created_at, notes').eq('company_id', currentCompanyId).eq('stage', 'won').order('created_at', { ascending: false }),
      supabase.from('buyers').select('id, name').eq('company_id', currentCompanyId)
    ]);

    const fetchedContracts = (contractsRes.data || []) as Contract[];
    setContracts(fetchedContracts);

    const contractedDealIds = new Set(fetchedContracts.filter(c => c.deal_id).map(c => c.deal_id));
    const pending = (dealsRes.data || []).filter((d: any) => !contractedDealIds.has(d.id)) as PendingDeal[];
    
    setPendingDeals(pending);
    if (buyersRes.data) {
      setBuyersList(buyersRes.data);
    }
    setIsLoading(false);
  };

  const openDrawerForDeal = (deal: PendingDeal) => {
    setFormData({
      deal_id: deal.id,
      title: `Agreement for ${deal.material}`,
      buyer_id: deal.buyer_id,
      value: deal.value,
      type: 'Corporate Buyer',
      status: 'active',
      auto_renew: false,
      compliance_score: 0,
      notes: deal.notes || ''
    });
    setIsDrawerOpen(true);
  };

  const openDrawerNew = () => {
    setFormData({
      deal_id: null,
      title: '',
      buyer_id: '',
      value: 0,
      type: 'Corporate Buyer',
      status: 'negotiation',
      auto_renew: false,
      compliance_score: 0,
      notes: ''
    });
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (contract: Contract) => {
    setFormData(contract);
    setIsDrawerOpen(true);
  };

  const toggleBlur = (id: string) => {
    setBlurredIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId || !formData.title || (!formData.buyer_id && !isCreatingNewBuyer) || (isCreatingNewBuyer && !newBuyerName)) return;

    let finalBuyerId = formData.buyer_id;

    if (isCreatingNewBuyer && newBuyerName) {
      const { data: newBuyer } = await (supabase.from('buyers') as any).insert([{
        company_id: currentCompanyId,
        name: newBuyerName,
        industry: 'Other',
        status: 'onboarding'
      }]).select();
      
      if (newBuyer && newBuyer.length > 0) {
        finalBuyerId = newBuyer[0].id;
        setBuyersList([...buyersList, { id: newBuyer[0].id, name: newBuyer[0].name }]);
        setFormData({ ...formData, buyer_id: finalBuyerId });
      } else {
        return; // failed to create buyer
      }
    }

    if (formData.id) {
        const { data, error } = await (supabase.from('sales_contracts') as any).update({ ...formData, buyer_id: finalBuyerId }).eq('id', formData.id).select();
      if (!error && data) {
        setContracts(contracts.map(c => c.id === formData.id ? (data[0] as unknown as Contract) : c));
        setIsDrawerOpen(false);
      }
    } else {
      const refId = `CNT-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

      const newContract = {
        ...formData,
        buyer_id: finalBuyerId,
        company_id: currentCompanyId,
        reference_id: refId
      };

        const { data, error } = await (supabase.from('sales_contracts') as any).insert([newContract]).select();
      
      if (!error && data) {
        setContracts([data[0] as unknown as Contract, ...contracts]);
        
        if (formData.deal_id) {
          setPendingDeals(pendingDeals.filter(d => d.id !== formData.deal_id));
        }
        
        setIsDrawerOpen(false);
      }
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    const { error } = await supabase.from('sales_contracts').delete().eq('id', contractToDelete);
    if (!error) {
      setContracts(contracts.filter(c => c.id !== contractToDelete));
      setContractToDelete(null);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const buyerName = c.buyers?.name || '';
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          buyerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'expiring': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'negotiation': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'expired': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle2;
      case 'expiring': return AlertCircle;
      case 'negotiation': return RefreshCcw;
      case 'expired': return CalendarClock;
      default: return FileText;
    }
  };

  const activeContractsCount = contracts.filter(c => c.status === 'active').length;
  const totalContractValue = contracts.filter(c => ['active', 'expiring'].includes(c.status)).reduce((sum, c) => sum + Number(c.value), 0);
  const pendingRenewalsCount = contracts.filter(c => c.status === 'expiring').length;
  const avgCompliance = contracts.filter(c => ['active', 'expiring'].includes(c.status)).reduce((sum, c, _, arr) => sum + (c.compliance_score / arr.length), 0);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Contracts & Agreements</h1>
              <span className="font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] uppercase tracking-widest">Legal</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage long-term supply agreements and corporate partnerships.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openDrawerNew} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> Draft Contract
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Contracts</p>
              <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                <FileSignature className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{activeContractsCount}</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1">Currently enforced</p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Total Contract Value (TCV)</p>
              <div className={`w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0`}>
                <ArrowUpRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-300 leading-none">KES {totalContractValue.toLocaleString()}</h3>
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-2">Locked revenue stream</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pending Renewals</p>
              <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                <CalendarClock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{pendingRenewalsCount}</h3>
            <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Expiring in 60 days</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Avg Compliance</p>
              <div className={`w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0`}>
                <ShieldCheck className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{avgCompliance ? avgCompliance.toFixed(1) : '0.0'}%</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Fulfillment adherence</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          
          {/* Main Directory Table - 70% */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-4">
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Contracts' },
                    { id: 'active', label: 'Active' },
                    { id: 'expiring', label: 'Expiring Soon' },
                    { id: 'negotiation', label: 'Under Negotiation' },
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                          ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search contract or partner..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>
                  <button className="p-2 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Directory Table */}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Contract & Partner</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Duration</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Value (KES)</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">Loading...</td>
                      </tr>
                    ) : filteredContracts.length > 0 ? (
                      filteredContracts.map(contract => {
                        const StatusIcon = getStatusIcon(contract.status);
                        const isBlurred = blurredIds.includes(contract.id);
                        return (
                          <tr key={contract.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                  <FileSignature className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{contract.title}</p>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest">
                                    <Building2 className="w-3 h-3" /> {(contract.buyers?.name || 'Unknown Buyer')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(contract.status)}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {contract.status.replace('_', ' ')}
                              </div>
                              {contract.auto_renew && (
                                <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                  <RefreshCcw className="w-3 h-3" /> Auto-Renew Enabled
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className={`font-bold text-xs text-[#131722] dark:text-white leading-none mb-1 transition-all ${isBlurred ? 'blur-md select-none opacity-50' : ''}`}>
                                {contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'Pending'} - 
                                {contract.end_date ? new Date(contract.end_date).toLocaleDateString() : 'Pending'}
                              </p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-widest">{contract.reference_id}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className={`font-black text-sm text-[#131722] dark:text-white leading-none mb-1 transition-all ${isBlurred ? 'blur-md select-none opacity-50' : ''}`}>
                                KES {Number(contract.value).toLocaleString()}
                              </p>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">
                                {contract.compliance_score || 0}% Compliant
                              </p>
                              {contract.notes && (
                                <p className="text-[10px] text-slate-500 italic mt-2 line-clamp-1" title={contract.notes}>
                                  {contract.notes}
                                </p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {contract.status === 'expiring' && (
                                  <button className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 transition-colors">
                                    Renew
                                  </button>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); toggleBlur(contract.id); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                                  {isBlurred ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openDrawerForEdit(contract); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-500/20 flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setContractToDelete(contract.id); }} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 flex items-center justify-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <FileSignature className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No contracts found</p>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pending Finalization Side Panel - 30% */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-4 sticky top-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-[#131722] dark:text-white">Pending Finalization</h3>
              </div>
              <p className="text-[10px] text-slate-500 mb-4 leading-relaxed font-medium">
                These are recent deals won via the Sales Pipeline. Click to review and fill in necessary details (start date, duration) to activate them into full contracts.
              </p>

              <div className="space-y-3">
                {pendingDeals.length > 0 ? (
                  pendingDeals.map(deal => (
                    <div 
                      key={deal.id}
                      onClick={() => openDrawerForDeal(deal)}
                      className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 p-3 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-500/50 cursor-pointer transition-all shadow-sm group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-[#131722] dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {(deal.buyers?.name || 'Unknown Buyer')}
                        </p>
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-widest">
                          Won Deal
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium mb-2 truncate">Agreement for {deal.material}</p>
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50 pt-2">
                        <p className="text-[10px] font-black text-[#131722] dark:text-white">
                          KES {Number(deal.value).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium">
                          {new Date(deal.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {deal.notes && (
                        <p className="text-[9px] text-slate-500 italic mt-2 line-clamp-1 border-t border-slate-100 dark:border-slate-700/50 pt-2">
                          {deal.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-[#e0e3eb] dark:border-slate-700 rounded-xl">
                    <p className="text-xs font-bold text-slate-400">No pending deals</p>
                    <p className="text-[10px] text-slate-500 mt-1">Win deals in the pipeline to see them here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <MotionDiv 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm"
            />
            
            <MotionDiv 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {formData.id ? 'Edit Contract' : formData.deal_id ? 'Finalize Contract' : 'Draft New Contract'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {formData.id ? 'Update details for this agreement.' : formData.deal_id ? 'Convert this won deal into an active contract.' : 'Enter details for the new agreement.'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <form id="contract-form" onSubmit={handleSaveContract} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contract Title</label>
                    <input 
                      type="text" 
                      required
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                      placeholder="e.g. Annual PET Supply"
                    />
                  </div>

                  <div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Corporate Buyer *</label>
                        <button type="button" onClick={() => setIsCreatingNewBuyer(!isCreatingNewBuyer)} className="text-[9px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest">
                          {isCreatingNewBuyer ? 'Select Existing' : '+ Quick Create'}
                        </button>
                      </div>
                      
                      {isCreatingNewBuyer ? (
                        <input
                          required
                          type="text"
                          value={newBuyerName}
                          onChange={e => setNewBuyerName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          placeholder="Enter new company name..."
                        />
                      ) : (
                        <select
                          required
                          value={formData.buyer_id || ''}
                          onChange={e => setFormData({...formData, buyer_id: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                        >
                          <option value="">Select a buyer...</option>
                          {buyersList.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Value (KES)</label>
                      <input 
                        type="number" 
                        required
                        min="0"
                        value={formData.value === 0 ? '' : formData.value}
                        onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Contract Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white appearance-none"
                      >
                        <option value="Corporate Buyer">Corporate Buyer</option>
                        <option value="Upstream Seller">Upstream Seller</option>
                        <option value="Partner">Partner</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={formData.start_date || ''}
                        onChange={e => setFormData({...formData, start_date: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={formData.end_date || ''}
                        onChange={e => setFormData({...formData, end_date: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Initial Status</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({...formData, status: e.target.value as any})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white appearance-none"
                      >
                        <option value="active">Active</option>
                        <option value="negotiation">Negotiation (Draft)</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center justify-between block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        <span>Compliance Score</span>
                        <span className="text-emerald-600 font-black">{formData.compliance_score || 0}%</span>
                      </label>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.compliance_score || 0}
                        onChange={e => setFormData({...formData, compliance_score: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 mt-3 accent-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Internal Notes (Optional)</label>
                    <textarea
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      maxLength={250}
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none dark:text-white"
                      placeholder="Add important details to remember (max 250 chars)..."
                    />
                    <p className="text-[9px] text-slate-400 mt-1 text-right">
                      {(formData.notes?.length || 0)} / 250
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, auto_renew: !formData.auto_renew})}
                      className={`w-10 h-5 rounded-full relative transition-colors ${formData.auto_renew ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${formData.auto_renew ? 'translate-x-5' : ''}`} />
                    </button>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Enable Auto-Renew</span>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  form="contract-form"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
                >
                  {formData.id ? 'Save Changes' : formData.deal_id ? 'Activate Contract' : 'Save Draft'}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {contractToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <MotionDiv 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setContractToDelete(null)}
              className="absolute inset-0 bg-slate-900/20 dark:bg-slate-900/60 backdrop-blur-sm"
            />
            
            <MotionDiv 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
            >
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Contract?</h2>
                <p className="text-xs text-slate-500 mb-6">
                  Are you sure you want to delete this contract? This action cannot be undone and will permanently remove the record.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setContractToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteContract}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Delete Contract
                  </button>
                </div>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
