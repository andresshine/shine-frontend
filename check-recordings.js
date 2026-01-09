/**
 * Check Recordings Status
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uhtuxvbwlttsrhcbxeou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
);

async function checkRecordings() {
  console.log('🔍 Checking recordings...\n');

  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!recordings || recordings.length === 0) {
    console.log('⚠️  No recordings found');
    return;
  }

  console.log(`Found ${recordings.length} recordings:\n`);

  recordings.forEach((rec, i) => {
    console.log(`${i + 1}. Recording ID: ${rec.id}`);
    console.log(`   Question: ${rec.question_id} (index ${rec.question_index})`);
    console.log(`   Mux Asset ID: ${rec.mux_asset_id || 'NOT SET'}`);
    console.log(`   Mux Playback ID: ${rec.mux_playback_id || 'NOT SET'}`);
    console.log(`   Video Status: ${rec.video_status}`);
    console.log(`   Transcript Status: ${rec.transcript_status || 'NOT SET'}`);
    console.log(`   Transcript: ${rec.transcript ? rec.transcript.substring(0, 50) + '...' : 'NULL'}`);
    console.log(`   Created: ${rec.created_at}`);
    console.log('');
  });
}

checkRecordings();
