export { useAuthStore, getBusinessLabel, normalizePhone, phoneToEmail } from './stores/authStore.js';
export * from './stores/hygenexStore.js';
export * from './stores/iotStore.js';
export * from './stores/bookingStore.js';
export * from './stores/agentStore.js';
export * from './stores/adminStore.js';
export * from './stores/themeStore.js';
export * from './stores/marketplaceStore.js';
export * from './stores/notificationStore.js';
export * from './stores/systemStore.js';
export * from './stores/feedbackStore.js';
export * from './stores/assetStore.js';
export * from './stores/priceStore.js';
export * from './stores/serviceStore.js';
export * from './stores/settingsStore.js';
export * from './lib/hygenexAgent.js';
export * from './lib/supabaseClient.js';
export * from './lib/storage.js';

// Re-export constants and mock data for convenience
export * from '@cleanflow/constants';
export * from './data/mockData.js';
export * from './data/wasteDefinitions.js';
export * from './hooks/usePWA.js';
export * from './utils/imageUtils.js';
