CREATE OR REPLACE FUNCTION "public"."process_point_redemption"("p_type" "text", "p_amount" integer, "p_payout_method" "text", "p_payout_details" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_current_balance INTEGER;
    v_fee INTEGER := 0;
    v_net_amount INTEGER;
    v_kes_equivalent DECIMAL(12,2);
    v_ref_number TEXT;
    v_redemption_id UUID;
    v_ledger_type TEXT;
    v_daily_total INTEGER;

    -- Configurable limits
    c_min_redemption INTEGER := 50;
    c_max_per_tx INTEGER := 10000;
    c_max_daily INTEGER := 50000;
    c_gfp_to_kes DECIMAL := 0.01; -- 100 GFP = 1 KES
BEGIN
    -- ── AUTH ──
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- ── VALIDATE TYPE ──
    IF p_type NOT IN ('money', 'airtime', 'voucher') THEN
        RAISE EXCEPTION 'Invalid redemption type: %', p_type;
    END IF;

    -- ── VALIDATE AMOUNT ──
    IF p_amount < c_min_redemption THEN
        RAISE EXCEPTION 'Minimum redemption is % points', c_min_redemption;
    END IF;

    IF p_amount > c_max_per_tx THEN
        RAISE EXCEPTION 'Maximum per transaction is % points', c_max_per_tx;
    END IF;

    -- ── DAILY LIMIT CHECK ──
    SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
    FROM public.point_redemptions
    WHERE user_id = v_user_id
      AND status IN ('pending', 'processing', 'completed')
      AND created_at >= (now() AT TIME ZONE 'UTC')::date;

    IF (v_daily_total + p_amount) > c_max_daily THEN
        RAISE EXCEPTION 'Daily redemption limit of % points exceeded. You have already redeemed % today.', c_max_daily, v_daily_total;
    END IF;

    -- ── CALCULATE ──
    v_net_amount := p_amount - v_fee;
    v_kes_equivalent := v_net_amount * c_gfp_to_kes;

    -- ── DETERMINE LEDGER TYPE ──
    CASE p_type
        WHEN 'money' THEN v_ledger_type := 'redeem_money';
        WHEN 'airtime' THEN v_ledger_type := 'redeem_airtime';
        WHEN 'voucher' THEN v_ledger_type := 'redeem_voucher';
        ELSE v_ledger_type := 'redeem';
    END CASE;

    -- ── LOCK WALLET ──
    SELECT available_points INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet not found';
    END IF;

    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient points. Available: %, Requested: %', v_current_balance, p_amount;
    END IF;

    -- ── GENERATE REFERENCE ──
    v_ref_number := 'KRX-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));

    -- ── CREATE REDEMPTION RECORD ──
    INSERT INTO public.point_redemptions (
        reference_number, user_id, type, amount, fee, net_amount,
        kes_equivalent, status, payout_method, payout_details
    ) VALUES (
        v_ref_number, v_user_id, p_type, p_amount, v_fee, v_net_amount,
        v_kes_equivalent, 'processing', p_payout_method, p_payout_details
    ) RETURNING id INTO v_redemption_id;

    -- ── DEDUCT WALLET ──
    UPDATE public.user_wallets
    SET available_points = available_points - p_amount,
        lifetime_redeemed = COALESCE(lifetime_redeemed, 0) + p_amount
    WHERE user_id = v_user_id;

    -- ── WRITE LEDGER ──
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after,
        reference_id, description
    ) VALUES (
        v_user_id, v_ledger_type, -p_amount, v_current_balance,
        v_current_balance - p_amount, v_redemption_id,
        'Redeemed ' || p_amount || ' points via ' || p_payout_method || '. KES ' || v_kes_equivalent
    );

    -- ── MARK COMPLETED (simulated instant for now) ──
    UPDATE public.point_redemptions
    SET status = 'completed', completed_at = now()
    WHERE id = v_redemption_id;

    -- ── NOTIFY USER ──
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_user_id, 'user', 'success',
        'Redemption Successful! 🎉',
        'You redeemed ' || p_amount || ' GFP for KES ' || v_kes_equivalent || '. Ref: ' || v_ref_number
    );

    RETURN jsonb_build_object(
        'success', true,
        'reference_number', v_ref_number,
        'redemption_id', v_redemption_id,
        'status', 'completed',
        'amount', p_amount,
        'kes_equivalent', v_kes_equivalent,
        'balance_after', v_current_balance - p_amount
    );
END;
$$;
