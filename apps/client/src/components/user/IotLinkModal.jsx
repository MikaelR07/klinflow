import { useState } from 'react';
import { X, QrCode, Cpu, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useIotStore } from '@cleanflow/core';
import { toast } from 'sonner';

export default function IotLinkModal({ show, onClose }) {
  const { linkDevice } = useIotStore();
  const [serial, setSerial] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [step, setStep] = useState('input'); // input, linking, success
  const [errorMsg, setErrorMsg] = useState('');

  if (!show) return null;

  const handleLink = async (e) => {
    if (e) e.preventDefault();
    if (!serial.trim()) return;

    setIsLinking(true);
    setStep('linking');
    setErrorMsg('');

    // Simulated short delay for "searching" feeling
    await new Promise(r => setTimeout(r, 1500));

    const result = await linkDevice(serial.trim());

    if (result.success) {
      setStep('success');
      toast.success('Device Linked!', { description: result.message });
      setTimeout(() => {
        onClose();
        setStep('input');
        setSerial('');
      }, 2000);
    } else {
      setStep('input');
      setErrorMsg(result.message);
      setIsLinking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border dark:border-slate-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'input' && (
            <div className="animate-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-semibold mb-2">Link New Device</h2>
              <p className="text-sm text-slate-500 mb-6">Enter the serial number found on your CleanFlow hardware or its packaging.</p>

              <form onSubmit={handleLink} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-1 mb-1.5 block">
                    Device Serial Number
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. BIN-1001"
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 font-mono text-lg focus:border-primary outline-none transition-all dark:text-white"
                      value={serial}
                      onChange={(e) => setSerial(e.target.value.toUpperCase())}
                    />
                    <Cpu className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  </div>
                  {errorMsg && (
                    <div className="mt-3 flex items-center gap-2 text-rose-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errorMsg}
                    </div>
                  )}
                </div>

                <button
                  disabled={!serial || isLinking}
                  className="w-full btn-primary py-4 rounded-2xl font-semibold uppercase tracking-widest shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isLinking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Claim Device'}
                </button>
              </form>
            </div>
          )}

          {step === 'linking' && (
            <div className="py-12 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-semibold">Verifying Device...</h3>
              <p className="text-sm text-slate-500">Contacting the CleanFlow Smart Grid</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-xl font-semibold">Handshake Complete!</h3>
              <p className="text-sm text-slate-500">Your device is now online and monitoring.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Activity = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
