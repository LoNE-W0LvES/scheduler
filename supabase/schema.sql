/*
# Scheduler Master Database Schema
# Complete, unified schema with Row Level Security (RLS) for clean database initialization.
# Every new user starts with a clean slate.
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. UTILITY FUNCTIONS & MIGRATION CLEANUP
-- ==========================================

-- Clean up any old table structures if migrating on an existing DB
ALTER TABLE IF EXISTS custom_routines RENAME TO routines;
DROP TABLE IF EXISTS locked_routines CASCADE;

-- Auto-update `updated_at` timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Revoke direct API execution on trigger utility function
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- ==========================================
-- 1. PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  theme_mode text NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
  language text DEFAULT 'en',
  off_days text DEFAULT 'Sunday',
  week_settings text DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure columns exist if table already existed
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS off_days text DEFAULT 'Sunday';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS week_settings text DEFAULT '{}';

-- Helper function to safely check if current auth user is an Admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public;

-- Revoke public API execution on is_admin helper function from anon, but grant to authenticated for RLS
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Trigger for auto updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to prevent non-admins from changing user roles (prevents privilege escalation)
CREATE OR REPLACE FUNCTION public.protect_role_column()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Access denied: Only admins can change user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct API execution on trigger function
REVOKE EXECUTE ON FUNCTION public.protect_role_column() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS ensure_role_protection ON profiles;
CREATE TRIGGER ensure_role_protection
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_role_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (needed for display names & admin management)
DROP POLICY IF EXISTS "select_profiles" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "authenticated_read_all_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

-- Allow users to insert their own profile
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile OR admins to update any profile (e.g. role changes)
DROP POLICY IF EXISTS "update_profiles" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_profiles" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id OR public.is_admin()) WITH CHECK (auth.uid() = id OR public.is_admin());

-- Allow users to delete their own profile OR admins to delete profiles
DROP POLICY IF EXISTS "delete_profiles" ON profiles;
CREATE POLICY "delete_profiles" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id OR public.is_admin());


-- ==========================================
-- 2. ROUTINES TABLE (User-specific routines)
-- ==========================================
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  time text,
  cls text DEFAULT 'tp-gen',
  week text DEFAULT 'all',
  day text DEFAULT 'all',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routines_user_id ON routines(user_id);

DROP TRIGGER IF EXISTS update_routines_updated_at ON routines;
CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_routines" ON routines;
CREATE POLICY "select_own_routines" ON routines FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_routines" ON routines;
CREATE POLICY "insert_own_routines" ON routines FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_routines" ON routines;
CREATE POLICY "update_own_routines" ON routines FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_routines" ON routines;
CREATE POLICY "delete_own_routines" ON routines FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ==========================================
-- 3. MONTHS DATA TABLE (User week/tracker state)
-- ==========================================
CREATE TABLE IF NOT EXISTS months_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  week_state jsonb DEFAULT '{}',
  tracker_state jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_months_data_user_id ON months_data(user_id);
CREATE INDEX IF NOT EXISTS idx_months_data_year_month ON months_data(year, month);

DROP TRIGGER IF EXISTS update_months_data_updated_at ON months_data;
CREATE TRIGGER update_months_data_updated_at
  BEFORE UPDATE ON months_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE months_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_months_data" ON months_data;
CREATE POLICY "select_own_months_data" ON months_data FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_months_data" ON months_data;
CREATE POLICY "insert_own_months_data" ON months_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_months_data" ON months_data;
CREATE POLICY "update_own_months_data" ON months_data FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_months_data" ON months_data;
CREATE POLICY "delete_own_months_data" ON months_data FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ==========================================
-- 4. NOTES TABLE (User notes)
-- ==========================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  icon text DEFAULT '📌',
  text text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ==========================================
-- 5. MONTHLY ARCHIVES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS monthly_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month >= 1 AND month <= 12),
  label text NOT NULL,
  total_tasks int DEFAULT 0,
  done_tasks int DEFAULT 0,
  skipped_tasks int DEFAULT 0,
  percentage int DEFAULT 0,
  task_log jsonb DEFAULT '[]',
  closed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_archives_user_id ON monthly_archives(user_id);
CREATE INDEX IF NOT EXISTS idx_monthly_archives_year_month ON monthly_archives(year, month);

ALTER TABLE monthly_archives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_monthly_archives" ON monthly_archives;
CREATE POLICY "select_own_monthly_archives" ON monthly_archives FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_monthly_archives" ON monthly_archives;
CREATE POLICY "insert_own_monthly_archives" ON monthly_archives FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_monthly_archives" ON monthly_archives;
CREATE POLICY "delete_own_monthly_archives" ON monthly_archives FOR DELETE
  TO authenticated USING (auth.uid() = user_id);


-- ==========================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revoke direct API execution on auth trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 7. LEGACY SECURITY & LINT REMEDIATIONS
-- ==========================================
-- Ensure any legacy or test utility functions (such as rls_auto_enable) have search_path locked down and API execution revoked
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'rls_auto_enable' AND pronamespace = 'public'::regnamespace) THEN
    ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
