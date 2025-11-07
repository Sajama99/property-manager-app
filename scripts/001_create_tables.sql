-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('manager', 'admin')),
  home_address TEXT,
  home_lat DECIMAL(10, 8),
  home_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties/buildings table
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  is_time_specific BOOLEAN DEFAULT FALSE,
  estimated_duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily schedules table
CREATE TABLE IF NOT EXISTS public.daily_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  planned_start_time TIMESTAMPTZ,
  actual_start_time TIMESTAMPTZ,
  planned_end_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(manager_id, schedule_date)
);

-- Create visit logs table
CREATE TABLE IF NOT EXISTS public.visit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  arrival_time TIMESTAMPTZ,
  departure_time TIMESTAMPTZ,
  notes TEXT,
  next_destination TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create visit photos table
CREATE TABLE IF NOT EXISTS public.visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_log_id UUID NOT NULL REFERENCES public.visit_logs(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create route calculations table
CREATE TABLE IF NOT EXISTS public.route_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_date DATE NOT NULL,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  estimated_duration_minutes INTEGER,
  estimated_departure_time TIMESTAMPTZ,
  traffic_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('departure_reminder', 'delay_warning', 'task_reminder', 'schedule_change')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email alerts table
CREATE TABLE IF NOT EXISTS public.email_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('delay', 'missed_appointment', 'schedule_change')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_to TEXT[] NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for properties (admins can manage, managers can view)
CREATE POLICY "Admins can manage properties" ON public.properties FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Managers can view properties" ON public.properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
);

-- RLS Policies for appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments FOR SELECT USING (manager_id = auth.uid());
CREATE POLICY "Users can update their own appointments" ON public.appointments FOR UPDATE USING (manager_id = auth.uid());
CREATE POLICY "Admins can manage all appointments" ON public.appointments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for daily schedules
CREATE POLICY "Users can view their own schedules" ON public.daily_schedules FOR SELECT USING (manager_id = auth.uid());
CREATE POLICY "Users can manage their own schedules" ON public.daily_schedules FOR ALL USING (manager_id = auth.uid());
CREATE POLICY "Admins can view all schedules" ON public.daily_schedules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for visit logs
CREATE POLICY "Users can manage their own visit logs" ON public.visit_logs FOR ALL USING (manager_id = auth.uid());
CREATE POLICY "Admins can view all visit logs" ON public.visit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for visit photos
CREATE POLICY "Users can manage photos for their visits" ON public.visit_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.visit_logs WHERE id = visit_log_id AND manager_id = auth.uid())
);
CREATE POLICY "Admins can view all photos" ON public.visit_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for route calculations
CREATE POLICY "Users can manage their own routes" ON public.route_calculations FOR ALL USING (manager_id = auth.uid());

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (manager_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (manager_id = auth.uid());

-- RLS Policies for email alerts
CREATE POLICY "Users can view their own email alerts" ON public.email_alerts FOR SELECT USING (manager_id = auth.uid());
CREATE POLICY "Admins can view all email alerts" ON public.email_alerts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Create indexes for better performance
CREATE INDEX idx_appointments_manager_date ON public.appointments(manager_id, scheduled_date);
CREATE INDEX idx_appointments_property ON public.appointments(property_id);
CREATE INDEX idx_visit_logs_appointment ON public.visit_logs(appointment_id);
CREATE INDEX idx_visit_logs_manager_date ON public.visit_logs(manager_id, arrival_time);
CREATE INDEX idx_notifications_manager_scheduled ON public.notifications(manager_id, scheduled_for);
CREATE INDEX idx_daily_schedules_manager_date ON public.daily_schedules(manager_id, schedule_date);
