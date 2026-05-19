import React from 'react';
import { Smartphone, Zap, Bell, Download, X, Sparkles } from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export default function PWAInstallModal({ isOpen, onClose, onInstall }: PWAInstallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-slate-200 dark:border-slate-800">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-5">
            <Download className="w-6 h-6" />
          </div>
          
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            Install Klinflow App
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            Add Klinflow to your home screen for a faster, fullscreen experience with instant access and push notifications.
          </p>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Not Now
            </button>
            <button 
              onClick={onInstall}
              className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary/90 text-white rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              Install App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
