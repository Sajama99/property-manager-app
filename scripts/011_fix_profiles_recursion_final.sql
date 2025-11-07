-- Fix infinite recursion in profiles table RLS policies
-- The issue: policies were checking admin role by querying profiles table,
-- which triggered the same policies again, causing infinite recursion

-- Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create simple, non-recursive policies for profiles
-- These policies ONLY check auth.uid() and never query the profiles table

-- Allow users to view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- Allow users to insert their own profile (needed for signup)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- Note: We removed admin policies that caused recursion
-- If you need admin access, use the service role key or SECURITY DEFINER functions
