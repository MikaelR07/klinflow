/**
 * Mock data for CleanFlow KE
 * All data uses realistic Kenyan context: Nairobi estates, KSh currency, local names
 */

/* ── Waste Types ─────────────────────────────────────────────────── */
/* ── Waste Types (Weight-Based Pricing) ────────────────────────── */
export const WASTE_TYPES = [
  { id: 'general', label: 'General Waste', icon: '🗑️', price: 15, minOperationalCost: 10, unit: 'kg' },
  { id: 'recyclable', label: 'Recyclables', icon: '♻️', price: 8, minOperationalCost: 3, unit: 'kg' },
  { id: 'organic', label: 'Organic / Food', icon: '🥬', price: 10, minOperationalCost: 5, unit: 'kg' },
  { id: 'electronic', label: 'E-Waste', icon: '📱', price: 500, minOperationalCost: 250, unit: 'item' },
  { id: 'bulky', label: 'Bulky Items', icon: '🛋️', price: 300, minOperationalCost: 150, unit: 'item' },
  { id: 'appliance', label: 'Large Appliances', icon: '🧊', price: 1500, minOperationalCost: 800, unit: 'item' },
  { id: 'hazardous', label: 'Hazardous', icon: '⚠️', price: 1000, minOperationalCost: 600, unit: 'container' },
];

export const PRICING_CONSTANTS = {
  MIN_PICKUP_PRICE: 100,
  KM_LOGISTICS_RATE: 40,
  KG_XP_REWARD: 5,
};

/* ── Subscription Tiers (Platform Access Plans) ─────────────────── */
export const SUBSCRIPTION_TIERS = {
  lite: {
    id: 'lite', 
    label: 'Basic', 
    impactTag: 'Member',
    price: 0, 
    platformFee: 0,
    rewardMult: 1,
    features: ['Access to all verified fleets', 'Pay as you go logistics', 'Earn standard points (1x)'], 
  },
  standard: {
    id: 'standard', 
    label: 'CleanFlow Plus', 
    impactTag: 'Eco Hero',
    price: 1000, 
    platformFee: 0,
    rewardMult: 2,
    features: ['Unlimited Priority Booking', '2x Reward Points Boost', 'Monthly Impact Certificates', 'Priority Platform Support'], 
  },
  premium: {
    id: 'premium', 
    label: 'CleanFlow Elite', 
    impactTag: 'Climate Leader',
    price: 2500, 
    platformFee: 0,
    rewardMult: 3.5,
    features: ['Link up to 3 properties', '3.5x Elite Points Multiplier', 'Verified Payment Protection', 'Elite Resident Badge'], 
  }
};

/* ── Reward Constants ────────────────────────────────────────────── */
export const REWARD_CONSTANTS = {
  CASHBACK_PER_BAG: 20,
  POINTS_PER_KG: 10,
};

/* ── Nairobi Estates / Areas ─────────────────────────────────────── */
export const ESTATES = [
  'South B', 'South C', 'Eastleigh', 'Pangani', 'Umoja', 'Buruburu',
  'Donholm', 'Embakasi', 'Kasarani', 'Roysambu', 'Zimmerman',
  'Kahawa West', 'Ruaka', 'Kilimani', 'Lavington', 'Westlands',
  'Parklands', 'Ngara', 'Mathare', 'Kibera', 'Lang\'ata', 'Karen',
  'Rongai', 'Kitengela', 'Syokimau', 'Athi River', 'Thika Road',
];

export const ESTATE_COORDINATES = {
  'South B': { lat: -1.3093, lng: 36.8329 },
  'South C': { lat: -1.3200, lng: 36.8300 },
  'Eastleigh': { lat: -1.2755, lng: 36.8485 },
  'Pangani': { lat: -1.2650, lng: 36.8380 },
  'Umoja': { lat: -1.2900, lng: 36.8750 },
  'Buruburu': { lat: -1.2850, lng: 36.8900 },
  'Donholm': { lat: -1.2950, lng: 36.8850 },
  'Embakasi': { lat: -1.3200, lng: 36.9100 },
  'Kasarani': { lat: -1.2200, lng: 36.8900 },
  'Roysambu': { lat: -1.2150, lng: 36.8850 },
  'Zimmerman': { lat: -1.2100, lng: 36.8750 },
  'Kahawa West': { lat: -1.1800, lng: 36.8800 },
  'Ruaka': { lat: -1.2057, lng: 36.7725 },
  'Kilimani': { lat: -1.2900, lng: 36.7900 },
  'Lavington': { lat: -1.2800, lng: 36.7700 },
  'Westlands': { lat: -1.2652, lng: 36.8022 },
  'Parklands': { lat: -1.2550, lng: 36.8150 },
  'Ngara': { lat: -1.2750, lng: 36.8250 },
  'Mathare': { lat: -1.2500, lng: 36.8500 },
  'Kibera': { lat: -1.3100, lng: 36.7900 },
  'Lang\'ata': { lat: -1.3300, lng: 36.8000 },
  'Karen': { lat: -1.3200, lng: 36.7000 },
  'Rongai': { lat: -1.3934, lng: 36.7587 },
  'Kitengela': { lat: -1.4800, lng: 36.9600 },
  'Syokimau': { lat: -1.3500, lng: 36.9300 },
  'Athi River': { lat: -1.4500, lng: 36.9800 },
  'Thika Road': { lat: -1.1500, lng: 36.9500 },
};

/* ── AI Suggested Times ──────────────────────────────────────────── */
export const AI_PICKUP_TIMES = [
  { 
    id: 'suggest-1',
    time: 'Tue, 6:00 AM', 
    discount: 35, 
    isAI: true, 
    reason: 'Waste levels are high • Eco-friendly slot',
    fillLevel: 85,
    co2Saved: 1.4,
    groupingCount: 3,
    confidence: 96,
    type: 'urgency'
  },
  { 
    id: 'suggest-2',
    time: 'Wed, 10:00 AM', 
    discount: 20, 
    reason: 'Standard morning slot',
    fillLevel: 45,
    co2Saved: 0.2,
    groupingCount: 0,
    confidence: 100,
    type: 'manual'
  },
  { 
    id: 'suggest-4',
    time: 'Sat, 9:00 AM', 
    discount: 40, 
    isAI: true, 
    reason: 'Weekend optimizer • Route density high',
    fillLevel: 95,
    co2Saved: 2.1,
    groupingCount: 8,
    confidence: 99,
    type: 'bundle'
  },
  { 
    id: 'suggest-5',
    time: 'Mon, 7:00 AM', 
    discount: 15, 
    isAI: false, 
    reason: 'Early week availability',
    fillLevel: 30,
    co2Saved: 0.1,
    groupingCount: 0,
    confidence: 100,
    type: 'manual'
  },
];

/* ── User Bookings ───────────────────────────────────────────────── */
export const USER_BOOKINGS = [
  { id: 'BK-2401', wasteType: 'general', status: 'completed', date: '2026-04-14', time: '7:00 AM', estate: 'South B', agent: 'James Kamau', amount: 300, bags: 2, rating: 5, phone: '+254 712 345 678', lastUpdated: '2026-04-14T07:15:00Z' },
  { id: 'BK-2402', wasteType: 'recyclable', status: 'in-progress', date: '2026-04-16', time: '6:30 AM', estate: 'South B', agent: 'Mary Wanjiku', amount: 200, bags: 2, rating: null, phone: '+254 712 345 678', lastUpdated: '2026-04-16T06:45:00Z' },
  { id: 'BK-2403', wasteType: 'organic', status: 'scheduled', date: '2026-04-18', time: '6:00 AM', estate: 'South B', agent: null, amount: 120, bags: 1, rating: null, phone: '+254 712 345 678', lastUpdated: '2026-04-18T06:10:00Z' },
  { id: 'BK-2404', wasteType: 'electronic', status: 'completed', date: '2026-04-10', time: '10:00 AM', estate: 'South B', agent: 'Peter Omondi', amount: 600, bags: null, rating: 4, phone: '+254 712 345 678', lastUpdated: '2026-04-10T10:30:00Z' },
  { id: 'BK-2405', wasteType: 'general', status: 'completed', date: '2026-04-07', time: '7:30 AM', estate: 'South B', agent: 'James Kamau', amount: 150, bags: 1, rating: 5, phone: '+254 712 345 678', lastUpdated: '2026-04-07T08:00:00Z' },
];

/* ── Agent Available Jobs ────────────────────────────────────────── */
export const AVAILABLE_JOBS = [
  {
    id: 'JB-301', estate: 'Eastleigh', wasteType: 'general', bags: 3, pay: 450,
    distance: '1.2 km', time: '7:00 AM', customer: 'Amina H.',
    isAI: true, aiReason: 'Best pay • On your route • 22% above average',
    lat: -1.2728, lng: 36.8450,
  },
  {
    id: 'JB-302', estate: 'Pangani', wasteType: 'recyclable', bags: 5, pay: 500,
    distance: '0.8 km', time: '7:30 AM', customer: 'Joseph M.',
    isAI: true, aiReason: 'Closest job • High-tip area • Repeat customer',
    lat: -1.2650, lng: 36.8380,
  },
  {
    id: 'JB-303', estate: 'South B', wasteType: 'general', bags: 2, pay: 300,
    distance: '2.5 km', time: '8:00 AM', customer: 'Grace W.',
    isAI: true, aiReason: 'Bundle opportunity • 2 more pickups nearby',
    lat: -1.3050, lng: 36.8330,
  },
  {
    id: 'JB-304', estate: 'Umoja', wasteType: 'organic', bags: 4, pay: 480,
    distance: '3.1 km', time: '8:30 AM', customer: 'David K.',
    isAI: false, aiReason: null,
    lat: -1.2850, lng: 36.8900,
  },
  {
    id: 'JB-305', estate: 'Buruburu', wasteType: 'bulky', bags: null, pay: 800,
    distance: '4.0 km', time: '9:00 AM', customer: 'Susan N.',
    isAI: false, aiReason: null,
    lat: -1.2900, lng: 36.8750,
  },
  {
    id: 'JB-306', estate: 'Donholm', wasteType: 'electronic', bags: null, pay: 600,
    distance: '3.5 km', time: '10:00 AM', customer: 'Brian O.',
    isAI: false, aiReason: null,
    lat: -1.2950, lng: 36.8850,
  },
];

/* ── Agent Earnings Mock ─────────────────────────────────────────── */
export const AGENT_EARNINGS = {
  today: 1250,
  todayGoal: 3000,
  thisWeek: 8750,
  lastWeek: 7200,
  thisMonth: 32500,
  completedToday: 5,
  totalJobs: 147,
  rating: 4.8,
  weeklyData: [
    { day: 'Mon', earnings: 2100 },
    { day: 'Tue', earnings: 1800 },
    { day: 'Wed', earnings: 2400 },
    { day: 'Thu', earnings: 1250 },
    { day: 'Fri', earnings: 0 },
    { day: 'Sat', earnings: 0 },
    { day: 'Sun', earnings: 0 },
  ],
};

/* ── AI Performance Coach Insights ───────────────────────────────── */
export const AI_COACH_INSIGHTS = [
  {
    id: 1,
    type: 'warning',
    title: 'On-Time Rate Alert',
    message: 'Your on-time rate is 8% below average. Confirm jobs 30 mins earlier to earn KSh 1,200 more this week.',
    action: 'View Tips',
  },
  {
    id: 2,
    type: 'success',
    title: 'Earnings Milestone 🎉',
    message: 'You\'re on track to hit KSh 35,000 this month — your best month yet! Keep it up.',
    action: 'View Progress',
  },
  {
    id: 3,
    type: 'tip',
    title: 'Route Optimization',
    message: 'Eastleigh + Pangani combo saves 40 mins. Accept morning jobs from both estates to maximize earnings.',
    action: 'Show Route',
  },
];

/* ── Admin Dashboard KPIs ────────────────────────────────────────── */
export const ADMIN_KPIS = [
  { label: 'Active Agents', value: 234, change: +12, unit: '' },
  { label: 'Today\'s Pickups', value: 1847, change: +8.5, unit: '' },
  { label: 'Revenue (Today)', value: 425000, change: +15.2, unit: 'KSh' },
  { label: 'Customer Rating', value: 4.7, change: +0.2, unit: '★' },
  { label: 'Active Subs', value: 5840, change: +24.1, unit: '' },
  { label: 'Rewards Paid', value: 154000, change: +18.5, unit: 'KSh' },
  { label: 'Overall Sorting', value: 68, change: +4.2, unit: '%' },
  { label: 'CO2 Offset', value: 12.4, change: +11.0, unit: 't' },
  { label: 'User IoTs', value: 1240, change: +15.5, unit: '' },
  { label: 'Estate IoTs', value: 86, change: +2.4, unit: '' },
];

export const SUBSCRIPTION_DISTRIBUTION = [
  { name: 'Lite', value: 4200, fill: '#94a3b8' },
  { name: 'Standard', value: 1240, fill: '#00A651' },
  { name: 'Premium', value: 400, fill: '#fbbf24' },
];

/* ── Marketplace AI Forecast ─────────────────────────────────────── */
export const MARKETPLACE_FORECAST = [
  { month: 'Jan', actual: 1200, predicted: 1100 },
  { month: 'Feb', actual: 1500, predicted: 1400 },
  { month: 'Mar', actual: 1800, predicted: 1900 },
  { month: 'Apr', actual: 2300, predicted: 2400 },
  { month: 'May', actual: null, predicted: 3100 },
  { month: 'Jun', actual: null, predicted: 3950 },
];

/* ── Admin Agent Locations ───────────────────────────────────────── */
export const AGENT_LOCATIONS = [
  { id: 1, name: 'James K.', lat: -1.2921, lng: 36.8219, status: 'active', jobs: 3 },
  { id: 2, name: 'Mary W.', lat: -1.2750, lng: 36.8450, status: 'active', jobs: 5 },
  { id: 3, name: 'Peter O.', lat: -1.3050, lng: 36.8330, status: 'idle', jobs: 0 },
  { id: 4, name: 'Grace M.', lat: -1.2650, lng: 36.8380, status: 'active', jobs: 2 },
  { id: 5, name: 'David N.', lat: -1.2850, lng: 36.8900, status: 'active', jobs: 4 },
  { id: 6, name: 'Faith A.', lat: -1.3100, lng: 36.8650, status: 'offline', jobs: 0 },
  { id: 7, name: 'Brian K.', lat: -1.2800, lng: 36.8100, status: 'active', jobs: 1 },
  { id: 8, name: 'Susan W.', lat: -1.2600, lng: 36.8250, status: 'active', jobs: 6 },
];

/* ── Admin Charts Data ───────────────────────────────────────────── */
export const MONTHLY_PICKUPS = [
  { month: 'Jan', pickups: 12500, revenue: 2800000 },
  { month: 'Feb', pickups: 14200, revenue: 3200000 },
  { month: 'Mar', pickups: 16800, revenue: 3900000 },
  { month: 'Apr', pickups: 18500, revenue: 4250000 },
];

export const WASTE_DISTRIBUTION = [
  { name: 'General', value: 42, fill: '#64748b' },
  { name: 'Recyclable', value: 28, fill: '#00A651' },
  { name: 'Organic', value: 18, fill: '#f59e0b' },
  { name: 'E-Waste', value: 5, fill: '#0066CC' },
  { name: 'Appliance', value: 4, fill: '#6366f1' },
  { name: 'Bulky', value: 3, fill: '#FF6B00' },
  { name: 'Hazardous', value: 1, fill: '#ef4444' },
];

/* ── NEMA Report Mock ────────────────────────────────────────────── */
export const NEMA_REPORT = {
  period: 'Q1 2026 (Jan – Mar)',
  totalWaste: 42600,
  recycled: 18200,
  composted: 8400,
  landfill: 16000,
  diversionRate: 62.4,
  co2Saved: 24.8,
  complianceScore: 94,
  incidents: 2,
  topEstates: [
    { name: 'Eastleigh', kg: 5200 },
    { name: 'South B', kg: 4800 },
    { name: 'Umoja', kg: 4100 },
    { name: 'Buruburu', kg: 3900 },
    { name: 'Pangani', kg: 3600 },
  ],
  monthlyBreakdown: [
    { month: 'Jan', recycled: 5200, composted: 2600, landfill: 5800 },
    { month: 'Feb', recycled: 6100, composted: 2800, landfill: 5400 },
    { month: 'Mar', recycled: 6900, composted: 3000, landfill: 4800 },
  ],
};

/* ── Recycling Items ─────────────────────────────────────────────── */
export const RECYCLING_ITEMS = [
  { id: 1, type: 'Plastic Bottles', kg: 12.5, points: 62, value: 31, date: '2026-04-12' },
  { id: 2, type: 'Newspapers', kg: 8.0, points: 40, value: 20, date: '2026-04-10' },
  { id: 3, type: 'Glass Bottles', kg: 5.2, points: 26, value: 13, date: '2026-04-08' },
  { id: 4, type: 'Aluminium Cans', kg: 3.1, points: 15, value: 7, date: '2026-04-05' },
  { id: 5, type: 'Cardboard', kg: 15.0, points: 75, value: 37, date: '2026-04-01' },
];

/* ── Dashboard Baselines (For Change Calculations) ───────────────── */
export const DASHBOARD_BASELINE = {
  users: 4850,
  freeTier: 3200,
  standard: 1150,
  premium: 440,
  revenue: 385000,
  pickups: 1650,
  rewardsPaid: 148000,
  sorting: 66,
  co2: 11.2,
  userIoTs: 1180,
  estateIoTs: 82
};
