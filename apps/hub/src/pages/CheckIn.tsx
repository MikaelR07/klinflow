import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Truck, 
  Scale,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { normalizeKeys, Asset, Profile } from '@klinflow/core/validation';
import { toast } from 'sonner';

interface IncomingAgentData {
  id: string;
  name: string;
  weight: number;
  materials: string;
  hasManualFlag: boolean;
  allAssets: Asset[];
}

export default function CheckIn() {
  const { profile } = useAuthStore();
  const [step, setStep] = useState(1); // 1: PIN Input, 2: Verify, 3: Success
  const [pinInput, setPinInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [agentData, setAgentData] = useState<IncomingAgentData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (pinInput.length !== 4) {
      toast.error("Invalid PIN", { description: "The PIN must be exactly 4 digits." });
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Find the agent by PIN
      const { data: agents, error: fetchError } = await ((supabase
        .from('profiles') as any)
        .select(`
          *, 
          assets:assets!verifier_id(
            id, 
            weight_kg, 
            material_type, 
            grade, 
            is_manual,
            status
          )
        `)
        .eq('is_en_route', true)
        .eq('hub_transfer_pin', pinInput));
      
      if (fetchError) throw fetchError;

      if (agents && agents.length > 0) {
        const agentRaw = agents[0];
        const agent = normalizeKeys(agentRaw) as Profile & { assets: any[] };
        
        const enRouteAssets = (agent.assets || []).map(a => normalizeKeys(a) as Asset).filter(a => 
          ['verified', 'collected', 'in_transit'].includes(a.status)
        );
        
        const totalWeight = enRouteAssets.reduce((acc, a) => acc + (Number(a.weightKg) || 0), 0);
        const materials = Array.from(new Set(enRouteAssets.map(a => a.materialType))).join(', ');
        const hasManual = enRouteAssets.some(a => a.isManual);
        
        setError(null);
        setAgentData({
          id: agent.id,
          name: agent.name || 'Anonymous Agent',
          weight: totalWeight,
          materials: materials || 'Mixed Recyclables',
          hasManualFlag: hasManual,
          allAssets: enRouteAssets
        });
        setStep(2);
      } else {
        setError("Invalid PIN. No incoming agent found with that code.");
        setPinInput(''); // Reset for retry
      }
    } catch (err) {
      console.error(err);
      toast.error("Verification Error", { description: "Failed to securely verify the PIN." });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (num: string) => {
    if (pinInput.length < 4) setPinInput(prev => prev + num);
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleFinalVerify = async () => {
    if (!agentData || !profile) return;
    setIsProcessing(true);
    try {
      const assetIds = agentData.allAssets.map(a => a.id);
      
      if (assetIds.length > 0) {
        const { error: assetError } = await (supabase
          .from('assets')
          .update({ 
            status: 'transferred_to_hub',
            hub_manager_id: profile.id
          } as any)
          .in('id', assetIds) as any);
          
        if (assetError) throw assetError;
      }
      
      const { error: profileError } = await (supabase
        .from('profiles')
        .update({ is_en_route: false, hub_transfer_pin: null } as any)
        .eq('id', agentData.id) as any);

      if (profileError) throw profileError;

      toast.success("Cargo Received!", { description: `Successfully transferred to Hub Inventory.` });
      setStep(3);
    } catch (err) {
      toast.error("Transfer failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setPinInput('');
    setAgentData(null);
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-fade-in pb-10">
      
      {/* ── PROGRESS STEPS ── */}
      <div className="flex items-center justify-between px-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step >= s ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'
            }`}>
              {s}
            </div>
            {s < 3 && (
              <div className={`w-16 h-1 bg-slate-100 dark:bg-white/5 mx-2 rounded-full overflow-hidden`}>
                <div className={`h-full bg-primary transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="text-center space-y-8 animate-fade-in">
           <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Gate Verification</h1>
              <p className="text-sm text-slate-500 font-semibold mt-2">Enter the secure 4-digit PIN provided by the Agent.</p>
           </div>

           <div className="glass p-8 rounded-[3rem] max-w-sm mx-auto shadow-sm">
             <div className="flex items-center justify-center gap-4 mb-8">
               {[0, 1, 2, 3].map((index) => (
                 <div key={index} className={`w-14 h-16 rounded-2xl flex items-center justify-center text-3xl font-semibold transition-all ${
                   pinInput.length > index 
                     ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                     : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                 }`}>
                   {pinInput[index] || '·'}
                 </div>
               ))}
             </div>

             {error && (
               <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl animate-shake text-center">
                 <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-widest">{error}</p>
               </div>
             )}

             <div className="grid grid-cols-3 gap-3 mb-6">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                 <button 
                   key={num} 
                   onClick={() => handleKeypadPress(num.toString())}
                   className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-xl font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all shadow-sm"
                 >
                   {num}
                 </button>
               ))}
               <button 
                 onClick={handleDelete}
                 className="h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 font-semibold active:scale-95 transition-all shadow-sm flex items-center justify-center"
               >
                 DEL
               </button>
               <button 
                 onClick={() => handleKeypadPress('0')}
                 className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-xl font-semibold text-slate-700 dark:text-slate-300 active:scale-95 transition-all shadow-sm"
               >
                 0
               </button>
               <button 
                 onClick={handlePinSubmit}
                 disabled={isVerifying || pinInput.length !== 4}
                 className="h-16 rounded-2xl bg-primary text-white font-semibold active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50"
               >
                 {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'GO'}
               </button>
             </div>
           </div>
        </div>
      )}

      {step === 2 && agentData && (
        <div className="space-y-6 animate-slide-up">
           <div className="glass p-8 rounded-[3rem] border-2 border-primary/20">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                    <Truck className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white leading-none">Agent Authenticated</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-1 uppercase tracking-widest">{agentData.name}</p>
                 </div>
              </div>

              {agentData.hasManualFlag && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 animate-pulse-soft">
                  <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-widest leading-none mb-1">Manual Verification Detected</p>
                    <p className="text-[11px] font-semibold text-red-800 dark:text-red-300 leading-tight">This cargo was NOT graded by AI. Physical inspection required for inventory accuracy.</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                  <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-white/5">
                     <div className="flex items-center gap-3">
                        <div className="font-medium p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                           <Scale className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Incoming Total</p>
                           <p className="text-xl font-semibold text-slate-900 dark:text-white">{agentData.weight.toFixed(1)} KG</p>
                        </div>
                     </div>
                  </div>

                  {/* 📦 Detailed Cargo Breakdown */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-[0.2em] mb-4">Cargo Breakdown</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {agentData.allAssets.map((asset, idx) => (
                        <div key={asset.id || idx} className="p-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-xs ${
                              asset.isManual ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                            }`}>
                              {asset.materialType.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{asset.materialType} ({asset.grade})</p>
                              <p className="text-xs text-slate-500 font-semibold uppercase">{asset.weightKg} KG</p>
                            </div>
                          </div>
                          
                          {asset.isManual ? (
                            <span className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold uppercase rounded-lg border border-red-100 dark:border-red-900/30 flex items-center gap-1.5 animate-pulse-soft">
                              <ShieldAlert className="w-3 h-3" /> Manual
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase rounded-lg border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3" /> AI Verified
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                 <div className="flex items-center justify-between mb-6">
                   <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Action</p>
                   <p className="text-sm font-semibold text-slate-500">Log Physical Inventory</p>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button 
                      disabled={isProcessing}
                      onClick={handleReset}
                      className="py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-2xl font-semibold text-xs uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      disabled={isProcessing}
                      onClick={handleFinalVerify}
                      className="py-4 bg-primary text-white rounded-2xl font-semibold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Receive'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-8 animate-bounce-in">
           <div className="relative w-32 h-32 mx-auto">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="relative w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/40">
                 <ShieldCheck className="font-medium w-16 h-16 text-white" />
              </div>
           </div>
 
           <div>
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white leading-none">Cargo Received!</h1>
              <p className="text-sm text-slate-500 font-semibold mt-3">The cargo has been officially added to your Hub inventory.</p>
           </div>
 
           {/* 📄 DIGITAL WAYBILL */}
           <div className="glass p-8 rounded-[3rem] text-left space-y-6 relative overflow-hidden border-2 border-primary/10">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                 <ShieldCheck className="w-24 h-24 text-primary" />
              </div>

              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Secure Audit Waybill</p>
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">ID: #{Math.random().toString(36).substring(7).toUpperCase()}</h3>
                 </div>
                 <div className="px-3 py-1 bg-primary/10 rounded-lg">
                    <span className="text-xs font-semibold text-primary uppercase tracking-widest">Verified</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-white/5">
                 <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Total Weight Received</p>
                    <p className="text-2xl font-semibold text-primary">
                       {agentData?.weight?.toFixed(1)} KG
                    </p>
                 </div>
                 <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Material Count</p>
                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{agentData?.allAssets?.length} Units</p>
                 </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="font-medium w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Audit logged successfully</span>
                 </div>
              </div>
           </div>
 
           <button 
             onClick={handleReset}
             className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-semibold text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl"
           >
             Ready for Next Driver
           </button>
        </div>
      )}

    </div>
  );
}
