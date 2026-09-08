/**
 * BookPickup Step 2 — Agent Map, Fleet Drill-Down, Time Selection
 * Extracted from BookPickup.tsx for modularity.
 */
import { useState } from 'react';
import {
  Zap, Star, ChevronRight, X, Clock, Truck, AlertCircle, Search, Loader2, User, ShieldCheck
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@klinflow/supabase';
import type { BookPickupAgent } from './bookPickup.types';

interface BookPickupAgentStepProps {
  center: [number, number];
  userIcon: any;
  filteredAgents: BookPickupAgent[];
  liveAgents: BookPickupAgent[];
  selectedAgent: any;
  setSelectedAgent: (a: any) => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
  agentIcon: (isSelected: boolean, isCompany?: boolean) => any;
  aiSuggestions: any[];
  selectedTime: any;
  selectTime: (t: any) => void;
  isManualTime: boolean;
  setIsManualTime: (v: boolean) => void;
  customDate: string;
  setCustomDate: (d: string) => void;
  customTime: string;
  setCustomTime: (t: string) => void;
}

export default function BookPickupAgentStep({
  center, userIcon, filteredAgents, liveAgents,
  selectedAgent, setSelectedAgent,
  selectedCompanyId, setSelectedCompanyId,
  agentIcon, aiSuggestions, selectedTime, selectTime,
  isManualTime, setIsManualTime,
  customDate, setCustomDate, customTime, setCustomTime
}: BookPickupAgentStepProps) {
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
        if (data[0].agent_account_type === 'fleet_driver') {
          setSearchError('Fleet Agents cannot be booked directly. Please search for their Hub.');
          setSearchedAgent(null);
        } else {
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
        }
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

  return (
    <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight italic leading-tight">
              {selectedCompanyId ? `Fleet Dispatch` : 'Nearby\nPartners'}
            </h2>
            {selectedCompanyId && (
              <div className="flex items-center gap-2 mt-1">
                <button onClick={() => setSelectedCompanyId(null)} className="text-xs font-semibold text-primary capitalize bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">Clear Selection ✕</button>
              </div>
            )}
          </div>
        </div>

        {filteredAgents?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-20"></div>
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-xs font-semibold capitalize tracking-widest text-primary mb-0.5">Collectors Nearby</h4>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-tight">
                {filteredAgents.length} {filteredAgents.length === 1 ? 'collector' : 'collectors'} found in your area.
              </p>
            </div>
          </motion.div>
        )}

        <div className="h-64 -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative shadow-sm group">
          <MapContainer center={center as [number, number]} zoom={13} zoomControl={false} className="h-full w-full z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={center as any} {...({ icon: userIcon } as any)} />

            {filteredAgents.map((agent, index) => {
              const isCompany = agent.agentAccountType === 'company_admin';
              const isSelected = selectedAgent?.id === agent.id || selectedCompanyId === agent.id;

              // Offset overlapping markers so they fan out instead of stacking
              const baseLat = agent.location?.latitude || center[0];
              const baseLng = agent.location?.longitude || center[1];
              const hasDuplicate = filteredAgents.some((other, otherIdx) =>
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
                  {...({ icon: agentIcon(isSelected, isCompany) } as any)}
                  eventHandlers={{
                    click: () => {
                      if (isCompany) {
                        setSelectedCompanyId(agent.companyId);
                        toast.success(`Hub Selected`);
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
                      <div className="flex items-center justify-center gap-0.5 text-xs font-semibold text-emerald-500 capitalize mt-0.5">
                        <Star className="w-2 h-2 fill-emerald-500" />
                        <span>{agent.rating?.toFixed(1) || '4.9'}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* Active Selection Cards */}
        {(selectedAgent || selectedCompanyId) && (
          <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-primary/20 shadow-xl mt-3 animate-slide-up">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  {selectedCompanyId && !selectedAgent ? '🏢' : '🚛'}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-primary capitalize tracking-widest leading-none">
                    {selectedCompanyId && !selectedAgent ? 'Fleet Hub Selected' : 'Targeting Agent'}
                  </p>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white mt-1">
                    {selectedAgent ? selectedAgent.name : (liveAgents.find(a => a.companyId === selectedCompanyId && a.agentAccountType === 'company_admin')?.companyName || 'Selected Hub')}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedAgent(null);
                  setSelectedCompanyId(null);
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
        {selectedCompanyId && !selectedAgent && (
          <div className="space-y-3 mt-4 animate-slide-up">
            <h3 className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Available Fleet Agents</h3>
            {liveAgents.filter(a => a.agentAccountType === 'fleet_driver' && a.companyId === selectedCompanyId).length > 0 ? (
              <div className="space-y-2">
                {liveAgents.filter(a => a.agentAccountType === 'fleet_driver' && a.companyId === selectedCompanyId).map(agent => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="w-full flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary transition-all active:scale-95 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
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
      </div>

      {/* Unified Search & Booking Actions Card */}
      <div className="bg-slate-200 dark:bg-slate-800/60 p-5 rounded-[1.5rem] border border-slate-300/50 dark:border-slate-700/50 shadow-sm mt-3.5 space-y-6">
          
          {/* Find by Klin-ID Section */}
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
                            {searchedAgent.agent_type === 'company_admin' ? 'Enterprise' : 'Independent'}
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
                          This agent is currently offline. You can select them, but you will only be able to schedule a pickup for later.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        const isHub = searchedAgent.agent_type === 'company_admin';
                        if (isHub) {
                          setSelectedCompanyId(searchedAgent.company_id || searchedAgent.id);
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
                          setSelectedCompanyId(null);
                        }
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
                      No Klinflow pickup agent was found with that ID.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-slate-300/70 dark:bg-slate-700/50" />

          {/* Time Selection Section (ASAP / Schedule) */}
          {aiSuggestions.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                {/* SMART ASAP BUTTON */}
                <button
                  disabled={selectedAgent && !selectedAgent.isOnline}
                  onClick={() => { selectTime({ time: 'ASAP', type: 'asap' }); setIsManualTime(false); }}
                  className={`w-full p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center gap-1.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-primary border-primary ' : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'} ${(selectedAgent && !selectedAgent.isOnline) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-primary/10'}`}>
                    <Zap className={`w-4 h-4 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
                    <p className={`text-[9px] font-semibold uppercase tracking-widest ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-500'}`}>
                      Available Now
                    </p>
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
            </>
          ) : (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-8 rounded-3xl border border-orange-100 dark:border-orange-900/30 text-center space-y-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-2xl flex items-center justify-center mx-auto text-orange-500"><AlertCircle className="w-6 h-6" /></div>
              <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-200 capitalize tracking-widest">No Agents Online</h3>
              <p className="text-[11px] font-semibold text-orange-700/70 dark:text-orange-400/70 leading-relaxed">All agents are currently offline. You can schedule a pickup for later!</p>
              <button onClick={() => setIsManualTime(true)} className="px-6 py-3 bg-orange-500 text-white rounded-xl text-xs font-semibold capitalize tracking-widest shadow-lg shadow-orange-500/20">Schedule a Pickup</button>
            </div>
          )}

          {/* Custom Time Picker */}
          {isManualTime && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4 shadow-sm">
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
    </motion.div>
  );
}
