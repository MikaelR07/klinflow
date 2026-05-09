import { useEffect, useState } from "react";
import { useIotStore, useAuthStore } from '@cleanflow/core';
import IotCard from "../../components/user/IotCard.jsx";
import IotDetailModal from "../../components/user/IotDetailModal.jsx";
import IotLinkModal from "../../components/user/IotLinkModal.jsx";
import { Radar, ShieldAlert, Cpu, ArrowRight, Activity, Zap, Plus, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyIotPage() {
  const { smartBins, airQuality, wastewater, isLoading, initDevices, stopDevices, pulseDevice } = useIotStore();
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  
  const [modalCurrentItem, setModalCurrentItem] = useState(null);
  const [modalCurrentType, setModalCurrentType] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const hasNoDevices = smartBins.length === 0 && airQuality.length === 0 && wastewater.length === 0;

  useEffect(() => {
    initDevices();
    return () => {
      stopDevices();
    };
  }, [initDevices, stopDevices]);

  const handleCardClick = (item, type) => {
    setModalCurrentItem(item);
    setModalCurrentType(type);
  };

  const closeModal = () => {
    setModalCurrentItem(null);
    setModalCurrentType(null);
  };

  const handleSimulate = async () => {
    const all = [...smartBins.map(b => ({id: b.id, type: 'bin'})), ...airQuality.map(a => ({id: a.id, type: 'air'})), ...wastewater.map(w => ({id: w.id, type: 'water'}))];
    if (all.length === 0) return;
    
    // Pick a random device to pulse
    const target = all[Math.floor(Math.random() * all.length)];
    if (target.type === 'bin') {
      await pulseDevice(target.id, { fillLevel: Math.floor(Math.random() * 100) });
    } else if (target.type === 'air') {
      await pulseDevice(target.id, { aqi: 40 + Math.floor(Math.random() * 150) });
    } else {
      await pulseDevice(target.id, { efficiency: 80 + Math.floor(Math.random() * 20) });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (hasNoDevices && !isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in relative">
        {/* Radar Pulse Visual */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping scale-[2]" />
          <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping delay-300 scale-[3]" />
          <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center z-10 border border-slate-100 dark:border-slate-700">
            <Radar className="w-10 h-10 text-primary animate-pulse" />
          </div>
          
          <div className="absolute -top-4 -right-4 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shadow-sm animate-bounce duration-[3s]">
            <Cpu className="w-5 h-5 text-amber-600" />
          </div>
          <div className="absolute -bottom-2 -left-6 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shadow-sm animate-bounce duration-[2s]">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white mb-3">IoT Grid Not Detected</h1>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
          Welcome {profile?.name || 'User'}. Your residence is not yet linked to the CleanFlow network.
        </p>

        <div className="w-full max-w-sm space-y-3">
          <button 
            onClick={() => setShowLinkModal(true)}
            className="w-full btn-primary p-4 flex items-center justify-center gap-3 group shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            Link Existing Device
          </button>

          <button 
            onClick={() => navigate('/settings/support')}
            className="w-full card p-4 flex items-center justify-between group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Services</p>
                <p className="text-sm font-semibold dark:text-white">Order Hardware</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        <IotLinkModal show={showLinkModal} onClose={() => setShowLinkModal(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white tracking-tight">Smart Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-widest">
            {profile?.location?.estate || 'Nairobi'} Live Grid
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSimulate}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95 shadow-sm"
            title="Simulate Telemetry Update"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={() => setShowLinkModal(true)}
            className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {smartBins.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            Smart Bins
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {smartBins.map(bin => (
              <IotCard key={bin.id} item={bin} type="bin" onClick={handleCardClick} />
            ))}
          </div>
        </section>
      )}

      {airQuality.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            Air Analytics
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {airQuality.map(aq => (
              <IotCard key={aq.id} item={aq} type="air" onClick={handleCardClick} />
            ))}
          </div>
        </section>
      )}

      {wastewater.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            Wastewater Ops
            <div className="h-px bg-slate-100 dark:bg-slate-800 flex-1"></div>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {wastewater.map(ww => (
              <IotCard key={ww.id} item={ww} type="water" onClick={handleCardClick} />
            ))}
          </div>
        </section>
      )}

      <IotDetailModal 
        show={!!modalCurrentItem} 
        item={modalCurrentItem} 
        type={modalCurrentType} 
        onClose={closeModal} 
      />

      <IotLinkModal show={showLinkModal} onClose={() => setShowLinkModal(false)} />
    </div>
  );
}
