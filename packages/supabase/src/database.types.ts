export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string | null
          phone: string | null
          role: string | null
          wallet_balance: number
          reward_points: number
          balance: number | null
          location: Json | null
          estate: string | null
          is_online: boolean
          is_staff: boolean
          fleet_id: string | null
          company_id: string | null
          agent_account_type: string | null
          business_type: string | null
          specializations: string[] | null
          nema_license: string | null
          company_name: string | null
          gender: string | null
          notes: string | null
          notification_prefs: Json | null
          completed_cleared_at: string | null
          cancelled_cleared_at: string | null
          is_verified: boolean
          id_number: string | null
          avatar_url: string | null
          rating: number | null
          subscription_tier: string | null
          fleet_invite_code: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          wallet_balance?: number
          reward_points?: number
          balance?: number | null
          location?: Json | null
          estate?: string | null
          is_online?: boolean
          is_staff?: boolean
          fleet_id?: string | null
          company_id?: string | null
          agent_account_type?: string | null
          business_type?: string | null
          specializations?: string[] | null
          nema_license?: string | null
          company_name?: string | null
          gender?: string | null
          notes?: string | null
          notification_prefs?: Json | null
          completed_cleared_at?: string | null
          cancelled_cleared_at?: string | null
          is_verified?: boolean
          id_number?: string | null
          avatar_url?: string | null
          rating?: number | null
          subscription_tier?: string | null
          fleet_invite_code?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          wallet_balance?: number
          reward_points?: number
          balance?: number | null
          location?: Json | null
          estate?: string | null
          is_online?: boolean
          is_staff?: boolean
          fleet_id?: string | null
          company_id?: string | null
          agent_account_type?: string | null
          business_type?: string | null
          specializations?: string[] | null
          nema_license?: string | null
          company_name?: string | null
          gender?: string | null
          notes?: string | null
          notification_prefs?: Json | null
          completed_cleared_at?: string | null
          cancelled_cleared_at?: string | null
          is_verified?: boolean
          id_number?: string | null
          avatar_url?: string | null
          rating?: number | null
          subscription_tier?: string | null
          fleet_invite_code?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          agent_id: string | null
          status: string
          waste_type: string | null
          bags: number
          actual_weight_kg: number
          estate: string | null
          time_slot: string | null
          fee: number
          total_price: number
          photo_url: string | null
          is_market_trade: boolean
          booking_type: string | null
          notes: string | null
          latitude: number | null
          longitude: number | null
          h3_index: string | null
          hidden_for_agent: boolean
          hidden_for_client: boolean
          preferred_date: string | null
          agent_rating: number | null
          agent_feedback: string | null
          counter_offer_amount: number | null
          counter_offer_status: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          agent_id?: string | null
          status?: string
          waste_type?: string | null
          bags?: number
          actual_weight_kg?: number
          estate?: string | null
          time_slot?: string | null
          fee?: number
          total_price?: number
          photo_url?: string | null
          is_market_trade?: boolean
          booking_type?: string | null
          notes?: string | null
          latitude?: number | null
          longitude?: number | null
          h3_index?: string | null
          hidden_for_agent?: boolean
          hidden_for_client?: boolean
          preferred_date?: string | null
          agent_rating?: number | null
          agent_feedback?: string | null
          counter_offer_amount?: number | null
          counter_offer_status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          agent_id?: string | null
          status?: string
          waste_type?: string | null
          bags?: number
          actual_weight_kg?: number
          estate?: string | null
          time_slot?: string | null
          fee?: number
          total_price?: number
          photo_url?: string | null
          is_market_trade?: boolean
          booking_type?: string | null
          notes?: string | null
          latitude?: number | null
          longitude?: number | null
          h3_index?: string | null
          hidden_for_agent?: boolean
          hidden_for_client?: boolean
          preferred_date?: string | null
          agent_rating?: number | null
          agent_feedback?: string | null
          counter_offer_amount?: number | null
          counter_offer_status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      notifications: {
        Row: {
          id: string
          title: string
          body: string
          type: string
          target_role: string
          target_user: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body: string
          type?: string
          target_role?: string
          target_user?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string
          type?: string
          target_role?: string
          target_user?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: any[]
      }
      marketplace_listings: {
        Row: {
          id: string
          seller_id: string
          material: string
          quantity: number
          price_per_kg: number
          description: string | null
          location: string | null
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          photo_urls: string[] | null
          views: number
          offers: number
          ai_match_score: number | null
          grade: string | null
          unit: string
          moq: number
          status: string
          expires_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          seller_id: string
          material: string
          quantity: number
          price_per_kg: number
          description?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          photo_urls?: string[] | null
          views?: number
          offers?: number
          ai_match_score?: number | null
          grade?: string | null
          unit?: string
          moq?: number
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          seller_id?: string
          material?: string
          quantity?: number
          price_per_kg?: number
          description?: string | null
          location?: string | null
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          photo_urls?: string[] | null
          views?: number
          offers?: number
          ai_match_score?: number | null
          grade?: string | null
          unit?: string
          moq?: number
          status?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      marketplace_offers: {
        Row: {
          id: string
          listing_id: string
          buyer_id: string
          seller_id: string | null
          offered_price: number
          quantity: number
          status: string
          booking_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          listing_id: string
          buyer_id: string
          seller_id?: string | null
          offered_price: number
          quantity: number
          status?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string
          buyer_id?: string
          seller_id?: string | null
          offered_price?: number
          quantity?: number
          status?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      marketplace_orders: {
        Row: {
          id: string
          listing_id: string | null
          buyer_id: string
          seller_id: string | null
          asset_id: string | null
          material: string
          quantity: number
          unit_price: number
          total_price: number
          status: string
          message: string | null
          order_type: string
          booking_id: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          listing_id?: string | null
          buyer_id: string
          seller_id?: string | null
          asset_id?: string | null
          material: string
          quantity: number
          unit_price: number
          total_price: number
          status?: string
          message?: string | null
          order_type?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          listing_id?: string | null
          buyer_id?: string
          seller_id?: string | null
          asset_id?: string | null
          material?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          status?: string
          message?: string | null
          order_type?: string
          booking_id?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      assets: {
        Row: {
          id: string
          booking_id: string | null
          verifier_id: string | null
          weaver_id: string | null
          owner_id: string | null
          material_type: string
          grade: string | null
          weight_kg: number
          estimated_value: number | null
          purity_score: number
          photo_url: string | null
          status: string
          source: string
          is_manual: boolean
          digital_batch_id: string | null
          metadata: Json | null
          matched_at: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id?: string | null
          verifier_id?: string | null
          weaver_id?: string | null
          owner_id?: string | null
          material_type: string
          grade?: string | null
          weight_kg: number
          estimated_value?: number | null
          purity_score?: number
          photo_url?: string | null
          status?: string
          source?: string
          is_manual?: boolean
          digital_batch_id?: string | null
          metadata?: Json | null
          matched_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string | null
          verifier_id?: string | null
          weaver_id?: string | null
          owner_id?: string | null
          material_type?: string
          grade?: string | null
          weight_kg?: number
          estimated_value?: number | null
          purity_score?: number
          photo_url?: string | null
          status?: string
          source?: string
          is_manual?: boolean
          digital_batch_id?: string | null
          metadata?: Json | null
          matched_at?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      agent_configurations: {
        Row: {
          id: string
          agent_id: string
          base_logistics_fee: number
          cashback_percentage: number
          accepted_materials: Json
          custom_rates: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          base_logistics_fee?: number
          cashback_percentage?: number
          accepted_materials?: Json
          custom_rates?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          base_logistics_fee?: number
          cashback_percentage?: number
          accepted_materials?: Json
          custom_rates?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      rewards_ledger: {
        Row: {
          id: string
          profile_id: string
          booking_id: string | null
          amount_cashback: number
          amount_points: number
          transaction_type: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          booking_id?: string | null
          amount_cashback: number
          amount_points?: number
          transaction_type: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          booking_id?: string | null
          amount_cashback?: number
          amount_points?: number
          transaction_type?: string
          description?: string | null
          created_at?: string
        }
        Relationships: any[]
      }
      waste_categories: {
        Row: {
          id: string
          label: string
          slug: string
          icon: string | null
          description: string | null
          price_per_kg: number
          is_active: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          label: string
          slug: string
          icon?: string | null
          description?: string | null
          price_per_kg: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          label?: string
          slug?: string
          icon?: string | null
          description?: string | null
          price_per_kg?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: any[]
      }
      app_reviews: {
        Row: {
          id: string
          user_id: string | null
          name: string
          phone: string | null
          rating: number
          category: string | null
          feedback: string | null
          source_app: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          phone?: string | null
          rating: number
          category?: string | null
          feedback?: string | null
          source_app: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          phone?: string | null
          rating?: number
          category?: string | null
          feedback?: string | null
          source_app?: string
          created_at?: string
        }
        Relationships: any[]
      }
      hygenex_messages: {
        Row: {
          id: string
          user_id: string
          role: string
          text: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          text: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          text?: string
          created_at?: string
        }
        Relationships: any[]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          device_type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          device_type?: string
          created_at?: string
        }
        Relationships: any[]
      }
      system_settings: {
        Row: {
          id: string
          value: string
          updated_at: string
        }
        Insert: {
          id: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          value?: string
          updated_at?: string
        }
        Relationships: any[]
      }
      system_config: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: any[]
      }

    }
    Views: Record<string, never>
    Functions: {
      get_available_bookings: {
        Args: {
          agent_uuid: string
        }
        Returns: Database['public']['Tables']['bookings']['Row'][]
      }
      get_active_agent_jobs: {
        Args: {
          agent_uuid: string
        }
        Returns: Database['public']['Tables']['bookings']['Row'][]
      }
      accept_booking: {
        Args: {
          target_booking_id: string
          assigned_agent_id: string
        }
        Returns: void
      }
      agent_completes_pickup: {
        Args: {
          p_booking_uuid: string
          p_agent_uuid: string
          p_weight_kg: number
          p_total_fee: number
        }
        Returns: void
      }
      submit_counter_offer: {
        Args: {
          p_booking_id: string
          p_new_amount: number
        }
        Returns: string
      }
      deposit_to_wallet: {
        Args: {
          p_amount: number
        }
        Returns: void
      }
      get_company_stats_v2: {
        Args: {
          p_company_id: string
        }
        Returns: {
          total: number
          todayPayout: number
          inventoryValue: number
          totalJobs: number
          completedToday: number
          totalKgRecovered: number
          todayKg: number
          thisWeekKg: number
          weeklyData: { day: string; weight: number }[]
        }
      }
      process_wallet_topup: {
        Args: {
          p_amount: number
        }
        Returns: boolean
      }
      process_wallet_withdrawal: {
        Args: {
          p_amount: number
          p_method?: string
          p_account?: string
          p_reference_id?: string
        }
        Returns: boolean
      }
      get_b2b_market_stats: {
        Args: Record<string, never>
        Returns: any[]
      }
      complete_booking_trade_payout: {
        Args: {
          p_booking_id: string
          p_actual_weight: number
          p_payout_amount: number
        }
        Returns: void
      }
      complete_booking_split_payout: {
        Args: {
          p_booking_uuid: string
          p_agent_uuid: string
          p_client_uuid: string
          p_weight_kg: number
          p_estimated_value: number
          p_client_gfp: number
          p_is_manual: boolean
        }
        Returns: boolean
      }
      weaver_claim_asset: {
        Args: {
          p_asset_id: string
          p_weaver_id: string
        }
        Returns: boolean
      }
      client_releases_funds: {
        Args: {
          p_booking_uuid: string
          p_client_uuid: string
          p_client_gfp: number
        }
        Returns: boolean
      }

    }
    Enums: Record<string, never>
  }
}
