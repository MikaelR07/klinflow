/**
 * Aggregators Page — Industrial Weaver & Bulk Collector Directory
 * Shows a directory of other businesses in the ecosystem.
 */
import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Package, 
  ChevronRight, 
  Building2,
  Phone,
  MessageSquare
} from 'lucide-react';
import TopTabs from '../../components/TopTabs.jsx';

const MOCK_AGGREGATORS = [
  {
    id: 1,
    name: "Nairobi Bulk Recyclers",
    location: "Industrial Area, Nairobi",
    specialization: "PET & HDPE Pellets",
    rating: 4.9,
    reviews: 128,
    verified: true,
    capacity: "50 Tons/Month",
    image: "https://images.unsplash.com/photo-1530124560676-587cad321376?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Eco-Stream Aggregators",
    location: "Dandora, Nairobi",
    specialization: "Multi-Stream Paper & Cardboard",
    rating: 4.7,
    reviews: 85,
    verified: true,
    capacity: "120 Tons/Month",
    image: "https://images.unsplash.com/photo-1591193111844-53106366050b?q=80&w=400&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Summit Metal Works",
    location: "Mombasa Road",
    specialization: "Industrial Scrap & Aluminium",
    rating: 4.8,
    reviews: 210,
    verified: false,
    capacity: "80 Tons/Month",
    image: "https://images.unsplash.com/photo-1518152006812-edab29b069ac?q=80&w=400&auto=format&fit=crop"
  }
];

export default function AggregatorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAggregators = MOCK_AGGREGATORS.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in -mt-5 -mx-2 pb-12 min-h-screen bg-[#F4F4F4] dark:bg-slate-900">
      {/* Header Area */}
      <div className="bg-[#F4F4F4] dark:bg-slate-900 pt-2 pb-4 px-0 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] rounded-full" />
        
        <div className="relative space-y-3">
          <TopTabs active="/aggregators" />

          {/* Search Terminal */}
          <div className="relative group px-2">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500/40 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search aggregators, locations, specialties..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/30 dark:bg-white/5 backdrop-blur-2xl border border-slate-200/50 dark:border-white/5 rounded-lg text-sm focus:outline-none focus:border-indigo-500/30 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Directory Section */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Partner Directory</h2>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{filteredAggregators.length} Found</span>
        </div>

        <div className="space-y-3">
          {filteredAggregators.map((aggregator) => (
            <div 
              key={aggregator.id}
              className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden active:scale-[0.98] transition-all group"
            >
              <div className="flex p-3 gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                  <img src={aggregator.image} alt={aggregator.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">{aggregator.name}</h3>
                      {aggregator.verified && <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] text-slate-500 font-medium truncate">{aggregator.location}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded text-amber-600 dark:text-amber-400">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span className="text-[9px] font-black">{aggregator.rating}</span>
                      </div>
                      <span className="text-[9px] text-slate-400 font-medium">({aggregator.reviews} reviews)</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded-md text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                      {aggregator.specialization.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-300">|</span>
                    <span className="text-[9px] text-slate-400 font-bold">{aggregator.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-slate-50 dark:border-slate-800/50">
                <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" /> Chat
                </button>
                <div className="w-[1px] bg-slate-50 dark:bg-slate-800/50" />
                <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                   View Profile <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredAggregators.length === 0 && (
          <div className="py-20 text-center">
            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No Partners Found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for different materials or areas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
