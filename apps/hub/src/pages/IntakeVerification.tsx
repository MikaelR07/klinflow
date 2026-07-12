import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  Scale, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  Loader2,
  PackageCheck,
  ArrowLeft,
  X,
  User,
  Calendar,
  Tag,
  Wallet,
  Clock
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { toast } from 'sonner';

interface MaterialEntry {
  id: string;
  materialId: string;
  category: string;
  subcategory: string;
  weight: number;
  amountPaid: number;
  sellerName: string;
  collectedAt: string;
  sourcingTag: string;
  isManual: boolean;
}

interface AgentPayload {
  agentName: string;
  agentId: string;
  totalClaimedWeight: number;
  totalAmountPaidToday: number;
  materials: MaterialEntry[];
}

export default function IntakeVerification() {
  const { isDarkMode } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  const agentData = (location.state as any)?.agentData as AgentPayload | undefined;

  const [manualWeights, setManualWeights] = useState<Record<string, string>>({});
  const [totalManualWeight, setTotalManualWeight] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);

  // Redirect if no data
  if (!agentData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShieldAlert className="font-medium w-16 h-16 text-amber-500 mb-4" />
        <h1 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>No Agent Data</h1>
        <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Please verify an agent PIN from the Intake page first.</p>
        <button onClick={() => navigate('/operations/intake')} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium text-sm">Back to Intake</button>
      </div>
    );
  }

  const handleWeightChange = (id: string, value: string) => {
    setManualWeights(prev => ({ ...prev, [id]: value }));
  };

  const sumOfIndividualWeights = useMemo(() => {
    return Object.values(manualWeights).reduce((acc, v) => acc + (parseFloat(v) || 0), 0);
  }, [manualWeights]);

  const totalActual = parseFloat(totalManualWeight) || sumOfIndividualWeights;
  const discrepancy = totalActual - agentData.totalClaimedWeight;
  const allFilled = agentData.materials.every(m => manualWeights[m.id] && parseFloat(manualWeights[m.id]) > 0);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      if (!profile) throw new Error("No profile");
      
      const assetIds = agentData.materials.map(m => m.id).filter(id => !id.startsWith('m'));

      if (assetIds.length > 0) {
        const { error: assetError } = await (supabase
          .from('assets')
          .update({ 
            status: 'transferred_to_hub',
            hub_manager_id: profile.id
          } as any)
          .in('id', assetIds) as any);
          
        if (assetError) throw assetError;
      }
      
      if (agentData.agentId) {
        const { error: profileError } = await (supabase
          .from('profiles')
          .update({ is_en_route: false, hub_transfer_pin: null } as any)
          .eq('id', agentData.agentId) as any);

        if (profileError) throw profileError;
      }

      toast.success("Cargo Received!", { description: `Successfully transferred to Hub Inventory.` });
      setShowSuccessModal(true);
    } catch (err) {
      toast.error("Transfer failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
  };

  const getTagColor = (tag: string) => {
    if (tag === 'Individual RFQ') return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (tag === 'Group RFQ') return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (tag === 'Community Pickup') return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
    return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
  };

  return (
    <>
      <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-6">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/operations/intake')}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Verify: {agentData.agentName}</h1>
              <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Review the manifest, weigh each material on your floor scale, and reconcile.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${isDarkMode ? 'bg-slate-800 border-white/5 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              Agent ID: {agentData.agentId}
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="font-medium w-4 h-4 text-emerald-500" />
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Claimed Total</p>
            </div>
            <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData.totalClaimedWeight} <span className="text-sm text-slate-400">KG</span></p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-indigo-500" />
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Paid Today</p>
            </div>
            <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KES {agentData.totalAmountPaidToday.toLocaleString()}</p>
          </div>
          <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="flex items-center gap-2 mb-2">
              <PackageCheck className="font-medium w-4 h-4 text-blue-500" />
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Material Entries</p>
            </div>
            <p className={`text-2xl font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData.materials.length} <span className="text-sm text-slate-400">items</span></p>
          </div>
          <div className={`p-5 rounded-2xl border transition-colors ${
            totalActual > 0 
              ? (Math.abs(discrepancy) < 5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30') 
              : (isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-sm')
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Scale className={`w-4 h-4 ${totalActual > 0 ? (Math.abs(discrepancy) < 5 ? 'text-emerald-500' : 'text-amber-500') : 'text-slate-400'}`} />
              <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Discrepancy</p>
            </div>
            <p className={`text-2xl font-medium ${
              totalActual > 0 
                ? (Math.abs(discrepancy) < 5 ? 'text-emerald-500' : 'text-amber-500') 
                : (isDarkMode ? 'text-white' : 'text-slate-900')
            }`}>
              {totalActual > 0 ? `${discrepancy > 0 ? '+' : ''}${discrepancy.toFixed(1)}` : '—'} <span className="font-medium text-sm text-slate-400">KG</span>
            </p>
          </div>
        </div>

        {/* ── MATERIAL BREAKDOWN TABLE ── */}
        <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
            <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              <Truck className="font-medium w-5 h-5 text-emerald-500" /> Cargo Manifest
            </h2>
            <div className="flex items-center gap-2">
              {agentData.materials.some(m => m.isManual) && (
                <span className="px-2 py-1 rounded border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Contains Manual Entries
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="font-medium w-full text-left text-sm">
              <thead className={`text-[10px] uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                <tr>
                  <th className="px-6 py-3">Material</th>
                  <th className="px-4 py-3">Material ID</th>
                  <th className="px-4 py-3">Seller / Source</th>
                  <th className="px-4 py-3">Collected</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Claimed</th>
                  <th className="px-4 py-3">Actual Weight</th>
                  <th className="px-4 py-3 text-center">Tags</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {agentData.materials.map((m) => (
                  <tr key={m.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                    {/* Material */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-medium ${
                          m.isManual ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {m.subcategory.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory}</p>
                          <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{m.category}</p>
                        </div>
                      </div>
                    </td>
                    {/* Material ID */}
                    <td className="px-4 py-4">
                      <span className={`text-xs font-mono font-medium px-2 py-1 rounded-lg ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{m.materialId}</span>
                    </td>
                    {/* Seller */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <User className="font-medium w-3 h-3 text-slate-400 shrink-0" />
                        <span className={`text-xs font-medium truncate max-w-[120px] ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`} title={m.sellerName}>{m.sellerName}</span>
                      </div>
                    </td>
                    {/* Timestamp */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="font-medium w-3 h-3 text-slate-400 shrink-0" />
                        <div>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{formatTime(m.collectedAt)}</p>
                          <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{formatDate(m.collectedAt)}</p>
                        </div>
                      </div>
                    </td>
                    {/* Paid */}
                    <td className="px-4 py-4">
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>KES {m.amountPaid.toLocaleString()}</p>
                    </td>
                    {/* Claimed Weight */}
                    <td className="px-4 py-4">
                      <p className={`text-xs font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.weight} KG</p>
                    </td>
                    {/* Actual Weight Input */}
                    <td className="px-4 py-4">
                      <div className="relative">
                        <input
                          type="number"
                          value={manualWeights[m.id] || ''}
                          onChange={(e) => handleWeightChange(m.id, e.target.value)}
                          placeholder="0.0"
                          className={`w-24 px-3 py-2 text-xs font-medium font-mono rounded-lg border outline-none transition-colors ${
                            manualWeights[m.id]
                              ? (isDarkMode ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500 bg-emerald-500/5 text-emerald-600')
                              : (isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')
                          } focus:border-emerald-500`}
                        />
                      </div>
                    </td>
                    {/* Tags */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-medium uppercase ${getTagColor(m.sourcingTag)}`}>
                          {m.sourcingTag}
                        </span>
                        {m.isManual && (
                          <span className="px-2 py-0.5 rounded border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-medium uppercase flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" /> Manual
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── RECONCILIATION FOOTER ── */}
        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Sum of Individual Weights</p>
                <p className={`text-xl font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sumOfIndividualWeights.toFixed(1)} <span className="text-sm text-slate-400">KG</span></p>
              </div>
              <div className={`h-10 w-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-emerald-500' : 'text-emerald-600'}`}>Total Actual Weight (Override)</p>
                <div className="relative">
                  <input
                    type="number"
                    value={totalManualWeight}
                    onChange={(e) => setTotalManualWeight(e.target.value)}
                    placeholder={sumOfIndividualWeights.toFixed(1)}
                    className={`w-40 px-3 py-2 text-lg font-medium font-mono rounded-xl border outline-none transition-colors ${
                      totalManualWeight
                        ? (isDarkMode ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500 bg-emerald-500/5 text-emerald-600')
                        : (isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')
                    } focus:border-emerald-500`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">KG</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <button
                onClick={() => navigate('/operations/intake')}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isProcessing || (!allFilled && !totalManualWeight)}
                className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Confirm & Receive</>}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── SUCCESS MODAL (STEP 3) ──                  */}
      {/* ══════════════════════════════════════════════ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          {/* Modal Content */}
          <div className={`relative w-full max-w-lg rounded-3xl border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            
            {/* Close */}
            <button
              onClick={() => { setShowSuccessModal(false); navigate('/operations/intake'); }}
              className="font-medium absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 md:p-10 text-center space-y-6">
              {/* Badge */}
              <div className="relative w-28 h-28 mx-auto">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                <div className="relative w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <ShieldCheck className="font-medium w-14 h-14 text-white" />
                </div>
              </div>

              <div>
                <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Cargo Received!</h1>
                <p className={`text-sm font-medium mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  All materials from <span className="font-medium text-emerald-500">{agentData.agentName}</span> have been reconciled and added to Hub inventory.
                </p>
              </div>

              {/* Waybill Details */}
              <div className={`p-6 rounded-2xl text-left space-y-5 relative overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-emerald-500/20' : 'bg-slate-50 border-emerald-200'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <PackageCheck className="font-medium w-20 h-20 text-emerald-500" />
                </div>

                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Digital Waybill</p>
                    <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{waybillId}</h3>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-widest">Reconciled</span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Agent Claimed</p>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData.totalClaimedWeight} KG</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Actual Received</p>
                    <p className="text-lg font-medium text-emerald-500">{totalActual.toFixed(1)} KG</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Discrepancy</p>
                    <p className={`text-lg font-medium ${Math.abs(discrepancy) < 5 ? 'text-emerald-500' : 'text-amber-500'}`}>{discrepancy > 0 ? '+' : ''}{discrepancy.toFixed(1)} KG</p>
                  </div>
                  <div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Items Received</p>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData.materials.length} entries</p>
                  </div>
                </div>

                <div className={`pt-4 border-t ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                  <p className={`text-[10px] font-medium uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Materials Received</p>
                  <div className="flex flex-wrap gap-2">
                    {agentData.materials.map(m => (
                      <div key={m.id} className={`px-3 py-1.5 rounded-lg border text-[10px] font-medium ${isDarkMode ? 'bg-slate-900 border-white/5 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                        {m.subcategory}: {manualWeights[m.id] || m.weight} KG
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setShowSuccessModal(false); navigate('/operations/intake'); }}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium uppercase tracking-wider text-sm active:scale-[0.98] transition-all shadow-xl"
              >
                Ready for Next Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
