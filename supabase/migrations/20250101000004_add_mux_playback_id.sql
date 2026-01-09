-- Add Mux Playback ID to recordings table
-- This stores the Mux playback ID for video playback

ALTER TABLE recordings
ADD COLUMN IF NOT EXISTS mux_playback_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recordings_mux_playback_id
  ON recordings(mux_playback_id);
