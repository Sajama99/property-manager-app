-- Simplify all other table policies to avoid any potential recursion issues

-- PROPERTIES TABLE
DROP POLICY IF EXISTS "Users can view properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can manage properties" ON public.properties;
DROP POLICY IF EXISTS "properties_select_all" ON public.properties;
DROP POLICY IF EXISTS "properties_all_authenticated" ON public.properties;

-- Allow all authenticated users to manage properties
CREATE POLICY "properties_select" ON public.properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "properties_insert" ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "properties_update" ON public.properties
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "properties_delete" ON public.properties
  FOR DELETE
  TO authenticated
  USING (true);

-- APPOINTMENTS TABLE
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_select_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_update_own" ON public.appointments;
DROP POLICY IF EXISTS "appointments_insert_own" ON public.appointments;

-- Allow users to manage their own appointments
CREATE POLICY "appointments_select" ON public.appointments
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "appointments_insert" ON public.appointments
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "appointments_update" ON public.appointments
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "appointments_delete" ON public.appointments
  FOR DELETE
  USING (manager_id = auth.uid());

-- DAILY_SCHEDULES TABLE
DROP POLICY IF EXISTS "Users can view their own schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Users can manage their own schedules" ON public.daily_schedules;
DROP POLICY IF EXISTS "Admins can view all schedules" ON public.daily_schedules;

CREATE POLICY "daily_schedules_select" ON public.daily_schedules
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "daily_schedules_insert" ON public.daily_schedules
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "daily_schedules_update" ON public.daily_schedules
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "daily_schedules_delete" ON public.daily_schedules
  FOR DELETE
  USING (manager_id = auth.uid());

-- VISIT_LOGS TABLE
DROP POLICY IF EXISTS "Users can view their own visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Users can manage their own visit logs" ON public.visit_logs;
DROP POLICY IF EXISTS "Admins can view all visit logs" ON public.visit_logs;

CREATE POLICY "visit_logs_select" ON public.visit_logs
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "visit_logs_insert" ON public.visit_logs
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "visit_logs_update" ON public.visit_logs
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "visit_logs_delete" ON public.visit_logs
  FOR DELETE
  USING (manager_id = auth.uid());

-- VISIT_PHOTOS TABLE
DROP POLICY IF EXISTS "Users can view photos from their visits" ON public.visit_photos;
DROP POLICY IF EXISTS "Users can manage photos from their visits" ON public.visit_photos;

CREATE POLICY "visit_photos_select" ON public.visit_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs
      WHERE visit_logs.id = visit_photos.visit_log_id
      AND visit_logs.manager_id = auth.uid()
    )
  );

CREATE POLICY "visit_photos_insert" ON public.visit_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.visit_logs
      WHERE visit_logs.id = visit_photos.visit_log_id
      AND visit_logs.manager_id = auth.uid()
    )
  );

CREATE POLICY "visit_photos_delete" ON public.visit_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.visit_logs
      WHERE visit_logs.id = visit_photos.visit_log_id
      AND visit_logs.manager_id = auth.uid()
    )
  );

-- ROUTE_CALCULATIONS TABLE
DROP POLICY IF EXISTS "Users can view their own route calculations" ON public.route_calculations;
DROP POLICY IF EXISTS "Users can manage their own route calculations" ON public.route_calculations;

CREATE POLICY "route_calculations_select" ON public.route_calculations
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "route_calculations_insert" ON public.route_calculations
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "route_calculations_update" ON public.route_calculations
  FOR UPDATE
  USING (manager_id = auth.uid());

-- NOTIFICATIONS TABLE
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;

CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "notifications_insert" ON public.notifications
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());

CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE
  USING (manager_id = auth.uid());

CREATE POLICY "notifications_delete" ON public.notifications
  FOR DELETE
  USING (manager_id = auth.uid());

-- EMAIL_ALERTS TABLE
DROP POLICY IF EXISTS "Users can view alerts about them" ON public.email_alerts;
DROP POLICY IF EXISTS "Users can create email alerts" ON public.email_alerts;

CREATE POLICY "email_alerts_select" ON public.email_alerts
  FOR SELECT
  USING (manager_id = auth.uid());

CREATE POLICY "email_alerts_insert" ON public.email_alerts
  FOR INSERT
  WITH CHECK (manager_id = auth.uid());
