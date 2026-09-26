import { useMemo } from 'react';
import { useAgentStore } from '@klinflow/core/stores/agentStore';
import { useFulfillmentStore } from '@klinflow/core/stores/fulfillmentStore';

export interface NormalizedNextPickup {
  id: string;
  source: 'bookings' | 'fulfillment_orders' | 'market_trades';
  status: string;
  pickupAddress: string;
  latitude?: number;
  longitude?: number;
  material: string;
  estimatedWeight: number;
  actualWeight?: number;
  scheduledAt: string;
  customerName?: string;
  customerPhone?: string;
  estimatedValue?: number;
  originalJob: any; // Keep reference to original for navigation
}

export function useNextPickup(): { nextPickup: NormalizedNextPickup | null, isLoading: boolean } {
  const activeJobs = useAgentStore(s => s.activeJobs);
  const availableJobs = useAgentStore(s => s.availableJobs); // For pending jobs
  const arrivedJobIds = useAgentStore(s => s.arrivedJobIds);
  const isLoadingJobs = useAgentStore(s => s.isLoadingJobs);
  
  const activeFulfillments = useFulfillmentStore(s => s.activeFulfillments);
  const isLoadingFulfillments = useFulfillmentStore(s => s.isLoadingActiveFulfillments);

  const nextPickup = useMemo(() => {
    // 1. Normalize active Jobs (Standard & Market Trades)
    const normalizedJobs: NormalizedNextPickup[] = activeJobs.map(j => ({
      id: j.id,
      source: j.is_market_trade || j.booking_type === 'marketplace_pickup' ? 'market_trades' : 'bookings',
      status: j.status,
      pickupAddress: j.location,
      latitude: j.latitude,
      longitude: j.longitude,
      material: j.material,
      estimatedWeight: j.weight_kg || 0,
      actualWeight: j.actual_weight_kg || undefined,
      scheduledAt: j.time || j.date || 'ASAP',
      customerName: j.customerName || j.customer,
      customerPhone: j.phone,
      estimatedValue: j.pay || j.total_price || 0,
      originalJob: j,
    }));

    // 2. Normalize active Fulfillments (B2B)
    const normalizedFulfillments: NormalizedNextPickup[] = activeFulfillments
      .filter(f => !['completed', 'cancelled'].includes(f.status))
      .map(f => ({
        id: f.id,
        source: 'fulfillment_orders',
        status: f.status === 'agent_assigned' ? 'accepted' : f.status,
        pickupAddress: f.pickup_address || 'Address hidden',
        latitude: undefined,
        longitude: undefined,
        material: f.rfq?.material_type || 'Mixed Material',
        estimatedWeight: (f as any).proposal?.offered_weight || (f as any).rfq?.target_quantity || 0,
        actualWeight: f.actual_weight || f.verified_weight || undefined,
        scheduledAt: f.scheduled_time || 'ASAP',
        customerName: 'Marketplace Seller',
        customerPhone: undefined,
        estimatedValue: undefined,
        originalJob: f,
      }));

    // 3. Normalize Pending Requests (Available Jobs targeted to agent or open)
    const normalizedAvailable: NormalizedNextPickup[] = availableJobs.map(j => ({
      id: j.id,
      source: j.is_market_trade || j.booking_type === 'marketplace_pickup' ? 'market_trades' : 'bookings',
      status: j.status, // Should be 'pending'
      pickupAddress: j.location,
      latitude: j.latitude,
      longitude: j.longitude,
      material: j.material,
      estimatedWeight: j.weight_kg || 0,
      actualWeight: j.actual_weight_kg || undefined,
      scheduledAt: j.time || j.date || 'ASAP',
      customerName: j.customerName || j.customer,
      customerPhone: j.phone,
      estimatedValue: j.pay || j.total_price || 0,
      originalJob: j,
    }));

    const allCombined = [...normalizedJobs, ...normalizedFulfillments, ...normalizedAvailable];

    if (allCombined.length === 0) return null;

    // Remove duplicates based on ID (just in case)
    const uniqueMap = new Map<string, NormalizedNextPickup>();
    allCombined.forEach(job => uniqueMap.set(job.id, job));
    const uniqueCombined = Array.from(uniqueMap.values());

    // Priority 1: Arrived jobs
    const arrivedJob = uniqueCombined.find(j => arrivedJobIds.includes(j.id));
    if (arrivedJob) return arrivedJob;

    // Priority 2: Active / In Progress jobs
    const inProgressJob = uniqueCombined.find(j => j.status === 'in_progress');
    if (inProgressJob) return inProgressJob;

    // Priority 3: ASAP Accepted jobs
    const asapJob = uniqueCombined.find(j => 
      ['accepted', 'confirmed', 'scheduled', 'agent_assigned'].includes(j.status) && 
      j.scheduledAt.toUpperCase() === 'ASAP'
    );
    if (asapJob) return asapJob;

    // Priority 4: Scheduled Accepted jobs (Earliest first)
    // Simple sort for now, assuming ISO string or comparable date string for scheduledAt.
    // If it's just '10:00 AM' it's tricky, but we pick the first available for now.
    const scheduledJobs = uniqueCombined.filter(j => 
      ['accepted', 'confirmed', 'scheduled', 'agent_assigned'].includes(j.status)
    );
    if (scheduledJobs.length > 0) return scheduledJobs[0]; // TODO: Add robust date parsing if needed

    // Priority 5: Pending Requests
    const pendingJob = uniqueCombined.find(j => j.status === 'pending');
    if (pendingJob) return pendingJob;

    return null;
  }, [activeJobs, activeFulfillments, availableJobs, arrivedJobIds]);

  return {
    nextPickup,
    isLoading: isLoadingJobs || isLoadingFulfillments,
  };
}
