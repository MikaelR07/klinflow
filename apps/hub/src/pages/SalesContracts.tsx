import { useState } from 'react';
import { 
  FileSignature, Search, Filter, Plus, CalendarClock, 
  ShieldCheck, ArrowUpRight, CheckCircle2, AlertCircle,
  MoreVertical, RefreshCcw, Building2, Eye, FileText
} from 'lucide-react';

const MOCK_CONTRACTS = [
  {
    id: 'CNT-2024-042',
    title: 'Annual PET Supply Agreement',
    counterparty: 'East Africa Packaging Ltd',
    type: 'Corporate Buyer',
    status: 'active',
    startDate: 'Jan 01, 2024',
    endDate: 'Dec 31, 2024',
    value: 45000000,
    complianceScore: 98,
    autoRenew: true
  },
  {
    id: 'CNT-2024-041',
    title: 'Q3 OCC Offtake Agreement',
    counterparty: 'Green Recyclers KE',
    type: 'Upstream Seller',
    status: 'expiring',
    startDate: 'Jul 01, 2024',
    endDate: 'Oct 31, 2024',
    value: 12500000,
    complianceScore: 85,
    autoRenew: false
  },
  {
    id: 'CNT-2024-040',
    title: 'Regional Logistics Partnership',
    counterparty: 'SwiftFreight Logistics',
    type: 'Partner',
    status: 'active',
    startDate: 'Mar 15, 2024',
    endDate: 'Mar 14, 2025',
    value: 8000000,
    complianceScore: 100,
    autoRenew: true
  },
  {
    id: 'CNT-2024-039',
    title: 'Bulk Aluminium Purchase',
    counterparty: 'Mombasa Steel Corp',
    type: 'Corporate Buyer',
    status: 'negotiation',
    startDate: 'Pending',
    endDate: 'Pending',
    value: 28000000,
    complianceScore: 0,
    autoRenew: false
  },
  {
    id: 'CNT-2023-012',
    title: 'Pilot HDPE Supply',
    counterparty: 'Nairobi Bottlers',
    type: 'Corporate Buyer',
    status: 'expired',
    startDate: 'Jun 01, 2023',
    endDate: 'Dec 31, 2023',
    value: 5000000,
    complianceScore: 92,
    autoRenew: false
  }
];

export default function SalesContracts() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'expiring' | 'negotiation'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContracts = MOCK_CONTRACTS.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.counterparty.toLowerCase().includes(searchQuery.toLowerCase());
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

  const activeContractsCount = MOCK_CONTRACTS.filter(c => c.status === 'active').length;
  const totalContractValue = MOCK_CONTRACTS.filter(c => ['active', 'expiring'].includes(c.status)).reduce((sum, c) => sum + c.value, 0);
  const pendingRenewalsCount = MOCK_CONTRACTS.filter(c => c.status === 'expiring').length;
  const avgCompliance = MOCK_CONTRACTS.filter(c => ['active', 'expiring'].includes(c.status)).reduce((sum, c, _, arr) => sum + (c.complianceScore / arr.length), 0);

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
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
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
            <h3 className="text-xl font-black text-indigo-700 dark:text-indigo-300 leading-none">KES {(totalContractValue / 1000000).toFixed(1)}M</h3>
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
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{avgCompliance.toFixed(1)}%</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Fulfillment adherence</p>
          </div>
        </div>

        {/* Controls & Tabs */}
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
                {filteredContracts.length > 0 ? (
                  filteredContracts.map(contract => {
                    const StatusIcon = getStatusIcon(contract.status);
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
                                <Building2 className="w-3 h-3" /> {contract.counterparty}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(contract.status)}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {contract.status.replace('_', ' ')}
                          </div>
                          {contract.autoRenew && (
                            <div className="mt-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                              <RefreshCcw className="w-3 h-3" /> Auto-Renew Enabled
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-xs text-[#131722] dark:text-white leading-none mb-1">
                            {contract.startDate} - {contract.endDate}
                          </p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{contract.id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-black text-sm text-[#131722] dark:text-white leading-none mb-1">
                            {(contract.value / 1000000).toFixed(2)}M
                          </p>
                          {contract.complianceScore > 0 && (
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                              {contract.complianceScore}% Compliant
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
                            <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                              <MoreVertical className="w-4 h-4" />
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
    </div>
  );
}
