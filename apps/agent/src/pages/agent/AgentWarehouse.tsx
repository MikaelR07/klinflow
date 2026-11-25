import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowLeft,
  Truck,
  ShieldCheck,
  QrCode,
  Loader2,
  Layers,
  Check,
  ArrowUpRight,
  Recycle,
  Droplets,
  Cog,
  ScrollText,
  Wine,
  Cpu,
  Shirt,
  Apple
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useServiceStore } from '@klinflow/core/stores/serviceStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';

const CATEGORY_COLORS = [
  'bg-emerald-400',
  'bg-sky-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-rose-400',
];

export default function AgentWarehouse() {
  const navigate = useNavigate();
  const { profile, subscribeToProfileChanges } = useAuthStore() as any;
  const { materialPrices, fetchMaterialPrices, categories, fetchCategories, allCategories, fetchAllCategories } = useServiceStore();
  const { agentConfig, fetchAgentConfig } = useAgentStore();
  const [realAssets, setRealAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAllAssets, setShowAllAssets] = useState(false);

  const resolveMaterialName = (asset: any) => {
    const rawType = asset.material_type;
    if (!rawType) return 'Unknown Material';

    if (rawType.length > 20 && rawType.includes('-')) {
      const subcat = materialPrices?.find((m: any) => m.id === rawType);
      if (subcat?.material_name) return subcat.material_name;

      const cat = categories?.find((c: any) => c.id === rawType);
      if (cat?.label) {
        if (asset.grade && asset.grade !== 'Standard' && asset.grade !== 'Premium' && asset.grade !== 'Low Grade') {
          return asset.grade;
        }
        return cat.label;
      }

      const allCat = allCategories?.find((c: any) => c.id === rawType);
      if (allCat?.label) return allCat.label;

      return asset.grade && asset.grade.length > 2 ? asset.grade : 'Legacy Material';
    }

    if (['plastic', 'metal', 'paper', 'glass', 'e_waste'].includes(rawType.toLowerCase())) {
      if (asset.grade && asset.grade !== 'Standard' && asset.grade !== 'Premium' && asset.grade !== 'Low Grade') {
        return asset.grade;
      }
    }

    return rawType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const resolveCategoryLabel = (asset: any) => {
    const raw = asset.material_category || asset.material_type || 'Other';
    if (raw.length > 20 && raw.includes('-')) {
      const cat = categories?.find((c: any) => c.id === raw) || allCategories?.find((c: any) => c.id === raw);
      if (cat?.label) return cat.label;
      return 'Recyclables';
    }
    return raw.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const getCategoryStyle = (categoryLabel: string) => {
    const key = categoryLabel.toLowerCase();
    if (key.includes('plastic')) {
      return { Icon: Droplets, box: 'bg-sky-100/80 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400' };
    }
    if (key.includes('metal') || key.includes('scrap')) {
      return { Icon: Cog, box: 'bg-amber-100/80 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400' };
    }
    if (key.includes('paper') || key.includes('box') || key.includes('cardboard')) {
      return { Icon: ScrollText, box: 'bg-orange-100/80 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400' };
    }
    if (key.includes('glass')) {
      return { Icon: Wine, box: 'bg-teal-100/80 dark:bg-teal-500/15 text-teal-700 dark:text-teal-400' };
    }
    if (key.includes('waste') || key.includes('electronic')) {
      return { Icon: Cpu, box: 'bg-violet-100/80 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400' };
    }
    if (key.includes('textile') || key.includes('cloth')) {
      return { Icon: Shirt, box: 'bg-pink-100/80 dark:bg-pink-500/15 text-pink-700 dark:text-pink-400' };
    }
    if (key.includes('organic') || key.includes('food')) {
      return { Icon: Apple, box: 'bg-lime-100/80 dark:bg-lime-500/15 text-lime-700 dark:text-lime-400' };
    }
    return { Icon: Recycle, box: 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' };
  };

  const fetchCargo = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .in('status', ['verified', 'offline'])
        .eq('verifier_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRealAssets(data || []);
    } catch (err) {
      console.error('[Warehouse] Fetch Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCargo();
    fetchMaterialPrices();
    fetchCategories();
    fetchAllCategories();
    if (!agentConfig) {
      fetchAgentConfig();
    }
  }, [profile?.id, profile?.hubTransferPin]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`agent-assets-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `verifier_id=eq.${profile.id}`
      }, () => {
        fetchCargo();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      const sub = subscribeToProfileChanges(profile.id);
      return () => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      };
    }
  }, [profile?.id]);

  const getPrice = (typeOrSlug: string) => {
    if (agentConfig?.custom_rates?.[typeOrSlug]) {
      return parseFloat(agentConfig.custom_rates[typeOrSlug]);
    }
    const subcat = materialPrices.find((m: any) => m.id === typeOrSlug);
    if (subcat?.category) {
      const parentSlug = subcat.category.toLowerCase();
      if (agentConfig?.custom_rates?.[parentSlug]) {
        return parseFloat(agentConfig.custom_rates[parentSlug]);
      }
      if (subcat.price_per_kg) return parseFloat(subcat.price_per_kg);
    }
    return 0;
  };

  const verifiedAssets = realAssets.filter((a: any) => a.status === 'verified');
  const offlineAssets = realAssets.filter((a: any) => a.status === 'offline');

  const totalVerifiedWeight = verifiedAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.weight_kg) || 0), 0);
  const totalOfflineWeight = offlineAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.weight_kg) || 0), 0);
  const totalWeight = totalVerifiedWeight + totalOfflineWeight;
  const totalEstimatedValue = verifiedAssets.reduce((acc, asset: any) => acc + (parseFloat(asset.estimated_value) || 0), 0);

  // Category composition breakdown for the manifest bar
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    verifiedAssets.forEach((asset: any) => {
      const cat = resolveCategoryLabel(asset);
      map[cat] = (map[cat] || 0) + (parseFloat(asset.weight_kg) || 0);
    });
    return Object.entries(map)
      .map(([name, weight], idx) => ({
        name,
        weight,
        pct: totalVerifiedWeight > 0 ? Math.round((weight / totalVerifiedWeight) * 100) : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [verifiedAssets, totalVerifiedWeight, categories, allCategories]);

  const filterTabs = ['All', ...categoryBreakdown.map(c => c.name)];

  const filteredAssets = selectedCategory === 'All'
    ? verifiedAssets
    : verifiedAssets.filter(a => resolveCategoryLabel(a) === selectedCategory);

  const displayedAssets = showAllAssets ? filteredAssets : filteredAssets.slice(0, 6);

  const handleDispatch = async () => {
    if (realAssets.length === 0) {
      toast.error('Your truck is empty!', { description: 'You need to complete some pickups first.' });
      return;
    }

    try {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_en_route: true,
          hub_transfer_pin: pin
        })
        .eq('id', profile.id);

      if (profileError) throw profileError;

      const { updateProfile } = useAuthStore.getState() as any;
      await updateProfile({ hubTransferPin: pin, isEnRoute: true });

      toast.success('Check-In Requested!', {
        description: 'Please show your secure PIN at the gate.'
      });
    } catch (err) {
      toast.error('Failed to request check-in');
      console.error(err);
    }
  };

  return (
    <div className="-mx-1 bg-white dark:bg-slate-800 min-h-screen text-slate-900 dark:text-white pb-12 relative overflow-x-hidden transition-colors">

      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all duration-300">
        <div className="pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4 flex items-center justify-between relative">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all group"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
          </button>
          <div className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Cargo Manifest
            </h1>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mt-0.5">
              Truck load & hub check-in
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${
            profile?.hubTransferPin
              ? 'bg-emerald-100/80 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${profile?.hubTransferPin ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {profile?.hubTransferPin ? 'En Route' : 'Staging'}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-lg mx-auto px-1.5 space-y-5 pt-[calc(env(safe-area-inset-top,1rem)+4.75rem)]">

        {/* ── ARCHITECTURAL MANIFEST BOARD ── */}
        <div className="bg-[#1178ab]  text-white rounded-3xl p-4 border border-sky-400/30  relative overflow-hidden space-y-3">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none bg-sky-400/20" />

          {/* Top Split: Weight vs Estimated Payout */}
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-sky-100/80 mb-1.5">
                <Truck className="w-3.5 h-3.5 text-sky-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Load</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight tabular-nums leading-none">
                  {totalWeight.toFixed(1)}
                </span>
                <span className="text-sm font-bold text-sky-100/80">kg</span>
              </div>
              <p className="text-[11px] text-sky-100/80 font-medium mt-1.5">
                {verifiedAssets.length} verified {verifiedAssets.length === 1 ? 'batch' : 'batches'}
                {offlineAssets.length > 0 ? ` · ${offlineAssets.length} pending sync` : ''}
              </p>
            </div>

            <div className="text-right bg-black/20 border border-white/15 rounded-2xl px-3.5 py-2.5 shrink-0">
              <p className="text-[9px] font-bold text-sky-100/80 uppercase tracking-widest mb-1">Est. Value</p>
              <p className="text-base font-bold text-emerald-300 tabular-nums leading-none">
                KSh {totalEstimatedValue.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Material Composition Bar */}
          {categoryBreakdown.length > 0 && (
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-semibold text-sky-100/80">
                <span className="flex items-center gap-1.5 uppercase tracking-wider">
                  <Layers className="w-3 h-3" /> Load Composition
                </span>
                <span className="tabular-nums">{totalVerifiedWeight.toFixed(1)} kg verified</span>
              </div>

              {/* Segmented Progress Bar */}
              <div className="w-full h-2 bg-black/25 rounded-full overflow-hidden flex gap-0.5">
                {categoryBreakdown.map((cat) => (
                  <div
                    key={cat.name}
                    className={`h-full ${cat.color} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                    style={{ width: `${Math.max(cat.pct, 4)}%` }}
                  />
                ))}
              </div>

              {/* Compact Legend Pills */}
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {categoryBreakdown.slice(0, 4).map((cat) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span className="text-white/90 font-medium">{cat.name}</span>
                    <span className="text-sky-100/80 font-bold tabular-nums">{cat.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Perforated Gate Pass Divider */}
          <div className="relative z-10 border-t border-dashed border-white/20 pt-4">
            {profile?.hubTransferPin ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 uppercase tracking-widest">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Hub Gate Check-In Pass
                  </div>
                  <span className="text-[10px] font-medium text-sky-100/80">Show at gate</span>
                </div>

                {/* 6-Digit Boarding Pass PIN */}
                <div className="grid grid-cols-6 gap-1.5">
                  {String(profile.hubTransferPin).split('').map((digit: string, idx: number) => (
                    <div
                      key={idx}
                      className="h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg font-bold font-mono text-white tabular-nums"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white leading-tight">Ready for Hub Drop-off?</p>
                  <p className="text-[11px] text-sky-100/80 mt-0.5 truncate">
                    Generate your gate PIN before arrival
                  </p>
                </div>
                <button
                  onClick={handleDispatch}
                  disabled={verifiedAssets.length === 0}
                  className="px-4 py-2.5 bg-white hover:bg-sky-50 text-[#085078] rounded-xl font-bold text-xs tracking-wide active:scale-95 transition-all disabled:opacity-45 shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Get Gate PIN
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── COLLECTED MATERIALS ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1.5">
            <div>
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                Collected Materials
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Verified batches ready for hub drop-off
              </p>
            </div>
            {filteredAssets.length > 6 && (
              <button
                onClick={() => setShowAllAssets(!showAllAssets)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                {showAllAssets ? 'Show less' : `View all (${filteredAssets.length})`}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dynamic Category Filter Pills */}
          {filterTabs.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {filterTabs.map(tab => {
                const isActive = selectedCategory === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setSelectedCategory(tab)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}

          {isLoading ? (
            <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Loading collected materials...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="py-10 px-4 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2.5">
                <Package className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {selectedCategory === 'All' ? 'Truck is Empty' : `No ${selectedCategory} Materials`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Verified pickups you complete will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {displayedAssets.map((asset: any) => {
                const displayName = resolveMaterialName(asset);
                const categoryLabel = resolveCategoryLabel(asset);
                const { Icon: CatIcon, box: catBox } = getCategoryStyle(categoryLabel);
                const estVal = asset.estimated_value
                  ? Number(asset.estimated_value)
                  : parseFloat(asset.weight_kg) * getPrice(asset.material_type);
                const trackingRef = asset.tracking_id || asset.origin_tracking_id || asset.id.substring(0, 8).toUpperCase();
                const photoUrl = asset.photo_url || asset.images?.[0];
                const showGrade = asset.grade && asset.grade.toLowerCase() !== displayName.toLowerCase();

                return (
                  <div
                    key={asset.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3.5"
                  >
                    {/* Left Visual Holder */}
                    <div className="relative shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={displayName}
                          className="w-14 h-14 rounded-xl object-cover border border-slate-200/80 dark:border-slate-700/60"
                        />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${catBox}`}>
                          <CatIcon className="w-6 h-6" />
                        </div>
                      )}
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-50 dark:border-slate-800"
                        title="Verified"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    </div>

                    {/* Center Details */}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[14px] text-slate-900 dark:text-white capitalize truncate leading-tight">
                        {displayName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700/70 text-[10px] font-bold text-slate-700 dark:text-slate-200">
                          {categoryLabel}
                        </span>
                        {showGrade && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            {asset.grade}
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] font-medium text-slate-400 dark:text-slate-500 mt-1.5 truncate">
                        {new Date(asset.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, {new Date(asset.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · <span className="font-mono">#{trackingRef}</span>
                      </p>
                    </div>

                    {/* Right Weight & Value */}
                    <div className="text-right shrink-0">
                      <p className="text-[15px] font-bold text-slate-900 dark:text-white tabular-nums leading-none">
                        {asset.weight_kg} <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">kg</span>
                      </p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5">
                        KSh {estVal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
