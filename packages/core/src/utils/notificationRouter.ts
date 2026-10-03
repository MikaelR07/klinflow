import { AppNotification } from '../validation';

type AppNavigateFunction = (url: string) => void;

/**
 * notificationRouter.ts
 * 
 * V3 Router for notifications. Separates the decision of "where to go"
 * from the actual navigation mechanics of the SPA.
 * 
 * This uses the newly available `notificationRule` to make robust routing
 * decisions without relying purely on string matching the `actionUrl`.
 */
export const routeNotification = (
  notification: AppNotification,
  navigate: AppNavigateFunction
) => {
  // If the notification explicitly provided an action URL and no rule was matched, 
  // we can use it as a fallback, but we should prefer rule-based routing for reliability.
  const fallbackUrl = notification.actionUrl || '/';
  
  // Use notificationRule to determine the exact destination
  switch (notification.notificationRule) {
    
    // --- Pickups ---
    case 'alert.pickup.new_request':
      // Agent getting a new request -> go to jobs/dispatch
      return navigate('/jobs');
      
    case 'alert.pickup.accepted':
    case 'alert.pickup.arriving':
    case 'alert.pickup.arrived':
    case 'alert.pickup.verified':
    case 'alert.pickup.completed':
    case 'alert.pickup.cancelled':
      // Resident or Agent tracking a pickup
      if (notification.targetApp === 'client') {
        const id = extractIdFromUrl(notification.actionUrl);
        return navigate(id ? `/pickups/${id}` : '/activity');
      } else if (notification.targetApp === 'agent') {
        return navigate('/jobs');
      }
      break;

    // --- Marketplace ---
    case 'alert.trade.direct_pickup':
    case 'alert.trade.direct_dropoff':
      return navigate('/sourcing');

    case 'alert.trade.offer_received':
    case 'alert.trade.offer_accepted':
      return navigate('/trades');
      
    case 'alert.marketplace.order_received':
      return navigate('/business/orders');
      
    case 'alert.marketplace.escrow_released':
      return navigate('/wallet');
      
    case 'alert.rfq.offer_received':
      return navigate('/rfqs');

    // --- Wallet & Earnings ---
    case 'alert.wallet.payment_received':
    case 'alert.wallet.topup':
    case 'alert.wallet.withdrawal':
    case 'alert.wallet.transfer_sent':
    case 'alert.wallet.transfer_received':
    case 'alert.wallet.fund_request':
    case 'alert.wallet.fund_approved':
    case 'alert.wallet.fund_declined':
      // All wallet operations go to the wallet tab in the respective app
      return navigate('/wallet');

    // --- Rewards ---
    case 'alert.reward.redeemed':
    case 'alert.reward.refund':
      return navigate('/wallet/rewards');

    // --- Fleet / Account / Security ---
    case 'alert.fleet.invite_requested':
      return navigate('/fleet/requests');
      
    case 'alert.fleet.invite_approved':
      return navigate('/'); // Agent home
      
    case 'alert.account.verified':
      return navigate('/profile');
      
    case 'alert.security.verification_requested':
      return navigate('/admin/verifications');

    default:
      // Legacy / Unmapped rules fallback to the actionUrl provided by the backend
      break;
  }
  
  // Fallback
  navigate(fallbackUrl);
};

// Helper to extract UUIDs from legacy action URLs (e.g., /pickups/123e4567-e89b-12d3-a456-426614174000)
function extractIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  return match ? match[0] : null;
}
