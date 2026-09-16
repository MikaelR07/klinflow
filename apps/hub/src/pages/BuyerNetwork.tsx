import { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Filter, ShieldCheck, 
  TrendingUp, FileText, ChevronRight, Activity, DollarSign,
  Edit2, Trash2, Clock, CheckCircle2, X, LayoutGrid, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import BuyerProfileModal from '../components/crm/BuyerProfileModal';

const MotionDiv = motion.div as any;

// Types
interface Buyer {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'paused' | 'onboarding';
  materials: string[];
  credit_score: number | null;
  ytd_spend: number;
  active_contracts_count: number;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
}

const MATERIAL_OPTIONS = ['Clear Glass', 'Mixed Glass', 'OCC Paper', 'White Paper', 'PET Flakes', 'HDPE', 'Aluminium', 'Copper', 'Textile Waste', 'Scrap Metal'];

export default function BuyerNetwork() {
  const currentCompanyId = useAuthStore(s => (s as any).currentCompanyId);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'paused' | 'onboarding'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer & Modal state
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedProfileBuyer, setSelectedProfileBuyer] = useState<Buyer | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [buyerToDelete, setBuyerToDelete] = useState<string | null>(null);
  const [customMaterial, setCustomMaterial] = useState('');
  const [formData, setFormData] = useState<Partial<Buyer>>({
    status: 'onboarding',
    materials: [],
    credit_score: 0,
    ytd_spend: 0,
    active_contracts_count: 0
  });

  useEffect(() => {
    fetchBuyers();
  }, [currentCompanyId]);

  const fetchBuyers = async () => {
    if (!currentCompanyId) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('buyers')
      .select('*')
      .eq('company_id', currentCompanyId)
      .order('created_at', { ascending: false });

      const parsedData = (data || []).map((buyer: any) => {
        let mats: string[] = [];
        if (Array.isArray(buyer.materials)) {
          mats = buyer.materials;
        } else if (typeof buyer.materials === 'string') {
          if (buyer.materials.startsWith('[')) {
            try { mats = JSON.parse(buyer.materials); } catch (e) {}
          } else {
            mats = buyer.materials.replace(/^\{|\}$/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }
        return { ...buyer, materials: mats };
      });

      setBuyers(parsedData as Buyer[]);
    setIsLoading(false);
  };

  const openDrawerForNew = () => {
    setFormData({
      status: 'onboarding',
      materials: [],
      credit_score: null,
      ytd_spend: 0,
      active_contracts_count: 0
    });
    setIsDrawerOpen(true);
  };

  const openDrawerForEdit = (buyer: Buyer) => {
    setFormData(buyer);
    setIsDrawerOpen(true);
  };

  const toggleMaterial = (mat: string) => {
    const current = formData.materials || [];
    if (current.includes(mat)) {
      setFormData({ ...formData, materials: current.filter(m => m !== mat) });
    } else {
      setFormData({ ...formData, materials: [...current, mat] });
    }
  };

  const handleAddCustomMaterial = () => {
    if (customMaterial.trim() && !(formData.materials || []).includes(customMaterial.trim())) {
      setFormData({ ...formData, materials: [...(formData.materials || []), customMaterial.trim()] });
      setCustomMaterial('');
    }
  };

  const handleSaveBuyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId || !formData.name || !formData.industry) return;

    if (formData.id) {
      // Edit
      const { data, error } = await ((supabase.from('buyers') as any).update(formData) as any).eq('id', formData.id).select();
      if (!error && data) {
        setBuyers(buyers.map(b => b.id === formData.id ? (data[0] as unknown as Buyer) : b));
        setIsDrawerOpen(false);
      }
    } else {
      // Insert
      const newBuyer = {
        ...formData,
        company_id: currentCompanyId,
      };
      const { data, error } = await ((supabase.from('buyers') as any).insert([newBuyer]) as any).select();
      if (!error && data) {
        setBuyers([data[0] as unknown as Buyer, ...buyers]);
        setIsDrawerOpen(false);
      }
    }
  };

  const handleDeleteBuyer = async () => {
    if (!buyerToDelete) return;
    const { error } = await supabase.from('buyers').delete().eq('id', buyerToDelete);
    if (!error) {
      setBuyers(buyers.filter(b => b.id !== buyerToDelete));
      setBuyerToDelete(null);
    }
  };

  const filteredBuyers = buyers.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.industry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || b.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalSpend = buyers.reduce((sum, b) => sum + Number(b.ytd_spend), 0);
  const activeContracts = buyers.reduce((sum, b) => sum + Number(b.active_contracts_count), 0);
  const scoredBuyers = buyers.filter(b => b.credit_score !== null && b.credit_score > 0);
  const avgScore = scoredBuyers.length > 0 
    ? Math.round(scoredBuyers.reduce((sum, b) => sum + Number(b.credit_score), 0) / scoredBuyers.length)
    : 0;

  // Derived metrics for sidebars
  const topAccounts = [...buyers].sort((a, b) => Number(b.ytd_spend) - Number(a.ytd_spend)).slice(0, 3);
  const onboardingBuyers = buyers.filter(b => b.status === 'onboarding');
  const recentActivity = [...buyers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 3);

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Buyer Network</h1>
              <span className="font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] uppercase tracking-widest">B2B CRM</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage corporate buyers, manufacturers, and export partners.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openDrawerForNew} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20">
              <Plus className="w-4 h-4" /> Add New Buyer
            </button>
          </div>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          
          {/* Main Content (Left 3 Columns) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Verified Buyers', value: buyers.filter(b => b.status === 'active').length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Active Contracts', value: activeContracts, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'YTD Sales Volume', value: `KSh ${Number(totalSpend).toLocaleString()}`, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { label: 'Avg Credit Score', value: avgScore > 0 ? avgScore : '--', icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map((kpi, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{kpi.label}</p>
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{kpi.value}</h3>
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-1 ${viewMode === 'table' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-4 md:gap-6`}>
              <div className={`${viewMode === 'table' ? 'lg:col-span-3' : 'col-span-1'} space-y-4`}>
                
                {/* Controls & Tabs */}
                <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden ">
                  <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                      {[
                        { id: 'all', label: 'All Buyers' },
                        { id: 'active', label: 'Active' },
                        { id: 'paused', label: 'Paused' },
                        { id: 'onboarding', label: 'Onboarding' },
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
                      <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-lg ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search company or industry..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                      </div>
                      <button className="p-2 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                        <Filter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Directory Table / Kanban View */}
                  {viewMode === 'kanban' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 min-h-[500px]">
                      {[
                        { id: 'onboarding', label: 'Onboarding', color: 'border-amber-200 dark:border-amber-900/50', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                        { id: 'active', label: 'Active Partners', color: 'border-emerald-200 dark:border-emerald-900/50', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
                        { id: 'paused', label: 'Paused', color: 'border-slate-200 dark:border-slate-700', bg: 'bg-slate-50 dark:bg-slate-800' }
                      ].map(column => (
                        <div key={column.id} className={`flex flex-col rounded-2xl border ${column.color} ${column.bg} p-4`}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">{column.label}</h3>
                            <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500">{filteredBuyers.filter(b => b.status === column.id).length}</span>
                          </div>
                          <div className="space-y-3 flex-1">
                            {filteredBuyers.filter(b => b.status === column.id).map(buyer => (
                              <div 
                                key={buyer.id} 
                                onClick={() => setSelectedProfileBuyer(buyer)}
                                className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl p-4 shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{buyer.name.charAt(0)}</div>
                                  <div>
                                    <h4 className="text-sm font-bold text-[#131722] dark:text-white">{buyer.name}</h4>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">{buyer.industry}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <DollarSign className="w-3 h-3" />
                                    KES {Number(buyer.ytd_spend).toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                    <FileText className="w-3 h-3" />
                                    {buyer.active_contracts_count} Contracts
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto min-h-[550px]">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                          <tr>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Company Details</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material Interests</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">YTD Spend</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Trust Score</th>
                            <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                          {isLoading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-medium">Loading...</td>
                            </tr>
                          ) : filteredBuyers.length > 0 ? (
                            filteredBuyers.map(buyer => (
                              <tr key={buyer.id} onClick={() => setSelectedProfileBuyer(buyer)} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm border border-blue-200 dark:border-blue-800 shrink-0">
                                      {buyer.name.charAt(0)}
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{buyer.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{buyer.industry}</p>
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${
                                          buyer.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                                          buyer.status === 'paused' ? 'bg-amber-500/10 text-amber-600' :
                                          'bg-slate-500/10 text-slate-600'
                                        }`}>
                                          {buyer.status}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-wrap gap-1.5">
                                    {(buyer.materials || []).map((mat, idx) => (
                                      <span key={idx} className="bg-slate-100 dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap">
                                        {mat}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <p className="font-black text-sm text-[#131722] dark:text-white">KES {Number(buyer.ytd_spend).toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{buyer.active_contracts_count} Active Contracts</p>
                                </td>
                                <td className="px-6 py-4">
                                  {buyer.credit_score !== null && buyer.credit_score > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 w-16 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${buyer.credit_score > 90 ? 'bg-emerald-500' : buyer.credit_score > 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${buyer.credit_score}%` }}></div>
                                      </div>
                                      <span className="font-bold text-xs text-[#131722] dark:text-white">{buyer.credit_score}/100</span>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evaluating</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => openDrawerForEdit(buyer)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-500/20 flex items-center justify-center text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setBuyerToDelete(buyer.id)} className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 flex items-center justify-center text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-6 py-20 text-center">
                                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <p className="font-bold text-sm text-[#131722] dark:text-white">No buyers found</p>
                                <p className="text-xs text-slate-500 mt-1">Add your first corporate buyer to get started.</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Sidebar (Enterprise Insights) - Hidden in Kanban Mode */}
              {viewMode === 'table' && (
                <div className="lg:col-span-1 space-y-2">
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5 min-h-[240px] flex flex-col">
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-4 shrink-0">
                      <Clock className="w-4 h-4 text-amber-500" /> Action Required
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 shrink-0">Pending Onboarding</p>
                    <div className="space-y-3 flex-1 max-h-[160px] overflow-y-auto pr-2">
                      {onboardingBuyers.length > 0 ? onboardingBuyers.map(buyer => (
                        <div key={buyer.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-[#131722] dark:text-white">{buyer.name}</p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Verification Pending</p>
                            <button onClick={() => openDrawerForEdit(buyer)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">Review</button>
                          </div>
                        </div>
                      )) : (
                        <div className="p-4 border border-dashed border-[#e0e3eb] dark:border-slate-700 rounded-xl text-center">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-500">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-600 border border-blue-500 rounded-2xl p-6 min-h-[220px] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4 relative z-10">
                      <TrendingUp className="w-4 h-4 text-blue-200" /> Top Accounts
                    </h3>
                    <div className="space-y-2 relative z-10 max-h-[160px] overflow-y-auto pr-2">
                      {topAccounts.length > 0 ? topAccounts.map((buyer, idx) => (
                        <div key={idx} className="flex items-center justify-between pb-1 border-b border-blue-500/50 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-bold text-white">{buyer.name}</p>
                            <p className="text-[10px] text-blue-200 mt-0.5">{buyer.industry}</p>
                          </div>
                          <div className="text-sm font-black text-white">
                            KES {Number(buyer.ytd_spend).toLocaleString()}
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-blue-200 italic">No spend data yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5">
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-blue-500" /> Recent Activity
                    </h3>
                    <div className="relative pl-3 space-y-4 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700 max-h-[200px] overflow-y-auto pr-2">
                      {recentActivity.length > 0 ? recentActivity.map(buyer => (
                        <div key={buyer.id} className="relative flex items-start gap-4 group">
                          <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0 absolute -left-[14px]"></div>
                          <div className="flex flex-col">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(buyer.created_at).toLocaleDateString()}</div>
                            <div className="text-xs font-bold text-[#131722] dark:text-white mt-1">
                              Added {buyer.name}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              New partner in {buyer.industry}
                            </div>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-500 italic pl-2">No recent activity.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RICH PROFILE MODAL */}
      <BuyerProfileModal 
        buyer={selectedProfileBuyer} 
        onClose={() => setSelectedProfileBuyer(null)} 
        onUpdate={fetchBuyers} 
      />

      {/* ADD/EDIT DRAWER */}
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
                    {formData.id ? 'Edit Buyer Profile' : 'Add Corporate Buyer'}
                  </h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    {formData.id ? 'Update company details and CRM metrics.' : 'Create a new partner account in your CRM.'}
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
                <form id="buyer-form" onSubmit={handleSaveBuyer} className="space-y-6">
                  
                  {/* Company Info */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Company Information</h3>
                    
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Company Name</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        placeholder="e.g. EcoGlass Manufacturers"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Industry</label>
                        <input 
                          type="text" 
                          required
                          value={formData.industry || ''}
                          onChange={e => setFormData({...formData, industry: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                          placeholder="e.g. Glass Production"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Status</label>
                        <select 
                          value={formData.status}
                          onChange={e => setFormData({...formData, status: e.target.value as any})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none dark:text-white appearance-none"
                        >
                          <option value="active">Active</option>
                          <option value="paused">Paused</option>
                          <option value="onboarding">Onboarding</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Materials */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Material Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set([...MATERIAL_OPTIONS, ...(formData.materials || [])])).map(mat => {
                        const isSelected = (formData.materials || []).includes(mat);
                        return (
                          <button
                            key={mat}
                            type="button"
                            onClick={() => toggleMaterial(mat)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              isSelected 
                                ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-400' 
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            {mat}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <input 
                        type="text" 
                        value={customMaterial}
                        onChange={e => setCustomMaterial(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomMaterial(); } }}
                        placeholder="Type a custom material..."
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-medium outline-none dark:text-white"
                      />
                      <button type="button" onClick={handleAddCustomMaterial} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* CRM Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">CRM Metrics (Manual V1)</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">YTD Spend (KES)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.ytd_spend === 0 ? '' : formData.ytd_spend}
                          onChange={e => setFormData({...formData, ytd_spend: Number(e.target.value)})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black text-indigo-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Active Contracts</label>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.active_contracts_count === 0 ? '' : formData.active_contracts_count}
                          onChange={e => setFormData({...formData, active_contracts_count: Number(e.target.value)})}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-black text-emerald-600 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center justify-between block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                        <span>Trust Score</span>
                        <span className="text-amber-600 font-black">{formData.credit_score || 'N/A'}</span>
                      </label>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={formData.credit_score || 0}
                        onChange={e => setFormData({...formData, credit_score: Number(e.target.value)})}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 mt-3 accent-amber-500"
                      />
                    </div>
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
                  form="buyer-form"
                  className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                  {formData.id ? 'Save Changes' : 'Create Buyer'}
                </button>
              </div>
            </MotionDiv>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {buyerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <MotionDiv 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setBuyerToDelete(null)}
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
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Buyer?</h2>
                <p className="text-xs text-slate-500 mb-6">
                  Are you sure you want to remove this buyer from your CRM? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setBuyerToDelete(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleDeleteBuyer}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                  >
                    Delete Buyer
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
