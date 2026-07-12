import { useState } from 'react';
import { 
  PackageSearch, Plus, Search, Filter, ShoppingBag, 
  Clock, CheckCircle2, Truck, AlertCircle, ArrowUpRight,
  MoreVertical, Calendar, User, FileText, ChevronRight
} from 'lucide-react';

const MOCK_ORDERS = [
  {
    id: 'PO-2024-089',
    buyer: 'East Africa Packaging Ltd',
    material: 'PET Clear Flakes',
    quantity: 12000,
    pricePerKg: 72.50,
    status: 'processing',
    date: 'Today, 09:30 AM',
    deliveryDate: 'Oct 24, 2024',
    priority: 'high'
  },
  {
    id: 'PO-2024-088',
    buyer: 'Nairobi Bottlers',
    material: 'HDPE Natural',
    quantity: 5000,
    pricePerKg: 85.00,
    status: 'ready',
    date: 'Yesterday',
    deliveryDate: 'Oct 22, 2024',
    priority: 'normal'
  },
  {
    id: 'PO-2024-087',
    buyer: 'Mombasa Steel Corp',
    material: 'Aluminium Scrap',
    quantity: 25000,
    pricePerKg: 145.00,
    status: 'shipped',
    date: 'Oct 18, 2024',
    deliveryDate: 'Oct 21, 2024',
    priority: 'high'
  },
  {
    id: 'PO-2024-086',
    buyer: 'Kamau & Sons Plastics',
    material: 'Mixed Plastics',
    quantity: 8000,
    pricePerKg: 45.00,
    status: 'pending',
    date: 'Oct 17, 2024',
    deliveryDate: 'Oct 25, 2024',
    priority: 'low'
  },
  {
    id: 'PO-2024-085',
    buyer: 'Green Recyclers KE',
    material: 'OCC Cardboard',
    quantity: 15000,
    pricePerKg: 22.50,
    status: 'delivered',
    date: 'Oct 15, 2024',
    deliveryDate: 'Oct 18, 2024',
    priority: 'normal'
  }
];

export default function SalesOrders() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processing' | 'ready' | 'shipped'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = MOCK_ORDERS.filter(o => {
    const matchesSearch = o.buyer.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'processing': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'ready': return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'shipped': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'processing': return AlertCircle;
      case 'ready': return ShoppingBag;
      case 'shipped': return Truck;
      case 'delivered': return CheckCircle2;
      default: return Clock;
    }
  };

  const totalValue = MOCK_ORDERS.reduce((sum, o) => sum + (o.quantity * o.pricePerKg), 0);
  const pendingValue = MOCK_ORDERS.filter(o => o.status === 'pending').reduce((sum, o) => sum + (o.quantity * o.pricePerKg), 0);
  const activeOrdersCount = MOCK_ORDERS.filter(o => ['pending', 'processing', 'ready'].includes(o.status)).length;

  return (
    <div className="flex h-full w-full relative bg-transparent overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-6 animate-fade-in pb-10 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Sales Orders</h1>
              <span className="font-bold px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-[10px] uppercase tracking-widest">B2B Sales</span>
            </div>
            <p className="text-xs mt-1 text-slate-500 dark:text-slate-400 font-medium">Manage direct buyer purchase orders and track fulfillment.</p>
          </div>
          <div className="flex gap-3">
            <button className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
              <Plus className="w-4 h-4" /> Create Order
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Total Order Pipeline</p>
              <div className={`w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0`}>
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">KES {(totalValue / 1000000).toFixed(2)}M</h3>
            <p className="text-[10px] font-bold text-emerald-600 mt-2 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> +12% this month</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Active Orders</p>
              <div className={`w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0`}>
                <PackageSearch className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">{activeOrdersCount}</h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Orders in fulfillment</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pending Confirmation</p>
              <div className={`w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0`}>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">KES {(pendingValue / 1000000).toFixed(2)}M</h3>
            <p className="text-[10px] font-bold text-amber-600 mt-2 flex items-center gap-1">Requires your approval</p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ready to Ship</p>
              <div className={`w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0`}>
                <Truck className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <h3 className="text-xl font-black text-[#131722] dark:text-white leading-none">
              {MOCK_ORDERS.filter(o => o.status === 'ready').length}
            </h3>
            <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">Awaiting dispatch</p>
          </div>
        </div>

        {/* Controls & Tabs */}
        <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl w-fit">
              {[
                { id: 'all', label: 'All Orders' },
                { id: 'pending', label: 'Pending' },
                { id: 'processing', label: 'Processing' },
                { id: 'ready', label: 'Ready' },
                { id: 'shipped', label: 'Shipped' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white dark:bg-slate-700 text-[#131722] dark:text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>
              <button className="p-2 border border-[#e0e3eb] dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-[#e0e3eb] dark:border-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Order Details</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Material & Qty</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Value</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500">Timeline</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e3eb] dark:divide-slate-700/50">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => {
                    const StatusIcon = getStatusIcon(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors group cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{order.id}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <User className="w-3 h-3" /> {order.buyer}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">{order.material}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest">{order.quantity.toLocaleString()} kg</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-sm text-[#131722] dark:text-white leading-none mb-1">
                            KES {(order.quantity * order.pricePerKg).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500">@ KES {order.pricePerKg.toFixed(2)}/kg</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${getStatusColor(order.status)}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {order.status}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-[#131722] dark:text-white">Due: {order.deliveryDate}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest pl-5">Created: {order.date}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            <button className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 transition-colors">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <PackageSearch className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                      <p className="font-bold text-sm text-[#131722] dark:text-white">No orders found</p>
                      <p className="text-xs text-slate-500 mt-1">Try adjusting your filters.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
