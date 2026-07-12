import React, { useState, useEffect, useCallback } from 'react';
import { 
  Truck, 
  Clock, 
  PackageCheck,
  Loader2,
  ShieldCheck,
  Plus,
  X,
  ChevronDown,
  History,
  Settings2,
  Package
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { normalizeKeys, Profile } from '@klinflow/core/validation';
import { toast } from 'sonner';

interface Bay {
  id: number;
  label: string;
  status: 'Available' | 'Occupied' | 'Cleaning';
  assignedAgent?: string;
  assignedPlate?: string;
}

interface ArrivalRecord {
  id: string;
  agentName: string;
  agentAvatar?: string;
  materialSummary: string;
  totalWeight: number;
  totalItems: number;
  arrivedAt: string;
  bayAssigned?: string;
}

interface MaterialBreakdown {
  type: string;
  weight: number;
  color: string;
}

// Color palette for material breakdown dots
const MATERIAL_COLORS = [
  'bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-violet-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500'
];

export default function IntakeReceiving() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const { profile } = useAuthStore();
  
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bay management state — loaded from hub_config
  const [bays, setBays] = useState<Bay[]>([]);
  const [bayEditMode, setBayEditMode] = useState(false);
  const [newBayLabel, setNewBayLabel] = useState('');

  // Arrival history state — queried from assets
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [isLoadingArrivals, setIsLoadingArrivals] = useState(true);

  // Today's intake stats
  const [intakeStats, setIntakeStats] = useState<{ total: number; breakdown: MaterialBreakdown[]; totalPaid: number }>({
    total: 0,
    breakdown: [],
    totalPaid: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Which arrival item has the bay dropdown open
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const availableBays = bays.filter(b => b.status === 'Available');

  // ─── Load bays from hub_config on mount ───
  useEffect(() => {
    if (!profile) return;
    const hubConfig = (profile as any).hubConfig || (profile as any).hub_config || {};
    const savedBays: Bay[] = hubConfig.receiving_bays || hubConfig.receivingBays || [];
    if (savedBays.length > 0) {
      setBays(savedBays);
    } else {
      // Initialize with defaults if no bays configured
      setBays([
        { id: 1, label: 'Bay 01', status: 'Available' },
        { id: 2, label: 'Bay 02', status: 'Available' },
        { id: 3, label: 'Bay 03', status: 'Available' },
      ]);
    }
  }, [profile]);

  // ─── Persist bays to hub_config ───
  const persistBays = useCallback(async (updatedBays: Bay[]) => {
    if (!profile?.id) return;
    try {
      const hubConfig = (profile as any).hubConfig || (profile as any).hub_config || {};
      const updatedConfig = { ...hubConfig, receiving_bays: updatedBays };
      await (supabase.from('profiles') as any)
        .update({ hub_config: updatedConfig })
        .eq('id', profile.id);
    } catch (err) {
      console.error('[IntakeReceiving] Bay persist error:', err);
    }
  }, [profile]);

  // ─── Fetch arrival history (agents who transferred today) ───
  const fetchArrivals = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingArrivals(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Get assets transferred to this hub today, grouped by verifier
      const { data, error: fetchError } = await ((supabase
        .from('assets') as any)
        .select('id, material_type, weight_kg, updated_at, verifier_id, profiles:verifier_id(name, avatar_url)')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub')
        .gte('updated_at', todayStart.toISOString())
        .order('updated_at', { ascending: false }));

      if (fetchError) throw fetchError;

      // Group by verifier_id (agent)
      const agentMap = new Map<string, ArrivalRecord>();
      for (const raw of (data || [])) {
        const item = normalizeKeys(raw) as any;
        const agentId = item.verifierId;
        if (!agentId) continue;

        if (!agentMap.has(agentId)) {
          agentMap.set(agentId, {
            id: agentId,
            agentName: item.profiles?.name || 'Unknown Agent',
            agentAvatar: item.profiles?.avatar_url,
            materialSummary: item.materialType || 'Mixed',
            totalWeight: 0,
            totalItems: 0,
            arrivedAt: item.updatedAt,
            bayAssigned: undefined
          });
        }

        const entry = agentMap.get(agentId)!;
        entry.totalWeight += Number(item.weightKg) || 0;
        entry.totalItems += 1;

        // Collect distinct material types
        const types = new Set(entry.materialSummary.split(', '));
        types.add(item.materialType || 'Mixed');
        entry.materialSummary = Array.from(types).slice(0, 3).join(', ');
      }

      setArrivals(Array.from(agentMap.values()));
    } catch (err) {
      console.error('[IntakeReceiving] Arrivals fetch error:', err);
    } finally {
      setIsLoadingArrivals(false);
    }
  }, [profile]);

  // ─── Fetch today's intake stats ───
  const fetchIntakeStats = useCallback(async () => {
    if (!profile?.id) return;
    setIsLoadingStats(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data, error: fetchError } = await ((supabase
        .from('assets') as any)
        .select('material_type, weight_kg, estimated_value')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub')
        .gte('updated_at', todayStart.toISOString()));

      if (fetchError) throw fetchError;

      const materialMap = new Map<string, number>();
      let totalWeight = 0;
      let totalPaid = 0;

      for (const raw of (data || [])) {
        const item = normalizeKeys(raw) as any;
        const type = item.materialType || 'Other';
        const weight = Number(item.weightKg) || 0;
        totalWeight += weight;
        totalPaid += Number(item.estimatedValue) || 0;
        materialMap.set(type, (materialMap.get(type) || 0) + weight);
      }

      const breakdown: MaterialBreakdown[] = Array.from(materialMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([type, weight], idx) => ({
          type,
          weight,
          color: MATERIAL_COLORS[idx % MATERIAL_COLORS.length]
        }));

      setIntakeStats({ total: totalWeight, breakdown, totalPaid });
    } catch (err) {
      console.error('[IntakeReceiving] Stats fetch error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchArrivals();
    fetchIntakeStats();

    // Subscribe for real-time updates
    if (!profile?.id) return;
    const channel = supabase.channel('hub-intake-live')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `hub_manager_id=eq.${profile.id}`
      }, () => {
        fetchArrivals();
        fetchIntakeStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchArrivals, fetchIntakeStats, profile]);

  // ─── Bay handlers ───
  const handleAssignBay = (agentId: string, bayId: number) => {
    const agent = arrivals.find(a => a.id === agentId);
    if (!agent) return;

    const updated = bays.map(b =>
      b.id === bayId
        ? { ...b, status: 'Occupied' as const, assignedAgent: agent.agentName, assignedPlate: `${agent.totalItems} items` }
        : b
    );
    setBays(updated);
    persistBays(updated);

    // Update the arrival record with bay assignment
    setArrivals(prev => prev.map(a =>
      a.id === agentId ? { ...a, bayAssigned: bays.find(b => b.id === bayId)?.label || `Bay ${bayId}` } : a
    ));
    setOpenDropdownId(null);
    toast.success('Bay Assigned', { description: `${agent.agentName} assigned to ${bays.find(b => b.id === bayId)?.label}` });
  };

  const handleReleaseBay = (bayId: number) => {
    const updated = bays.map(b =>
      b.id === bayId ? { ...b, status: 'Available' as const, assignedAgent: undefined, assignedPlate: undefined } : b
    );
    setBays(updated);
    persistBays(updated);
  };

  const handleSetCleaning = (bayId: number) => {
    const updated = bays.map(b =>
      b.id === bayId ? { ...b, status: 'Cleaning' as const, assignedAgent: undefined, assignedPlate: undefined } : b
    );
    setBays(updated);
    persistBays(updated);
  };

  const handleFinishCleaning = (bayId: number) => {
    const updated = bays.map(b =>
      b.id === bayId ? { ...b, status: 'Available' as const } : b
    );
    setBays(updated);
    persistBays(updated);
  };

  const handleAddBay = () => {
    const label = newBayLabel.trim() || `Bay ${String(bays.length + 1).padStart(2, '0')}`;
    const nextId = bays.length > 0 ? Math.max(...bays.map(b => b.id)) + 1 : 1;
    const updated = [...bays, { id: nextId, label, status: 'Available' as const }];
    setBays(updated);
    persistBays(updated);
    setNewBayLabel('');
    toast.success('Bay Added', { description: `"${label}" is now available.` });
  };

  const handleRemoveBay = (bayId: number) => {
    const bay = bays.find(b => b.id === bayId);
    if (bay?.status === 'Occupied') return;
    const updated = bays.filter(b => b.id !== bayId);
    setBays(updated);
    persistBays(updated);
  };

  // ─── PIN logic ───
  const handleKeypadPress = (num: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setError(null);
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 6) return;
    setIsVerifying(true);
    setError(null);

    try {
      const { data: agents, error: fetchError } = await ((supabase
        .from('profiles') as any)
        .select(`
          *, 
          assets:assets!verifier_id(
            id, 
            weight_kg, 
            material_type,
            grade, 
            is_manual,
            status,
            estimated_value,
            digital_batch_id,
            created_at,
            booking:bookings(
              waste_type,
              is_market_trade,
              is_group_pickup,
              booking_type,
              client:profiles!user_id(
                name,
                role
              )
            )
          )
        `)
        .eq('is_en_route', true)
        .eq('hub_transfer_pin', pinInput));
      
      if (fetchError) throw fetchError;

      if (agents && agents.length > 0) {
        const agentRaw = agents[0];
        const agent = normalizeKeys(agentRaw) as Profile & { assets: any[] };
        
        const enRouteAssets = (agent.assets || []).map(a => normalizeKeys(a) as any).filter((a: any) => 
          ['verified', 'collected', 'in_transit'].includes(a.status)
        );
        
        const totalWeight = enRouteAssets.reduce((acc, a) => acc + (Number(a.weightKg) || 0), 0);
        const totalAmount = enRouteAssets.reduce((acc, a) => acc + (Number(a.estimatedValue) || 0), 0);
        
        const agentPayload = {
          agentName: agent.name || 'Anonymous Agent',
          agentId: agent.id,
          totalClaimedWeight: totalWeight,
          totalAmountPaidToday: totalAmount,
          materials: enRouteAssets.map((asset: any, idx: number) => {
            const booking = asset.booking || {};
            const client = booking.client || {};
            const clientRole = client.role || '';
            const isMarketTrade = booking.isMarketTrade;
            const isGroupPickup = booking.isGroupPickup;
            const bookingType = booking.bookingType;
            
            const tags: string[] = [];
            if (clientRole === 'seller' || clientRole === 'business') tags.push('Seller Pickup');
            else if (clientRole === 'resident') tags.push('Resident Pickup');
            
            if (isGroupPickup) tags.push('Community Pickup');
            if (isMarketTrade || bookingType === 'rfq') tags.push(isGroupPickup ? 'Group RFQ' : 'Individual RFQ');
            
            if (tags.length === 0) tags.push('Hub Dropoff');

            return {
              id: asset.id || `m${idx}`,
              materialId: asset.digitalBatchId || asset.id?.slice(0,8) || `ID-${idx}`,
              category: asset.grade || 'N/A',
              subcategory: asset.materialType || 'Other',
              weight: Number(asset.weightKg) || 0,
              amountPaid: Number(asset.estimatedValue) || 0,
              sellerName: client.name || 'Unknown Seller',
              collectedAt: asset.createdAt || new Date().toISOString(),
              sourcingTags: tags,
              isManual: !!asset.isManual
            };
          })
        };

        navigate('/operations/intake/verify', { state: { agentData: agentPayload } });
      } else {
        setError("Invalid PIN. No incoming agent found.");
        setPinInput('');
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification Error", { description: "Failed to securely verify the PIN." });
    } finally {
      setIsVerifying(false);
    }
  };

  const getBayStyle = (status: Bay['status']) => {
    if (status === 'Occupied') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    if (status === 'Cleaning') return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
    return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500';
  };

  const formatWeight = (kg: number) => {
    if (kg >= 1000) return `${(kg / 1000).toFixed(1)}T`;
    return `${kg.toFixed(1)} KG`;
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Manual Intake & Receiving</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PIN-based agent check-in and manual floor scale reconciliation.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* ── LEFT COLUMN: PIN Keypad ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="font-medium w-8 h-8 text-emerald-500" />
              </div>
              <h2 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Gate Verification</h2>
              <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enter the Agent's 6-digit PIN to load their cargo manifest.</p>
            </div>

            {/* PIN Display */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className={`w-12 h-14 rounded-2xl flex items-center justify-center text-2xl font-medium transition-all ${
                  pinInput.length > index 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110' 
                    : (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300')
                }`}>
                  {pinInput[index] || '·'}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  onClick={() => handleKeypadPress(num.toString())}
                  className={`h-14 rounded-2xl border text-xl font-medium active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={handleDelete}
                className={`h-14 rounded-2xl border text-sm font-medium uppercase tracking-wider active:scale-95 transition-all ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
              >
                DEL
              </button>
              <button 
                onClick={() => handleKeypadPress('0')}
                className={`h-14 rounded-2xl border text-xl font-medium active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                0
              </button>
              <button 
                onClick={handlePinSubmit}
                disabled={isVerifying || pinInput.length !== 6}
                className="h-14 rounded-2xl bg-emerald-500 text-white font-medium active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : 'GO'}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Bays, Arrivals & Summary ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Receiving Bays */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Receiving Bays</h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setBayEditMode(!bayEditMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    bayEditMode 
                      ? (isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')
                      : (isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" /> {bayEditMode ? 'Done' : 'Manage'}
                </button>
              </div>
            </div>

            {/* Add bay form (only in edit mode) */}
            {bayEditMode && (
              <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                <input
                  type="text"
                  value={newBayLabel}
                  onChange={(e) => setNewBayLabel(e.target.value)}
                  placeholder="Bay name (e.g. Bay A1, Loading Dock)"
                  className={`flex-1 text-sm px-3 py-2 rounded-lg border outline-none transition-colors ${isDarkMode ? 'bg-slate-800 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} focus:border-emerald-500`}
                />
                <button 
                  onClick={handleAddBay}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {bays.map((bay) => (
                <div key={bay.id} className={`p-4 rounded-2xl border ${getBayStyle(bay.status)} flex flex-col items-center justify-center text-center relative group min-h-[120px]`}>
                  
                  {/* Remove button (only in edit mode, non-occupied) */}
                  {bayEditMode && bay.status !== 'Occupied' && (
                    <button 
                      onClick={() => handleRemoveBay(bay.id)}
                      className="font-medium absolute top-2 right-2 p-1 rounded-full transition-opacity text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span className="font-medium text-sm mb-1">{bay.label}</span>
                  <span className="text-[10px] uppercase tracking-wider font-medium opacity-80 mb-2">{bay.status}</span>
                  
                  {bay.status === 'Occupied' && bay.assignedAgent && (
                    <>
                      <div className="flex items-center gap-1 text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded mb-2">
                        <Truck className="w-3 h-3" /> {bay.assignedPlate}
                      </div>
                      <p className="text-[10px] font-medium opacity-70 mb-2">{bay.assignedAgent}</p>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleReleaseBay(bay.id)}
                          className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          Release
                        </button>
                        <button 
                          onClick={() => handleSetCleaning(bay.id)}
                          className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
                        >
                          Clean
                        </button>
                      </div>
                    </>
                  )}

                  {bay.status === 'Cleaning' && (
                    <button 
                      onClick={() => handleFinishCleaning(bay.id)}
                      className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Arrival History */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Today's Arrivals</h3>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                {arrivals.length} Agent{arrivals.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoadingArrivals ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : arrivals.length === 0 ? (
              <div className={`p-8 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                <Truck className={`w-8 h-8 mx-auto mb-2 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No arrivals yet today. Agents will appear here after check-in.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {arrivals.map((item) => (
                  <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        {item.agentAvatar ? (
                          <img src={item.agentAvatar} alt={item.agentName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-emerald-500 font-medium text-sm">{item.agentName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.agentName}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.totalItems} item{item.totalItems !== 1 ? 's' : ''} • {formatWeight(item.totalWeight)} • {item.materialSummary}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                        <Clock className="w-3 h-3" /> {formatTime(item.arrivedAt)}
                      </div>
                      
                      {item.bayAssigned ? (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {item.bayAssigned}
                        </span>
                      ) : availableBays.length > 0 ? (
                        <div className="relative">
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            Assign Bay <ChevronDown className={`w-3 h-3 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {openDropdownId === item.id && (
                            <div className={`absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                              {availableBays.map(bay => (
                                <button
                                  key={bay.id}
                                  onClick={() => handleAssignBay(item.id, bay.id)}
                                  className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-emerald-50 text-slate-900'}`}
                                >
                                  <span>{bay.label}</span>
                                  <span className="font-medium text-[9px] text-emerald-500 uppercase tracking-wider">Open</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-amber-500 uppercase">No bays free</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Intake Summary — Dynamic */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            {isLoadingStats ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto items-start">
                <div className="shrink-0">
                  <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Today's Intake</p>
                  <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatWeight(intakeStats.total)}</p>
                  <p className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>KES {intakeStats.totalPaid.toLocaleString()} paid</p>
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
                        <p className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatWeight(m.weight)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
