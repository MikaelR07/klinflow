-- RPC: Get enriched agent wallet transactions
-- For 'payment' type transactions (agent paying sellers), this joins through
-- marketplace_orders to resolve the seller's name and phone number.

CREATE OR REPLACE FUNCTION public.get_agent_wallet_transactions(
  p_user_id uuid,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  amount numeric,
  transaction_type text,
  metadata jsonb,
  created_at timestamptz,
  reference_id uuid,
  counterparty_name text,
  counterparty_phone text
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wt.id,
    wt.amount,
    wt.transaction_type,
    wt.metadata,
    wt.created_at,
    wt.reference_id,
    -- For 'payment' transactions, resolve counterparty name (seller or resident)
    CASE 
      WHEN wt.transaction_type = 'payment' AND wt.reference_id IS NOT NULL THEN
        COALESCE(
          (SELECT p.name FROM public.profiles p 
           JOIN public.marketplace_orders mo ON mo.seller_id = p.id 
           WHERE mo.id = wt.reference_id
           LIMIT 1),
          (SELECT p.name FROM public.profiles p 
           JOIN public.bookings b ON b.user_id = p.id 
           WHERE b.id = wt.reference_id
           LIMIT 1),
          'Recipient'
        )
      ELSE NULL
    END as counterparty_name,
    -- For 'payment' transactions, resolve counterparty phone
    CASE 
      WHEN wt.transaction_type = 'payment' AND wt.reference_id IS NOT NULL THEN
        COALESCE(
          (SELECT p.phone FROM public.profiles p 
           JOIN public.marketplace_orders mo ON mo.seller_id = p.id 
           WHERE mo.id = wt.reference_id
           LIMIT 1),
          (SELECT p.phone FROM public.profiles p 
           JOIN public.bookings b ON b.user_id = p.id 
           WHERE b.id = wt.reference_id
           LIMIT 1)
        )
      ELSE NULL
    END as counterparty_phone
  FROM public.wallet_transactions wt
  WHERE wt.profile_id = p_user_id
  ORDER BY wt.created_at DESC
  LIMIT p_limit;
END;
$$;
