CREATE OR REPLACE FUNCTION "public"."get_seller_wallet_stats"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_lifetime_earnings NUMERIC;
    v_pending_bookings NUMERIC;
    v_pending_rfq NUMERIC;
    v_pending_settlement NUMERIC;
    v_earnings_this_month NUMERIC;
    v_recent_trades JSON;
    v_top_materials JSON;
    
    v_total_deals INTEGER;
    v_total_sold_kg NUMERIC;
BEGIN
    SELECT COALESCE(lifetime_cash_earned, 0)
    INTO v_lifetime_earnings
    FROM public.user_wallets
    WHERE user_id = p_user_id;

    IF v_lifetime_earnings IS NULL THEN
        v_lifetime_earnings := 0;
    END IF;

    SELECT COALESCE(SUM(total_price), 0)
    INTO v_pending_bookings
    FROM public.bookings
    WHERE user_id = p_user_id
      AND status IN ('pending', 'confirmed', 'scheduled', 'in-progress');

    SELECT COALESCE(SUM(offered_price * offered_weight), 0)
    INTO v_pending_rfq
    FROM public.rfq_offers ro
    WHERE ro.seller_id = p_user_id
      AND ro.status = 'accepted'
      AND NOT EXISTS (
        SELECT 1 FROM public.fulfillment_orders fo
        WHERE fo.proposal_id = ro.id
          AND fo.status IN ('completed', 'pickup_completed', 'delivered')
      );

    v_pending_settlement := v_pending_bookings + v_pending_rfq;

    -- Fix: Get accurate monthly earnings directly from wallet transactions
    SELECT COALESCE(SUM(amount), 0)
    INTO v_earnings_this_month
    FROM public.wallet_transactions
    WHERE profile_id = p_user_id
      AND transaction_type = 'payout'
      AND date_trunc('month', created_at) = date_trunc('month', now());

    -- Fix: Get actual net payouts from wallet_transactions
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    INTO v_recent_trades
    FROM (
        SELECT wt.id, 
               COALESCE(mo.material, b.waste_type, 'Material') as material, 
               COALESCE(p.name, p2.name, 'Agent') as buyer, 
               wt.amount as amount, 
               'Paid' as status
        FROM public.wallet_transactions wt
        LEFT JOIN public.marketplace_orders mo ON wt.reference_id = mo.id
        LEFT JOIN public.profiles p ON mo.buyer_id = p.id
        LEFT JOIN public.bookings b ON wt.reference_id = b.id
        LEFT JOIN public.profiles p2 ON b.agent_id = p2.id
        WHERE wt.profile_id = p_user_id AND wt.transaction_type = 'payout'
        ORDER BY wt.created_at DESC LIMIT 4
    ) t;

    -- Fix: Top materials calculated using net amounts (approx 95%)
    SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
    INTO v_top_materials
    FROM (
        SELECT material, COALESCE(SUM(total_price * 0.95), 0) as amount_sold
        FROM public.marketplace_orders
        WHERE seller_id = p_user_id AND status = 'completed'
        GROUP BY material ORDER BY amount_sold DESC LIMIT 4
    ) m;

    -- New: Calculate Total Deals and Total Sold KG including both orders and bookings
    SELECT COUNT(*), COALESCE(SUM(quantity), 0)
    INTO v_total_deals, v_total_sold_kg
    FROM (
        SELECT id, COALESCE(quantity, 0) as quantity 
        FROM public.marketplace_orders 
        WHERE seller_id = p_user_id AND status = 'completed'
        UNION ALL
        SELECT id, COALESCE(weight_kg, actual_weight_kg, 0) as quantity 
        FROM public.bookings 
        WHERE user_id = p_user_id AND status = 'completed' AND booking_type IN ('marketplace', 'marketplace_pickup', 'dropoff')
    ) as combined_trades;

    RETURN json_build_object(
        'lifetime_earnings', v_lifetime_earnings,
        'pending_settlement', v_pending_settlement,
        'earnings_this_month', v_earnings_this_month,
        'recent_trades', v_recent_trades,
        'top_materials', v_top_materials,
        'total_deals', v_total_deals,
        'total_sold_kg', v_total_sold_kg
    );
END;
$$;
