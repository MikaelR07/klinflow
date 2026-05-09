import React from 'react';
import { Smartphone, Zap, Bell, Download, X, Sparkles } from 'lucide-react';

export default function PWAInstallModal({ isOpen, onClose, onInstall }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 dark:border-slate-800">
        {/* Top Accent Gradient */}
        <div className="h-32 bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <div className="w-20 h-20 bg-white rounded-3xl shadow-2xl flex items-center justify-center animate-bounce-slow">
            <img src="/logo.png" alt="CleanFlow" className="w-16 h-16 rounded-2xl object-cover" />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 text-center">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none mb-2">
            Install CleanFlow
          </h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">
            Experience the full ecosystem
          </p>

          <div className="space-y-5 mb-8">
            <div className="flex items-center gap-4 text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black dark:text-white uppercase">Lightning Fast</h4>
                <p className="text-xs text-slate-500 font-bold">Launches instantly from home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black dark:text-white uppercase">Live Telemetry</h4>
                <p className="text-xs text-slate-500 font-bold">Real-time alerts & status updates</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-left p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black dark:text-white uppercase">Native Experience</h4>
                <p className="text-xs text-slate-500 font-bold">Fullscreen, no browser clutter</p>
              </div>
            </div>
          </div>

          <button 
            onClick={onInstall}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 dark:shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            <Download className="w-5 h-5 group-hover:animate-bounce" />
            Add to Home Screen
          </button>
          
          <div className="mt-6 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-primary animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Powered by HygieneX AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}
