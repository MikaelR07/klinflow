/**
 * CompanyProfile — Dedicated company/agent profile page in aggregator mode
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Star, MapPin, Truck, ShieldCheck, Package,
  Zap, ChevronRight, CheckCircle2, Clock, Users
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { MATERIAL_LABELS } from '@klinflow/core/data/wasteDefinitions';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!agentId) { navigate('/'); return; }
    setLoading(true);
    supabase
      .from('profiles')
      .select('*, agent_configurations(*)')
      .eq('id', agentId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Company not found'); navigate('/'); return; }
        setCompany(data);
        setLoading(false);
      });
  }, [agentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-800">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const config = (Array.isArray(company?.agent_configurations) ? company.agent_configurations[0] : company?.agent_configurations) || {};
  const materials = config.accepted_materials?.length > 0
    ? config.accepted_materials
    : (company?.service_profile?.categories?.filter((c: any) => c.enabled).map((c: any) => c.name) || []);
  const logisticsFee = config.base_logistics_fee ?? company?.service_profile?.base_logistics_fee ?? 0;
  const isFleetAdmin = company?.role === 'admin';

  return (
    <div className="min-h-screen bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── FIXED HEADER ── */}
      <div className="fixed top-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white dark:bg-slate-800 pt-[calc(env(safe-area-inset-top,1rem)+0.5rem)] pb-4 px-4 border-b border-slate-200 dark:border-slate-800 ">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl active:scale-90 transition-all">
            <ArrowLeft className="w-4 h-4 dark:text-white" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none mb-1">Company Profile</h1>
            <p className="text-[10px] font-bold text-primary capitalize tracking-[0.25em]">Partner Details</p>
          </div>
        </div>
      </div>

      <div className="w-full pt-[calc(env(safe-area-inset-top,1rem)+3.75rem)] pb-26 px-1.5 space-y-4">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[80px] -mr-16 -mt-16" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-3xl shadow-sm shrink-0 relative overflow-hidden">
                {company?.avatarUrl || company?.avatar_url ? (
                  <OptimizedImage src={getThumbnailUrl(company.avatarUrl || company.avatar_url, { width: 150 })} className="w-full h-full object-cover" wrapperClassName="w-full h-full" />
                ) : (
                  isFleetAdmin ? '🏢' : '🚛'
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">{company?.company_name || company?.name || 'Klinflow Partner'}</h2>
                <p className="text-xs font-bold capitalize tracking-[0.2em] text-emerald-250 mt-1">
                  {isFleetAdmin ? 'Verified Fleet Company' : 'Independent Agent'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-bold">
                    {company?.rating > 0 ? company.rating.toFixed(1) : 'New'}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-white/60 capitalize tracking-widest">Rating</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">{Number(company?.total_pickups || 0)}</p>
                <p className="text-[10px] font-bold text-white/60 capitalize tracking-widest">Pickups</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold">KSh {logisticsFee}</p>
                <p className="text-[10px] font-bold text-white/60 capitalize tracking-widest">Base Fee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Service Area</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{company?.location?.estate || 'Nairobi Metro'}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 capitalize tracking-widest">Online</span>
          </div>
        </div>

        {/* Accepted Materials */}
        {materials.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-4">Accepted Materials</p>
            <div className="flex flex-wrap gap-2">
              {materials
                .filter((m: any) => !!(MATERIAL_LABELS as any)[m])
                .map((m: string) => (
                  <span key={m} className="px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-full text-xs font-semibold text-primary capitalize tracking-widest">
                    {(MATERIAL_LABELS as any)[m]}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest mb-4">Their Pricing</p>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Base Logistics Fee</span>
            <span className="text-lg font-semibold text-primary">KSh {logisticsFee}</span>
          </div>
          <p className="text-xs font-semibold text-slate-400 mt-2">Final price depends on material type and weight, confirmed after pickup.</p>
        </div>
      </div>

      {/* Book CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-50 max-w-lg mx-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate(`/book-pickup?agentId=${agentId}&companyName=${encodeURIComponent(company?.company_name || company?.name || '')}`)}
          className="w-full p-5 bg-primary text-white rounded-2xl font-semibold text-sm shadow-2xl shadow-primary/40 flex items-center justify-center gap-3"
        >
          <Truck className="w-5 h-5" />
          Book {isFleetAdmin ? (company?.company_name || company?.name) : 'This Agent'}
        </motion.button>
      </div>
    </div>
  );
}
