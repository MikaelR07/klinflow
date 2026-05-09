import React, { useState } from 'react';
import { Wallet, X, ChevronRight, Sparkles, CreditCard, ArrowUpRight } from 'lucide-react';

export default function TopUpModal({ isOpen, onClose, onConfirm, title = "Top Up Wallet", balance = 0 }) {
  const [amount, setAmount] = useState('');
  const presets = [500, 1000, 2500, 5000];

  if (!isOpen) return null;

  const handleConfirm = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onConfirm(numAmount);
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose} 
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up border-t sm:border border-slate-100 dark:border-slate-800">
        
        {/* Header Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">{title}</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current: KSh {balance.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Input */}
          <div className="relative mb-8 group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 group-focus-within:text-emerald-500 transition-colors">KSh</div>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-emerald-500/30 rounded-[2rem] py-6 pl-20 pr-6 text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {presets.map((val) => (
              <button
                key={val}
                onClick={() => setAmount(val.toString())}
                className={`py-3 rounded-2xl text-xs font-black tracking-widest transition-all border-2 ${
                  amount === val.toString()
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-emerald-500/30'
                }`}
              >
                {val}
              </button>
            ))}
          </div>

          {/* Payment Method Preview */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                <CreditCard className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Payment Method</p>
                <p className="text-xs font-bold dark:text-white">M-Pesa Express</p>
              </div>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 rounded-full">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Active</span>
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={handleConfirm}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 disabled:grayscale active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            Confirm {title}
            <ArrowUpRight className="w-5 h-5" />
          </button>

          <div className="mt-8 flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic">Secured by CleanFlow Escrow</p>
          </div>
        </div>
      </div>
    </div>
  );
}
