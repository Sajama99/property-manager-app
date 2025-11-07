-- Properly fix infinite recursion by simplifying policies
-- The key insight: profiles table policies should NOT check for admin role
-- because that would require querying the profiles table itself

-- Drop the problematic is_admin function
DROP FUNCTION IF EXISTS public.is_admin();

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view properties" ON public.properties;
DROP POLICY IF EXISTS "All authenticated users can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Managers can view properties" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own schedule" ON public.daily_schedules;
DROP POLICY IF EXISTS "Users can manage their own schedule" ON public.daily_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Users can view their own visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Users can manage their own visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Admins can view all visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Users can manage photos for their visits" ON public.visit_photos;
DROP POLICY IF EXISTS "Admins can view all photos" ON public.visit_photos;
DROP POLICY IF EXISTS "Users can view notifications for their appointments" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view email alerts for their appointments" ON public.email_alerts;
DROP POLICY IF EXISTS "Admins can view all email alerts" ON public.email_alerts;
DROP POLICY IF EXISTS "Users can view routes for their schedules" ON public.route_calculations;
DROP POLICY IF EXISTS "Users can manage routes for their schedules" ON public.route_calculations;

-- PROFILES: Simple policies - users can only access their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- PROPERTIES: All authenticated users can manage properties
CREATE POLICY "Authenticated users can view properties" ON public.properties
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert properties" ON public.properties
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update properties" ON public.properties
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete properties" ON public.properties
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- APPOINTMENTS: Users can manage their own appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Users can insert their own appointments" ON public.appointments
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "Users can delete their own appointments" ON public.appointments
  FOR DELETE
  USING (manager_id = auth.uid());

-- DAILY SCHEDULES: Users can manage their own schedules
CREATE POLICY "Users can view their own schedule" ON public.daily_schedules
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Users can insert their own schedule" ON public.daily_schedules
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update their own schedule" ON public.daily_schedules
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "Users can delete their own schedule" ON public.daily_schedules
  FOR DELETE
  USING (manager_id = auth.uid());

-- VISIT LOGS: Users can manage their own visit logs
CREATE POLICY "Users can view their own visit logs" ON public.visit_logs
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "Users can insert their own visit logs" ON public.visit_logs
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update their own visit logs" ON public.visit_logs
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "Users can delete their own visit logs" ON public.visit_logs
  FOR DELETE
  USING (manager_id = auth.uid());

-- VISIT PHOTOS: Users can manage photos for their own visits
CREATE POLICY "Users can view photos for their visits" ON public.visit_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE id = visit_log_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert photos for their visits" ON public.visit_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE id = visit_log_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos for their visits" ON public.visit_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE id = visit_log_id AND manager_id = auth.uid()
    )
  );

-- NOTIFICATIONS: Users can manage their own notifications
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE id = appointment_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE id = appointment_id AND manager_id = auth.uid()
    )
  );

-- EMAIL ALERTS: Users can view alerts for their appointments
CREATE POLICY "Users can view their email alerts" ON public.email_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments 
      WHERE id = appointment_id AND manager_id = auth.uid()
    )
  );

-- ROUTE CALCULATIONS: Users can manage routes for their schedules
CREATE POLICY "Users can view their routes" ON public.route_calculations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_schedules 
      WHERE id = schedule_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their routes" ON public.route_calculations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.daily_schedules 
      WHERE id = schedule_id AND manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their routes" ON public.route_calculations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.daily_schedules 
      WHERE id = schedule_id AND manager_id = auth.uid()
    )
  );
