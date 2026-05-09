import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAgentStore, getThumbnailUrl } from '@cleanflow/core';
import { Wallet, Truck, Star, Briefcase, ChevronRight, Copy, CheckCircle2, Users, Power, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyAdminDashboard() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => s.profile);
  const toggleOnline = useAuthStore(s => s.toggleOnline);
  const fetchProfile = useAuthStore(s => s.fetchProfile);
  const subscribeToProfileChanges = useAuthStore(s => s.subscribeToProfileChanges);

  const earnings = useAgentStore(s => s.earnings);
  const fetchEarnings = useAgentStore(s => s.fetchEarnings);
  const fleetDrivers = useAgentStore(s => s.fleetDrivers);
  const fetchFleetDrivers = useAgentStore(s => s.fetchFleetDrivers);
  const isLoadingFleet = useAgentStore(s => s.isLoadingFleet);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchProfile(); // Ensure profile stats like rewardPoints are completely fresh
    fetchEarnings();
    fetchFleetDrivers();
    
    if (profile?.id) {
      subscribeToProfileChanges(profile.id);
    }
  }, []);

  const handleCopyCode = () => {
    if (profile?.fleet_invite_code) {
      navigator.clipboard.writeText(profile.fleet_invite_code);
      toast.success('Code Copied!', { description: 'Share this with your new drivers.' });
    }
  };

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await toggleOnline();
      toast.success(profile.isOnline ? 'Marketplace Closed' : 'Marketplace Open!', {
        description: profile.isOnline ? 'Your fleet is now hidden.' : 'Your company is now visible to residents.'
      });
    } catch (err) {
      toast.error('Toggle failed');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── HEADER & MASTER TOGGLE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white leading-none">Command Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Manage your fleet, track revenue, and dominate logistics.</p>
        </div>

        {/* Marketplace Visibility Toggle */}
        <div className="bg-slate-900 text-white p-4 px-6 rounded-[2rem] flex items-center gap-6 shadow-2xl shadow-slate-900/20 border border-white/5">
          <div className="flex items-center gap-3">
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${profile.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-slate-800 text-slate-500'}`}>
                {isToggling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Power className="w-5 h-5" />}
             </div>
             <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400 leading-none mb-1">Marketplace Visibility</p>
                <p className="text-sm font-semibold tracking-tight leading-none">{profile.isOnline ? 'Open for Bookings' : 'Company Closed'}</p>
             </div>
          </div>
          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              profile.isOnline ? 'bg-emerald-500' : 'bg-slate-800 border border-white/10'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${
              profile.isOnline ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* ── TOP METRICS ROW ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Revenue */}
        <div className="relative group perspective-1000 md:col-span-2">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-700 to-emerald-500 rounded-[2rem] blur opacity-20 transition duration-1000"></div>
          <div className="relative bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-[2rem] p-6 shadow-xl shadow-emerald-900/30 overflow-hidden h-full flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <p className="text-[11px] font-semibold text-emerald-200/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Total Fleet Revenue
              </p>
              <h2 className="text-5xl lg:text-6xl font-semibold text-white tracking-tighter leading-none mb-2">
                KSh {earnings.total?.toLocaleString() || earnings.today?.toLocaleString() || 0}
              </h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-amber-300 shadow-inner">
                  ⚡ {profile.rewardPoints || 0} Company Track Points
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 relative z-10">
              <div>
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">Fleet Today</p>
                <p className="text-2xl font-semibold text-white leading-none">{earnings.completedToday || 0}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">Fleet Total</p>
                <p className="text-2xl font-semibold text-white leading-none">{earnings.totalJobs || 0}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300 uppercase tracking-widest mb-1">Fleet Rating</p>
                <p className="text-2xl font-semibold text-white leading-none flex items-center gap-1.5">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" /> 
                  {profile.rating ? Number(profile.rating).toFixed(1) : 'New'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Invite Code Widget */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-tight">Driver Invite Code</h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Give this code to your drivers so their revenue routes directly to your wallet.
            </p>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleCopyCode}
              className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 flex items-center justify-between group transition-all"
            >
              <span className="text-2xl font-semibold tracking-[0.2em] text-slate-900 dark:text-white">
                {profile?.fleet_invite_code || '------'}
              </span>
              <Copy className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      {/* ── LIVE FLEET RADAR ── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" /> Live Fleet Radar
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Active drivers on the road</p>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => fetchFleetDrivers()}
               className="p-2.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-primary hover:text-white rounded-xl transition-all"
               title="Refresh Roster"
             >
                <RefreshCw className={`w-4 h-4 ${isLoadingFleet ? 'animate-spin' : ''}`} />
             </button>
             <button 
               onClick={() => navigate('/admin/agents')}
               className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-primary hover:text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all group"
             >
               <Users className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Roster</span>
             </button>
             <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-widest rounded-full border border-emerald-200 dark:border-emerald-900">
               {fleetDrivers.filter(d => d.is_online).length} Live
             </span>
          </div>
        </div>

        {isLoadingFleet ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400 mt-4 uppercase tracking-widest">Scanning Fleet...</p>
          </div>
        ) : fleetDrivers.filter(d => d.is_online).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Active Drivers</h4>
            <p className="text-xs text-slate-500 font-semibold max-w-xs mt-1">
              Your fleet is currently off-duty. You can manage your full roster in the 'My Agents' tab.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fleetDrivers.filter(d => d.is_online).map((driver) => (
              <div key={driver.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-4 hover:border-emerald-200 transition-colors group shadow-sm">
                <div className="relative">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold border-2 shadow-sm overflow-hidden bg-emerald-100 text-emerald-700 border-emerald-500`}>
                    {driver.avatar_url ? (
                      <img 
                        src={getThumbnailUrl(driver.avatar_url, { width: 200 })} 
                        loading="lazy"
                        alt={driver.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      driver.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{driver.name}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    {driver.location?.estate || 'Unknown Sector'}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                    {driver.reward_points || 0} Track Points
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
