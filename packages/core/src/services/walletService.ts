import { supabase } from '@klinflow/supabase';

// System Wallet Limits Config
export const WALLET_CONFIG = {
  // Transfer limits
  MIN_TRANSFER_POINTS: 200,
  MAX_TRANSFER_POINTS: 50000,
  MAX_DAILY_TRANSFER_POINTS: 100000,
  MAX_DAILY_TRANSFER_COUNT: 20,
  // Redemption limits
  MIN_REDEMPTION_POINTS: 200,
  MAX_REDEMPTION_PER_TX: 10000,
  MAX_DAILY_REDEMPTION: 50000,
  // Conversion rate
  GFP_TO_KES_RATE: 0.5, // 2 GFP = 1 KES
};

export interface WalletRecipientSearchResult {
  user_id: string;
  full_name: string;
  phone: string;
  klinflow_id: string;
  avatar: string;
  account_type: string;
}

export interface WalletDetails {
  id: string;
  user_id: string;
  available_points: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  cash_balance: number;
  lifetime_cash_earned: number;
  lifetime_cash_withdrawn: number;
}

export type RedemptionType = 'money' | 'airtime' | 'voucher';
export type RedemptionStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';

export interface RedemptionRequest {
  type: RedemptionType;
  amount: number;
  payout_method: string;
  phone?: string;
}

export interface RedemptionResult {
  success: boolean;
  reference_number?: string;
  redemption_id?: string;
  status?: string;
  amount?: number;
  kes_equivalent?: number;
  balance_after?: number;
  error?: string;
}

export interface RedemptionRecord {
  id: string;
  reference_number: string;
  user_id: string;
  type: RedemptionType;
  amount: number;
  fee: number;
  net_amount: number;
  kes_equivalent: number;
  status: RedemptionStatus;
  payout_method: string;
  payout_details: Record<string, any>;
  provider_reference?: string;
  failure_reason?: string;
  created_at: string;
  completed_at?: string;
}

export interface PointTransferRecord {
  id: string;
  reference_number: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  notes?: string;
  created_at: string;
  completed_at?: string;

  // Joined fields
  receiver_name?: string;
  sender_name?: string;
}

export interface TransferResult {
  success: boolean;
  reference_number?: string;
  amount?: number;
  sender_balance_after?: number;
  error?: string;
}

export interface SellerWalletStats {
  lifetime_earnings: number;
  pending_settlement: number;
  earnings_this_month: number;
  recent_trades: Array<{
    id: string;
    material: string;
    buyer: string;
    amount: number;
    status: string;
  }>;
  top_materials: Array<{
    material: string;
    amount_sold: number;
  }>;
}

export const walletService = {

  /**
   * Fetch Seller Dashboard statistics
   */
  async getSellerDashboard(userId: string): Promise<SellerWalletStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_seller_wallet_stats', {
        p_user_id: userId
      });

      if (error) throw error;
      return data as SellerWalletStats;
    } catch (error) {
      console.error('[walletService] Error fetching seller dashboard:', error);
      return null;
    }
  },



  /**
   * Search for a valid verified recipient by Klinflow ID or Phone
   */
  async searchRecipient(query: string): Promise<WalletRecipientSearchResult | null> {
    if (!query || query.length < 3) return null;

    try {
      const { data, error } = await supabase.rpc('search_wallet_recipient', {
        p_search_query: query.trim()
      });

      if (error) throw error;

      // Expected to return an array of 0 or 1 item
      if (data && data.length > 0) {
        return data[0] as WalletRecipientSearchResult;
      }
      return null;
    } catch (error) {
      console.error('[walletService] Error searching recipient:', error);
      throw error;
    }
  },

  /**
   * Execute a secure, atomic point transfer
   */
  async transferPoints(recipientId: string, amount: number, notes?: string): Promise<TransferResult> {
    try {
      const { data, error } = await supabase.rpc('process_point_transfer', {
        p_recipient_id: recipientId,
        p_amount: amount,
        p_notes: notes || null
      });

      if (error) {
        throw new Error(error.message || 'Transfer failed');
      }

      return data as TransferResult;
    } catch (error: any) {
      console.error('[walletService] Transfer Error:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  },

  /**
   * Fetch paginated transfer history (both sent and received)
   */
  async getTransferHistory(userId: string, filter: 'all' | 'sent' | 'received' = 'all', limit: number = 20): Promise<PointTransferRecord[]> {
    try {
      let query = supabase
        .from('point_transfers')
        .select(`
          *,
          sender:profiles!sender_id (name, avatar_url, phone, klinflow_id),
          receiver:profiles!receiver_id (name, avatar_url, phone, klinflow_id)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter === 'sent') {
        query = query.eq('sender_id', userId);
      } else if (filter === 'received') {
        query = query.eq('receiver_id', userId);
      } else {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map joined data to flat properties for UI
      return data.map((record: any) => ({
        ...record,
        sender_name: record.sender?.name,
        sender_klinflow_id: record.sender?.klinflow_id,
        receiver_name: record.receiver?.name,
        receiver_klinflow_id: record.receiver?.klinflow_id,
        receiver_avatar: record.receiver?.avatar_url,
        sender_avatar: record.sender?.avatar_url
      })) as PointTransferRecord[];

    } catch (error) {
      console.error('[walletService] Error fetching history:', error);
      return [];
    }
  },

  /**
   * Get the current user's wallet details directly
   */
  async getWalletDetails(userId: string): Promise<WalletDetails | null> {
    const { data, error } = await supabase
      .rpc('get_resident_wallet_stats', { p_user_id: userId });

    if (error) {
      console.error('[walletService] Error fetching wallet stats:', error);
      return null;
    }

    return data as any;
  },

  // ═══════════════════════════════════════════════════════════════
  // REDEMPTION METHODS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Execute a secure, atomic point redemption
   */
  async redeemPoints(request: RedemptionRequest): Promise<RedemptionResult> {
    try {
      const { data, error } = await supabase.rpc('process_point_redemption', {
        p_type: request.type,
        p_amount: request.amount,
        p_payout_method: request.payout_method,
        p_payout_details: request.phone
          ? JSON.stringify({ phone: request.phone })
          : '{}'
      });

      if (error) {
        throw new Error(error.message || 'Redemption failed');
      }

      return data as RedemptionResult;
    } catch (error: any) {
      console.error('[walletService] Redemption Error:', error);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  },

  /**
   * Fetch paginated redemption history
   */
  async getRedemptionHistory(
    userId: string,
    filter: 'all' | RedemptionType = 'all',
    statusFilter: 'all' | RedemptionStatus = 'all',
    limit: number = 30
  ): Promise<RedemptionRecord[]> {
    try {
      let query = supabase
        .from('point_redemptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as RedemptionRecord[];
    } catch (error) {
      console.error('[walletService] Error fetching redemption history:', error);
      return [];
    }
  },

  /**
   * Fetch paginated wallet transactions
   */
  async getWalletTransactions(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          metadata,
          created_at,
          reference_id
        `)
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('[walletService] Error fetching wallet transactions:', error);
      return [];
    }
  }
};
