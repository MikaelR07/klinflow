import React, { useState } from 'react';
import { 
  Truck, Clock, MapPin, Activity, Search, Filter,
  ArrowRight, MoreVertical, Navigation, Loader2, ListFilter,
  UserCircle, Store, ShieldCheck, Smartphone, Scale,
  AlertCircle, X
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { normalizeKeys, Asset, Profile } from '@klinflow/core/validation';

type VehicleStatus = 'Waiting' | 'Weighing' | 'Unloading' | 'Complete';

interface QueueItem {
  id: string;
  driver: string;
  registration: string;
  type: 'Fleet' | 'Individual' | 'Walk-in';
  expectedTonnage: number;
  arrivalTime: string;
  status: VehicleStatus;
  bayAssigned?: number;
  material: string;
}

export default function IntakeManagement() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [incomingAlerts, setIncomingAlerts] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [todayIntakeWeight, setTodayIntakeWeight] = useState(0);

  const fetchData = async () => {
    if (!profile?.id) return;
    try {
      let query = (supabase
        .from('profiles') as any)
        .select('id, name, is_en_route, agent_account_type, company_id, avatar_url')
        .eq('is_en_route', true);

      if (profile?.agentAccountType === 'company_admin') {
        query = query.eq('company_id', profile.id);
      }

      const { data: agents, error: agentError } = await query;
      if (agentError) throw agentError;

      const normalizedAgents = normalizeKeys(agents || []) as Profile[];

      const activeQueue: QueueItem[] = [];
      const alerts: any[] = [];

      for (const agent of normalizedAgents) {
        const { data: driverLoad } = await ((supabase
           .from('assets') as any)
           .select('weight_kg, material_type')
           .eq('verifier_id', agent.id)
           .eq('status', 'verified'));
        
        const normalizedLoad = normalizeKeys(driverLoad || []) as Asset[];
        const incomingWeight = normalizedLoad.reduce((acc, curr) => acc + (Number(curr.weightKg) || 0), 0) || 0;
        const materials = Array.from(new Set(normalizedLoad.map(a => a.materialType))).join(', ');

        activeQueue.push({
          id: agent.id,
          driver: agent.name || 'Unknown Agent',
          registration: 'KCA 123G', // mocked plate for now
          type: 'Fleet',
          expectedTonnage: incomingWeight / 1000, // expecting tons
          arrivalTime: new Date().toLocaleTimeString(),
          status: 'Waiting',
          material: materials || 'Mixed',
        });

        alerts.push({
          id: agent.id,
          agent: agent.name || 'Agent',
          profile_picture_url: agent.avatarUrl || undefined,
          weight: `${incomingWeight.toFixed(1)} KG`,
          status: 'En Route to Hub'
        });
      }

      setQueue(activeQueue);
      setIncomingAlerts(alerts);
      
      // Fetch Today's Intake (approximate for demo)
      const { data: hubAssets } = await ((supabase
        .from('assets') as any)
        .select('weight_kg')
        .eq('hub_manager_id', profile.id)
        .eq('status', 'transferred_to_hub'));
        
      const normalizedHubAssets = normalizeKeys(hubAssets || []) as Asset[];
      const totalInventory = normalizedHubAssets.reduce((acc, curr) => acc + (Number(curr.weightKg) || 0), 0) || 0;
      setTodayIntakeWeight(totalInventory / 1000); // to Tons

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();

    const radarChannel = supabase.channel('hub-radar-sync')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: profile?.agentAccountType === 'company_admin' ? `company_id=eq.${profile?.id}` : undefined
      }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(radarChannel);
    };
  }, [profile?.id]);

  const getStatusColor = (status: VehicleStatus) => {
    switch (status) {
      case 'Waiting': return 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'Weighing': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20';
      case 'Unloading': return 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20';
      case 'Complete': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20';
    }
  };

  const channels = [
    {
      id: 'fleet',
      title: 'Fleet Delivery',
      description: 'Employed agents arriving with company vehicles. Requires a 6-digit PIN to pull their verified manifest.',
      icon: <Truck className="w-8 h-8" />,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      textColor: 'text-emerald-500',
      features: ['PIN Verification', 'AI Verified Manifest'],
      route: '/operations/intake/fleet',
    },
    {
      id: 'individual',
      title: 'Registered Sellers',
      description: 'Independent collectors who use the Klinflow app. Lookup via Klin-ID to access their warehouse logs.',
      icon: <Smartphone className="w-8 h-8" />,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50 dark:bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      textColor: 'text-blue-500',
      features: ['Klin-ID Lookup', 'Direct M-PESA Payout'],
      route: '/operations/intake/individual',
    },
    {
      id: 'walkin',
      title: 'Walk-in Seller',
      description: 'Anyone walking through the gate with materials. Requires manual entry of materials, weights, and grades.',
      icon: <Store className="w-8 h-8" />,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      textColor: 'text-amber-500',
      features: ['Quick Registration', 'Full Manual Entry'],
      route: '/operations/intake/walkin',
    }
  ];

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>Intake Channels & Queue Management</h1>
            <p className={`text-[11px] mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Monitor inbound traffic and initiate the intake process for agents.</p>
          </div>
          <div className="flex gap-3">
            <button className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border transition-colors ${
              isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-[#e0e3eb] text-slate-900 hover:bg-slate-50'
            }`}>
              <ListFilter className="w-4 h-4" /> Export Log
            </button>
          </div>
        </div>

        {/* ── INCOMING LIVE ALERTS ── */}
        {incomingAlerts.filter(a => !dismissedAlerts.includes(a.id)).length > 0 && (
          <div className="space-y-3 mb-6">
            {incomingAlerts.filter(a => !dismissedAlerts.includes(a.id)).map((alert) => (
              <div key={alert.id} className="font-medium relative bg-emerald-600 rounded-[1rem] p-4 text-white shadow-xl shadow-emerald-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-bounce-in">
                 <button 
                   onClick={() => setDismissedAlerts(prev => [...prev, alert.id])}
                   className="font-medium absolute -top-2 -right-2 w-7 h-7 bg-white text-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:bg-emerald-50 transition-all z-50 border-2 border-emerald-600"
                   title="Dismiss Alert"
                 >
                   <X className="w-4 h-4" />
                 </button>

                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
                       {alert.profile_picture_url ? (
                          <img src={alert.profile_picture_url} alt={alert.agent} className="w-full h-full object-cover" />
                       ) : (
                          <span className="text-lg font-semibold text-white">{alert.agent.charAt(0)}</span>
                       )}
                    </div>
                    <div>
                       <h3 className="text-sm font-semibold leading-none">Incoming Fleet</h3>
                       <p className="text-xs font-semibold text-emerald-100 mt-1 uppercase tracking-widest">
                         {alert.agent} · {alert.weight}
                       </p>
                    </div>
                 </div>
                 <button 
                   onClick={() => navigate('/operations/intake/fleet')}
                   className="px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-xs font-semibold uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap"
                 >
                   Prepare Gate
                 </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col xl:flex-row gap-2">
          
          {/* Left Column: Intake Channels (Bigger) */}
          <div className="w-full xl:w-[480px] flex flex-col gap-4 shrink-0"> 
            {channels.map((channel) => (
              <div 
                key={channel.id}
                onClick={() => navigate(channel.route)}
                className={`group cursor-pointer p-6 rounded-xl border flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700/50 hover:border-white/20 hover:shadow-black/50' 
                    : 'bg-white border-[#e0e3eb] hover:border-slate-300 hover:shadow-slate-200/50'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${channel.lightColor} ${channel.textColor}`}>
                    {channel.icon}
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{channel.title}</h2>
                  </div>
                </div>
                
                <p className={`text-xs leading-relaxed mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {channel.description}
                </p>

                <div className="space-y-3 mb-6">
                  {channel.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <ShieldCheck className={`w-4 h-4 ${channel.textColor}`} />
                      <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className={`w-full py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest text-center flex items-center justify-center gap-2 transition-all mt-auto ${
                  isDarkMode 
                    ? 'bg-slate-900 text-white group-hover:bg-white group-hover:text-slate-900' 
                    : 'bg-primary text-white group-hover:bg-primary group-hover:text-white'
                }`}>
                  Select Channel <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: KPIs + Queue List */}
          <div className="flex-1 flex flex-col gap-2">
            
            {/* Top Metrics (Now 5) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Incoming Deliveries', value: '5', trend: '+2 since last hour', icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { label: 'Active Bays', value: '4', trend: '-4m vs yesterday', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { label: 'Expected Inbound', value: '554KG', trend: 'From waiting vehicles', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                { label: 'Need Inspection', value: '12', trend: 'Vehicles on duty', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-500/10' },
                { label: 'Delayed', value: '14', trend: 'Across all channels', icon: AlertCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },

              ].map((stat, i) => (
                <div key={i} className={`p-4 rounded-xl border flex flex-col ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] xl:text-[10px] font-bold uppercase tracking-widest truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.label}</p>
                      <h2 className={`text-lg xl:text-xl font-bold tracking-tighter truncate ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{stat.value}</h2>
                    </div>
                  </div>
                  <p className={`text-[10px] font-medium truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{stat.trend}</p>
                </div>
              ))}
            </div>

            {/* Queue List Table */}
            <div className={`flex-1 rounded-xl border flex flex-col h-fit ${isDarkMode ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-[#e0e3eb]'}`}>
              <div className={`p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${isDarkMode ? 'border-slate-700/50' : 'border-[#e0e3eb]'}`}>
                <div className="flex items-center gap-2">
                  <Truck className="font-medium w-5 h-5 text-blue-500" />
                  <h2 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>
                    Active Gate Queue
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{queue.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search agent..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`pl-9 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-colors w-full md:w-56 ${
                        isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="font-medium w-full text-left text-sm">
                  <thead className={`text-[10px] uppercase tracking-widest font-bold ${isDarkMode ? 'bg-slate-900/50 text-slate-400' : 'bg-slate-50/50 text-slate-500'}`}>
                    <tr>
                      <th className="px-5 py-4">Agent/Customer Name</th>
                      <th className="px-5 py-4">Material Type</th>
                      <th className="px-5 py-4">Weight</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-[#e0e3eb]'}`}>
                    {queue.filter(q => q.driver.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                      <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/50'}`}>
                        <td className="px-5 py-4">
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{item.driver}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.registration}</span>
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-[#e0e3eb] text-slate-500'}`}>
                              {item.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-[#131722]'}`}>{item.material}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.expectedTonnage.toFixed(1)}t</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex items-center w-max gap-1.5 ${getStatusColor(item.status)}`}>
                            {item.status === 'Weighing' && <Loader2 className="w-3 h-3 animate-spin" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 flex justify-end">
                          {item.status === 'Waiting' ? (
                            <button onClick={() => navigate('/operations/intake/fleet')} className="px-4 py-2 rounded-xl text-[10px] font-bold bg-primary text-white hover:bg-emerald-600 transition-colors flex items-center gap-1 uppercase tracking-widest">
                              Process Intake <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
