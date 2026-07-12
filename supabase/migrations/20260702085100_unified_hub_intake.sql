-- Migration to add Hub Intake fields to assets table and create RPCs

-- 1. Add fields to assets table
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS material_category text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS amount_paid numeric(10,2);
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS seller_name text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS seller_phone text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS sourcing_tag text;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS payment_method text;

-- 2. Create RPC for Walk-In Intake
CREATE OR REPLACE FUNCTION public.hub_process_walkin_intake(
  p_hub_id uuid,
  p_seller_phone text,
  p_seller_name text,
  p_items jsonb,
  p_payment_method text,
  p_total_payout numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
  v_seller_profile_id uuid;
BEGIN
  -- Check if seller has a profile based on phone
  SELECT id INTO v_seller_profile_id FROM public.profiles WHERE phone = p_seller_phone LIMIT 1;
  
  -- If yes, reward them with GFP points (1 point per 10 KES)
  IF v_seller_profile_id IS NOT NULL THEN
    UPDATE public.profiles 
    SET gfp_balance = COALESCE(gfp_balance, 0) + floor(p_total_payout / 10)
    WHERE id = v_seller_profile_id;
  END IF;

  -- Insert each material line as an asset
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.assets (
      verifier_id, 
      hub_manager_id, 
      material_category, 
      material_type, 
      grade, 
      weight_kg, 
      estimated_value, 
      amount_paid, 
      status, 
      source, 
      sourcing_tag, 
      payment_method, 
      seller_name, 
      seller_phone
    ) VALUES (
      p_hub_id,
      p_hub_id,
      v_item->>'category',
      v_item->>'subcategory',
      v_item->>'grade',
      (v_item->>'weight')::numeric,
      (v_item->>'total')::numeric,
      (v_item->>'total')::numeric,
      'transferred_to_hub',
      'walk_in',
      'walk-in',
      p_payment_method,
      p_seller_name,
      p_seller_phone
    );
  END LOOP;

  RETURN jsonb_build_object('status', 'success', 'seller_profile_id', v_seller_profile_id);
END;
$$;

-- 3. Create RPC for Agent Intake (Reconciliation & Payout)
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

  -- If payment is wallet, log to wallet_transactions
  IF p_payment_method = 'digital_wallet' THEN
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
