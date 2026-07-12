import { useState } from 'react';
import { 
  FileText, Download, Calendar, Search, Filter, 
  Settings2, Plus, FileSpreadsheet, Clock, CheckCircle2,
  AlertTriangle, Play, Share2
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';

const SAVED_REPORTS = [
  { id: 1, title: 'End of Shift Yield Report', category: 'Processing', format: 'PDF', lastRun: 'Today, 18:00', schedule: 'Daily' },
  { id: 2, title: 'Weekly Fleet & Dispatch Summary', category: 'Logistics', format: 'Excel', lastRun: 'Last Friday', schedule: 'Weekly' },
  { id: 3, title: 'Monthly Intake Reconciliation', category: 'Intake', format: 'PDF', lastRun: 'May 31st', schedule: 'Monthly' },
  { id: 4, title: 'Exception & Quality Flag Log', category: 'Quality', format: 'CSV', lastRun: 'Yesterday', schedule: 'On Demand' },
];

const RECENT_EXPORTS = [
  { file: 'Q1_Yield_Analysis.pdf', user: 'Michael K.', time: '10 mins ago', status: 'completed' },
  { file: 'Supplier_Volume_May.csv', user: 'Sarah L.', time: '2 hours ago', status: 'completed' },
  { file: 'Fleet_Fuel_Cost.xlsx', user: 'System', time: '5 hours ago', status: 'failed' },
  { file: 'Daily_Dispatch_Log.pdf', user: 'Michael K.', time: 'Yesterday', status: 'completed' },
];

export default function CustomReports() {
  const { isDarkMode } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'library' | 'builder'>('library');

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Operational Reports</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Generate, schedule, and export custom data queries.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-[#131722] dark:text-white flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export Archive
            </button>
            <button 
              onClick={() => setActiveTab('builder')}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" /> New Report
            </button>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Reports', value: '24', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Automated Schedules', value: '6', icon: Calendar, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Exports This Week', value: '142', icon: Download, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Data Modules', value: '8', icon: Settings2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
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

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - Main Content */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Tabs */}
            <div className="flex items-center gap-6 border-b border-[#e0e3eb] dark:border-slate-700/50">
              {[
                { id: 'library', label: 'Saved Reports Library' },
                { id: 'builder', label: 'Report Builder' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${
                    activeTab === tab.id 
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                      : 'border-transparent text-slate-500 hover:text-[#131722] dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'library' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAVED_REPORTS.map((report) => (
                  <div key={report.id} className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-5 flex flex-col hover:border-emerald-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-[#e0e3eb] dark:border-slate-700 shrink-0">
                        {report.format === 'PDF' ? <FileText className="w-4 h-4 text-rose-500" /> : <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-500">
                        {report.category}
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white mb-1 line-clamp-1">{report.title}</h3>
                    <p className="text-[10px] text-slate-500 mb-4">Schedule: <span className="font-bold">{report.schedule}</span> • Last Run: {report.lastRun}</p>
                    
                    <div className="flex gap-2 mt-auto pt-4 border-t border-[#e0e3eb] dark:border-slate-700/50">
                      <button className="flex-1 px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-700 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5">
                        <Download className="w-3 h-3" /> Download
                      </button>
                      <button className="flex-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 transition-colors flex items-center justify-center gap-1.5">
                        <Play className="w-3 h-3" /> Run Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'builder' && (
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-5 border-b border-[#e0e3eb] dark:border-slate-700/50">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white">Configure Custom Report</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Select your parameters to build a customized data slice.</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Step 1: Module */}
                  <div>
                    <h4 className="text-xs font-bold text-[#131722] dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
                      Data Module
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Intake', 'Processing', 'Dispatch', 'Inventory'].map(mod => (
                        <button key={mod} className={`px-4 py-3 rounded-xl border text-xs font-bold transition-colors ${mod === 'Processing' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'border-[#e0e3eb] dark:border-slate-700 bg-transparent text-slate-500 hover:border-slate-400'}`}>
                          {mod}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 2: Date Range */}
                  <div>
                    <h4 className="text-xs font-bold text-[#131722] dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px]">2</span>
                      Date Range
                    </h4>
                    <div className="flex gap-4">
                      <input type="date" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none text-[#131722] dark:text-white" />
                      <div className="flex items-center text-slate-400 text-xs">to</div>
                      <input type="date" className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-lg text-xs outline-none text-[#131722] dark:text-white" />
                    </div>
                  </div>

                  {/* Step 3: Metrics */}
                  <div>
                    <h4 className="text-xs font-bold text-[#131722] dark:text-white mb-3 flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px]">3</span>
                      Included Metrics
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {['Total Volume', 'Yield Percentage', 'Waste/Moisture Loss', 'Processing Time', 'Operator Efficiency', 'Quality Flags'].map(metric => (
                        <label key={metric} className="flex items-center gap-3 p-3 border border-[#e0e3eb] dark:border-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/30">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" />
                          <span className="text-xs font-medium text-[#131722] dark:text-slate-300">{metric}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-[#e0e3eb] dark:border-slate-700/50 flex justify-end gap-3">
                  <button className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-[#131722] dark:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors">
                    Save as Template
                  </button>
                  <button className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Generate Report
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN - Logs & Automations */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Recent Exports */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" /> Recent Exports
                </h3>
              </div>
              <div className="p-0 flex flex-col divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {RECENT_EXPORTS.map((exp, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center border border-[#e0e3eb] dark:border-slate-700 shrink-0 ${exp.status === 'failed' ? 'opacity-50' : ''}`}>
                        {exp.file.endsWith('.pdf') ? <FileText className="w-3.5 h-3.5 text-rose-500" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold line-clamp-1 ${exp.status === 'failed' ? 'text-slate-400 line-through' : 'text-[#131722] dark:text-white'}`}>{exp.file}</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">By {exp.user} • {exp.time}</p>
                      </div>
                    </div>
                    {exp.status === 'failed' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : (
                      <button className="text-slate-400 hover:text-emerald-500 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Scheduled Automations */}
            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl flex flex-col relative overflow-hidden">
              <div className="px-5 py-4 border-b border-emerald-100 dark:border-emerald-500/20 flex items-center justify-between bg-emerald-100/30 dark:bg-emerald-900/20 relative z-10">
                <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Active Schedules
                </h3>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold">Auto</span>
              </div>
              <div className="p-5 space-y-4 relative z-10">
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold line-clamp-1">
                      End of Shift Yield Report
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Emails to CEO, Ops Manager daily at 18:00.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/30">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <Share2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold line-clamp-1">
                      Weekly Dispatch Log
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Sends CSV to Logistics Team every Friday 17:00.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
