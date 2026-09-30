import { useState, useEffect } from 'react';
import { Zap, Star, ChevronRight, X, Clock, Truck, Home, Search, Loader2, User, ShieldCheck, AlertCircle } from 'lucide-react';
import { Marker, Popup, Circle } from 'react-leaflet';
import { SharedMap } from '../../components/ui/SharedMap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';

export default function PostTradeCollectionStep({
  pickupMode, setPickupMode,
  drillDownCompany, setDrillDownCompany,
  liveWeavers, center,
  userIcon, nearbyHubs, hubIcon, setSelectedHub, selectedHub,
  liveAgents, agentIcon, selectedAgent, setSelectedAgent, companyIcon,
  selectTime, setIsManualTime, isManualTime, selectedTime,
  customDate, setCustomDate, customTime, setCustomTime
}: any) {
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchedAgent, setSearchedAgent] = useState<any | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);


  const handleAgentSearch = async () => {
    setSearchError(null);
    setSearchedAgent(null);
    setSearchAttempted(true);

    const normId = agentSearchQuery.trim().toUpperCase();
    if (!normId) {
      setSearchError('Enter a valid Klin-ID.');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.from('profiles')
        .select('*')
        .eq('klinflow_id', normId)
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSearchedAgent({
          ...data[0],
          full_name: data[0].company_name || data[0].name,
          agent_type: data[0].agent_account_type,
          profile_photo: data[0].avatar_url,
          rating: 4.9, // mock rating since it might not be explicitly queried
          completed_pickups: 15,
          online: data[0].is_online,
          company_id: data[0].company_id
        });
      } else {
        setSearchError('No agent found with this Klin-ID.');
        setSearchedAgent(null);
      }
    } catch (err) {
      console.error(err);
      setSearchError('Something went wrong. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // ── FILTER LIVE AGENTS FOR PICKUP VIEW ──
  // Hubs now handle fleet dispatch silently via territory logic.
  const filteredAgents = liveAgents.filter((agent: any) => {
    // Only show online agents on the live dispatch map
    if (!agent.isOnline) return false;

    // Must have a valid pickup location within 50km
    const pDist = agent.pickupDistanceKm ?? agent.distance_km;
    if (pDist == null || pDist > 50) return false;

    // Only show independent agents.
    return agent.agentAccountType === 'independent';
  });

  return (
    <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Collection Method</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">How would you like to get your materials to us?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setPickupMode('pickup')}
          className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 ${pickupMode === 'pickup' ? 'border-primary bg-primary/10 shadow-sm' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pickupMode === 'pickup' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className={`text-[11px] font-bold leading-tight ${pickupMode === 'pickup' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Agent Pickup</p>
            <p className="text-[9px] font-semibold text-slate-400 capitalize mt-0.5">We come to you</p>
          </div>
        </button>

        <button
          onClick={() => setPickupMode('dropoff')}
          className={`p-2.5 rounded-xl border-2 transition-all flex items-center gap-3 ${pickupMode === 'dropoff' ? 'border-primary bg-primary/10 shadow-sm' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'}`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${pickupMode === 'dropoff' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <Home className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className={`text-[11px] font-bold leading-tight ${pickupMode === 'dropoff' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Self Drop-off</p>
            <p className="text-[9px] font-semibold text-slate-400 capitalize mt-0.5">Bring to hub</p>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize tracking-widest">
              {pickupMode === 'dropoff' ? 'Nearby Hubs' : (drillDownCompany ? 'Fleet Dispatch' : 'Nearby Partners')}
            </h3>
            {drillDownCompany && pickupMode === 'pickup' && (
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setDrillDownCompany(null)} className="text-xs font-semibold text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">Clear Selection ✕</button>
              </div>
            )}
          </div>
          {liveWeavers?.length > 0 && pickupMode === 'pickup' && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-primary capitalize tracking-widest">{liveWeavers.length} Collectors Nearby</span>
            </div>
          )}
        </div>

        <SharedMap center={center as [number, number]} height="h-[350px]" boundsItems={[...(pickupMode === 'pickup' ? filteredAgents : []), ...(pickupMode === 'dropoff' ? nearbyHubs : [])]}>
            <Marker position={center as [number, number]} {...({ icon: userIcon } as any)} />

            {pickupMode === 'dropoff' || pickupMode === 'pickup' ? (
              <>
                {nearbyHubs.map((hub: any) => (
                  <div key={hub.id}>
                    <Marker position={[hub.lat, hub.lng]} {...({ icon: hubIcon } as any)} eventHandlers={{ click: () => { setSelectedHub(hub); toast.success(`${hub.name || hub.companyName} Selected`); } }}>
                      {/* @ts-ignore */}
                      <Popup className="compact-popup">
                        <div className="p-1.5 text-center leading-tight min-w-[100px]">
                          <h4 className="text-[11px] font-bold text-slate-900 leading-tight truncate">{hub.companyName || hub.name}</h4>
                          <p className="text-[9px] font-semibold text-slate-500 mt-0.5 capitalize tracking-widest leading-tight truncate">{hub.hubAddress}</p>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle 
                      center={[hub.lat, hub.lng]} 
                      radius={(hub.distance || 20) * 1000} // Radius in meters
                      pathOptions={{
                        color: '#10b981', // emerald-500
                        fillColor: '#10b981',
                        fillOpacity: 0.1,
                        weight: 1,
                        dashArray: '4, 4'
                      }}
                    />
                  </div>
                ))}
              </>
            ) : null}

            {pickupMode === 'pickup' && (
              <>
                {filteredAgents.map((agent: any, index: number) => {
                  const isCompany = agent.agentAccountType === 'company_admin';
                  const isSelected = selectedAgent?.id === agent.id || drillDownCompany?.id === agent.id;

                  // Anti-overlap map jitter logic
                  const baseLat = agent.location?.latitude || center[0];
                  const baseLng = agent.location?.longitude || center[1];
                  
                  // Find all agents at this exact location to form a cluster
                  const cluster = filteredAgents.filter((other: any) => 
                    Math.abs((other.location?.latitude || center[0]) - baseLat) < 0.001 &&
                    Math.abs((other.location?.longitude || center[1]) - baseLng) < 0.001
                  );

                  let markerLat = baseLat;
                  let markerLng = baseLng;
                  
                  if (cluster.length > 1) {
                    // Sort cluster by ID to ensure stable ordering regardless of how filteredAgents is sorted
                    const sortedCluster = [...cluster].sort((a: any, b: any) => a.id.localeCompare(b.id));
                    // Find this agent's stable index within the cluster
                    const stableIndex = sortedCluster.findIndex((a: any) => a.id === agent.id);
                    
                    // Spread them out evenly based on the cluster size
                    const angle = (2 * Math.PI * stableIndex) / cluster.length;
                    const offsetRadius = 0.003; // ~300m spread
                    markerLat = baseLat + offsetRadius * Math.cos(angle);
                    markerLng = baseLng + offsetRadius * Math.sin(angle);
                  }

                  return (
                    <Marker
                      key={agent.id}
                      position={[markerLat, markerLng]}
                      {...({ icon: isCompany ? companyIcon(isSelected) : agentIcon(isSelected) } as any)}
                      eventHandlers={{
                        click: () => {
                          if (isCompany) {
                            setDrillDownCompany(agent);
                            toast(`Showing ${agent.companyName || agent.name}'s Fleet`, { icon: '🏢' });
                          } else {
                            setSelectedAgent(agent);
                            toast.success(`Agent Targeted`);
                          }
                        }
                      }}
                    >
                      {/* @ts-ignore */}
                      <Popup maxWidth={160} className="compact-popup">
                        <div className="p-0.5 text-center leading-tight">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">
                            {isCompany ? (agent.companyName || 'Fleet Hub') : agent.name || 'Agent'}
                          </h4>
                          <div className="flex items-center justify-center gap-0.5 text-xs font-semibold text-primary capitalize mt-0.5">
                            <Star className="w-2 h-2 fill-primary" />
                            <span>{agent.rating?.toFixed(1) || '4.9'}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </>
            )}
          </SharedMap>
      </div>

      {pickupMode === 'dropoff' ? (
        <div className="space-y-3">
          {selectedHub ? (
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                <Home className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedHub.companyName || selectedHub.name}</h3>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 capitalize tracking-widest mt-0.5 truncate">{selectedHub.hubAddress}</p>
              </div>
              <button onClick={() => setSelectedHub(null)} className="px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase tracking-widest transition-colors hover:bg-slate-200 dark:hover:bg-slate-600 shrink-0">
                Change
              </button>
            </div>
          ) : (
            <div className="p-5 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl text-center bg-emerald-50 dark:bg-emerald-900/10 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto text-emerald-600">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Open Market Drop-off</h4>
                <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1 leading-relaxed px-4">
                  No hub selected. Your trade will be posted to the global marketplace where agents can bid for your drop-off!
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Selection Cards */}
          {selectedAgent && (
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-primary/20 shadow-xl mt-3 animate-slide-up">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                    🚛
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary capitalize tracking-widest leading-none">
                      Targeting Agent
                    </p>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                      {selectedAgent.name}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    toast.success("Selection Cleared");
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Unified Search & Booking Actions Card */}
          <div className="bg-slate-200 dark:bg-slate-800/60 p-5 rounded-[1.5rem] border border-slate-300/50 dark:border-slate-700/50 shadow-sm mt-3.5 space-y-6">
            
            {/* Preferred Agent Search */}
            <div className="relative overflow-hidden">
              <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight mb-1 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" /> Find by Klin-ID
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-4 leading-relaxed">
                You can search for a Hub or an Individual Agent using their unique ID.
              </p>
              
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={agentSearchQuery}
                    placeholder="KFL-..."
                    className={`w-full bg-white dark:bg-slate-900/50 py-3.5 pl-10 pr-4 rounded-xl border ${searchError ? 'border-red-300 dark:border-red-900/50 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20'} text-sm font-semibold dark:text-white outline-none focus:ring-4 transition-all`}
                    onChange={(e) => {
                      setAgentSearchQuery(e.target.value.toUpperCase());
                      setSearchError(null);
                      setSearchAttempted(false);
                      setSearchedAgent(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAgentSearch();
                    }}
                  />
                </div>
                <button
                  onClick={handleAgentSearch}
                  disabled={isSearching || !agentSearchQuery}
                  className="px-5 py-3.5 bg-slate-900 dark:bg-primary text-white rounded-xl text-sm font-bold tracking-wide disabled:opacity-50 hover:bg-slate-800 dark:hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>

              {searchError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold text-red-500 mt-3 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {searchError}
                </motion.p>
              )}

              {searchAttempted && !isSearching && !searchError && (
                <div className="mt-5 border-t border-slate-300 dark:border-slate-700/50 pt-5">
                  {searchedAgent ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm relative">
                      <button 
                        onClick={() => {
                          setSearchAttempted(false);
                          setSearchedAgent(null);
                          setAgentSearchQuery('');
                        }}
                        className="absolute top-3 right-3 w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                          {searchedAgent.profile_photo ? (
                            <img src={searchedAgent.profile_photo} alt={searchedAgent.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-slate-500 dark:text-slate-400">{searchedAgent.full_name?.charAt(0) || 'A'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{searchedAgent.full_name}</h4>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-black uppercase tracking-widest rounded-md">
                              {searchedAgent.agent_type === 'company_admin' ? 'Enterprise' : searchedAgent.agent_type === 'fleet_driver' ? 'Fleet Agent' : 'Independent'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-emerald-500 fill-emerald-500" /> {searchedAgent.rating}</span>
                            <span>•</span>
                            <span>{searchedAgent.completed_pickups} Pickups</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${searchedAgent.online ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                              {searchedAgent.online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {!searchedAgent.online && (
                        <div className="mt-4 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] font-semibold text-red-700 dark:text-red-400 leading-tight">
                            This agent is offline. You can select them, but you will only be able to schedule for later.
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          const isHub = searchedAgent.agent_type === 'company_admin';
                          if (isHub && setSelectedHub) {
                            setSelectedHub(searchedAgent);
                            setSelectedAgent(null);
                          } else {
                            const agentAdapter = {
                              id: searchedAgent.id,
                              name: searchedAgent.full_name,
                              rating: searchedAgent.rating,
                              isOnline: searchedAgent.online,
                              agentAccountType: searchedAgent.agent_type,
                              avatarUrl: searchedAgent.profile_photo,
                              companyId: searchedAgent.company_id
                            };
                            setSelectedAgent(agentAdapter);
                            if (setSelectedHub) setSelectedHub(null);
                          }
                          setDrillDownCompany(null);
                          setSearchAttempted(false);
                          setSearchedAgent(null);
                          setAgentSearchQuery('');
                          toast.success(`${searchedAgent.full_name} selected`);
                        }}
                        className="w-full mt-4 py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-colors"
                      >
                        Select {searchedAgent.agent_type === 'company_admin' ? 'Hub' : 'Agent'}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 px-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                        No Klinflow pickup agent was found with that ID.
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full h-px bg-slate-300/70 dark:bg-slate-700/50" />

            {/* Time Selection Section */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {/* ASAP BUTTON */}
                <button
                  onClick={() => { selectTime({ time: 'ASAP', type: 'any', discount: 0, label: 'Agents available' }); setIsManualTime(false); }}
                  className={`w-full p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-primary border-primary ' : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-primary/10'}`}>
                    <Zap className={`w-4 h-4 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-widest ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-500'}`}>Available Now</p>
                  </div>
                </button>

                {/* SCHEDULE LATER */}
                <button
                  onClick={() => setIsManualTime(true)}
                  className={`w-full p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${isManualTime ? 'bg-slate-800 dark:bg-slate-700 border-slate-600 shadow-xl' : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isManualTime ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <Clock className={`w-4 h-4 ${isManualTime ? 'text-primary' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${isManualTime ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Schedule Later</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-widest ${isManualTime ? 'text-white/50' : 'text-slate-500'}`}>Pick a Time</p>
                  </div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold text-center mt-3">
                Select exactly when you want your pickup to happen.
              </p>

              {isManualTime && pickupMode === 'pickup' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Date</span>
                    <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700/50" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Time</span>
                    <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl text-xs font-semibold dark:text-white outline-none border border-slate-100 dark:border-slate-700/50" />
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
