-- Drop existing restrictive policies for appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

-- Create new comprehensive policies that allow managers to create appointments
CREATE POLICY "Users can view their own appointments" 
  ON public.appointments FOR SELECT 
  USING (manager_id = auth.uid());

CREATE POLICY "Users can create their own appointments" 
  ON public.appointments FOR INSERT 
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update their own appointments" 
  ON public.appointments FOR UPDATE 
  USING (manager_id = auth.uid());

CREATE POLICY "Users can delete their own appointments" 
  ON public.appointments FOR DELETE 
  USING (manager_id = auth.uid());

CREATE POLICY "Admins can manage all appointments" 
  ON public.appointments FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
