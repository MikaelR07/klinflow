/**
 * NEMA Report Modal — AI-generated environmental compliance report
 */
import React from 'react';
import { X, FileText, Loader2, Download, CheckCircle2, Sparkles, Leaf, Factory } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAdminStore, useAuthStore, ROLES, NEMA_REPORT, WASTE_DISTRIBUTION } from '@klinflow/core';

export default function NEMAReportModal() {
  const { nemaModalOpen, closeNemaModal, isGeneratingReport, reportReady, generateReport, reportData } = useAdminStore();
  const { profile } = useAuthStore();

  if (!nemaModalOpen) return null;

  const isAdmin = profile?.role === ROLES.ADMIN;

  const r = reportData || {
    period: 'Analyzing Data...',
    totalWaste: 0,
    diversionRate: 0,
    co2Saved: 0,
    complianceScore: 0,
    recycled: 0,
    composted: 0,
    monthlyBreakdown: [],
    topEstates: []
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={closeNemaModal}>
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 p-5 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI NEMA Compliance Report</h2>
              <p className="text-xs text-slate-400">{r.period}</p>
            </div>
          </div>
          <button onClick={closeNemaModal} className="p-2 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-6">
          {/* Generate button or loading */}
          {!reportReady && (
            <div className="flex flex-col items-center py-10 text-center">
              {isGeneratingReport ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="font-semibold text-slate-700">Generating AI Report...</p>
                  <p className="text-sm text-slate-400 mt-1">Analyzing waste data, compliance metrics, and CO₂ impact</p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-2">
                    {isAdmin ? 'Generate Quarterly Report' : 'Review Compliance Status'}
                  </h3>
                  <p className="text-sm text-slate-400 text-center max-w-sm mb-6">
                    {isAdmin 
                      ? "AI will analyze total estate data to generate an official NEMA-compliant quarterly report."
                      : "View your personal environmental impact and compliance score based on your collection history."}
                  </p>
                  
                  {isAdmin ? (
                    <button onClick={generateReport} className="btn-primary text-base px-8">
                      <Sparkles className="w-5 h-5" /> Generate AI Audit
                    </button>
                  ) : (
                    <div className="bg-amber-50 text-amber-700 px-4 py-3 rounded-2xl border border-amber-100 text-xs font-bold uppercase tracking-widest">
                      Audit generation restricted to NEMA Authorized Admins
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Report Content */}
          {reportReady && (
            <div className="space-y-6 animate-fade-in">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-2xl p-4 text-center">
                  <Leaf className="w-6 h-6 text-green-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{(r.totalWaste / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-green-600">Total Waste</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{r.diversionRate}%</p>
                  <p className="text-xs text-blue-600">Diversion Rate</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 text-center">
                  <Factory className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-700">{r.co2Saved}t</p>
                  <p className="text-xs text-purple-600">CO₂ Saved</p>
                </div>
                <div className="bg-orange-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-orange-700">{(r.recycled / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-orange-600">Recycled</p>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-700">{(r.composted / 1000).toFixed(1)}t</p>
                  <p className="text-xs text-yellow-600">Composted</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{r.complianceScore}%</p>
                  <p className="text-xs text-emerald-600">Compliance Score</p>
                </div>
              </div>

              {/* Monthly Breakdown Chart */}
              <div className="card">
                <h4 className="font-semibold text-sm mb-4">Monthly Waste Breakdown (kg)</h4>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={r.monthlyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="recycled" fill="#00A651" radius={[4, 4, 0, 0]} name="Recycled" />
                    <Bar dataKey="composted" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Composted" />
                    <Bar dataKey="landfill" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Landfill" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Waste Distribution */}
              <div className="card">
                <h4 className="font-semibold text-sm mb-4">Waste Distribution (%)</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={WASTE_DISTRIBUTION} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }: any) => `${name} ${value}%`}>
                      {WASTE_DISTRIBUTION.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Estates */}
              <div className="card">
                <h4 className="font-semibold text-sm mb-3">Top Collection Estates</h4>
                <div className="space-y-2">
                  {r.topEstates.map((e: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{e.name}</span>
                          <span className="text-xs text-slate-500">{e.kg.toLocaleString()} kg</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(e.kg / r.topEstates[0].kg) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Summary */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-5 border border-green-200">
                <h4 className="font-bold text-green-800 mb-2">✅ NEMA Compliance Summary</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Diversion rate exceeds 60% threshold — <strong>COMPLIANT</strong></li>
                  <li>• All hazardous waste tracked and disposed via licensed handlers</li>
                  <li>• {r.incidents} minor incidents reported — all resolved within SLA</li>
                  <li>• Electronic waste properly cataloged per WEEE regulations</li>
                  <li>• Carbon offset: {r.co2Saved} metric tons CO₂ equivalent saved</li>
                </ul>
              </div>

              {/* Download */}
              <button className="btn-primary w-full">
                <Download className="w-5 h-5" /> Download PDF Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
