import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Star, MapPin, Phone, MessageSquare, Wallet, 
  Activity, Package, Truck, CheckCircle2, ShieldCheck, Calendar,
  ChevronRight, MoreVertical, PauseCircle
} from 'lucide-react';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { OptimizedImage } from '@klinflow/ui';
import { toast } from 'sonner';

export default function OwnerAgentDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const agent = state?.agent;

  if (!agent) {
    return (
      <div className="pt-20 text-center">
        <p className="text-slate-500">Agent not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">Go Back</button>
      </div>
    );
  }

  const handleAction = (action: string) => {
    toast.success(`Action: ${action}`);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-900 flex flex-col max-w-lg mx-auto">
      
      {/* ── HEADER WITH AVATAR ── */}
      <div className="relative pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-8 bg-gradient-to-br from-emerald-700 to-emerald-500 dark:from-slate-900 dark:to-slate-800 shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[40px] -mr-10 -mt-10" />
        
        <div className="px-4 flex items-center justify-between mb-6 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 bg-black/20 rounded-full text-white active:scale-90 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-black/20 rounded-full text-[9px] font-bold text-white uppercase tracking-widest">
              Report
            </button>
            <button className="p-2 bg-black/20 rounded-full text-white active:scale-90 transition-all">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-6 flex flex-col items-center text-center relative z-10">
          {/* Profile Image */}
          <div className="w-28 h-28 rounded-3xl border-4 border-amber-400 shadow-xl relative overflow-hidden mb-4 bg-amber-600">
            {agent.avatar_url ? (
              <OptimizedImage 
                src={getThumbnailUrl(agent.avatar_url, { width: 300 })} 
                className="w-full h-full object-cover" 
                wrapperClassName="w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {agent.name?.charAt(0) || '?'}
              </div>
            )}
            <div className={`absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full border-[3px] border-white ${agent.is_online ? 'bg-green-400' : 'bg-slate-400'}`} />
          </div>
          
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <h1 className="text-xl font-black text-white">{agent.name}</h1>
            <CheckCircle2 className="w-5 h-5 text-green-300 fill-green-300/20" />
          </div>
          <p className="text-[10px] font-bold text-emerald-100 tracking-[0.2em] uppercase mb-4">ID: {agent.klinflow_id || 'AGT-XXXX'}</p>
          
          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold">{(agent.rating || 0).toFixed(1)}</span>
              <span className="text-[10px] text-white/60">Rating</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              <span className="text-xs font-bold">{Number(agent.completed_jobs || 0)}</span>
              <span className="text-[10px] text-white/60">Pickups</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold">{(agent.location as any)?.estate || 'Nairobi'}</span>
              <span className="text-[10px] text-white/60">Location</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAIL SHEET ── */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-5 pb-24 relative -mt-4 bg-[#F8F8FF] dark:bg-slate-900 rounded-t-[1.5rem]">
        
        {/* ── QUICK ACTIONS ── */}
        <div className="flex items-center gap-2 w-full">
          {[
            { icon: Phone, label: 'Call', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', action: () => window.location.href = `tel:${agent.phone}` },
            { icon: MessageSquare, label: 'Message', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', action: () => handleAction('Message') },
            { icon: Wallet, label: 'Transfer', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400', action: () => handleAction('Transfer') },
            { icon: PauseCircle, label: 'Suspend', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', action: () => handleAction('Suspend') },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} className="flex-1 flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl active:scale-95 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${btn.color}`}>
                <btn.icon className="w-5 h-5" />
              </div>
              <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* ── PERFORMANCE (TODAY) ── */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-white px-1">Performance (Today)</h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Collections</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate">{(agent.collected_kg || 0)} <span className="text-[10px] text-slate-400">kg</span></p>
                <p className="text-[9px] font-bold text-emerald-500 mt-0.5">↑ 20%</p>
                <p className="text-[8px] text-slate-400 truncate">vs yesterday</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate"> Disbursed</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate"><span className="text-[10px] text-slate-400">KES</span> {(agent.payout_amount || 0).toLocaleString()}</p>
                <p className="text-[9px] font-bold text-emerald-500 mt-0.5">↑ 20%</p>
                <p className="text-[8px] text-slate-400 truncate">vs yesterday</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Pickups</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate">{Number(agent.completed_jobs || 0)}</p>
                <p className="text-[9px] font-bold text-emerald-500 mt-0.5">↑ 0%</p>
                <p className="text-[8px] text-slate-400 truncate">vs yesterday</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Disputes</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate">{agent.completed_jobs ? '95' : '0'}%</p>
                <p className="text-[9px] font-bold text-emerald-500 mt-0.5">↑ 0%</p>
                <p className="text-[8px] text-slate-400 truncate">vs yesterday</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── AGENT INFORMATION ── */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-white px-1">Agent Information</h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            {[
              { icon: Truck, label: 'Vehicle', value: 'KCE 204L (Truck)' },
              { icon: Phone, label: 'Phone Number', value: agent.phone || '+254 712 345 678' },
              { icon: MessageSquare, label: 'Email Address', value: agent.email || `${agent.name?.toLowerCase().replace(/\s/g, '.')}@example.com` },
              { icon: Calendar, label: 'Joined', value: new Date(agent.created_at || Date.now()).toLocaleDateString() },
              { icon: Activity, label: 'Status', value: agent.is_online ? '● Active' : '● Offline', valueColor: agent.is_online ? 'text-emerald-500' : 'text-slate-400' },
            ].map((info, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < 4 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                <div className="w-9 h-9 bg-[#F8F8FF] dark:bg-slate-900 rounded-lg flex items-center justify-center shrink-0">
                  <info.icon className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{info.label}</p>
                  <p className={`text-sm font-semibold ${(info as any).valueColor || 'text-slate-600 dark:text-white'} truncate`}>{info.value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ── */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-white px-1">Overview</h3>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Total Collections</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate">{(agent.collected_kg || 0)} <span className="text-[10px] text-slate-400">kg</span></p>
                <p className="text-[8px] text-slate-400 truncate">All time</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Total Earnings</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate"><span className="text-[10px] text-slate-400">KES</span> {(agent.payout_amount || 0).toLocaleString()}</p>
                <p className="text-[8px] text-slate-400 truncate">All time</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Total Pickups</p>
                <p className="text-base font-bold text-slate-700 dark:text-white truncate">{Number(agent.completed_jobs || 0)}</p>
                <p className="text-[8px] text-slate-400 truncate">All time</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 truncate">Average Rating</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                  <p className="text-base font-bold text-slate-700 dark:text-white truncate">{(agent.rating || 0).toFixed(1)}</p>
                </div>
                <p className="text-[8px] text-slate-400 truncate">From {Number(agent.completed_jobs || 0)} reviews</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── RECENT ACTIVITY ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-white">Recent Complains</h3>
            <button className="text-[10px] font-bold text-emerald-600">View all</button>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-700 dark:text-white">No recent complains</p>
                <p className="text-[10px] text-slate-400">This agent has no complain activity yet.</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] text-slate-400">—</p>
                <p className="text-[9px] text-slate-400">Today</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
