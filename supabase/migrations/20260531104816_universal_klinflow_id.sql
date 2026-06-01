-- 1. Add column to profiles (if it doesn't exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS klinflow_id TEXT UNIQUE;

-- 2. Create function to generate random 8 character string prefixed with 'KF'
CREATE OR REPLACE FUNCTION public.generate_klinflow_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;

-- 3. Create trigger function to auto-set klinflow_id on insert
CREATE OR REPLACE FUNCTION public.trigger_set_klinflow_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.klinflow_id IS NULL THEN
        NEW.klinflow_id := public.generate_klinflow_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger on profiles
DROP TRIGGER IF EXISTS ensure_klinflow_id ON public.profiles;
CREATE TRIGGER ensure_klinflow_id
    BEFORE INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_klinflow_id();

-- 5. Backfill existing profiles that don't have a klinflow_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id FROM public.profiles WHERE klinflow_id IS NULL
    LOOP
        UPDATE public.profiles
        SET klinflow_id = public.generate_klinflow_id()
        WHERE id = rec.id;
    END LOOP;
END;
$$;
