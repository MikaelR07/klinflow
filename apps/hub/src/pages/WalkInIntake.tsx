import React, { useState, useMemo } from 'react';
import { 
  Store, 
  ArrowLeft,
  X,
  User,
  Plus,
  Trash2,
  Wallet,
  CheckCircle2,
  Banknote,
  Phone,
  Leaf,
  Loader2,
  Receipt
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';

interface ManualMaterialLine {
  id: string;
  category: string;
  subcategory: string;
  grade: string;
  weight: string;
  basePricePerKg: string;
  pricePerKg: string;
}

export default function WalkInIntake() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  
  // Seller Registration State
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [isKlinflowUser, setIsKlinflowUser] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Material Entry State
  const [materials, setMaterials] = useState<ManualMaterialLine[]>([
    { id: '1', category: 'Plastics', subcategory: 'PET Clear', grade: 'A', weight: '', basePricePerKg: '30', pricePerKg: '30' }
  ]);

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);
  const [mpesaReceipt] = useState(`Q${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  const handlePhoneSearch = () => {
    if (sellerPhone.length < 9) return;
    setIsSearchingUser(true);
    setTimeout(() => {
      setIsKlinflowUser(true);
      setSellerName('Grace Njoroge');
      setIsSearchingUser(false);
    }, 1000);
  };

  const handleProceedToMaterials = () => {
    if (!sellerName || !sellerPhone) return;
    setStep(2);
  };

  const addMaterialLine = () => {
    setMaterials(prev => [
      ...prev,
      { id: Math.random().toString(), category: 'Plastics', subcategory: '', grade: 'B', weight: '', basePricePerKg: '25', pricePerKg: '25' }
    ]);
  };

  const removeMaterialLine = (id: string) => {
    if (materials.length === 1) return;
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  const updateMaterial = (id: string, field: keyof ManualMaterialLine, value: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const calculatedTotals = useMemo(() => {
    let totalWeight = 0;
    let totalPayout = 0;
    let allFilled = materials.length > 0;

    materials.forEach(m => {
      const weight = parseFloat(m.weight) || 0;
      const price = parseFloat(m.pricePerKg) || 0;
      
      if (!m.weight || !m.pricePerKg || !m.subcategory) allFilled = false;
      
      totalWeight += weight;
      totalPayout += (weight * price);
    });

    return { totalWeight, totalPayout, allFilled };
  }, [materials]);

  const gfpPointsAwarded = Math.floor(calculatedTotals.totalPayout / 10);

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
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Walk-in Intake</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manual entry for residents and informal sellers.</p>
        </div>
      </div>

      {step === 1 && (
        <div className={`max-w-xl mx-auto mt-12 p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Store className="font-medium w-8 h-8 text-amber-500" />
            </div>
            <h2 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Seller Registration</h2>
            <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enter their phone number to check if they use Klinflow, or register them.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
              <div className="flex gap-3">
                <input 
                  type="tel" 
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(e.target.value)}
                  placeholder="0712 345 678"
                  className={`flex-1 p-4 rounded-xl border text-sm font-medium outline-none transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                  }`}
                  style={{ color: isDarkMode ? 'white' : 'black' }}
                />
                <button 
                  onClick={handlePhoneSearch}
                  disabled={sellerPhone.length < 9 || isSearchingUser}
                  className="px-6 rounded-xl bg-amber-500 text-white font-medium active:scale-95 transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  {isSearchingUser ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check'}
                </button>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
              <input 
                type="text" 
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                placeholder="John Doe"
                className={`w-full p-4 rounded-xl border text-sm font-medium outline-none transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                }`}
                style={{ color: isDarkMode ? 'white' : 'black' }}
              />
            </div>

            {isKlinflowUser && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <CheckCircle2 className="font-medium w-5 h-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Klinflow User Found</p>
                  <p className="font-medium text-xs text-emerald-600/80 dark:text-emerald-400/80">They will earn GFP points for this transaction.</p>
                </div>
              </div>
            )}

            {!isKlinflowUser && sellerPhone && sellerName && (
              <div className="flex items-center gap-2">
                <input type="checkbox" id="invite" className="font-medium w-4 h-4 rounded text-amber-500 focus:ring-amber-500" defaultChecked />
                <label htmlFor="invite" className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Send SMS invite to join Klinflow</label>
              </div>
            )}

            <button 
              onClick={handleProceedToMaterials}
              disabled={!sellerName || !sellerPhone}
              className="w-full h-14 mt-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium uppercase tracking-wider text-sm active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
            >
              Proceed to Materials
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-slide-up">
          
          {/* Seller Banner */}
          <div className={`p-6 md:p-8 rounded-3xl border flex items-center justify-between gap-6 flex-wrap ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-6">
              <div className="font-medium w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {sellerPhone}
                  </span>
                  {isKlinflowUser && (
                    <span className="px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-[10px] font-medium text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                      <Leaf className="w-3 h-3" /> Earning GFP
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Entry Table */}
          <div className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-4 border-b flex items-center justify-between ${isDarkMode ? 'border-white/5' : 'border-slate-100'}`}>
              <h2 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <Store className="font-medium w-5 h-5 text-amber-500" /> Manual Material Entry
              </h2>
              <button 
                onClick={addMaterialLine}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="font-medium w-full text-left text-sm min-w-[800px]">
                <thead className={`text-[10px] uppercase tracking-wider font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
                  <tr>
                    <th className="px-6 py-3 w-1/4">Category</th>
                    <th className="px-4 py-3 w-1/4">Subcategory</th>
                    <th className="px-4 py-3 w-24">Grade</th>
                    <th className="px-4 py-3">Weight (KG)</th>
                    <th className="px-4 py-3">Base Price</th>
                    <th className="font-medium px-4 py-3 text-amber-500">Price/KG (KES)</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {materials.map((m) => {
                    const weight = parseFloat(m.weight) || 0;
                    const price = parseFloat(m.pricePerKg) || 0;
                    const total = weight * price;

                    return (
                      <tr key={m.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-6 py-4">
                          <select 
                            value={m.category}
                            onChange={(e) => updateMaterial(m.id, 'category', e.target.value)}
                            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                          >
                            <option>Plastics</option>
                            <option>Paper</option>
                            <option>Metals</option>
                            <option>Glass</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="text"
                            placeholder="e.g. PET Clear"
                            value={m.subcategory}
                            onChange={(e) => updateMaterial(m.id, 'subcategory', e.target.value)}
                            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <select 
                            value={m.grade}
                            onChange={(e) => updateMaterial(m.id, 'grade', e.target.value)}
                            className={`w-full px-3 py-2 text-xs font-medium rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                          >
                            <option>A</option>
                            <option>B</option>
                            <option>C</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            placeholder="0.0"
                            value={m.weight}
                            onChange={(e) => updateMaterial(m.id, 'weight', e.target.value)}
                            className={`w-24 px-3 py-2 text-xs font-medium font-mono rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className={`text-xs font-medium font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>KES {m.basePricePerKg}</p>
                        </td>
                        <td className="px-4 py-4">
                          <input 
                            type="number"
                            placeholder="0"
                            value={m.pricePerKg}
                            onChange={(e) => updateMaterial(m.id, 'pricePerKg', e.target.value)}
                            className={`w-24 px-3 py-2 text-xs font-medium font-mono rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'}`}
                            style={{ color: isDarkMode ? 'white' : 'black' }}
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className={`text-sm font-medium font-mono ${total > 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-slate-400'}`}>
                            {total.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <button 
                            onClick={() => removeMaterialLine(m.id)}
                            disabled={materials.length === 1}
                            className="font-medium p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                <p className={`text-[10px] font-medium uppercase tracking-wider mb-1 text-amber-500`}>Total Payout</p>
                <p className="text-2xl font-medium font-mono text-amber-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => { setPaymentStatus('pending'); setShowPaymentModal(true); }}
              disabled={!calculatedTotals.allFilled}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
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
                <Receipt className="font-medium w-5 h-5 text-amber-500" />
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
                  <div className="font-medium w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paying To</p>
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</p>
                    <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{sellerPhone}</p>
                  </div>
                </div>

                {/* Receipt Breakdown */}
                <div className="mb-8">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receipt Breakdown</h3>
                  <div className={`rounded-xl border divide-y ${isDarkMode ? 'border-white/5 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                    
                    {/* Material List (max 3, then scroll) */}
                    <div className="max-h-[180px] overflow-y-auto p-2">
                      {materials.filter(m => m.subcategory && m.weight && m.pricePerKg).map(m => {
                        const lineTotal = parseFloat(m.weight) * parseFloat(m.pricePerKg);
                        return (
                          <div key={m.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <div>
                              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory} <span className="text-xs font-normal opacity-70">({m.grade})</span></p>
                              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.weight}kg @ {m.pricePerKg} KES</p>
                            </div>
                            <p className={`font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{lineTotal.toLocaleString()}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total Row */}
                    <div className={`p-4 flex justify-between items-end bg-amber-500/5 ${isDarkMode ? '' : ''}`}>
                      <div>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Due</p>
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{calculatedTotals.totalWeight.toFixed(1)} KG total weight</p>
                      </div>
                      <p className="text-2xl font-medium font-mono text-amber-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
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
                    KES {calculatedTotals.totalPayout.toLocaleString()} has been sent to {sellerName}.
                  </p>
                </div>
                
                <div className="space-y-3 text-left max-w-sm mx-auto mt-8">
                  <div className={`p-4 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-xs font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Digital Waybill</span>
                    <span className={`text-sm font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{waybillId}</span>
                  </div>
                  
                  {isKlinflowUser && (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-4 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-10">
                        <Leaf className="font-medium w-24 h-24 text-emerald-500" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 relative z-10">
                        <Leaf className="font-medium w-6 h-6 text-emerald-500" />
                      </div>
                      <div className="relative z-10">
                        <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Eco-Reward Granted</p>
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>+{gfpPointsAwarded} GFP Points</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => { setShowPaymentModal(false); navigate('/operations/intake'); }}
                    className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium uppercase tracking-wider text-sm transition-all shadow-xl active:scale-[0.98]"
                  >
                    Close & Next Seller
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
