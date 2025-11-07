-- Add missing columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Managers can view properties" ON public.properties;

-- Create new policies that allow all authenticated users to manage properties
CREATE POLICY "Authenticated users can view properties" 
  ON public.properties FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert properties" 
  ON public.properties FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties" 
  ON public.properties FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete properties" 
  ON public.properties FOR DELETE 
  USING (auth.uid() IS NOT NULL);
