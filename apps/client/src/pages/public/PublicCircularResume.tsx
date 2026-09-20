import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/core/lib/supabaseClient';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, CheckCircle2, TrendingUp, Award,
  Briefcase, Activity, BarChart3, ArrowLeft, Download, AlertCircle, CalendarDays, User
} from 'lucide-react';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { LoadingScreen } from '@klinflow/ui/components/Loading';

// ==========================================
// DYNAMIC DATES HELPER
// ==========================================
const getMonthsList = () => {
  const months = [];
  const d = new Date();
  d.setDate(1); // avoid end of month bugs
  for (let i = 5; i >= 0; i--) {
    const temp = new Date(d);
    temp.setMonth(temp.getMonth() - i);
    months.push(temp.toLocaleString('default', { month: 'short' }));
  }
  return months;
};

export default function PublicCircularResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      try {
        // Fetch Profile
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, created_at, location, estate, is_verified')
          .eq('id', id)
          .single();

        if (pError || !pData) {
          throw new Error('Profile not found');
        }
        setProfile(pData);

        // Fetch Bookings (Pickups where this user is the seller/client)
        const { data: bData } = await supabase
          .from('bookings')
          .select('id, waste_type, weight_kg, actual_weight_kg, total_price, status, booking_type, created_at, agent_id')
          .eq('user_id', id)
          .eq('status', 'completed');
          
        const fetchedBookings = bData || [];
        setBookings(fetchedBookings);

        // Fetch Marketplace Orders (Where this user is the seller)
        const { data: oData } = await supabase
          .from('marketplace_orders')
          .select('id, material, quantity, total_price, status, created_at')
          .eq('seller_id', id)
          .in('status', ['completed', 'accepted']);

        setOrders(oData || []);

        // Resolve Buyer Names (Agents who picked up from this user)
        const agentIds = [...new Set(fetchedBookings.map((b: any) => b.agent_id).filter(Boolean))] as string[];
        if (agentIds.length > 0) {
          const { data: aData } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', agentIds);
          
          if (aData) {
            const mapping: Record<string, string> = {};
            aData.forEach((p: any) => { mapping[p.id] = p.name || 'Agent'; });
            setAgentNames(mapping);
          }
        }

      } catch (err) {
        console.error('Failed to load public resume:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // Time on platform
  const timeOnPlatform = useMemo(() => {
    if (!profile?.created_at) return 'New';
    const start = new Date(profile.created_at);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months === 0) return '1 mo';
    return `${months} mos`;
  }, [profile]);

  // Professional Trust Score
  const trustScore = useMemo(() => {
    const total = bookings.length; // Assuming all fetched are completed, but just in case
    const activityScore = Math.min(300, total * 6);
    const reliabilityScore = total > 0 ? 250 : 100; // Simplified for public view assuming completed deals
    const totalKg = bookings.reduce((sum, b: any) => sum + (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0), 0);
    const volumeScore = Math.min(200, Math.round((totalKg / 5000) * 200));
    
    const monthsOnPlatform = profile?.created_at
      ? Math.max(1, (new Date().getFullYear() - new Date(profile.created_at).getFullYear()) * 12 + (new Date().getMonth() - new Date(profile.created_at).getMonth()))
      : 1;
    const tenureScore = Math.min(150, monthsOnPlatform * 6);
    const verificationScore = profile?.is_verified ? 100 : 0;

    return Math.min(1000, activityScore + reliabilityScore + volumeScore + tenureScore + verificationScore);
  }, [bookings, profile]);

  const stats = useMemo(() => {
    const completed = bookings;
    const totalKg = completed.reduce((sum, b: any) => sum + (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0), 0);
    
    // Impact calculations
    const carbonFactors: Record<string, number> = {
      'plastics': 1.5, 'pet': 1.5, 'hdpe': 1.7, 'metals': 1.5,
      'aluminium': 9.0, 'paper': 0.9, 'glass': 0.3, 'ewaste': 2.0,
      'default': 0.8
    };

    const totalCarbon = completed.reduce((sum: number, b: any) => {
      const type = (b.waste_type || '').toLowerCase();
      const factor = (carbonFactors[type] || carbonFactors.default || 0.8) as number;
      return sum + (((Number(b.actual_weight_kg) || Number(b.weight_kg) || 0) * factor) / 1000);
    }, 0);

    const breakdown = completed.reduce((acc: Record<string, number>, b: any) => {
      const type = b.waste_type || 'Mixed';
      acc[type] = (acc[type] || 0) + (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0);
      return acc;
    }, {});

    const marketplaceBookings = completed.filter((b: any) => b.booking_type === 'marketplace' || b.booking_type === 'marketplace_pickup' || !b.booking_type);
    const totalTransactionValue = marketplaceBookings.reduce((sum, b: any) => sum + (Number(b.total_price) || (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0) * 35), 0);
    
    const orderValue = orders.reduce((sum, o:any) => sum + (Number(o.total_price) || 0), 0);
    const lifetimeEarnings = totalTransactionValue + orderValue;

    // Financial Chart
    const monthLabels = getMonthsList();
    const monthValues = new Array(6).fill(0);
    
    const d = new Date();
    const currentMonth = d.getMonth();
    const currentYear = d.getFullYear();

    [...marketplaceBookings, ...orders].forEach((item: any) => {
      const dateStr = item.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      
      const monthDiff = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
      
      if (monthDiff >= 0 && monthDiff < 6) {
        const index = 5 - monthDiff;
        monthValues[index] += (Number(item.total_price) || 0);
      }
    });

    let highestMonth = Math.max(...monthValues);
    if (highestMonth === 0) highestMonth = 1; 
    
    const months = monthLabels.map((label, i) => ({
      label,
      value: monthValues[i]
    }));

    const timeInMonths = parseInt(timeOnPlatform) || 1;
    const avgMonthly = lifetimeEarnings / timeInMonths;

    return { 
      totalKg, breakdown, count: completed.length + orders.length, 
      totalCarbon, lifetimeEarnings, months, highestMonth, avgMonthly 
    };
  }, [bookings, orders, timeOnPlatform]);

  const TIERS = [
    { name: 'Registered Collector', minJobs: 0, minKg: 0, icon: '🌱' },
    { name: 'Established Partner', minJobs: 5, minKg: 200, icon: '🤝' },
    { name: 'Bronze Partner', minJobs: 20, minKg: 1000, icon: '🥉' },
    { name: 'Silver Partner', minJobs: 50, minKg: 5000, icon: '🥈' },
    { name: 'Gold Partner', minJobs: 100, minKg: 20000, icon: '🥇' },
  ];

  const progression = useMemo(() => {
    let currentTierIdx = 0;
    if (stats) {
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if (stats.count >= TIERS[i].minJobs && stats.totalKg >= TIERS[i].minKg) {
          currentTierIdx = i;
          break;
        }
      }
    }
    return TIERS[currentTierIdx];
  }, [stats]);

  const badges = useMemo(() => {
    if (!stats) return [];
    const b: any[] = [];
    const completedList = bookings;

    if (completedList.length >= 5) {
      b.push({ icon: ShieldCheck, color: 'emerald', title: 'Highly Reliable', desc: `Top-tier reliability across ${stats.count} jobs.` });
    } else if (completedList.length >= 3) {
      b.push({ icon: Briefcase, color: 'blue', title: 'Reliable Operator', desc: `Consistently delivers on commitments.` });
    }

    const breakdownEntries = Object.entries(stats.breakdown);
    breakdownEntries.sort((a, b) => (b[1] as number) - (a[1] as number));
    if (breakdownEntries.length > 0) {
      const [topMaterial, topKg] = breakdownEntries[0];
      if ((topKg as number) > 50) {
        const matName = topMaterial.charAt(0).toUpperCase() + topMaterial.slice(1);
        b.push({ icon: Activity, color: 'emerald', title: `${matName} Specialist`, desc: `Handled ${(topKg as number).toLocaleString()}kg of ${matName}. Verified expertise.` });
      }
    }

    if (stats.totalKg > 1000) {
      b.push({ icon: BarChart3, color: 'indigo', title: 'Volume Operator', desc: 'Demonstrated capability to fulfill and transport high-volume orders.' });
    }

    if (profile?.is_verified) {
      b.push({ icon: CheckCircle2, color: 'emerald', title: 'Klinflow Verified', desc: 'Identity and business credentials manually verified by Klinflow.' });
    }

    if (b.length === 0) {
      b.push({ icon: ShieldCheck, color: 'blue', title: 'New Operator', desc: 'Complete 3+ jobs to begin earning professional badges and verifications.' });
    }
    return b;
  }, [stats, bookings, profile]);


  if (loading) return <LoadingScreen message="Verifying Identity..." />;
  
  if (!profile || !stats) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-800 p-4 font-sans">
      <div className="text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Not Found</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">This Circular Resume link is invalid or the profile has been set to private.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Go to Klinflow</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-800 font-sans transition-colors relative pb-20">
      
      {/* ── FIXED TOP NAV ── */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-600 transition-all hide-on-print">
        <div className="max-w-2xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <div>
                <h1 className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight uppercase">Public Circular Resume</h1>
                <p className="text-[9px] font-bold text-emerald-600 tracking-widest uppercase">Verified Record</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTimeout(() => window.print(), 300)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-colors">
                <Download className="w-3.5 h-3.5" /> Save PDF
              </button>
              <button onClick={() => navigate('/')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors shadow-sm">
                Join Klinflow
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto pt-[calc(env(safe-area-inset-top,1rem)+5.5rem)] px-4 space-y-6">

        {/* ── PROFESSIONAL IDENTITY CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 printable-card">
          <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between">
            
            <div className="flex gap-5 items-start">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <OptimizedImage src={getThumbnailUrl(profile.avatar_url, { width: 200 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>
              
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{profile?.name}</h2>
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                    {progression.icon} {progression.name}
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  {profile?.is_verified ? (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Klinflow Verified
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                      <ShieldCheck className="w-3.5 h-3.5" /> Unverified
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wide">
                      {profile?.location?.county || profile?.estate || 'Nairobi, Kenya'}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-wide">
                      Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
              <div className="flex flex-col md:items-end justify-center flex-1">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1 md:text-right">Klinflow Trust Score</p>
                <div className="flex items-baseline gap-1 md:justify-end">
                  <span className="text-2xl font-black text-emerald-600 dark:text-white leading-none">{trustScore}</span>
                  <span className="text-[12px] font-bold text-slate-400">/ 1000</span>
                </div>
              </div>
              
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 drop-shadow-sm transition-all duration-1000 ease-out"
                    strokeDasharray={`${Math.min(100, Math.max(0, (trustScore / 1000) * 100))}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-black text-slate-700 dark:text-white">{Math.round((trustScore / 1000) * 100)}%</span>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* ── OVERVIEW SECTION ── */}
        <div className="space-y-6">
          <section>
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Verified Overview</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm printable-card">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                
                <div className="flex flex-col gap-1.5 md:px-4 md:first:pl-0">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Lifetime Volume</p>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats.totalKg.toLocaleString()} <span className="text-sm">kg</span></p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Materials recovered</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5 md:px-4">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Transaction Val.</p>
                  <div>
                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">KSh {(stats.lifetimeEarnings/1000).toFixed(0)}K</p>
                    <p className="text-[10px] font-medium text-slate-400 mt-1">Verified payouts</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:px-4">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Completed Jobs</p>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{stats.count.toLocaleString()}</p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Track record
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:px-4 md:last:pr-0">
                  <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Time on Platform</p>
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{timeOnPlatform}</p>
                    <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Activity
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ── SKILLS & VERIFICATIONS ── */}
          <section>
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Skills & Verifications</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden printable-card divide-y divide-slate-100 dark:divide-slate-800">
              {badges.map((badge: any, i: number) => (
                <div key={i} className="relative p-4 flex flex-col gap-2 overflow-hidden group">
                  
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-10 pointer-events-none hide-on-print transition-opacity group-hover:opacity-30 ${
                    badge.color === 'emerald' ? 'bg-emerald-400' :
                    badge.color === 'blue' ? 'bg-blue-400' :
                    'bg-indigo-400'
                  }`} />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                        badge.color === 'emerald' ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-500/20 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/30' :
                        badge.color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-500/20 dark:to-blue-500/5 border-blue-200 dark:border-blue-500/30' :
                        'bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-500/20 dark:to-indigo-500/5 border-indigo-200 dark:border-indigo-500/30'
                      }`}>
                        <badge.icon className="w-5 h-5 text-black dark:text-black" />
                      </div>
                      <h4 className="text-[14px] font-black text-slate-900 dark:text-white tracking-tight">{badge.title}</h4>
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shrink-0 ${
                      badge.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                      badge.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' :
                      'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400'
                    }`}>Verified</span>
                  </div>
                  
                  <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed relative z-10">
                    {badge.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── IMPACT & HISTORY ── */}
          <section>
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Impact & History</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden printable-card">
              
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Carbon Saved</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{(stats.totalCarbon * 1000).toFixed(0)} kg</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Diverted Waste</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{stats.totalKg.toLocaleString()} kg</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white mb-3">Material Breakdown</h4>
                  <div className="space-y-3">
                    {Object.entries(stats.breakdown).map(([type, weight]: any) => (
                      <div key={type} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-600 dark:text-slate-300 capitalize">{type}</span>
                          <span className="text-slate-900 dark:text-white">{weight} kg</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${(weight / stats.totalKg) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    {Object.keys(stats.breakdown).length === 0 && (
                      <p className="text-xs text-slate-500 italic">No verified materials recorded yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Latest Work History</h4>
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md">Ledger</span>
              </div>

              {(() => {
                const completed = bookings.sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
                const shown = completed.slice(0, 5);
                const remaining = completed.length - shown.length;

                return completed.length === 0 ? (
                  <div className="p-8 text-center text-sm font-medium text-slate-500">No verified jobs found on network.</div>
                ) : (
                  <>
                    <div className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_0.6fr] gap-1 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Material</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Buyer</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Qty</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {shown.map((b: any, i: number) => {
                        const dateStr = (() => { const d = new Date(b.created_at); return isNaN(d.getTime()) ? 'N/A' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; })();
                        const buyerName = b.agent_id ? (agentNames[b.agent_id] || '...') : 'Direct';
                        
                        return (
                          <div key={i} className="grid grid-cols-[1fr_1fr_0.7fr_0.8fr_0.6fr] gap-1 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <span className="text-[12px] font-bold text-slate-900 dark:text-white capitalize truncate">{b.waste_type || 'Mixed'}</span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize truncate">{buyerName}</span>
                            <span className="text-[12px] font-black text-slate-900 dark:text-white">{Number(b.actual_weight_kg) || Number(b.weight_kg) || 0} kg</span>
                            <span className="text-[11px] font-medium text-slate-400">{dateStr}</span>
                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md text-center uppercase tracking-wider">Verified</span>
                          </div>
                        );
                      })}
                    </div>
                    {remaining > 0 && (
                      <div className="px-5 py-3 text-center border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] font-bold text-slate-400">
                          + {remaining} more verified job{remaining !== 1 ? 's' : ''} on record ({completed.length} total)
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </section>

          {/* ── FINANCIAL ACTIVITY ── */}
          <section>
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-1">Financial Activity</h3>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6 printable-card">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Lifetime Verified</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">KSh {(stats.lifetimeEarnings / 1000000).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Avg. Monthly</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">KSh {(stats.avgMonthly / 1000).toFixed(1)}K</p>
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white mb-4">Income Consistency (Last 6 Months)</h4>
                <div className="flex items-end justify-between h-32 gap-2 pt-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                  {stats.months.map((m: any, i: number) => {
                    const height = `${(m.value / stats.highestMonth) * 100}%`;
                    const isCurrent = i === stats.months.length - 1;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full relative h-full flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`w-full rounded-t-md transition-colors ${isCurrent ? 'bg-slate-900 dark:bg-white' : 'bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'}`} 
                          />
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isCurrent ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Official Stamp */}
          <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between pb-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Generated On</p>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">KLINFLOW</span>
            </div>
          </div>
          
        </div>
      </div>
      
      <style>{`
        @media print {
          body { background: white !important; }
          .hide-on-print { display: none !important; }
          .printable-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; margin-bottom: 2rem !important; padding: 1.5rem !important; break-inside: avoid; }
          .bg-slate-900 { background: white !important; color: black !important; }
          .text-white { color: black !important; }
          .dark\\:bg-slate-900 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
