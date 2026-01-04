-- Fix Sessions RLS Policy
-- Drop and recreate the public read policy to ensure it works

-- Drop existing public read policy if it exists
DROP POLICY IF EXISTS "Public read access by session_id" ON sessions;

-- Recreate public read access for sessions
-- This allows unauthenticated users to read sessions (for interview page)
CREATE POLICY "Public read access by session_id"
  ON sessions FOR SELECT
  USING (true);
