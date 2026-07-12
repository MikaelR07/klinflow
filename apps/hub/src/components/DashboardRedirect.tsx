import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@klinflow/core/stores/authStore';
import { HubRole } from '@klinflow/types';
import { LoadingScreen } from '@klinflow/ui';

interface DashboardRedirectProps {
  /** Optional component to show while initializing */
  fallback?: React.ComponentType<any>;
}

/**
 * Redirects users to their appropriate dashboard based on role
 * - Company owner → Executive Dashboard
 * - Single hub role → Their specific dashboard
 * - Multiple hub roles (no owner) → Dashboard switcher
 */
export function DashboardRedirect({ fallback }: DashboardRedirectProps = {}) {
  const { membershipRole, hubRoles, isInitializing } = useAuthStore();
  const navigate = useNavigate();

  if (isInitializing) {
    const Fallback = fallback;
    return Fallback ? <Fallback /> : <LoadingScreen />;
  }

  // Company owner → Executive Dashboard
  if (membershipRole === 'owner') {
    return <Navigate to="/dashboard/executive" replace />;
  }

  // Single hub role → their dashboard
  if (hubRoles.length === 1) {
    const path = ROLE_DASHBOARD_PATHS[hubRoles[0]];
    return <Navigate to={path} replace />;
  }

  // Multiple hub roles (no membershipRole owner) → show switcher
  return <DashboardSwitcher roles={hubRoles} />;
}

// Mapping from hub roles to dashboard paths
const ROLE_DASHBOARD_PATHS: Record<HubRole, string> = {
  operations_manager: '/dashboard/operations',
  fleet_manager: '/dashboard/fleet',
  sales_manager: '/dashboard/sales',
  finance_manager: '/dashboard/finance',
  executive_viewer: '/dashboard/executive',
};

/**
 * Component to show when user has multiple hub roles and needs to choose a dashboard
 */
function DashboardSwitcher({ roles }: { roles: HubRole[] }) {
  const { membershipRole } = useAuthStore();
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6 text-amber-800 text-sm">
         <p className="font-bold">Debug Info:</p>
         <p>Membership Role: {membershipRole}</p>
         <p>Hub Roles: {roles.join(', ')}</p>
      </div>
      <h2 className="text-xl font-bold mb-4">Select Your Dashboard</h2>
      <div className="space-y-4">
        {roles.map(role => {
          const path = ROLE_DASHBOARD_PATHS[role];
          const title = getRoleTitle(role);
          const icon = getRoleIcon(role);
          
          return (
            <div 
              key={role} 
              onClick={() => navigate(path, { replace: true })}
              className="cursor-pointer p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded bg-primary/10 text-primary">
                  {icon}
                </div>
                <div>
                  <h3 className="font-medium">{title}</h3>
                  <p className="text-sm text-muted-foreground">{getRoleDescription(role)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper functions for dashboard switcher
function getRoleTitle(role: HubRole): string {
  const titles: Record<HubRole, string> = {
    operations_manager: 'Operations Dashboard',
    fleet_manager: 'Fleet Dashboard',
    sales_manager: 'Sales Dashboard',
    finance_manager: 'Finance Dashboard',
    executive_viewer: 'Executive Dashboard',
  };
  return titles[role] || role;
}

function getRoleIcon(role: HubRole): JSX.Element {
  // Using simple text icons for now - in practice you'd use actual icons
  const icons: Record<HubRole, string> = {
    operations_model: '⚙️',
    fleet_manager: '🚚',
    sales_manager: '💼',
    finance_manager: '💰',
    executive_viewer: '👁️',
  };
  // Return a simple span for now - replace with actual icon component
  return <span>{icons[role] || '📊'}</span>;
}

function getRoleDescription(role: HubRole): string {
  const descriptions: Record<HubRole, string> = {
    operations_manager: 'Manage intake, queue, dispatch, inventory, and disputes',
    fleet_manager: 'Oversee agents, vehicles, routing, fuel, and maintenance',
    sales_manager: 'Handle procurement (suppliers, risk) and commercial (RFQs, marketplace, pricing)',
    finance_manager: 'Manage disbursements, payouts, treasury, and reports',
    executive_viewer: 'View company health, KPIs, approvals, alerts, and shortcuts',
  };
  return descriptions[role] || 'Access your dashboard';
}