import { HubRole, MembershipRole } from '@klinflow/types';

// Define the navigation structure
export const HUB_NAV_CONFIG = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard/executive',
    icon: 'Dashboard',
    roles: [] as HubRole[], // Visible to all roles
  },
  {
    id: 'operations',
    title: 'Operations',
    path: '/operations',
    icon: 'Factory',
    roles: ['operations_manager'],
  },
  {
    id: 'fleet',
    title: 'Fleet',
    path: '/fleet',
    icon: 'Truck',
    roles: ['fleet_manager'],
  },
  {
    id: 'supply-commercial',
    title: 'Supply & Commercial',
    path: '/supply',
    icon: 'TruckLoading',
    roles: ['sales_manager'],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    path: '/pricing',
    icon: 'DollarSign',
    roles: ['sales_manager', 'finance_manager'],
  },
  {
    id: 'finance',
    title: 'Finance',
    path: '/finance',
    icon: 'Banknote',
    roles: ['finance_manager'],
  },
  {
    id: 'admin',
    title: 'Admin',
    path: '/admin',
    icon: 'Settings',
    roles: [], // Only company owner sees this (handled separately)
  },
  {
    id: 'analytics',
    title: 'Analytics',
    path: '/analytics',
    icon: 'BarChart3',
    roles: ['executive_viewer'],
  },
];

/**
 * Check if user is company owner
 */
export const isCompanyOwner = (membershipRole: MembershipRole) => membershipRole === 'owner';

/**
 * Filter navigation items based on user roles and company ownership
 */
export const filterNavItems = (navConfig: typeof HUB_NAV_CONFIG, membershipRole: MembershipRole, hubRoles: HubRole[]) => {
  return navConfig.filter(section => 
    // Company owner sees everything
    isCompanyOwner(membershipRole) ||
    // Check if user has at least one of the required roles for this section
    section.roles.some(role => hubRoles.includes(role))
  );
};