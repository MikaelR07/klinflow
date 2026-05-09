import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, CheckCircle2, XCircle, ShoppingBag, Loader2, Truck } from 'lucide-react';
import { useMarketplaceStore } from '@cleanflow/core';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',   icon: Clock },
  held_in_escrow: { label: 'In Escrow', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: Package },
  funds_released: { label: 'Released', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  disputed:  { label: 'Disputed',  color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',           icon: XCircle },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',               icon: XCircle },
};

export default function MyOrders() {
  const { 
    myOrders, fetchMyActivity, cancelOrder, 
    requestTransport, releaseEscrow, disputeOrder, isLoading 
  } = useMarketplaceStore();
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyActivity();
  }, []);

  const tabs = ['pending', 'held_in_escrow', 'funds_released', 'disputed'];
  const agentClaims = myOrders.filter(o => o.order_type === 'agent_claim');
  const b2bOrders = myOrders.filter(o => o.order_type !== 'agent_claim');
  const filteredOrders = activeTab === 'agent_claims' 
    ? agentClaims 
    : myOrders.filter(o => o.status === activeTab && o.order_type !== 'agent_claim');

  return (
    <div className="space-y-6 animate-fade-in pb-20">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">My Orders</h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{myOrders.length} total purchases</p>
        </div>
      </div>

      {/* Tab Strip */}
      <div className="flex flex-col gap-2">
        {/* Agent Claims Tab — Prominent for Weavers */}
        <button
          onClick={() => setActiveTab('agent_claims')}
          className={`w-full py-3 rounded-2xl text-xs font-semibold uppercase tracking-widest flex items-center justify-between px-4 transition-all border ${
            activeTab === 'agent_claims'
              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800'
          }`}
        >
          <span>📦 Agent Claims (Network Pickups)</span>
          {agentClaims.length > 0 && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === 'agent_claims' ? 'bg-white/20' : 'bg-primary/10 text-primary'}`}>
              {agentClaims.length}
            </span>
          )}
        </button>

        {/* B2B Orders Strip */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl gap-1">
          {tabs.map(tab => {
            const count = b2bOrders.filter(o => o.status === tab).length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {tab.replace('_', ' ')} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {isLoading && myOrders.length === 0 ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading orders...</p>
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map(order => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            return (
              <div key={order.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
                
                {/* Header row */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-2xl">
                      {order.emoji || '♻️'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{order.material} Purchase</h3>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1.5 rounded-full flex items-center gap-1 ${config.color}`}>
                    <StatusIcon className="w-3 h-3" /> {config.label}
                  </span>
                </div>

                {/* Logistics Status */}
                {order.bookingId && (
                  <div className="mb-4 p-3 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">Freight Tracking</p>
                        <p className="text-xs font-semibold text-primary uppercase">{order.logisticsStatus || 'Pending Pickup'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(step => (
                        <div key={step} className={`w-1.5 h-1.5 rounded-full ${order.logisticsStatus === 'completed' || step === 1 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="flex items-center justify-between py-3 border-y border-slate-100 dark:border-slate-800 my-3">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Seller</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{order.sellerName}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Quantity</p>
                    <p className="text-sm font-semibold text-primary">{order.quantity} KG</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">Total</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">KES {Number(order.totalPrice).toLocaleString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 mt-4">
                  {order.status === 'held_in_escrow' && (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => releaseEscrow(order)}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                      >
                        Release Funds (Confirm Delivery)
                      </button>
                      <button
                        onClick={() => disputeOrder(order.id, 'Material quality/weight mismatch')}
                        className="px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 transition-all"
                      >
                        Dispute
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3">
                    {(order.status === 'pending' || order.status === 'held_in_escrow') && !order.bookingId && (
                      <button
                        onClick={() => requestTransport(order)}
                        className="flex-1 py-3 bg-primary hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" /> Request Transport
                      </button>
                    )}
                    {order.status === 'pending' && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className={`py-3 text-xs font-semibold uppercase tracking-widest text-rose-500 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ${order.bookingId ? 'flex-1' : 'px-6'}`}
                      >
                        {order.bookingId ? 'Cancel' : 'Cancel Order'}
                      </button>
                    )}
                  </div>
                </div>
                {order.status === 'completed' && (
                  <div className="text-center text-xs font-semibold text-emerald-600 uppercase tracking-widest pt-1">
                    ✓ Transaction Complete
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-900 dark:text-white">No {activeTab} orders</h3>
          <p className="text-sm text-slate-500 mt-1">Your purchase history will appear here.</p>
        </div>
      )}
    </div>
  );
}
