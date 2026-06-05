import { Truck, Home, Star, Zap, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { toast } from 'sonner';

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
  return (
    <motion.div key="p3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-12">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">Collection Method</h2>
        <p className="text-sm font-medium text-slate-500 leading-tight">How would you like to get your materials to us?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setPickupMode('pickup')}
          className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'pickup' ? 'border-emerald-500 bg-emerald-50/10 shadow-lg shadow-emerald-500/5' : 'border-slate-200 bg-white'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'pickup' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <Truck className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold leading-tight ${pickupMode === 'pickup' ? 'text-emerald-600' : 'text-slate-900'}`}>Dispatch Agent</p>
            <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">We come to you</p>
          </div>
        </button>

        <button
          onClick={() => setPickupMode('dropoff')}
          className={`p-3.5 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${pickupMode === 'dropoff' ? 'border-emerald-500 bg-emerald-50/10' : 'border-slate-200 bg-white'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pickupMode === 'dropoff' ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <Home className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className={`text-xs font-bold leading-tight ${pickupMode === 'dropoff' ? 'text-emerald-600' : 'text-slate-900'}`}>Self Drop-off</p>
            <p className="text-[10px] font-semibold text-slate-400 capitalize tracking-widest mt-0.5">Bring to a Hub</p>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight capitalize tracking-widest">Market Demand</h3>
            {drillDownCompany && (
              <div className="flex items-center gap-1 mt-0.5">
                <button onClick={() => setDrillDownCompany(null)} className="text-xs font-bold text-indigo-600 capitalize hover:underline">All Agents</button>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xs font-bold text-slate-500 capitalize">{drillDownCompany.companyName || drillDownCompany.name}</span>
              </div>
            )}
          </div>
          {liveWeavers?.length > 0 && (
            <div className="flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-600 capitalize tracking-widest">{liveWeavers.length} Collectors Nearby</span>
            </div>
          )}
        </div>
        <div className="h-64 -mx-3.5 w-auto rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-800 relative  group">
          <MapContainer center={center as [number, number]} zoom={13} zoomControl={false} className="h-full w-full z-0">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ChangeView center={center as [number, number]} />
            <Marker position={center as [number, number]} {...({ icon: userIcon } as any)} />

            {pickupMode === 'dropoff' ? (
              nearbyHubs.map((hub: any) => (
                <Marker key={hub.id} position={[hub.hubLocation.lat, hub.hubLocation.lng]} {...({ icon: hubIcon } as any)} eventHandlers={{ click: () => { setSelectedHub(hub); toast.success(`${hub.name || hub.companyName} Selected`); } }}>
                  {/* @ts-ignore */}
                  <Popup className="compact-popup">
                    <div className="p-3 text-center">
                      <h4 className="text-xs font-semibold text-slate-900">{hub.name || hub.companyName}</h4>
                      <p className="text-xs text-slate-500 mt-1 capitalize tracking-widest">{hub.hubAddress}</p>
                      <p className="text-xs font-semibold text-emerald-500 mt-1">{hub.distance.toFixed(1)}km away</p>
                    </div>
                  </Popup>
                </Marker>
              ))
            ) : (
              <>
                {/* Drill-down View Logic */}
                {drillDownCompany ? (
                  // Show only agents belonging to this company
                  liveAgents.filter((a: any) => a.companyId === drillDownCompany.id && !a.isHubActive).map((agent: any) => (
                    <Marker key={agent.id} position={[agent.location?.latitude || center[0], agent.location?.longitude || center[1]]} {...({ icon: agentIcon(selectedAgent?.id === agent.id) } as any)} eventHandlers={{ click: () => { setSelectedAgent(agent); toast.success(`Fleet Agent Targeted`); } }}>
                      <Popup className="compact-popup"><div className="p-1 px-2 min-w-[80px] text-center"><h4 className="text-xs font-semibold text-slate-900 leading-tight">{agent.name || 'Agent'}</h4><div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 capitalize"><Star className="w-2 h-2 fill-emerald-500" /><span>4.9</span></div></div></Popup>
                    </Marker>
                  ))
                ) : (
                  <>
                    {/* Initial View: Independent Agents & Company Markers */}
                    {liveAgents.filter((a: any) => !a.isHubActive).reduce((acc: any[], agent: any) => {
                      if (agent.agentAccountType === 'company_admin' || (agent.role === 'agent' && !agent.companyId)) {
                        acc.push(agent);
                      }
                      return acc;
                    }, [] as any[]).map((entity: any) => {
                      const isCompany = entity.agentAccountType === 'company_admin';
                      return (
                        <Marker
                          key={entity.id}
                          position={[entity.location?.latitude || center[0], entity.location?.longitude || center[1]]}
                          {...({ icon: isCompany ? companyIcon(drillDownCompany?.id === entity.id) : agentIcon(selectedAgent?.id === entity.id) } as any)}
                          eventHandlers={{
                            click: () => {
                              if (isCompany) {
                                setDrillDownCompany(entity);
                                toast(`Showing ${entity.companyName || entity.name}'s Fleet`, { icon: '🏢' });
                              } else {
                                setSelectedAgent(entity);
                                toast.success(`Independent Agent Targeted`);
                              }
                            }
                          }}
                        >
                          {/* @ts-ignore */}
                          <Popup className="compact-popup">
                            <div className="p-1 px-2 min-w-[80px] text-center">
                              <h4 className="text-xs font-semibold text-slate-900 leading-tight">{isCompany ? (entity.companyName || entity.name) : (entity.name || 'Agent')}</h4>
                              <div className="flex items-center justify-center gap-0.5 mt-0.5 text-xs font-semibold text-emerald-500 capitalize">
                                {isCompany ? <span>VIEW FLEET</span> : <><Star className="w-2 h-2 fill-emerald-500" /><span>4.9</span></>}
                              </div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {pickupMode === 'dropoff' ? (
        <div className="space-y-3">
          {selectedHub ? (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg"><Home className="w-8 h-8" /></div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold dark:text-white">{selectedHub.name || selectedHub.companyName}</h3>
                <p className="text-xs font-semibold text-emerald-600 capitalize tracking-widest mt-1">Drop-off: {selectedHub.hubAddress} ({selectedHub.distance.toFixed(1)}km)🏢</p>
              </div>
              <button onClick={() => setSelectedHub(null)} className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs">Change</button>
            </div>
          ) : (
            <div className="p-8 border-2 border-dashed border-emerald-500/20 rounded-2xl text-center bg-emerald-50/10">
              <Home className="w-10 h-10 text-emerald-500 mx-auto mb-3 animate-bounce-slow" />
              <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Select the nearest Hub on the map</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* SELECTED AGENT CARD (with deselect) */}
          {selectedAgent ? (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg text-lg">🚛</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{selectedAgent.name || 'Agent'}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-emerald-600 capitalize">
                    <Star className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
                    <span>4.9</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Targeted</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedAgent(null); toast('Agent deselected', { icon: '🔄' }); }}
                className="p-2 px-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 font-semibold text-xs capitalize tracking-widest active:scale-95 transition-all"
              >
                Change
              </button>
            </motion.div>
          ) : (
            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center bg-slate-50/50 dark:bg-slate-800/50">
              <p className="text-xs font-semibold text-slate-400 capitalize tracking-widest">Tap an agent on the map to target (optional)</p>
            </div>
          )}

          {/* ASAP BUTTON */}
          <button
            onClick={() => { selectTime({ time: 'ASAP', type: 'any', discount: 0, label: 'Agents available' }); setIsManualTime(false); }}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-primary border-primary ' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/5'}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'bg-white/20' : 'bg-emerald-600/10'}`}>
              <Zap className={`w-5 h-5 ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white' : 'text-slate-900 dark:text-white'}`}>ASAP</p>
              <p className={`text-[10px] font-bold mt-0.5 leading-tight ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'text-white/70' : 'text-slate-400'}`}>First available agent</p>
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!isManualTime && (selectedTime as any)?.time === 'ASAP' ? 'border-white bg-white' : 'border-slate-200'}`}>
              {!isManualTime && (selectedTime as any)?.time === 'ASAP' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />}
            </div>
          </button>

          {/* SCHEDULE LATER */}
          <button
            onClick={() => setIsManualTime(true)}
            className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3.5 ${isManualTime ? 'bg-slate-900 dark:bg-slate-700 border-slate-900 ' : 'bg-white dark:bg-slate-800 border-dashed border-slate-200 dark:border-white/10'}`}
          >
            <div className={`w-14 h-14 rounded-3xl flex items-center justify-center shrink-0 ${isManualTime ? 'bg-white/10' : 'bg-slate-50 dark:bg-slate-800'}`}>
              <Clock className={`w-5 h-5 ${isManualTime ? 'text-emerald-600' : 'text-slate-400'}`} />
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
      )}

      {isManualTime && pickupMode === 'pickup' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-white/5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Date</span>
            <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 capitalize tracking-widest ml-1">Time</span>
            <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900/70 p-4 rounded-xl text-xs font-semibold dark:text-white outline-none" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
