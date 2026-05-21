import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { getThumbnailUrl } from '@klinflow/core/utils/imageUtils';
import { Wallet, Truck, Star, Briefcase, ChevronRight, Copy, CheckCircle2, Users, Power, Loader2, RefreshCw, TrendingUp, Zap, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CompanyAdminDashboard() {
  const navigate = useNavigate();
  const { logout, profile, fetchProfile, subscribeToProfileChanges, toggleOnline, depositToWallet } = useAuthStore();
  
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

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
    if (profile?.fleetInviteCode) {
      navigator.clipboard.writeText(profile.fleetInviteCode);
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
  
  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Invalid Amount', { description: 'Please enter a positive amount to deposit.' });
      return;
    }

    setIsDepositing(true);
    try {
      await depositToWallet(amount);
      toast.success('Deposit Successful! 💸', { description: `KSh ${amount.toLocaleString()} added to your company wallet.` });
      setShowDepositModal(false);
      setDepositAmount('');
      fetchProfile();
    } catch (err: any) {
      toast.error('Deposit Failed', { description: err.message });
    } finally {
      setIsDepositing(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* ── HEADER & MASTER TOGGLE ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">Command Center</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your fleet, track revenue, and dominate logistics.</p>
        </div>

        {/* Marketplace Visibility Toggle */}
        <div className="w-full md:w-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-3 px-5 rounded-2xl flex items-center justify-between md:justify-start gap-6 shadow-xl shadow-slate-900/5 dark:shadow-slate-900/20 border border-slate-200 dark:border-white/5 transition-colors">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${profile.isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                {isToggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
             </div>
             <div>
                <p className="text-[10px] font-bold capitalize tracking-[0.2em] text-emerald-600 dark:text-emerald-400 leading-none mb-1">Marketplace</p>
                <p className="text-xs font-bold tracking-tight leading-none">{profile.isOnline ? 'Active' : 'Offline'}</p>
             </div>
          </div>
          <button 
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              profile.isOnline ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-white/10'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-sm ${
              profile.isOnline ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {/* ── TOP FINANCIAL METRICS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Company Payout */}
        <div className="relative group perspective-1000 h-full">
          <div className="relative bg-gradient-to-br from-emerald-800 to-emerald-600 rounded-[2rem] p-6 shadow-xl shadow-emerald-900/20 overflow-hidden flex flex-col justify-between h-full">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-emerald-200/80 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                Total Payout
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tighter">
                KSh {earnings.total?.toLocaleString() || 0}
              </h2>
              <div className="mt-4 flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-emerald-300 capitalize tracking-widest">Cumulative Volume</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payout Today */}
        <div className="relative group perspective-1000 h-full">
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-full transition-all hover:border-emerald-500/50">
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                Payout Today
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                KSh {earnings.todayPayout?.toLocaleString() || 0}
              </h2>
              <div className="mt-4 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 capitalize tracking-widest">Live Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* Company Wallet */}
        <div className="relative group perspective-1000 h-full">
          <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between h-full transition-all hover:border-amber-500/50">
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-amber-50 dark:bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  Company Wallet
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">
                  KSh {profile.walletBalance?.toLocaleString() || 0}
                </h2>
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-500 capitalize tracking-widest">Settlement Ready</span>
                </div>
              </div>

              <button 
                onClick={() => setShowDepositModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all group/btn"
              >
                <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform" />
                <span className="text-[10px] font-bold capitalize tracking-widest">Deposit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── OPERATIONAL METRICS & INVITE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fleet Performance Summary */}
        <div className="lg:col-span-2 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-2">Pickups Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{earnings.completedToday || 0}</p>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-700 px-8">
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-2">Fleet Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{fleetDrivers.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-2">Track Points</p>
              <p className="text-2xl font-bold text-emerald-500 leading-none">{profile.rewardPoints || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-2">KG Collected Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {(earnings.todayKg || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">KG</span>
              </p>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-700 pl-8">
              <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-2">Total KG Collected</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {(earnings.totalKg || 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">KG</span>
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                 <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
               </div>
               <div>
                 <p className="text-[10px] font-bold text-slate-400 capitalize tracking-widest">Fleet Rating</p>
                 <p className="text-sm font-bold text-slate-900 dark:text-white">{profile.rating ? Number(profile.rating).toFixed(1) : 'New'} — Top 5% in {profile.location?.estate || 'Region'}</p>
               </div>
             </div>
             <button onClick={() => navigate('/reviews')} className="text-[10px] font-bold text-primary capitalize tracking-widest hover:underline">View All Reviews →</button>
          </div>
        </div>

        {/* Quick Invite Code */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] p-6 shadow-sm flex flex-col justify-between group hover:border-primary/50 transition-all">
          <div>
            <p className="text-[10px] font-bold text-slate-400 capitalize tracking-[0.2em] mb-4">Onboard Drivers</p>
            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Fleet Invite Code</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Share this code to automatically link new drivers to your company dashboard.
            </p>
          </div>

          <button 
            onClick={handleCopyCode}
            className="mt-6 w-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-4 flex items-center justify-between group transition-all"
          >
            <span className="text-xl font-bold tracking-[0.2em] text-slate-900 dark:text-white">
              {profile?.fleetInviteCode || '------'}
            </span>
            <Copy className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </button>
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
               className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700/50 hover:bg-primary hover:text-white rounded-xl text-xs font-semibold capitalize tracking-widest transition-all group"
             >
               <Users className="w-3.5 h-3.5" />
               <span className="hidden sm:inline">Roster</span>
             </button>
             <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold capitalize tracking-widest rounded-full border border-emerald-200 dark:border-emerald-900">
               {fleetDrivers.filter(d => d.is_online).length} Live
             </span>
          </div>
        </div>

        {isLoadingFleet ? (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-400 mt-4 capitalize tracking-widest">Scanning Fleet...</p>
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
                  <p className="text-xs font-semibold text-slate-500 capitalize tracking-widest flex items-center gap-1 mt-0.5">
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

      {/* ── DEPOSIT MODAL ── */}
      <AnimatePresence>
        {showDepositModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDepositModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Wallet Deposit</h3>
                <button 
                  onClick={() => setShowDepositModal(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold capitalize tracking-[0.2em] text-slate-400 px-1">Enter Amount (KSh)</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400">KSh</div>
                    <input 
                      type="number"
                      autoFocus
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-16 pl-16 pr-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-amber-500 text-2xl font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button 
                  disabled={isDepositing || !depositAmount}
                  onClick={handleDeposit}
                  className="w-full h-16 bg-amber-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {isDepositing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Deposit'}
                </button>

                <p className="text-[10px] text-center text-slate-400 font-medium">
                  Secured by Klinflow Payment Gateway
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
