import React, { useState } from 'react';
import { Trash2, MapPin, Sparkles } from 'lucide-react';
import SmartBinModal from './SmartBinModal.jsx';

const SmartBinCard = ({ bin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getFillColor = (level) => {
    if (level > 80) return 'bg-danger';
    if (level > 50) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="card cursor-pointer hover:-translate-y-1 relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#00A651]/10 rounded-xl text-[#00A651]">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{bin.name}</h3>
              <div className="flex items-center text-xs text-gray-500 mt-0.5">
                <MapPin size={12} className="mr-1" />
                {bin.location}
              </div>
            </div>
          </div>
          {bin.aiRecommended && (
            <div className="ai-badge">
              <Sparkles size={12} />
              AI Recommended
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600 font-medium">Capacity</span>
            <span className="font-semibold">{bin.fillLevel}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getFillColor(bin.fillLevel)} transition-all duration-500`}
              style={{ width: `${bin.fillLevel}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-right font-medium">
            Updated {new Date(bin.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
      </div>
      
      {isModalOpen && (
        <SmartBinModal bin={bin} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
};

export default SmartBinCard;
