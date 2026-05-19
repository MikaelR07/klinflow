/**
 * Voice Booking Assistant Modal
 * Simulates voice recognition for booking pickup in Swahili/English
 */
import { Mic, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useBookingStore, WASTE_TYPES } from '@klinflow/core';

const stepConfig = {
  idle: { bg: 'bg-slate-50 dark:bg-slate-800/50', ring: '' },
  listening: { bg: 'bg-red-50 dark:bg-red-900/20', ring: 'ring-4 ring-red-200 dark:ring-red-900/30 animate-pulse-soft' },
  processing: { bg: 'bg-blue-50 dark:bg-blue-900/20', ring: 'ring-4 ring-blue-200 dark:ring-blue-900/30' },
  done: { bg: 'bg-green-50 dark:bg-green-900/20', ring: 'ring-4 ring-green-200 dark:ring-green-900/30' },
};

export default function VoiceBookingModal() {
  const { voiceModalOpen, closeVoiceModal, voiceStep, voiceResult, startVoiceRecognition } = useBookingStore();

  if (!voiceModalOpen) return null;

  const cfg = stepConfig[voiceStep];
  const wasteLabel = voiceResult ? WASTE_TYPES.find((w) => w.id === voiceResult.wasteType)?.label : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={closeVoiceModal}>
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up border-t dark:border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold dark:text-white">Voice Booking Assistant</h2>
          </div>
          <button onClick={closeVoiceModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 dark:text-slate-400" />
          </button>
        </div>

        {/* Mic Area */}
        <div className="flex flex-col items-center py-6">
          <button
            onClick={voiceStep === 'idle' ? startVoiceRecognition : undefined}
            disabled={voiceStep !== 'idle'}
            className={`w-24 h-24 rounded-full ${cfg.bg} ${cfg.ring} flex items-center justify-center transition-all mb-4`}
          >
            {voiceStep === 'idle' && <Mic className="w-10 h-10 text-primary" />}
            {voiceStep === 'listening' && <Mic className="w-10 h-10 text-red-500" />}
            {voiceStep === 'processing' && <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />}
            {voiceStep === 'done' && <CheckCircle2 className="w-10 h-10 text-green-500" />}
          </button>

          {voiceStep === 'idle' && (
            <div className="text-center">
              <p className="font-semibold text-slate-700 dark:text-slate-200">Tap to speak</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Sema kwa Kiswahili au English</p>
            </div>
          )}
          {voiceStep === 'listening' && (
            <div className="text-center">
              <p className="font-semibold text-red-600 dark:text-red-400">Listening...</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Speak now — "Nataka pickup ya takataka..."</p>
            </div>
          )}
          {voiceStep === 'processing' && (
            <div className="text-center">
              <p className="font-semibold text-blue-600 dark:text-blue-400">Processing with AI...</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Understanding your request</p>
            </div>
          )}
        </div>

        {/* Result */}
        {voiceStep === 'done' && voiceResult && (
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-4 space-y-3 animate-fade-in">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Understood! Here's what I heard:
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-800 rounded-xl p-3 border dark:border-slate-700/50">
              "{voiceResult.transcript}"
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border dark:border-slate-700/50 shadow-sm">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Waste Type</span>
                <p className="font-semibold dark:text-white">{wasteLabel}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border dark:border-slate-700/50 shadow-sm">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Weight (KG)</span>
                <p className="font-semibold dark:text-white">{voiceResult.weight}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border dark:border-slate-700/50 shadow-sm">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Estate</span>
                <p className="font-semibold dark:text-white">{voiceResult.estate}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border dark:border-slate-700/50 shadow-sm">
                <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">Time</span>
                <p className="font-semibold dark:text-white">{voiceResult.time}</p>
              </div>
            </div>
            <button onClick={closeVoiceModal} className="btn-primary w-full mt-2">
              Confirm & Book Pickup
            </button>
          </div>
        )}

        {/* Hint */}
        {voiceStep === 'idle' && (
          <div className="mt-4 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 border dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-tight">Try saying:</p>
            <ul className="text-xs text-slate-400 dark:text-slate-500 space-y-1.5 font-medium italic">
              <li>"Nataka pickup ya takataka kilo kumi kesho asubuhi South B"</li>
              <li>"I need a pickup for 10kg of recyclables in Eastleigh"</li>
              <li>"Book e-waste collection tomorrow morning"</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
