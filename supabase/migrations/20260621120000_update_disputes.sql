ALTER TABLE public.disputes ADD COLUMN booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.disputes ALTER COLUMN fulfillment_id DROP NOT NULL;
