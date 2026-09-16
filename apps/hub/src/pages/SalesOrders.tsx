import { useState, useEffect } from 'react';
import { supabase } from '@klinflow/supabase';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import {
  Search, Filter, ShoppingBag, Truck, CheckCircle2,
  AlertCircle, Clock, ArrowUpRight, Calendar, User, FileText,
  MoreVertical, ChevronRight, PackageSearch, Plus, X, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  order_ref: string;
  buyer_name: string;
  category?: string;
  material_name: string;
  quantity_kg: number;
  price_per_kg: number;
  status: string;
  delivery_date: string | null;
  created_at: string;
}

export default function SalesOrders() {
  const { currentCompanyId } = useAuthStore();
  const [ordersSubTab, setOrdersSubTab] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newOrder, setNewOrder] = useState({
    buyer_name: '',
    category: '',
    material_name: '',
    quantity_kg: '',
    price_per_kg: '',
    delivery_date: ''
  });

  useEffect(() => {
    if (currentCompanyId) {
      fetchOrders();
    }
  }, [currentCompanyId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('hub_sales_orders')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error(err);
      alert('Failed to fetch orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    try {
      setSubmitting(true);
      const order_ref = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase
        .from('hub_sales_orders')
        .insert({
          company_id: currentCompanyId,
          order_ref,
          buyer_name: newOrder.buyer_name,
          category: newOrder.category || null,
          material_name: newOrder.material_name,
          quantity_kg: Number(newOrder.quantity_kg),
          price_per_kg: Number(newOrder.price_per_kg),
          delivery_date: newOrder.delivery_date || null,
          status: 'pending'
        });

      if (error) throw error;
      
      setIsCreateModalOpen(false);
      setNewOrder({ buyer_name: '', category: '', material_name: '', quantity_kg: '', price_per_kg: '', delivery_date: '' });
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert('Failed to create order: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('hub_sales_orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
      setOpenDropdownId(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to update status: ' + err.message);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.buyer_name.toLowerCase().includes(ordersSearch.toLowerCase()) ||
                          o.order_ref.toLowerCase().includes(ordersSearch.toLowerCase());
    const matchesTab = ordersSubTab === 'all' || o.status === ordersSubTab;
    return matchesSearch && matchesTab;
  });

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'shipped': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return AlertCircle;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle2;
      default: return Clock;
    }
  };

  const ordersTotalValue = orders.reduce((sum, o) => sum + (o.quantity_kg * o.price_per_kg), 0);
  const ordersPendingValue = orders.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.quantity_kg * o.price_per_kg), 0);
  const ordersActiveCount = orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-4">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">
                Sales Orders
              </h1>
              <span className="font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] uppercase tracking-widest">
                Fulfillment
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Manage direct buyer purchase orders and track fulfillment.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" /> Create Order
            </button>
          </div>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Order Pipeline</p>
                  <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">KES {ordersTotalValue.toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12% this month</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Orders</p>
                  <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                    <PackageSearch className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{ordersActiveCount}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Orders in fulfillment</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pending Confirmation</p>
                  <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">KES {ordersPendingValue.toLocaleString()}</h3>
                <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Requires your approval</p>
              </div>

              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ready to Ship</p>
                  <div className={`w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0`}>
                    <Truck className="w-4 h-4 text-indigo-500" />
                  </div>
                </div>
                <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">
                  {orders.filter(o => o.status === 'processing').length}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Awaiting dispatch</p>
              </div>
            </div>

            {/* Table list */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
                  {[
                    { id: 'all', label: 'All Orders' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'processing', label: 'Processing' },
                    { id: 'shipped', label: 'Shipped' },
                    { id: 'delivered', label: 'Delivered' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOrdersSubTab(tab.id as any)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors ${
                        ordersSubTab === tab.id
                          ? 'bg-white dark:bg-slate-800 text-[#131722] dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-[#131722] dark:hover:text-slate-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search order ID or buyer..."
                      value={ordersSearch}
                      onChange={(e) => setOrdersSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    />
                  </div>
                  <button className="p-2 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Table wrapper */}
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Customer Name</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Order-NO</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Category</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Quantity</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Value</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Created Time</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                    {loading ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-20 text-center">
                          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">Loading orders...</p>
                        </td>
                      </tr>
                    ) : filteredOrders.length > 0 ? (
                      filteredOrders.map(order => {
                        const StatusIcon = getOrderStatusIcon(order.status);
                        return (
                          <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                                <p className="font-bold text-sm text-[#131722] dark:text-white">{order.buyer_name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-black text-xs uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                                  {order.order_ref}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm text-[#131722] dark:text-white">{order.category || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-sm text-[#131722] dark:text-white">{order.material_name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded inline-block">
                                {order.quantity_kg.toLocaleString()} kg
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-black text-sm text-emerald-600 dark:text-emerald-400 leading-none mb-1">
                                KES {(order.quantity_kg * order.price_per_kg).toLocaleString()}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500">
                                @ KES {order.price_per_kg.toFixed(2)}/kg
                              </p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-xs font-bold text-[#131722] dark:text-white">
                                 {new Date(order.created_at).toLocaleDateString()}
                               </p>
                               <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                                 {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${getOrderStatusColor(order.status)}`}>
                                <StatusIcon className="w-3.5 h-3.5" />
                                {order.status}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="relative flex justify-end">
                                  <button
                                    onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
                                  >
                                    Click to View <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  <AnimatePresence>
                                    {openDropdownId === order.id && (
                                      <>
                                        <div 
                                          className="fixed inset-0 z-10" 
                                          onClick={() => setOpenDropdownId(null)}
                                        />
                                        <motion.div
                                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                          className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-[#131722] rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-20 overflow-hidden"
                                        >
                                          <button onClick={() => updateOrderStatus(order.id, 'processing')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">Mark Processing</button>
                                          <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">Mark Shipped</button>
                                          <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">Mark Delivered</button>
                                          <div className="h-px bg-slate-200 dark:bg-slate-800 my-1" />
                                          <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">Cancel Order</button>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-6 py-20 text-center">
                          <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                          <p className="font-bold text-sm text-[#131722] dark:text-white">No orders found</p>
                          <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or wait for buyers to order.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
      </div>

        <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0b0e14] rounded-2xl shadow-2xl border border-[#e0e3eb] dark:border-slate-800 p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-[#131722] dark:text-white">Create Sales Order</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Buyer Company Name</label>
                  <input
                    required
                    type="text"
                    value={newOrder.buyer_name}
                    onChange={(e) => setNewOrder({ ...newOrder, buyer_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                    placeholder="e.g. EcoPlastics Ltd"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                    <input
                      required
                      type="text"
                      value={newOrder.category}
                      onChange={(e) => setNewOrder({ ...newOrder, category: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      placeholder="e.g. Plastics"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Material</label>
                    <input
                      required
                      type="text"
                      value={newOrder.material_name}
                      onChange={(e) => setNewOrder({ ...newOrder, material_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      placeholder="e.g. Clear PET Flakes"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Quantity (KG)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newOrder.quantity_kg}
                      onChange={(e) => setNewOrder({ ...newOrder, quantity_kg: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Price / KG (KES)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={newOrder.price_per_kg}
                      onChange={(e) => setNewOrder({ ...newOrder, price_per_kg: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                      placeholder="e.g. 45"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Expected Delivery Date (Optional)</label>
                  <input
                    type="date"
                    value={newOrder.delivery_date}
                    onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creating Order...' : 'Create Sales Order'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
