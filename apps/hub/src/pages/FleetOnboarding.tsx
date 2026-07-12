import { useState, useMemo, useEffect } from 'react';
import { 
  Users, Search, CheckCircle2, XCircle, AlertCircle, FileText, 
  MapPin, Phone, Truck, ShieldCheck, Mail, Smartphone, RefreshCw, Activity, Calendar, ExternalLink, Settings2, Plus, Trash2, Save, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';

export default function FleetOnboarding() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [autoSmsEnabled, setAutoSmsEnabled] = useState(true);

  const { currentCompanyId, profile, fetchProfile } = useAuthStore() as any;
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [showConfig, setShowConfig] = useState(false);
  const [newDocInput, setNewDocInput] = useState('');
  const [requiredDocs, setRequiredDocs] = useState<string[]>([]);
  const [isSavingDocs, setIsSavingDocs] = useState(false);

  useEffect(() => {
    if (profile?.required_documents) {
      setRequiredDocs(profile.required_documents);
    }
  }, [profile]);

  const handleAddDocument = () => {
    if (newDocInput.trim() && !requiredDocs.includes(newDocInput.trim())) {
      setRequiredDocs(prev => [...prev, newDocInput.trim()]);
      setNewDocInput('');
    }
  };

  const handleRemoveDocument = (doc: string) => {
    setRequiredDocs(prev => prev.filter(d => d !== doc));
  };

  const handleSaveDocs = async () => {
    if (!profile?.id) return;
    setIsSavingDocs(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ required_documents: requiredDocs } as any)
        .eq('id', profile.id);

      if (error) throw error;
      toast.success("Onboarding requirements updated");
      if (fetchProfile) await fetchProfile();
      setShowConfig(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save requirements");
    } finally {
      setIsSavingDocs(false);
    }
  };

  const fetchRequests = async () => {
    if (!currentCompanyId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('company_join_requests')
        .select(`
          *,
          profiles:driver_id (
            name,
            phone,
            location
          )
        `)
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formatted = ((data as any[]) || []).map((r: any) => {
        const submittedDocs = r.submitted_documents || {};
        const parsedDocs: Record<string, { status: string, url: string }> = {};
        
        Object.entries(submittedDocs).forEach(([docName, url]) => {
          parsedDocs[docName] = { 
            status: r.status === 'approved' ? 'verified' : 'pending', 
            url: url as string 
          };
        });

        return {
          id: r.id,
          driver_id: r.driver_id,
          name: r.profiles?.name || 'Unknown',
          phone: r.profiles?.phone || 'N/A',
          location: r.profiles?.location?.address || 'N/A',
          vehicle: 'Vehicle', // Could be fetched from service_profile if needed
          status: r.status,
          appliedAt: new Date(r.created_at).toLocaleDateString(),
          documents: parsedDocs
        };
      });
      
      setRequests(formatted);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentCompanyId]);

  // --- Filtering ---
  const filteredApplicants = useMemo(() => {
    return requests.filter(app => {
      const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            app.phone.includes(searchQuery) ||
                            app.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'Pending') matchesTab = app.status === 'pending';
      if (activeTab === 'In Review') matchesTab = app.status === 'review';
      if (activeTab === 'Approved') matchesTab = app.status === 'approved';
      if (activeTab === 'Rejected') matchesTab = app.status === 'rejected';
      
      return matchesSearch && matchesTab;
    });
  }, [searchQuery, activeTab, requests]);

  const selectedApp = requests.find(a => a.id === selectedAppId);

  // --- KPI Calculations ---
  const totalApps = requests.length;
  const pendingApps = requests.filter(a => a.status === 'pending' || a.status === 'review').length;
  const rejectedApps = requests.filter(a => a.status === 'rejected').length;
  
  // Mocks for rates
  const applicationRate = '+12% this week';
  const rejectionRate = totalApps > 0 ? Math.round((rejectedApps / totalApps) * 100) : 0;

  const handleDocumentAction = (docKey: string, action: 'verify' | 'reject') => {
    toast.success(`Document marked as ${action === 'verify' ? 'Verified' : 'Rejected'}`);
    // State mutation would happen here in a real app
  };

  const handleFinalAction = async (action: 'approve' | 'reject') => {
    if (!selectedAppId) return;
    
    try {
      if (action === 'approve') {
        const { error } = await (supabase.rpc as any)('approve_fleet_driver_request', {
          p_request_id: selectedAppId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('company_join_requests')
          // @ts-ignore
          .update({ status: 'rejected' })
          .eq('id', selectedAppId);
        if (error) throw error;
      }
      
      toast.success(`Applicant ${action}d successfully`);
      fetchRequests();
      setSelectedAppId(null);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} applicant`);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'rejected': return 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400';
      case 'review': return 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
      default: return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Onboarding Management</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Review and approve new fleet agent applications.</p>
          </div>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${showConfig ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
          >
            <Settings2 className="w-4 h-4" /> Configure Requirements
          </button>
        </div>

        {/* Configuration Dropdown */}
        <AnimatePresence>
          {showConfig && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white">Required Fleet Documents</h3>
                    <p className="text-[11px] text-slate-500 mt-1">List the compliance documents that fleet drivers must upload when joining via your Invite Code.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <input 
                        type="text" 
                        value={newDocInput}
                        onChange={(e) => setNewDocInput(e.target.value)}
                        placeholder="e.g. Driving License, Logbook" 
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDocument(); } }}
                        className="flex-1 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-[#131722] dark:text-white"
                      />
                      <button 
                        type="button"
                        onClick={handleAddDocument}
                        className="px-4 py-2.5 bg-[#131722] dark:bg-white text-white dark:text-[#131722] rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center gap-2 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>

                    <button 
                      onClick={handleSaveDocs}
                      disabled={isSavingDocs}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                    >
                      {isSavingDocs ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Requirements</>}
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50 max-h-[200px] overflow-y-auto">
                    {requiredDocs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-4">
                        <FileText className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs font-bold text-slate-500">No documents required</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {requiredDocs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-lg shadow-sm">
                            <span className="text-[11px] font-bold text-[#131722] dark:text-white">{doc}</span>
                            <button 
                              type="button"
                              onClick={() => handleRemoveDocument(doc)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { icon: Users, label: 'Total Applications', value: totalApps, trend: 'Lifetime', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { icon: AlertCircle, label: 'Pending Review', value: pendingApps, trend: 'Needs action', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: XCircle, label: 'Rejected Applications', value: rejectedApps, trend: 'Total declined', color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { icon: Activity, label: 'Application Rate', value: '45/mo', trend: applicationRate, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: ShieldCheck, label: 'Rejection Rate', value: `${rejectionRate}%`, trend: 'Quality metric', color: 'text-slate-500', bg: 'bg-slate-500/10' },
          ].map((kpi, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex gap-4 items-center">
              <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center shrink-0`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">
                  {kpi.label}
                </p>
                <h3 className="text-lg font-bold text-[#131722] dark:text-white leading-none mt-1">{kpi.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Listings Table */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl overflow-hidden flex flex-col relative">
          
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by name, ID, or phone..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-[#131722] dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              {['All', 'Pending', 'In Review', 'Approved', 'Rejected'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50 sticky top-0 z-10 backdrop-blur">
                <tr>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Applicant</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Applied</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Location</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Vehicle</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500">Doc Verification</th>
                  <th className="px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredApplicants.map(app => {
                  const verifiedDocs = Object.values(app.documents).filter((d: any) => d.status === 'verified').length;
                  const totalDocs = Object.keys(app.documents).length;
                  const progress = (verifiedDocs / totalDocs) * 100;
                  
                  return (
                    <tr 
                      key={app.id} 
                      onClick={() => setSelectedAppId(app.id)}
                      className={`cursor-pointer transition-colors ${selectedAppId === app.id ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'}`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs">
                            {app.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#131722] dark:text-white">{app.name}</p>
                            <p className="font-medium text-[9px] text-slate-400">ID: {app.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-500">{app.appliedAt}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-500">{app.location}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-slate-500">{app.vehicle}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-24">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[9px] text-slate-500">{totalDocs > 0 ? `${verifiedDocs} of ${totalDocs}` : 'None Required'}</span>
                          </div>
                          {totalDocs > 0 && (
                            <div className="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredApplicants.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <Users className="w-8 h-8 text-slate-300 mb-3" />
                <p className="font-bold text-sm text-[#131722] dark:text-white">No applications found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- SLIDING PANEL FOR DOCUMENT REVIEW --- */}
      <AnimatePresence>
        {selectedAppId && selectedApp && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedAppId(null)}
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-[450px] bg-white dark:bg-slate-800 z-50 shadow-2xl border-l border-[#e0e3eb] dark:border-slate-800 overflow-y-auto flex flex-col"
            >
              
              {/* Panel Header */}
              <div className="p-4 pb-0 flex items-start justify-between">
                <button onClick={() => setSelectedAppId(null)} className="p-2 -ml-2 text-slate-400 hover:text-[#131722] dark:hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${getStatusColor(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>

              {/* Applicant Info */}
              <div className="p-6 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 font-bold text-2xl">
                  {selectedApp.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#131722] dark:text-white leading-tight">{selectedApp.name}</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Applicant ID: {selectedApp.id}</p>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col gap-8">
                
                {/* Basic Details Grid */}
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Applicant Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex gap-2">
                      <Phone className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedApp.phone}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Location</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedApp.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Truck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedApp.vehicle}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Applied</p>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">{selectedApp.appliedAt}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Verification Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Compliance Documents</h3>
                    <span className="text-[10px] font-bold text-emerald-500">
                      {Object.values(selectedApp.documents).filter((d: any) => d.status === 'verified').length} of {Object.keys(selectedApp.documents).length} Verified
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {Object.keys(selectedApp.documents).length === 0 ? (
                      <div className="p-6 border border-dashed border-[#e0e3eb] dark:border-slate-700 rounded-xl text-center">
                        <FileText className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-500">No Documents Uploaded</p>
                      </div>
                    ) : (
                      Object.entries(selectedApp.documents).map(([docName, docData]: [string, any]) => {
                        const status = docData.status;
                        
                        return (
                          <div key={docName} className={`p-4 rounded-xl border ${status === 'verified' ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/20' : status === 'rejected' ? 'bg-rose-50/30 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/20' : 'bg-slate-50 dark:bg-slate-900 border-[#e0e3eb] dark:border-slate-700'}`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-[#e0e3eb] dark:border-slate-700 ${status === 'verified' ? 'text-emerald-500' : status === 'rejected' ? 'text-rose-500' : 'text-slate-400'}`}>
                                  <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-[#131722] dark:text-white">{docName}</p>
                                  <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${status === 'verified' ? 'text-emerald-500' : status === 'rejected' ? 'text-rose-500' : 'text-amber-500'}`}>
                                    {status}
                                  </p>
                                </div>
                              </div>
                              <a href={docData.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                View File <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          
                          {status === 'rejected' && docData.reason && (
                            <div className="mt-2 mb-3 p-2 bg-rose-50 dark:bg-rose-500/10 rounded text-[10px] text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                              <span className="font-bold">Reason:</span> {docData.reason}
                            </div>
                          )}

                          <div className="flex gap-2 mt-2 pt-3 border-t border-[#e0e3eb] dark:border-slate-700/50">
                            <button 
                              onClick={() => handleDocumentAction(docName, 'verify')}
                              className="flex-1 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => handleDocumentAction(docName, 'reject')}
                              className="flex-1 py-1.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                  </div>
                </div>

                {/* Automation & Action */}
                <div className="mt-auto pt-6">
                  
                  {/* SMS Toggle */}
                  <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-[#e0e3eb] dark:border-slate-700 mb-4 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-slate-400" />
                      <div>
                        <p className="text-xs font-bold text-[#131722] dark:text-white">Send SMS Notification</p>
                        <p className="text-[9px] text-slate-500">Automatically notify applicant of decision.</p>
                      </div>
                    </div>
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoSmsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                      <input type="checkbox" className="sr-only" checked={autoSmsEnabled} onChange={() => setAutoSmsEnabled(!autoSmsEnabled)} />
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoSmsEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </label>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleFinalAction('reject')}
                      className="flex-1 py-3 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Reject Agent
                    </button>
                    <button 
                      onClick={() => handleFinalAction('approve')}
                      className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve Agent
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
