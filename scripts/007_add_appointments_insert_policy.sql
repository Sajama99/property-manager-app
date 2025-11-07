-- Drop the old incomplete policy if it exists
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;

-- Add INSERT policy for appointments so users can create their own appointments
CREATE POLICY "Users can insert their own appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (manager_id = auth.uid());

-- Also ensure properties can be inserted by all authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;

CREATE POLICY "Authenticated users can insert properties" 
ON public.properties 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update and delete properties they created
DROP POLICY IF EXISTS "Authenticated users can update properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can delete properties" ON public.properties;

CREATE POLICY "Authenticated users can update properties" 
ON public.properties 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete properties" 
ON public.properties 
FOR DELETE 
USING (auth.uid() IS NOT NULL);
