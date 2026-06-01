-- Migration: 20260531114209_points_transfer_system.sql
-- Description: Creates user_wallets, point_transfers, wallet_ledger and migrates existing legacy reward_points.

-- 1. Create user_wallets table
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    available_points INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
    lifetime_sent INTEGER NOT NULL DEFAULT 0,
    lifetime_received INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_positive_available_points CHECK (available_points >= 0)
);

-- Enable RLS
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallets"
ON public.user_wallets FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 2. Create point_transfers table
CREATE TABLE IF NOT EXISTS public.point_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number TEXT NOT NULL UNIQUE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    amount INTEGER NOT NULL CHECK (amount > 0),
    fee INTEGER NOT NULL DEFAULT 0 CHECK (fee >= 0),
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.point_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transfers"
ON public.point_transfers FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- 3. Create wallet_ledger table
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'redeem', 'transfer_sent', 'transfer_received', 'adjustment', 'bonus', 'migration')),
    amount INTEGER NOT NULL,
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_id UUID, -- References point_transfers.id or other sources
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their ledger"
ON public.wallet_ledger FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Deny direct updates to ledger
REVOKE UPDATE, DELETE ON public.wallet_ledger FROM authenticated, anon, public;

-- 4. Create trigger to auto-update user_wallets updated_at
CREATE OR REPLACE FUNCTION update_user_wallets_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_wallets_modtime_trigger
BEFORE UPDATE ON public.user_wallets
FOR EACH ROW
EXECUTE FUNCTION update_user_wallets_modtime();

-- 5. Migration Logic: Migrate legacy points to user_wallets
DO $$
DECLARE
    profile_record RECORD;
    migrated_count INTEGER := 0;
    total_migrated_points INTEGER := 0;
BEGIN
    FOR profile_record IN 
        SELECT id, COALESCE(reward_points, 0) as pts FROM public.profiles 
        WHERE id NOT IN (SELECT user_id FROM public.user_wallets)
    LOOP
        -- Create wallet
        INSERT INTO public.user_wallets (
            user_id, available_points, lifetime_earned
        ) VALUES (
            profile_record.id, profile_record.pts, profile_record.pts
        );
        
        -- Create migration ledger entry
        INSERT INTO public.wallet_ledger (
            user_id, transaction_type, amount, balance_before, balance_after, description
        ) VALUES (
            profile_record.id, 'migration', profile_record.pts, 0, profile_record.pts, 'Initial migration of legacy reward points'
        );
        
        migrated_count := migrated_count + 1;
        total_migrated_points := total_migrated_points + profile_record.pts;
    END LOOP;
    
    RAISE NOTICE 'Migration Complete: % users migrated. Total points: %', migrated_count, total_migrated_points;
END $$;

-- 6. RPC: Search Recipient
CREATE OR REPLACE FUNCTION public.search_wallet_recipient(
    p_search_query TEXT
)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    phone TEXT,
    klinflow_id TEXT,
    avatar TEXT,
    account_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow searching active verified members or agents/businesses
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
    AND p.id != auth.uid() -- exclude self
    LIMIT 1;
END;
$$;

-- 7. RPC: Process Point Transfer
CREATE OR REPLACE FUNCTION public.process_point_transfer(
    p_recipient_id UUID,
    p_amount INTEGER,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sender_id UUID;
    v_sender_balance INTEGER;
    v_receiver_balance INTEGER;
    v_transfer_id UUID;
    v_ref_number TEXT;
    
    -- Configs (Can be moved to a config table later)
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

    -- Send notifications
    INSERT INTO public.notifications (target_user, target_role, type, title, body)
    VALUES 
    (v_sender_id, 'user', 'transfer', 'Transfer Successful', 'You successfully sent ' || p_amount || ' points. Ref: ' || v_ref_number),
    (p_recipient_id, 'user', 'transfer', 'Points Received!', 'You received ' || p_amount || ' points. Ref: ' || v_ref_number);

    RETURN jsonb_build_object(
        'success', true, 
        'reference_number', v_ref_number, 
        'amount', p_amount, 
        'sender_balance_after', v_sender_balance - p_amount
    );
END;
$$;
