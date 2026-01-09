/**
 * Delete Old Test Recordings
 * Remove old recordings and their Mux assets to free up space
 */

const Mux = require('@mux/mux-node').default;
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const mux = new Mux({
  tokenId: '05b6e00e-de22-470e-b287-72669b4473f0',
  tokenSecret: 'pAEDg7JWnIosdluVoMCl5cvTHSajvCEem45ZVpONBpiKBBl8J7DYwWshHATWNn63x3ogGGRU+eY',
});

const supabase = createSupabaseClient(
  'https://uhtuxvbwlttsrhcbxeou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
);

async function deleteOldRecordings() {
  console.log('🗑️  Deleting old test recordings...\n');

  // Get oldest 7 recordings (keep only the 3 most recent)
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(7);

  if (error) {
    console.error('❌ Error fetching recordings:', error);
    return;
  }

  if (!recordings || recordings.length === 0) {
    console.log('No recordings to delete');
    return;
  }

  console.log(`Deleting ${recordings.length} old recordings:\n`);

  for (const recording of recordings) {
    console.log(`📹 Recording: ${recording.id}`);
    console.log(`   Created: ${recording.created_at}`);
    console.log(`   Mux Asset: ${recording.mux_asset_id || 'none'}`);

    // Delete from Mux if asset exists
    if (recording.mux_asset_id && recording.mux_asset_id !== 'test_asset_123') {
      try {
        await mux.video.assets.delete(recording.mux_asset_id);
        console.log(`   ✅ Deleted Mux asset`);
      } catch (muxError) {
        console.log(`   ⚠️  Mux delete failed: ${muxError.message}`);
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('recordings')
      .delete()
      .eq('id', recording.id);

    if (deleteError) {
      console.log(`   ❌ Database delete failed: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted from database`);
    }

    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('✅ Cleanup complete!');
}

deleteOldRecordings();
