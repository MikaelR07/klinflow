-- ==========================================
-- SUB-WALLET MIGRATION
-- Adds payout_balance to user_wallets and fixes agent earnings
-- ==========================================

-- 1. Add Payout Balance Column
ALTER TABLE public.user_wallets ADD COLUMN IF NOT EXISTS payout_balance numeric(12,2) DEFAULT 0.00;

-- 2. New Stats Function (v3) using wallet_transactions for revenue
CREATE OR REPLACE FUNCTION "public"."get_company_stats_v3"("p_company_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result json;
  v_driver_ids UUID[];
  v_is_owner BOOLEAN;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
BEGIN
  -- 1. Check if the user is an owner or company admin
  SELECT (agent_account_type IN ('company_admin', 'owner')) INTO v_is_owner
  FROM public.profiles
  WHERE id = p_company_id;

  -- 2. Determine which IDs to aggregate
  IF COALESCE(v_is_owner, false) THEN
    -- If owner, aggregate their own data plus all their fleet drivers
    SELECT COALESCE(array_agg(id), ARRAY[p_company_id]::UUID[]) INTO v_driver_ids 
    FROM public.profiles 
    WHERE company_id = p_company_id OR id = p_company_id;
  ELSE
    -- If individual agent or fleet driver, ONLY aggregate their own data
    v_driver_ids := ARRAY[p_company_id];
  END IF;

  -- 3. Calculate Aggregated Metrics
  SELECT json_build_object(
    -- Financials (Outbound Revenue from Ledger)
    'total',             COALESCE((SELECT sum(amount) FROM public.wallet_transactions WHERE profile_id = ANY(v_driver_ids) AND transaction_type = 'payout' AND amount > 0), 0),
    'todayPayout',       COALESCE((SELECT sum(amount) FROM public.wallet_transactions WHERE profile_id = ANY(v_driver_ids) AND transaction_type = 'payout' AND amount > 0 AND created_at::date = CURRENT_DATE), 0),
    'yesterdayPayout',   COALESCE((SELECT sum(amount) FROM public.wallet_transactions WHERE profile_id = ANY(v_driver_ids) AND transaction_type = 'payout' AND amount > 0 AND created_at::date = CURRENT_DATE - 1), 0),
    'inventoryValue',    COALESCE((SELECT sum(estimated_value) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    
    -- Volume & Counts
    'totalJobs',         (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'),
    'completedToday',    (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE),
    'yesterdayJobs',     (SELECT count(*) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE - 1),
    
    -- Weight Tracking
    'totalKgRecovered',  COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids)), 0),
    'todayKg',           COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date = CURRENT_DATE), 0),
    'yesterdayKg',       COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date = CURRENT_DATE - 1), 0),
    'thisWeekKg',        COALESCE((SELECT sum(weight_kg) FROM public.assets WHERE verifier_id = ANY(v_driver_ids) AND created_at::date >= v_week_start), 0),
    
    -- Weekly Chart Data (Mon to Sun)
    'weeklyData',        (
                           SELECT json_agg(d) FROM (
                             SELECT 
                               TO_CHAR(days.day, 'Dy') as day,
                               COALESCE(sum(a.weight_kg), 0) as weight,
                               COALESCE(sum(wt.amount), 0) as revenue
                             FROM generate_series(v_week_start, v_week_start + 6, '1 day'::interval) as days(day)
                             LEFT JOIN public.assets a ON a.created_at::date = days.day AND a.verifier_id = ANY(v_driver_ids)
                             LEFT JOIN public.wallet_transactions wt ON wt.created_at::date = days.day AND wt.profile_id = ANY(v_driver_ids) AND wt.transaction_type = 'payout' AND wt.amount > 0
                             GROUP BY days.day
                             ORDER BY days.day
                           ) d
                         )
  ) INTO result;
  
  RETURN result;
END;
$$;

ALTER FUNCTION "public"."get_company_stats_v3"("p_company_id" "uuid") OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_company_stats_v3"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_stats_v3"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_stats_v3"("p_company_id" "uuid") TO "service_role";

-- 3. Internal Transfer RPC
CREATE OR REPLACE FUNCTION "public"."transfer_payout_to_trading"("p_amount" numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_payout_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

    SELECT payout_balance INTO v_payout_balance FROM public.user_wallets WHERE user_id = v_user_id FOR UPDATE;
    
    IF v_payout_balance IS NULL OR v_payout_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in payout balance';
    END IF;

    -- Deduct from payout, add to trading
    UPDATE public.user_wallets 
    SET 
        payout_balance = payout_balance - p_amount,
        cash_balance = cash_balance + p_amount
    WHERE user_id = v_user_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, status, description, metadata)
    VALUES (v_user_id, p_amount, 'deposit', 'completed', 'Transfer from Payout to Trading', jsonb_build_object('type', 'internal_transfer'));

    RETURN json_build_object('success', true, 'message', 'Transfer successful');
END;
$$;

GRANT ALL ON FUNCTION "public"."transfer_payout_to_trading"("p_amount" numeric) TO "authenticated";

-- 4. Withdraw Payout RPC
CREATE OR REPLACE FUNCTION "public"."withdraw_payout"("p_amount" numeric) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_payout_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be greater than zero'; END IF;

    SELECT payout_balance INTO v_payout_balance FROM public.user_wallets WHERE user_id = v_user_id FOR UPDATE;
    
    IF v_payout_balance IS NULL OR v_payout_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds in payout balance';
    END IF;

    -- Deduct from payout
    UPDATE public.user_wallets 
    SET payout_balance = payout_balance - p_amount
    WHERE user_id = v_user_id;

    -- Record transaction
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, status, description, metadata)
    VALUES (v_user_id, -p_amount, 'withdrawal', 'completed', 'Withdrawal from Payout Balance', jsonb_build_object('type', 'withdrawal'));

    RETURN json_build_object('success', true, 'message', 'Withdrawal successful');
END;
$$;

GRANT ALL ON FUNCTION "public"."withdraw_payout"("p_amount" numeric) TO "authenticated";

-- 5. Update hub_process_agent_intake
CREATE OR REPLACE FUNCTION public.hub_process_agent_intake(
  p_hub_id uuid,
  p_agent_id uuid,
  p_asset_updates jsonb,
  p_payment_method text,
  p_total_payout numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
BEGIN
  -- Update each asset
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_asset_updates)
  LOOP
    UPDATE public.assets 
    SET 
      weight_kg = (v_item->>'final_weight')::numeric,
      amount_paid = (v_item->>'final_price')::numeric,
      status = 'transferred_to_hub',
      hub_manager_id = p_hub_id,
      payment_method = p_payment_method,
      sourcing_tag = 'agent-intake'
    WHERE id = (v_item->>'asset_id')::uuid;
  END LOOP;

  -- If payment is wallet, add to agent's payout_balance and log to wallet_transactions
  IF p_payment_method = 'digital_wallet' THEN
    -- Ensure wallet exists
    INSERT INTO public.user_wallets (user_id, payout_balance)
    VALUES (p_agent_id, p_total_payout)
    ON CONFLICT (user_id) DO UPDATE 
    SET payout_balance = user_wallets.payout_balance + p_total_payout;

    INSERT INTO public.wallet_transactions (
      profile_id,
      amount,
      transaction_type,
      status,
      description
    ) VALUES (
      p_agent_id,
      p_total_payout,
      'payout',
      'completed',
      'Intake payout from Hub'
    );
  END IF;

  RETURN jsonb_build_object('status', 'success');
END;
$$;
