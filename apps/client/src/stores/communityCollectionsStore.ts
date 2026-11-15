import { create } from 'zustand';

export type CollectionMethod = 'collection_point' | 'agent_pickup';
export type CollectionStatus = 'published' | 'active' | 'completed' | 'draft' | 'cancelled';
export type SupportedMaterial = 'Plastic' | 'Paper' | 'Metal' | 'Glass' | 'Other';

export interface ResidentParticipation {
  hasJoined: boolean;
  estimatedWeightKg?: number;
  joinedAt?: string;
  actualAcceptedWeightKg?: number; // only when completed
}

export interface CommunityCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  organizingHub: string;
  location: string;
  collectionMethod: CollectionMethod;
  collectionPointAddress?: string;
  pickupAreaInstructions?: string;
  acceptedMaterials: SupportedMaterial[];
  scheduledDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  preparationInstructions: string;
  estimatedTargetWeightKg?: number;
  currentEstimatedWeightKg: number;
  participantCount: number;
  status: CollectionStatus;
  minParticipantsThreshold?: number;
  maxParticipants?: number;
  actualAcceptedWeightKg?: number; // aggregate actual intake weight when completed
  completedAt?: string;
  createdAt: string;
  residentParticipation?: ResidentParticipation;
}

interface CommunityCollectionsState {
  collections: CommunityCollection[];
  searchQuery: string;
  selectedMaterial: string; // 'All' | SupportedMaterial
  selectedMethod: string; // 'All' | CollectionMethod
  activeTab: 'discover' | 'active' | 'completed';

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedMaterial: (material: string) => void;
  setSelectedMethod: (method: string) => void;
  setActiveTab: (tab: 'discover' | 'active' | 'completed') => void;
  joinCollection: (id: string, estimatedWeightKg: number) => { success: boolean; error?: string };
  getCollectionById: (id: string) => CommunityCollection | undefined;
}

const INITIAL_COLLECTIONS: CommunityCollection[] = [
  {
    id: 'CC-101',
    name: 'Kilimani Estate Plastics & Cans Drive',
    description: 'Community-wide collection drop-off for clean beverage bottles, HDPE milk jugs, and aluminium beverage cans. Drop off your sorted recyclables at the gate center.',
    image: '/material-categories/plastic.webp',
    organizingHub: 'Kariobangi Recovery Hub',
    location: 'Kilimani Estate, Ring Road',
    collectionMethod: 'collection_point',
    collectionPointAddress: 'Gate 3 Community Center, Wood Avenue, Kilimani',
    acceptedMaterials: ['Plastic', 'Metal'],
    scheduledDate: '2026-11-21',
    startTime: '09:00',
    endTime: '13:00',
    preparationInstructions: 'Rinse all bottles and containers clean. Flatten cans and plastic bottles to save space. Sort plastics and cans into separate tied bags.',
    estimatedTargetWeightKg: 350,
    currentEstimatedWeightKg: 240,
    participantCount: 28,
    status: 'published',
    minParticipantsThreshold: 15,
    maxParticipants: 60,
    createdAt: '2026-11-01',
    residentParticipation: {
      hasJoined: false,
    },
  },
  {
    id: 'CC-102',
    name: 'South B Cardboard & Paper Sweep',
    description: 'Motorized tuk-tuk sweep picking up clean dry cardboard, packaging boxes, books, and office paper directly along residential court lanes.',
    image: '/material-categories/boxes.webp',
    organizingHub: 'Kariobangi Recovery Hub',
    location: 'South B Golden Gate',
    collectionMethod: 'agent_pickup',
    pickupAreaInstructions: 'Place tied cardboard bundles outside your front gate or apartment unit door by 08:30 for electric tuk-tuk pickup.',
    acceptedMaterials: ['Paper'],
    scheduledDate: '2026-11-18',
    startTime: '08:30',
    endTime: '11:30',
    preparationInstructions: 'Keep cardboard completely dry. Flatten all carton boxes and tie firmly with string or heavy tape. Remove any Styrofoam or plastic bubble wrap.',
    estimatedTargetWeightKg: 200,
    currentEstimatedWeightKg: 145,
    participantCount: 19,
    status: 'active',
    minParticipantsThreshold: 10,
    maxParticipants: 40,
    createdAt: '2026-11-03',
    // Pre-joined sample in Active tab to illustrate the resident active experience
    residentParticipation: {
      hasJoined: true,
      estimatedWeightKg: 12.5,
      joinedAt: '2026-11-07',
    },
  },
  {
    id: 'CC-103',
    name: 'Parklands Glass Recovery Drive',
    description: 'Centralized glass drop-off for clean clear, green, and amber glass bottles and jars. Calibrated scales on site with safe handling bins.',
    image: '/material-categories/glasses.webp',
    organizingHub: 'Kariobangi Recovery Hub',
    location: 'Parklands 4th Avenue',
    collectionMethod: 'collection_point',
    collectionPointAddress: 'Parklands Sports Club Service Lane Gate, 4th Avenue',
    acceptedMaterials: ['Glass'],
    scheduledDate: '2026-11-28',
    startTime: '10:00',
    endTime: '15:00',
    preparationInstructions: 'Ensure glass is rinsed clean. Remove plastic and metal screw caps. Do not include broken glass shards or window pane glass.',
    estimatedTargetWeightKg: 500,
    currentEstimatedWeightKg: 80,
    participantCount: 11,
    status: 'published',
    minParticipantsThreshold: 20,
    maxParticipants: 80,
    createdAt: '2026-11-05',
    residentParticipation: {
      hasJoined: false,
    },
  },
  {
    id: 'CC-104',
    name: 'Kileleshwa Mixed Recyclables Pilot',
    description: 'Successful neighborhood pilot collection covering Mandera Road and Siaya Road courts with dedicated route sweep vehicles.',
    image: '/material-categories/recyclables.webp',
    organizingHub: 'Kariobangi Recovery Hub',
    location: 'Kileleshwa Mandera Road',
    collectionMethod: 'agent_pickup',
    pickupAreaInstructions: 'Curbside collection along Mandera Rd and Siaya Rd residential lanes.',
    acceptedMaterials: ['Plastic', 'Metal', 'Paper'],
    scheduledDate: '2026-11-04',
    startTime: '09:00',
    endTime: '12:00',
    preparationInstructions: 'Sort items by material category into separate bags and label with your KlinFlow ID.',
    estimatedTargetWeightKg: 300,
    currentEstimatedWeightKg: 320,
    participantCount: 34,
    actualAcceptedWeightKg: 312,
    completedAt: 'Nov 4, 2026',
    status: 'completed',
    createdAt: '2026-10-25',
    residentParticipation: {
      hasJoined: true,
      estimatedWeightKg: 15.0,
      actualAcceptedWeightKg: 14.8,
      joinedAt: '2026-10-29',
    },
  },
  {
    id: 'CC-106',
    name: 'Westlands Clean Can & Tin Aggregation',
    description: 'Community drop-off for aluminium drink cans, tin food cans, and clean scrap metal. Organised with Westlands residents committee.',
    image: '/material-categories/metal.webp',
    organizingHub: 'Kariobangi Recovery Hub',
    location: 'Westlands Mpaka Road',
    collectionMethod: 'collection_point',
    collectionPointAddress: 'Mpaka Road Community Square, Westlands',
    acceptedMaterials: ['Metal'],
    scheduledDate: '2026-12-02',
    startTime: '09:30',
    endTime: '13:30',
    preparationInstructions: 'Rinse food cans to remove organic residues. Step on beverage cans to flatten. Separate ferrous tins from aluminium cans if possible.',
    estimatedTargetWeightKg: 280,
    currentEstimatedWeightKg: 65,
    participantCount: 8,
    status: 'published',
    minParticipantsThreshold: 12,
    maxParticipants: 50,
    createdAt: '2026-11-06',
    residentParticipation: {
      hasJoined: false,
    },
  },
];

export const useCommunityCollectionsStore = create<CommunityCollectionsState>((set, get) => ({
  collections: INITIAL_COLLECTIONS,
  searchQuery: '',
  selectedMaterial: 'All',
  selectedMethod: 'All',
  activeTab: 'discover',

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedMaterial: (selectedMaterial) => set({ selectedMaterial }),
  setSelectedMethod: (selectedMethod) => set({ selectedMethod }),
  setActiveTab: (activeTab) => set({ activeTab }),

  joinCollection: (id, estimatedWeightKg) => {
    if (!estimatedWeightKg || isNaN(estimatedWeightKg) || estimatedWeightKg <= 0) {
      return { success: false, error: 'Please enter a valid positive weight in kilograms.' };
    }

    const { collections } = get();
    const target = collections.find(c => c.id === id);
    if (!target) {
      return { success: false, error: 'Collection not found.' };
    }

    if (target.residentParticipation?.hasJoined) {
      return { success: false, error: 'You have already joined this collection.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const updated = collections.map(c => {
      if (c.id !== id) return c;
      return {
        ...c,
        participantCount: c.participantCount + 1,
        currentEstimatedWeightKg: Number((c.currentEstimatedWeightKg + estimatedWeightKg).toFixed(1)),
        residentParticipation: {
          hasJoined: true,
          estimatedWeightKg: Number(estimatedWeightKg.toFixed(1)),
          joinedAt: todayStr,
        },
      };
    });

    set({ collections: updated });
    return { success: true };
  },

  getCollectionById: (id) => {
    return get().collections.find(c => c.id === id);
  },
}));

