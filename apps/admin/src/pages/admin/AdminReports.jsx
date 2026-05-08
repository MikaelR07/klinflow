/**
 * Admin Reports Page — NEMA report generation + operational reports
 */
import { FileText, Download, Calendar, Sparkles, BarChart3, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@cleanflow/core';

const reports = [
  { title: 'Monthly Operations Report', period: 'March 2026', type: 'Operations', date: '2026-04-01', size: '2.4 MB' },
  { title: 'Agent Performance Summary', period: 'Q1 2026', type: 'HR', date: '2026-04-05', size: '1.8 MB' },
  { title: 'Revenue & Collections', period: 'March 2026', type: 'Finance', date: '2026-04-02', size: '3.1 MB' },
  { title: 'Customer Satisfaction', period: 'Q1 2026', type: 'CX', date: '2026-04-08', size: '1.2 MB' },
];

const typeColors = {
  Operations: 'bg-blue-100 text-blue-700',
  HR: 'bg-purple-100 text-purple-700',
  Finance: 'bg-green-100 text-green-700',
  CX: 'bg-orange-100 text-orange-700',
};

export default function AdminReports() {
  const navigate = useNavigate();
  const { openNemaModal } = useAdminStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-slate-400">Generate and download compliance & operational reports</p>
        </div>
      </div>

      {/* NEMA AI Report */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border-2 border-dashed border-primary/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="font-semibold text-lg">AI NEMA Compliance Report</h2>
            <p className="text-sm text-slate-500 mt-1">
              Auto-generate a comprehensive NEMA quarterly report with waste diversion rates, 
              CO₂ savings, compliance scores, and estate breakdowns — all powered by AI.
            </p>
          </div>
          <button 
            onClick={() => navigate('/environmental-report')} 
            className="btn-primary whitespace-nowrap text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            <Sparkles className="w-4 h-4" /> Generate Live Report
          </button>
        </div>
      </div>

      {/* Past Reports */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Past Reports</h3>
          <button className="text-xs text-primary font-semibold hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {reports.map((report, i) => (
            <div 
              key={i} 
              onClick={() => {
                if (report.title === 'Revenue & Collections') navigate('/financial-report');
              }}
              className={`flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors ${report.title === 'Revenue & Collections' ? 'cursor-pointer border-l-4 border-emerald-500' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200">
                  <FileText className={`w-5 h-5 ${report.title === 'Revenue & Collections' ? 'text-emerald-500' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{report.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[report.type]}`}>
                      {report.type}
                    </span>
                    <span className="text-xs text-slate-400">{report.period}</span>
                    {report.title === 'Revenue & Collections' ? (
                      <span className="text-[8px] font-semibold text-emerald-500 uppercase tracking-tighter bg-emerald-500/10 px-1.5 rounded">Live Report</span>
                    ) : (
                      <>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">{report.size}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card flex items-center gap-3 p-4">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <p className="text-lg font-semibold">24</p>
            <p className="text-xs text-slate-400">Reports Generated</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <Calendar className="w-8 h-8 text-secondary" />
          <div>
            <p className="text-lg font-semibold">Q1 2026</p>
            <p className="text-xs text-slate-400">Latest Period</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <TrendingUp className="w-8 h-8 text-accent" />
          <div>
            <p className="text-lg font-semibold">94%</p>
            <p className="text-xs text-slate-400">Compliance Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
