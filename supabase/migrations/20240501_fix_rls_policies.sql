-- Ensure RLS is enabled and policies allow authenticated users to interact with bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Users can create their own bookings" 
ON public.bookings FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" 
ON public.bookings FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Agents can view assigned bookings" ON public.bookings;
CREATE POLICY "Agents can view assigned bookings" 
ON public.bookings FOR SELECT 
TO authenticated 
USING (auth.uid() = agent_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" 
ON public.bookings FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id OR auth.uid() = agent_id);

-- Also ensure notifications are accessible
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
TO authenticated 
USING (auth.uid() = target_user);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" 
ON public.notifications FOR INSERT 
TO authenticated 
WITH CHECK (true);
