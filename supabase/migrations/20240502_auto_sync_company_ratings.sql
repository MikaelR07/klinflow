-- Migration: 20240502_auto_sync_company_ratings.sql
-- Description: Updates the auto-sync rating trigger to also recalculate and update the Company Owner's rating when a fleet driver is rated. Also performs a retroactive recalculation for companies.

CREATE OR REPLACE FUNCTION public.sync_agent_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Retroactive fix: Calculate and assign ratings to Company Owners based on all their drivers' past ratings
UPDATE public.profiles p
SET rating = sub.company_avg
FROM (
    SELECT 
        driver.company_id, 
        ROUND(AVG(b.agent_rating::NUMERIC), 1) as company_avg
    FROM public.bookings b
    JOIN public.profiles driver ON b.agent_id = driver.id
    WHERE b.agent_rating IS NOT NULL
      AND driver.company_id IS NOT NULL
      AND driver.agent_account_type = 'fleet_driver'
    GROUP BY driver.company_id
) sub
WHERE p.id = sub.company_id;
