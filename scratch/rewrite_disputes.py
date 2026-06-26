import os

filepath = '/home/mikael/Desktop/Coding/Klinflow/apps/agent/src/pages/admin/DisputesPage.tsx'

content = """import { useEffect, useState } from 'react';
import { useDisputeStore } from '@klinflow/core/stores/disputeStore';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { Button } from '@klinflow/ui/components/primitives/Button';
import { 
  MessageSquareWarning, CheckCircle2, Clock, User, X, 
  AlertTriangle, Search, Flag, MoreVertical, ShieldAlert
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';

const timeDisputesData = [
  { name: 'Under 24h', value: 45 },
  { name: '24h - 48h', value: 30 },
  { name: 'Over 48h', value: 25 },
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

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

export default function DisputesPage() {
  const { disputes, isLoading, fetchDisputes, updateDisputeStatus } = useDisputeStore();
  const { profile } = useAuthStore();
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [viewTab, setViewTab] = useState<'active' | 'resolved' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDisputes(profile?.role, profile?.id);
  }, [fetchDisputes, profile]);

  const activeDisputes = disputes.filter(d => d.status !== 'resolved');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');
  
  // Calculate mock stats based on active disputes if possible, otherwise hardcoded to match template
  const stats = {
    open: activeDisputes.length,
    critical: activeDisputes.filter(d => d.priority === 'high' || d.dispute_type.toLowerCase().includes('payment')).length || 3,
    resolved: resolvedDisputes.length,
    delayed: 4,
    rejected: 2
  };

  const criticalCases = activeDisputes.filter(d => d.priority === 'high' || d.dispute_type.toLowerCase().includes('payment')).slice(0, 3);

  const filteredDisputes = disputes.filter(d => {
    if (viewTab === 'active' && d.status === 'resolved') return false;
    if (viewTab === 'resolved' && d.status !== 'resolved') return false;
    if (searchQuery && !d.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !d.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleResolve = async (id: string) => {
    await updateDisputeStatus(id, 'resolved', resolutionNotes);
    setSelectedDispute(null);
    setResolutionNotes('');
  };

  const selectedData = disputes.find(d => d.id === selectedDispute);

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-2">
          Dispute Resolution Center <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        </h1>
        <p className="font-medium text-xs font-medium text-slate-500 mt-2">
          Monitor, investigate and resolve operational, client and staff disputes across your network.
        </p>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { name: 'Open Disputes', value: stats.open, color: 'text-rose-500', bg: 'bg-rose-500/10', icon: ShieldAlert },
          { name: 'Critical Issues', value: stats.critical, color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Flag },
          { name: 'Resolved Issues', value: stats.resolved, color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
          { name: 'Delayed Disputes', value: stats.delayed, color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Clock },
          { name: 'Rejected Disputes', value: stats.rejected, color: 'text-slate-500', bg: 'bg-slate-500/10', icon: X },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.name}</p>
              <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center shrink-0`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-none">{item.value}</h3>
          </div>
        ))}
      </div>

      {/* ROW 2: ANALYSIS CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Disputes by Time Donut */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Disputes by Time</h3>
            <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4"/></button>
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="w-2/5 flex flex-col justify-center space-y-3">
              {timeDisputesData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-none line-clamp-1">{entry.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">{entry.value}%</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-3/5 flex items-center justify-center relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={timeDisputesData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                    {timeDisputesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                <span className="text-xl font-bold text-slate-900 dark:text-white">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Received vs Solved */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Disputes Received vs Solved</h3>
            <select className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-600 outline-none">
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

      {/* ROW 3 & 4: TABLES & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column (Span 3) */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Needs Immediate Attention */}
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between bg-rose-50/50 dark:bg-rose-900/20">
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Needs Immediate Attention
              </h3>
              <button className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">View All Critical</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
              {criticalCases.length > 0 ? criticalCases.map((caseItem, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => setSelectedDispute(caseItem.id)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{caseItem.id.substring(0, 8).toUpperCase()}</span>
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full ml-auto uppercase tracking-widest">CRITICAL</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 line-clamp-1">{caseItem.dispute_type}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{new Date(caseItem.created_at).toLocaleDateString()}</p>
                </div>
              )) : (
                <div className="col-span-3 p-6 text-center text-slate-500 text-sm font-bold">No critical cases.</div>
              )}
            </div>
          </div>

          {/* Main Dispute Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1rem] shadow-sm flex flex-col overflow-hidden">
            {/* Top Section: View Tabs & Search */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit shrink-0">
                {['active', 'resolved', 'all'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setViewTab(tab as any)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewTab === tab ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {tab} Disputes
                    <span className="ml-2 bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded-md text-[9px]">{tab === 'active' ? activeDisputes.length : tab === 'resolved' ? resolvedDisputes.length : disputes.length}</span>
                  </button>
                ))}
              </div>
              
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search disputes..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Table Data */}
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Dispute</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reported By</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-xs font-bold text-slate-500">Loading...</td></tr>
                  ) : filteredDisputes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <MessageSquareWarning className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest">No Disputes Found</h3>
                      </td>
                    </tr>
                  ) : filteredDisputes.map(dispute => (
                    <tr key={dispute.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${dispute.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600'}`}>
                            <MessageSquareWarning className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{dispute.id.substring(0, 8).toUpperCase()}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest line-clamp-1 max-w-[200px]">{dispute.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{dispute.dispute_type}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{dispute.raiser_name || 'Resident'}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dispute.raiser_phone || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 
                          dispute.status === 'investigating' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
                        }`}>
                          {dispute.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setSelectedDispute(dispute.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1rem] p-5 shadow-sm flex flex-col items-center">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white w-full mb-6">Resolution Insights</h3>
            
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest w-full text-center mb-2">Resolution Health Score</p>
            <div className="relative w-48 h-48 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{ value: 84 }, { value: 16 }]}
                    cx="50%" cy="50%" innerRadius={70} outerRadius={90}
                    startAngle={90} endAngle={-270}
                    dataKey="value" stroke="none"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f1f5f9" className="dark:fill-slate-800" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">84%</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Good</span>
              </div>
            </div>
            
            <div className="w-full flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
              <span>Target: 90%</span>
              <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[8px]">?</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESOLUTION MODAL */}
      <AnimatePresence>
        {selectedDispute && selectedData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDispute(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedData.status === 'resolved' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <MessageSquareWarning className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{selectedData.dispute_type}</h2>
                    <p className="text-xs font-bold text-slate-500">Reported {new Date(selectedData.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedDispute(null)} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Raised By</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedData.raiser_name || 'Anonymous'}</p>
                    <p className="text-xs font-bold text-slate-500">{selectedData.raiser_phone}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                      selectedData.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {selectedData.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Description</h3>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 mb-6">
                  {selectedData.description}
                </div>

                {selectedData.evidence_photos && selectedData.evidence_photos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Evidence</h3>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedData.evidence_photos.map((photo, i) => (
                        <img key={i} src={photo} alt="Evidence" className="h-32 w-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700" />
                      ))}
                    </div>
                  </div>
                )}

                {selectedData.status === 'resolved' && (
                  <div className="p-5 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30 rounded-xl">
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Resolution Notes
                    </h3>
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-500">
                      {selectedData.resolution_notes || 'Resolved without notes.'}
                    </p>
                  </div>
                )}

                {selectedData.status !== 'resolved' && profile?.role === 'admin' && (
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Resolve Dispute</h3>
                    <textarea
                      placeholder="Add resolution notes..."
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      className="w-full h-24 p-4 text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none mb-4 resize-none"
                    />
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => updateDisputeStatus(selectedData.id, 'investigating')} className="text-xs font-bold px-6 py-2.5 rounded-xl">
                        Investigate
                      </Button>
                      <Button onClick={() => handleResolve(selectedData.id)} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none px-6 py-2.5 rounded-xl shadow-md">
                        Close Dispute
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
"""

with open(filepath, 'w') as f:
    f.write(content)

print(f"Successfully rewrote {filepath}")
