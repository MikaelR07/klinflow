import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, Clock, ArrowRight, CheckCircle2, Truck, X, 
  PackageCheck, AlertTriangle, ChevronDown, Activity, 
  Lightbulb, AlertCircle, Info, Check, BarChart3, Users, Search
} from 'lucide-react';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useNotificationStore } from '@klinflow/core/stores/notificationStore';
import { supabase } from '@klinflow/core/lib/supabaseClient';
import { FulfillmentOrder } from '@klinflow/core/stores/fulfillmentStore.types';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import 'leaflet/dist/leaflet.css';

const mapCenter: [number, number] = [-1.2921, 36.8219];

const createDriverIcon = (isEnRoute: boolean) => new L.DivIcon({
  className: 'bg-transparent',
  html: `<div class="w-8 h-8 rounded-full ${isEnRoute ? 'bg-amber-500' : 'bg-rose-500'} flex items-center justify-center text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5"/><path d="M14 17h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

const createPickupIcon = (type: 'awaiting' | 'active' | 'enroute') => {
  const bg = type === 'awaiting' ? 'bg-amber-500' : type === 'active' ? 'bg-emerald-500' : 'bg-blue-500';
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `<div class="w-7 h-7 rounded-lg ${bg} flex items-center justify-center text-white shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

function MapBoundsFitter({ items, drivers }: { items: any[], drivers: any[] }) {
  const map = useMap();
  useEffect(() => {
    const validItems = items.filter(i => i.lat != null && i.lng != null);
    const validDrivers = drivers.filter(d => d.location?.latitude != null && d.location?.longitude != null);
    
    if (validItems.length === 0 && validDrivers.length === 0) return;

    const bounds = L.latLngBounds([]);
    validItems.forEach(i => bounds.extend([i.lat, i.lng]));
    validDrivers.forEach(d => bounds.extend([d.location.latitude, d.location.longitude]));
    
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [items, drivers, map]);
  return null;
}

// Dummy performance data
const performanceData = [
  { time: '12 AM', value: 10, value2: 5 }, { time: '3 AM', value: 15, value2: 8 },
  { time: '6 AM', value: 25, value2: 18 }, { time: '9 AM', value: 35, value2: 25 },
  { time: '12 PM', value: 45, value2: 30 }, { time: '3 PM', value: 40, value2: 28 },
  { time: '6 PM', value: 25, value2: 20 }, { time: '9 PM', value: 12, value2: 10 },
  { time: '12 AM', value: 10, value2: 8 }
];

export default function DispatchManagement() {
  const { profile, currentCompanyId } = useAuthStore();
  const { dispatchQueue, activeFulfillments, analyticsFulfillments, residentDispatchQueue, marketplaceDispatchQueue, fetchResidentDispatchQueue, fetchMarketplaceDispatchQueue, assignResidentDriver, assignMarketplaceDriver, fetchDispatchQueue, fetchActiveFulfillments, fetchAnalyticsData, assignDriver, isLoading } = useFulfillmentStore();
  const { fleetDrivers, fetchFleetDrivers } = useAgentStore();
  const { addNotification } = useNotificationStore();
  
  const [activeTab, setActiveTab] = useState<'awaiting' | 'active' | 'enroute' | 'completed' | 'delayed' | 'analytics' | 'map'>('awaiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<FulfillmentOrder | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [driverSearchQuery, setDriverSearchQuery] = useState('');
  
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<'daily' | 'weekly'>('daily');
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);

  // Last month KPI data for month-over-month comparison
  const [lastMonthKpis, setLastMonthKpis] = useState<{
    awaiting: number;
    active: number;
    enroute: number;
    delayed: number;
    completed: number;
    weightKg: number;
  } | null>(null);

  useEffect(() => {
    if (currentCompanyId) {
      fetchDispatchQueue(currentCompanyId);
      fetchActiveFulfillments(currentCompanyId, 'company');
      fetchAnalyticsData(currentCompanyId);
      fetchFleetDrivers();
      fetchMarketplaceDispatchQueue(currentCompanyId, profile?.id);
    }
  }, [currentCompanyId, fetchDispatchQueue, fetchActiveFulfillments, fetchAnalyticsData, fetchFleetDrivers, fetchMarketplaceDispatchQueue]);

  useEffect(() => {
    if (currentCompanyId && profile?.id) {
      const driverIds = fleetDrivers.map(d => d.id);
      fetchResidentDispatchQueue(profile.id, driverIds);
    }
  }, [currentCompanyId, profile?.id, fleetDrivers, fetchResidentDispatchQueue]);

  // Fetch last month's KPI snapshot for comparison
  useEffect(() => {
    if (!currentCompanyId) return;
    const fetchLastMonthKpis = async () => {
      try {
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // Fulfillment orders from last month
        const { data: lastMonthOrders } = await supabase
          .from('fulfillment_orders')
          .select('id, status, verified_weight, proposal:rfq_offers!proposal_id(offered_weight)')
          .eq('organization_id', currentCompanyId)
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString());

        // Bookings from last month
        const { data: lastMonthBookings } = await supabase
          .from('bookings')
          .select('id, status, weight_kg, agent_id')
          .eq('organization_id', currentCompanyId)
          .gte('created_at', lastMonthStart.toISOString())
          .lte('created_at', lastMonthEnd.toISOString());

        const orders = lastMonthOrders || [];
        const bookings = lastMonthBookings || [];

        const awaitingCount = orders.filter(o => o.status === 'pending_coordination').length
          + bookings.filter(b => b.status === 'confirmed' && b.agent_id === currentCompanyId).length;
        const activeCount = orders.filter(o => o.status === 'agent_assigned').length
          + bookings.filter(b => ['in_progress', 'scheduled'].includes(b.status) && b.agent_id !== currentCompanyId).length;
        const enrouteCount = orders.filter(o => ['in_transit', 'picked_up'].includes(o.status)).length
          + bookings.filter(b => b.status === 'picked_up').length;
        const completedCount = orders.filter(o => o.status === 'completed').length
          + bookings.filter(b => b.status === 'completed').length;
        const weightKg = orders.filter(o => o.status === 'completed').reduce((sum, o) => {
          return sum + ((o as any).verified_weight || (o as any).proposal?.offered_weight || 0);
        }, 0) + bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.weight_kg || 0), 0);

        setLastMonthKpis({
          awaiting: awaitingCount,
          active: activeCount,
          enroute: enrouteCount,
          delayed: 0, // Exceptions are transient, no historical comparison
          completed: completedCount,
          weightKg,
        });
      } catch (err) {
        console.error('Failed to fetch last month KPIs:', err);
      }
    };
    fetchLastMonthKpis();
  }, [currentCompanyId]);

  // Helper: compute percentage change, returns null if no baseline data
  const getChange = (current: number, lastMonth: number | undefined): number | null => {
    if (lastMonth == null || lastMonth === 0) return current > 0 ? 100 : null;
    return Math.round(((current - lastMonth) / lastMonth) * 100);
  };

  const handleOpenAssign = (order: FulfillmentOrder) => {
    setSelectedOrder(order);
    setIsAssignModalOpen(true);
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!selectedOrder || !currentCompanyId) return;
    setIsAssigning(true);
    try {
      if ((selectedOrder as any).type === 'resident') {
        await assignResidentDriver(selectedOrder.id, driverId);
      } else if ((selectedOrder as any).type === 'marketplace') {
        await assignMarketplaceDriver(selectedOrder.id, driverId, currentCompanyId);
      } else {
        await assignDriver(selectedOrder.id, currentCompanyId, driverId);
      }
      await addNotification('New Pickup Assigned!', 'A new pickup has been dispatched to your active route.', 'warning', 'agent', driverId);
      toast.success('Driver assigned successfully!');
      setIsAssignModalOpen(false);
      fetchDispatchQueue(currentCompanyId);
      if (profile?.id) {
        fetchResidentDispatchQueue(profile.id, fleetDrivers.map(d => d.id));
      }
      fetchActiveFulfillments(currentCompanyId, 'company');
      fetchMarketplaceDispatchQueue(currentCompanyId, profile?.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign driver');
    } finally {
      setIsAssigning(false);
    }
  };

  const onlineDrivers = useMemo(() => {
    let filtered = fleetDrivers.filter(driver => driver.is_online);
    if (driverSearchQuery) {
      const q = driverSearchQuery.toLowerCase();
      filtered = filtered.filter(d => (d.name || '').toLowerCase().includes(q));
    }
    return filtered;
  }, [fleetDrivers, driverSearchQuery]);

  // Helper: Haversine distance
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // AI Recommendation Logic Removed

  const analyticsData = useMemo(() => {
    const now = new Date();
    let filtered = analyticsFulfillments || [];
    
    if (analyticsTimeframe === 'daily') {
      filtered = filtered.filter(f => {
        const d = new Date(f.updated_at || f.created_at);
        return d.toDateString() === now.toDateString();
      });
    }

    const completed = filtered.filter(f => f.status === 'completed');
    const totalWeightKg = completed.reduce((acc, curr) => {
      return acc + (curr.verified_weight || curr.proposal?.offered_weight || 0);
    }, 0);

    const totalValue = completed.reduce((acc, curr) => {
      return acc + (curr.total_price || 0);
    }, 0);

    // Group for chart
    const chartMap = new Map();
    filtered.forEach(f => {
      const d = new Date(f.updated_at || f.created_at);
      const key = analyticsTimeframe === 'daily' 
        ? d.getHours() + ':00' 
        : d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const existing = chartMap.get(key) || { value: 0, value2: 0 };
      existing.value += 1; 
      existing.value2 += (f.verified_weight || f.proposal?.offered_weight || 0); 
      chartMap.set(key, existing);
    });

    const performanceData = Array.from(chartMap.entries()).map(([time, data]) => ({ time, value: data.value, value2: Number(data.value2.toFixed(2)) }));

    return {
      completedCount: completed.length,
      totalWeightKg: totalWeightKg.toFixed(2),
      totalValue,
      performanceData: performanceData.length > 0 ? performanceData : [{ time: 'No data', value: 0, value2: 0 }]
    };
  }, [analyticsFulfillments, analyticsTimeframe]);

  const completedTodayCount = analyticsData.completedCount; 
  const totalWeightKg = analyticsData.totalWeightKg;

  const getPriorityConfig = (weight: number) => {
    if (weight > 2000) return { label: 'HIGH', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' };
    if (weight > 1000) return { label: 'MEDIUM', color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };
    return { label: 'NORMAL', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' };
  };

  const unifiedAwaiting = useMemo(() => {
    return [
      ...dispatchQueue.map(o => ({
        id: o.id,
        type: 'seller',
        displayId: `RFQ-${o.id.substring(0, 4).toUpperCase()}`,
        material: o.rfq?.category || 'Commercial Waste',
        weight: o.proposal?.offered_weight || 0,
        value: (o.proposal?.offered_weight || 0) * (o.proposal?.offered_price || 0),
        address: o.pickup_address || o.rfq?.pickup_area || 'Hub Location',
        createdAt: o.created_at,
        originalData: o,
        lat: null,
        lng: null,
        tabState: 'awaiting'
      })),
      ...residentDispatchQueue.filter(b => b.agent_id === profile?.id).map(b => ({
        id: b.id,
        type: 'resident',
        displayId: `RES-${b.id.substring(0, 4).toUpperCase()}`,
        material: b.waste_type || 'Mixed Plastics',
        weight: b.weight_kg || 0,
        value: b.total_price || 0,
        address: b.estate || 'Residential Area',
        createdAt: b.created_at,
        originalData: b,
        lat: b.latitude,
        lng: b.longitude,
        tabState: 'awaiting'
      })),
      ...marketplaceDispatchQueue.filter(o => o.status === 'processing').map(o => ({
        id: o.id,
        type: 'marketplace',
        displayId: `MKT-${o.id.substring(0, 4).toUpperCase()}`,
        material: o.material || 'Marketplace Material',
        weight: o.quantity || 0,
        value: o.total_price || 0,
        address: o.listing?.location || 'Seller Location',
        createdAt: o.created_at,
        originalData: o,
        lat: o.listing?.latitude || null,
        lng: o.listing?.longitude || null,
        tabState: 'awaiting'
      }))
    ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [dispatchQueue, residentDispatchQueue, marketplaceDispatchQueue, profile?.id]);

  const unifiedActive = useMemo(() => {
    return [
      ...activeFulfillments.map(o => ({
        id: o.id,
        type: 'seller',
        displayId: `RFQ-${o.id.substring(0, 4).toUpperCase()}`,
        material: o.rfq?.category || 'Commercial Waste',
        weight: o.proposal?.offered_weight || 0,
        value: (o.proposal?.offered_weight || 0) * (o.proposal?.offered_price || 0),
        address: o.pickup_address || o.rfq?.pickup_area || 'Hub Location',
        createdAt: o.created_at,
        agentId: o.assigned_agent_id,
        originalData: o,
        lat: null,
        lng: null,
        tabState: 'active'
      })),
      ...residentDispatchQueue.filter(b => b.agent_id !== profile?.id && b.status !== 'picked_up').map(b => ({
        id: b.id,
        type: 'resident',
        displayId: `RES-${b.id.substring(0, 4).toUpperCase()}`,
        material: b.waste_type || 'Mixed Plastics',
        weight: b.weight_kg || 0,
        value: b.total_price || 0,
        address: b.estate || 'Residential Area',
        createdAt: b.created_at,
        agentId: b.agent_id,
        originalData: b,
        lat: b.latitude,
        lng: b.longitude,
        tabState: 'active'
      })),
      ...marketplaceDispatchQueue.filter(o => o.status === 'pending').map(o => ({
        id: o.id,
        type: 'marketplace',
        displayId: `MKT-${o.id.substring(0, 4).toUpperCase()}`,
        material: o.material || 'Marketplace Material',
        weight: o.quantity || 0,
        value: o.total_price || 0,
        address: o.listing?.location || 'Seller Location',
        createdAt: o.created_at,
        agentId: o.agent_id,
        originalData: o,
        lat: o.listing?.latitude || null,
        lng: o.listing?.longitude || null,
        tabState: 'active'
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeFulfillments, residentDispatchQueue, marketplaceDispatchQueue, profile?.id]);

  const unifiedEnRoute = useMemo(() => {
    return [
      ...activeFulfillments.filter(o => o.status === 'in_transit' || o.status === 'picked_up').map(o => ({
        id: o.id,
        type: 'seller',
        displayId: `RFQ-${o.id.substring(0, 4).toUpperCase()}`,
        material: o.rfq?.category || 'Commercial Waste',
        weight: o.proposal?.offered_weight || 0,
        value: (o.proposal?.offered_weight || 0) * (o.proposal?.offered_price || 0),
        address: o.pickup_address || o.rfq?.pickup_area || 'Hub Location',
        createdAt: o.created_at,
        agentId: o.assigned_agent_id,
        originalData: o,
        lat: null,
        lng: null,
        tabState: 'enroute'
      })),
      ...residentDispatchQueue.filter(b => b.status === 'picked_up').map(b => ({
        id: b.id,
        type: 'resident',
        displayId: `RES-${b.id.substring(0, 4).toUpperCase()}`,
        material: b.waste_type || 'Mixed Plastics',
        weight: b.weight_kg || 0,
        value: b.total_price || 0,
        address: b.estate || 'Residential Area',
        createdAt: b.created_at,
        agentId: b.agent_id,
        originalData: b,
        lat: b.latitude,
        lng: b.longitude,
        tabState: 'enroute'
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeFulfillments, residentDispatchQueue]);

  const unifiedExceptions = useMemo(() => {
    const now = new Date().getTime();
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const exceptions: any[] = [];

    unifiedAwaiting.forEach(item => {
       if (now - new Date(item.createdAt).getTime() > THREE_HOURS) {
         exceptions.push({ ...item, exceptionReason: 'Awaiting > 3 Hours' });
       }
    });

    unifiedActive.forEach(item => {
       const lastUpdate = item.originalData?.updated_at || item.createdAt;
       if (now - new Date(lastUpdate).getTime() > THREE_HOURS) {
         exceptions.push({ ...item, exceptionReason: 'Driver Unresponsive (>3h)' });
       }
    });

    return exceptions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [unifiedAwaiting, unifiedActive]);

  const currentList = activeTab === 'awaiting' ? unifiedAwaiting : activeTab === 'active' ? unifiedActive : activeTab === 'enroute' ? unifiedEnRoute : activeTab === 'delayed' ? unifiedExceptions : [];
  const delayedCount = unifiedExceptions.length;

  return (
    <div className="flex h-full w-full relative bg-transparent">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-6 animate-fade-in pb-10 space-y-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#131722] dark:text-white">Dispatch Management</h1>
            <p className="text-[11px] mt-1 text-slate-500 dark:text-slate-400">Dispatch drivers, monitor active collections, and track fleet logistics in real-time.</p>
          </div>

        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-1 mt-2">
          
          {/* LEFT COLUMN: KPIs + Tabs + Content */}
          <div className={`col-span-1 ${activeTab !== 'analytics' && activeTab !== 'map' ? 'xl:col-span-8' : 'xl:col-span-12'} flex flex-col gap-2 transition-all duration-300`}>
            
            {/* Unified KPI + Tabs Card */}
            <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
              
              {/* 1. KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-1">
                {[
                  { label: 'Awaiting Dispatch', value: unifiedAwaiting.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/20', darkBg: 'dark:bg-amber-500/10', change: getChange(unifiedAwaiting.length, lastMonthKpis?.awaiting) },
                  { label: 'Active Pickups', value: unifiedActive.length, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/20', darkBg: 'dark:bg-emerald-500/10', change: getChange(unifiedActive.length, lastMonthKpis?.active) },
                  { label: 'En-Route', value: unifiedEnRoute.length, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/20', darkBg: 'dark:bg-blue-500/10', change: getChange(unifiedEnRoute.length, lastMonthKpis?.enroute) },
                  { label: 'Delayed', value: delayedCount, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/20', darkBg: 'dark:bg-rose-500/10', change: getChange(delayedCount, lastMonthKpis?.delayed) },
                  { label: 'Completed Today', value: completedTodayCount, icon: CheckCircle2, color: 'text-purple-500', bg: 'bg-purple-500/20', darkBg: 'dark:bg-purple-500/10', change: getChange(completedTodayCount, lastMonthKpis?.completed) },
                  { label: 'Weight Collected', value: totalWeightKg, unit: 'kg', icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/20', darkBg: 'dark:bg-emerald-500/10', change: getChange(parseFloat(totalWeightKg), lastMonthKpis?.weightKg) },
                ].map((kpi, i) => (
                  <div key={i} className="bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/30 rounded-xl p-3 flex items-center gap-2.5 transition-all hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-black/5 dark:to-white/5 rounded-bl-[3rem] -mr-4 -mt-4 opacity-50 group-hover:scale-110 transition-transform"></div>
                    
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} ${kpi.darkBg} flex items-center justify-center shrink-0 shadow-inner z-10`}>
                      <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                    </div>
                    
                    <div className="flex flex-col z-10">
                      <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">
                        {kpi.label}
                      </p>
                      <h3 className="text-lg font-black leading-none text-[#131722] dark:text-white tracking-tight">
                        {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value} {kpi.unit && <span className="text-xs text-slate-400 font-bold">{kpi.unit}</span>}
                      </h3>
                      {kpi.change != null ? (
                        <p className={`text-[9px] font-bold mt-1.5 tracking-wide uppercase ${kpi.change >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {kpi.change >= 0 ? '↑' : '↓'} {Math.abs(kpi.change)}% <span className="text-slate-400 dark:text-slate-500 font-medium normal-case">vs last month</span>
                        </p>
                      ) : (
                        <p className="text-[9px] font-bold mt-1.5 text-slate-400 dark:text-slate-500 tracking-wide uppercase">— No prior data</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tabs & Search */}
              <div className="flex flex-col xl:flex-row items-center justify-between bg-emerald-600 dark:bg-emerald-950/40 p-1.5 rounded-xl overflow-x-auto w-full custom-scrollbar border border-emerald-200/60 dark:border-emerald-800/30 shadow-inner gap-4">
                <div className="flex items-center gap-1 w-full xl:w-auto overflow-x-auto custom-scrollbar">
                  {[
                    { id: 'awaiting', label: `Awaiting (${unifiedAwaiting.length})` },
                    { id: 'active', label: `Active (${unifiedActive.length})` },
                    { id: 'enroute', label: `En-Route (${unifiedEnRoute.length})` },
                    { id: 'completed', label: `Completed (${completedTodayCount})` },
                    { id: 'delayed', label: `Exceptions (${delayedCount})` },
                    { id: 'map', label: 'Map View' },
                    { id: 'analytics', label: 'Analytics' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-2.5 px-3.5 text-xs font-bold capitalize transition-all rounded-lg whitespace-nowrap ${
                        activeTab === tab.id 
                          ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-[#e0e3eb] dark:border-slate-700/50' 
                          : 'text-emerald-100 hover:text-white dark:hover:text-emerald-400 hover:bg-emerald-700/50 dark:hover:bg-slate-800/50 border border-transparent'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                
                <div className="relative w-full xl:w-64 shrink-0 px-1 xl:px-0 xl:pr-1 pb-1 xl:pb-0">
                  <Search className="absolute left-4 xl:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-700/50 dark:text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search dispatches..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-emerald-white dark:bg-slate-900 border-none rounded-lg text-xs outline-none focus:ring-2 focus:ring-white/50 dark:text-slate-600 text-slate-600 placeholder:text-slate-600 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Conditional Content based on Tab */}
            {activeTab === 'analytics' ? (
              
              /* ANALYTICS VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl p-6 flex flex-col min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500"/> Dispatch Performance</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Pickups vs Kg Collected ({analyticsTimeframe === 'daily' ? 'Last 24 Hours' : 'Last 7 Days'})</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-1 flex">
                      <button onClick={() => setAnalyticsTimeframe('daily')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${analyticsTimeframe === 'daily' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#131722] dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Daily</button>
                      <button onClick={() => setAnalyticsTimeframe('weekly')} className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${analyticsTimeframe === 'weekly' ? 'bg-white dark:bg-slate-700 shadow-sm text-[#131722] dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Weekly</button>
                    </div>
                    <div className="flex gap-4 ml-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-emerald-500"></div> Pickups</div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><div className="w-3 h-3 rounded bg-blue-500"></div> Kg Collected</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Pickups Completed</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">{analyticsData.completedCount}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Weight Collected</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">{analyticsData.totalWeightKg} <span className="text-sm">kg</span></p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Total Value Moved</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-xl text-[#131722] dark:text-white">KES {analyticsData.totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-[#e0e3eb] dark:border-slate-700/50">
                    <p className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-tight mb-2">Avg Dispatch Time</p>
                    <div className="flex items-end justify-between">
                      <p className="font-black text-2xl text-[#131722] dark:text-white">--</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorValue2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      <Area type="monotone" dataKey="value2" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            ) : activeTab === 'map' ? (
              
              /* MAP VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-sm h-[600px] relative">
                <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between z-10 absolute top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-[#131722] dark:text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-500"/> Live Operations Map
                  </h3>
                  <div className="flex gap-3">
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Pending</span>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full mt-14 z-0">
                  <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} zoomControl={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <MapBoundsFitter items={[...unifiedAwaiting, ...unifiedActive, ...unifiedEnRoute]} drivers={onlineDrivers} />
                    
                    {/* Plot Drivers */}
                    {onlineDrivers.filter(d => d.location?.latitude != null && d.location?.longitude != null).map(driver => {
                      const isEnRoute = unifiedEnRoute.some(r => r.agentId === driver.id);
                      return (
                        <Marker key={driver.id} position={[driver.location.latitude, driver.location.longitude]} icon={createDriverIcon(isEnRoute)}>
                          <Popup><span className="font-bold text-xs">{driver.name}</span></Popup>
                        </Marker>
                      );
                    })}

                    {/* Plot Pickups */}
                    {[...unifiedAwaiting, ...unifiedActive, ...unifiedEnRoute]
                      .filter(i => i.lat != null && i.lng != null)
                      .map(item => (
                        <Marker key={item.id} position={[item.lat, item.lng]} icon={createPickupIcon(item.tabState)}>
                          <Popup>
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-xs capitalize text-[#131722]">
                                {(item.originalData?.resident?.name || item.originalData?.seller?.name || 'Client').split(' ')[0]}
                              </span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-widest">{item.material}</span>
                              <span className="text-xs font-bold text-emerald-600 mt-1">{item.weight} kg</span>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                  </MapContainer>
                </div>
              </div>

            ) : (

              /* QUEUE LIST VIEW */
              <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-sm h-[600px]">
                
                <div className="flex-1 overflow-x-auto p-0 rounded-b-2xl">
                  {isLoading ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>
                  ) : currentList.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                      <PackageCheck className="w-8 h-8 text-slate-300 mb-3" />
                      <p className="font-bold text-sm text-[#131722] dark:text-white">No items found</p>
                      <p className="text-xs text-slate-500 mt-1">Your {activeTab} queue is empty.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left min-w-[1000px]">
                      <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-[#e0e3eb] dark:border-slate-800 sticky top-0 z-10 backdrop-blur-xl">
                        <tr>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Proof</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pickup Type</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Material / Cat</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Client</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Location</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Est Value</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date & Time</th>
                          <th className="p-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dispatch ID</th>
                        </tr>
                      </thead>
                      <motion.tbody layout className="divide-y divide-[#e0e3eb] dark:divide-slate-800">
                        <AnimatePresence>
                          {currentList.map(order => {
                            const pConf = getPriorityConfig(order.weight);
                            return (
                              <motion.tr 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                key={order.id} 
                                onClick={() => setFocusedItemId(order.id)}
                                className={`transition-colors group cursor-pointer ${focusedItemId === order.id ? 'bg-emerald-50/50 dark:bg-emerald-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'}`}
                              >
                                {/* Proof */}
                                <td className="p-4 align-middle">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                    <img 
                                      src={order.originalData?.photo_url || order.originalData?.listing?.photo_url || (order.type === 'resident' ? 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400' : 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=400')} 
                                      alt="Material" 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                  </div>
                                </td>
                                
                                {/* Pickup Type */}
                                <td className="p-4 align-middle">
                                  <div className="flex flex-col gap-1.5 items-start">
                                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase ${
                                      order.type === 'resident' ? 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' : order.type === 'marketplace' ? 'bg-teal-50 text-teal-600 border border-teal-100 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-500/20' : 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                    }`}>
                                      {order.type === 'resident' ? 'Resident' : order.type === 'marketplace' ? 'Marketplace' : 'Seller Trade'}
                                    </span>
                                    {order.exceptionReason && (
                                      <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30">
                                        {order.exceptionReason}
                                      </span>
                                    )}
                                </div>
                              </td>
                              
                              {/* Material */}
                              <td className="p-4 align-middle">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-[#131722] dark:text-white capitalize">{order.material}</span>
                                  <span className={`text-[9px] font-bold mt-1 uppercase tracking-widest w-max px-1.5 py-0.5 rounded ${pConf.color}`}>{pConf.label} Priority</span>
                                </div>
                              </td>
                              
                              {/* Client */}
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 shrink-0 shadow-sm">
                                    <img 
                                       src={order.originalData?.resident?.avatar_url || order.originalData?.seller?.avatar_url || 'https://www.gravatar.com/avatar/000?d=mp&f=y'} 
                                       alt="Avatar"
                                       className="w-full h-full object-cover" 
                                     />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-xs text-[#131722] dark:text-white truncate max-w-[120px]">{order.originalData?.resident?.name || order.originalData?.seller?.name || 'Client'}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Location */}
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300" title={order.address}>
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                  <span className="text-xs font-medium truncate max-w-[140px]">{order.address}</span>
                                </div>
                              </td>
                              
                              {/* Weight */}
                              <td className="p-4 align-middle">
                                <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded inline-flex whitespace-nowrap">
                                  {order.weight} kg
                                </span>
                              </td>
                              
                              {/* Est Value */}
                              <td className="p-4 align-middle">
                                <span className="font-black text-sm text-[#131722] dark:text-white">
                                  KES {(order.value || 0).toLocaleString()}
                                </span>
                              </td>
                              
                              {/* Date & Time */}
                              <td className="p-4 align-middle">
                                <div className="flex items-center gap-2 text-slate-500">
                                  <Clock className="w-4 h-4 shrink-0" />
                                  <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString()}</span>
                                    <span className="text-[11px] font-bold text-[#131722] dark:text-white">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Dispatch ID */}
                              <td className="p-4 align-middle">
                                <span className="font-black text-xs text-[#131722] dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
                                  {order.displayId}
                                </span>
                              </td>
                            </motion.tr>
                          );
                        })}
                        </AnimatePresence>
                      </motion.tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT COLUMN: Details Card */}
          <AnimatePresence>
            {activeTab !== 'analytics' && activeTab !== 'map' && (() => {
              const order = focusedItemId ? currentList.find(i => i.id === focusedItemId) : null;
              
              if (!order) {
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="xl:col-span-4 flex flex-col h-[700px] sticky top-6"
                  >
                    <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-center shadow-sm h-full p-8 relative">
                      <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4">
                        <PackageCheck className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="font-black text-lg text-[#131722] dark:text-white mb-2">No Dispatch Selected</h3>
                      <p className="text-sm font-medium text-slate-500">Click on any dispatch entry in the table to view its full details, client info, and assign a driver.</p>
                    </div>
                  </motion.div>
                );
              }
              
              const pConf = getPriorityConfig(order.weight);
              const avatar = order.originalData?.resident?.avatar_url || order.originalData?.seller?.avatar_url || 'https://www.gravatar.com/avatar/000?d=mp&f=y';
              const name = order.originalData?.resident?.name || order.originalData?.seller?.name || 'Client';
              const image = order.originalData?.photo_url || order.originalData?.listing?.photo_url || (order.type === 'resident' ? 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=400' : 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&q=80&w=400');

              return (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="xl:col-span-4 flex flex-col max-h-[calc(100vh-140px)] sticky top-6"
                >
                  <div className="bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
                    <div className="p-4 border-b border-[#e0e3eb] dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="text-sm font-bold text-[#131722] dark:text-white capitalize flex items-center gap-2">
                        <Info className="w-4 h-4 text-emerald-500"/> Dispatch Details
                      </h3>
                      <button onClick={() => setFocusedItemId(null)} className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors shadow-sm">
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6 relative">
                      
                      {/* Top Header: Image + Client Details */}
                      <div className="flex gap-6 items-start">
                        {/* Image Thumbnail */}
                        <div className="w-64 h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 relative shadow-sm">
                          <img src={image} alt="Proof" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        </div>
                        
                        {/* Client Details */}
                        <div className="flex flex-col flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Users className="w-3 h-3"/> Client Details</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-600 shadow-sm border border-slate-200 dark:border-slate-600 shrink-0">
                              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-sm text-[#131722] dark:text-white truncate max-w-[200px]">{name}</span>
                              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-0.5 truncate" title={new Date(order.createdAt).toLocaleString()}>
                                <Clock className="w-3 h-3 shrink-0"/> Requested on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dispatch ID</p>
                            <h4 className="font-black text-lg text-[#131722] dark:text-white">{order.displayId}</h4>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest uppercase shadow-sm ${
                              order.type === 'resident' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                            }`}>
                              {order.type === 'resident' ? 'Resident Pickup' : 'Seller Trade'}
                            </span>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 ${pConf.color.replace('bg-', 'border-l-2 border-')}`}>
                              {pConf.label} Priority
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><PackageCheck className="w-3 h-3"/> Material</p>
                            <p className="font-bold text-sm text-[#131722] dark:text-white capitalize truncate">{order.material}</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</p>
                            <p className="font-bold text-sm text-[#131722] dark:text-white capitalize truncate">{order.address}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex flex-col">
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">Est. Weight</p>
                            <p className="font-black text-lg text-emerald-700 dark:text-emerald-300">{order.weight} <span className="text-sm">kg</span></p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20 flex flex-col">
                            <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">Est. Value</p>
                            <p className="font-black text-lg text-blue-700 dark:text-blue-300">KES {(order.value || 0).toLocaleString()}</p>
                            <p className="text-[8.5px] font-bold text-blue-500/80 dark:text-blue-400/80 mt-1.5 leading-tight">*Not final. Calculated after agent verifies weight on-site.</p>
                          </div>
                        </div>

                        <hr className="border-slate-100 dark:border-slate-700/50" />

                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Info className="w-3 h-3"/> Notes / Instructions</p>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {order.originalData?.notes || order.originalData?.rfq?.notes || order.originalData?.instructions || 'No additional notes provided for this dispatch.'}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 border-t border-[#e0e3eb] dark:border-slate-700/50 bg-white dark:bg-slate-800">
                      {activeTab === 'awaiting' ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenAssign(order); }}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Truck className="w-5 h-5" /> Assign Driver Now
                        </button>
                      ) : activeTab === 'delayed' ? (
                        <div className="w-full bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 text-rose-600 dark:text-rose-400 px-5 py-4 rounded-xl flex items-center justify-between cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
                              <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-500">Manual Review Required</span>
                              <span className="text-xs font-black mt-0.5 truncate">{order.exceptionReason}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 px-5 py-4 rounded-xl flex items-center justify-between cursor-default">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">
                                {activeTab === 'enroute' ? 'En-Route to Hub' : 'Currently Active'}
                              </span>
                              <span className="text-xs font-black text-[#131722] dark:text-white mt-0.5 truncate">
                                {(() => {
                                  const driver = fleetDrivers.find(d => d.id === order.agentId);
                                  return driver ? `Agent ${driver.name.split(' ')[0]}` : 'Agent';
                                })()} Assigned
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>

        </div>
      </div>

      {/* ASSIGNMENT SIDE PANEL (DRAWER) */}
      <AnimatePresence>
        {isAssignModalOpen && selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsAssignModalOpen(false)} 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
            />
            
            {/* Side Panel */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-[101] flex flex-col border-l border-[#e0e3eb] dark:border-slate-800"
            >
              
              {/* Header */}
              <div className="p-6 border-b border-[#e0e3eb] dark:border-slate-800 flex flex-col gap-5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#131722] dark:text-white">Assign Fleet Driver</h2>
                    <p className="font-bold text-[11px] text-slate-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                      <span className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[#131722] dark:text-white shadow-sm">ID: {selectedOrder.displayId}</span>
                      <span className="flex items-center gap-1 truncate max-w-[200px] text-emerald-600 dark:text-emerald-500"><MapPin className="w-3 h-3"/> {selectedOrder.address || 'Hub'}</span>
                    </p>
                  </div>
                  <button onClick={() => setIsAssignModalOpen(false)} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-[#e0e3eb] dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors shadow-sm hover:shadow">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search available drivers..." 
                    value={driverSearchQuery}
                    onChange={(e) => setDriverSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-[#e0e3eb] dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-[#131722] dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-sm placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Driver List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-50/30 dark:bg-[#0b0f19]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Agents ({onlineDrivers.length})</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Updating</span>
                </div>
                
                {onlineDrivers.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-sm">
                      {driverSearchQuery ? <Search className="w-10 h-10 text-slate-300" /> : <Truck className="w-10 h-10 text-slate-300" />}
                    </div>
                    <p className="font-black text-lg text-[#131722] dark:text-white mb-1">
                      {driverSearchQuery ? 'No drivers found' : 'No Active Drivers'}
                    </p>
                    <p className="text-sm font-medium text-slate-500 max-w-[250px]">
                      {driverSearchQuery ? 'Try adjusting your search criteria.' : 'Your fleet drivers need to go online in the Agent App to receive dispatches.'}
                    </p>
                  </div>
                ) : (
                  onlineDrivers.map(driver => (
                      <div key={driver.id} className="w-full bg-white dark:bg-slate-900 border border-[#e0e3eb] dark:border-slate-800 rounded-xl p-3 flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:shadow-sm transition-all group">
                        
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-sm border border-emerald-100 dark:border-emerald-500/20 shadow-sm overflow-hidden">
                              {driver.avatar_url ? (
                                <img src={driver.avatar_url} alt={driver.name || 'Driver'} className="w-full h-full object-cover" />
                              ) : (
                                driver.name?.charAt(0) || 'D'
                              )}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm flex items-center justify-center">
                               <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="font-bold text-sm text-[#131722] dark:text-white">{driver.name || 'Unnamed Driver'}</p>
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Fleet Agent</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleAssignDriver(driver.id)} 
                          disabled={isAssigning} 
                          className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-widest rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isAssigning ? '...' : 'Assign'} <ArrowRight className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                        </button>
                      </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </div>
  );
}