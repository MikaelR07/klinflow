import React, { useState } from 'react';
import { 
  Truck, 
  Clock, 
  PackageCheck,
  Loader2,
  ShieldCheck,
  Plus,
  X,
  ChevronDown
} from 'lucide-react';
import { useThemeStore } from '@klinflow/core/stores/themeStore';
import { useNavigate } from 'react-router-dom';

interface Bay {
  id: number;
  status: 'Available' | 'Occupied' | 'Cleaning';
  assignedAgent?: string;
  assignedPlate?: string;
}

interface QueueItem {
  id: number;
  name: string;
  plate: string;
  material: string;
  waitMinutes: number;
}

export default function IntakeReceiving() {
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();
  
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bay management state
  const [bays, setBays] = useState<Bay[]>([
    { id: 1, status: 'Available' },
    { id: 2, status: 'Available' },
    { id: 3, status: 'Cleaning' },
    { id: 4, status: 'Available' },
  ]);

  // Queue state
  const [queue, setQueue] = useState<QueueItem[]>([
    { id: 1, name: 'Kamau Logistics', plate: 'KCE 4021X', material: 'Mixed Plastics', waitMinutes: 15 },
    { id: 2, name: 'Eco-Klect', plate: 'KDA 442G', material: 'PET & HDPE', waitMinutes: 30 },
    { id: 3, name: 'Green Movers', plate: 'KBZ 112W', material: 'Cardboard', waitMinutes: 45 },
    { id: 4, name: 'City Recyclers', plate: 'KCC 890J', material: 'Aluminium', waitMinutes: 60 },
  ]);

  // Which queue item has the bay dropdown open
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  const availableBays = bays.filter(b => b.status === 'Available');

  const handleAssignBay = (queueItemId: number, bayId: number) => {
    const agent = queue.find(q => q.id === queueItemId);
    if (!agent) return;

    // Update bay to Occupied
    setBays(prev => prev.map(b => 
      b.id === bayId 
        ? { ...b, status: 'Occupied' as const, assignedAgent: agent.name, assignedPlate: agent.plate }
        : b
    ));

    // Remove from queue
    setQueue(prev => prev.filter(q => q.id !== queueItemId));
    setOpenDropdownId(null);
  };

  const handleReleaseBay = (bayId: number) => {
    setBays(prev => prev.map(b => 
      b.id === bayId ? { ...b, status: 'Available' as const, assignedAgent: undefined, assignedPlate: undefined } : b
    ));
  };

  const handleSetCleaning = (bayId: number) => {
    setBays(prev => prev.map(b => 
      b.id === bayId ? { ...b, status: 'Cleaning' as const, assignedAgent: undefined, assignedPlate: undefined } : b
    ));
  };

  const handleFinishCleaning = (bayId: number) => {
    setBays(prev => prev.map(b => 
      b.id === bayId ? { ...b, status: 'Available' as const } : b
    ));
  };

  const handleAddBay = () => {
    const nextId = bays.length > 0 ? Math.max(...bays.map(b => b.id)) + 1 : 1;
    setBays(prev => [...prev, { id: nextId, status: 'Available' as const }]);
  };

  const handleRemoveBay = (bayId: number) => {
    const bay = bays.find(b => b.id === bayId);
    if (bay?.status === 'Occupied') return; // Can't remove occupied bay
    setBays(prev => prev.filter(b => b.id !== bayId));
  };

  // PIN logic
  const handleKeypadPress = (num: string) => {
    if (pinInput.length < 4) {
      setPinInput(prev => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setError(null);
  };

  const handlePinSubmit = () => {
    if (pinInput.length !== 4) return;
    setIsVerifying(true);
    setError(null);

    setTimeout(() => {
      const agentPayload = {
        agentName: 'Eco-Klect Logistics',
        agentId: 'AGT-0042',
        totalClaimedWeight: 450.5,
        totalAmountPaidToday: 12400,
        materials: [
          { id: 'm1', materialId: '48201537', category: 'Plastics', subcategory: 'PET Clear', weight: 120, amountPaid: 3600, sellerName: 'Mama Wanjiku', collectedAt: '2026-06-20T08:15:00Z', sourcingTag: 'Individual RFQ', isManual: false },
          { id: 'm2', materialId: '73940216', category: 'Plastics', subcategory: 'HDPE Rigid', weight: 85.5, amountPaid: 2565, sellerName: 'Kamau Scrap Dealers', collectedAt: '2026-06-20T09:30:00Z', sourcingTag: 'Group RFQ', isManual: false },
          { id: 'm3', materialId: '91625084', category: 'Paper', subcategory: 'OCC Cardboard', weight: 95, amountPaid: 1900, sellerName: 'Umoja Estate Residents', collectedAt: '2026-06-20T10:45:00Z', sourcingTag: 'Community Pickup', isManual: true },
          { id: 'm4', materialId: '35718492', category: 'Metals', subcategory: 'Aluminium Cans', weight: 50, amountPaid: 2500, sellerName: 'Otieno Jua Kali', collectedAt: '2026-06-20T11:20:00Z', sourcingTag: 'Individual RFQ', isManual: false },
          { id: 'm5', materialId: '60283947', category: 'Plastics', subcategory: 'PP Mixed', weight: 100, amountPaid: 1835, sellerName: 'Dandora Recyclers Coop', collectedAt: '2026-06-20T12:00:00Z', sourcingTag: 'Group RFQ', isManual: true },
        ],
      };

      setIsVerifying(false);
      navigate('/operations/intake/verify', { state: { agentData: agentPayload } });
    }, 1200);
  };

  const getBayStyle = (status: Bay['status']) => {
    if (status === 'Occupied') return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400';
    if (status === 'Cleaning') return 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400';
    return 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500';
  };

  return (
    <div className="p-6 md:p-8 w-full max-w-[1600px] mx-auto space-y-8">
      
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Manual Intake & Receiving</h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PIN-based agent check-in and manual floor scale reconciliation.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* ── LEFT COLUMN: PIN Keypad ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="font-medium w-8 h-8 text-emerald-500" />
              </div>
              <h2 className={`text-xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Gate Verification</h2>
              <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Enter the Agent's 4-digit PIN to load their cargo manifest.</p>
            </div>

            {/* PIN Display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className={`w-14 h-16 rounded-2xl flex items-center justify-center text-3xl font-medium transition-all ${
                  pinInput.length > index 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110' 
                    : (isDarkMode ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-300')
                }`}>
                  {pinInput[index] || '·'}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">{error}</p>
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num} 
                  onClick={() => handleKeypadPress(num.toString())}
                  className={`h-14 rounded-2xl border text-xl font-medium active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={handleDelete}
                className={`h-14 rounded-2xl border text-sm font-medium uppercase tracking-wider active:scale-95 transition-all ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'}`}
              >
                DEL
              </button>
              <button 
                onClick={() => handleKeypadPress('0')}
                className={`h-14 rounded-2xl border text-xl font-medium active:scale-95 transition-all ${isDarkMode ? 'bg-slate-800 border-white/5 text-white hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                0
              </button>
              <button 
                onClick={handlePinSubmit}
                disabled={isVerifying || pinInput.length !== 4}
                className="h-14 rounded-2xl bg-emerald-500 text-white font-medium active:scale-95 transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center disabled:opacity-50"
              >
                {isVerifying ? <Loader2 className="w-6 h-6 animate-spin" /> : 'GO'}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Bays, Queue & Summary ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Receiving Bays */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Receiving Bays</h3>
              <button 
                onClick={handleAddBay}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
              >
                <Plus className="w-3.5 h-3.5" /> Add Bay
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {bays.map((bay) => (
                <div key={bay.id} className={`p-4 rounded-2xl border ${getBayStyle(bay.status)} flex flex-col items-center justify-center text-center relative group`}>
                  
                  {/* Remove button (only for non-occupied bays) */}
                  {bay.status !== 'Occupied' && (
                    <button 
                      onClick={() => handleRemoveBay(bay.id)}
                      className="font-medium absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 hover:bg-rose-500/10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}

                  <span className="font-medium text-lg mb-1">Bay {String(bay.id).padStart(2, '0')}</span>
                  <span className="text-[10px] uppercase tracking-wider font-medium opacity-80 mb-2">{bay.status}</span>
                  
                  {bay.status === 'Occupied' && bay.assignedAgent && (
                    <>
                      <div className="flex items-center gap-1 text-xs font-medium bg-white/50 dark:bg-black/20 px-2 py-1 rounded mb-2">
                        <Truck className="w-3 h-3" /> {bay.assignedPlate}
                      </div>
                      <p className="text-[10px] font-medium opacity-70 mb-2">{bay.assignedAgent}</p>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleReleaseBay(bay.id)}
                          className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                        >
                          Release
                        </button>
                        <button 
                          onClick={() => handleSetCleaning(bay.id)}
                          className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
                        >
                          Clean
                        </button>
                      </div>
                    </>
                  )}

                  {bay.status === 'Cleaning' && (
                    <button 
                      onClick={() => handleFinishCleaning(bay.id)}
                      className="text-[9px] font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Arrival Queue */}
          <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Arrival Queue</h3>
              <span className="px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
                {queue.length} Waiting
              </span>
            </div>
            {queue.length === 0 ? (
              <div className={`p-8 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'border-white/5' : 'border-slate-200'}`}>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No agents in queue. They will appear here after check-in.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map((item, i) => (
                  <div key={item.id} className={`p-3 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-medium ${i === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-950 text-slate-500'}`}>
                        #{i + 1}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.plate} • {item.material}</p>
                      </div>
                    </div>
                    <div className="text-right relative">
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium justify-end mb-1">
                        <Clock className="w-3 h-3" /> {item.waitMinutes}m wait
                      </div>
                      
                      {/* Assign Bay Button */}
                      {availableBays.length > 0 ? (
                        <div className="relative">
                          <button 
                            onClick={() => setOpenDropdownId(openDropdownId === item.id ? null : item.id)}
                            className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            Assign Bay <ChevronDown className={`w-3 h-3 transition-transform ${openDropdownId === item.id ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {/* Bay Dropdown */}
                          {openDropdownId === item.id && (
                            <div className={`absolute right-0 top-full mt-1 z-20 w-36 rounded-xl border shadow-xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                              {availableBays.map(bay => (
                                <button
                                  key={bay.id}
                                  onClick={() => handleAssignBay(item.id, bay.id)}
                                  className={`w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-emerald-50 text-slate-900'}`}
                                >
                                  <span>Bay {String(bay.id).padStart(2, '0')}</span>
                                  <span className="font-medium text-[9px] text-emerald-500 uppercase tracking-wider">Open</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] font-medium text-amber-500 uppercase">No bays free</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Intake Summary */}
          <div className={`p-6 rounded-3xl border flex gap-6 overflow-x-auto ${isDarkMode ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="shrink-0">
              <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Today's Intake</p>
              <p className={`text-3xl font-medium tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>142.5T</p>
            </div>
            <div className={`w-px ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`} />
            <div className="flex gap-8">
              <div>
                <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><span className="w-2 h-2 rounded-full bg-blue-500" /> PET Clear</p>
                <p className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>64.2T</p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><span className="w-2 h-2 rounded-full bg-amber-500" /> HDPE</p>
                <p className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>45.8T</p>
              </div>
              <div>
                <p className={`text-xs font-medium mb-1 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><span className="w-2 h-2 rounded-full bg-slate-500" /> Cardboard</p>
                <p className={`font-mono font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>32.5T</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
