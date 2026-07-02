/*
# HR Task Planner Schema

This migration creates the complete database schema for the HR Task Planner application,
migrating from local JSON storage to Supabase with multi-user support.

1. New Tables
- `profiles` - User profiles (linked to auth.users), stores display name, role (admin/user), preferences
- `locked_routines` - System-wide locked routines (admin managed), same fields as before
- `custom_routines` - User-specific custom routines, owner-scoped
- `months_data` - User's month data including week state and tracker state, owner-scoped
- `notes` - User notes and reminders, owner-scoped
- `monthly_archives` - Archived month snapshots, owner-scoped

2. Security
- Enable RLS on ALL tables
- Owner-scoped CRUD policies for user tables (custom_routines, months_data, notes, monthly_archives)
- Admin can manage locked_routines
- Users can read locked_routines but not modify them

3. Important Notes
- All owner columns have DEFAULT auth.uid() for seamless inserts
- Cascade deletes on foreign keys to maintain referential integrity
- Indexes on frequently queried columns (user_id, month keys)
*/

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  theme_mode text NOT NULL DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Admin can read all profiles
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
CREATE POLICY "admin_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. LOCKED ROUTINES TABLE (Admin managed, visible to all)
CREATE TABLE IF NOT EXISTS locked_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  time text,
  cls text DEFAULT 'tp-gen',
  week text DEFAULT 'all',
  day text DEFAULT 'all',
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE locked_routines ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read
DROP POLICY IF EXISTS "authenticated_read_locked_routines" ON locked_routines;
CREATE POLICY "authenticated_read_locked_routines" ON locked_routines FOR SELECT
  TO authenticated USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "admin_insert_locked_routines" ON locked_routines;
CREATE POLICY "admin_insert_locked_routines" ON locked_routines FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_locked_routines" ON locked_routines;
CREATE POLICY "admin_update_locked_routines" ON locked_routines FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_locked_routines" ON locked_routines;
CREATE POLICY "admin_delete_locked_routines" ON locked_routines FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. CUSTOM ROUTINES TABLE (User-specific)
CREATE TABLE IF NOT EXISTS custom_routines (
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

CREATE INDEX IF NOT EXISTS idx_custom_routines_user_id ON custom_routines(user_id);

ALTER TABLE custom_routines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_custom_routines" ON custom_routines;
CREATE POLICY "select_own_custom_routines" ON custom_routines FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_custom_routines" ON custom_routines;
CREATE POLICY "insert_own_custom_routines" ON custom_routines FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_custom_routines" ON custom_routines;
CREATE POLICY "update_own_custom_routines" ON custom_routines FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_custom_routines" ON custom_routines;
CREATE POLICY "delete_own_custom_routines" ON custom_routines FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 4. MONTHS DATA TABLE (User's week/tracker state)
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

-- 5. NOTES TABLE (User notes)
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

-- 6. MONTHLY ARCHIVES TABLE
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

-- 7. FUNCTION TO AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. SEED DEFAULT LOCKED ROUTINES (same as hardcoded ones)
INSERT INTO locked_routines (text, time, cls, week, day, sort_order) VALUES
  ('Daily team meeting', '09:00–09:15', 'tp-mtg', 'all', 'all', 1),
  ('Import work time into HR program', '09:15–09:30', 'tp-imp', 'all', 'Monday,Thursday,Saturday', 2),
  ('Collect leave letters: Resort, Boutique & Manee Inn (1.5 hrs travel)', '10:00–11:30', 'tp-am', 'all', 'Wednesday,Saturday', 3),
  ('Create work schedule for all 4 branches (due before day 25)', '10:00–12:00', 'tp-dead', '3', 'Monday', 4),
  ('Check employee time arrive & leave records (due before day 25)', '10:00–11:30', 'tp-dead', '3', 'Wednesday', 5),
  ('Create arrive late report (due before day 25)', '13:00–14:00', 'tp-dead', '3', 'Friday', 6),
  ('Entry leave letters into HR program', '15:00–17:00', 'tp-pm', 'all', 'all', 7),
  ('Update and announce QT before end of day', '16:30–17:00', 'tp-pm', 'all', 'Saturday', 8),
  ('Clear employee resign letters & resign folders', '10:00–11:00', 'tp-dead', 'day30', 'all', 9),
  ('Check resigned employees returned uniforms', '11:00–11:30', 'tp-dead', 'day30', 'all', 10)
ON CONFLICT DO NOTHING;

-- 9. SEED DEFAULT NOTES (for new users - handled in app, not seeded globally)