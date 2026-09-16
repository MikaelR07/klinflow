import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Store,
  History,
  Clock, 
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
  Receipt,
  Package,
  Search,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';

interface ManualMaterialLine {
  id: string;
  category: string;
  subcategory: string;
  grade: string;
  weight: string;
  basePricePerKg: string;
  pricePerKg: string;
}

interface MaterialBreakdown {
  type: string;
  weight: number;
  color: string;
}

const maskPhone = (phone?: string) => {
  if (!phone) return 'N/A';
  const str = phone.trim();
  if (str.length <= 6) return str;
  const first3 = str.slice(0, 3);
  const last3 = str.slice(-3);
  const stars = '*'.repeat(Math.max(4, str.length - 6));
  return `${first3}${stars}${last3}`;
};

const maskKlinId = (klinId?: string) => {
  if (!klinId) return 'N/A';
  const str = klinId.trim();
  if (str.length <= 5) return str;
  const first2 = str.slice(0, 2);
  const last3 = str.slice(-3);
  const stars = '*'.repeat(Math.max(3, str.length - 5));
  return `${first2}${stars}${last3}`;
};

interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDarkMode: boolean;
  className?: string;
  disabled?: boolean;
}

function SearchableSelect({ options, value, onChange, placeholder = 'Select...', isDarkMode, className = '', disabled = false }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value.toLowerCase() === value.toLowerCase()) || options[0];

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(o => 
      o.label.toLowerCase().includes(term) || 
      (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className={`relative w-full ${isOpen ? 'z-[9999]' : 'z-10'} ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
        className={`w-full px-3 py-2 text-xs font-medium rounded-xl border outline-none flex items-center justify-between gap-2 transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed ' : ''
        }${
          isDarkMode 
            ? 'bg-slate-800/90 border-white/10 text-white hover:border-amber-500/50' 
            : 'bg-slate-50 border-slate-200 text-slate-900 hover:border-amber-500/50 shadow-2xs'
        }`}
      >
        <span className="truncate flex items-center gap-1.5 min-w-0">
          {selectedOption?.icon && <span className="text-sm shrink-0">{selectedOption.icon}</span>}
          <span className="font-semibold truncate">{selectedOption?.label || placeholder}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 opacity-60 transition-transform ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 mt-1.5 z-[9999] min-w-[240px] w-full rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 ${
          isDarkMode ? 'bg-slate-900 border-white/10 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
        }`}>
          {/* Sticky Search Input Header at top of dropdown */}
          <div className={`p-2.5 border-b sticky top-0 z-20 ${isDarkMode ? 'border-white/10 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search material..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none font-medium transition-all ${
                  isDarkMode ? 'bg-slate-950 border-white/10 text-white focus:border-amber-500' : 'bg-white border-slate-200 text-slate-900 focus:border-amber-500'
                }`}
              />
            </div>
          </div>

          {/* Options List below Search Input */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs opacity-50 font-medium">
                No matching materials found
              </div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium rounded-xl flex items-center justify-between gap-3 transition-colors ${
                    opt.value.toLowerCase() === value.toLowerCase()
                      ? (isDarkMode ? 'bg-amber-600/25 text-amber-400 font-bold border border-amber-500/30' : 'bg-amber-50 text-amber-600 font-bold border border-amber-200')
                      : (isDarkMode ? 'hover:bg-slate-800/80 text-slate-200' : 'hover:bg-slate-100/80 text-slate-800')
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span className="text-base shrink-0">{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {opt.sublabel && (
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 ml-2">
                      {opt.sublabel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_SUBCATEGORIES: Record<string, Array<{ name: string; defaultPrice: number }>> = {
  Plastic: [
    { name: 'PET Clear', defaultPrice: 35 },
    { name: 'PET Color', defaultPrice: 28 },
    { name: 'HDPE Baled', defaultPrice: 40 },
    { name: 'LDPE Film', defaultPrice: 30 },
    { name: 'PP Injection', defaultPrice: 32 },
    { name: 'Mixed Plastic', defaultPrice: 20 },
  ],
  Paper: [
    { name: 'OCC Corrugated', defaultPrice: 18 },
    { name: 'White Office Paper', defaultPrice: 25 },
    { name: 'ONP Newsprint', defaultPrice: 15 },
    { name: 'Mixed Paper', defaultPrice: 12 },
  ],
  Metal: [
    { name: 'Aluminum Cans', defaultPrice: 120 },
    { name: 'Copper Wire', defaultPrice: 650 },
    { name: 'Brass Scrap', defaultPrice: 450 },
    { name: 'Iron & Steel', defaultPrice: 35 },
    { name: 'Heavy Scrap Metal', defaultPrice: 40 },
  ],
  Glass: [
    { name: 'Clear Glass Bottles', defaultPrice: 10 },
    { name: 'Green Glass Bottles', defaultPrice: 8 },
    { name: 'Amber Glass Bottles', defaultPrice: 8 },
    { name: 'Cullet Broken Glass', defaultPrice: 5 },
  ]
};

export default function WalkInIntake() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const { categories, fetchCategories, materialPrices, fetchMaterialPrices } = useServiceStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();

  useEffect(() => {
    if (fetchCategories) fetchCategories();
    if (fetchMaterialPrices) fetchMaterialPrices();
    if (fetchAgentConfig) fetchAgentConfig();
  }, [fetchCategories, fetchMaterialPrices, fetchAgentConfig]);

  // Available Categories filtered by Hub Config (accepted_materials)
  const availableCategories = useMemo(() => {
    const acceptedSlugs = agentConfig?.accepted_materials || [];
    
    const baseCats = categories && categories.length > 0
      ? categories.map(c => ({ id: c.id, slug: c.slug || c.id, label: c.label, icon: c.icon || '📦' }))
      : [
          { id: 'plastic', slug: 'plastic', label: 'Plastic', icon: '♻️' },
          { id: 'paper', slug: 'paper', label: 'Paper', icon: '📄' },
          { id: 'metal', slug: 'metal', label: 'Metal', icon: '⚙️' },
          { id: 'glass', slug: 'glass', label: 'Glass', icon: '🍾' },
          { id: 'e_waste', slug: 'e_waste', label: 'E-Waste', icon: '💻' }
        ];

    if (acceptedSlugs.length > 0) {
      const filtered = baseCats.filter(c => 
        acceptedSlugs.some(slug => 
          slug.toLowerCase() === c.slug.toLowerCase() || 
          slug.toLowerCase() === c.id.toLowerCase() || 
          slug.toLowerCase() === c.label.toLowerCase()
        )
      );
      if (filtered.length > 0) return filtered;
    }

    return baseCats;
  }, [categories, agentConfig]);

  // Available Subcategories & custom hub rates calculation
  const getSubcategoriesForCategory = useCallback((categoryName: string) => {
    const customRates = (agentConfig?.custom_rates as Record<string, number | string>) || {};

    const matchedCat = availableCategories.find(c => 
      c.label.toLowerCase() === categoryName.toLowerCase() || 
      c.slug.toLowerCase() === categoryName.toLowerCase()
    );
    const catSlug = matchedCat?.slug || categoryName.toLowerCase();
    const catCustomRate = customRates[catSlug] !== undefined ? Number(customRates[catSlug]) : null;

    const dbSubcats = (materialPrices || []).filter((mp: any) => {
      if (!mp) return false;
      const catLabel = mp.category_label || mp.category || '';
      return catLabel.toLowerCase() === categoryName.toLowerCase() || catLabel.toLowerCase() === catSlug;
    });

    if (dbSubcats.length > 0) {
      return dbSubcats.map((m: any) => {
        const subSlug = `${catSlug}_${m.id}`;
        const subRate = customRates[subSlug] !== undefined ? Number(customRates[subSlug]) : (catCustomRate ?? Number(m.price_per_kg) ?? 25);
        return {
          name: m.material_name || m.label || 'Standard Material',
          defaultPrice: subRate
        };
      });
    }

    const normalizedCategory = Object.keys(DEFAULT_SUBCATEGORIES).find(
      k => k.toLowerCase() === categoryName.toLowerCase()
    ) || 'Plastic';

    const defaultList = DEFAULT_SUBCATEGORIES[normalizedCategory] || DEFAULT_SUBCATEGORIES['Plastic'];

    return defaultList.map(sub => {
      const subSlug = `${catSlug}_${sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;
      const subRate = customRates[subSlug] !== undefined ? Number(customRates[subSlug]) : (catCustomRate ?? sub.defaultPrice);
      return {
        name: sub.name,
        defaultPrice: subRate
      };
    });
  }, [materialPrices, agentConfig, availableCategories]);

  const [step, setStep] = useState(1);
  
  // Seller Registration & Search State
  const [sellerMode, setSellerMode] = useState<'existing' | 'new' | 'rfq_dropoff'>('existing');
  const [rfqPinInput, setRfqPinInput] = useState('');
  const [isRfqDropoff, setIsRfqDropoff] = useState(false);
  const [rfqFulfillmentId, setRfqFulfillmentId] = useState<string | null>(null);
  const [rfqId, setRfqId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerKlinId, setSellerKlinId] = useState('');
  const [sellerAvatar, setSellerAvatar] = useState('');
  const [isKlinflowUser, setIsKlinflowUser] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Material Entry State
  const [materials, setMaterials] = useState<ManualMaterialLine[]>([
    { id: '1', category: 'Plastic', subcategory: 'PET Clear', grade: 'A', weight: '', basePricePerKg: '30', pricePerKg: '30' }
  ]);

  const { profile, currentCompanyId } = useAuthStore() as any;

  // Checkout State
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'cash' | 'digital_wallet' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success'>('pending');
  const [waybillId] = useState(`#WB-${(Math.random() * 99999).toFixed(0).padStart(5, '0')}`);
  const [mpesaReceipt] = useState(`Q${Math.random().toString(36).substring(2, 10).toUpperCase()}`);

  // Recent History State
  const [recentWalkins, setRecentWalkins] = useState<any[]>([]);
  const [isFetchingRecent, setIsFetchingRecent] = useState(false);
  const [intakeStats, setIntakeStats] = useState({ total: 0, breakdown: [] as MaterialBreakdown[], totalPaid: 0 });

  useEffect(() => {
    if (!currentCompanyId && !profile?.id) return;
    const fetchRecent = async () => {
      setIsFetchingRecent(true);
      try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const targetIds = [profile?.id, currentCompanyId].filter(Boolean);
        const { data, error } = await (supabase.from('assets') as any)
          .select('*')
          .or(`hub_manager_id.in.(${targetIds.join(',')}),verifier_id.in.(${targetIds.join(',')})`)
          .or('sourcing_tag.eq.walk-in,source.eq.walk_in,sourcing_tag.eq.walk_in')
          .gte('created_at', todayStart.toISOString())
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        const materialMap = new Map<string, number>();
        let totalWeight = 0;
        let totalPaid = 0;

        const grouped = (data || []).reduce((acc: any[], item: any) => {
          const w = Number(item.weight_kg) || 0;
          const p = Number(item.amount_paid) || 0;
          const t = item.material_type || 'Other';

          // For stats
          totalWeight += w;
          totalPaid += p;
          materialMap.set(t, (materialMap.get(t) || 0) + w);

          const existing = acc.find((g: any) => g.seller_name === item.seller_name && Math.abs(new Date(g.created_at).getTime() - new Date(item.created_at).getTime()) < 60000);
          if (existing) {
            existing.weight += w;
            existing.payout += p;
          } else {
            acc.push({
              id: item.id,
              seller_name: item.seller_name || 'Walk-in Seller',
              weight: w,
              payout: p,
              created_at: item.created_at
            });
          }
          return acc;
        }, []);
        
        setRecentWalkins(grouped);

        const MATERIAL_COLORS = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-purple-500'];
        const breakdown = Array.from(materialMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([type, weight], idx) => ({
            type,
            weight,
            color: MATERIAL_COLORS[idx % MATERIAL_COLORS.length] as string
          }));

        setIntakeStats({ total: totalWeight, breakdown, totalPaid });
      } catch (err) {
        console.error(err);
      } finally {
        setIsFetchingRecent(false);
      }
    };
    
    fetchRecent();
  }, [currentCompanyId, profile?.id, paymentStatus]);

  const handleUserSearch = async () => {
    const rawStr = searchInput.trim();
    if (!rawStr) return;
    setIsSearchingUser(true);
    setHasSearched(false);
    
    try {
      const cleanDigits = rawStr.replace(/\D/g, '');
      let phoneVariants = [rawStr];
      if (cleanDigits.length >= 9) {
        const last9 = cleanDigits.slice(-9);
        phoneVariants = [
          `0${last9}`,
          `+254${last9}`,
          `254${last9}`,
          last9
        ];
      }

      // Query profiles by phone variants, klinflow_id, or name
      const { data: matchedUser, error } = await supabase
        .from('profiles')
        .select('id, name, phone, klinflow_id, avatar_url')
        .or(`phone.in.("${phoneVariants.join('","')}"),klinflow_id.ilike.%${rawStr}%,name.ilike.%${rawStr}%`)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Primary search warning, trying fallback:', error);
        // Fallback query by phone digits or klinflow_id
        const { data: fallbackUser } = await supabase
          .from('profiles')
          .select('id, name, phone, klinflow_id, avatar_url')
          .or(`phone.ilike.%${cleanDigits || rawStr}%,klinflow_id.ilike.%${rawStr}%`)
          .limit(1)
          .maybeSingle();
          
        if (fallbackUser) {
          setIsKlinflowUser(true);
          setSellerName(fallbackUser.name || rawStr);
          setSellerPhone(fallbackUser.phone || rawStr);
          setSellerKlinId(fallbackUser.klinflow_id || 'KL-MEMBER');
          setSellerAvatar(fallbackUser.avatar_url || '');
          setHasSearched(true);
          return;
        }
      }

      if (matchedUser) {
        setIsKlinflowUser(true);
        setSellerName(matchedUser.name || rawStr);
        setSellerPhone(matchedUser.phone || rawStr);
        setSellerKlinId(matchedUser.klinflow_id || 'KL-MEMBER');
        setSellerAvatar(matchedUser.avatar_url || '');
      } else {
        setIsKlinflowUser(false);
      }
      setHasSearched(true);
    } catch (err) {
      console.error('User search failed:', err);
      setIsKlinflowUser(false);
      setHasSearched(true);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleRfqPinSearch = async () => {
    const rawPin = rfqPinInput.trim();
    if (rawPin.length !== 6) return;
    setIsSearchingUser(true);
    setHasSearched(false);
    
    try {
      const { data: order, error } = await supabase
        .from('fulfillment_orders')
        .select(`
          id,
          rfq_id,
          seller:profiles!seller_id(name, phone, klinflow_id, avatar_url),
          proposal:rfq_offers!proposal_id(offered_weight, offered_price),
          rfq:marketplace_rfqs!rfq_id(material, category, delivery_method)
        `)
        .eq('verification_code', rawPin)
        .eq('delivery_method', 'self_drop')
        .eq('status', 'pending_coordination')
        .maybeSingle();

      if (error) throw error;

      if (order && order.seller && order.proposal && order.rfq) {
        setIsKlinflowUser(true);
        const sellerObj: any = order.seller;
        const proposalObj: any = order.proposal;
        const rfqObj: any = order.rfq;

        setSellerName(sellerObj.name || 'Unknown Seller');
        setSellerPhone(sellerObj.phone || '000000000');
        setSellerKlinId(sellerObj.klinflow_id || 'KL-SELLER');
        setSellerAvatar(sellerObj.avatar_url || '');
        
        setIsRfqDropoff(true);
        setRfqFulfillmentId(order.id);
        setRfqId(order.rfq_id);
        
        // Pre-fill materials based on RFQ Offer
        setMaterials([{
          id: Math.random().toString(),
          category: rfqObj.category || 'Plastic',
          subcategory: rfqObj.material || 'PET Clear',
          grade: 'Standard',
          weight: proposalObj.offered_weight?.toString() || '',
          basePricePerKg: proposalObj.offered_price?.toString() || '0',
          pricePerKg: proposalObj.offered_price?.toString() || '0'
        }]);

        setHasSearched(true);
      } else {
        setIsKlinflowUser(false);
        setHasSearched(true);
      }
    } catch (err) {
      console.error('RFQ PIN search failed:', err);
      setIsKlinflowUser(false);
      setHasSearched(true);
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleProceedToMaterials = () => {
    if (!sellerName || !sellerPhone) return;
    setStep(2);
  };

  const handleCategoryChange = (id: string, newCategory: string) => {
    const subs = getSubcategoriesForCategory(newCategory);
    const firstSub = subs[0];
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      const defaultPrice = firstSub ? firstSub.defaultPrice.toString() : '25';
      return {
        ...m,
        category: newCategory,
        subcategory: firstSub ? firstSub.name : '',
        basePricePerKg: defaultPrice,
        pricePerKg: defaultPrice
      };
    }));
  };

  const handleSubcategoryChange = (id: string, categoryName: string, newSubcategory: string) => {
    const subs = getSubcategoriesForCategory(categoryName);
    const matched = subs.find(s => s.name.toLowerCase() === newSubcategory.toLowerCase());
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      const defaultPrice = matched ? matched.defaultPrice.toString() : m.basePricePerKg;
      return {
        ...m,
        subcategory: newSubcategory,
        basePricePerKg: defaultPrice,
        pricePerKg: defaultPrice
      };
    }));
  };

  const addMaterialLine = () => {
    const defaultSubs = getSubcategoriesForCategory('Plastic');
    const firstSub = defaultSubs[0];
    const defaultPrice = firstSub ? firstSub.defaultPrice.toString() : '35';
    setMaterials(prev => [
      ...prev,
      { 
        id: Math.random().toString(), 
        category: 'Plastic', 
        subcategory: firstSub ? firstSub.name : 'PET Clear', 
        grade: 'A', 
        weight: '', 
        basePricePerKg: defaultPrice, 
        pricePerKg: defaultPrice 
      }
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

  const gfpPointsAwarded = Math.floor(calculatedTotals.totalWeight * 2);

  const processCheckout = async (method: 'cash' | 'mpesa' | 'digital_wallet') => {
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

      const { error } = await (supabase as any).rpc('hub_process_walkin_intake', {
        p_hub_id: currentCompanyId || profile?.companyId || profile?.company_id || profile?.id,
        p_seller_phone: sellerPhone,
        p_seller_name: sellerName,
        p_items: items,
        p_payment_method: method,
        p_total_payout: calculatedTotals.totalPayout
      });

      if (error) throw error;
      
      if (isRfqDropoff && rfqFulfillmentId) {
        const { error: fulfillmentError } = await supabase
          .from('fulfillment_orders')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', rfqFulfillmentId);
          
        if (fulfillmentError) console.error('Error updating fulfillment order:', fulfillmentError);
          
        if (rfqId) {
          const { error: rfqError } = await supabase
            .from('marketplace_rfqs')
            .update({ status: 'fulfilled' })
            .eq('id', rfqId);
          if (rfqError) console.error('Error updating RFQ status:', rfqError);
        }
      }

      setPaymentStatus('success');
    } catch (err) {
      console.error(err);
      setPaymentStatus('pending');
      alert('Failed to process intake.');
    }
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
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

        <div className="grid lg:grid-cols-12 gap-6 items-start animate-slide-up">
          
          {/* Main Content Area */}
          <div className={`${step === 1 ? 'lg:col-span-4' : 'lg:col-span-12'}`}>
            {step === 1 && (
              <div className={`max-w-md mx-auto mt-2 p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3 border border-amber-500/20">
                    <Store className="w-7 h-7 text-amber-500" />
                  </div>
                  <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Seller Verification</h2>
                  <p className={`text-xs mt-1 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select seller type to proceed with material intake
                  </p>
                </div>

                {/* Segmented Mode Switcher */}
                <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-6">
                  <button
                    type="button"
                    onClick={() => { setSellerMode('existing'); setHasSearched(false); setSearchInput(''); setSellerName(''); setSellerPhone(''); setIsRfqDropoff(false); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      sellerMode === 'existing' 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" /> Existing Member
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSellerMode('new'); setHasSearched(false); setIsKlinflowUser(false); setSellerKlinId('Walk-in Seller'); setSellerAvatar(''); setIsRfqDropoff(false); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      sellerMode === 'new' 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Register Walk-in
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSellerMode('rfq_dropoff'); setHasSearched(false); setIsKlinflowUser(false); setSellerAvatar(''); setIsRfqDropoff(true); setRfqPinInput(''); }}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      sellerMode === 'rfq_dropoff' 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" /> RFQ Drop-off
                  </button>
                </div>

                {/* Mode 1: Existing Member Lookup */}
                {sellerMode === 'existing' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input 
                          type="text" 
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
                          placeholder="Enter Name, Phone Number, or Klin-ID..."
                          className={`w-full py-4 pl-12 pr-4 text-center rounded-2xl border text-sm font-medium outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-slate-800/80 border-white/10 text-white focus:border-amber-500 focus:bg-slate-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white'
                          }`}
                          style={{ color: isDarkMode ? 'white' : 'black' }}
                        />
                      </div>

                      <div className="flex justify-center pt-1">
                        <button 
                          onClick={handleUserSearch}
                          disabled={!searchInput.trim() || isSearchingUser}
                          className="px-8 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSearchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Check Seller</>}
                        </button>
                      </div>
                    </div>

                    {/* Search Result */}
                    {hasSearched && (
                      <div className="animate-fade-in space-y-4 pt-2">
                        {isKlinflowUser ? (
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold overflow-hidden shrink-0 border border-amber-500/30">
                                {sellerAvatar ? (
                                  <img src={getThumbnailUrl(sellerAvatar, { width: 100 })} alt={sellerName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-6 h-6" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</h3>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Phone: {maskPhone(sellerPhone)}
                                  </span>
                                  <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    • ID: {maskKlinId(sellerKlinId)}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                <Leaf className="w-3 h-3" /> Earning GFP
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">No Klinflow member found for "{searchInput}"</p>
                            <button
                              onClick={() => {
                                setSellerMode('new');
                                if (/^\d{9,12}$/.test(searchInput.replace(/\D/g, ''))) {
                                  setSellerPhone(searchInput);
                                  setSellerName('');
                                } else {
                                  setSellerName(searchInput);
                                  setSellerPhone('');
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors"
                            >
                              Register as Walk-in Seller →
                            </button>
                          </div>
                        )}

                        {isKlinflowUser && (
                          <button 
                            onClick={handleProceedToMaterials}
                            className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all shadow-xl"
                          >
                            Proceed to Materials
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: Register New Walk-in */}
                {sellerMode === 'new' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <input 
                        type="text" 
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className={`w-full p-3.5 rounded-xl border text-xs font-medium outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        }`}
                        style={{ color: isDarkMode ? 'white' : 'black' }}
                      />
                    </div>

                    <div>
                      <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                      <input 
                        type="tel" 
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        placeholder="e.g. 0712 345 678"
                        className={`w-full p-3.5 rounded-xl border text-xs font-medium outline-none transition-colors ${
                          isDarkMode 
                            ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' 
                            : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                        }`}
                        style={{ color: isDarkMode ? 'white' : 'black' }}
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input type="checkbox" id="invite" className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer" defaultChecked />
                      <label htmlFor="invite" className={`text-xs font-medium cursor-pointer ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Send SMS invite to join Klinflow app</label>
                    </div>

                    <button 
                      onClick={handleProceedToMaterials}
                      disabled={!sellerName.trim() || !sellerPhone.trim()}
                      className="w-full h-14 mt-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
                    >
                      Proceed to Materials
                    </button>
                  </div>
                )}

                {/* Mode 3: RFQ Drop-off Verification */}
                {sellerMode === 'rfq_dropoff' && (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <div className="relative">
                        <ShieldCheck className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                        <input 
                          type="text" 
                          maxLength={6}
                          value={rfqPinInput}
                          onChange={(e) => setRfqPinInput(e.target.value.replace(/\D/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && handleRfqPinSearch()}
                          placeholder="Enter 6-Digit Verification PIN..."
                          className={`w-full py-4 pl-12 pr-4 text-center rounded-2xl border text-sm font-medium tracking-[0.5em] outline-none transition-all ${
                            isDarkMode 
                              ? 'bg-slate-800/80 border-white/10 text-white focus:border-amber-500 focus:bg-slate-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500 focus:bg-white'
                          }`}
                          style={{ color: isDarkMode ? 'white' : 'black' }}
                        />
                      </div>

                      <div className="flex justify-center pt-1">
                        <button 
                          onClick={handleRfqPinSearch}
                          disabled={rfqPinInput.length !== 6 || isSearchingUser}
                          className="px-8 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider active:scale-[0.98] transition-all shadow-md shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSearchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify PIN</>}
                        </button>
                      </div>
                    </div>

                    {/* Search Result */}
                    {hasSearched && (
                      <div className="animate-fade-in space-y-4 pt-2">
                        {isKlinflowUser ? (
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold overflow-hidden shrink-0 border border-amber-500/30">
                                {sellerAvatar ? (
                                  <img src={getThumbnailUrl(sellerAvatar, { width: 100 })} alt={sellerName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-6 h-6" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</h3>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    Phone: {maskPhone(sellerPhone)}
                                  </span>
                                  <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    • ID: {maskKlinId(sellerKlinId)}
                                  </span>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                                <PackageCheck className="w-3 h-3" /> RFQ Verified
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-3">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Invalid PIN or RFQ not found.</p>
                          </div>
                        )}

                        {isKlinflowUser && (
                          <button 
                            onClick={handleProceedToMaterials}
                            className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-wider text-xs active:scale-[0.98] transition-all shadow-xl"
                          >
                            Proceed to Scale
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-slide-up">
                
                <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                  {/* Seller Banner */}
                  <div className={`p-6 md:p-8 rounded-xl border flex items-center justify-between gap-6 flex-wrap ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-6">
                      <div className="font-medium w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                        {sellerAvatar ? (
                          <img src={getThumbnailUrl(sellerAvatar, { width: 100 })} alt={sellerName} className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <User className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <h2 className={`text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            {maskPhone(sellerPhone)}
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
                        disabled={isRfqDropoff}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors ${isRfqDropoff ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Line
                      </button>
                    </div>

                    <div className="overflow-x-auto min-h-[400px] pb-28">
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
                                <td className="px-6 py-4 min-w-[180px]">
                                  <SearchableSelect
                                    options={availableCategories.map(cat => ({
                                      value: cat.label,
                                      label: cat.label,
                                      icon: cat.icon
                                    }))}
                                    value={m.category}
                                    onChange={(val) => handleCategoryChange(m.id, val)}
                                    placeholder="Search Category..."
                                    isDarkMode={isDarkMode}
                                    disabled={isRfqDropoff}
                                  />
                                </td>
                                <td className="px-4 py-4 min-w-[220px]">
                                  <SearchableSelect
                                    options={getSubcategoriesForCategory(m.category).map(sub => ({
                                      value: sub.name,
                                      label: sub.name,
                                      sublabel: `${sub.defaultPrice} KES/kg`
                                    }))}
                                    value={m.subcategory}
                                    onChange={(val) => handleSubcategoryChange(m.id, m.category, val)}
                                    placeholder="Search Subcategory..."
                                    isDarkMode={isDarkMode}
                                    disabled={isRfqDropoff}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <select 
                                    value={m.grade}
                                    onChange={(e) => updateMaterial(m.id, 'grade', e.target.value)}
                                    disabled={isRfqDropoff}
                                    className={`w-full px-3 py-2 text-xs font-medium rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} ${isRfqDropoff ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    disabled={isRfqDropoff}
                                    onChange={(e) => updateMaterial(m.id, 'pricePerKg', e.target.value)}
                                    className={`w-24 px-3 py-2 text-xs font-medium font-mono rounded-lg border outline-none ${isDarkMode ? 'bg-slate-800 border-white/10 text-white focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'} ${isRfqDropoff ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                    disabled={materials.length === 1 || isRfqDropoff}
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

                {/* Checkout Side Panel */}
                <div className="lg:col-span-5 xl:col-span-4 border-l border-[#e0e3eb] dark:border-slate-700/50 pl-0 lg:pl-6 animate-slide-left">
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
                            {sellerAvatar ? (
                              <img src={getThumbnailUrl(sellerAvatar, { width: 100 })} alt={sellerName} className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paying To</p>
                            <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{sellerName}</p>
                            <p className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{maskPhone(sellerPhone)}</p>
                          </div>
                        </div>

                        {/* Receipt Breakdown */}
                        <div className="mb-6">
                          <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Receipt Breakdown</h3>
                          <div className={`rounded-xl border divide-y ${isDarkMode ? 'border-white/5 divide-white/5' : 'border-slate-200 divide-slate-100'}`}>
                            
                            {/* Material List */}
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

                            {/* Total & Eco-Reward Row */}
                            <div className={`p-4 space-y-2.5 bg-amber-500/5 ${isDarkMode ? '' : ''}`}>
                              {isKlinflowUser && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Eco-Reward</span>
                                  <span className="font-bold text-xs text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                    <Leaf className="w-3 h-3 text-emerald-500" /> +{gfpPointsAwarded} GFP Points
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between items-end pt-2 border-t border-amber-500/10">
                                <div>
                                  <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total Due</p>
                                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{calculatedTotals.totalWeight.toFixed(1)} KG</p>
                                </div>
                                <p className="text-xl font-bold font-mono text-amber-500">KES {calculatedTotals.totalPayout.toLocaleString()}</p>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Financial Loan Incentive Banner */}
                        <div className={`p-3.5 rounded-2xl mb-5 border text-xs ${
                          isDarkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}>
                          <div className="flex items-start gap-2.5">
                            <Wallet className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[10px] uppercase tracking-wider text-amber-500">Klinflow Wallet Payouts</p>
                              <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                                Receiving payouts directly to Klinflow Wallet builds transaction credit history, unlocking access to <strong>Equipment & Business Micro-Loans</strong>!
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPendingPaymentMethod('cash')}
                            disabled={!calculatedTotals.allFilled}
                            className={`py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 border disabled:opacity-50 ${
                              isDarkMode 
                                ? 'bg-slate-800 border-white/10 text-white hover:bg-slate-700' 
                                : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            Paid Cash
                          </button>
                          <button
                            onClick={() => {
                              if (!isKlinflowUser) {
                                alert("To Wallet payouts are available for registered Klinflow members. Please register the seller on Klinflow first or select Paid Cash.");
                                return;
                              }
                              setPendingPaymentMethod('digital_wallet');
                            }}
                            disabled={!calculatedTotals.allFilled}
                            className="py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                          >
                            <Wallet className="w-4 h-4" /> To Wallet
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
                            onClick={() => { 
                              setStep(1); 
                              setMaterials([]); 
                              setSearchInput('');
                              setSellerPhone(''); 
                              setSellerName(''); 
                              setSellerKlinId('');
                              setSellerAvatar('');
                              setHasSearched(false);
                              setPaymentStatus('pending'); 
                            }}
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

          {/* Right Sidebar: Recent History & Stats (Only visible on Step 1) */}
          {step === 1 && (
            <div className="lg:col-span-8 space-y-6">
              
              {/* Recent History (Expanded to match Individual Agent Intake page) */}
              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <History className="w-4 h-4 text-amber-500" /> Today's Walk-ins
                  </h3>
                  <span className="text-xs font-bold text-slate-400">{recentWalkins.length}</span>
                </div>

                <div className="space-y-3 max-h-[520px] min-h-[380px] overflow-y-auto pr-1">
                  {isFetchingRecent ? (
                    <div className="py-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-xs">Loading history...</p>
                    </div>
                  ) : recentWalkins.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 space-y-2">
                      <User className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs font-medium">No walk-in intakes recorded today.</p>
                    </div>
                  ) : (
                    recentWalkins.map((entry, idx) => (
                      <div key={idx} className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                        isDarkMode ? 'bg-slate-800/40 border-white/5 hover:border-white/10' : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDarkMode ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
                          }`}>
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{entry.seller_name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                                {entry.weight.toFixed(1)} KG
                              </span>
                              <span className={`text-[10px] flex items-center gap-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                <Clock className="w-3 h-3" />
                                {new Date(entry.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold font-mono ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                            KES {entry.payout.toLocaleString()}
                          </p>
                          <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-500/80">
                            Completed
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Today's Intake Summary */}
              <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
                {isFetchingRecent ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <div className="flex gap-6 overflow-x-auto items-start">
                    <div className="shrink-0">
                      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Today's Walk-in Intakes</p>
                      <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{intakeStats.total >= 1000 ? `${(intakeStats.total / 1000).toFixed(1)}T` : `${intakeStats.total.toFixed(1)} KG`}</p>
                      <p className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>KES {intakeStats.totalPaid.toLocaleString()} paid</p>
                    </div>
                    <div className={`w-px self-stretch ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
                    <div className="flex gap-6 flex-wrap">
                      {intakeStats.breakdown.length === 0 ? (
                        <div className="flex items-center gap-2">
                          <Package className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                          <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No materials received yet today</p>
                        </div>
                      ) : (
                        intakeStats.breakdown.map((m) => (
                          <div key={m.type} className="shrink-0">
                            <p className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              <span className={`w-2 h-2 rounded-full ${m.color}`} /> {m.type}
                            </p>
                            <p className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{m.weight >= 1000 ? `${(m.weight / 1000).toFixed(1)}T` : `${m.weight.toFixed(1)} KG`}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {pendingPaymentMethod && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden p-6 md:p-8 space-y-6 ${
            isDarkMode ? 'bg-slate-900 border-white/10 text-white shadow-black/80' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300/80'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-200 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-500" /> Confirm Walk-in Payout
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Please review all material items and payout details before confirming.</p>
              </div>
              <button 
                onClick={() => setPendingPaymentMethod(null)} 
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 opacity-60" />
              </button>
            </div>

            {/* Payee Banner */}
            <div className={`p-4 rounded-2xl border flex items-center gap-4 ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold overflow-hidden shrink-0 border border-amber-500/30">
                {sellerAvatar ? (
                  <img src={getThumbnailUrl(sellerAvatar, { width: 100 })} alt={sellerName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold truncate">{sellerName}</h3>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Phone: {maskPhone(sellerPhone)} • ID: {maskKlinId(sellerKlinId)}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                pendingPaymentMethod === 'digital_wallet' 
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}>
                {pendingPaymentMethod === 'digital_wallet' ? 'Digital Wallet' : 'Cash'}
              </span>
            </div>

            {/* Material Items List */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Received Materials ({materials.length})</p>
              <div className={`max-h-44 overflow-y-auto divide-y rounded-2xl border ${isDarkMode ? 'bg-slate-950/50 divide-white/5 border-white/5' : 'bg-slate-50/50 divide-slate-100 border-slate-200'}`}>
                {materials.filter(m => m.subcategory && m.weight).map((m, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold">{m.category}</span> <span className="opacity-60">({m.subcategory} - Grade {m.grade})</span>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">{m.weight} KG @ KES {m.pricePerKg}/kg</p>
                    </div>
                    <span className="font-bold font-mono text-sm">KES {(parseFloat(m.weight || '0') * parseFloat(m.pricePerKg || '0')).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Box */}
            <div className={`p-4 rounded-2xl border space-y-2 ${isDarkMode ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 dark:text-slate-400">Total Net Weight:</span>
                <span className="font-bold font-mono">{calculatedTotals.totalWeight.toFixed(1)} KG</span>
              </div>
              {isKlinflowUser && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Eco-Reward Granted:</span>
                  <span className="font-bold text-emerald-500">+{gfpPointsAwarded} GFP Points</span>
                </div>
              )}
              <div className="pt-2 border-t border-amber-500/20 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Payout:</span>
                <span className="text-2xl font-bold font-mono text-amber-500">KES {calculatedTotals.totalPayout.toLocaleString()}</span>
              </div>
            </div>

            {/* Confirmation Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPendingPaymentMethod(null)}
                className={`flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  isDarkMode ? 'border-white/10 hover:bg-slate-800 text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const method = pendingPaymentMethod;
                  setPendingPaymentMethod(null);
                  processCheckout(method);
                }}
                className="flex-1 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 transition-all"
              >
                Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
