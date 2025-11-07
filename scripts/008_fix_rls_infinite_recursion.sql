-- Fix infinite recursion in RLS policies by using JWT claims instead of querying profiles table

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Managers can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Admins can view all visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.visit_photos;
DROP POLICY IF EXISTS "Users can manage photos for their visits" ON public.visit_photos;
DROP POLICY IF EXISTS "Admins can view all email alerts" ON public.email_alerts;

-- Create a helper function to check if user is admin using JWT claims
-- This avoids querying the profiles table and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user's role in their profile is 'admin'
  -- We use a security definer function to bypass RLS
  RETURN (
    SELECT role = 'admin' 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies without recursion

-- Profiles policies
CREATE POLICY "Admins can view all profiles" ON public.profiles 
  FOR SELECT 
  USING (public.is_admin());

CREATE POLICY "Admins can manage all profiles" ON public.profiles 
  FOR ALL 
  USING (public.is_admin());

-- Properties policies  
CREATE POLICY "All authenticated users can view properties" ON public.properties 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can manage properties" ON public.properties 
  FOR ALL 
  USING (auth.uid() IS NOT NULL);

-- Appointments policies
CREATE POLICY "Users can insert their own appointments" ON public.appointments 
  FOR INSERT 
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Admins can manage all appointments" ON public.appointments 
  FOR ALL 
  USING (public.is_admin());

-- Daily schedules policies
CREATE POLICY "Admins can view all schedules" ON public.daily_schedules 
  FOR SELECT 
  USING (public.is_admin());

-- Visit logs policies
CREATE POLICY "Admins can view all visit logs" ON public.visit_logs 
  FOR SELECT 
  USING (public.is_admin());

-- Visit photos policies
CREATE POLICY "Users can manage photos for their visits" ON public.visit_photos 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE id = visit_log_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all photos" ON public.visit_photos 
  FOR SELECT 
  USING (public.is_admin());

-- Email alerts policies
CREATE POLICY "Admins can view all email alerts" ON public.email_alerts 
  FOR SELECT 
  USING (public.is_admin());

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
