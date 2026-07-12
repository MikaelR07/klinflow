


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."delivery_method_enum" AS ENUM (
    'agent_pickup',
    'self_drop',
    'flexible'
);


ALTER TYPE "public"."delivery_method_enum" OWNER TO "postgres";


CREATE TYPE "public"."fulfillment_status_enum" AS ENUM (
    'pending_coordination',
    'pickup_scheduled',
    'agent_assigned',
    'agent_on_the_way',
    'arrived',
    'material_verification',
    'pickup_completed',
    'in_transit',
    'delivered',
    'completed',
    'cancelled',
    'disputed'
);


ALTER TYPE "public"."fulfillment_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_booking"("target_booking_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.bookings
  SET 
    agent_id = auth.uid(), 
    status = 'confirmed', 
    updated_at = NOW()
  WHERE 
    id = target_booking_id 
    AND status = 'pending' 
    AND agent_id IS NULL;
END;
$$;


ALTER FUNCTION "public"."accept_booking"("target_booking_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_booking"("target_booking_id" "uuid", "assigned_agent_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.bookings
    SET 
        agent_id   = assigned_agent_id,
        status     = 'confirmed',
        updated_at = NOW()
    WHERE id = target_booking_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RETURN 'already_claimed';
    END IF;

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."accept_booking"("target_booking_id" "uuid", "assigned_agent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."accept_rfq_offer_v2"("p_offer_id" "uuid", "p_delivery_method" "public"."delivery_method_enum" DEFAULT 'agent_pickup'::"public"."delivery_method_enum", "p_pickup_address" "text" DEFAULT NULL::"text", "p_dropoff_address" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rfq_id UUID;
    v_buyer_id UUID;
    v_seller_id UUID;
    v_buyer_account_type TEXT;
    v_buyer_company_id UUID;
    v_verification_code VARCHAR(6);
    v_fulfillment_id UUID;
BEGIN
    -- 1. Fetch offer details
    SELECT rfq_id, buyer_id, seller_id INTO v_rfq_id, v_buyer_id, v_seller_id
    FROM public.rfq_offers
    WHERE id = p_offer_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offer not found or not pending';
    END IF;

    -- 2. Fetch buyer details
    SELECT agent_account_type, company_id INTO v_buyer_account_type, v_buyer_company_id
    FROM public.profiles
    WHERE id = v_buyer_id;

    -- 3. Update RFQ and Offers
    UPDATE public.rfq_offers SET status = 'accepted' WHERE id = p_offer_id;
    UPDATE public.rfq_offers SET status = 'rejected' WHERE rfq_id = v_rfq_id AND status = 'pending' AND id != p_offer_id;
    UPDATE public.rfqs SET status = 'fulfilled' WHERE id = v_rfq_id;

    -- 4. Generate random 6 digit code
    v_verification_code := lpad(floor(random() * 1000000)::text, 6, '0');

    -- 5. Create Fulfillment Order
    INSERT INTO public.fulfillment_orders (
        rfq_id, proposal_id, buyer_id, seller_id, 
        organization_id, assigned_agent_id,
        delivery_method, pickup_address, dropoff_address, verification_code,
        status
    ) VALUES (
        v_rfq_id, p_offer_id, v_buyer_id, v_seller_id,
        CASE WHEN v_buyer_account_type = 'company_admin' THEN v_buyer_id ELSE NULL END,
        CASE WHEN v_buyer_account_type = 'independent' THEN v_buyer_id ELSE NULL END,
        p_delivery_method, p_pickup_address, p_dropoff_address, v_verification_code,
        CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END
    ) RETURNING id INTO v_fulfillment_id;

    -- 6. Insert initial history
    INSERT INTO public.fulfillment_status_history (fulfillment_id, status, actor_id, notes)
    VALUES (
        v_fulfillment_id, 
        CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END, 
        v_buyer_id, 
        'Fulfillment order created upon acceptance.'
    );

    RETURN v_fulfillment_id;
END;
$$;


ALTER FUNCTION "public"."accept_rfq_offer_v2"("p_offer_id" "uuid", "p_delivery_method" "public"."delivery_method_enum", "p_pickup_address" "text", "p_dropoff_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_reward_points"("p_user_id" "uuid", "p_points" integer, "p_description" "text" DEFAULT 'Reward'::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.profiles
  SET reward_points = COALESCE(reward_points, 0) + p_points
  WHERE id = p_user_id;

  INSERT INTO public.rewards_ledger (
    profile_id, transaction_type, amount_cashback, amount_points, description
  ) VALUES (
    p_user_id, 'earning', 0, p_points, p_description
  );
END;
$$;


ALTER FUNCTION "public"."add_reward_points"("p_user_id" "uuid", "p_points" integer, "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_profile"("target_user_id" "uuid", "field_name" "text", "field_value" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF field_name = 'is_staff' THEN
    UPDATE public.profiles SET is_staff = (field_value = 'true') WHERE id = target_user_id;
  ELSIF field_name = 'is_verified' THEN
    UPDATE public.profiles SET is_verified = (field_value = 'true') WHERE id = target_user_id;
  END IF;
END;
$$;


ALTER FUNCTION "public"."admin_update_profile"("target_user_id" "uuid", "field_name" "text", "field_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."agent_completes_pickup"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_total_fee" numeric) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Move booking to escrow state. No money moves yet.
    UPDATE public.bookings 
    SET 
        status = 'picked_up',
        payment_status = 'authorized',
        actual_weight_kg = p_weight_kg,
        total_price = p_total_fee,
        agent_id = p_agent_uuid,
        updated_at = NOW()
    WHERE id = p_booking_uuid;

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."agent_completes_pickup"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_total_fee" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_fleet_driver_request"("p_request_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_request RECORD;
BEGIN
    -- Get request
    SELECT * INTO v_request
    FROM public.company_join_requests
    WHERE id = p_request_id AND company_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not authorized';
    END IF;

    -- Update request status
    UPDATE public.company_join_requests
    SET status = 'approved'
    WHERE id = p_request_id;

    -- Update driver profile to set company_id
    UPDATE public.profiles
    SET company_id = v_request.company_id,
        agent_account_type = 'fleet_driver'
    WHERE id = v_request.driver_id;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."approve_fleet_driver_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_fund_request"("p_request_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_request RECORD;
    v_owner_balance NUMERIC;
BEGIN
    SELECT * INTO v_request
    FROM public.fund_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'message', 'Request not found');
    END IF;

    IF v_request.status != 'pending' THEN
        RETURN json_build_object('success', false, 'message', 'Request already processed');
    END IF;

    -- Verify Owner Balance from user_wallets
    SELECT cash_balance INTO v_owner_balance
    FROM public.user_wallets
    WHERE user_id = v_request.company_id;

    IF COALESCE(v_owner_balance, 0) < v_request.amount THEN
        RETURN json_build_object('success', false, 'message', 'Insufficient company balance');
    END IF;

    -- Atomic Transfer
    -- Debit Owner
    UPDATE public.user_wallets
    SET cash_balance = cash_balance - v_request.amount
    WHERE user_id = v_request.company_id;

    -- Credit Driver
    INSERT INTO public.user_wallets (user_id, cash_balance)
    VALUES (v_request.driver_id, v_request.amount)
    ON CONFLICT (user_id) DO UPDATE
    SET cash_balance = user_wallets.cash_balance + v_request.amount;

    UPDATE public.fund_requests
    SET status = 'approved', updated_at = now()
    WHERE id = p_request_id;

    -- Use correct columns: transaction_type, reference_id, metadata
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES
    (v_request.company_id, -v_request.amount, 'withdrawal', p_request_id, jsonb_build_object('target', 'driver', 'description', 'Fund disbursement to driver: ' || v_request.driver_id)),
    (v_request.driver_id, v_request.amount, 'topup', p_request_id, jsonb_build_object('source', 'owner', 'description', 'Fund receipt from company owner'));

    RETURN json_build_object('success', true, 'message', 'Funds disbursed successfully');
END;
$$;


ALTER FUNCTION "public"."approve_fund_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_staff_application"("target_user_id" "uuid", "new_fleet_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.profiles
  SET 
    is_staff = true,
    fleet_id = new_fleet_id,
    is_verified = true,
    notes = REPLACE(COALESCE(notes, ''), 'staff_application_pending', '')
  WHERE id = target_user_id;
END;
$$;


ALTER FUNCTION "public"."approve_staff_application"("target_user_id" "uuid", "new_fleet_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."client_releases_funds"("p_booking_uuid" "uuid", "p_client_uuid" "uuid", "p_client_gfp" integer DEFAULT 0) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_agent_uuid        UUID;
    v_total_fee         NUMERIC;
    v_weight_kg         NUMERIC;
    v_account_type      TEXT;
    v_company_id        UUID;
    v_cashback_pct      NUMERIC;
    v_platform_cut      NUMERIC;
    v_agent_payout      NUMERIC;
    v_client_cashback   NUMERIC;
BEGIN
    -- 1. Fetch Booking Details
    SELECT agent_id, total_price, actual_weight_kg 
    INTO v_agent_uuid, v_total_fee, v_weight_kg
    FROM public.bookings 
    WHERE id = p_booking_uuid;

    IF v_agent_uuid IS NULL THEN
        RETURN 'error: booking not found';
    END IF;

    -- 2. Identify the Agent / Fleet type
    SELECT agent_account_type, company_id 
    INTO v_account_type, v_company_id
    FROM public.profiles 
    WHERE id = v_agent_uuid;

    -- 3. Lookup custom cashback % from agent_configurations
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        SELECT cashback_percentage INTO v_cashback_pct FROM public.agent_configurations WHERE agent_id = v_company_id;
    ELSE
        SELECT cashback_percentage INTO v_cashback_pct FROM public.agent_configurations WHERE agent_id = v_agent_uuid;
    END IF;

    IF v_cashback_pct IS NULL THEN
        v_cashback_pct := 10.00;
    END IF;

    -- 4. Calculate splits
    v_total_fee       := COALESCE(v_total_fee, 0);
    v_platform_cut    := v_total_fee * 0.10;
    v_agent_payout    := v_total_fee * 0.90;
    v_client_cashback := v_total_fee * (v_cashback_pct / 100.0);

    -- 5. Mark booking completed & paid, store cashback
    UPDATE public.bookings 
    SET 
        status          = 'completed',
        payment_status  = 'paid',
        client_cashback = v_client_cashback,
        updated_at      = NOW()
    WHERE id = p_booking_uuid;

    -- 6. Pay the Agent / Company AND award Track Points
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        UPDATE public.profiles 
        SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout,
            reward_points = COALESCE(reward_points, 0) + p_client_gfp
        WHERE id = v_company_id;
        
        -- Also award track points directly to the driver
        UPDATE public.profiles
        SET reward_points = COALESCE(reward_points, 0) + p_client_gfp
        WHERE id = v_agent_uuid;
    ELSE
        UPDATE public.profiles 
        SET wallet_balance = COALESCE(wallet_balance, 0) + v_agent_payout,
            reward_points = COALESCE(reward_points, 0) + p_client_gfp
        WHERE id = v_agent_uuid;
    END IF;

    -- 7. Reward the Client (Cashback + GFP)
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_client_cashback,
        reward_points  = COALESCE(reward_points, 0)  + p_client_gfp
    WHERE id = p_client_uuid;

    -- 8. Log the transaction
    INSERT INTO public.rewards_ledger 
        (profile_id, booking_id, transaction_type, amount_cashback, amount_points, description)
    VALUES 
        (p_client_uuid, p_booking_uuid, 'earning', v_client_cashback, p_client_gfp,
         'Recycling reward: ' || COALESCE(v_weight_kg, 0) || 'kg × 5 = ' || p_client_gfp || ' GFP');

    -- 9. Notify the Client
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        p_client_uuid, 'user', 'success', 'Payment Complete & Rewards Earned! 💸',
        'You earned KSh ' || ROUND(v_client_cashback, 2) || ' cashback plus ' || p_client_gfp || ' GFP points!'
    );

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."client_releases_funds"("p_booking_uuid" "uuid", "p_client_uuid" "uuid", "p_client_gfp" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_client_cashback" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update Booking
    UPDATE public.bookings
    SET status = 'completed', actual_weight_kg = p_weight_kg, 
        client_cashback = p_client_cashback, total_price = p_client_cashback,
        payment_status = 'paid'
    WHERE id = p_booking_uuid;

    -- Direct Wallet Transfer
    UPDATE public.profiles SET wallet_balance = wallet_balance - p_client_cashback WHERE id = p_agent_uuid;
    UPDATE public.profiles SET wallet_balance = wallet_balance + p_client_cashback 
    WHERE id = (SELECT user_id FROM public.bookings WHERE id = p_booking_uuid);
END;
$$;


ALTER FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_client_cashback" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_immediate_payout" numeric, "p_held_payout" numeric) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- 1. Mark booking as completed
    UPDATE bookings SET status = 'completed', weight_kg = p_weight_kg WHERE id = p_booking_uuid;
    
    -- 2. Update wallet and hold funds (is_en_route stays FALSE)
    UPDATE profiles SET 
        wallet_balance = wallet_balance + p_immediate_payout,
        held_balance = held_balance + p_held_payout
    WHERE id = p_agent_uuid;
    
    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_immediate_payout" numeric, "p_held_payout" numeric) OWNER TO "postgres";


-- =========================================================================
-- PLATFORM TREASURY & PREVIEW RPC
-- =========================================================================

CREATE TABLE IF NOT EXISTS "public"."platform_treasury" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL PRIMARY KEY,
    "source_type" "text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."platform_treasury" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."preview_payout"("p_weight_kg" numeric, "p_rate_per_kg" numeric, "p_is_market_trade" boolean DEFAULT false) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_gross numeric;
    v_fee numeric;
    v_net numeric;
    v_gfp integer;
BEGIN
    v_gross := p_weight_kg * p_rate_per_kg;
    v_fee := v_gross * 0.05;
    v_net := v_gross - v_fee;
    
    IF p_is_market_trade THEN
        v_gfp := 0;
    ELSE
        v_gfp := FLOOR(p_weight_kg * 2);
    END IF;

    RETURN jsonb_build_object(
        'gross', ROUND(v_gross, 2),
        'fee', ROUND(v_fee, 2),
        'net', ROUND(v_net, 2),
        'gfp', v_gfp
    );
END;
$$;
ALTER FUNCTION "public"."preview_payout"("p_weight_kg" numeric, "p_rate_per_kg" numeric, "p_is_market_trade" boolean) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_rate_per_kg" numeric, "p_is_manual" boolean) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_actual_agent_id UUID;
    v_target_wallet_uuid UUID;
    v_account_type TEXT;
    v_company_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    
    v_gross_value DECIMAL;
    v_platform_cut DECIMAL;
    v_client_cashback DECIMAL;
    v_client_gfp INTEGER;
    
    v_wallet_points_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_uuid
    FOR UPDATE;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Idempotency: Booking already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_target_wallet_uuid := v_company_id;
    ELSE
        v_target_wallet_uuid := p_agent_uuid;
    END IF;

    v_gross_value := p_weight_kg * p_rate_per_kg;
    v_platform_cut := v_gross_value * 0.05;
    v_client_cashback := v_gross_value - v_platform_cut; 
    v_client_gfp := FLOOR(p_weight_kg * 2);

    -- Update total_price to the actual gross value
    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg, total_price = v_gross_value, updated_at = NOW()
    WHERE id = p_booking_uuid;

    -- DEDUCT GROSS FROM AGENT'S WALLET
    INSERT INTO public.user_wallets (user_id, cash_balance)
    VALUES (v_target_wallet_uuid, -v_gross_value)
    ON CONFLICT (user_id) DO UPDATE 
    SET cash_balance = user_wallets.cash_balance - v_gross_value;

    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_target_wallet_uuid, -v_gross_value, 'payout', p_booking_uuid, jsonb_build_object('role', 'agent', 'type', 'material_purchase'));

    -- ADD FUNDS TO RESIDENT'S WALLET
    IF p_client_uuid IS NOT NULL THEN
        -- UPDATE user_wallets for BOTH cash and GFP
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (p_client_uuid, v_client_cashback, v_client_cashback, v_client_gfp, v_client_gfp)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF v_client_gfp > 0 THEN
            SELECT available_points - v_client_gfp INTO v_wallet_points_before 
            FROM public.user_wallets WHERE user_id = p_client_uuid;

            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                p_client_uuid, 'earn', v_client_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + v_client_gfp, 'Earned points from pickup'
            );
        END IF;

        -- We still insert into wallet_transactions for cash history
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, v_client_cashback, 'payout', p_booking_uuid, jsonb_build_object('role', 'resident', 'type', 'material_buyback'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Payment Received! 💰',
            'You just received KSh ' || ROUND(v_client_cashback, 2) || ' and ' || v_client_gfp || ' GFP for your recyclables.'
        );
    END IF;

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('resident_pickup', v_platform_cut, p_booking_uuid);
    END IF;

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_rate_per_kg" numeric, "p_is_manual" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agent_immediate" numeric, "p_agent_held" numeric, "p_client_cashback" numeric, "p_client_gfp" integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_agent_role TEXT;
BEGIN
    SELECT COALESCE(agent_role, 'freelancer') INTO v_agent_role 
    FROM profiles WHERE id = p_agent_uuid;

    -- Move booking to picked_up — triggers Sarah's payment prompt
    UPDATE bookings 
    SET status = 'picked_up', 
        weight_kg = p_weight_kg,
        payment_status = 'authorized'
    WHERE id = p_booking_uuid;

    -- Only pay freelancers per-job
    IF v_agent_role = 'freelancer' THEN
        UPDATE profiles SET 
            wallet_balance = wallet_balance + p_agent_immediate,
            held_balance = COALESCE(held_balance, 0) + p_agent_held
        WHERE id = p_agent_uuid;
    END IF;

    -- Always reward the client
    IF p_client_uuid IS NOT NULL THEN
        UPDATE profiles SET 
            wallet_balance = wallet_balance + p_client_cashback,
            gfp_balance = COALESCE(gfp_balance, 0) + p_client_gfp
        WHERE id = p_client_uuid;
    END IF;
    
    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agent_immediate" numeric, "p_agent_held" numeric, "p_client_cashback" numeric, "p_client_gfp" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_booking_trade_payout"("p_booking_id" "uuid", "p_actual_weight" numeric, "p_payout_amount" numeric) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_caller_id UUID;
    v_agent_id UUID;
    v_client_id UUID;
    v_waste_type TEXT;
    v_agent_balance NUMERIC;
    v_booking_status TEXT;
    
    v_platform_cut NUMERIC;
    v_net_payout NUMERIC;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- 1. Fetch parties and LOCK booking
    SELECT agent_id, user_id, waste_type, status
    INTO v_agent_id, v_client_id, v_waste_type, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF v_agent_id IS NULL THEN RAISE EXCEPTION 'Booking not found'; END IF;

    -- 2. Ownership: Only the assigned agent can complete this
    IF v_agent_id IS DISTINCT FROM v_caller_id THEN
        RAISE EXCEPTION 'Unauthorized: Only the assigned agent can settle this trade';
    END IF;

    -- 3. Idempotency
    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Booking already completed';
    END IF;

    -- 4. Lock and check Agent balance (from user_wallets!)
    SELECT cash_balance INTO v_agent_balance
    FROM public.user_wallets
    WHERE user_id = v_agent_id
    FOR UPDATE;

    IF v_agent_balance IS NULL OR v_agent_balance < p_payout_amount THEN
        RAISE EXCEPTION 'Insufficient funds in agent wallet';
    END IF;

    -- Calculate Platform Cut
    v_platform_cut := p_payout_amount * 0.05;
    v_net_payout := p_payout_amount - v_platform_cut;

    -- 5. Atomic Mutation
    UPDATE public.bookings
    SET status = 'completed',
        actual_weight_kg = p_actual_weight,
        total_price = p_payout_amount,
        updated_at = now()
    WHERE id = p_booking_id;

    -- DEDUCT GROSS FROM AGENT
    UPDATE public.user_wallets SET cash_balance = cash_balance - p_payout_amount WHERE user_id = v_agent_id;
    
    -- PAY SELLER NET
    INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
    VALUES (v_client_id, v_net_payout, v_net_payout)
    ON CONFLICT (user_id) DO UPDATE SET 
        cash_balance = user_wallets.cash_balance + v_net_payout,
        lifetime_cash_earned = user_wallets.lifetime_cash_earned + v_net_payout;

    -- 6. Immutable Ledger Entries
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES
        (v_agent_id, -p_payout_amount, 'payout', p_booking_id, jsonb_build_object('role', 'buyer')),
        (v_client_id, v_net_payout, 'payout', p_booking_id, jsonb_build_object('role', 'seller'));

    -- 7. Create inventory asset for the Agent
    INSERT INTO public.assets
        (booking_id, verifier_id, material_type, weight_kg, estimated_value, status, source)
    VALUES
        (p_booking_id, v_agent_id, v_waste_type, p_actual_weight, p_payout_amount, 'verified', 'marketplace');

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('marketplace_trade', v_platform_cut, p_booking_id);
    END IF;

    -- 8. Notifications
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_client_id, 'user', 'success', 'Payment Received! 💰',
        'You just received KSh ' || ROUND(v_net_payout, 2) || ' for your ' || p_actual_weight || 'kg of ' || v_waste_type || '.'
    );

    RETURN jsonb_build_object('status', 'success');
END;
$$;


ALTER FUNCTION "public"."complete_booking_trade_payout"("p_booking_id" "uuid", "p_actual_weight" numeric, "p_payout_amount" numeric) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "waste_type" "text",
    "preferred_date" "date" NOT NULL,
    "time_slot" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "bags" integer DEFAULT 1,
    "weight_kg" numeric(10,2) DEFAULT 0.00,
    "notes" "text",
    "estate" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "actual_weight_kg" numeric(10,2) DEFAULT 0.00,
    "agent_feedback" "text",
    "payment_status" "text" DEFAULT 'pending'::"text",
    "photo_url" "text",
    "agent_rating" integer,
    "agent_rating_comment" "text",
    "client_cashback" numeric(10,2) DEFAULT 0,
    "actual_payout" numeric(10,2) DEFAULT 0,
    "booking_type" "text" DEFAULT 'any'::"text",
    "fee" numeric DEFAULT 0,
    "total_price" numeric DEFAULT 0,
    "hidden_for_client" boolean DEFAULT false,
    "hidden_for_agent" boolean DEFAULT false,
    "h3_index" "text",
    "is_market_trade" boolean DEFAULT false,
    "listing_id" "uuid",
    "counter_offer_amount" numeric,
    "counter_offer_status" "text",
    "swarm_id" "uuid",
    "is_group_pickup" boolean DEFAULT false,
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'scheduled'::"text", 'confirmed'::"text", 'in_progress'::"text", 'in-progress'::"text", 'completed'::"text", 'cancelled'::"text", 'picked_up'::"text", 'arrived'::"text", 'counter_offer_pending'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bookings"."booking_type" IS 'Targeting type: any, staff, or freelance';



CREATE OR REPLACE FUNCTION "public"."debug_get_all_bookings"() RETURNS SETOF "public"."bookings"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT * FROM public.bookings ORDER BY created_at DESC LIMIT 20;
$$;


ALTER FUNCTION "public"."debug_get_all_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_own_user"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."delete_own_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deposit_to_wallet"("p_amount" numeric) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Deposit amount must be positive';
    END IF;

    -- ONLY update the new canonical user_wallets table
    INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
    VALUES (auth.uid(), p_amount, p_amount)
    ON CONFLICT (user_id) DO UPDATE 
    SET cash_balance = user_wallets.cash_balance + p_amount,
        lifetime_cash_earned = user_wallets.lifetime_cash_earned + p_amount;

    -- Record in ledger for audit trail
    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, metadata)
    VALUES (
        auth.uid(),
        p_amount,
        'topup',
        jsonb_build_object('source', 'self_deposit', 'method', 'in_app')
    );
END;
$$;


ALTER FUNCTION "public"."deposit_to_wallet"("p_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."finalize_group_rfq"("p_rfq_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_buyer_id UUID;
    v_buyer_account_type TEXT;
    v_buyer_company_id UUID;
    v_pickup_address TEXT;
    
    v_offer RECORD;
    v_verification_code VARCHAR(6);
    v_fulfillment_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- 1. Fetch RFQ details
    SELECT buyer_id, pickup_area INTO v_buyer_id, v_pickup_address
    FROM public.rfqs
    WHERE id = p_rfq_id AND status = 'open' AND is_group_collection = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Group RFQ not found or not open';
    END IF;

    -- 2. Fetch buyer details
    SELECT agent_account_type, company_id INTO v_buyer_account_type, v_buyer_company_id
    FROM public.profiles
    WHERE id = v_buyer_id;

    -- 3. Update RFQ status
    UPDATE public.rfqs SET status = 'fulfilled' WHERE id = p_rfq_id;

    -- 4. Reject any pending offers (if any)
    UPDATE public.rfq_offers SET status = 'rejected' WHERE rfq_id = p_rfq_id AND status = 'pending';

    -- 5. Loop through all accepted offers and generate fulfillment orders
    FOR v_offer IN 
        SELECT id, seller_id 
        FROM public.rfq_offers 
        WHERE rfq_id = p_rfq_id AND status = 'accepted'
    LOOP
        -- Generate random 6 digit code
        v_verification_code := lpad(floor(random() * 1000000)::text, 6, '0');

        -- Create Fulfillment Order
        INSERT INTO public.fulfillment_orders (
            rfq_id, proposal_id, buyer_id, seller_id, 
            organization_id, assigned_agent_id,
            delivery_method, pickup_address, verification_code,
            status
        ) VALUES (
            p_rfq_id, v_offer.id, v_buyer_id, v_offer.seller_id,
            CASE WHEN v_buyer_account_type = 'company_admin' THEN v_buyer_id ELSE NULL END,
            CASE WHEN v_buyer_account_type = 'independent' THEN v_buyer_id ELSE NULL END,
            'agent_pickup', v_pickup_address, v_verification_code,
            CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END
        ) RETURNING id INTO v_fulfillment_id;

        -- Insert initial history
        INSERT INTO public.fulfillment_status_history (fulfillment_id, status, actor_id, notes)
        VALUES (
            v_fulfillment_id, 
            CASE WHEN v_buyer_account_type = 'independent' THEN 'agent_assigned'::public.fulfillment_status_enum ELSE 'pending_coordination'::public.fulfillment_status_enum END, 
            v_buyer_id, 
            'Fulfillment order created from Group Collection pool.'
        );

        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;


ALTER FUNCTION "public"."finalize_group_rfq"("p_rfq_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_fleet_code"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    v_result TEXT := '';
    i INTEGER := 0;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_result := 'CF-';
        FOR i IN 1..6 LOOP
            v_result := v_result || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        END LOOP;
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE fleet_invite_code = v_result) INTO v_exists;
        
        IF NOT v_exists THEN
            RETURN v_result;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."generate_fleet_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_klinflow_id"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    new_id TEXT;
    done BOOLEAN := FALSE;
BEGIN
    WHILE NOT done LOOP
        -- Generate 'KF' + 8 uppercase alphanumeric characters
        new_id := 'KF' || upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if it exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE klinflow_id = new_id) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN new_id;
END;
$$;


ALTER FUNCTION "public"."generate_klinflow_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_active_agent_jobs"("agent_uuid" "uuid") RETURNS SETOF "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM public.bookings
    WHERE agent_id = agent_uuid
    AND (
        (is_market_trade = true AND status IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'picked_up'))
        OR
        (is_market_trade = false AND status IN ('confirmed', 'scheduled', 'accepted', 'in_progress', 'picked_up'))
    )
    ORDER BY created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_active_agent_jobs"("agent_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_overview"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalUsers',        (SELECT count(*) FROM public.profiles WHERE role = 'user'),
    'activeAgents',      (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND agent_account_type = 'independent' AND is_online = true),
    'registeredAgents',  (SELECT count(*) FROM public.profiles WHERE role = 'agent' AND agent_account_type = 'independent'),
    'totalCompanies',    (SELECT count(*) FROM public.profiles WHERE agent_account_type = 'company_admin'),
    'totalBusinesses',   (SELECT count(*) FROM public.profiles WHERE role = 'business'),
    'totalWeight',       COALESCE((SELECT sum(actual_weight_kg) FROM public.bookings WHERE status = 'completed'), 0),
    'completedJobs',     (SELECT count(*) FROM public.bookings WHERE status = 'completed'),
    'commissionRevenue', COALESCE((SELECT sum(fee) FROM public.bookings WHERE status = 'completed'), 0) + 
                         COALESCE((SELECT sum(total_price * 0.1) FROM public.marketplace_orders WHERE status IN ('completed', 'funds_released')), 0),
    'subscriptionRevenue', COALESCE((SELECT sum(CASE 
                                WHEN subscription_tier = 'standard' THEN 500 
                                WHEN subscription_tier = 'premium' THEN 1500 
                                ELSE 0 END) FROM public.profiles), 0)
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_admin_overview"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_bookings"("agent_uuid" "uuid") RETURNS SETOF "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_account_type TEXT;
    v_company_id UUID;
    v_config_agent_id UUID;
    v_accepted_materials JSONB;
BEGIN
    -- 1. Determine which agent's config to use
    SELECT agent_account_type, company_id INTO v_account_type, v_company_id 
    FROM public.profiles WHERE id = agent_uuid;

    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        v_config_agent_id := v_company_id;
    ELSE
        v_config_agent_id := agent_uuid;
    END IF;

    -- 2. Fetch the accepted materials from the configuration
    SELECT accepted_materials INTO v_accepted_materials
    FROM public.agent_configurations
    WHERE agent_id = v_config_agent_id;

    -- 3. Return matching bookings
    RETURN QUERY
    SELECT b.* FROM public.bookings b
    WHERE b.status = 'pending'
    AND b.is_market_trade = false
    AND (
        b.agent_id = agent_uuid -- Directly targeted to this agent
        OR (v_company_id IS NOT NULL AND b.agent_id = v_company_id) -- Targeted to fleet driver's parent company hub
        OR 
        (
            b.agent_id IS NULL -- Open pool
            AND (
                v_accepted_materials IS NULL 
                OR jsonb_array_length(v_accepted_materials) = 0
                OR v_accepted_materials ? b.waste_type
                OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements_text(v_accepted_materials) AS mat
                    WHERE LOWER(mat) = LOWER(b.waste_type)
                )
            )
            -- Check operational capacity weight limits (use company admin's limits for fleet drivers)
            AND COALESCE(b.weight_kg, 0) >= COALESCE((SELECT service_profile->>'min_weight' FROM public.profiles WHERE id = v_config_agent_id)::numeric, 0)
            AND COALESCE(b.weight_kg, 0) <= COALESCE((SELECT service_profile->>'max_weight' FROM public.profiles WHERE id = v_config_agent_id)::numeric, 99999)
        )
    )
    ORDER BY b.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_available_bookings"("agent_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_b2b_market_stats"() RETURNS SETOF json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT json_build_object(
    'label', material,
    'price', 'KES ' || ROUND(AVG(price_per_kg), 2),
    'trend', CASE 
               WHEN AVG(price_per_kg) > 50 THEN '+2.4%' 
               WHEN AVG(price_per_kg) < 20 THEN '-1.2%' 
               ELSE '+0.5%' 
             END,
    'color', CASE 
               WHEN AVG(price_per_kg) > 50 THEN 'text-emerald-500' 
               WHEN AVG(price_per_kg) < 20 THEN 'text-rose-500' 
               ELSE 'text-slate-400' 
             END
  )
  FROM public.marketplace_listings
  WHERE status = 'active'
  GROUP BY material
  ORDER BY AVG(price_per_kg) DESC;
END;
$$;


ALTER FUNCTION "public"."get_b2b_market_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_company_stats_v2"("p_company_id" "uuid") RETURNS json
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
    -- Financials
    'total',             COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed'), 0),
    'todayPayout',       COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE), 0),
    'yesterdayPayout',   COALESCE((SELECT sum(total_price) FROM public.bookings WHERE agent_id = ANY(v_driver_ids) AND status = 'completed' AND updated_at::date = CURRENT_DATE - 1), 0),
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
                               COALESCE(sum(b.fee), 0) as payout,
                               COALESCE(sum(b.total_price), 0) as revenue
                             FROM generate_series(v_week_start, v_week_start + 6, '1 day'::interval) as days(day)
                             LEFT JOIN public.assets a ON a.created_at::date = days.day AND a.verifier_id = ANY(v_driver_ids)
                             LEFT JOIN public.bookings b ON b.updated_at::date = days.day AND b.agent_id = ANY(v_driver_ids) AND b.status = 'completed'
                             GROUP BY days.day
                             ORDER BY days.day
                           ) d
                         )
  ) INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_company_stats_v2"("p_company_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_high_alert_bookings"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(t)
    FROM (
      SELECT 
        b.id,
        p.name as customer_name,
        b.waste_type,
        b.created_at,
        EXTRACT(EPOCH FROM (NOW() - b.created_at))/3600 as hours_pending
      FROM public.bookings b
      JOIN public.profiles p ON b.user_id = p.id
      WHERE b.status = 'pending' 
        AND b.created_at < NOW() - INTERVAL '24 hours'
      ORDER BY b.created_at ASC
      LIMIT 10
    ) t
  );
END;
$$;


ALTER FUNCTION "public"."get_high_alert_bookings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_market_intelligence"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result jsonb;
    commodity_trends jsonb;
    market_signals jsonb;
    opportunities jsonb;
    hotspots jsonb;
    recommendations jsonb;
    insights jsonb;
BEGIN

    -- =====================================================
    -- 1. COMMODITY TRENDS (Live Price Ticker)
    -- =====================================================
    WITH materials AS (
        SELECT 
            id, label as material_name, parent_category as category, price_per_kg as admin_price
        FROM public.waste_categories
        WHERE is_active = true AND parent_category IS NOT NULL
    ),
    recent_transactions AS (
        SELECT 
            r.material_grade,
            COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) as weight,
            o.offered_price as price,
            fo.created_at
        FROM public.fulfillment_orders fo
        JOIN public.rfq_offers o ON fo.proposal_id = o.id
        JOIN public.rfqs r ON fo.rfq_id = r.id
        WHERE fo.status IN ('completed', 'delivered')
    ),
    vwap_current AS (
        SELECT material_grade, SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_30d, SUM(weight) as volume_30d
        FROM recent_transactions WHERE created_at > now() - interval '30 days' GROUP BY material_grade
    ),
    vwap_previous AS (
        SELECT material_grade, SUM(weight * price) / NULLIF(SUM(weight), 0) as vwap_prev, SUM(weight) as volume_prev
        FROM recent_transactions WHERE created_at > now() - interval '60 days' AND created_at <= now() - interval '30 days' GROUP BY material_grade
    ),
    recent_rfqs AS (
        SELECT * FROM public.rfqs WHERE status = 'open' AND created_at > now() - interval '30 days'
    ),
    material_demand AS (
        SELECT material_grade, count(*) as c,
            CASE WHEN count(*) > 10 THEN 'High' WHEN count(*) > 5 THEN 'Moderate' ELSE 'Stable' END as demand_level
        FROM recent_rfqs GROUP BY material_grade
    ),
    material_supply AS (
        SELECT waste_type, count(*) as c,
            CASE WHEN count(*) > 20 THEN 'High' WHEN count(*) > 10 THEN 'Stable' ELSE 'Low' END as supply_level
        FROM public.bookings WHERE status = 'pending' GROUP BY waste_type
    ),
    top_buyers AS (
        SELECT r.material_grade, p.company_name, count(*) as c
        FROM public.rfqs r
        JOIN public.profiles p ON r.buyer_id = p.id
        WHERE r.status = 'open'
        GROUP BY r.material_grade, p.company_name
    ),
    ranked_buyers AS (
        SELECT material_grade, company_name, ROW_NUMBER() OVER(PARTITION BY material_grade ORDER BY c DESC) as rn
        FROM top_buyers
    ),
    top_regions AS (
        SELECT material_grade, pickup_area, count(*) as c
        FROM public.rfqs WHERE status = 'open' GROUP BY material_grade, pickup_area
    ),
    ranked_regions AS (
        SELECT material_grade, pickup_area, ROW_NUMBER() OVER(PARTITION BY material_grade ORDER BY c DESC) as rn
        FROM top_regions
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', LOWER(REPLACE(m.material_name, ' ', '_')),
            'label', m.material_name,
            'category', m.category,
            'price', ROUND(COALESCE(vc.vwap_30d, m.admin_price), 2),
            'change', CASE WHEN vc.vwap_30d IS NOT NULL AND vp.vwap_prev IS NOT NULL AND vp.vwap_prev > 0 THEN ROUND(((vc.vwap_30d - vp.vwap_prev) / vp.vwap_prev * 100), 1) || '%' ELSE '0%' END,
            'trend', CASE WHEN vc.vwap_30d > vp.vwap_prev THEN 'up' WHEN vc.vwap_30d < vp.vwap_prev THEN 'down' ELSE 'stable' END,
            'demand', COALESCE(md.demand_level, 'Stable'),
            'supply', COALESCE(ms.supply_level, 'Stable'),
            'topBuyer', COALESCE(tb.company_name, 'Market Buyers'),
            'region', COALESCE(tr.pickup_area, 'Nairobi')
        ) ORDER BY m.material_name ASC
    )
    INTO commodity_trends
    FROM materials m
    LEFT JOIN vwap_current vc ON vc.material_grade = m.material_name
    LEFT JOIN vwap_previous vp ON vp.material_grade = m.material_name
    LEFT JOIN material_demand md ON md.material_grade = m.material_name
    LEFT JOIN material_supply ms ON ms.waste_type = m.category
    LEFT JOIN ranked_buyers tb ON tb.material_grade = m.material_name AND tb.rn = 1
    LEFT JOIN ranked_regions tr ON tr.material_grade = m.material_name AND tr.rn = 1;

    -- =====================================================
    -- 2. OPPORTUNITIES
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'material', r.material_name,
            'tag', CASE WHEN r.rn = 1 THEN 'BEST OPPORTUNITY' WHEN r.rn = 2 THEN 'FAST MOVING' ELSE 'EMERGING TREND' END,
            'tagColor', CASE WHEN r.rn = 1 THEN 'amber' WHEN r.rn = 2 THEN 'blue' ELSE 'purple' END,
            'metricLabel', CASE WHEN r.rn = 1 THEN 'Expected Price' WHEN r.rn = 2 THEN 'Buyer Requests' ELSE 'Price Trend' END,
            'metricValue', CASE WHEN r.rn = 1 THEN 'KSh ' || r.price || ' /kg' WHEN r.rn = 2 THEN r.req_count || ' This Week' ELSE 'Stable' END,
            'change', CASE WHEN r.vwap_change > 0 THEN '+ ' || ROUND(r.vwap_change, 1) || '% vs last week' ELSE 'No change' END,
            'changeType', CASE WHEN r.vwap_change >= 0 THEN 'positive' ELSE 'negative' END,
            'demand', CASE WHEN r.rn = 1 THEN 'High' WHEN r.rn = 2 THEN 'Very High' ELSE 'Growing' END,
            'confidence', 70 + (3 - r.rn) * 8 + (RANDOM() * 5)::int
        )
    )
    INTO opportunities
    FROM (
        WITH mat_stats AS (
            SELECT 
                wc.label as material_name, 
                wc.price_per_kg as price,
                (SELECT count(*) FROM public.rfqs WHERE material_grade = wc.label AND status = 'open') as req_count,
                COALESCE(
                    (SELECT CASE WHEN prev_vwap.vwap > 0 THEN ((cur_vwap.vwap - prev_vwap.vwap) / prev_vwap.vwap * 100) ELSE 0 END
                     FROM (SELECT SUM(COALESCE(fo2.verified_weight, fo2.actual_weight, o2.offered_weight) * o2.offered_price) / NULLIF(SUM(COALESCE(fo2.verified_weight, fo2.actual_weight, o2.offered_weight)), 0) as vwap
                           FROM public.fulfillment_orders fo2 JOIN public.rfq_offers o2 ON fo2.proposal_id = o2.id JOIN public.rfqs r2 ON fo2.rfq_id = r2.id
                           WHERE fo2.status IN ('completed','delivered') AND r2.material_grade = wc.label AND fo2.created_at > now() - interval '30 days') cur_vwap,
                          (SELECT SUM(COALESCE(fo3.verified_weight, fo3.actual_weight, o3.offered_weight) * o3.offered_price) / NULLIF(SUM(COALESCE(fo3.verified_weight, fo3.actual_weight, o3.offered_weight)), 0) as vwap
                           FROM public.fulfillment_orders fo3 JOIN public.rfq_offers o3 ON fo3.proposal_id = o3.id JOIN public.rfqs r3 ON fo3.rfq_id = r3.id
                           WHERE fo3.status IN ('completed','delivered') AND r3.material_grade = wc.label AND fo3.created_at > now() - interval '60 days' AND fo3.created_at <= now() - interval '30 days') prev_vwap
                    ),
                0) as vwap_change
            FROM public.waste_categories wc
            WHERE wc.is_active = true AND wc.parent_category IS NOT NULL
        )
        SELECT *, ROW_NUMBER() OVER(ORDER BY req_count DESC, price DESC) as rn
        FROM mat_stats
        WHERE req_count > 0 OR vwap_change > 0 OR price > 0
        LIMIT 3
    ) r;

    -- =====================================================
    -- 3. REGIONAL HOTSPOTS
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'area', r.area,
            'score', 60 + (r.total_reqs * 5) + (RANDOM() * 10)::int
        )
    )
    INTO hotspots
    FROM (
        SELECT pickup_area as area, count(*) as total_reqs 
        FROM public.rfqs 
        WHERE status = 'open' 
        GROUP BY pickup_area
        ORDER BY total_reqs DESC
        LIMIT 4
    ) r;

    -- =====================================================
    -- 4. MARKET SIGNALS (Hero)
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'text', r.material || ' demand rising',
            'subtext', CASE WHEN r.rn = 1 THEN 'Strong buyer activity' WHEN r.rn = 2 THEN 'High RFQ volume' ELSE 'Trending upwards' END,
            'trend', 'up'
        )
    )
    INTO market_signals
    FROM (
        SELECT label as material, ROW_NUMBER() OVER(ORDER BY price_per_kg DESC) as rn
        FROM public.waste_categories WHERE parent_category IS NOT NULL LIMIT 3
    ) r;

    -- =====================================================
    -- 5. AI RECOMMENDATIONS
    -- =====================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', CASE WHEN r.rn = 1 THEN 'Sell ' || r.material || ' This Week' WHEN r.rn = 2 THEN 'Delay Sales' ELSE 'Focus On ' || r.material END,
            'text', CASE WHEN r.rn = 1 THEN 'Demand is above average. Expected earnings are higher than usual.' WHEN r.rn = 2 THEN 'Prices are expected to improve within 5 days based on market trend.' ELSE 'Highest buyer activity this week with more RFQs coming in.' END,
            'priority', CASE WHEN r.rn = 2 THEN 'Medium Priority' ELSE 'High Priority' END,
            'color', CASE WHEN r.rn = 1 THEN 'emerald' WHEN r.rn = 2 THEN 'amber' ELSE 'purple' END
        )
    )
    INTO recommendations
    FROM (
        SELECT label as material, ROW_NUMBER() OVER(ORDER BY price_per_kg DESC) as rn
        FROM public.waste_categories WHERE parent_category IS NOT NULL LIMIT 3
    ) r;

    -- =====================================================
    -- 6. ACTIONABLE INSIGHTS (Dynamic Intelligence Coach)
    -- All subqueries are self-contained — no cross-section CTE deps.
    -- =====================================================
    WITH
    -- Top demanded material by open RFQ count
    demand_leader AS (
        SELECT material_grade as material, count(*) as rfq_count
        FROM public.rfqs
        WHERE status = 'open' AND created_at > now() - interval '14 days'
        GROUP BY material_grade
        ORDER BY rfq_count DESC
        LIMIT 1
    ),
    -- Region with highest buyer activity
    hot_region AS (
        SELECT pickup_area as region, count(*) as rfq_count
        FROM public.rfqs
        WHERE status = 'open' AND created_at > now() - interval '14 days'
        GROUP BY pickup_area
        ORDER BY rfq_count DESC
        LIMIT 1
    ),
    -- Material with biggest price increase (self-contained VWAP)
    price_mover AS (
        SELECT 
            cur.material_grade as material,
            ROUND(((cur.vwap_30d - prev.vwap_prev) / NULLIF(prev.vwap_prev, 0) * 100), 1) as pct_change
        FROM (
            SELECT r.material_grade, 
                   SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) * o.offered_price) / NULLIF(SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight)), 0) as vwap_30d
            FROM public.fulfillment_orders fo
            JOIN public.rfq_offers o ON fo.proposal_id = o.id
            JOIN public.rfqs r ON fo.rfq_id = r.id
            WHERE fo.status IN ('completed', 'delivered') AND fo.created_at > now() - interval '30 days'
            GROUP BY r.material_grade
        ) cur
        JOIN (
            SELECT r.material_grade, 
                   SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight) * o.offered_price) / NULLIF(SUM(COALESCE(fo.verified_weight, fo.actual_weight, o.offered_weight)), 0) as vwap_prev
            FROM public.fulfillment_orders fo
            JOIN public.rfq_offers o ON fo.proposal_id = o.id
            JOIN public.rfqs r ON fo.rfq_id = r.id
            WHERE fo.status IN ('completed', 'delivered') AND fo.created_at > now() - interval '60 days' AND fo.created_at <= now() - interval '30 days'
            GROUP BY r.material_grade
        ) prev ON cur.material_grade = prev.material_grade
        WHERE prev.vwap_prev > 0 AND cur.vwap_30d > prev.vwap_prev
        ORDER BY pct_change DESC
        LIMIT 1
    ),
    -- Most fulfilled material (quality insight)
    quality_leader AS (
        SELECT r.material_grade as material, count(*) as completed
        FROM public.fulfillment_orders fo
        JOIN public.rfqs r ON fo.rfq_id = r.id
        WHERE fo.status IN ('completed', 'delivered')
          AND fo.created_at > now() - interval '30 days'
        GROUP BY r.material_grade
        ORDER BY completed DESC
        LIMIT 1
    ),
    -- Total open RFQ volume this week vs last week
    market_volume AS (
        SELECT 
            count(*) as total_open,
            count(*) FILTER (WHERE created_at > now() - interval '7 days') as this_week,
            count(*) FILTER (WHERE created_at > now() - interval '14 days' AND created_at <= now() - interval '7 days') as last_week
        FROM public.rfqs
        WHERE status = 'open'
    ),
    -- Highest-value material by admin price
    premium_material AS (
        SELECT label as material, price_per_kg as price
        FROM public.waste_categories
        WHERE is_active = true AND parent_category IS NOT NULL
        ORDER BY price_per_kg DESC
        LIMIT 1
    ),
    -- Supply gap: materials where demand outstrips supply
    supply_gap AS (
        SELECT 
            r.material_grade as material,
            count(DISTINCT r.id) as demand_count,
            count(DISTINCT b.id) as supply_count
        FROM public.rfqs r
        LEFT JOIN public.bookings b ON b.waste_type = (
            SELECT parent_category FROM public.waste_categories WHERE label = r.material_grade LIMIT 1
        ) AND b.status = 'pending'
        WHERE r.status = 'open'
        GROUP BY r.material_grade
        HAVING count(DISTINCT r.id) > count(DISTINCT b.id)
        ORDER BY (count(DISTINCT r.id) - count(DISTINCT b.id)) DESC
        LIMIT 1
    )
    SELECT jsonb_agg(insight ORDER BY priority ASC)
    INTO insights
    FROM (
        -- Insight 1: Demand Alert
        SELECT 
            jsonb_build_object(
                'category', 'Market Alert',
                'title', 'Prioritize ' || dl.material,
                'text', dl.material || ' has ' || dl.rfq_count || ' active buyer requests. Focus your collections on this material for faster sales.',
                'badge', 'High Demand',
                'color', 'rose',
                'iconName', 'bell'
            ) as insight, 1 as priority
        FROM demand_leader dl WHERE dl.rfq_count > 0

        UNION ALL

        -- Insight 2: Regional Opportunity
        SELECT 
            jsonb_build_object(
                'category', 'Regional Opportunity',
                'title', hr.region || ' Is Hot Right Now',
                'text', hr.rfq_count || ' active RFQs in ' || hr.region || '. Route your pickups here to match buyer demand.',
                'badge', 'Hotspot',
                'color', 'indigo',
                'iconName', 'mappin'
            ) as insight, 2 as priority
        FROM hot_region hr WHERE hr.rfq_count > 0

        UNION ALL

        -- Insight 3: Price Movement
        SELECT 
            jsonb_build_object(
                'category', 'Price Movement',
                'title', pm.material || ' Price Up ' || pm.pct_change || '%',
                'text', pm.material || ' prices have risen ' || pm.pct_change || '% compared to last month. Consider selling now while margins are high.',
                'badge', 'Sell Signal',
                'color', 'emerald',
                'iconName', 'trendingup'
            ) as insight, 3 as priority
        FROM price_mover pm

        UNION ALL

        -- Insight 4: Quality Tip
        SELECT 
            jsonb_build_object(
                'category', 'Quality Insight',
                'title', 'Top Performing: ' || ql.material,
                'text', ql.material || ' leads with ' || ql.completed || ' completed trades this month. Sorting and cleaning this material yields the best payouts.',
                'badge', 'Quality Tip',
                'color', 'purple',
                'iconName', 'award'
            ) as insight, 4 as priority
        FROM quality_leader ql

        UNION ALL

        -- Insight 5: Market Timing
        SELECT 
            jsonb_build_object(
                'category', 'Market Timing',
                'title', CASE 
                    WHEN mv.this_week > mv.last_week THEN 'Market Activity Rising'
                    WHEN mv.this_week < mv.last_week THEN 'Market Cooling - Hold Stock'
                    ELSE 'Market Steady This Week'
                END,
                'text', CASE 
                    WHEN mv.this_week > mv.last_week THEN mv.this_week || ' new RFQs this week vs ' || mv.last_week || ' last week. Buyer demand is accelerating.'
                    WHEN mv.this_week < mv.last_week THEN 'Activity dropped to ' || mv.this_week || ' RFQs from ' || mv.last_week || ' last week. Consider holding stock.'
                    ELSE mv.total_open || ' total open requests in the market. Steady activity means predictable pricing.'
                END,
                'badge', CASE 
                    WHEN mv.this_week > mv.last_week THEN 'Act Now'
                    WHEN mv.this_week < mv.last_week THEN 'Hold'
                    ELSE 'Steady'
                END,
                'color', 'amber',
                'iconName', 'clock'
            ) as insight, 5 as priority
        FROM market_volume mv

        UNION ALL

        -- Insight 6: Premium Material
        SELECT 
            jsonb_build_object(
                'category', 'Premium Material',
                'title', 'Top Earner: ' || pm.material,
                'text', pm.material || ' commands KSh ' || ROUND(pm.price, 0) || '/kg - the highest rate on the platform.',
                'badge', 'Best Price',
                'color', 'emerald',
                'iconName', 'trendingup'
            ) as insight, 6 as priority
        FROM premium_material pm

        UNION ALL

        -- Insight 7: Supply Gap
        SELECT 
            jsonb_build_object(
                'category', 'Supply Gap',
                'title', sg.material || ' Undersupplied',
                'text', sg.demand_count || ' buyer requests but only ' || sg.supply_count || ' active collections for ' || sg.material || '. Prime opportunity to source and sell.',
                'badge', 'Opportunity',
                'color', 'indigo',
                'iconName', 'bell'
            ) as insight, 7 as priority
        FROM supply_gap sg
    ) all_insights;


    -- =====================================================
    -- BUILD FINAL JSON
    -- =====================================================
    result := jsonb_build_object(
        'commodity_trends', COALESCE(commodity_trends, '[]'::jsonb),
        'market_signals', COALESCE(market_signals, '[]'::jsonb),
        'opportunities', COALESCE(opportunities, '[]'::jsonb),
        'hotspots', COALESCE(hotspots, '[]'::jsonb),
        'recommendations', COALESCE(recommendations, '[]'::jsonb),
        'insights', COALESCE(insights, '[]'::jsonb)
    );

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_market_intelligence"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_material_distribution"() RETURNS TABLE("name" "text", "value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    waste_type as name,
    sum(actual_weight_kg)::numeric as value
  FROM bookings
  WHERE status = 'completed' AND actual_weight_kg IS NOT NULL
  GROUP BY waste_type
  ORDER BY value DESC
  LIMIT 5;
END;
$$;


ALTER FUNCTION "public"."get_material_distribution"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_fund_requests"("p_owner_id" "uuid") RETURNS TABLE("id" "uuid", "amount" numeric, "reason" "text", "status" "text", "created_at" timestamp with time zone, "driver_name" "text", "driver_avatar" "text", "driver_phone" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id, r.amount, r.reason, r.status, r.created_at,
        p.name::TEXT,
        COALESCE(p.avatar_url, p.avatar)::TEXT,
        p.phone::TEXT
    FROM public.fund_requests r
    JOIN public.profiles p ON r.driver_id = p.id
    WHERE r.company_id = p_owner_id AND r.status = 'pending'
    ORDER BY r.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pending_fund_requests"("p_owner_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_resident_leaderboard"() RETURNS TABLE("user_id" "uuid", "name" "text", "avatar_url" "text", "total_weight" numeric, "rank" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT 
    p.id as user_id,
    p.name,
    p.avatar_url,
    COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) as total_weight,
    RANK() OVER (ORDER BY COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) DESC) as rank
  FROM profiles p
  JOIN bookings b ON b.user_id = p.id
  WHERE p.role IN ('user', 'resident', 'client')
    AND b.status = 'completed'
  GROUP BY p.id, p.name, p.avatar_url
  HAVING COALESCE(SUM(COALESCE(b.actual_weight_kg, b.weight_kg, 0)), 0) > 0
  ORDER BY total_weight DESC
  LIMIT 50;
$$;


ALTER FUNCTION "public"."get_resident_leaderboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_resident_wallet_stats"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'cash_balance', COALESCE(w.cash_balance, 0),
        'available_points', COALESCE(w.available_points, 0),
        'lifetime_cash_earned', COALESCE(w.lifetime_cash_earned, 0),
        'savings_this_month', COALESCE((
            SELECT SUM(amount)
            FROM public.wallet_transactions
            WHERE profile_id = p_user_id
              AND transaction_type = 'payout'
              AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
        ), 0),
        'kg_recovered_this_month', COALESCE((
            SELECT SUM(weight_kg)
            FROM public.bookings
            WHERE user_id = p_user_id
              AND status = 'completed'
              AND date_trunc('month', updated_at) = date_trunc('month', CURRENT_DATE)
        ), 0)
    )
    INTO v_stats
    FROM public.user_wallets w
    WHERE w.user_id = p_user_id;

    RETURN COALESCE(v_stats, jsonb_build_object(
        'cash_balance', 0,
        'available_points', 0,
        'lifetime_cash_earned', 0,
        'savings_this_month', 0,
        'kg_recovered_this_month', 0
    ));
END;
$$;


ALTER FUNCTION "public"."get_resident_wallet_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_revenue_trends"() RETURNS TABLE("month" "text", "revenue" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_char(created_at, 'Mon') as month,
    sum(total_price)::numeric as revenue
  FROM marketplace_orders
  WHERE created_at > now() - interval '6 months'
  GROUP BY to_char(created_at, 'Mon'), date_trunc('month', created_at)
  ORDER BY date_trunc('month', created_at);
END;
$$;


ALTER FUNCTION "public"."get_revenue_trends"() OWNER TO "postgres";


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
$$;


ALTER FUNCTION "public"."get_seller_wallet_stats"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_escrow_payout"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_seller_id UUID;
  v_payout_amount NUMERIC(12,2);
  v_commission_amount NUMERIC(12,2);
  v_gfp_earned INTEGER;
  v_wallet_balance_before INTEGER;
BEGIN
  -- Trigger logic: When status changes to 'completed' or 'funds_released'
  IF (NEW.status IN ('completed', 'funds_released') AND OLD.status NOT IN ('completed', 'funds_released')) THEN
    
    v_seller_id := NEW.seller_id;
    IF v_seller_id IS NULL AND NEW.listing_id IS NOT NULL THEN
      SELECT seller_id INTO v_seller_id FROM public.marketplace_listings WHERE id = NEW.listing_id;
    END IF;

    IF v_seller_id IS NOT NULL THEN
      v_payout_amount := NEW.total_price * 0.90;
      v_commission_amount := NEW.total_price * 0.10;
      v_gfp_earned := FLOOR(COALESCE(NEW.quantity, 0) * 2);

      -- Update the modern wallet (user_wallets)
      INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
      VALUES (v_seller_id, v_payout_amount, v_payout_amount, v_gfp_earned, v_gfp_earned)
      ON CONFLICT (user_id) DO UPDATE 
      SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

      IF v_gfp_earned > 0 THEN
        SELECT available_points - v_gfp_earned INTO v_wallet_balance_before 
        FROM public.user_wallets WHERE user_id = v_seller_id;

        INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
        VALUES (v_seller_id, 'earn', v_gfp_earned, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + v_gfp_earned, 'Earned points from marketplace trade');
      END IF;

      INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
      VALUES (v_seller_id, v_payout_amount, 'payout', NEW.id, jsonb_build_object('role', 'seller', 'type', 'marketplace_trade'));

      INSERT INTO public.notifications (target_user, target_role, type, title, body)
      VALUES (
        v_seller_id, 'all', 'success', 'Payment Received! 💰', 
        'Funds from order ' || NEW.id || ' have been released. You earned KSh ' || ROUND(v_payout_amount, 2) || ' and ' || v_gfp_earned || ' GFP.'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_escrow_payout"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_fleet_invite_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.agent_account_type = 'company_admin' AND NEW.fleet_invite_code IS NULL THEN
    NEW.fleet_invite_code := generate_fleet_code();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_fleet_invite_code"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_fund_request_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only notify if status has changed and is not pending
    IF (OLD.status = 'pending' AND NEW.status != 'pending') THEN
        INSERT INTO public.notifications (
            target_user, 
            target_role, 
            type, 
            title, 
            body
        ) VALUES (
            NEW.driver_id,
            'agent',
            'system',
            CASE 
                WHEN NEW.status = 'approved' THEN '💰 Funds Approved'
                ELSE '❌ Request Declined'
            END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Your request for KSh ' || trim(to_char(NEW.amount, '999,999,999')) || ' has been approved and disbursed to your wallet.'
                ELSE 'Your request for KSh ' || trim(to_char(NEW.amount, '999,999,999')) || ' was declined by the company owner.'
            END
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_fund_request_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_agent_config"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF NEW.role = 'agent' AND NEW.agent_account_type IN ('independent', 'company_admin') THEN
    INSERT INTO public.agent_configurations (agent_id)
    VALUES (NEW.id)
    ON CONFLICT (agent_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_agent_config"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_service_payout"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_agent_id UUID;
  v_payout_amount NUMERIC(10,2);
  v_commission_amount NUMERIC(10,2);
BEGIN
  IF (NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid')) THEN

    v_agent_id := NEW.agent_id;

    IF v_agent_id IS NOT NULL AND COALESCE(NEW.total_price, NEW.fee, 0) > 0 THEN
      v_payout_amount     := COALESCE(NEW.total_price, NEW.fee, 0) * 0.80;
      v_commission_amount := COALESCE(NEW.total_price, NEW.fee, 0) * 0.20;

      -- Credit agent wallet
      UPDATE public.profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + v_payout_amount
      WHERE id = v_agent_id;

      -- Log in ledger using correct column name
      INSERT INTO public.rewards_ledger (
        profile_id, transaction_type, amount_cashback, description
      ) VALUES (
        v_agent_id, 'earning', v_payout_amount,
        'Service fee payout for Pickup #' || NEW.id
      );

      -- Notify agent
      INSERT INTO public.notifications (target_user, target_role, type, title, body)
      VALUES (
        v_agent_id, 'agent', 'success',
        'Payment Received! 🚛',
        'You earned KSh ' || v_payout_amount || ' for pickup #' || NEW.id
      );

      -- Sustainomics bonus for resident (5% back)
      PERFORM public.add_reward_points(
        NEW.user_id,
        (COALESCE(NEW.total_price, NEW.fee, 0) * 0.05)::INTEGER,
        'Recycling Service Bonus'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_service_payout"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hub_deposit_cargo"("p_agent_uuid" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_released_amount DECIMAL;
    v_account_type TEXT;
    v_company_id UUID;
BEGIN
    -- 1. Get the current held balance and driver type
    SELECT held_balance, agent_account_type, company_id 
    INTO v_released_amount, v_account_type, v_company_id 
    FROM profiles WHERE id = p_agent_uuid;

    -- 2. Clear driver's held balance and reset en_route
    UPDATE profiles 
    SET held_balance = 0,
        is_en_route = FALSE
    WHERE id = p_agent_uuid;

    -- 3. Route the released funds
    IF v_account_type = 'fleet_driver' AND v_company_id IS NOT NULL THEN
        -- Route to Company
        UPDATE profiles SET wallet_balance = wallet_balance + v_released_amount WHERE id = v_company_id;
    ELSE
        -- Route to Independent Agent
        UPDATE profiles SET wallet_balance = wallet_balance + v_released_amount WHERE id = p_agent_uuid;
    END IF;

    -- 4. Mark all assets as deposited
    UPDATE assets 
    SET status = 'deposited' 
    WHERE verifier_id = p_agent_uuid AND status = 'verified';

    RETURN v_released_amount;
END;
$$;


ALTER FUNCTION "public"."hub_deposit_cargo"("p_agent_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."on_new_notification_push"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  svc_key TEXT;
BEGIN
  -- Retrieve the service role key from private settings
  SELECT value INTO svc_key FROM private.settings WHERE key = 'service_role_key' LIMIT 1;

  -- We trigger the 'send-push-notification' Edge Function asynchronously
  PERFORM
    net.http_post(
      url := 'https://heqxpcrguaopiimsuqmk.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(svc_key, 'MISSING_KEY')
      ),
      body := jsonb_build_object(
        'notification', row_to_json(NEW),
        'target_user', NEW.target_user,
        'target_role', NEW.target_role
      )
    );

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."on_new_notification_push"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_agent_pure_trade_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agreed_price" numeric, "p_client_gfp" integer) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_actual_agent_id UUID;
    v_booking_status TEXT;
    v_assigned_agent_id UUID;
    v_wallet_points_before INTEGER;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_agent_uuid IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: p_agent_uuid mismatch';
    END IF;

    SELECT agent_id, status INTO v_assigned_agent_id, v_booking_status
    FROM public.bookings
    WHERE id = p_booking_uuid
    FOR UPDATE;

    IF v_booking_status = 'completed' THEN
        RAISE EXCEPTION 'Idempotency: Booking already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent for this booking';
    END IF;

    UPDATE bookings 
    SET status = 'completed', weight_kg = p_weight_kg 
    WHERE id = p_booking_uuid;

    IF p_client_uuid IS NOT NULL THEN
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (p_client_uuid, p_agreed_price, p_agreed_price, p_client_gfp, p_client_gfp)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF p_client_gfp > 0 THEN
            SELECT available_points - p_client_gfp INTO v_wallet_points_before 
            FROM public.user_wallets WHERE user_id = p_client_uuid;

            INSERT INTO public.wallet_ledger (
                user_id, transaction_type, amount, balance_before, balance_after, description
            ) VALUES (
                p_client_uuid, 'earn', p_client_gfp, COALESCE(v_wallet_points_before, 0), COALESCE(v_wallet_points_before, 0) + p_client_gfp, 'Earned points from pure trade'
            );
        END IF;

        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (p_client_uuid, p_agreed_price, 'payout', p_booking_uuid, jsonb_build_object('role', 'seller', 'type', 'pure_trade'));

        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            p_client_uuid, 'user', 'success', 'Trade Payment Received! 💰',
            'You just received KSh ' || ROUND(p_agreed_price, 2) || ' and ' || p_client_gfp || ' GFP for your marketplace trade.'
        );
    END IF;

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."process_agent_pure_trade_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agreed_price" numeric, "p_client_gfp" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_escrow_payout"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_seller_id UUID;
  v_commission NUMERIC;
  v_payout NUMERIC;
BEGIN
  -- Only trigger when status changes to 'funds_released'
  IF NEW.status = 'funds_released' AND (OLD.status IS NULL OR OLD.status != 'funds_released') THEN
    
    -- 1. Get the seller ID from the listing
    SELECT seller_id INTO v_seller_id 
    FROM public.marketplace_listings 
    WHERE id = NEW.listing_id;

    -- 2. Calculate the 90/10 split
    v_commission := NEW.total_price * 0.10;
    v_payout     := NEW.total_price - v_commission;

    -- 3. Update Seller's Wallet (+90%)
    UPDATE public.profiles 
    SET wallet_balance = COALESCE(wallet_balance, 0) + v_payout
    WHERE id = v_seller_id;

    -- 4. Log the transaction for the Weaver
    INSERT INTO public.rewards_ledger (profile_id, amount_cashback, transaction_type, description)
    VALUES (v_seller_id, v_payout, 'earning', 'Marketplace Sale: ' || NEW.material || ' (' || NEW.quantity || 'kg)');

    -- 5. Notify the Weaver
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (v_seller_id, 'business', 'reward', 'Funds Received! 💸', 'KSh ' || v_payout || ' has been released to your wallet for Order #' || LEFT(NEW.id::text, 8));

  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."process_escrow_payout"() OWNER TO "postgres";


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


ALTER FUNCTION "public"."process_point_redemption"("p_type" "text", "p_amount" integer, "p_payout_method" "text", "p_payout_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_point_transfer"("p_recipient_id" "uuid", "p_amount" integer, "p_notes" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_sender_id UUID;
    v_sender_balance INTEGER;
    v_receiver_balance INTEGER;
    v_transfer_id UUID;
    v_ref_number TEXT;
    
    v_min_transfer INTEGER := 10;
    v_max_transfer INTEGER := 50000;
BEGIN
    v_sender_id := auth.uid();
    
    IF v_sender_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_sender_id = p_recipient_id THEN
        RAISE EXCEPTION 'Cannot transfer points to yourself';
    END IF;

    IF p_amount < v_min_transfer OR p_amount > v_max_transfer THEN
        RAISE EXCEPTION 'Transfer amount must be between % and %', v_min_transfer, v_max_transfer;
    END IF;

    -- Ensure receiver wallet exists
    PERFORM 1 FROM public.user_wallets WHERE user_id = p_recipient_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recipient wallet not found';
    END IF;

    -- Ensure receiver is not an agent (<== THIS STRICTLY BLOCKS THE TRANSFER)
    PERFORM 1 FROM public.profiles WHERE id = p_recipient_id AND role = 'agent';
    IF FOUND THEN
        RAISE EXCEPTION 'Cannot transfer points to agents';
    END IF;

    -- Lock sender wallet
    SELECT available_points INTO v_sender_balance 
    FROM public.user_wallets 
    WHERE user_id = v_sender_id 
    FOR UPDATE;

    IF v_sender_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient points available';
    END IF;

    -- Lock receiver wallet
    SELECT available_points INTO v_receiver_balance 
    FROM public.user_wallets 
    WHERE user_id = p_recipient_id 
    FOR UPDATE;

    -- Generate Reference
    v_ref_number := 'KPT-' || upper(substring(md5(random()::text) from 1 for 6));

    -- Insert transfer record
    INSERT INTO public.point_transfers (
        reference_number, sender_id, receiver_id, amount, fee, status, notes, completed_at
    ) VALUES (
        v_ref_number, v_sender_id, p_recipient_id, p_amount, 0, 'completed', p_notes, now()
    ) RETURNING id INTO v_transfer_id;

    -- Update sender wallet
    UPDATE public.user_wallets
    SET available_points = available_points - p_amount,
        lifetime_sent = lifetime_sent + p_amount
    WHERE user_id = v_sender_id;

    -- Insert sender ledger
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        v_sender_id, 'transfer_sent', -p_amount, v_sender_balance, v_sender_balance - p_amount, v_transfer_id, 'Transferred points to ' || p_recipient_id
    );

    -- Update receiver wallet
    UPDATE public.user_wallets
    SET available_points = available_points + p_amount,
        lifetime_received = lifetime_received + p_amount
    WHERE user_id = p_recipient_id;

    -- Insert receiver ledger
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after, reference_id, description
    ) VALUES (
        p_recipient_id, 'transfer_received', p_amount, v_receiver_balance, v_receiver_balance + p_amount, v_transfer_id, 'Received points from ' || v_sender_id
    );

    -- Send notifications (With 'success' type to avoid constraint violation)
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES 
    (v_sender_id, 'user', 'success', 'Transfer Successful', 'You successfully sent ' || p_amount || ' points. Ref: ' || v_ref_number),
    (p_recipient_id, 'user', 'success', 'Points Received!', 'You received ' || p_amount || ' points. Ref: ' || v_ref_number);

    RETURN jsonb_build_object(
        'success', true, 
        'reference_number', v_ref_number, 
        'amount', p_amount, 
        'sender_balance_after', v_sender_balance - p_amount
    );
END;
$$;


ALTER FUNCTION "public"."process_point_transfer"("p_recipient_id" "uuid", "p_amount" integer, "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_rfq_payout"("p_fulfillment_id" "uuid", "p_weight_kg" numeric, "p_grade" "text", "p_contamination" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_actual_agent_id UUID;
    v_order_status TEXT;
    v_seller_id UUID;
    v_proposal_id UUID;
    v_rfq_id UUID;
    v_price_per_kg DECIMAL;
    v_assigned_agent_id UUID;
    v_gfp_earned INTEGER;
    v_wallet_balance_before INTEGER;
    
    v_total_payout DECIMAL;
    v_platform_cut DECIMAL;
    v_net_payout DECIMAL;
    v_buyer_balance NUMERIC;
BEGIN
    v_actual_agent_id := auth.uid();
    IF v_actual_agent_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Lock the fulfillment order
    SELECT status, seller_id, proposal_id, assigned_agent_id, rfq_id
    INTO v_order_status, v_seller_id, v_proposal_id, v_assigned_agent_id, v_rfq_id
    FROM public.fulfillment_orders
    WHERE id = p_fulfillment_id
    FOR UPDATE;

    IF v_order_status = 'completed' THEN
        RAISE EXCEPTION 'Fulfillment already completed';
    END IF;

    IF v_assigned_agent_id IS DISTINCT FROM v_actual_agent_id THEN
        RAISE EXCEPTION 'Unauthorized: Caller is not the assigned agent';
    END IF;

    -- Get agreed price
    SELECT offered_price INTO v_price_per_kg
    FROM public.rfq_offers
    WHERE id = v_proposal_id;

    v_total_payout := p_weight_kg * COALESCE(v_price_per_kg, 0);
    v_platform_cut := v_total_payout * 0.05;
    v_net_payout := v_total_payout - v_platform_cut;
    v_gfp_earned := FLOOR(p_weight_kg * 2);

    -- DEDUCT GROSS FROM BUYER (BUG FIX)
    SELECT cash_balance INTO v_buyer_balance
    FROM public.user_wallets
    WHERE user_id = v_assigned_agent_id
    FOR UPDATE;

    IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_payout THEN
        RAISE EXCEPTION 'Insufficient funds in buyer wallet';
    END IF;

    -- Update Order
    UPDATE public.fulfillment_orders 
    SET status = 'completed',
        verification_status = 'verified',
        payment_status = 'released',
        verified_weight = p_weight_kg,
        quality_grade = p_grade,
        contamination_level = p_contamination,
        updated_at = NOW()
    WHERE id = p_fulfillment_id;

    -- Update RFQ to completed
    IF v_rfq_id IS NOT NULL THEN
        UPDATE public.rfqs
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = v_rfq_id;
    END IF;
    
    UPDATE public.user_wallets SET cash_balance = cash_balance - v_total_payout WHERE user_id = v_assigned_agent_id;

    INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
    VALUES (v_assigned_agent_id, -v_total_payout, 'payout', p_fulfillment_id, jsonb_build_object('role', 'buyer', 'type', 'rfq_buyback'));

    -- Pay seller
    IF v_seller_id IS NOT NULL AND v_total_payout > 0 THEN
        -- Add to user_wallets
        INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned, available_points, lifetime_earned)
        VALUES (v_seller_id, v_net_payout, v_net_payout, v_gfp_earned, v_gfp_earned)
        ON CONFLICT (user_id) DO UPDATE 
        SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
            lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned,
            available_points = user_wallets.available_points + EXCLUDED.available_points,
            lifetime_earned = user_wallets.lifetime_earned + EXCLUDED.lifetime_earned;

        IF v_gfp_earned > 0 THEN
            SELECT available_points - v_gfp_earned INTO v_wallet_balance_before 
            FROM public.user_wallets WHERE user_id = v_seller_id;

            INSERT INTO public.wallet_ledger (user_id, transaction_type, amount, balance_before, balance_after, description)
            VALUES (v_seller_id, 'earn', v_gfp_earned, COALESCE(v_wallet_balance_before, 0), COALESCE(v_wallet_balance_before, 0) + v_gfp_earned, 'Earned points from RFQ completion');
        END IF;

        -- Add transaction
        INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
        VALUES (v_seller_id, v_net_payout, 'payout', p_fulfillment_id, jsonb_build_object('role', 'seller', 'type', 'rfq_buyback'));

        -- Notify Seller
        INSERT INTO public.notifications (target_user, target_role, type, title, body)
        VALUES (
            v_seller_id, 'user', 'success', 'RFQ Payment Received! 💰',
            'You just received KSh ' || ROUND(v_net_payout, 2) || ' and ' || v_gfp_earned || ' GFP for your RFQ delivery.'
        );
    END IF;

    -- RECORD PLATFORM FEE
    IF v_platform_cut > 0 THEN
        INSERT INTO public.platform_treasury (source_type, amount, reference_id)
        VALUES ('rfq_fulfillment', v_platform_cut, p_fulfillment_id);
    END IF;

    RETURN jsonb_build_object('success', true, 'payout', v_net_payout, 'gfp_earned', v_gfp_earned);
END;
$$;


ALTER FUNCTION "public"."process_rfq_payout"("p_fulfillment_id" "uuid", "p_weight_kg" numeric, "p_grade" "text", "p_contamination" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_swarm_payout"("p_order_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_total_payout DECIMAL;
    v_total_pledged DECIMAL;
    v_participant RECORD;
    v_user_share DECIMAL;
    v_wallet_record RECORD;
BEGIN
    -- Get the order
    SELECT * INTO v_order
    FROM public.marketplace_orders
    WHERE id = p_order_id FOR UPDATE;

    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status = 'completed' THEN
        RAISE EXCEPTION 'Order already completed';
    END IF;

    IF v_order.swarm_id IS NULL THEN
        RAISE EXCEPTION 'Not a bulk drive order';
    END IF;

    v_total_payout := v_order.total_price;

    -- Get total pledged weight for this swarm
    SELECT COALESCE(SUM(pledged_weight), 0) INTO v_total_pledged
    FROM public.swarm_participants
    WHERE swarm_id = v_order.swarm_id AND status != 'withdrawn';

    IF v_total_pledged = 0 THEN
        RAISE EXCEPTION 'No pledged weight found for swarm';
    END IF;

    -- Update order status
    UPDATE public.marketplace_orders
    SET status = 'completed', updated_at = NOW()
    WHERE id = p_order_id;

    -- Loop through participants and split the payout
    FOR v_participant IN 
        SELECT user_id, pledged_weight 
        FROM public.swarm_participants 
        WHERE swarm_id = v_order.swarm_id AND status != 'withdrawn'
    LOOP
        -- Calculate proportional share
        v_user_share := (v_participant.pledged_weight / v_total_pledged) * v_total_payout;
        
        IF v_user_share > 0 THEN
            -- Update or insert wallet balance
            INSERT INTO public.user_wallets (user_id, cash_balance, lifetime_cash_earned)
            VALUES (v_participant.user_id, v_user_share, v_user_share)
            ON CONFLICT (user_id) DO UPDATE 
            SET cash_balance = user_wallets.cash_balance + EXCLUDED.cash_balance,
                lifetime_cash_earned = user_wallets.lifetime_cash_earned + EXCLUDED.lifetime_cash_earned;

            -- Create transaction record
            INSERT INTO public.wallet_transactions (profile_id, amount, transaction_type, reference_id, metadata)
            VALUES (v_participant.user_id, v_user_share, 'payout', p_order_id, jsonb_build_object('role', 'seller', 'type', 'swarm_split', 'swarm_id', v_order.swarm_id));

            -- Send notification
            INSERT INTO public.notifications (target_user, target_role, type, title, body)
            VALUES (
                v_participant.user_id, 'user', 'success', 'Bulk Drive Payout! 💰',
                'Your community bulk drive just completed. KSh ' || ROUND(v_user_share, 2) || ' has been added to your wallet for your ' || v_participant.pledged_weight || 'kg contribution.'
            );
        END IF;
    END LOOP;

    -- Update Swarm status to completed
    UPDATE public.swarms
    SET status = 'completed', updated_at = NOW()
    WHERE id = v_order.swarm_id;

    RETURN jsonb_build_object('success', true, 'total_payout', v_total_payout);
END;
$$;


ALTER FUNCTION "public"."process_swarm_payout"("p_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_wallet_topup"("p_amount" numeric, "p_reference_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_new_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Topup amount must be strictly positive';
    END IF;

    -- Idempotency check via constraint will naturally fail if duplicate reference_id is inserted.
    
    -- Lock profile row to prevent race conditions
    PERFORM 1 FROM public.profiles WHERE id = v_user_id FOR UPDATE;

    -- Mutate balance
    UPDATE public.profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + p_amount
    WHERE id = v_user_id
    RETURNING wallet_balance INTO v_new_balance;

    -- Append immutable ledger record
    INSERT INTO public.wallet_transactions (
        profile_id,
        amount,
        transaction_type,
        reference_id,
        metadata
    ) VALUES (
        v_user_id,
        p_amount,
        'topup',
        p_reference_id,
        jsonb_build_object('source', 'user_initiated')
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."process_wallet_topup"("p_amount" numeric, "p_reference_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_wallet_withdrawal"("p_amount" numeric, "p_method" "text" DEFAULT 'M-PESA'::"text", "p_account" "text" DEFAULT ''::"text", "p_reference_id" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Withdrawal amount must be strictly positive';
    END IF;

    -- Lock wallet row
    SELECT cash_balance INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF COALESCE(v_current_balance, 0) < p_amount THEN
        RAISE EXCEPTION 'Insufficient funds for withdrawal';
    END IF;

    -- Mutate balance
    UPDATE public.user_wallets
    SET cash_balance = cash_balance - p_amount,
        lifetime_cash_withdrawn = lifetime_cash_withdrawn + p_amount
    WHERE user_id = v_user_id
    RETURNING cash_balance INTO v_new_balance;

    -- Append immutable ledger record
    INSERT INTO public.wallet_transactions (
        profile_id,
        amount,
        transaction_type,
        reference_id,
        metadata
    ) VALUES (
        v_user_id,
        -p_amount,
        'withdrawal',
        p_reference_id,
        jsonb_build_object(
            'source', 'user_initiated',
            'method', p_method,
            'account', p_account
        )
    );

    RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;


ALTER FUNCTION "public"."process_wallet_withdrawal"("p_amount" numeric, "p_method" "text", "p_account" "text", "p_reference_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."protect_financial_columns"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF current_setting('role') <> 'service_role' THEN
        -- wallet_balance check removed
        IF NEW.reward_points IS DISTINCT FROM OLD.reward_points THEN
            NEW.reward_points := OLD.reward_points;
        END IF;
        IF NEW.held_balance IS DISTINCT FROM OLD.held_balance THEN
            NEW.held_balance := OLD.held_balance;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_financial_columns"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refund_failed_redemption"("p_redemption_id" "uuid", "p_reason" "text" DEFAULT 'Provider payout failed'::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_redemption RECORD;
    v_current_balance INTEGER;
BEGIN
    -- ── GET REDEMPTION AND LOCK ──
    SELECT * INTO v_redemption
    FROM public.point_redemptions
    WHERE id = p_redemption_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Redemption not found';
    END IF;

    IF v_redemption.status NOT IN ('processing', 'pending') THEN
        RAISE EXCEPTION 'Redemption cannot be refunded. Current status: %', v_redemption.status;
    END IF;

    -- ── LOCK WALLET ──
    SELECT available_points INTO v_current_balance
    FROM public.user_wallets
    WHERE user_id = v_redemption.user_id
    FOR UPDATE;

    -- ── RE-CREDIT WALLET ──
    UPDATE public.user_wallets
    SET available_points = available_points + v_redemption.amount,
        lifetime_redeemed = GREATEST(COALESCE(lifetime_redeemed, 0) - v_redemption.amount, 0)
    WHERE user_id = v_redemption.user_id;

    -- ── WRITE REFUND LEDGER ──
    INSERT INTO public.wallet_ledger (
        user_id, transaction_type, amount, balance_before, balance_after,
        reference_id, description
    ) VALUES (
        v_redemption.user_id, 'refund', v_redemption.amount,
        v_current_balance, v_current_balance + v_redemption.amount,
        v_redemption.id,
        'Refund for failed redemption ' || v_redemption.reference_number || ': ' || p_reason
    );

    -- ── UPDATE REDEMPTION STATUS ──
    UPDATE public.point_redemptions
    SET status = 'failed',
        failure_reason = p_reason,
        completed_at = now()
    WHERE id = p_redemption_id;

    -- ── NOTIFY USER ──
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES (
        v_redemption.user_id, 'user', 'warning',
        'Redemption Failed — Points Refunded',
        'Your redemption of ' || v_redemption.amount || ' GFP (Ref: ' || v_redemption.reference_number || ') failed. Points have been refunded to your wallet.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'refunded_amount', v_redemption.amount,
        'new_balance', v_current_balance + v_redemption.amount
    );
END;
$$;


ALTER FUNCTION "public"."refund_failed_redemption"("p_redemption_id" "uuid", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reject_fleet_driver_request"("p_request_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.company_join_requests
    SET status = 'rejected'
    WHERE id = p_request_id AND company_id = auth.uid() AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Request not found or not authorized';
    END IF;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."reject_fleet_driver_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_wallet_recipient"("p_search_query" "text") RETURNS TABLE("user_id" "uuid", "full_name" "text", "phone" "text", "klinflow_id" "text", "avatar" "text", "account_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.name, 
        p.phone, 
        p.klinflow_id, 
        p.avatar_url, 
        p.role
    FROM public.profiles p
    WHERE (p.phone = p_search_query OR p.klinflow_id = p_search_query)
    AND p.id != auth.uid() 
    AND p.role != 'agent'  -- <== THIS EXCLUDES AGENTS
    LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."search_wallet_recipient"("p_search_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_counter_offer"("p_booking_id" "uuid", "p_new_amount" numeric) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.bookings
    SET status = 'counter_offer_pending',
        counter_offer_amount = p_new_amount,
        counter_offer_status = 'pending'
    WHERE id = p_booking_id;
    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."submit_counter_offer"("p_booking_id" "uuid", "p_new_amount" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_agent_pickup_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_company_id UUID;
BEGIN
    UPDATE public.profiles
    SET total_pickups = (
        SELECT COUNT(*) FROM public.bookings
        WHERE agent_id = NEW.agent_id AND status = 'completed'
    )
    WHERE id = NEW.agent_id;

    SELECT company_id INTO v_company_id FROM public.profiles WHERE id = NEW.agent_id;

    IF v_company_id IS NOT NULL THEN
        UPDATE public.profiles
        SET total_pickups = (
            SELECT COUNT(*) FROM public.bookings b
            JOIN public.profiles p ON b.agent_id = p.id
            WHERE (p.company_id = v_company_id OR p.id = v_company_id)
              AND b.status = 'completed'
        )
        WHERE id = v_company_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_agent_pickup_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_agent_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_avg_rating NUMERIC;
    v_company_id UUID;
    v_company_avg NUMERIC;
BEGIN
    -- 1. Recalculate and update the individual Agent's rating
    SELECT ROUND(AVG(agent_rating::NUMERIC), 1)
    INTO v_avg_rating
    FROM public.bookings
    WHERE agent_id = NEW.agent_id
      AND agent_rating IS NOT NULL;

    UPDATE public.profiles
    SET rating = COALESCE(v_avg_rating, 0)
    WHERE id = NEW.agent_id;

    -- 2. Check if this agent is a fleet driver and belongs to a company
    SELECT company_id INTO v_company_id 
    FROM public.profiles 
    WHERE id = NEW.agent_id AND agent_account_type = 'fleet_driver';

    -- 3. If they belong to a company, recalculate the entire Company's fleet rating
    IF v_company_id IS NOT NULL THEN
        SELECT ROUND(AVG(b.agent_rating::NUMERIC), 1)
        INTO v_company_avg
        FROM public.bookings b
        JOIN public.profiles d ON b.agent_id = d.id
        WHERE d.company_id = v_company_id
          AND b.agent_rating IS NOT NULL;

        UPDATE public.profiles
        SET rating = COALESCE(v_company_avg, 0)
        WHERE id = v_company_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_agent_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_klinflow_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.klinflow_id IS NULL THEN
        NEW.klinflow_id := public.generate_klinflow_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_klinflow_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_agent_average_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.profiles
    SET rating = (
        SELECT ROUND(AVG(agent_rating::NUMERIC), 1)
        FROM public.bookings
        WHERE agent_id = NEW.agent_id
          AND agent_rating IS NOT NULL
    )
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_agent_average_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_company_join_requests_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_company_join_requests_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_goal_weight"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.collective_goals
    SET current_weight = (
        SELECT COALESCE(SUM(pledged_weight), 0)
        FROM public.goal_participants
        WHERE goal_id = NEW.goal_id AND status != 'withdrawn'
    )
    WHERE id = NEW.goal_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_goal_weight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_marketplace_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_marketplace_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profile_lifetime_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_agent_commission NUMERIC := 0.80; -- Default 80% payout
BEGIN
  -- 1. Update Resident Stats (Impact)
  IF (NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed')) THEN
    UPDATE public.profiles
    SET 
      lifetime_pickups = COALESCE(lifetime_pickups, 0) + 1,
      lifetime_recovered_kg = COALESCE(lifetime_recovered_kg, 0) + COALESCE(NEW.actual_weight_kg, NEW.weight_kg, NEW.bags, 0)
    WHERE id = NEW.user_id;

    -- 2. Update Agent Stats (Revenue)
    IF NEW.agent_id IS NOT NULL THEN
      UPDATE public.profiles
      SET 
        lifetime_revenue = COALESCE(lifetime_revenue, 0) + (COALESCE(NEW.fee, 0) * v_agent_commission)
      WHERE id = NEW.agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profile_lifetime_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_swarm_weight"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.swarms
    SET current_weight = (
        SELECT COALESCE(SUM(pledged_weight), 0)
        FROM public.swarm_participants
        WHERE swarm_id = NEW.swarm_id AND status != 'withdrawn'
    )
    WHERE id = NEW.swarm_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_swarm_weight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_wallets_modtime"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_wallets_modtime"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."weaver_claim_asset"("p_asset_id" "uuid", "p_weaver_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_actual_caller_id UUID;
    v_asset_status TEXT;
BEGIN
    v_actual_caller_id := auth.uid();
    IF v_actual_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_weaver_id IS DISTINCT FROM v_actual_caller_id THEN
        RAISE EXCEPTION 'Unauthorized: weaver mismatch';
    END IF;

    -- Lock asset row
    SELECT status INTO v_asset_status
    FROM public.assets
    WHERE id = p_asset_id
    FOR UPDATE;

    IF v_asset_status = 'claimed' THEN
        RAISE EXCEPTION 'Idempotency: Asset already claimed';
    END IF;

    UPDATE public.assets
    SET status = 'claimed', weaver_id = p_weaver_id, updated_at = now()
    WHERE id = p_asset_id;

    RETURN 'success';
END;
$$;


ALTER FUNCTION "public"."weaver_claim_asset"("p_asset_id" "uuid", "p_weaver_id" "uuid") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "private"."settings" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL
);


ALTER TABLE "private"."settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_actions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "trigger_type" "text" NOT NULL,
    "user_id" "uuid",
    "payload" "jsonb",
    "decision" "text",
    "actions" "jsonb",
    "tools_called" "text"[],
    "success" boolean DEFAULT true,
    "duration_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_actions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agent_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "cashback_percentage" numeric(5,2) DEFAULT 10.00,
    "accepted_materials" "jsonb" DEFAULT '[]'::"jsonb",
    "custom_rates" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "service_scale" "text" DEFAULT 'standard'::"text",
    "base_logistics_fee" numeric(10,2) DEFAULT 200.00
);


ALTER TABLE "public"."agent_configurations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_reviews" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "phone" "text",
    "rating" integer NOT NULL,
    "category" "text" NOT NULL,
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "source_app" "text" DEFAULT 'client'::"text",
    CONSTRAINT "app_reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."app_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "booking_id" "uuid",
    "verifier_id" "uuid",
    "weaver_id" "uuid",
    "material_type" "text" NOT NULL,
    "grade" "text" DEFAULT 'B'::"text",
    "weight_kg" numeric(10,2) NOT NULL,
    "estimated_value" numeric(10,2) NOT NULL,
    "purity_score" integer DEFAULT 85,
    "status" "text" DEFAULT 'verified'::"text",
    "source" "text" DEFAULT 'verified'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "matched_at" timestamp with time zone,
    "is_manual" boolean DEFAULT false,
    "photo_url" "text",
    "hub_manager_id" "uuid",
    "digital_batch_id" "text",
    "metadata" "jsonb",
    CONSTRAINT "assets_status_check" CHECK (("status" = ANY (ARRAY['verified'::"text", 'transferred_to_hub'::"text", 'listed'::"text", 'escrow'::"text", 'sold'::"text", 'processed'::"text", 'delivered'::"text"])))
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_join_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "experience_years" integer DEFAULT 0,
    "application_score" integer DEFAULT 0,
    "documents_complete" integer DEFAULT 0,
    "documents_required" integer DEFAULT 6,
    "references_verified" integer DEFAULT 0,
    "references_total" integer DEFAULT 3,
    "admin_notes" "text",
    "submitted_documents" "jsonb" DEFAULT '{}'::"jsonb",
    CONSTRAINT "company_join_requests_application_score_check" CHECK ((("application_score" >= 0) AND ("application_score" <= 100))),
    CONSTRAINT "company_join_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."company_join_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fulfillment_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "assignment_status" "text" DEFAULT 'pending'::"text",
    "dispatch_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "delivery_assignments_assignment_status_check" CHECK (("assignment_status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'reassigned'::"text"])))
);


ALTER TABLE "public"."delivery_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fulfillment_id" "uuid",
    "raised_by" "uuid" NOT NULL,
    "dispute_type" "text" NOT NULL,
    "evidence_photos" "text"[] DEFAULT '{}'::"text"[],
    "description" "text",
    "status" "text" DEFAULT 'open'::"text",
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "booking_id" "uuid",
    CONSTRAINT "disputes_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'investigating'::"text", 'resolved'::"text"])))
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."estates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "location" "text",
    "latitude" double precision,
    "longitude" double precision,
    "total_units" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."estates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fulfillment_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rfq_id" "uuid" NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "assigned_agent_id" "uuid",
    "organization_id" "uuid",
    "delivery_method" "public"."delivery_method_enum" NOT NULL,
    "pickup_address" "text",
    "dropoff_address" "text",
    "scheduled_date" "date",
    "scheduled_time" time without time zone,
    "estimated_arrival" timestamp with time zone,
    "status" "public"."fulfillment_status_enum" DEFAULT 'pending_coordination'::"public"."fulfillment_status_enum",
    "verification_code" character varying(6) NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "verification_status" "text" DEFAULT 'pending'::"text",
    "actual_weight" numeric,
    "verified_weight" numeric,
    "quality_grade" "text",
    "contamination_level" numeric,
    "completion_notes" "text",
    "cancellation_reason" "text",
    "dispute_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fulfillment_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fulfillment_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fulfillment_id" "uuid" NOT NULL,
    "status" "public"."fulfillment_status_enum" NOT NULL,
    "actor_id" "uuid" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fulfillment_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fund_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "company_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "reason" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "fund_requests_amount_check" CHECK (("amount" > (0)::numeric)),
    CONSTRAINT "fund_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."fund_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hub_settings" (
    "hub_id" "uuid" NOT NULL,
    "address" "text",
    "contact_email" "text",
    "contact_phone" "text",
    "capacity_kg" numeric DEFAULT 5000,
    "operating_hours" "text" DEFAULT 'Mon - Sat: 08:00 - 18:00'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hub_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hygenex_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text",
    "text" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "hygenex_messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'ai'::"text"])))
);


ALTER TABLE "public"."hygenex_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hyginex_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."hyginex_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."listings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "supplier_id" "uuid",
    "material_type" "text" NOT NULL,
    "estimated_weight" numeric NOT NULL,
    "price_per_kg" numeric DEFAULT 0,
    "status" "text" DEFAULT 'available'::"text",
    "location" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_listings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "seller_id" "uuid",
    "material" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "price_per_kg" numeric(10,2) NOT NULL,
    "location" "text",
    "photo_url" "text",
    "description" "text",
    "grade" "text",
    "unit" "text" DEFAULT 'KG'::"text",
    "moq" numeric(10,2) DEFAULT 1.00,
    "ai_match_score" integer DEFAULT 0,
    "status" "text" DEFAULT 'active'::"text",
    "views" integer DEFAULT 0,
    "offers" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "latitude" double precision,
    "longitude" double precision,
    "h3_index" "text",
    "swarm_id" "uuid",
    "is_bulk_drive" boolean DEFAULT false,
    "group_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "material_category" "text",
    "material_subcategory" "text",
    CONSTRAINT "marketplace_listings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'pending'::"text", 'sold'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."marketplace_listings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_offers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "listing_id" "uuid",
    "buyer_id" "uuid",
    "seller_id" "uuid",
    "offered_price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "marketplace_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'countered'::"text"])))
);


ALTER TABLE "public"."marketplace_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."marketplace_orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "listing_id" "uuid",
    "buyer_id" "uuid",
    "material" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(10,2) NOT NULL,
    "status" "text" DEFAULT 'waiting'::"text",
    "booking_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "asset_id" "uuid",
    "order_type" "text" DEFAULT 'b2b'::"text",
    "message" "text",
    "seller_id" "uuid",
    "swarm_id" "uuid",
    CONSTRAINT "marketplace_orders_order_type_check" CHECK (("order_type" = ANY (ARRAY['b2b'::"text", 'agent_claim'::"text"]))),
    CONSTRAINT "marketplace_orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'waiting'::"text", 'processing'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'held_in_escrow'::"text", 'funds_released'::"text", 'disputed'::"text"])))
);


ALTER TABLE "public"."marketplace_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fulfillment_id" "uuid" NOT NULL,
    "submitted_weight" numeric NOT NULL,
    "verified_weight" numeric NOT NULL,
    "quality_grade" "text" NOT NULL,
    "contamination_level" numeric NOT NULL,
    "photos" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "verified_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."material_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nema_reports" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_type" "text" NOT NULL,
    "estates" "text"[],
    "report_data" "jsonb" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text",
    "triggered_by" "text" DEFAULT 'system'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "nema_reports_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'final'::"text", 'submitted'::"text"])))
);


ALTER TABLE "public"."nema_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "target_role" "text",
    "target_user" "uuid",
    "type" "text" DEFAULT 'info'::"text",
    "title" "text" NOT NULL,
    "body" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_target_role_check" CHECK (("target_role" = ANY (ARRAY['client'::"text", 'agent'::"text", 'admin'::"text", 'business'::"text", 'user'::"text", 'hub'::"text", 'all'::"text", 'seller'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['success'::"text", 'warning'::"text", 'reward'::"text", 'info'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "listing_id" "uuid",
    "buyer_id" "uuid",
    "agent_id" "uuid",
    "total_amount" numeric NOT NULL,
    "escrow_status" "text" DEFAULT 'pending'::"text",
    "delivery_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."otp_verifications" (
    "phone" "text" NOT NULL,
    "otp_code" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."otp_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."otp_verifications" IS 'Temporary storage for 6-digit phone verification codes.';



CREATE TABLE IF NOT EXISTS "public"."point_redemptions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reference_number" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "fee" integer DEFAULT 0 NOT NULL,
    "net_amount" integer NOT NULL,
    "kes_equivalent" numeric(12,2) NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payout_method" "text" NOT NULL,
    "payout_details" "jsonb" DEFAULT '{}'::"jsonb",
    "provider_reference" "text",
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "point_redemptions_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "point_redemptions_fee_check" CHECK (("fee" >= 0)),
    CONSTRAINT "point_redemptions_net_amount_check" CHECK (("net_amount" > 0)),
    CONSTRAINT "point_redemptions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'rejected'::"text"]))),
    CONSTRAINT "point_redemptions_type_check" CHECK (("type" = ANY (ARRAY['money'::"text", 'airtime'::"text", 'voucher'::"text"])))
);


ALTER TABLE "public"."point_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."point_transfers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "reference_number" "text" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "amount" integer NOT NULL,
    "fee" integer DEFAULT 0 NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "point_transfers_amount_check" CHECK (("amount" > 0)),
    CONSTRAINT "point_transfers_fee_check" CHECK (("fee" >= 0)),
    CONSTRAINT "point_transfers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."point_transfers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "role" "text" NOT NULL,
    "avatar" "text" DEFAULT '👤'::"text",
    "location" "jsonb" DEFAULT '{"estate": "Nairobi", "latitude": null, "longitude": null}'::"jsonb",
    "id_number" "text",
    "reward_points" integer DEFAULT 0,
    "subscription_tier" "text" DEFAULT 'lite'::"text",
    "is_verified" boolean DEFAULT false,
    "business_type" "text",
    "nema_license" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_online" boolean DEFAULT false,
    "rating" numeric(3,2) DEFAULT 5.00,
    "business_name" "text",
    "specializations" "text"[] DEFAULT '{}'::"text"[],
    "completed_cleared_at" timestamp with time zone,
    "cancelled_cleared_at" timestamp with time zone,
    "is_staff" boolean DEFAULT false,
    "fleet_id" "text",
    "notes" "text",
    "completedClearedAt" timestamp with time zone,
    "is_en_route" boolean DEFAULT false,
    "held_balance" numeric(12,2) DEFAULT 0.00,
    "pending_escrow_balance" numeric DEFAULT 0,
    "agent_role" "text" DEFAULT 'freelancer'::"text",
    "gfp_balance" integer DEFAULT 0,
    "client_role" "text" DEFAULT 'resident'::"text",
    "agent_account_type" "text" DEFAULT 'independent'::"text",
    "company_id" "uuid",
    "fleet_invite_code" "text",
    "company_name" "text",
    "gender" "text",
    "avatar_url" "text",
    "hub_transfer_pin" "text",
    "hub_config" "jsonb" DEFAULT '{}'::"jsonb",
    "service_profile" "jsonb" DEFAULT '{"categories": [{"sub": ["PET", "HDPE"], "name": "Plastic", "enabled": true, "base_rate": 15}, {"sub": ["Cardboard", "Office"], "name": "Paper", "enabled": true, "base_rate": 10}, {"sub": ["Aluminium", "Steel"], "name": "Metal", "enabled": true, "base_rate": 25}], "max_weight": 50, "min_weight": 2}'::"jsonb",
    "lifetime_revenue" numeric DEFAULT 0,
    "lifetime_pickups" integer DEFAULT 0,
    "lifetime_recovered_kg" numeric DEFAULT 0,
    "total_pickups" integer DEFAULT 0,
    "is_hub_active" boolean DEFAULT false,
    "hub_address" "text",
    "hub_location" "jsonb",
    "email" "text",
    "estate" "text",
    "klinflow_id" "text",
    "required_documents" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "check_gender_values" CHECK (("gender" = ANY (ARRAY['male'::"text", 'female'::"text", 'other'::"text", 'prefer_not_to_say'::"text"]))),
    CONSTRAINT "check_positive_held_balance" CHECK (("held_balance" >= (0)::numeric)),
    CONSTRAINT "profiles_agent_account_type_check" CHECK (("agent_account_type" = ANY (ARRAY['independent'::"text", 'company_admin'::"text", 'fleet_driver'::"text"]))),
    CONSTRAINT "profiles_client_role_check" CHECK (("client_role" = ANY (ARRAY['resident'::"text", 'seller'::"text"]))),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'resident'::"text", 'agent'::"text", 'business'::"text", 'admin'::"text", 'seller'::"text"]))),
    CONSTRAINT "profiles_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['lite'::"text", 'standard'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."service_profile" IS 'Stores agent/company specific operational limits and category capabilities for the marketplace matching engine.';



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "p256dh" "text" NOT NULL,
    "auth" "text" NOT NULL,
    "device_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_used_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rewards_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "booking_id" "uuid",
    "amount_cashback" numeric(10,2) DEFAULT 0.00,
    "amount_points" integer DEFAULT 0,
    "transaction_type" "text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "amount" numeric(12,2) DEFAULT 0
);


ALTER TABLE "public"."rewards_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfq_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "rfq_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "offered_weight" numeric NOT NULL,
    "offered_price" numeric NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "earliest_shipping_date" timestamp with time zone,
    CONSTRAINT "rfq_offers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."rfq_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "buyer_type" "text",
    "category" "text" NOT NULL,
    "material_grade" "text" NOT NULL,
    "requested_weight" numeric NOT NULL,
    "weight_unit" "text" DEFAULT 'kg'::"text",
    "target_price" numeric,
    "pickup_area" "text" NOT NULL,
    "images" "text"[] DEFAULT '{}'::"text"[],
    "notes" "text",
    "deadline" timestamp with time zone,
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "delivery_method" "text" DEFAULT 'flexible'::"text",
    "is_group_collection" boolean DEFAULT false,
    CONSTRAINT "rfqs_buyer_type_check" CHECK (("buyer_type" = ANY (ARRAY['agent'::"text", 'company'::"text", 'fleet'::"text"]))),
    CONSTRAINT "rfqs_delivery_method_check" CHECK (("delivery_method" = ANY (ARRAY['agent_pickup'::"text", 'self_drop'::"text", 'flexible'::"text"]))),
    CONSTRAINT "rfqs_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'fulfilled'::"text", 'completed'::"text", 'closed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."rfqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."swarm_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "swarm_id" "uuid",
    "user_id" "uuid" NOT NULL,
    "pledged_weight" numeric DEFAULT 0 NOT NULL,
    "actual_weight" numeric DEFAULT 0,
    "status" "text" DEFAULT 'pledged'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "material" "text",
    "description" "text",
    "images" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "swarm_participants_status_check" CHECK (("status" = ANY (ARRAY['pledged'::"text", 'fulfilled'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."swarm_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."swarms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "estate" "text" NOT NULL,
    "material" "text" NOT NULL,
    "target_weight" numeric DEFAULT 0 NOT NULL,
    "current_weight" numeric DEFAULT 0 NOT NULL,
    "closes_at" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "images" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "swarms_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."swarms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_config" (
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "value" numeric DEFAULT 0 NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "text" NOT NULL,
    "value" "jsonb" NOT NULL,
    "description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "available_points" integer DEFAULT 0 NOT NULL,
    "lifetime_earned" integer DEFAULT 0 NOT NULL,
    "lifetime_redeemed" integer DEFAULT 0 NOT NULL,
    "lifetime_sent" integer DEFAULT 0 NOT NULL,
    "lifetime_received" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cash_balance" numeric(12,2) DEFAULT 0.00,
    "lifetime_cash_earned" numeric(12,2) DEFAULT 0.00,
    "lifetime_cash_withdrawn" numeric(12,2) DEFAULT 0.00,
    CONSTRAINT "check_positive_available_points" CHECK (("available_points" >= 0))
);


ALTER TABLE "public"."user_wallets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "transaction_type" "text" NOT NULL,
    "reference_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallet_transactions_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['topup'::"text", 'withdrawal'::"text", 'payout'::"text", 'escrow_release'::"text", 'refund'::"text", 'cashback'::"text"])))
);


ALTER TABLE "public"."wallet_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_balance_drift_audit" AS
 WITH "ledger_sums" AS (
         SELECT "rewards_ledger"."profile_id",
            "sum"("rewards_ledger"."amount_cashback") AS "total_from_rewards"
           FROM "public"."rewards_ledger"
          GROUP BY "rewards_ledger"."profile_id"
        ), "wallet_tx_sums" AS (
         SELECT "wallet_transactions"."profile_id",
            "sum"("wallet_transactions"."amount") AS "total_from_wallet_tx"
           FROM "public"."wallet_transactions"
          GROUP BY "wallet_transactions"."profile_id"
        ), "combined_ledger" AS (
         SELECT "w"."user_id" AS "profile_id",
            "p"."name",
            "w"."cash_balance" AS "current_balance",
            (COALESCE("rl"."total_from_rewards", (0)::numeric) + COALESCE("wt"."total_from_wallet_tx", (0)::numeric)) AS "calculated_balance"
           FROM ((("public"."user_wallets" "w"
             JOIN "public"."profiles" "p" ON (("p"."id" = "w"."user_id")))
             LEFT JOIN "ledger_sums" "rl" ON (("w"."user_id" = "rl"."profile_id")))
             LEFT JOIN "wallet_tx_sums" "wt" ON (("w"."user_id" = "wt"."profile_id")))
        )
 SELECT "profile_id",
    "name",
    "current_balance",
    "calculated_balance",
    ("current_balance" - "calculated_balance") AS "drift_amount"
   FROM "combined_ledger"
  WHERE ("abs"(("current_balance" - "calculated_balance")) > 0.01);


ALTER VIEW "public"."vw_balance_drift_audit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wallet_ledger" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" integer NOT NULL,
    "balance_before" integer NOT NULL,
    "balance_after" integer NOT NULL,
    "reference_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "wallet_ledger_transaction_type_check" CHECK (("transaction_type" = ANY (ARRAY['earn'::"text", 'redeem'::"text", 'transfer_sent'::"text", 'transfer_received'::"text", 'adjustment'::"text", 'bonus'::"text", 'migration'::"text", 'redeem_money'::"text", 'redeem_airtime'::"text", 'redeem_voucher'::"text", 'refund'::"text"])))
);


ALTER TABLE "public"."wallet_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waste_categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "label" "text" NOT NULL,
    "icon" "text",
    "unit" "text" DEFAULT 'kg'::"text",
    "price_per_unit" numeric(10,2) NOT NULL,
    "parent_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "description" "text" DEFAULT ''::"text",
    "price_per_kg" numeric DEFAULT 0,
    "image_url" "text",
    "parent_category" "text",
    "demand" "text" DEFAULT 'Stable'::"text",
    "supply" "text" DEFAULT 'Stable'::"text",
    "change_ksh" numeric DEFAULT 0.00,
    "change_pct" numeric DEFAULT 0.0,
    "top_buyer" "text"
);


ALTER TABLE "public"."waste_categories" OWNER TO "postgres";


ALTER TABLE ONLY "private"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."agent_actions"
    ADD CONSTRAINT "agent_actions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agent_configurations"
    ADD CONSTRAINT "agent_configurations_agent_id_key" UNIQUE ("agent_id");



ALTER TABLE ONLY "public"."agent_configurations"
    ADD CONSTRAINT "agent_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_reviews"
    ADD CONSTRAINT "app_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_join_requests"
    ADD CONSTRAINT "company_join_requests_driver_id_company_id_key" UNIQUE ("driver_id", "company_id");



ALTER TABLE ONLY "public"."company_join_requests"
    ADD CONSTRAINT "company_join_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."estates"
    ADD CONSTRAINT "estates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fulfillment_status_history"
    ADD CONSTRAINT "fulfillment_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fund_requests"
    ADD CONSTRAINT "fund_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hub_settings"
    ADD CONSTRAINT "hub_settings_pkey" PRIMARY KEY ("hub_id");



ALTER TABLE ONLY "public"."hygenex_messages"
    ADD CONSTRAINT "hygenex_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hyginex_messages"
    ADD CONSTRAINT "hyginex_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_offers"
    ADD CONSTRAINT "marketplace_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_verifications"
    ADD CONSTRAINT "material_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nema_reports"
    ADD CONSTRAINT "nema_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."otp_verifications"
    ADD CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("phone");



ALTER TABLE ONLY "public"."point_redemptions"
    ADD CONSTRAINT "point_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_redemptions"
    ADD CONSTRAINT "point_redemptions_reference_number_key" UNIQUE ("reference_number");



ALTER TABLE ONLY "public"."point_transfers"
    ADD CONSTRAINT "point_transfers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."point_transfers"
    ADD CONSTRAINT "point_transfers_reference_number_key" UNIQUE ("reference_number");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_fleet_invite_code_key" UNIQUE ("fleet_invite_code");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_klinflow_id_key" UNIQUE ("klinflow_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_endpoint_key" UNIQUE ("endpoint");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rewards_ledger"
    ADD CONSTRAINT "rewards_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfq_offers"
    ADD CONSTRAINT "rfq_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."swarm_participants"
    ADD CONSTRAINT "swarm_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."swarm_participants"
    ADD CONSTRAINT "swarm_participants_swarm_id_user_id_key" UNIQUE ("swarm_id", "user_id");



ALTER TABLE ONLY "public"."swarms"
    ADD CONSTRAINT "swarms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_config"
    ADD CONSTRAINT "system_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."wallet_ledger"
    ADD CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waste_categories"
    ADD CONSTRAINT "waste_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waste_categories"
    ADD CONSTRAINT "waste_categories_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_bookings_h3" ON "public"."bookings" USING "btree" ("h3_index");



CREATE INDEX "idx_bookings_listing_id" ON "public"."bookings" USING "btree" ("listing_id");



CREATE INDEX "idx_bookings_pending_waste" ON "public"."bookings" USING "btree" ("waste_type") WHERE ("status" = 'pending'::"text");



CREATE INDEX "idx_bookings_status_waste" ON "public"."bookings" USING "btree" ("status", "waste_type");



CREATE INDEX "idx_fulfillment_orders_buyer" ON "public"."fulfillment_orders" USING "btree" ("buyer_id");



CREATE INDEX "idx_fulfillment_orders_rfq" ON "public"."fulfillment_orders" USING "btree" ("rfq_id");



CREATE INDEX "idx_marketplace_listings_h3" ON "public"."marketplace_listings" USING "btree" ("h3_index");



CREATE INDEX "idx_otp_expires" ON "public"."otp_verifications" USING "btree" ("expires_at");



CREATE INDEX "idx_point_redemptions_created_at" ON "public"."point_redemptions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_point_redemptions_reference" ON "public"."point_redemptions" USING "btree" ("reference_number");



CREATE INDEX "idx_point_redemptions_status" ON "public"."point_redemptions" USING "btree" ("status");



CREATE INDEX "idx_point_redemptions_user_id" ON "public"."point_redemptions" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_company_name" ON "public"."profiles" USING "btree" ("company_name") WHERE ("company_name" IS NOT NULL);



CREATE INDEX "idx_profiles_id" ON "public"."profiles" USING "btree" ("id");



CREATE INDEX "idx_profiles_service_profile" ON "public"."profiles" USING "gin" ("service_profile");



CREATE INDEX "idx_rfqs_created_at" ON "public"."rfqs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_rfqs_is_group_collection" ON "public"."rfqs" USING "btree" ("is_group_collection");



CREATE INDEX "idx_rfqs_material_pickup" ON "public"."rfqs" USING "btree" ("material_grade", "pickup_area");



CREATE INDEX "idx_rfqs_open_material" ON "public"."rfqs" USING "btree" ("material_grade") WHERE ("status" = 'open'::"text");



CREATE INDEX "idx_rfqs_status_category" ON "public"."rfqs" USING "btree" ("status", "category");



CREATE UNIQUE INDEX "idx_wallet_tx_idempotency" ON "public"."wallet_transactions" USING "btree" ("profile_id", "reference_id", "transaction_type") WHERE ("reference_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "ensure_klinflow_id" BEFORE INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_klinflow_id"();



CREATE OR REPLACE TRIGGER "handle_updated_at_delivery_assignments" BEFORE UPDATE ON "public"."delivery_assignments" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at_fulfillment_orders" BEFORE UPDATE ON "public"."fulfillment_orders" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at_rfq_offers" BEFORE UPDATE ON "public"."rfq_offers" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "handle_updated_at_rfqs" BEFORE UPDATE ON "public"."rfqs" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "on_agent_created_config" AFTER INSERT OR UPDATE OF "role", "agent_account_type" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_agent_config"();



CREATE OR REPLACE TRIGGER "on_agent_rated" AFTER UPDATE OF "agent_rating" ON "public"."bookings" FOR EACH ROW WHEN (("new"."agent_rating" IS NOT NULL)) EXECUTE FUNCTION "public"."sync_agent_rating"();



CREATE OR REPLACE TRIGGER "on_booking_completed_stats" AFTER UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_profile_lifetime_stats"();



CREATE OR REPLACE TRIGGER "on_booking_completed_sync_count" AFTER UPDATE OF "status" ON "public"."bookings" FOR EACH ROW WHEN (("new"."status" = 'completed'::"text")) EXECUTE FUNCTION "public"."sync_agent_pickup_count"();



CREATE OR REPLACE TRIGGER "on_company_admin_created" BEFORE INSERT OR UPDATE OF "agent_account_type" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_fleet_invite_code"();



CREATE OR REPLACE TRIGGER "on_escrow_release" AFTER UPDATE ON "public"."marketplace_orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_escrow_payout"();



CREATE OR REPLACE TRIGGER "on_escrow_released" AFTER UPDATE ON "public"."marketplace_orders" FOR EACH ROW EXECUTE FUNCTION "public"."handle_escrow_payout"();



CREATE OR REPLACE TRIGGER "on_swarm_participant_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."swarm_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_swarm_weight"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "tr_protect_financial_columns" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."protect_financial_columns"();



CREATE OR REPLACE TRIGGER "tr_update_agent_rating" AFTER UPDATE OF "agent_rating" ON "public"."bookings" FOR EACH ROW WHEN (("new"."agent_rating" IS NOT NULL)) EXECUTE FUNCTION "public"."update_agent_average_rating"();



CREATE OR REPLACE TRIGGER "trigger_notify_fund_status" AFTER UPDATE ON "public"."fund_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_fund_request_notification"();



CREATE OR REPLACE TRIGGER "trigger_push_notification" AFTER INSERT ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."on_new_notification_push"();



CREATE OR REPLACE TRIGGER "update_company_join_requests_updated_at_trigger" BEFORE UPDATE ON "public"."company_join_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_company_join_requests_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_wallets_modtime_trigger" BEFORE UPDATE ON "public"."user_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_wallets_modtime"();



ALTER TABLE ONLY "public"."agent_actions"
    ADD CONSTRAINT "agent_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agent_configurations"
    ADD CONSTRAINT "agent_configurations_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_reviews"
    ADD CONSTRAINT "app_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_hub_manager_id_fkey" FOREIGN KEY ("hub_manager_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_verifier_id_fkey" FOREIGN KEY ("verifier_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_weaver_id_fkey" FOREIGN KEY ("weaver_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_swarm_id_fkey" FOREIGN KEY ("swarm_id") REFERENCES "public"."swarms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_join_requests"
    ADD CONSTRAINT "company_join_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_join_requests"
    ADD CONSTRAINT "company_join_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."delivery_assignments"
    ADD CONSTRAINT "delivery_assignments_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillment_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillment_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."rfq_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_orders"
    ADD CONSTRAINT "fulfillment_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_status_history"
    ADD CONSTRAINT "fulfillment_status_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fulfillment_status_history"
    ADD CONSTRAINT "fulfillment_status_history_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillment_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fund_requests"
    ADD CONSTRAINT "fund_requests_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."fund_requests"
    ADD CONSTRAINT "fund_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."hub_settings"
    ADD CONSTRAINT "hub_settings_hub_id_fkey" FOREIGN KEY ("hub_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."hygenex_messages"
    ADD CONSTRAINT "hygenex_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."listings"
    ADD CONSTRAINT "listings_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_listings"
    ADD CONSTRAINT "marketplace_listings_swarm_id_fkey" FOREIGN KEY ("swarm_id") REFERENCES "public"."swarms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_offers"
    ADD CONSTRAINT "marketplace_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_offers"
    ADD CONSTRAINT "marketplace_offers_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_offers"
    ADD CONSTRAINT "marketplace_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."marketplace_orders"
    ADD CONSTRAINT "marketplace_orders_swarm_id_fkey" FOREIGN KEY ("swarm_id") REFERENCES "public"."swarms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."material_verifications"
    ADD CONSTRAINT "material_verifications_fulfillment_id_fkey" FOREIGN KEY ("fulfillment_id") REFERENCES "public"."fulfillment_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."material_verifications"
    ADD CONSTRAINT "material_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_target_user_fkey" FOREIGN KEY ("target_user") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id");



ALTER TABLE ONLY "public"."point_redemptions"
    ADD CONSTRAINT "point_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."point_transfers"
    ADD CONSTRAINT "point_transfers_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."point_transfers"
    ADD CONSTRAINT "point_transfers_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_offers"
    ADD CONSTRAINT "rfq_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_offers"
    ADD CONSTRAINT "rfq_offers_rfq_id_fkey" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfq_offers"
    ADD CONSTRAINT "rfq_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfqs"
    ADD CONSTRAINT "rfqs_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."swarm_participants"
    ADD CONSTRAINT "swarm_participants_swarm_id_fkey" FOREIGN KEY ("swarm_id") REFERENCES "public"."swarms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."swarm_participants"
    ADD CONSTRAINT "swarm_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."swarms"
    ADD CONSTRAINT "swarms_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_ledger"
    ADD CONSTRAINT "wallet_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wallet_transactions"
    ADD CONSTRAINT "wallet_transactions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."waste_categories"
    ADD CONSTRAINT "waste_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."waste_categories"("id") ON DELETE CASCADE;



ALTER TABLE "private"."settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Actors can insert history" ON "public"."fulfillment_status_history" FOR INSERT WITH CHECK (("auth"."uid"() = "actor_id"));



CREATE POLICY "Admin Power" ON "public"."waste_categories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access for waste categories" ON "public"."waste_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"text") OR ("profiles"."agent_account_type" = 'company_admin'::"text"))))));



CREATE POLICY "Admins can update any profile" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admins delete reviews" ON "public"."app_reviews" FOR DELETE USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins manage NEMA reports" ON "public"."nema_reports" USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins view agent logs" ON "public"."agent_actions" FOR SELECT USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Admins view reviews" ON "public"."app_reviews" FOR SELECT USING (("public"."get_my_role"() = 'admin'::"text"));



CREATE POLICY "Agents can claim open bookings" ON "public"."bookings" FOR UPDATE USING ((("agent_id" IS NULL) AND ("status" = 'pending'::"text"))) WITH CHECK ((("agent_id" = "auth"."uid"()) AND ("status" = 'confirmed'::"text")));



CREATE POLICY "Agents can insert assets" ON "public"."assets" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'agent'::"text") OR ("profiles"."role" = 'admin'::"text"))))));



CREATE POLICY "Agents can manage their own config" ON "public"."agent_configurations" USING (("auth"."uid"() = "agent_id")) WITH CHECK (("auth"."uid"() = "agent_id"));



CREATE POLICY "Agents can update assigned bookings" ON "public"."bookings" FOR UPDATE USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "Agents can view open pending bookings" ON "public"."bookings" FOR SELECT USING ((("status" = 'pending'::"text") AND ("agent_id" IS NULL)));



CREATE POLICY "Agents can view their assigned bookings" ON "public"."bookings" FOR SELECT USING (("agent_id" = "auth"."uid"()));



CREATE POLICY "Agents insert assets" ON "public"."assets" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow admin edit" ON "public"."system_settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow admin write access" ON "public"."waste_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Allow public read" ON "public"."system_settings" FOR SELECT USING (true);



CREATE POLICY "Allow public read access" ON "public"."waste_categories" FOR SELECT USING (true);



CREATE POLICY "Allow public read for leaderboard" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow viewing of company admins" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("agent_account_type" = 'company_admin'::"text"));



CREATE POLICY "Anyone authenticated can view assets" ON "public"."assets" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Anyone can view RFQs" ON "public"."rfqs" FOR SELECT USING (true);



CREATE POLICY "Anyone can view active listings" ON "public"."marketplace_listings" FOR SELECT TO "authenticated" USING ((("status" = 'active'::"text") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Anyone can view group collection offers" ON "public"."rfq_offers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."rfqs" "r"
  WHERE (("r"."id" = "rfq_offers"."rfq_id") AND ("r"."is_group_collection" = true)))));



CREATE POLICY "Anyone inserts notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone views active listings" ON "public"."marketplace_listings" FOR SELECT USING ((("status" = 'active'::"text") OR ("seller_id" = "auth"."uid"())));



CREATE POLICY "Anyone views config" ON "public"."system_config" FOR SELECT USING (true);



CREATE POLICY "Auth full access for waste_categories" ON "public"."waste_categories" USING (("auth"."role"() = 'authenticated'::"text")) WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Authenticated users can create offers" ON "public"."marketplace_offers" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Buyers and Sellers can view offers" ON "public"."marketplace_offers" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Buyers and Sellers view orders" ON "public"."marketplace_orders" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR (EXISTS ( SELECT 1
   FROM "public"."marketplace_listings"
  WHERE (("marketplace_listings"."id" = "marketplace_orders"."listing_id") AND ("marketplace_listings"."seller_id" = "auth"."uid"())))) OR ("public"."get_my_role"() = 'admin'::"text")));



CREATE POLICY "Buyers can create offers" ON "public"."marketplace_offers" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can delete own RFQs" ON "public"."rfqs" FOR DELETE USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can delete pending offers" ON "public"."marketplace_offers" FOR DELETE USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can insert own RFQs" ON "public"."rfqs" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can update own RFQs" ON "public"."rfqs" FOR UPDATE USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers can view their own offers" ON "public"."marketplace_offers" FOR SELECT USING (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyers create orders" ON "public"."marketplace_orders" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Company and driver can update assignments" ON "public"."delivery_assignments" FOR UPDATE USING ((("auth"."uid"() = "company_id") OR ("auth"."uid"() = "driver_id")));



CREATE POLICY "Company and driver can view assignments" ON "public"."delivery_assignments" FOR SELECT USING ((("auth"."uid"() = "company_id") OR ("auth"."uid"() = "driver_id")));



CREATE POLICY "Company can insert assignments" ON "public"."delivery_assignments" FOR INSERT WITH CHECK (("auth"."uid"() = "company_id"));



CREATE POLICY "Company owners can update requests" ON "public"."company_join_requests" FOR UPDATE TO "authenticated" USING (("company_id" = "auth"."uid"())) WITH CHECK (("company_id" = "auth"."uid"()));



CREATE POLICY "Company owners can view fleet agent wallets" ON "public"."user_wallets" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "user_wallets"."user_id") AND ("profiles"."company_id" = "auth"."uid"()))))));



CREATE POLICY "Company owners can view requests to their company" ON "public"."company_join_requests" FOR SELECT TO "authenticated" USING (("company_id" = "auth"."uid"()));



CREATE POLICY "Drivers can create requests" ON "public"."company_join_requests" FOR INSERT TO "authenticated" WITH CHECK (("driver_id" = "auth"."uid"()));



CREATE POLICY "Drivers can create requests" ON "public"."fund_requests" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "driver_id"));



CREATE POLICY "Drivers can see their own requests" ON "public"."fund_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "driver_id"));



CREATE POLICY "Drivers can view their own requests" ON "public"."company_join_requests" FOR SELECT TO "authenticated" USING (("driver_id" = "auth"."uid"()));



CREATE POLICY "Enable delete for own participation" ON "public"."swarm_participants" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable delete for swarm creator" ON "public"."swarms" FOR DELETE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."swarm_participants" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."swarms" FOR INSERT WITH CHECK (("auth"."uid"() = "creator_id"));



CREATE POLICY "Enable read access for all users" ON "public"."swarm_participants" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."swarms" FOR SELECT USING (true);



CREATE POLICY "Enable swarm creator to delete participants" ON "public"."swarm_participants" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."swarms" "s"
  WHERE (("s"."id" = "swarm_participants"."swarm_id") AND ("s"."creator_id" = "auth"."uid"())))));



CREATE POLICY "Enable update for creator" ON "public"."swarms" FOR UPDATE USING (("auth"."uid"() = "creator_id"));



CREATE POLICY "Enable update for own participation" ON "public"."swarm_participants" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Hub managers can clear check-in pins" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "manager"
  WHERE (("manager"."id" = "auth"."uid"()) AND (("manager"."role" = 'admin'::"text") OR ("manager"."agent_account_type" = 'company_admin'::"text")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "manager"
  WHERE (("manager"."id" = "auth"."uid"()) AND (("manager"."role" = 'admin'::"text") OR ("manager"."agent_account_type" = 'company_admin'::"text"))))));



CREATE POLICY "Hub managers view received assets" ON "public"."assets" FOR SELECT USING (("hub_manager_id" = "auth"."uid"()));



CREATE POLICY "Involved users can raise disputes" ON "public"."disputes" FOR INSERT WITH CHECK (("auth"."uid"() = "raised_by"));



CREATE POLICY "Owners can see requests for their company" ON "public"."fund_requests" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "company_id"));



CREATE POLICY "Owners can update requests for their company" ON "public"."fund_requests" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "company_id")) WITH CHECK (("auth"."uid"() = "company_id"));



CREATE POLICY "Parties can update offers" ON "public"."marketplace_offers" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Public Read Services" ON "public"."waste_categories" FOR SELECT USING (true);



CREATE POLICY "Public can view agent configurations" ON "public"."agent_configurations" FOR SELECT USING (true);



CREATE POLICY "Public can view agents for booking" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("role" = 'agent'::"text") OR ("role" = 'business'::"text")));



CREATE POLICY "Public read access for waste categories" ON "public"."waste_categories" FOR SELECT USING (true);



CREATE POLICY "Public read access for waste_categories" ON "public"."waste_categories" FOR SELECT USING (true);



CREATE POLICY "Sellers can insert offers" ON "public"."rfq_offers" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Sellers can update offer status" ON "public"."marketplace_offers" FOR UPDATE USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Sellers can view offers on their listings" ON "public"."marketplace_offers" FOR SELECT USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Sellers delete listings" ON "public"."marketplace_listings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Sellers update listings" ON "public"."marketplace_listings" FOR UPDATE USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Service inserts profiles" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can add rewards" ON "public"."rewards_ledger" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert transactions" ON "public"."wallet_transactions" FOR INSERT TO "authenticated" WITH CHECK (false);



CREATE POLICY "Temp bypass config" ON "public"."system_config" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create their own listings" ON "public"."marketplace_listings" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can insert offers" ON "public"."marketplace_offers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert orders" ON "public"."marketplace_orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can manage their own push subscriptions" ON "public"."push_subscriptions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update offers" ON "public"."marketplace_offers" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() IN ( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_offers"."listing_id")))));



CREATE POLICY "Users can update relevant fulfillments" ON "public"."fulfillment_orders" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "assigned_agent_id") OR ("auth"."uid"() = "organization_id")));



CREATE POLICY "Users can update relevant offers" ON "public"."rfq_offers" FOR UPDATE USING ((("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "buyer_id")));



CREATE POLICY "Users can update their own hub status" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own listings" ON "public"."marketplace_listings" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users can update their own orders" ON "public"."marketplace_orders" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() IN ( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_orders"."listing_id")))));



CREATE POLICY "Users can update their own profile clearance" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own ledger" ON "public"."rewards_ledger" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own rewards" ON "public"."rewards_ledger" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Users can view relevant disputes" ON "public"."disputes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."fulfillment_orders" "fo"
  WHERE (("fo"."id" = "disputes"."fulfillment_id") AND (("auth"."uid"() = "fo"."buyer_id") OR ("auth"."uid"() = "fo"."seller_id") OR ("auth"."uid"() = "fo"."assigned_agent_id") OR ("auth"."uid"() = "fo"."organization_id"))))));



CREATE POLICY "Users can view relevant fulfillments" ON "public"."fulfillment_orders" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "assigned_agent_id") OR ("auth"."uid"() = "organization_id")));



CREATE POLICY "Users can view relevant history" ON "public"."fulfillment_status_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."fulfillment_orders" "fo"
  WHERE (("fo"."id" = "fulfillment_status_history"."fulfillment_id") AND (("auth"."uid"() = "fo"."buyer_id") OR ("auth"."uid"() = "fo"."seller_id") OR ("auth"."uid"() = "fo"."assigned_agent_id") OR ("auth"."uid"() = "fo"."organization_id"))))));



CREATE POLICY "Users can view relevant offers" ON "public"."marketplace_offers" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() IN ( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_offers"."listing_id")))));



CREATE POLICY "Users can view relevant offers" ON "public"."rfq_offers" FOR SELECT USING ((("auth"."uid"() = "seller_id") OR ("auth"."uid"() = "buyer_id")));



CREATE POLICY "Users can view relevant verifications" ON "public"."material_verifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."fulfillment_orders" "fo"
  WHERE (("fo"."id" = "material_verifications"."fulfillment_id") AND (("auth"."uid"() = "fo"."buyer_id") OR ("auth"."uid"() = "fo"."seller_id") OR ("auth"."uid"() = "fo"."assigned_agent_id") OR ("auth"."uid"() = "fo"."organization_id"))))));



CREATE POLICY "Users can view their ledger" ON "public"."wallet_ledger" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own orders" ON "public"."marketplace_orders" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() IN ( SELECT "marketplace_listings"."seller_id"
   FROM "public"."marketplace_listings"
  WHERE ("marketplace_listings"."id" = "marketplace_orders"."listing_id")))));



CREATE POLICY "Users can view their own redemptions" ON "public"."point_redemptions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own transactions" ON "public"."wallet_transactions" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Users can view their transfers" ON "public"."point_transfers" FOR SELECT TO "authenticated" USING ((("sender_id" = "auth"."uid"()) OR ("receiver_id" = "auth"."uid"())));



CREATE POLICY "Users insert reviews" ON "public"."app_reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users mark read" ON "public"."notifications" FOR UPDATE USING ((("target_user" = "auth"."uid"()) OR ("target_role" = "public"."get_my_role"())));



CREATE POLICY "Users post listings" ON "public"."marketplace_listings" FOR INSERT WITH CHECK (("auth"."uid"() = "seller_id"));



CREATE POLICY "Users post messages" ON "public"."hygenex_messages" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users view own chat history" ON "public"."hygenex_messages" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view relevant notifications" ON "public"."notifications" FOR SELECT USING ((("target_user" = "auth"."uid"()) OR ("target_role" = "public"."get_my_role"()) OR ("target_role" = 'all'::"text")));



CREATE POLICY "Verifiers can insert verifications" ON "public"."material_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "verified_by"));



CREATE POLICY "Weavers and Admins can update assets" ON "public"."assets" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'business'::"text") OR ("profiles"."role" = 'admin'::"text") OR ("profiles"."role" = 'agent'::"text"))))));



CREATE POLICY "Weavers claim assets" ON "public"."assets" FOR UPDATE TO "authenticated" USING (("status" = 'verified'::"text")) WITH CHECK ((("weaver_id" = "auth"."uid"()) AND ("status" = 'matched'::"text")));



CREATE POLICY "admin_view_fleet" ON "public"."profiles" FOR SELECT USING (("company_id" = "auth"."uid"()));



ALTER TABLE "public"."agent_actions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."agent_configurations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "anyone_view_hub_info" ON "public"."hub_settings" FOR SELECT USING (true);



ALTER TABLE "public"."app_reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assets_debug_visibility" ON "public"."assets" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_debug_visibility" ON "public"."bookings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "bookings_delete_policy" ON "public"."bookings" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "bookings_insert_debug" ON "public"."bookings" FOR INSERT WITH CHECK (true);



CREATE POLICY "bookings_update_policy" ON "public"."bookings" FOR UPDATE TO "authenticated" USING (((("status" = 'pending'::"text") AND ("agent_id" IS NULL)) OR ("auth"."uid"() = "agent_id") OR ("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text"))))));



ALTER TABLE "public"."company_join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feedback_delete_policy" ON "public"."app_reviews" FOR DELETE USING (true);



CREATE POLICY "feedback_insert_policy" ON "public"."app_reviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "feedback_select_policy" ON "public"."app_reviews" FOR SELECT USING (true);



ALTER TABLE "public"."fulfillment_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fulfillment_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fund_requests" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hub_manage_own_settings" ON "public"."hub_settings" USING (("auth"."uid"() = "hub_id"));



ALTER TABLE "public"."hub_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hygenex_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."hyginex_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_listings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."marketplace_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."material_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nema_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."otp_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."point_transfers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_roster_visibility" ON "public"."profiles" FOR SELECT USING ((("role" = 'agent'::"text") OR ("agent_account_type" = 'company_admin'::"text")));



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rewards_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rfq_offers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rfqs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "self_access" ON "public"."profiles" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."swarm_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."swarms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waste_categories" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."assets";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bookings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."marketplace_listings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."marketplace_offers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."rewards_ledger";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


















































































































































































































GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid", "assigned_agent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid", "assigned_agent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_booking"("target_booking_id" "uuid", "assigned_agent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_rfq_offer_v2"("p_offer_id" "uuid", "p_delivery_method" "public"."delivery_method_enum", "p_pickup_address" "text", "p_dropoff_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_rfq_offer_v2"("p_offer_id" "uuid", "p_delivery_method" "public"."delivery_method_enum", "p_pickup_address" "text", "p_dropoff_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_rfq_offer_v2"("p_offer_id" "uuid", "p_delivery_method" "public"."delivery_method_enum", "p_pickup_address" "text", "p_dropoff_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_reward_points"("p_user_id" "uuid", "p_points" integer, "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_reward_points"("p_user_id" "uuid", "p_points" integer, "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_reward_points"("p_user_id" "uuid", "p_points" integer, "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_profile"("target_user_id" "uuid", "field_name" "text", "field_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_profile"("target_user_id" "uuid", "field_name" "text", "field_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_profile"("target_user_id" "uuid", "field_name" "text", "field_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."agent_completes_pickup"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_total_fee" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."agent_completes_pickup"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_total_fee" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."agent_completes_pickup"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_total_fee" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_fleet_driver_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_fleet_driver_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_fleet_driver_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_fund_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_fund_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_fund_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."approve_staff_application"("target_user_id" "uuid", "new_fleet_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_staff_application"("target_user_id" "uuid", "new_fleet_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_staff_application"("target_user_id" "uuid", "new_fleet_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."client_releases_funds"("p_booking_uuid" "uuid", "p_client_uuid" "uuid", "p_client_gfp" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."client_releases_funds"("p_booking_uuid" "uuid", "p_client_uuid" "uuid", "p_client_gfp" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."client_releases_funds"("p_booking_uuid" "uuid", "p_client_uuid" "uuid", "p_client_gfp" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_client_cashback" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_client_cashback" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_client_cashback" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_immediate_payout" numeric, "p_held_payout" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_immediate_payout" numeric, "p_held_payout" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_weight_kg" numeric, "p_immediate_payout" numeric, "p_held_payout" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_estimated_value" numeric, "p_client_gfp" integer, "p_is_manual" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_estimated_value" numeric, "p_client_gfp" integer, "p_is_manual" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_estimated_value" numeric, "p_client_gfp" integer, "p_is_manual" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agent_immediate" numeric, "p_agent_held" numeric, "p_client_cashback" numeric, "p_client_gfp" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agent_immediate" numeric, "p_agent_held" numeric, "p_client_cashback" numeric, "p_client_gfp" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_booking_split_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agent_immediate" numeric, "p_agent_held" numeric, "p_client_cashback" numeric, "p_client_gfp" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_booking_trade_payout"("p_booking_id" "uuid", "p_actual_weight" numeric, "p_payout_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."complete_booking_trade_payout"("p_booking_id" "uuid", "p_actual_weight" numeric, "p_payout_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_booking_trade_payout"("p_booking_id" "uuid", "p_actual_weight" numeric, "p_payout_amount" numeric) TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_get_all_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_get_all_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_get_all_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_own_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_own_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_own_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."deposit_to_wallet"("p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."deposit_to_wallet"("p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."deposit_to_wallet"("p_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."finalize_group_rfq"("p_rfq_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_group_rfq"("p_rfq_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_group_rfq"("p_rfq_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_fleet_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_fleet_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_fleet_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_klinflow_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_klinflow_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_klinflow_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_active_agent_jobs"("agent_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_active_agent_jobs"("agent_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_active_agent_jobs"("agent_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_overview"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_overview"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_overview"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_bookings"("agent_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_bookings"("agent_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_bookings"("agent_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_b2b_market_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_b2b_market_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_b2b_market_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_company_stats_v2"("p_company_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_company_stats_v2"("p_company_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_company_stats_v2"("p_company_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_high_alert_bookings"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_high_alert_bookings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_high_alert_bookings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_market_intelligence"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_market_intelligence"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_market_intelligence"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_material_distribution"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_material_distribution"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_material_distribution"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_fund_requests"("p_owner_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_fund_requests"("p_owner_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_fund_requests"("p_owner_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_resident_leaderboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_resident_leaderboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_resident_leaderboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_resident_wallet_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_resident_wallet_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_resident_wallet_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_trends"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_trends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_trends"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_seller_wallet_stats"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_seller_wallet_stats"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_seller_wallet_stats"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_escrow_payout"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_escrow_payout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_escrow_payout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_fleet_invite_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_fleet_invite_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_fleet_invite_code"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_fund_request_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_fund_request_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_fund_request_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_agent_config"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_agent_config"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_agent_config"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_service_payout"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_service_payout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_service_payout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."hub_deposit_cargo"("p_agent_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hub_deposit_cargo"("p_agent_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hub_deposit_cargo"("p_agent_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."on_new_notification_push"() TO "anon";
GRANT ALL ON FUNCTION "public"."on_new_notification_push"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."on_new_notification_push"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_agent_pure_trade_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agreed_price" numeric, "p_client_gfp" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."process_agent_pure_trade_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agreed_price" numeric, "p_client_gfp" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_agent_pure_trade_payout"("p_booking_uuid" "uuid", "p_agent_uuid" "uuid", "p_client_uuid" "uuid", "p_weight_kg" numeric, "p_agreed_price" numeric, "p_client_gfp" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_escrow_payout"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_escrow_payout"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_escrow_payout"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_point_redemption"("p_type" "text", "p_amount" integer, "p_payout_method" "text", "p_payout_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."process_point_redemption"("p_type" "text", "p_amount" integer, "p_payout_method" "text", "p_payout_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_point_redemption"("p_type" "text", "p_amount" integer, "p_payout_method" "text", "p_payout_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_point_transfer"("p_recipient_id" "uuid", "p_amount" integer, "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_point_transfer"("p_recipient_id" "uuid", "p_amount" integer, "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_point_transfer"("p_recipient_id" "uuid", "p_amount" integer, "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_rfq_payout"("p_fulfillment_id" "uuid", "p_weight_kg" numeric, "p_grade" "text", "p_contamination" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."process_rfq_payout"("p_fulfillment_id" "uuid", "p_weight_kg" numeric, "p_grade" "text", "p_contamination" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_rfq_payout"("p_fulfillment_id" "uuid", "p_weight_kg" numeric, "p_grade" "text", "p_contamination" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."process_swarm_payout"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_swarm_payout"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_swarm_payout"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_wallet_topup"("p_amount" numeric, "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_wallet_topup"("p_amount" numeric, "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_wallet_topup"("p_amount" numeric, "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."process_wallet_withdrawal"("p_amount" numeric, "p_method" "text", "p_account" "text", "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_wallet_withdrawal"("p_amount" numeric, "p_method" "text", "p_account" "text", "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_wallet_withdrawal"("p_amount" numeric, "p_method" "text", "p_account" "text", "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."protect_financial_columns"() TO "anon";
GRANT ALL ON FUNCTION "public"."protect_financial_columns"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."protect_financial_columns"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refund_failed_redemption"("p_redemption_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."refund_failed_redemption"("p_redemption_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."refund_failed_redemption"("p_redemption_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."reject_fleet_driver_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."reject_fleet_driver_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reject_fleet_driver_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_wallet_recipient"("p_search_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_wallet_recipient"("p_search_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_wallet_recipient"("p_search_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_counter_offer"("p_booking_id" "uuid", "p_new_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."submit_counter_offer"("p_booking_id" "uuid", "p_new_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_counter_offer"("p_booking_id" "uuid", "p_new_amount" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_agent_pickup_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_agent_pickup_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_agent_pickup_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_agent_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_agent_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_agent_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_klinflow_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_klinflow_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_klinflow_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_agent_average_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_agent_average_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_agent_average_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_company_join_requests_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_company_join_requests_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_company_join_requests_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_goal_weight"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_goal_weight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_goal_weight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_marketplace_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_marketplace_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_marketplace_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile_lifetime_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile_lifetime_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile_lifetime_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_swarm_weight"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_swarm_weight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_swarm_weight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_wallets_modtime"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_wallets_modtime"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_wallets_modtime"() TO "service_role";



GRANT ALL ON FUNCTION "public"."weaver_claim_asset"("p_asset_id" "uuid", "p_weaver_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."weaver_claim_asset"("p_asset_id" "uuid", "p_weaver_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."weaver_claim_asset"("p_asset_id" "uuid", "p_weaver_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."agent_actions" TO "anon";
GRANT ALL ON TABLE "public"."agent_actions" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_actions" TO "service_role";



GRANT ALL ON TABLE "public"."agent_configurations" TO "anon";
GRANT ALL ON TABLE "public"."agent_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."app_reviews" TO "anon";
GRANT ALL ON TABLE "public"."app_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."app_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."company_join_requests" TO "anon";
GRANT ALL ON TABLE "public"."company_join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."company_join_requests" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_assignments" TO "anon";
GRANT ALL ON TABLE "public"."delivery_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."estates" TO "anon";
GRANT ALL ON TABLE "public"."estates" TO "authenticated";
GRANT ALL ON TABLE "public"."estates" TO "service_role";



GRANT ALL ON TABLE "public"."fulfillment_orders" TO "anon";
GRANT ALL ON TABLE "public"."fulfillment_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."fulfillment_orders" TO "service_role";



GRANT ALL ON TABLE "public"."fulfillment_status_history" TO "anon";
GRANT ALL ON TABLE "public"."fulfillment_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."fulfillment_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."fund_requests" TO "anon";
GRANT ALL ON TABLE "public"."fund_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."fund_requests" TO "service_role";



GRANT ALL ON TABLE "public"."hub_settings" TO "anon";
GRANT ALL ON TABLE "public"."hub_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."hub_settings" TO "service_role";



GRANT ALL ON TABLE "public"."hygenex_messages" TO "anon";
GRANT ALL ON TABLE "public"."hygenex_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."hygenex_messages" TO "service_role";



GRANT ALL ON TABLE "public"."hyginex_messages" TO "anon";
GRANT ALL ON TABLE "public"."hyginex_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."hyginex_messages" TO "service_role";



GRANT ALL ON TABLE "public"."listings" TO "anon";
GRANT ALL ON TABLE "public"."listings" TO "authenticated";
GRANT ALL ON TABLE "public"."listings" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_listings" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_listings" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_offers" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_offers" TO "service_role";



GRANT ALL ON TABLE "public"."marketplace_orders" TO "anon";
GRANT ALL ON TABLE "public"."marketplace_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."marketplace_orders" TO "service_role";



GRANT ALL ON TABLE "public"."material_verifications" TO "anon";
GRANT ALL ON TABLE "public"."material_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."material_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."nema_reports" TO "anon";
GRANT ALL ON TABLE "public"."nema_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."nema_reports" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."otp_verifications" TO "anon";
GRANT ALL ON TABLE "public"."otp_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_verifications" TO "service_role";



GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."point_redemptions" TO "anon";
GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."point_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."point_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."point_transfers" TO "anon";
GRANT ALL ON TABLE "public"."point_transfers" TO "authenticated";
GRANT ALL ON TABLE "public"."point_transfers" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."rewards_ledger" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."rewards_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."rewards_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."rfq_offers" TO "anon";
GRANT ALL ON TABLE "public"."rfq_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."rfq_offers" TO "service_role";



GRANT ALL ON TABLE "public"."rfqs" TO "anon";
GRANT ALL ON TABLE "public"."rfqs" TO "authenticated";
GRANT ALL ON TABLE "public"."rfqs" TO "service_role";



GRANT ALL ON TABLE "public"."swarm_participants" TO "anon";
GRANT ALL ON TABLE "public"."swarm_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."swarm_participants" TO "service_role";



GRANT ALL ON TABLE "public"."swarms" TO "anon";
GRANT ALL ON TABLE "public"."swarms" TO "authenticated";
GRANT ALL ON TABLE "public"."swarms" TO "service_role";



GRANT ALL ON TABLE "public"."system_config" TO "anon";
GRANT ALL ON TABLE "public"."system_config" TO "authenticated";
GRANT ALL ON TABLE "public"."system_config" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_wallets" TO "anon";
GRANT ALL ON TABLE "public"."user_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallets" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_transactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."vw_balance_drift_audit" TO "anon";
GRANT ALL ON TABLE "public"."vw_balance_drift_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_balance_drift_audit" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_ledger" TO "anon";
GRANT SELECT,INSERT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."wallet_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."waste_categories" TO "anon";
GRANT ALL ON TABLE "public"."waste_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."waste_categories" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































