-- ══════════════════════════════════════════════════════════════════════════════
-- Company-Aware Auto-sync total_pickups count
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure the column exists on profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS total_pickups INTEGER DEFAULT 0;

-- 2. Create the sync function (Company-Aware)
CREATE OR REPLACE FUNCTION public.sync_agent_pickup_count()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. Update the individual agent/driver's count
    UPDATE public.profiles
    SET total_pickups = (
        SELECT COUNT(*)
        FROM public.bookings
        WHERE agent_id = NEW.agent_id
          AND status = 'completed'
    )
    WHERE id = NEW.agent_id;

    -- 2. Check if this agent belongs to a company
    SELECT company_id INTO v_company_id 
    FROM public.profiles 
    WHERE id = NEW.agent_id;

    -- 3. If they belong to a company, update the Company Admin's aggregate count
    IF v_company_id IS NOT NULL THEN
        UPDATE public.profiles
        SET total_pickups = (
            SELECT COUNT(*)
            FROM public.bookings b
            JOIN public.profiles p ON b.agent_id = p.id
            WHERE (p.company_id = v_company_id OR p.id = v_company_id)
              AND b.status = 'completed'
        )
        WHERE id = v_company_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS on_booking_completed_sync_count ON public.bookings;
CREATE TRIGGER on_booking_completed_sync_count
    AFTER UPDATE OF status ON public.bookings
    FOR EACH ROW
    WHEN (NEW.status = 'completed')
    EXECUTE FUNCTION public.sync_agent_pickup_count();

-- 4. Retroactive sync for all existing individuals
UPDATE public.profiles p
SET total_pickups = sub.pickup_count
FROM (
    SELECT agent_id, COUNT(*) as pickup_count
    FROM public.bookings
    WHERE status = 'completed'
    GROUP BY agent_id
) sub
WHERE p.id = sub.agent_id;

-- 5. Retroactive sync for all Companies (Sum of Fleet)
UPDATE public.profiles p
SET total_pickups = sub.fleet_total
FROM (
    SELECT p.company_id, COUNT(b.id) as fleet_total
    FROM public.bookings b
    JOIN public.profiles p ON b.agent_id = p.id
    WHERE b.status = 'completed'
      AND p.company_id IS NOT NULL
    GROUP BY p.company_id
) sub
WHERE p.id = sub.company_id;
