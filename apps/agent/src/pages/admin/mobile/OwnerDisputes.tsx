import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useDisputeStore } from '@klinflow/core/stores/disputeStore';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Search, CheckCircle2, 
  ArrowLeft, Wallet, Package, UserX, Settings, SlidersHorizontal, Flag, Clock
} from 'lucide-react';

export default function OwnerDisputes() {
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const { disputes, fetchDisputes, isLoading } = useDisputeStore();
  
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDisputes(profile?.role, profile?.id);
  }, [fetchDisputes, profile]);

  const filteredDisputes = disputes.filter(d => {
    const matchSearch = !searchQuery || 
      d.dispute_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      d.agent_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchTab = true;
    if (activeTab === 'Open') matchTab = d.status === 'open';
    if (activeTab === 'Resolved') matchTab = d.status === 'resolved';
    if (activeTab === 'Rejected') matchTab = d.status === 'rejected';

    return matchSearch && matchTab;
  });

  const getPriorityConfig = (priority: string, status: string, type: string) => {
    if (status === 'resolved') return { icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' };
    if (status === 'rejected') return { icon: UserX, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' };
    if (type.toLowerCase().includes('price')) return { icon: ShieldAlert, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' };
    if (type.toLowerCase().includes('payment')) return { icon: Wallet, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' };
    if (type.toLowerCase().includes('service')) return { icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' };
    return { icon: Flag, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' };
  };

  const getStatusColor = (status: string) => {
    if (status === 'resolved') return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
    if (status === 'rejected') return 'text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';
    return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10';
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const openCount = disputes.filter(d => d.status === 'open').length;
  const resolvedCount = disputes.filter(d => d.status === 'resolved').length;
  const rejectedCount = disputes.filter(d => d.status === 'rejected').length;

  const tabs = [
    { key: 'All', label: 'All', count: disputes.length },
    { key: 'Open', label: 'Open', count: openCount },
    { key: 'Resolved', label: 'Resolved', count: resolvedCount },
    { key: 'Rejected', label: 'Rejected', count: rejectedCount },
  ];

  const disputeTypes = [
    { label: 'Price Disputes', icon: ShieldAlert, count: disputes.filter(a => a.dispute_type.toLowerCase().includes('price')).length, color: 'text-rose-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-rose-600' },
    { label: 'Payment Issues', icon: Wallet, count: disputes.filter(a => a.dispute_type.toLowerCase().includes('payment')).length, color: 'text-amber-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-amber-600' },
    { label: 'Service Issues', icon: Package, count: disputes.filter(a => a.dispute_type.toLowerCase().includes('service')).length, color: 'text-blue-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-blue-600' },
    { label: 'Agent Issues', icon: UserX, count: disputes.filter(a => a.dispute_type.toLowerCase().includes('agent')).length, color: 'text-violet-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-violet-600' },
    { label: 'Other', icon: Settings, count: disputes.filter(a => !['price','payment','service','agent'].some(t => a.dispute_type.toLowerCase().includes(t))).length, color: 'text-slate-600', bg: 'bg-[#F8F8FF] dark:bg-slate-800', borderColor: 'border-slate-600' },
  ];

  return (
    <div className="animate-in fade-in duration-300">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-950 border-b border-slate-100 dark:border-slate-900 shadow-sm">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/')} 
                className="p-2 -ml-2 bg-white dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Disputes</h1>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">view and solve issues related to your hub</p>
              </div>
            </div>
            <button className="flex items-center gap-1.5 text-emerald-600 active:scale-95 transition-all">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+6rem)] pb-6 space-y-5 px-1.5">

        {/* ── HERO STATS CARD ── */}
        <div className="bg-gradient-to-br from-blue-700 to-blue-500  rounded-xl border border-blue-600 p-4 ">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Dispute Overview</h3>
            <span className="text-[10px] font-medium text-slate-100">All time</span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-bold text-white uppercase tracking-widest mb-1 truncate">Total</p>
              <p className="text-base font-black text-slate-100 truncate">{disputes.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center" />
            <div className="flex-1 min-w-0 pl-2">
              <p className="text-[9px] font-bold text-white uppercase tracking-widest mb-1 truncate">Open</p>
              <p className="text-base font-black text-slate-100 truncate">{openCount}</p>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center" />
            <div className="flex-1 min-w-0 pl-2">
              <p className="text-[9px] font-bold text-white uppercase tracking-widest mb-1 truncate">Resolved</p>
              <p className="text-base font-black text-slate-100 truncate">{resolvedCount}</p>
            </div>
            <div className="w-px h-8 bg-slate-100 self-center" />
            <div className="flex-1 min-w-0 pl-2">
              <p className="text-[9px] font-bold text-white uppercase tracking-widest mb-1 truncate">Rejected</p>
              <p className="text-base font-black text-slate-100 truncate">{rejectedCount}</p>
            </div>
          </div>
        </div>

        {/* ── DISPUTES BY TYPE ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Disputes by Type</h3>
            <button className="text-[10px] font-bold text-emerald-600">slide to view more</button>
          </div>
          <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
            <div className="flex gap-1.5 w-max">
              {disputeTypes.map((type, i) => (
                <div 
                  key={i}
                  className={`w-[calc(25vw-0.75rem)] max-w-[100px] rounded-xl border ${type.borderColor} ${type.bg} p-2 flex flex-col gap-1.5 shrink-0`}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold text-slate-600 dark:text-white leading-none">{type.count}</span>
                    <type.icon className={`w-4 h-4 ${type.color} opacity-60 shrink-0`} />
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest ${type.color} leading-tight`}>{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SEARCH ── */}
        <div className="relative group mx-1.5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            placeholder="Search by Dispute ID, Agent or Type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold dark:text-white outline-none transition-all shadow-sm"
          />
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1.5">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all shrink-0 border ${
                activeTab === tab.key
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${activeTab === tab.key ? 'bg-emerald-200/50 dark:bg-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* ── RECENT DISPUTES LIST ── */}
        <div className="space-y-3 px-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Recent Disputes</h3>
            <button className="text-[10px] font-bold text-emerald-600">Mark all as read</button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-xl animate-pulse border border-slate-100 dark:border-slate-800" />)}
            </div>
          ) : filteredDisputes.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center bg-[#F8F8FF] dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4 opacity-50" />
              <p className="text-sm font-black text-slate-900 dark:text-white mb-1">No Disputes Found</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">You're all clear here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDisputes.map(dispute => {
                const config = getPriorityConfig(dispute.priority, dispute.status, dispute.dispute_type);
                const statusColor = getStatusColor(dispute.status);
                
                return (
                  <div 
                    key={dispute.id}
                    onClick={() => navigate(`/disputes/${dispute.id}`, { state: { dispute } })}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm active:scale-[0.98] transition-all cursor-pointer flex gap-3"
                  >
                    {/* Status Dot */}
                    <div className="pt-1 shrink-0">
                      <div className={`w-2 h-2 rounded-full ${dispute.status === 'resolved' ? 'bg-emerald-500' : dispute.status === 'open' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                    </div>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                      <config.icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight truncate">{dispute.dispute_type.replace(/_/g, ' ')}</h4>
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${statusColor} shrink-0`}>
                          {dispute.status}
                        </span>
                      </div>
                      
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate mb-1">
                        {dispute.dispute_id} • {dispute.agent_name || 'Unknown'}
                      </p>
                      
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {dispute.description || "No detailed description provided."}
                      </p>
                    </div>

                    {/* Time & Chevron */}
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <span className="text-[9px] font-bold text-slate-400">
                        {getTimeAgo(dispute.created_at)}
                      </span>
                      <ArrowLeft className="w-4 h-4 text-slate-300 rotate-180" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
