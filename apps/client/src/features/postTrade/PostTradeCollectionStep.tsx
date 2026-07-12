import { useState } from 'react';
import {
  Zap, Star, ChevronRight, X, Clock, Truck, Home, Search, Loader2, User, ShieldCheck, AlertCircle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, 15); }, [center, map]);
  return null;
}

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

    let normPhone = agentSearchQuery.replace(/\s+/g, '');
    if (normPhone.startsWith('0')) {
      normPhone = normPhone.slice(1);
    } else if (normPhone.startsWith('+254')) {
      normPhone = normPhone.slice(4);
    } else if (normPhone.startsWith('254')) {
      normPhone = normPhone.slice(3);
    }

    if (!/^(7|1)\d{8}$/.test(normPhone)) {
      setSearchError('Enter a valid phone number.');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_pickup_agent_exact_v2', { p_core_digits: normPhone });
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSearchedAgent(data[0]);
      } else {
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
  // Show Independent, Company Admins, and if a hub is selected, its Fleet Drivers.
  const filteredAgents = liveAgents.filter((agent: any) => {
    if (agent.isHubActive) return false;
    if (agent.agentAccountType === 'independent' || agent.agentAccountType === 'company_admin') return true;
    if (drillDownCompany && agent.agentAccountType === 'fleet_driver' && agent.companyId === drillDownCompany.id) return true;
    return false;
  });

  return (
    <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Collection Method</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">How would you like to get your materials to us?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setPickupMode('pickup')}
          className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'pickup' ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold leading-tight ${pickupMode === 'pickup' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Dispatch Agent</p>
            <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">We come to you</p>
          </div>
        </button>

        <button
          onClick={() => setPickupMode('dropoff')}
          className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'dropoff' ? 'border-primary bg-primary/10' : 'border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'dropoff' ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
            <Home className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold leading-tight ${pickupMode === 'dropoff' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>Self Drop-off</p>
            <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">Bring to a Hub</p>
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

        <div className="h-64 -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group">
          <MapContainer center={center as [number, number]} zoom={13} zoomControl={false} className="h-full w-full z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={center as [number, number]} />
            <Marker position={center as [number, number]} {...({ icon: userIcon } as any)} />

            {pickupMode === 'dropoff' ? (
              nearbyHubs.map((hub: any) => (
                <Marker key={hub.id} position={[hub.hubLocation?.latitude || hub.location?.latitude, hub.hubLocation?.longitude || hub.location?.longitude]} {...({ icon: hubIcon } as any)} eventHandlers={{ click: () => { setSelectedHub(hub); toast.success(`${hub.name || hub.companyName} Selected`); } }}>
                  {/* @ts-ignore */}
                  <Popup className="compact-popup">
                    <div className="p-1.5 text-center leading-tight min-w-[100px]">
                      <h4 className="text-[11px] font-bold text-slate-900 leading-tight truncate">{hub.companyName || hub.name}</h4>
                      <p className="text-[9px] font-semibold text-slate-500 mt-0.5 capitalize tracking-widest leading-tight truncate">{hub.hubAddress}</p>
                    </div>
                  </Popup>
                </Marker>
              ))
            ) : (
              <>
                {filteredAgents.map((agent: any, index: number) => {
                  const isCompany = agent.agentAccountType === 'company_admin';
                  const isSelected = selectedAgent?.id === agent.id || drillDownCompany?.id === agent.id;

                  // Anti-overlap map jitter logic
                  const baseLat = agent.location?.latitude || center[0];
                  const baseLng = agent.location?.longitude || center[1];
                  const hasDuplicate = filteredAgents.some((other: any, otherIdx: number) =>
                    otherIdx !== index &&
                    Math.abs((other.location?.latitude || center[0]) - baseLat) < 0.001 &&
                    Math.abs((other.location?.longitude || center[1]) - baseLng) < 0.001
                  );
                  let markerLat = baseLat;
                  let markerLng = baseLng;
                  if (hasDuplicate) {
                    const angle = (2 * Math.PI * index) / filteredAgents.length;
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
          </MapContainer>
        </div>
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
          {(selectedAgent || drillDownCompany) && (
            <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-primary/20 shadow-xl mt-3 animate-slide-up">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                    {drillDownCompany && !selectedAgent ? '🏢' : '🚛'}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-primary capitalize tracking-widest leading-none">
                      {drillDownCompany && !selectedAgent ? 'Fleet Hub Selected' : 'Targeting Agent'}
                    </p>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                      {selectedAgent ? selectedAgent.name : (drillDownCompany?.companyName || 'Selected Hub')}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAgent(null);
                    setDrillDownCompany(null);
                    toast.success("Selection Cleared");
                  }}
                  className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Fleet Drivers List for Selected Hub */}
          {drillDownCompany && !selectedAgent && (
            <div className="space-y-3 mt-4 animate-slide-up">
              <h3 className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Available Fleet Agents</h3>
              {liveAgents.filter((a: any) => a.agentAccountType === 'fleet_driver' && a.companyId === drillDownCompany.id).length > 0 ? (
                <div className="space-y-2">
                  {liveAgents.filter((a: any) => a.agentAccountType === 'fleet_driver' && a.companyId === drillDownCompany.id).map((agent: any) => (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(agent)}
                      className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary transition-all active:scale-95 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold dark:text-white leading-none mb-1">{agent.name || 'Fleet Agent'}</p>
                          <p className="text-[10px] font-semibold capitalize tracking-widest text-slate-400">
                            {agent.isOnline ? '🟢 Online' : '⚪ Offline'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  <p className="text-xs font-semibold text-slate-400">No agents currently available for this hub.</p>
                </div>
              )}
            </div>
          )}

          {/* Preferred Agent Search */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 shadow-sm mt-3.5 relative overflow-hidden">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Find an Agent by Phone
            </h2>
            
            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={agentSearchQuery}
                  placeholder="07XX..."
                  className={`w-full bg-slate-50 dark:bg-slate-900/50 py-3.5 pl-10 pr-4 rounded-xl border ${searchError ? 'border-red-300 dark:border-red-900/50 focus:border-red-500 focus:ring-red-200' : 'border-slate-200 dark:border-slate-700/50 focus:border-primary/50 focus:ring-primary/20'} text-sm font-semibold dark:text-white outline-none focus:ring-4 transition-all`}
                  onChange={(e) => {
                    setAgentSearchQuery(e.target.value);
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
              <div className="mt-5 border-t border-slate-100 dark:border-slate-700/50 pt-5">
                {searchedAgent ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border-2 border-white dark:border-slate-700 shadow-sm">
                        {searchedAgent.profile_photo ? (
                          <img src={searchedAgent.profile_photo} alt={searchedAgent.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-slate-500 dark:text-slate-400">{searchedAgent.full_name?.charAt(0) || 'A'}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{searchedAgent.full_name}</h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-black uppercase tracking-widest rounded-md">
                            {searchedAgent.agent_type === 'fleet_driver' ? 'Fleet Agent' : 'Independent'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary fill-primary" /> {searchedAgent.rating}</span>
                          <span>•</span>
                          <span>{searchedAgent.completed_pickups} Pickups</span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${searchedAgent.online ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            {searchedAgent.online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const agentAdapter = {
                          id: searchedAgent.id,
                          name: searchedAgent.full_name,
                          rating: searchedAgent.rating,
                          isOnline: searchedAgent.online,
                          agentAccountType: searchedAgent.agent_type,
                          avatarUrl: searchedAgent.profile_photo
                        };
                        setSelectedAgent(agentAdapter);
                        setDrillDownCompany(null);
                        setSearchAttempted(false);
                        setSearchedAgent(null);
                        setAgentSearchQuery('');
                        toast.success(`${searchedAgent.full_name} selected`);
                      }}
                      className="w-full mt-4 py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-colors"
                    >
                      Select Agent
                    </button>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4 px-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center mb-3">
                      <User className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                      No Klinflow pickup agent was found with that phone number.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            {/* ASAP BUTTON */}
            <button
              onClick={() => { selectTime({ time: 'ASAP', type: 'any', discount: 0, label: 'Agents available' }); setIsManualTime(false); }}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-primary border-primary ' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-primary/10'}`}>
                <Zap className={`w-5 h-5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                <p className={`text-[10px] font-bold mt-0.5 leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-400'}`}>First available agent</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'border-white bg-white' : 'border-slate-200'}`}>
                {!isManualTime && (selectedTime as any)?.time === 'ASAP' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
            </button>

            {/* SCHEDULE LATER */}
            <button
              onClick={() => setIsManualTime(true)}
              className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${isManualTime ? 'bg-slate-800 dark:bg-slate-800 border-slate-600 shadow-xl' : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-white/10'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isManualTime ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
                <Clock className={`w-5 h-5 ${isManualTime ? 'text-primary' : 'text-slate-400'}`} />
              </div>
              <div className="flex-1">
                <p className={`text-[13px] font-semibold leading-tight ${isManualTime ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Schedule Later</p>
                <p className={`text-[10px] font-bold mt-0.5 leading-tight ${isManualTime ? 'text-white/50' : 'text-slate-400'}`}>Pick a date & time</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isManualTime ? 'border-white bg-white' : 'border-slate-200'}`}>
                {isManualTime && <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />}
              </div>
            </button>
          </div>

          {isManualTime && pickupMode === 'pickup' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Date</span>
                <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Time</span>
                <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
