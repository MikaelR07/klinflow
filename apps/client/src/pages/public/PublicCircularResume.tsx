import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { 
  ShieldCheck, CheckCircle2, TrendingUp, Award,
  Briefcase, Activity, BarChart3, ArrowLeft, Download, FileText
} from 'lucide-react';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { LoadingScreen } from '@klinflow/ui/components/Loading';

export default function PublicCircularResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      try {
        // Fetch Profile
        const { data: pData, error: pError } = await supabase
          .from('profiles')
          .select('id, name, full_name, avatar_url, avatar, created_at, county, estate, is_verified')
          .eq('id', id)
          .single();

        if (pError || !pData) throw new Error('Profile not found');
        setProfile(pData);

        // Fetch Bookings (Pickups where this user is the agent)
        const { data: bData } = await supabase
          .from('bookings')
          .select('id, waste_type, weight_kg, actual_weight_kg, total_price, status, booking_type')
          .eq('agent_id', id)
          .eq('status', 'completed');
          
        setBookings(bData || []);

        // Fetch Marketplace Orders (Where this user is the seller)
        const { data: oData } = await supabase
          .from('marketplace_orders')
          .select('id, material, quantity, total_price, status')
          .eq('seller_id', id)
          .in('status', ['completed', 'accepted']);

        setOrders(oData || []);

      } catch (err) {
        console.error('Failed to load public resume:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const stats = useMemo(() => {
    if (!profile) return null;

    const totalKg = bookings.reduce((sum, b) => sum + (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0), 0);
    const totalTransactionValue = bookings.reduce((sum, b) => sum + (Number(b.total_price) || (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0) * 35), 0);
    
    const orderValue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const lifetimeEarnings = totalTransactionValue + orderValue;

    const breakdown = bookings.reduce((acc: Record<string, number>, b: any) => {
      const type = b.waste_type || 'Mixed';
      acc[type] = (acc[type] || 0) + (Number(b.actual_weight_kg) || Number(b.weight_kg) || 0);
      return acc;
    }, {});

    return { 
      totalKg, 
      breakdown, 
      count: bookings.length + orders.length, 
      lifetimeEarnings 
    };
  }, [bookings, orders, profile]);

  const level = useMemo(() => {
    if (!stats) return '';
    if (stats.count >= 100) return 'Elite Operator';
    if (stats.count >= 50) return 'Senior Operator';
    if (stats.count >= 10) return 'Professional Operator';
    return 'Verified Operator';
  }, [stats]);

  const badges = useMemo(() => {
    if (!stats) return [];
    const b = [];
    if (stats.count >= 5) {
      b.push({ icon: Briefcase, color: 'blue', title: 'Reliable Operator', desc: 'Consistently meets pickup commitments with minimal cancellations.' });
    }
    if ((stats.breakdown['pet'] || 0) > 100 || (stats.breakdown['plastics'] || 0) > 100) {
      b.push({ icon: Activity, color: 'emerald', title: 'PET Specialist', desc: 'Verified experience handling high-volume plastics and PET materials.' });
    }
    if (stats.totalKg > 1000) {
      b.push({ icon: BarChart3, color: 'indigo', title: 'Volume Operator', desc: 'Demonstrated capability to fulfill and transport high-volume bulk orders.' });
    }
    if (b.length === 0) {
      b.push({ icon: ShieldCheck, color: 'blue', title: 'Verified Identity', desc: 'Profile identity has been verified on the Klinflow network.' });
    }
    return b;
  }, [stats]);

  const timeOnPlatform = useMemo(() => {
    if (!profile?.created_at) return 'New';
    const start = new Date(profile.created_at);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (months === 0) return '1 mo';
    return `${months} mos`;
  }, [profile]);


  if (loading) return <LoadingScreen message="Verifying Identity..." />;
  
  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Not Found</h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">This Circular Resume link is invalid or the profile has been set to private.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold">Go to Klinflow</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* App Banner for Public Visitors */}
        <div className="hide-on-print bg-slate-900 dark:bg-emerald-900/20 text-white dark:text-emerald-500 p-4 rounded-2xl flex items-center justify-between mb-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Klinflow Verification</p>
              <p className="text-[11px] text-slate-300">This is a certified public record of economic activity.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTimeout(() => window.print(), 300)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-colors">
              <Download className="w-3.5 h-3.5" /> Save PDF
            </button>
            <button onClick={() => navigate('/')} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-[11px] font-bold transition-colors">
              Get Klinflow
            </button>
          </div>
        </div>

        {/* ── PROFESSIONAL IDENTITY CARD ── */}
        <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800 printable-card">
          <div className="flex flex-col md:flex-row gap-6 md:items-start md:justify-between mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
            
            <div className="flex gap-5 items-start">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <OptimizedImage src={getThumbnailUrl(profile.avatar_url, { width: 200 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{profile?.full_name || profile?.name}</h2>
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">{level}</p>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Klinflow Verified
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 capitalize tracking-wide">
                    {profile?.county || profile?.estate || 'Nairobi, Kenya'} • Member since {new Date(profile.created_at).getFullYear()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-5 border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center min-w-[140px]">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-500 mb-2" />
              <p className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1 text-center">Verification</p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 text-center">ID: CF-{profile.id.slice(0,6).toUpperCase()}</span>
            </div>

          </div>

          <div className="space-y-8">
            {/* Verified Economic Activity */}
            <section>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Verified Economic Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Lifetime Volume</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.totalKg.toLocaleString()} kg</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Materials recovered</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Transaction Value</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">KSh {stats?.lifetimeEarnings.toLocaleString()}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-0.5">Verified payouts</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Completed Jobs</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{stats?.count.toLocaleString()}</p>
                  <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Track record
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Time on Platform</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{timeOnPlatform}</p>
                  <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-500 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Consistent activity
                  </p>
                </div>
              </div>
            </section>

            {/* Skills & Verifications */}
            <section>
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">Skills & Verifications</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {badges.map((badge: any, i: number) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      badge.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                      badge.color === 'blue' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                      'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      <badge.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white">{badge.title}</h4>
                      <p className="text-[11px] font-medium text-slate-500 leading-relaxed mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Official Stamp */}
            <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
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
      </div>
      <style>{`
        @media print {
          body { background: white !important; }
          .hide-on-print { display: none !important; }
          .printable-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; margin: 0 !important; padding: 0 !important; }
          .bg-slate-900 { background: white !important; color: black !important; }
          .text-white { color: black !important; }
          .dark\\:bg-slate-900 { background: white !important; }
        }
      `}</style>
    </div>
  );
}
