/**
 * Expected Arrivals Page — Dedicated drop-off management for individual agents.
 * Shows accepted drop-off orders in Pending / Collected / Rejected tabs.
 */
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Package, Clock, MapPin, Scale, User, Phone,
  CheckCircle2, XCircle, AlertTriangle, Loader2, QrCode, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { supabase } from '@klinflow/supabase';
import { toast } from 'sonner';
import { AIScannerModal } from '@klinflow/ui';

type DropoffOrder = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  material: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  pickup_mode: string;
  created_at: string;
  booking_id?: string;
  // Joined seller info
  sellerName?: string;
  sellerPhone?: string;
  sellerAvatar?: string;
  // Joined listing info
  photoUrl?: string;
  location?: string;
};

type TabType = 'pending' | 'collected' | 'rejected';

export default function ExpectedArrivalsPage() {
  const navigate = useNavigate();
  const profile = useAuthStore(s => (s as any).profile);

  const [orders, setOrders] = useState<DropoffOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Reject confirmation modal state
  const [rejectingOrder, setRejectingOrder] = useState<DropoffOrder | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Payment modal state
  const [payingOrder, setPayingOrder] = useState<DropoffOrder | null>(null);
  const [actualWeight, setActualWeight] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  const fetchDropoffOrders = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('marketplace_orders')
        .select('*')
        .eq('buyer_id', profile.id)
        .eq('pickup_mode', 'dropoff')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch seller profiles
        const sellerIds = [...new Set(data.map(o => o.seller_id))];
        const { data: sellers } = await supabase
          .from('profiles')
          .select('id, name, phone, avatar_url')
          .in('id', sellerIds);
        const sellerMap = Object.fromEntries(
          sellers?.map(s => [s.id, s]) || []
        );

        // Fetch photos from bookings (not marketplace_listings, which are RLS-blocked once sold)
        const bookingIds = data.map(o => o.booking_id).filter(Boolean);
        let bookingMap: Record<string, any> = {};
        if (bookingIds.length > 0) {
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('id, photo_url, estate')
            .in('id', bookingIds);
          bookingMap = Object.fromEntries(
            bookingsData?.map(b => [b.id, b]) || []
          );
        }

        const enriched: DropoffOrder[] = data.map(o => ({
          ...o,
          sellerName: sellerMap[o.seller_id]?.name || 'Seller',
          sellerPhone: sellerMap[o.seller_id]?.phone || '',
          sellerAvatar: sellerMap[o.seller_id]?.avatar_url || '',
          photoUrl: bookingMap[o.booking_id]?.photo_url || '',
          location: bookingMap[o.booking_id]?.estate || '',
        }));

        setOrders(enriched);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Error fetching dropoff orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDropoffOrders();
  }, [profile?.id]);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Filter by tab
      let matchesTab = false;
      if (activeTab === 'pending') matchesTab = ['pending', 'confirmed', 'processing'].includes(o.status);
      else if (activeTab === 'collected') matchesTab = o.status === 'completed';
      else if (activeTab === 'rejected') matchesTab = ['cancelled', 'disputed'].includes(o.status);

      if (!matchesTab) return false;

      // Filter by search query
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase().trim();
      const matchesName = o.sellerName?.toLowerCase().includes(query);
      const matchesWeight = String(o.quantity).includes(query);
      const matchesMaterial = o.material?.toLowerCase().includes(query);

      return matchesName || matchesWeight || matchesMaterial;
    });
  }, [orders, activeTab, searchQuery]);

  const handleReject = async () => {
    if (!rejectingOrder) return;
    setIsRejecting(true);

    try {
      const { error } = await supabase
        .from('marketplace_orders')
        .update({ status: 'cancelled' })
        .eq('id', rejectingOrder.id);

      if (error) throw error;

      // Also update booking if exists
      if (rejectingOrder.booking_id) {
        await supabase
          .from('bookings')
          .update({ status: 'cancelled' })
          .eq('id', rejectingOrder.booking_id);
      }

      setOrders(prev => prev.map(o =>
        o.id === rejectingOrder.id ? { ...o, status: 'cancelled' } : o
      ));

      toast.success('Materials rejected', { description: 'The trade has been cancelled.' });
      setRejectingOrder(null);
    } catch (err) {
      toast.error('Failed to reject', { description: 'Please try again.' });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleSmartVerify = async (verifiedData: any) => {
    if (!payingOrder) return;
    setIsProcessingPayment(true);

    try {
      const finalPrice = verifiedData.estimatedValue;
      const weight = verifiedData.weightKg;

      // Call the RPC to handle payment, updates, and wallet deductions atomically
      const { data, error: rpcError } = await supabase.rpc('process_marketplace_dropoff_payout', {
        p_order_id: payingOrder.id,
        p_weight_kg: weight,
        p_payout_amount: finalPrice
      });

      if (rpcError) throw rpcError;

      setOrders(prev => prev.map(o =>
        o.id === payingOrder.id ? { ...o, status: 'completed', total_price: finalPrice, quantity: weight } : o
      ));

      toast.success('Smart Verification successful!', { description: `KSh ${finalPrice.toLocaleString()} released for ${weight}kg via ${verifiedData.payout_method || 'Wallet'}` });
      setPayingOrder(null);
    } catch (err) {
      toast.error('Verification failed', { description: 'Please try again.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length },
    { key: 'collected', label: 'Collected', count: orders.filter(o => o.status === 'completed').length },
    { key: 'rejected', label: 'Rejected', count: orders.filter(o => ['cancelled', 'disputed'].includes(o.status)).length },
  ];

  return (
    <div className="flex flex-col  bg-[#F8F8FF] dark:bg-slate-800 transition-colors">
      {/* ── TOP NAV ── */}
      <div className="h-[calc(env(safe-area-inset-top,1rem)+0.6rem)]" />
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl pt-[calc(env(safe-area-inset-top,1rem)+1rem)] pb-1 px-4 border-b border-slate-200 dark:border-slate-900 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 shrink-0 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm active:scale-95 transition-all">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-slate-600 dark:text-white capitalize tracking-tighter leading-none">Expected Arrivals</h1>
            <p className="text-[10px] font-bold text-amber-600 capitalize tracking-[0.2em] mt-1">Drop-off Management</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by seller name, weight, or material..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all placeholder:font-medium placeholder:text-slate-400"
          />
        </div>

        {/* Tabs */}
        <div className="mt-1 flex bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 text-[11px] font-bold capitalize tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.key
                  ? tab.key === 'pending' ? 'bg-amber-600 text-white' : tab.key === 'collected' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`min-w-[16px] h-4 px-1 text-[9px] font-black rounded-full flex items-center justify-center ${
                  activeTab === tab.key ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 px-1.5 pt-[calc(env(safe-area-inset-top,1rem)+7rem)] pb-4 max-w-lg mx-auto w-full">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-xs font-semibold text-slate-400">Loading arrivals...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 text-center px-4">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {activeTab === 'pending' ? 'No pending drop-offs' : activeTab === 'collected' ? 'No completed drop-offs yet' : 'No rejected materials'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">
              {activeTab === 'pending' ? 'When sellers accept your offers, their drop-offs will appear here.' : ''}
            </p>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {filteredOrders.map(order => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                {/* Order Header */}
                <div className="p-3.5 flex items-start gap-3">
                  {/* Photo */}
                  <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    {order.photoUrl ? (
                      <img src={order.photoUrl} alt={order.material} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize truncate">{order.material}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${
                        order.status === 'pending' || order.status === 'confirmed' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' :
                        order.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                        'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                      }`}>
                        {order.status === 'pending' ? 'Awaiting' : order.status}
                      </span>
                    </div>

                    <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate">{order.sellerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Scale className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{order.quantity} KG</span>
                      </div>
                      {order.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="text-[10px] font-semibold text-slate-500 truncate">{order.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-[10px] font-semibold text-slate-400">{new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">KSh {order.total_price?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons (Pending only) */}
                {activeTab === 'pending' && (
                  <div className="px-3.5 pb-3.5 pt-0 flex gap-2">
                    <button
                      onClick={() => setRejectingOrder(order)}
                      className="flex-1 py-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl font-bold text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => { setPayingOrder(order); setActualWeight(order.quantity?.toString() || ''); }}
                      className="flex-[2] py-3 bg-emerald-600 rounded-xl font-bold text-[10px] text-white uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Proceed with Payment
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── PREMIUM REJECT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {rejectingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => !isRejecting && setRejectingOrder(null)}
          >
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-t-[2rem] w-full max-w-lg p-6 pb-[calc(env(safe-area-inset-bottom,1rem)+1rem)] space-y-5 border-t border-slate-200 dark:border-slate-800"
            >
              {/* Warning Icon */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center">Reject Materials?</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed max-w-[280px]">
                  Are you sure you want to reject <span className="font-bold text-slate-700 dark:text-white">{rejectingOrder.quantity}kg of {rejectingOrder.material}</span> from <span className="font-bold text-slate-700 dark:text-white">{rejectingOrder.sellerName}</span>? This action cannot be undone.
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                  {rejectingOrder.photoUrl ? (
                    <img src={rejectingOrder.photoUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{rejectingOrder.material}</p>
                  <p className="text-[10px] font-semibold text-slate-500">{rejectingOrder.quantity} KG • KSh {rejectingOrder.total_price?.toLocaleString()}</p>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  {isRejecting ? 'Rejecting...' : 'Yes, Reject Materials'}
                </button>
                <button
                  onClick={() => setRejectingOrder(null)}
                  disabled={isRejecting}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  Keep Trade Active
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SMART VERIFICATION MODAL ── */}
      {payingOrder && (
        <AIScannerModal
          isOpen={!!payingOrder}
          onClose={() => setPayingOrder(null)}
          onVerify={handleSmartVerify}
          booking={{
            id: payingOrder.id,
            material: payingOrder.material,
            wasteType: payingOrder.material,
            actual_weight_kg: payingOrder.quantity,
            weightKg: payingOrder.quantity,
            phone: payingOrder.sellerPhone,
            is_market_trade: true,
            total_price: payingOrder.total_price,
            amount: payingOrder.total_price,
            unit_price: payingOrder.unit_price,
            sellerName: payingOrder.sellerName,
            tracking_id: (payingOrder as any).tracking_id
          }}
          role="agent"
        />
      )}
    </div>
  );
}
