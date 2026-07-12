import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import {
  ArrowLeft, Search, Users, Receipt, DollarSign, Tag,
  ChevronRight, Clock, CheckCircle2, XCircle, Loader2,
  TrendingUp, UserPlus, Wallet, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

type CategoryType = 'onboarding' | 'deposits' | 'overrides';

// Mock data (same as OwnerApprovals for consistency)
const mockJoinRequests = [
  { id: 'jr-1', reqType: 'join', agent_name: 'John Kamau', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: 'jr-2', reqType: 'join', agent_name: 'Mercy Wanjiku', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 24 * 3600000).toISOString() },
  { id: 'jr-3', reqType: 'join', agent_name: 'Peter Ochieng', role: 'Agent Onboarding', status: 'pending', created_at: new Date(Date.now() - 48 * 3600000).toISOString() },
  { id: 'jr-4', reqType: 'join', agent_name: 'Sarah Njoki', role: 'Agent Onboarding', status: 'approved', created_at: new Date(Date.now() - 72 * 3600000).toISOString() },
  { id: 'jr-5', reqType: 'join', agent_name: 'Brian Kipchoge', role: 'Agent Onboarding', status: 'rejected', created_at: new Date(Date.now() - 96 * 3600000).toISOString() },
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
  { id: 'po-4', reqType: 'override', agent_name: 'Grace Akinyi', role: 'Price Override', item: 'Aluminium', requestedPrice: 'KES 120/kg', status: 'approved', created_at: new Date(Date.now() - 6 * 3600000).toISOString() },
];

const CATEGORY_CONFIG: Record<CategoryType, {
  title: string;
  subtitle: string;
  icon: any;
  iconColor: string;
  detailPath: string;
}> = {
  onboarding: {
    title: 'Onboarding Requests',
    subtitle: 'agent join requests',
    icon: Users,
    iconColor: 'text-blue-500',
    detailPath: '/approvals/onboarding',
  },
  deposits: {
    title: 'Deposit Requests',
    subtitle: 'fund & float requests',
    icon: Receipt,
    iconColor: 'text-emerald-500',
    detailPath: '/approvals/deposit',
  },
  overrides: {
    title: 'Override Requests',
    subtitle: 'price override requests',
    icon: Tag,
    iconColor: 'text-rose-500',
    detailPath: '/approvals/override',
  },
};

export default function ApprovalCategoryPage() {
  const navigate = useNavigate();
  const { category } = useParams<{ category: string }>();
  const { profile, currentCompanyId } = useAuthStore() as any;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed' | 'History'>('Pending');
  const [fundRequests, setFundRequests] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cat = (category || 'onboarding') as CategoryType;
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.onboarding;

  useEffect(() => {
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
        toast.error('Failed to load requests');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [currentCompanyId]);

  // Build full list for this category
  const allItems = useMemo(() => {
    if (cat === 'onboarding') {
      return [...joinRequests.map(r => ({ ...r, reqType: 'join' })), ...mockJoinRequests];
    }
    if (cat === 'deposits') {
      return [...fundRequests.map(r => ({ ...r, reqType: 'fund' })), ...mockFundRequests];
    }
    return [...mockPriceOverrides];
  }, [cat, joinRequests, fundRequests]);

  // KPI stats
  const kpiStats = useMemo(() => {
    const pending = allItems.filter(r => r.status === 'pending').length;
    const approved = allItems.filter(r => r.status === 'approved' || r.status === 'issued').length;
    const rejected = allItems.filter(r => r.status === 'rejected').length;
    const total = allItems.length;

    if (cat === 'onboarding') {
      return [
        { label: 'Total', value: total.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-500' },
        { label: 'Pending', value: pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500' },
        { label: 'Approved', value: approved.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500' },
        { label: 'Rejected', value: rejected.toString(), icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-500' },
      ];
    }
    if (cat === 'deposits') {
      const totalAmount = allItems.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const pendingAmount = allItems.filter(r => r.status === 'pending').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      return [
        { label: 'Total', value: total.toString(), icon: Receipt, color: 'text-emerald-600', bg: 'bg-emerald-500' },
        { label: 'Pending', value: pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500' },
        { label: 'Total Value', value: `KES ${totalAmount.toLocaleString()}`, icon: Wallet, color: 'text-indigo-600', bg: 'bg-indigo-500' },
        { label: 'Pending Value', value: `KES ${pendingAmount.toLocaleString()}`, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-500' },
      ];
    }
    // overrides
    return [
      { label: 'Total', value: total.toString(), icon: Tag, color: 'text-rose-600', bg: 'bg-rose-500' },
      { label: 'Pending', value: pending.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500' },
      { label: 'Approved', value: approved.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500' },
      { label: 'Rejected', value: rejected.toString(), icon: XCircle, color: 'text-slate-600', bg: 'bg-slate-500' },
    ];
  }, [allItems, cat]);

  // Tab + Search filter
  const filteredItems = useMemo(() => {
    // First filter by tab
    let items = allItems;
    if (activeTab === 'Pending') items = allItems.filter(r => r.status === 'pending');
    else if (activeTab === 'Completed') items = allItems.filter(r => r.status === 'approved' || r.status === 'issued');
    else if (activeTab === 'History') items = allItems.filter(r => r.status === 'rejected' || r.status === 'approved');

    // Then filter by search
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item =>
      (item.agent_name || '').toLowerCase().includes(q) ||
      (item.status || '').toLowerCase().includes(q) ||
      (item.item || '').toLowerCase().includes(q) ||
      (item.purpose || '').toLowerCase().includes(q) ||
      (item.role || '').toLowerCase().includes(q)
    );
  }, [allItems, searchQuery, activeTab]);

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

  const handleCardClick = (item: any) => {
    navigate(`${config.detailPath}/${item.id}`, { state: { request: item } });
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] max-w-lg mx-auto bg-[#F8F8FF] dark:bg-slate-900 shadow-sm border-b border-slate-100 dark:border-slate-800">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/approvals')}
                className="p-2 -ml-2 bg-[#F8F8FF] dark:bg-slate-800 rounded-full text-slate-500 active:scale-90 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-600 dark:text-white tracking-tight">{config.title}</h1>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{config.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="pt-[calc(env(safe-area-inset-top,1rem)+6rem)] pb-24 px-1.5">

        {/* ── KPI CARDS ── */}
        <div className="flex gap-1 px-1 mb-5">
          {kpiStats.map((kpi, i) => (
            <div
              key={i}
              className={`flex-1 min-w-0 rounded-xl ${kpi.bg} p-3 flex flex-col gap-2 relative overflow-hidden`}
            >
              <span className="text-base font-semibold text-white leading-none">{kpi.value}</span>
              <span className="text-[9px] font-bold capitalize tracking-widest text-white/90 truncate mt-auto">{kpi.label}</span>
              <kpi.icon className="absolute right-2 top-4 -translate-y-1/2 w-5 h-5 text-white opacity-20" strokeWidth={1.5} />
            </div>
          ))}
        </div>

        {/* ── SEARCH ── */}
        <div className="px-1 mb-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${config.title.toLowerCase()}...`}
              className="w-full pl-10 pr-4 py-3 bg-[#F8F8FF] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-0 px-1 mb-4 border-b border-slate-200 dark:border-slate-700">
          {(['Pending', 'Completed', 'History'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-xs font-bold relative ${
                activeTab === tab
                  ? 'text-slate-600 dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-1 right-1 h-[2.5px] bg-slate-900 dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── REQUEST LIST ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-[10px] font-bold capitalize tracking-widest">Loading requests...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-14 flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
              <Icon className={`w-7 h-7 ${config.iconColor} opacity-40`} />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">No requests found</p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">
              {searchQuery ? 'Try adjusting your search query.' : `No ${cat} requests yet.`}
            </p>
          </div>
        ) : (
          <div className="space-y-2 px-0.5">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {filteredItems.length} request{filteredItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-[#F8F8FF] dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50">
              {filteredItems.map((item, i) => (
                <button
                  key={item.id || i}
                  onClick={() => handleCardClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getInitialsColor(item.agent_name)}`}>
                    {getInitials(item.agent_name)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[12px] font-bold text-slate-700 dark:text-white truncate">{item.agent_name}</p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {cat === 'deposits' ? (item.purpose || item.role || 'Deposit') : (item.role || '—')}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <div className="flex items-center gap-3">
                      {cat === 'deposits' && (
                        <div>
                          <p className="text-[8px] text-slate-400 uppercase tracking-wider">Amount</p>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">KES {Number(item.amount || 0).toLocaleString()}</p>
                        </div>
                      )}
                      {cat === 'overrides' && (
                        <>
                          <div>
                            <p className="text-[8px] text-slate-400 uppercase tracking-wider">Item</p>
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{item.item || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[8px] text-slate-400 uppercase tracking-wider">Requested</p>
                            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{item.requestedPrice || '—'}</p>
                          </div>
                        </>
                      )}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
