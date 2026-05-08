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
import { supabase, MATERIAL_LABELS } from '@cleanflow/core';
import { toast } from 'sonner';

export default function CompanyProfile() {
  const navigate = useNavigate();
  const { agentId } = useParams();

  const [company, setCompany] = useState(null);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const config = (Array.isArray(company?.agent_configurations) ? company.agent_configurations[0] : company?.agent_configurations) || {};
  const materials = config.accepted_materials?.length > 0 
    ? config.accepted_materials 
    : (company?.service_profile?.categories?.filter(c => c.enabled).map(c => c.name) || []);
  const logisticsFee = config.base_logistics_fee ?? company?.service_profile?.base_logistics_fee ?? 0;
  const isFleetAdmin = company?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-32">
      {/* Header */}
      <div className="p-4 pt-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white dark:bg-slate-800 shadow-sm rounded-xl border border-slate-100 dark:border-slate-700">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <h1 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Company Profile</h1>
      </div>

      {/* Hero */}
      <div className="mx-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-3xl">
              {isFleetAdmin ? '🏢' : '🚛'}
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{company?.company_name || company?.name || 'CleanFlow Partner'}</h2>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mt-1">
                {isFleetAdmin ? 'Verified Fleet Company' : 'Independent Agent'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="text-lg font-semibold">
                  {company?.rating > 0 ? company.rating.toFixed(1) : 'New'}
                </span>
              </div>
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{Number(company?.total_pickups || 0)}</p>
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">Pickups</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">KSh {logisticsFee}</p>
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-widest">Base Fee</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-4 mt-4 space-y-4">
        {/* Location */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Service Area</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{company?.location?.estate || 'Nairobi Metro'}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-semibold text-emerald-600 uppercase tracking-widest">Online</span>
          </div>
        </div>

        {/* Accepted Materials */}
        {materials.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Accepted Materials</p>
            <div className="flex flex-wrap gap-2">
              {materials
                .filter(m => !!MATERIAL_LABELS[m])
                .map((m) => (
                  <span key={m} className="px-3 py-1.5 bg-primary/5 border border-primary/15 rounded-full text-[10px] font-semibold text-primary uppercase tracking-widest">
                    {MATERIAL_LABELS[m]}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Pricing Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Their Pricing</p>
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Base Logistics Fee</span>
            <span className="text-lg font-semibold text-primary">KSh {logisticsFee}</span>
          </div>
          <p className="text-[9px] font-semibold text-slate-400 mt-2">Final price depends on material type and weight, confirmed after pickup.</p>
        </div>
      </div>

      {/* Book CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-50">
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
