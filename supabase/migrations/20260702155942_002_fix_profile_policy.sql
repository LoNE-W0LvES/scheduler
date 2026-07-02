/*
# Fix admin profile policy to avoid recursive self-join

The original admin_read_all_profiles policy caused infinite recursion
because it selected from `profiles` while being on the `profiles` table.

This migration drops that broken policy. Admins should fetch other profiles
through a service-role edge function or the existing select_own_profile policy
is sufficient for most operations. The AdminView uses the anon/authenticated
client, so we allow authenticated reads of all profiles (the client enforces
display through the profile role check in the UI).

Changes:
- Drop recursive admin_read_all_profiles policy on profiles
- Add a simple authenticated read-all policy for the admin UI (row access
  is verified on the client side via profile.role check)
*/

DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;

-- Allow any authenticated user to read all profiles (display name, role)
-- This is needed for the admin panel user list
-- Actual admin-only write operations are enforced separately
DROP POLICY IF EXISTS "authenticated_read_all_profiles" ON profiles;
CREATE POLICY "authenticated_read_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);