import { useState } from 'react';
import { 
  MessageSquare, CheckCircle2, Clock, User, X, 
  AlertTriangle, Search, Flag, MoreVertical, ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';

// --- MOCK DATA ---
const complaintsByTypeData = [
  { name: 'Vehicle Breakdown', value: 35 },
  { name: 'App Issue', value: 25 },
  { name: 'Salary Dispute', value: 20 },
  { name: 'Route Issue', value: 12 },
  { name: 'Other', value: 8 },
];

const receivedVsSolvedData = [
  { name: 'Mon', received: 12, solved: 10 },
  { name: 'Tue', received: 19, solved: 15 },
  { name: 'Wed', received: 15, solved: 18 },
  { name: 'Thu', received: 22, solved: 20 },
  { name: 'Fri', received: 28, solved: 25 },
  { name: 'Sat', received: 10, solved: 12 },
  { name: 'Sun', received: 5, solved: 8 },
];

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];

const MOCK_COMPLAINTS = [
  { id: 'CMP-2024-001', type: 'Vehicle Breakdown', reportedBy: 'John Doe', status: 'open', priority: 'high', date: 'Today, 10:30 AM', desc: 'Engine stalling on steep roads.' },
  { id: 'CMP-2024-002', type: 'App Issue', reportedBy: 'Jane Smith', status: 'open', priority: 'medium', date: 'Today, 09:15 AM', desc: 'Cannot complete pickup in the app.' },
  { id: 'CMP-2024-003', type: 'Salary Dispute', reportedBy: 'Peter Kamau', status: 'open', priority: 'high', date: 'Yesterday', desc: 'Missing bonus from last week.' },
  { id: 'CMP-2024-004', type: 'Route Issue', reportedBy: 'Sarah Wanjiru', status: 'resolved', priority: 'low', date: 'Oct 18', desc: 'Route assigned was inaccessible.' },
  { id: 'CMP-2024-005', type: 'Other', reportedBy: 'Michael Ochieng', status: 'resolved', priority: 'medium', date: 'Oct 17', desc: 'Need new uniform.' },
];

export default function AgentComplaints() {
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'open' | 'resolved' | 'all'>('open');
  const [searchQuery, setSearchQuery] = useState('');

  const activeComplaints = MOCK_COMPLAINTS.filter(c => c.status !== 'resolved');
  const resolvedComplaints = MOCK_COMPLAINTS.filter(c => c.status === 'resolved');
  
  const stats = {
    open: activeComplaints.length,
    critical: activeComplaints.filter(c => c.priority === 'high').length,
    resolved: resolvedComplaints.length,
    delayed: 1,
    rejected: 0
  };

  const criticalCases = activeComplaints.filter(c => c.priority === 'high').slice(0, 3);

  const filteredComplaints = MOCK_COMPLAINTS.filter(c => {
    if (viewTab === 'open' && c.status === 'resolved') return false;
    if (viewTab === 'resolved' && c.status !== 'resolved') return false;
    if (searchQuery && !c.desc.toLowerCase().includes(searchQuery.toLowerCase()) && !c.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            {/* ROW 1: KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { name: 'Open Complaints', value: stats.open, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShieldAlert },
                { name: 'Critical Issues', value: stats.critical, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Flag },
                { name: 'Resolved Issues', value: stats.resolved, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
                { name: 'Delayed', value: stats.delayed, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock },
                { name: 'Rejected', value: stats.rejected, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: X },
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 shadow-none flex flex-col justify-between hover:shadow-none transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</p>
                    <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{item.value}</h3>
                </div>
              ))}
            </div>

            {/* ROW 2: ANALYSIS CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Complaints by Type Donut */}
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 shadow-none flex flex-col">
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
                          <p className="text-[10px] font-bold text-slate-500 mt-0.5">{entry.value}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="w-3/5 flex items-center justify-center relative h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={complaintsByTypeData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                          {complaintsByTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                      <span className="text-xl font-bold text-[#131722] dark:text-white">100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 2: Received vs Solved */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-5 shadow-none flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Complaints Received vs Solved</h3>
                  <select className="text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-md px-2 py-1 text-slate-600 dark:text-slate-300 outline-none">
                    <option>This Week</option>
                    <option>This Month</option>
                  </select>
                </div>
                <div className="h-48 w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={receivedVsSolvedData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
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
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                      <Area type="monotone" dataKey="received" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorReceived)" />
                      <Area type="monotone" dataKey="solved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSolved)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ROW 3: TABLES */}
            <div className="space-y-6">
              {/* Needs Immediate Attention */}
              <div className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-none overflow-hidden">
                <div className="px-5 py-4 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/20">
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Needs Immediate Attention
                  </h3>
                  <button className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest">View All Critical</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-700/50">
                  {criticalCases.length > 0 ? criticalCases.map((caseItem, i) => (
                    <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors cursor-pointer" onClick={() => setSelectedComplaint(caseItem.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span className="text-xs font-bold text-[#131722] dark:text-white">{caseItem.id.substring(0, 12).toUpperCase()}</span>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-full ml-auto uppercase tracking-widest">CRITICAL</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 line-clamp-1">{caseItem.type}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{caseItem.date}</p>
                    </div>
                  )) : (
                    <div className="col-span-3 p-6 text-center text-slate-500 text-sm font-bold">No critical cases.</div>
                  )}
                </div>
              </div>

              {/* Main Directory Table */}
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-[1rem] shadow-none flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit shrink-0">
                    {['open', 'resolved', 'all'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setViewTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewTab === tab ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-none' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        {tab}
                        <span className="ml-2 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">
                          {tab === 'open' ? activeComplaints.length : tab === 'resolved' ? resolvedComplaints.length : MOCK_COMPLAINTS.length}
                        </span>
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search complaints..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto flex-1 min-h-[300px]">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID / Date</th>
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Reported By</th>
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                      {filteredComplaints.length > 0 ? filteredComplaints.map(complaint => (
                        <tr key={complaint.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer" onClick={() => setSelectedComplaint(complaint.id)}>
                          <td className="px-6 py-4">
                            <p className="font-bold text-xs text-[#131722] dark:text-white mb-1">{complaint.id}</p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                              <Clock className="w-3 h-3" /> {complaint.date}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${complaint.priority === 'high' ? 'bg-rose-500' : complaint.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                              <span className="font-bold text-xs text-[#131722] dark:text-white">{complaint.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-slate-500" />
                              </div>
                              <span className="font-bold text-xs text-slate-600 dark:text-slate-300">{complaint.reportedBy}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                              complaint.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
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
                          <td colSpan={5} className="py-20 text-center">
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
            </div>
          </div>

          {/* RIGHT SIDEBAR (Details Panel) */}
          <div className="lg:col-span-1 border-l border-[#e0e3eb] dark:border-slate-700/50 pl-0 lg:pl-6 hidden lg:block">
            {selectedComplaint ? (
              <div className="animate-fade-in flex flex-col h-full space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-[#131722] dark:text-white">Complaint Details</h3>
                    <button onClick={() => setSelectedComplaint(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                      <span className="font-bold text-sm text-[#131722] dark:text-white">Requires Investigation</span>
                    </div>

                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-4 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-[#e0e3eb] dark:border-slate-700/50">
                      {MOCK_COMPLAINTS.find(c => c.id === selectedComplaint)?.desc}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Reporter</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{MOCK_COMPLAINTS.find(c => c.id === selectedComplaint)?.reportedBy}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{MOCK_COMPLAINTS.find(c => c.id === selectedComplaint)?.type}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <button className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20">
                    Mark as Resolved
                  </button>
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
