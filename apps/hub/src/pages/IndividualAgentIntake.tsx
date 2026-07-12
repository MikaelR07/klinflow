import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  Search,
  Scale, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2,
  PackageCheck,
  ArrowLeft,
  X,
  User,
  Tag,
  Wallet,
  CheckCircle2,
  Banknote,
  Phone,
  Receipt
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';

interface AgentMaterial {
  id: string;
  category: string;
  subcategory: string;
  weight: number;
  basePricePerKg: number;
  sellerName: string;
  collectedAt: string;
}

interface AgentProfile {
  name: string;
  klinId: string;
  phone: string;
  rating: number;
  totalCollectionsToday: number;
  materials: AgentMaterial[];
  id?: string;
}

export default function IndividualAgentIntake() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [klinIdInput, setKlinIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [agentData, setAgentData] = useState<AgentProfile | null>(null);

  // States for Step 2 (Reconciliation)
  const [manualWeights, setManualWeights] = useState<Record<string, string>>({});
  const [negotiatedPrices, setNegotiatedPrices] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Step 3
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);

  const { currentCompanyId } = useAuthStore() as any;

  const handleSearch = async () => {
    if (!klinIdInput.trim()) return;
    setIsSearching(true);
    setError(null);

    try {
      const { data: agent, error: agentError } = await supabase
        .from('profiles')
        .select('*')
        .eq('klinflow_id', klinIdInput.toUpperCase())
        .maybeSingle();

      if (agentError) throw agentError;
      if (!agent) {
        setError("Agent not found.");
        return;
      }

      const { data: materials, error: matError } = await supabase
        .from('assets')
        .select('*')
        .eq('verifier_id', agent.id)
        .eq('status', 'verified');
        
      if (matError) throw matError;

      setAgentData({
        id: agent.id,
        name: agent.name,
        klinId: agent.klinflow_id || klinIdInput,
        phone: agent.phone,
        rating: agent.rating || 5.0,
        totalCollectionsToday: materials?.length || 0,
        materials: (materials || []).map(m => ({
          id: m.id,
          category: m.material_category || 'Unknown',
          subcategory: m.material_type || 'Unknown',
          weight: m.weight_kg,
          basePricePerKg: (m.estimated_value / m.weight_kg) || 0,
          sellerName: m.seller_name || 'Walk-in',
          collectedAt: m.created_at
        }))
      });

      setStep(2);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch agent data.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleWeightChange = (id: string, value: string) => {
    setManualWeights(prev => ({ ...prev, [id]: value }));
  };

  const handlePriceChange = (id: string, value: string) => {
    setNegotiatedPrices(prev => ({ ...prev, [id]: value }));
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    if (!agentData) return { totalWeight: 0, totalPayout: 0, allFilled: false };
    
    let totalWeight = 0;
    let totalPayout = 0;
    let allFilled = true;

    agentData.materials.forEach(m => {
      const weight = parseFloat(manualWeights[m.id]) || 0;
      const price = parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg;
      
      if (!manualWeights[m.id]) allFilled = false;
      
      totalWeight += weight;
      totalPayout += (weight * price);
    });

    return { totalWeight, totalPayout, allFilled };
  }, [agentData, manualWeights, negotiatedPrices]);

  const processCheckout = async (method: 'cash' | 'mpesa' | 'digital_wallet') => {
    setPaymentStatus('processing');
    
    try {
      const updates = agentData?.materials.map(m => ({
        asset_id: m.id,
        final_weight: parseFloat(manualWeights[m.id]) || 0,
        final_price: (parseFloat(manualWeights[m.id]) || 0) * (parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg),
        total: (parseFloat(manualWeights[m.id]) || 0) * (parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg)
      })).filter(u => u.final_weight > 0) || [];

      const { error } = await supabase.rpc('hub_process_agent_intake', {
        p_hub_id: currentCompanyId,
        p_agent_id: agentData?.id,
        p_asset_updates: updates,
        p_payment_method: method,
        p_total_payout: calculatedTotals.totalPayout
      });

      if (error) throw error;
      
      setPaymentStatus('success');
    } catch (err) {
      console.error(err);
      setPaymentStatus('pending');
      alert('Failed to process agent intake.');
    }
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/operations/intake')}
          className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Individual Agent Intake</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Lookup Klinflow agent warehouse logs and negotiate prices.</p>
        </div>
      </div>

      {step === 1 && (
        <div className={`max-w-md mx-auto mt-20 p-8 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <Smartphone className="font-medium w-8 h-8 text-blue-500" />
            </div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Agent Lookup</h2>
            <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enter the agent's Klin-ID to pull their collection warehouse.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Klin-ID</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={klinIdInput}
                  onChange={(e) => setKlinIdInput(e.target.value)}
                  placeholder="e.g. KLIN-8492"
                  className={`w-full p-4 rounded-xl border text-sm font-medium uppercase outline-none transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-800 border-white/10 text-white focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                  }`}
                  style={{ color: isDarkMode ? 'white' : 'black' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Search className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            <button 
              onClick={handleSearch}
              disabled={isSearching || !klinIdInput}
              className="w-full h-14 rounded-xl bg-blue-500 text-white font-medium active:scale-[0.98] transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search Agent Warehouse'}
            </button>
          </div>
        </div>
      )}

      {step === 2 && agentData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slide-up">
          
          <div className="lg:col-span-3 space-y-6">
            {/* Agent Profile Banner */}
          <div className={`p-6 md:p-8 rounded-xl border flex items-center justify-between gap-6 flex-wrap ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-6">
              <div className="font-medium w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'bg-slate-800 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                    {agentData.klinId}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-medium text-emerald-500">
                    ★ {agentData.rating}
                  </span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {agentData.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Table */}
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <PackageCheck className="font-medium w-5 h-5 text-blue-500" /> Agent Warehouse Items
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="font-medium w-full text-left text-sm">
                <thead className={`text-[10px] uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="px-6 py-3">Material</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Claimed Weight</th>
                    <th className="font-medium px-4 py-3 text-emerald-500">Actual Weight</th>
                    <th className="px-4 py-3">Base Price</th>
                    <th className="font-medium px-4 py-3 text-blue-500">Final Price / KG</th>
                    <th className="px-4 py-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {agentData.materials.map((m) => {
                    const actualW = parseFloat(manualWeights[m.id]) || 0;
                    const negotiatedP = parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg;
                    const lineTotal = actualW * negotiatedP;

                    return (
                      <tr key={m.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-6 py-4">
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory}</p>
                          <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{m.category}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{m.sellerName}</span>
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.weight} KG</p>
                        </td>
                        {/* Actual Weight Input */}
                        <td className="px-4 py-4">
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
                            style={{ color: manualWeights[m.id] ? undefined : (isDarkMode ? 'white' : 'black') }}
                          />
                        </td>
                        {/* Base Price */}
                        <td className="px-4 py-4">
                          <p className={`text-xs font-medium font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>KES {m.basePricePerKg}</p>
                        </td>
                        {/* Price Negotiation Input */}
                        <td className="px-4 py-4">
                          <div className="relative w-28">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">KES</span>
                            <input
                              type="number"
                              value={negotiatedPrices[m.id] ?? m.basePricePerKg}
                              onChange={(e) => handlePriceChange(m.id, e.target.value)}
                              className={`w-full pl-10 pr-3 py-2 text-xs font-medium font-mono rounded-lg border outline-none transition-colors ${
                                negotiatedPrices[m.id] && parseFloat(negotiatedPrices[m.id]) !== m.basePricePerKg
                                  ? (isDarkMode ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-blue-500 bg-blue-500/5 text-blue-600')
                                  : (isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900')
                              } focus:border-blue-500`}
                              style={{ color: (negotiatedPrices[m.id] && parseFloat(negotiatedPrices[m.id]) !== m.basePricePerKg) ? undefined : (isDarkMode ? 'white' : 'black') }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className={`text-sm font-medium font-mono ${lineTotal > 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>
                            KES {lineTotal.toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Totals */}
          <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex gap-8">
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Weight Received</p>
                <p className={`text-2xl font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{calculatedTotals.totalWeight.toFixed(1)} <span className="text-sm text-slate-400">KG</span></p>
              </div>
              <div className={`w-px h-10 ${isDarkMode ? 'bg-white/5' : 'bg-slate-200'}`} />
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 text-blue-500`}>Total Agent Payout</p>
                <p className="text-2xl font-medium font-mono text-blue-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
              </div>
            </div>

          </div>

          </div>

          {/* ── PROFESSIONAL PAYMENT CHECKOUT SIDE PANEL ── */}
          <div className="lg:col-span-1 border-l border-[#e0e3eb] dark:border-slate-700/50 pl-0 lg:pl-6 animate-slide-left">
            <div className={`w-full rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            
            {/* Header */}
              <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} rounded-t-3xl`}>
                <div className="flex items-center gap-2">
                  <Receipt className="font-medium w-5 h-5 text-blue-500" />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Receipt</span>
                </div>
              </div>

              {paymentStatus === 'pending' && (
                <div className="p-6">
                  
                  {/* Payee Info */}
                  <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-medium w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paying To</p>
                      <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData?.name}</p>
                      <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{agentData?.phone}</p>
                    </div>
                    <div className={`px-2 py-1 rounded border text-[10px] font-medium uppercase ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                      {agentData?.klinId}
                    </div>
                  </div>

                  {/* Receipt Breakdown */}
                  <div className="mb-6">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receipt Breakdown</h3>
                    <div className={`rounded-xl border divide-y ${isDarkMode ? 'border-white/5 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                      
                      {/* Material List */}
                      <div className="max-h-[180px] overflow-y-auto p-2">
                        {agentData?.materials.map(m => {
                          const actualW = parseFloat(manualWeights[m.id]) || 0;
                          const negotiatedP = parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg;
                          if (actualW === 0) return null;
                          
                          return (
                            <div key={m.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <div>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory}</p>
                                <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{actualW}kg @ {negotiatedP} KES</p>
                              </div>
                              <p className={`text-sm font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{(actualW * negotiatedP).toLocaleString()}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Row */}
                      <div className="p-4 flex justify-between items-end bg-blue-500/5">
                        <div>
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Due</p>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{calculatedTotals.totalWeight.toFixed(1)} KG total weight</p>
                        </div>
                        <p className="text-xl font-bold font-mono text-blue-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
                      </div>

                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => processCheckout('cash')}
                      disabled={!calculatedTotals.allFilled}
                      className={`py-3.5 rounded-xl font-medium uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 border disabled:opacity-50 ${
                        isDarkMode 
                          ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' 
                          : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Paid Cash
                    </button>
                    <button
                      onClick={() => processCheckout('digital_wallet')}
                      disabled={!calculatedTotals.allFilled}
                      className="py-3.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium uppercase tracking-wider text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" /> To Wallet
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus === 'processing' && (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Processing Transfer...</h2>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Transferring assets to Hub ledger.</p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="p-6 text-center space-y-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/40 relative">
                    <CheckCircle2 className="font-medium w-8 h-8 text-white relative z-10" />
                  </div>
                  
                  <div>
                    <h2 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Success!</h2>
                    <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      KES {calculatedTotals.totalPayout.toLocaleString()} transferred for {agentData?.name}.
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-left w-full mt-6">
                    <div className={`p-3 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-[10px] font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Digital Waybill</span>
                      <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{waybillId}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => { setStep(1); setKlinIdInput(''); setAgentData(null); setPaymentStatus('pending'); }}
                      className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium uppercase tracking-wider text-xs transition-all shadow-xl active:scale-[0.98]"
                    >
                      Close & Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
