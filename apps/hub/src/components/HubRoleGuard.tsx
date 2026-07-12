import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/stores/authStore';
import { HubRole, HubPermission } from '@klinflow/types';

interface HubRoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: HubRole[]; // Empty array means all roles allowed
  requiredPermission?: HubPermission; // Undefined/null means no permission required
  fallback?: React.ComponentType<any>; // Component to show when access is denied
}

/**
 * Role-based access control component for hub features
 * - Company owner (membershipRole: 'owner') bypasses all checks
 * - Other roles must have at least one of the allowedRoles
 * - If requiredPermission is specified, user must have that permission
 */
export function HubRoleGuard({ 
  children, 
  allowedRoles = [],      // HubRole[]
  requiredPermission,     // HubPermission
  fallback 
}: HubRoleGuardProps) {
  const { membershipRole, hubRoles, hubPermissions, hasHubPermission } = useAuthStore();
  
  // Company owner bypasses role checks (has full access via membershipRole)
  if (membershipRole === 'owner') return <>{children}</>;
  
  // Check role requirements
  const hasRole = allowedRoles.length === 0 || allowedRoles.some(r => hubRoles.includes(r));
  
  // Check permission requirements
  const hasPerm = !requiredPermission || hasHubPermission(requiredPermission);
  
  if (!hasRole || !hasPerm) {
    return fallback ? <fallback /> : <div>Access Denied</div>;
  }
  
  return <>{children}</>;
}