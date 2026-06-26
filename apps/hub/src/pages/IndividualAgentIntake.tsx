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

  // States for Step 3 (M-PESA Modal)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);

  const handleSearch = () => {
    if (!klinIdInput.trim()) return;
    setIsSearching(true);
    setError(null);

    // Simulate lookup
    setTimeout(() => {
      if (!klinIdInput.toLowerCase().startsWith('klin')) {
        setError("Invalid Klin-ID format. Must start with KLIN (e.g. KLIN-8492)");
        setIsSearching(false);
        return;
      }

      setAgentData({
        name: 'David Ochieng',
        klinId: klinIdInput.toUpperCase(),
        phone: '+254 712 345 678',
        rating: 4.8,
        totalCollectionsToday: 3,
        materials: [
          { id: 'm1', category: 'Plastics', subcategory: 'PET Clear', weight: 45.5, basePricePerKg: 30, sellerName: 'Juma Kiosk', collectedAt: '2026-06-20T08:15:00Z' },
          { id: 'm2', category: 'Plastics', subcategory: 'HDPE Rigid', weight: 22.0, basePricePerKg: 25, sellerName: 'Mama Wanjiku', collectedAt: '2026-06-20T09:30:00Z' },
          { id: 'm3', category: 'Paper', subcategory: 'OCC Cardboard', weight: 110.5, basePricePerKg: 10, sellerName: 'Supermarket Back-alley', collectedAt: '2026-06-20T10:45:00Z' },
        ]
      });

      setIsSearching(false);
      setStep(2);
    }, 1200);
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

  const handleConfirmAndPay = () => {
    setPaymentStatus('pending');
    setShowPaymentModal(true);
  };

  const processMpesaPayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
    }, 2500);
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8 animate-fade-in">

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
        <div className={`max-w-md mx-auto mt-20 p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
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
        <div className="space-y-6 animate-slide-up">
          
          {/* Agent Profile Banner */}
          <div className={`p-6 md:p-8 rounded-3xl border flex items-center justify-between gap-6 flex-wrap ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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
          <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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
          <div className={`p-6 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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
            <button
              onClick={handleConfirmAndPay}
              disabled={!calculatedTotals.allFilled}
              className="px-8 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
            >
              <Receipt className="w-5 h-5" /> Generate Payout Receipt
            </button>
          </div>
        </div>
      )}

      {/* ── PROFESSIONAL PAYMENT CHECKOUT MODAL (STEP 3) ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
          
          <div className={`relative w-full max-w-lg rounded-[2rem] border overflow-hidden shadow-2xl ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
            
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <div className="flex items-center gap-2">
                <Receipt className="font-medium w-5 h-5 text-blue-500" />
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Checkout & Payout</span>
              </div>
              <button
                onClick={() => { setShowPaymentModal(false); if(paymentStatus === 'success') navigate('/operations/intake'); }}
                className="font-medium p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentStatus === 'pending' && (
              <div className="p-6 md:p-8">
                
                {/* Payee Info */}
                <div className={`p-5 rounded-2xl mb-6 flex items-center gap-4 border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="font-medium w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paying To</p>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{agentData?.name}</p>
                    <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{agentData?.phone}</p>
                  </div>
                  <div className={`px-2 py-1 rounded border text-[10px] font-medium uppercase ${isDarkMode ? 'bg-slate-900 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {agentData?.klinId}
                  </div>
                </div>

                {/* Receipt Breakdown */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receipt Breakdown</h3>
                  <div className={`rounded-xl border divide-y ${isDarkMode ? 'border-white/5 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                    
                    {/* Material List */}
                    <div className="max-h-[180px] overflow-y-auto p-2">
                      {agentData?.materials.map(m => {
                        const actualW = parseFloat(manualWeights[m.id]) || 0;
                        const negotiatedP = parseFloat(negotiatedPrices[m.id]) || m.basePricePerKg;
                        if (actualW === 0) return null;
                        
                        return (
                          <div key={m.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory}</p>
                              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{actualW}kg @ {negotiatedP} KES</p>
                            </div>
                            <p className={`font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{(actualW * negotiatedP).toLocaleString()}</p>
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
                      <p className="text-2xl font-medium font-mono text-blue-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
                    </div>

                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentStatus('success')}
                    className={`py-4 rounded-xl font-medium uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 border ${
                      isDarkMode 
                        ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' 
                        : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Paid Cash
                  </button>
                  <button
                    onClick={processMpesaPayment}
                    className="py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium uppercase tracking-wider text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-5 h-5" /> Send M-PESA
                  </button>
                </div>
              </div>
            )}

            {paymentStatus === 'processing' && (
              <div className="p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Banknote className="font-medium w-8 h-8 text-emerald-500" />
                  </div>
                </div>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Processing Payment...</h2>
                <p className={`text-sm mt-2 max-w-[250px] mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Connecting to Safaricom Daraja API to disburse B2C funds.</p>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40 relative">
                  <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping"></div>
                  <CheckCircle2 className="font-medium w-12 h-12 text-white relative z-10" />
                </div>
                
                <div>
                  <h2 className={`text-3xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Payment Sent!</h2>
                  <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    KES {calculatedTotals.totalPayout.toLocaleString()} has been sent to {agentData?.name}.
                  </p>
                </div>
                
                <div className="space-y-3 text-left max-w-sm mx-auto mt-8">
                  <div className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Digital Waybill</span>
                    <span className={`text-sm font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{waybillId}</span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => { setShowPaymentModal(false); navigate('/operations/intake'); }}
                    className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium uppercase tracking-wider text-sm transition-all shadow-xl active:scale-[0.98]"
                  >
                    Close & Next Agent
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
