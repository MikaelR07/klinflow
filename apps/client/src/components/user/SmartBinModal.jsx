import React from 'react';
import { X, Trash2, PieChart, Info, QrCode } from 'lucide-react';
import { useIotStore } from '@cleanflow/core';
import { toast } from 'sonner';

const SmartBinModal = ({ bin, onClose }) => {
  const disposeAtBin = useIotStore((state) => state.disposeAtBin);

  const handleDispose = () => {
    disposeAtBin(bin.id);
    toast.success("Disposal Successful!", {
      description: `You have successfully disposed waste at ${bin.name}. +5 points!`,
    });
    onClose();
  };

  const getFillColorText = (level) => {
    if (level > 80) return 'text-danger';
    if (level > 50) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fade-in_0.2s]">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-[slide-up_0.3s]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00A651]/5 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 bg-[#00A651]/10 rounded-xl text-[#00A651]">
              <Trash2 size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{bin.name}</h2>
              <p className="text-sm text-gray-500">{bin.location}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors relative z-10"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 space-y-6">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Current Status</span>
            </div>
            <div className={`font-semibold text-lg ${getFillColorText(bin.fillLevel)}`}>
              {bin.fillLevel}% Full
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PieChart size={18} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-700">Waste Breakdown</h3>
            </div>
            <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
              <div style={{ width: `${bin.breakdown.organic}%` }} className="bg-green-500" title={`Organic: ${bin.breakdown.organic}%`} />
              <div style={{ width: `${bin.breakdown.recyclable}%` }} className="bg-blue-500" title={`Recyclable: ${bin.breakdown.recyclable}%`} />
              <div style={{ width: `${bin.breakdown.other}%` }} className="bg-gray-400" title={`Other: ${bin.breakdown.other}%`} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium px-1">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"/>Organic {bin.breakdown.organic}%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/>Recyclable {bin.breakdown.recyclable}%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"/>Other {bin.breakdown.other}%</span>
            </div>
          </div>
        </div>
        
        <div className="p-5 pt-0">
          <button 
            onClick={handleDispose}
            disabled={bin.fillLevel > 95}
            className="btn-primary w-full shadow-lg shadow-[#00A651]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <QrCode size={18} />
            Scan QR to Dispose
          </button>
          {bin.fillLevel > 95 && (
            <p className="text-xs text-center text-danger mt-2 font-medium">Bin is full. Please use another bin.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartBinModal;
