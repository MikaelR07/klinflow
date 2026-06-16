-- Migration: 20260615_seller_wallet_stats_v2.sql
-- Description: Updates get_seller_wallet_stats to calculate pending_settlement
-- from active bookings (trades) and accepted RFQ offers (excluding completed fulfillments).

CREATE OR REPLACE FUNCTION public.get_seller_wallet_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_lifetime_earnings NUMERIC;
    v_pending_bookings NUMERIC;
    v_pending_rfq NUMERIC;
    v_pending_settlement NUMERIC;
    v_earnings_this_month NUMERIC;
    v_recent_trades JSON;
    v_top_materials JSON;
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

    SELECT COALESCE(SUM(total_price), 0)
    INTO v_earnings_this_month
    FROM public.marketplace_orders
    WHERE seller_id = p_user_id
      AND status = 'completed'
      AND date_trunc('month', updated_at) = date_trunc('month', now());

    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    INTO v_recent_trades
    FROM (
        SELECT mo.id, mo.material, p.name as buyer, mo.total_price as amount, 'Paid' as status
        FROM public.marketplace_orders mo
        LEFT JOIN public.profiles p ON mo.buyer_id = p.id
        WHERE mo.seller_id = p_user_id AND mo.status = 'completed'
        ORDER BY mo.created_at DESC LIMIT 4
    ) t;

    SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
    INTO v_top_materials
    FROM (
        SELECT material, COALESCE(SUM(total_price), 0) as amount_sold
        FROM public.marketplace_orders
        WHERE seller_id = p_user_id AND status = 'completed'
        GROUP BY material ORDER BY amount_sold DESC LIMIT 4
    ) m;

    RETURN json_build_object(
        'lifetime_earnings', v_lifetime_earnings,
        'pending_settlement', v_pending_settlement,
        'earnings_this_month', v_earnings_this_month,
        'recent_trades', v_recent_trades,
        'top_materials', v_top_materials
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
