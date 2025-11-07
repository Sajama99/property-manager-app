-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Users can manage properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage all properties" ON public.properties;

DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

DROP POLICY IF EXISTS "Users can view schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Users can manage schedules" ON public.daily_schedules;

DROP POLICY IF EXISTS "Users can view visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Users can manage visit logs" ON public.visit_logs;

DROP POLICY IF EXISTS "Users can view visit photos" ON public.visit_photos;
DROP POLICY IF EXISTS "Users can manage visit photos" ON public.visit_photos;

DROP POLICY IF EXISTS "Users can view routes" ON public.route_calculations;
DROP POLICY IF EXISTS "Users can manage routes" ON public.route_calculations;

DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage notifications" ON public.notifications;

DROP POLICY IF EXISTS "Users can view email logs" ON public.email_logs;

-- Drop the problematic is_admin function if it exists
DROP FUNCTION IF EXISTS public.is_admin();

-- PROFILES: Simple policies - users can only access their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- PROPERTIES: All authenticated users can manage properties
CREATE POLICY "Authenticated users can view properties" ON public.properties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert properties" ON public.properties
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update properties" ON public.properties
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete properties" ON public.properties
  FOR DELETE USING (auth.role() = 'authenticated');

-- APPOINTMENTS: Users can manage their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Users can delete own appointments" ON public.appointments
  FOR DELETE USING (manager_id = auth.uid());

-- DAILY_SCHEDULES: Users can manage their own schedules
CREATE POLICY "Users can view own schedules" ON public.daily_schedules
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can insert own schedules" ON public.daily_schedules
  FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update own schedules" ON public.daily_schedules
  FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Users can delete own schedules" ON public.daily_schedules
  FOR DELETE USING (manager_id = auth.uid());

-- VISIT_LOGS: Users can manage their own visit logs
CREATE POLICY "Users can view own visit logs" ON public.visit_logs
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can insert own visit logs" ON public.visit_logs
  FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update own visit logs" ON public.visit_logs
  FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Users can delete own visit logs" ON public.visit_logs
  FOR DELETE USING (manager_id = auth.uid());

-- VISIT_PHOTOS: Users can manage photos for their own visits
CREATE POLICY "Users can view own visit photos" ON public.visit_photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE visit_logs.id = visit_photos.visit_log_id 
      AND visit_logs.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own visit photos" ON public.visit_photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE visit_logs.id = visit_photos.visit_log_id 
      AND visit_logs.manager_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own visit photos" ON public.visit_photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs 
      WHERE visit_logs.id = visit_photos.visit_log_id 
      AND visit_logs.manager_id = auth.uid()
    )
  );

-- ROUTE_CALCULATIONS: Users can manage their own routes
CREATE POLICY "Users can view own routes" ON public.route_calculations
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can insert own routes" ON public.route_calculations
  FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update own routes" ON public.route_calculations
  FOR UPDATE USING (manager_id = auth.uid());

-- NOTIFICATIONS: Users can manage their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (manager_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (manager_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (manager_id = auth.uid());

-- EMAIL_LOGS: Users can view their own email logs
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "System can insert email logs" ON public.email_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
