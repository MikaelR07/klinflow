-- Migration to create the seller wallet dashboard stats RPC
-- Combines marketplace orders and wallet ledger data

CREATE OR REPLACE FUNCTION public.get_seller_wallet_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    v_earnings_this_month NUMERIC;
    v_recent_trades JSON;
    v_top_materials JSON;
    v_recent_transactions JSON;
BEGIN
    -- 1. Earnings this month (from marketplace_orders)
    SELECT COALESCE(SUM(total_price), 0)
    INTO v_earnings_this_month
    FROM public.marketplace_orders
    WHERE seller_id = p_user_id
      AND status = 'completed'
      AND date_trunc('month', created_at) = date_trunc('month', now());

    -- 2. Recent trades (last 4 completed orders)
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    INTO v_recent_trades
    FROM (
        SELECT 
            mo.id, 
            mo.material, 
            p.name as buyer, 
            mo.total_price as amount, 
            'Paid' as status
        FROM public.marketplace_orders mo
        LEFT JOIN public.profiles p ON mo.buyer_id = p.id
        WHERE mo.seller_id = p_user_id
          AND mo.status = 'completed'
        ORDER BY mo.created_at DESC
        LIMIT 4
    ) t;

    -- 3. Top materials (top 4 by revenue)
    SELECT COALESCE(json_agg(row_to_json(m)), '[]'::json)
    INTO v_top_materials
    FROM (
        SELECT 
            material, 
            COALESCE(SUM(total_price), 0) as amount_sold
        FROM public.marketplace_orders
        WHERE seller_id = p_user_id
          AND status = 'completed'
        GROUP BY material
        ORDER BY amount_sold DESC
        LIMIT 4
    ) m;

    -- 4. Recent transactions (from wallet_ledger)
    SELECT COALESCE(json_agg(row_to_json(tx)), '[]'::json)
    INTO v_recent_transactions
    FROM (
        SELECT 
            id, 
            transaction_type as method, 
            created_at as date, 
            amount, 
            'Completed' as status
        FROM public.wallet_ledger
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 4
    ) tx;

    RETURN json_build_object(
        'earnings_this_month', v_earnings_this_month,
        'recent_trades', v_recent_trades,
        'top_materials', v_top_materials,
        'recent_transactions', v_recent_transactions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
