-- Fix Recordings RLS Policy
-- Allow public insert access for recordings (needed for interview page to save recordings)

-- Drop existing public update policy if it exists
DROP POLICY IF EXISTS "Public can create recordings" ON recordings;

-- Allow anyone to insert recordings (for interview sessions)
CREATE POLICY "Public can create recordings"
  ON recordings FOR INSERT
  WITH CHECK (true);

-- Also allow public read access
DROP POLICY IF EXISTS "Public can read recordings" ON recordings;

CREATE POLICY "Public can read recordings"
  ON recordings FOR SELECT
  USING (true);
