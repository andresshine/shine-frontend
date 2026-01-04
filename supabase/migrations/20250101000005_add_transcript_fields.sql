-- Add Transcript Fields to Recordings Table
-- This stores the transcript and transcription status for each recording

ALTER TABLE recordings
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS transcript_status TEXT DEFAULT 'pending' CHECK (transcript_status IN ('pending', 'processing', 'completed', 'failed'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_recordings_transcript_status
  ON recordings(transcript_status);

-- Update existing rows to have pending status
UPDATE recordings
SET transcript_status = 'pending'
WHERE transcript_status IS NULL;
