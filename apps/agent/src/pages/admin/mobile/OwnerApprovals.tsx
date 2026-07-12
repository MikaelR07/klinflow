import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { 
  Wallet, UserPlus, Tag, Clock, ChevronDown, ChevronUp, 
  ArrowLeft, ChevronRight, Users, Receipt, DollarSign,
  Search, History
} from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerApprovals() {
  const navigate = useNavigate();
  const { profile, currentCompanyId } = useAuthStore() as any;
  const [searchQuery, setSearchQuery] = useState('');
  
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Collapsed state for each section
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Mock data for richer display
  const mockJoinRequests = [
    { id: 'jr-1', reqType: 'join', agent_name: 'John Kamau', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'jr-2', reqType: 'join', agent_name: 'Mercy Wanjiku', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
    { id: 'jr-3', reqType: 'join', agent_name: 'Peter Ochieng', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  ];

  const mockFundRequests = [
    { id: 'fr-1', reqType: 'fund', agent_name: 'James Mwangi', role: 'Fleet Agent', amount: 8000, purpose: 'Float Top-up', status: 'pending', created_at: new Date(Date.now() - 30 * 60000).toISOString() },
    { id: 'fr-2', reqType: 'fund', agent_name: 'David Mutua', role: 'Independent Agent', amount: 5000, purpose: 'Fuel Purchase', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'fr-3', reqType: 'fund', agent_name: 'Grace Akinyi', role: 'Fleet Agent', amount: 12500, purpose: 'Fleet Maintenance', status: 'pending', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: 'fr-4', reqType: 'fund', agent_name: 'Alice Njeri', role: 'Fleet Agent', amount: 3000, purpose: 'Fuel Purchase', status: 'approved', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
    { id: 'fr-5', reqType: 'fund', agent_name: 'Tom Otieno', role: 'Independent Agent', amount: 7500, purpose: 'Equipment', status: 'approved', created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
    { id: 'fr-6', reqType: 'fund', agent_name: 'Samuel Kibet', role: 'Fleet Agent', amount: 4200, purpose: 'Float Top-up', status: 'rejected', created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  ];

  const mockPriceOverrides = [
    { id: 'po-1', reqType: 'override', agent_name: 'James Mwangi', role: 'Price Override', item: 'PET', requestedPrice: 'KES 55/kg', status: 'pending', created_at: new Date(Date.now() - 15 * 60000).toISOString() },
    { id: 'po-2', reqType: 'override', agent_name: 'Peter Ochieng', role: 'Price Override', item: 'HDPE', requestedPrice: 'KES 48/kg', status: 'pending', created_at: new Date(Date.now() - 45 * 60000).toISOString() },
    { id: 'po-3', reqType: 'override', agent_name: 'Mercy Wanjiku', role: 'Price Override', item: 'Cardboard', requestedPrice: 'KES 30/kg', status: 'pending', created_at: new Date(Date.now() - 3600000).toISOString() },
  ];

  const fetchData = async () => {
    if (!currentCompanyId) return;
    setIsLoading(true);
    try {
      const [funds, joins] = await Promise.all([
        supabase.from('fund_requests').select('*').eq('company_id', currentCompanyId).order('created_at', { ascending: false }),
        supabase.from('company_join_requests').select('*').eq('company_id', currentCompanyId).order('created_at', { ascending: false })
      ]);
      setFundRequests(funds.data || []);
      setJoinRequests(joins.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load approvals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentCompanyId]);

  // Combine real + mock data
  const allOnboarding = [...joinRequests.map(r => ({ ...r, reqType: 'join' })), ...mockJoinRequests];
  const allDeposits = [...fundRequests.map(r => ({ ...r, reqType: 'fund' })), ...mockFundRequests];
  const allOverrides = [...mockPriceOverrides];

  // Always show pending items on this page
  const pendingOnboarding = allOnboarding.filter(r => r.status === 'pending');
  const pendingDeposits = allDeposits.filter(r => r.status === 'pending');
  const pendingOverrides = allOverrides.filter(r => r.status === 'pending');
  const totalPending = pendingOnboarding.length + pendingDeposits.length + pendingOverrides.length;

  // Search filter
  const filterBySearch = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.agent_name || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q) ||
      (item.purpose || '').toLowerCase().includes(q) ||
      (item.item || '').toLowerCase().includes(q)
    );
  };

  const filteredOnboarding = filterBySearch(pendingOnboarding);
  const filteredDeposits = filterBySearch(pendingDeposits);
  const filteredOverrides = filterBySearch(pendingOverrides);

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getInitialsColor = (name?: string) => {
    const colors = [
      'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
      'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
      'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400',
      'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400',
      'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400',
    ];
    const idx = (name || '?').charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const statusBadge = (status: string) => {
    if (status === 'pending') return 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
    if (status === 'approved' || status === 'issued') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
    if (status === 'rejected') return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
    return 'bg-slate-50 text-slate-500';
  };

  const summaryCards = [
    { label: 'All Pending', count: totalPending, color: 'text-white', bg: 'bg-emerald-500 dark:bg-emerald-500', borderColor: 'border-emerald-200 dark:border-emerald-500/20', icon: Receipt },
    { label: 'Onboarding', count: pendingOnboarding.length, color: 'text-blue-500', bg: 'bg-[#F8F8FF] dark:bg-blue-500', borderColor: 'border-[#F8F8FF  ] dark:border-blue-500/20', icon: Users },
    { label: 'Deposit', count: pendingDeposits.length, color: 'text-amber-500', bg: 'bg-[#F8F8FF] dark:bg-amber-500', borderColor: 'border-[#F8F8FF] dark:border-amber-500/20', icon: Wallet },
    { label: 'Override', count: pendingOverrides.length, color: 'text-rose-500', bg: 'bg-[#F8F8FF] dark:bg-rose-500', borderColor: 'border-[#F8F8FF] dark:border-rose-500/20', icon: DollarSign },
  ];

  // Render a section
  const renderSection = (
    key: string,
    title: string,
    icon: any,
    iconColor: string,
    iconBg: string,
    items: any[],
    renderRow: (item: any, i: number) => React.ReactNode,
    viewAllPath?: string
  ) => {
    if (items.length === 0) return null;
    const isCollapsed = collapsedSections[key];
    const Icon = icon;
    return (
      <div className="bg-[#F8F8FF] dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Section Header */}
        <button 
          onClick={() => toggleSection(key)}
          className="w-full flex items-center justify-between px-4 py-3.5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Icon className={`w-4 h-4 ${iconColor}`} />
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[11px] font-black ${iconColor} min-w-[20px] h-5 rounded-full ${iconBg} flex items-center justify-center px-1.5`}>
              {items.length}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>

        {/* Items */}
        {!isCollapsed && (
          <div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {items.slice(0, 3).map((item, i) => renderRow(item, i))}
            </div>
            {viewAllPath && items.length > 0 && (
              <button 
                onClick={() => navigate(viewAllPath)}
                className="w-full flex items-center justify-between px-4 py-3 text-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-colors"
              >
                <span className="text-[11px] font-bold">View all {title.toLowerCase()}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-300">
      
      {/* ── OWN TOP NAV ── */}
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
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">Request Approvals</h1>
                <p className="text-[12px] font-medium text-slate-500 mt-0.5">Review and manage pending agent requests</p>
              </div>
            </div>
            <button 
              // onClick={() => navigate('/approvals/category/deposits?tab=History')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-slate-500 active:scale-95 shadow-sm border border-slate-100 dark:border-slate-700"
            >
              <History className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content with top padding for fixed nav */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+6rem)] pb-6 space-y-5 px-1">

        {/* ── SUMMARY CARDS ── */}
        <div className="flex gap-1 px-1">
          {summaryCards.map((card, i) => (
            <div 
              key={i} 
              className={`flex-1 min-w-0 rounded-xl border ${card.borderColor} ${card.bg} p-3 flex flex-col gap-2`}
            >
              <div className="flex items-start justify-between">
                <span className="text-base font-semibold text-slate-600 dark:text-white leading-none">{card.count}</span>
                <card.icon className={`w-4 h-4 ${card.color} opacity-80 shrink-0`} />
              </div>
              <span className={`text-[9px] font-bold capitalize tracking-widest ${card.color} truncate mt-auto`}>{card.label}</span>
            </div>
          ))}
        </div>
        {/* ── SEARCH ── */}
        <div className="px-1">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pending requests..."
              className="w-full pl-10 pr-4 py-3 bg-[#F8F8FF] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ── GROUPED SECTIONS ── */}
        {isLoading ? (
          <div className="text-center py-10 text-slate-400 text-sm font-medium">Loading requests...</div>
        ) : (
          <div className="space-y-3 px-0.5 !mt-2">

            {/* Onboarding Requests */}
            {renderSection(
              'onboarding',
              'Onboarding Requests',
              Users,
              'text-blue-500',
              'bg-blue-100 dark:bg-blue-500/20',
              filteredOnboarding,
              (item, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(`/approvals/onboarding/${item.id}`, { state: { request: item } })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:bg-slate-800"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center  justify-center text-xs font-bold shrink-0 ${getInitialsColor(item.agent_name)}`}>
                    {getInitials(item.agent_name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12px] font-bold text-slate-700 dark:text-white truncate">{item.agent_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{item.role || 'Agent Onboarding'}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[9px] text-slate-600 uppercase tracking-wider">Submitted</p>
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{getTimeAgo(item.created_at)}</p>
                      </div>
                     
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Status</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize ${statusBadge(item.status)}`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ),
              '/approvals/category/onboarding'
            )}

            {/* Deposit Requests */}
            {renderSection(
              'deposits',
              'Deposit Requests',
              Receipt,
              'text-emerald-500',
              'bg-emerald-100 dark:bg-emerald-500/20',
              filteredDeposits,
              (item, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(`/approvals/deposit/${item.id}`, { state: { request: item } })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${getInitialsColor(item.agent_name)}`}>
                    {getInitials(item.agent_name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{item.agent_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.role || 'Fleet Agent'}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Amount</p>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">KES {Number(item.amount || 0).toLocaleString()}</p>
                      </div>
                    
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Submitted</p>
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{getTimeAgo(item.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Status</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize ${statusBadge(item.status)}`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ),
              '/approvals/category/deposits'
            )}

            {/* Override Requests */}
            {renderSection(
              'overrides',
              'Override Requests',
              Tag,
              'text-rose-500',
              'bg-rose-100 dark:bg-rose-500/20',
              filteredOverrides,
              (item, i) => (
                <button 
                  key={i}
                  onClick={() => navigate(`/approvals/override/${item.id}`, { state: { request: item } })}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${getInitialsColor(item.agent_name)}`}>
                    {getInitials(item.agent_name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12px] font-bold text-slate-900 dark:text-white truncate">{item.agent_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.role || 'Price Override'}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Item</p>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{item.item || '—'}</p>
                      </div>
                      
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Requested</p>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{item.requestedPrice || '—'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Submitted</p>
                        <p className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{getTimeAgo(item.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider">Status</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md capitalize ${statusBadge(item.status)}`}>{item.status}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ),
              '/approvals/category/overrides'
            )}

            {/* Empty state */}
            {filteredOnboarding.length === 0 && filteredDeposits.length === 0 && filteredOverrides.length === 0 && (
              <div className="text-center py-14 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Receipt className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">All caught up!</p>
                <p className="text-[11px] font-medium text-slate-500 mt-1">No {activeTab.toLowerCase()} requests.</p>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
