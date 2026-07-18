/**
 * Generates a standard Klinflow Tracking ID.
 * Format: [PREFIX]-[YYMMDD]-[4_ALPHANUMERIC]
 * 
 * Prefixes:
 * - BKG (Resident Booking)
 * - SWM (Swarm Pickup)
 * - LST (Seller Listing)
 * - RFQ (Individual RFQ)
 * - GRQ (Group RFQ)
 * - OFR (Offer)
 * - ORD (Order)
 * - AST (Warehouse Asset)
 */
export const generateTrackingId = (prefix: 'BKG' | 'SWM' | 'LST' | 'RFQ' | 'GRQ' | 'OFR' | 'ORD' | 'AST'): string => {
  const date = new Date();
  
  // Format: YYMMDD
  const yy = String(date.getFullYear()).slice(2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  // 4 random alphanumeric characters (excluding confusing ones like O, 0, I, l)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789';
  let randomStr = '';
  for (let i = 0; i < 4; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}-${dateStr}-${randomStr}`;
};
