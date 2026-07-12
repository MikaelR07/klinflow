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
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
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
    { id: '1', category: 'Plastic', subcategory: 'PET Clear', grade: 'A', weight: '', basePricePerKg: '30', pricePerKg: '30' }
  ]);

  const { currentCompanyId } = useAuthStore() as any;

  // Checkout State
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);
  const [mpesaReceipt] = useState(`Q${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  const handlePhoneSearch = async () => {
    if (sellerPhone.length < 9) return;
    setIsSearchingUser(true);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('phone', sellerPhone)
        .maybeSingle();
        
      if (data) {
        setIsKlinflowUser(true);
        setSellerName(data.name);
      } else {
        setIsKlinflowUser(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleProceedToMaterials = () => {
    if (!sellerName || !sellerPhone) return;
    setStep(2);
  };

  const addMaterialLine = () => {
    setMaterials(prev => [
      ...prev,
      { id: Math.random().toString(), category: 'Plastic', subcategory: '', grade: 'B', weight: '', basePricePerKg: '25', pricePerKg: '25' }
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

  const processCheckout = async (method: 'cash' | 'mpesa') => {
    setPaymentStatus('processing');
    
    try {
      const items = materials.filter(m => m.subcategory && m.weight && m.pricePerKg).map(m => ({
        category: m.category,
        subcategory: m.subcategory,
        grade: m.grade,
        weight: parseFloat(m.weight),
        basePricePerKg: parseFloat(m.basePricePerKg),
        pricePerKg: parseFloat(m.pricePerKg),
        total: parseFloat(m.weight) * parseFloat(m.pricePerKg)
      }));

      const { error } = await supabase.rpc('hub_process_walkin_intake', {
        p_hub_id: currentCompanyId,
        p_seller_phone: sellerPhone,
        p_seller_name: sellerName,
        p_items: items,
        p_payment_method: method,
        p_total_payout: calculatedTotals.totalPayout
      });

      if (error) throw error;
      
      setPaymentStatus('success');
    } catch (err) {
      console.error(err);
      setPaymentStatus('pending');
      alert('Failed to process intake.');
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
          <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Walk-in Intake</h1>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Manual entry for residents and informal sellers.</p>
        </div>
      </div>

      {step === 1 && (
        <div className={`max-w-xl mx-auto mt-12 p-8 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-slide-up">
          
          <div className="lg:col-span-3 space-y-6">
            {/* Seller Banner */}
          <div className={`p-6 md:p-8 rounded-xl border flex items-center justify-between gap-6 flex-wrap ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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
          <div className={`rounded-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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
                            <option>Plastic</option>
                            <option>Paper</option>
                            <option>Metal</option>
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
          <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-6 ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
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

          </div>
          </div>

          {/* ── PROFESSIONAL PAYMENT CHECKOUT SIDE PANEL ── */}
          <div className="lg:col-span-1 border-l border-[#e0e3eb] dark:border-slate-700/50 pl-0 lg:pl-6 animate-slide-left">
            <div className={`w-full rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
              
              {/* Header */}
              <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'border-white/5 bg-slate-800/50' : 'border-slate-100 bg-slate-50/50'} rounded-t-3xl`}>
                <div className="flex items-center gap-2">
                  <Receipt className="font-medium w-5 h-5 text-amber-500" />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Live Receipt</span>
                </div>
              </div>

              {paymentStatus === 'pending' && (
                <div className="p-6">
                  
                  {/* Payee Info */}
                  <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 border ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="font-medium w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paying To</p>
                      <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</p>
                      <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{sellerPhone}</p>
                    </div>
                  </div>

                  {/* Receipt Breakdown */}
                  <div className="mb-6">
                    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receipt Breakdown</h3>
                    <div className={`rounded-xl border divide-y ${isDarkMode ? 'border-white/5 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                      
                      {/* Material List (max 3, then scroll) */}
                      <div className="max-h-[180px] overflow-y-auto p-2">
                        {materials.filter(m => m.subcategory && m.weight && m.pricePerKg).map(m => {
                          const lineTotal = parseFloat(m.weight) * parseFloat(m.pricePerKg);
                          return (
                            <div key={m.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <div>
                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.subcategory}</p>
                                <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{m.weight}kg @ {m.pricePerKg} KES</p>
                              </div>
                              <p className={`text-sm font-medium font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{lineTotal.toLocaleString()}</p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Row */}
                      <div className={`p-4 flex justify-between items-end bg-amber-500/5 ${isDarkMode ? '' : ''}`}>
                        <div>
                          <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Due</p>
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{calculatedTotals.totalWeight.toFixed(1)} KG</p>
                        </div>
                        <p className="text-xl font-bold font-mono text-amber-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
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
                      onClick={() => processCheckout('mpesa')}
                      disabled={!calculatedTotals.allFilled}
                      className="py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-medium uppercase tracking-wider text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <Banknote className="w-4 h-4" /> Send M-PESA
                    </button>
                  </div>
                </div>
              )}

              {paymentStatus === 'processing' && (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                  <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Processing Intake...</h2>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Recording assets to ledger.</p>
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
                      KES {calculatedTotals.totalPayout.toLocaleString()} paid to {sellerName}.
                    </p>
                  </div>
                  
                  <div className="space-y-3 text-left w-full mt-6">
                    <div className={`p-3 rounded-xl border flex justify-between items-center ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                      <span className={`text-[10px] font-medium uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Digital Waybill</span>
                      <span className={`text-xs font-bold font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{waybillId}</span>
                    </div>
                    
                    {isKlinflowUser && (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Leaf className="font-medium w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-0.5">Eco-Reward Granted</p>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>+{gfpPointsAwarded} GFP Points</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-200 dark:border-white/5">
                    <button
                      onClick={() => { setStep(1); setMaterials([]); setSellerPhone(''); setSellerName(''); setPaymentStatus('pending'); }}
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
