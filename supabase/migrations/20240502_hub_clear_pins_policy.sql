-- Allow Company Admins and Admins to clear the hub_transfer_pin and is_en_route fields of drivers
CREATE POLICY "Hub managers can clear check-in pins"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS manager
    WHERE manager.id = auth.uid() 
    AND (manager.role = 'admin' OR manager.agent_account_type = 'company_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles AS manager
    WHERE manager.id = auth.uid() 
    AND (manager.role = 'admin' OR manager.agent_account_type = 'company_admin')
  )
);
