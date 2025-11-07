-- Drop the old INSERT policy if it exists
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;

-- Create a new INSERT policy that allows users to create appointments for themselves
CREATE POLICY "Users can insert their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (manager_id = auth.uid());

-- Also ensure users can insert appointments (in case the policy doesn't exist yet)
CREATE POLICY IF NOT EXISTS "Managers can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);
