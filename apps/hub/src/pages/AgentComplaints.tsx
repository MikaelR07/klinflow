import { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, CheckCircle2, Clock, User, X, 
  AlertTriangle, Search, Flag, MoreVertical, ShieldAlert, Loader2, EyeOff
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e', '#64748b'];

const getTicketNumber = (id: string, ticketNo?: string): string => {
  if (ticketNo) return ticketNo;
  if (!id) return 'CP-000-000';
  const clean = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const part1 = clean.substring(0, 3).padEnd(3, '0');
  const part2 = clean.substring(3, 6).padEnd(3, '0');
  return `CP-${part1}-${part2}`;
};

export default function AgentComplaints() {
  const { profile, currentCompanyId } = useAuthStore();
  const { agentComplaints = [], isLoadingComplaints, fetchHubAgentComplaints, updateAgentComplaintStatus } = useAgentStore();
  
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if ((currentCompanyId || profile?.id) && fetchHubAgentComplaints) {
      fetchHubAgentComplaints(currentCompanyId, profile?.id);
    }
  }, [currentCompanyId, profile?.id, fetchHubAgentComplaints]);

  const activeComplaints = useMemo(() => agentComplaints.filter(c => c.status !== 'resolved'), [agentComplaints]);
  const resolvedComplaints = useMemo(() => agentComplaints.filter(c => c.status === 'resolved'), [agentComplaints]);
  
  const stats = useMemo(() => ({
    open: activeComplaints.length,
    critical: activeComplaints.filter(c => c.priority === 'high' || c.priority === 'critical').length,
    resolved: resolvedComplaints.length,
    delayed: activeComplaints.filter(c => (new Date().getTime() - new Date(c.created_at).getTime()) > 48 * 60 * 60 * 1000).length,
    rejected: agentComplaints.filter(c => c.status === 'rejected').length
  }), [activeComplaints, resolvedComplaints, agentComplaints]);

  const criticalCases = useMemo(() => activeComplaints.filter(c => c.priority === 'high' || c.priority === 'critical').slice(0, 3), [activeComplaints]);

  const complaintsByTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    agentComplaints.forEach(c => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    const total = agentComplaints.length || 1; // prevent div by zero
    return Object.entries(counts).map(([name, count]) => ({
      name,
      value: Math.round((count / total) * 100),
      count
    })).sort((a, b) => b.value - a.value);
  }, [agentComplaints]);

  // Dynamic 7-day resolution flow calculation from real complaints data
  const resolutionFlowData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const result: { name: string; received: number; solved: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = dayNames[d.getDay()];

      let receivedCount = 0;
      let solvedCount = 0;

      agentComplaints.forEach(c => {
        if (c.created_at) {
          const createdDate = new Date(c.created_at).toISOString().split('T')[0];
          if (createdDate === dateStr) receivedCount++;
        }
        if (c.status === 'resolved' && c.updated_at) {
          const updatedDate = new Date(c.updated_at).toISOString().split('T')[0];
          if (updatedDate === dateStr) solvedCount++;
        }
      });

      result.push({
        name: dayLabel,
        received: receivedCount,
        solved: solvedCount
      });
    }

    return result;
  }, [agentComplaints]);

  const filteredComplaints = useMemo(() => agentComplaints.filter(c => {
    if (viewTab === 'open' && c.status === 'resolved') return false;
    if (viewTab === 'resolved' && c.status !== 'resolved') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, '');
      const ticketNo = getTicketNumber(c.id, (c as any).ticket_number).toLowerCase().replace(/[^a-z0-9]/g, '');
      const rawId = c.id.toLowerCase();
      const desc = c.description.toLowerCase();
      const type = c.type.toLowerCase();
      const reporter = (c as any).profiles?.name?.toLowerCase() || '';

      if (!desc.includes(q) && !rawId.includes(q) && !ticketNo.includes(q) && !type.includes(q) && !reporter.includes(q)) {
        return false;
      }
    }
    return true;
  }), [agentComplaints, viewTab, searchQuery]);

  const selectedComplaint = agentComplaints.find(c => c.id === selectedComplaintId);

  const handleResolve = async () => {
    if (!selectedComplaint) return;
    setIsResolving(true);
    if (!updateAgentComplaintStatus) {
      toast.error('Store not ready. Please restart dev server with --force.');
      setIsResolving(false);
      return;
    }
    const { success, error } = await updateAgentComplaintStatus(selectedComplaint.id, 'resolved', resolutionNote);
    setIsResolving(false);
    if (success) {
      toast.success('Complaint resolved successfully');
      setResolutionNote('');
      setSelectedComplaintId(null);
    } else {
      toast.error(error || 'Failed to resolve complaint');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-rose-600 text-white';
      case 'high': return 'bg-rose-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      case 'low': return 'bg-slate-400 text-white';
      default: return 'bg-slate-300 text-slate-700';
    }
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header Description */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Agent Complaints</h1>
            <span className="font-bold px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg text-[10px] uppercase tracking-widest">Fleet Operations</span>
          </div>
          <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest mt-2">
            Monitor, investigate and resolve complaints reported directly by your fleet agents.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT MAIN COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. TOP: NEEDS IMMEDIATE ATTENTION (IF ANY CRITICAL CASES) */}
            <div className="bg-white dark:bg-surface-900 border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-none overflow-hidden">
              <div className="px-5 py-4 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/20">
                <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Needs Immediate Attention
                </h3>
                <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest">View All Critical</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700/50">
                {criticalCases.length > 0 ? criticalCases.map((caseItem, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer" onClick={() => setSelectedComplaintId(caseItem.id)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2 h-2 rounded-full ${caseItem.priority === 'critical' ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'}`}></span>
                      <span className="text-xs font-bold text-[#131722] dark:text-white uppercase">{getTicketNumber(caseItem.id, (caseItem as any).ticket_number)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto uppercase tracking-widest ${caseItem.priority === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                        {caseItem.priority}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 line-clamp-1">{caseItem.type}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{format(new Date(caseItem.created_at), 'MMM d, hh:mm a')}</p>
                  </div>
                )) : (
                  <div className="col-span-3 p-6 text-center text-slate-500 text-sm font-bold">No critical cases currently.</div>
                )}
              </div>
            </div>

            {/* 2. TOP: MAIN DIRECTORY TABLE */}
            <div className="bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-[1rem] shadow-none flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-surface-950 p-1 rounded-xl w-fit shrink-0">
                  {['open', 'resolved', 'all'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setViewTab(tab as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewTab === tab ? 'bg-white dark:bg-surface-800 text-[#131722] dark:text-white shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      {tab}
                      <span className="ml-2 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">
                        {tab === 'open' ? activeComplaints.length : tab === 'resolved' ? resolvedComplaints.length : agentComplaints.length}
                      </span>
                    </button>
                  ))}
                </div>
                
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search by ticket no, category..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-surface-950 border border-[#e0e3eb] dark:border-white/10 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-none dark:text-white"
                  />
                </div>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-[490px] custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-surface-900 border-b border-[#e0e3eb] dark:border-white/10 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Ticket No</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Priority</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reported By</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {isLoadingComplaints ? (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">Loading records...</p>
                        </td>
                      </tr>
                    ) : filteredComplaints.length > 0 ? filteredComplaints.map(complaint => (
                      <tr key={complaint.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer" onClick={() => setSelectedComplaintId(complaint.id)}>
                        <td className="px-6 py-4 font-bold text-xs text-[#131722] dark:text-white uppercase tracking-wider">
                          {getTicketNumber(complaint.id, (complaint as any).ticket_number)}
                        </td>
                        <td className="px-6 py-4 font-bold text-xs text-[#131722] dark:text-white">
                          {complaint.type}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                              {complaint.is_anonymous ? <EyeOff className="w-3 h-3 text-slate-400"/> : <User className="w-3 h-3 text-slate-500" />}
                            </div>
                            <span className="font-bold text-xs text-slate-600 dark:text-slate-300">
                              {complaint.is_anonymous ? 'Anonymous Agent' : (complaint as any).profiles?.name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Clock className="w-3 h-3" /> {format(new Date(complaint.created_at), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                            complaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : complaint.status === 'rejected' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-4 py-1.5 rounded-lg border border-[#e0e3eb] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest transition-colors">
                            Review
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="py-20 text-center">
                          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No complaints found</p>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. BOTTOM: KPI SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
              {[
                { name: 'Open Complaints', value: stats.open, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShieldAlert },
                { name: 'Critical Issues', value: stats.critical, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Flag },
                { name: 'Resolved Issues', value: stats.resolved, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
                { name: 'Delayed (>48h)', value: stats.delayed, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock },
                { name: 'Rejected', value: stats.rejected, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: X },
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-4 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">{item.name}</p>
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{item.value}</h3>
                </div>
              ))}
            </div>

            {/* 4. BOTTOM: VISUALIZATIONS & ANALYTICS CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Complaints by Type Donut */}
              <div className="bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-5 shadow-none flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Complaints by Type</h3>
                  <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="w-2/5 flex flex-col justify-center space-y-3">
                    {complaintsByTypeData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <div>
                          <p className="text-[10px] font-bold text-[#131722] dark:text-white leading-none line-clamp-1" title={entry.name}>{entry.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{entry.count} ({entry.value}%)</p>
                        </div>
                      </div>
                    ))}
                    {complaintsByTypeData.length === 0 && (
                      <p className="text-[10px] font-bold text-slate-400">No data available.</p>
                    )}
                  </div>
                  <div className="w-3/5 flex items-center justify-center relative h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={complaintsByTypeData.length > 0 ? complaintsByTypeData : [{value:1, name:'None'}]} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                          {complaintsByTypeData.length > 0 ? complaintsByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          )) : <Cell fill="#e2e8f0" />}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#103349', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                      <span className="text-xl font-bold text-[#131722] dark:text-white">{agentComplaints.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Resolution Flow Area Chart (Fully Functional Dynamic Data) */}
              <div className="lg:col-span-2 bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-5 shadow-none flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white">Resolution Flow</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Real-time 7-day velocity</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5 text-rose-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Received
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Solved
                    </div>
                  </div>
                </div>
                <div className="h-48 w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={resolutionFlowData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => val >= 1000 ? `${val/1000}k` : val} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#103349', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="received" name="Received" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
                      <Area type="monotone" dataKey="solved" name="Solved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSolved)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR (Details Panel) */}
          <div className="lg:col-span-1 border-l border-[#e0e3eb] dark:border-white/10 pl-0 lg:pl-6 hidden lg:block">
            {selectedComplaint ? (
              <div className="animate-fade-in flex flex-col h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#131722] dark:text-white">Complaint Details</h3>
                    <button onClick={() => setSelectedComplaintId(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-surface-800 text-slate-400"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</p>
                      <div className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                        selectedComplaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                        : selectedComplaint.status === 'rejected' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        {selectedComplaint.status}
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-surface-950 p-3 rounded-lg border border-[#e0e3eb] dark:border-white/10 min-h-[80px]">
                      {selectedComplaint.description}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reporter</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white flex items-center gap-1">
                          {selectedComplaint.is_anonymous ? <><EyeOff className="w-3 h-3 text-slate-400"/> Anonymous</> : (selectedComplaint as any).profiles?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedComplaint.type}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  {selectedComplaint.status === 'open' ? (
                    <div className="bg-white dark:bg-surface-900 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Resolution Note (Optional)</p>
                      <textarea 
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                        placeholder="Add a note explaining how this was resolved..."
                        className="w-full bg-slate-50 dark:bg-surface-950 border border-[#e0e3eb] dark:border-white/10 rounded-xl p-3 text-xs font-medium text-[#131722] dark:text-white outline-none focus:border-emerald-500 transition-colors resize-none mb-3"
                        rows={3}
                      />
                      <button 
                        onClick={handleResolve}
                        disabled={isResolving}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
                      >
                        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                      </button>
                    </div>
                  ) : selectedComplaint.resolution_note && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolution Note
                      </p>
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        {selectedComplaint.resolution_note}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-xs">Select a complaint to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
