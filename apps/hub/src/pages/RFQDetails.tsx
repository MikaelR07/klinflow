import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, MapPin, Scale, Clock, DollarSign, 
  CheckCircle2, XCircle, MessageSquare, Truck, ShieldCheck,
  Star, FileText, Download, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RFQDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Selected bid state for opening a detail modal if we want (or inline expansion)
  const [selectedBid, setSelectedBid] = useState<any>(null);

  // Mock RFQ Data
  const rfq = {
    id: id || 'RFQ-2041A',
    material: 'Clear PET Bottles (Baled)',
    category: 'Plastics',
    quantity: '1,500 kg',
    targetPrice: '25',
    location: 'Kasarani, Nairobi',
    status: 'open',
    deadline: '24 hours left',
    createdAt: 'Today, 09:30 AM',
    deliveryMethod: 'Seller Drop-off',
    notes: 'Material must be clean, color-sorted, and properly baled. Contamination limit strictly at 2%. Will reject any deliveries exceeding moisture or dirt thresholds.',
    images: [
      'https://images.unsplash.com/photo-1605600659873-d808a1d8fb78?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15f?auto=format&fit=crop&q=80&w=400'
    ]
  };

  // Mock Bids
  const bids = [
    {
      id: 'BID-001',
      sellerName: 'EcoPlast Recyclers Ltd',
      sellerType: 'Company',
      rating: 4.8,
      completedDeals: 124,
      bidPrice: '26',
      quantity: '1,500 kg',
      deliveryMethod: 'Seller Drop-off',
      notes: 'Can deliver tomorrow morning. Our bales are high density, approx 200kg each. Clean and pre-sorted.',
      status: 'pending',
      timestamp: '2 hours ago'
    },
    {
      id: 'BID-002',
      sellerName: 'John Kamau',
      sellerType: 'Individual Aggregator',
      rating: 4.2,
      completedDeals: 38,
      bidPrice: '24',
      quantity: '800 kg',
      deliveryMethod: 'Hub Pickup Required',
      notes: 'I have 800kg ready at my yard in Roysambu. Need your trucks to collect as I don\'t have transport.',
      status: 'pending',
      timestamp: '5 hours ago'
    },
    {
      id: 'BID-003',
      sellerName: 'GreenEarth Solutions',
      sellerType: 'Company',
      rating: 4.9,
      completedDeals: 215,
      bidPrice: '25',
      quantity: '1,500 kg',
      deliveryMethod: 'Seller Drop-off',
      notes: 'Standard quality PET. We meet all your contamination requirements.',
      status: 'rejected',
      timestamp: '1 day ago'
    }
  ];

  const handleAcceptBid = (bidId: string) => {
    // Implement accept logic
    console.log('Accepting bid', bidId);
  };

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-y-auto">
      <div className="flex-1 p-4 md:p-6 lg:p-6 animate-fade-in pb-20 space-y-6 max-w-7xl mx-auto">
        
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/marketplace/rfqs')}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 text-slate-500 hover:text-[#131722] dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white leading-none">
                  {rfq.id}
                </h1>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  Active
                </span>
              </div>
              <p className="font-medium text-xs text-slate-500 dark:text-slate-400 tracking-tight mt-1">
                Broadcasted {rfq.createdAt}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="font-bold text-xs px-4 py-2.5 bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors">
              Cancel RFQ
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ── LEFT COLUMN: RFQ DETAILS ── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <h2 className="text-sm font-bold text-[#131722] dark:text-white mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-400" />
                Request Specifications
              </h2>
              
              <div className="space-y-4">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Material</p>
                  <p className="text-base font-bold text-[#131722] dark:text-white">{rfq.material}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                    {rfq.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Scale className="w-3 h-3" /> Volume Needed
                    </p>
                    <p className="text-sm font-bold text-[#131722] dark:text-white">{rfq.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Target Price
                    </p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      KSh {rfq.targetPrice} <span className="text-[10px] text-slate-400 font-medium">/ kg</span>
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location / Region
                    </p>
                    <p className="text-sm font-medium text-[#131722] dark:text-white">{rfq.location}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Delivery Method
                    </p>
                    <p className="text-sm font-medium text-[#131722] dark:text-white">{rfq.deliveryMethod}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Additional Notes
                  </p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    {rfq.notes}
                  </p>
                </div>
              </div>
            </div>

            {/* Reference Images */}
            {rfq.images && rfq.images.length > 0 && (
              <div className="bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[#131722] dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Reference Quality
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {rfq.images.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img src={img} alt="Quality ref" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: BIDS RECEIVED ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#131722] dark:text-white leading-none">Responses & Bids</h2>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">Review offers from local sellers.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <span className="text-xs font-bold text-[#131722] dark:text-white">{bids.length}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Offers</span>
              </div>
            </div>

            {/* Bids List */}
            <div className="space-y-4">
              {bids.map(bid => (
                <div 
                  key={bid.id} 
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 transition-all shadow-sm
                    ${bid.status === 'rejected' ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-[#e0e3eb] dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50'}
                  `}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    {/* Seller Info */}
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        {bid.sellerType === 'Company' ? (
                          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {bid.sellerName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-[#131722] dark:text-white">{bid.sellerName}</h3>
                          {bid.sellerType === 'Company' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 mb-3">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {bid.rating}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{bid.completedDeals} deals</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span>{bid.timestamp}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className="w-20 text-slate-400">Volume:</span> 
                            <span className="font-bold text-[#131722] dark:text-white">{bid.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                            <span className="w-20 text-slate-400">Logistics:</span> 
                            {bid.deliveryMethod}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Actions */}
                    <div className="flex flex-col items-end gap-4 min-w-[140px]">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proposed Price</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                          KSh {bid.bidPrice} <span className="text-[10px] font-medium text-slate-400">/kg</span>
                        </p>
                        {parseFloat(bid.bidPrice) > parseFloat(rfq.targetPrice) && (
                          <p className="text-[10px] font-bold text-rose-500 mt-1">Above target (+KSh {parseFloat(bid.bidPrice) - parseFloat(rfq.targetPrice)})</p>
                        )}
                      </div>

                      {bid.status === 'pending' ? (
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <button className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#131722] dark:text-white rounded-xl text-xs font-bold transition-colors">
                            Counter
                          </button>
                          <button 
                            onClick={() => handleAcceptBid(bid.id)}
                            className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-emerald-500/20"
                          >
                            Accept Bid
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {bid.status}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Bid Notes */}
                  {bid.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 italic">"{bid.notes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
