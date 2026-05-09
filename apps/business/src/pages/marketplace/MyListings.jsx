import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Gavel, CheckCircle2, XCircle, Clock, Package, Loader2, MoreVertical } from 'lucide-react';
import { useMarketplaceStore, getThumbnailUrl } from '@cleanflow/core';

export default function MyListings() {
  const myListings = useMarketplaceStore(s => s.myListings);
  const myOrders = useMarketplaceStore(s => s.myOrders);
  const updateListingStatus = useMarketplaceStore(s => s.updateListingStatus);
  const fetchMyActivity = useMarketplaceStore(s => s.fetchMyActivity);
  const isLoading = useMarketplaceStore(s => s.isLoading);
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const filteredListings = myListings.filter(l => l.status === activeTab);

  const stats = [
    { label: 'Active', count: myListings.filter(l => l.status === 'active').length, id: 'active' },
    { label: 'Sold', count: myListings.filter(l => l.status === 'sold').length, id: 'sold' },
    { label: 'Expired', count: myListings.filter(l => l.status === 'expired').length, id: 'expired' },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Inventory</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl">
        {stats.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm shadow-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label.toUpperCase()} ({tab.count})
          </button>
        ))}
      </div>

      {/* Listings List */}
      <div className="space-y-4">
        {filteredListings.length > 0 ? (
          filteredListings.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative group transition-all hover:border-primary/20">
              <div className="flex gap-4">
                <img src={getThumbnailUrl(item.photo, { width: 200 })} loading="lazy" alt={item.material} className="w-20 h-20 rounded-2xl object-cover bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{item.material} Batch</h3>
                    <button className="p-1 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
                    Posted on {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <Eye className="w-3.5 h-3.5 text-blue-500" /> {item.views} views
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <Gavel className="w-3.5 h-3.5 text-orange-500" /> {item.offers} offers
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Specific Actions */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                   {item.status === 'active' && <Clock className="w-4 h-4 text-primary animate-pulse" />}
                   {item.status === 'sold' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                   {item.status === 'expired' && <XCircle className="w-4 h-4 text-rose-500" />}
                   <span className="text-xs font-semibold uppercase tracking-tighter text-slate-500">
                     Status: {item.status}
                   </span>
                </div>
                
                {item.status === 'active' && (
                  <button 
                    onClick={() => updateListingStatus(item.id, 'sold')}
                    className="text-xs font-semibold text-primary border-2 border-primary/20 px-3 py-1 rounded-full hover:bg-primary/5 transition-colors"
                  >
                    MARK AS SOLD
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <h3 className="font-semibold text-slate-900 dark:text-white">No {activeTab} listings</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">You haven't {activeTab === 'active' ? 'posted' : activeTab} any listings yet.</p>
            {activeTab === 'active' && (
              <button 
                onClick={() => navigate('/sell')}
                className="bg-primary text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                CREATE LISTING
              </button>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
