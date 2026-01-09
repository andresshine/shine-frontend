/**
 * Sync Mux Assets
 * Manually check Mux for asset status and update database
 */

const Mux = require('@mux/mux-node').default;
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { createClient: createDeepgramClient } = require('@deepgram/sdk');

// Initialize clients
const mux = new Mux({
  tokenId: '05b6e00e-de22-470e-b287-72669b4473f0',
  tokenSecret: 'pAEDg7JWnIosdluVoMCl5cvTHSajvCEem45ZVpONBpiKBBl8J7DYwWshHATWNn63x3ogGGRU+eY',
});

const supabase = createSupabaseClient(
  'https://uhtuxvbwlttsrhcbxeou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
);

const deepgram = createDeepgramClient('e5d382ac23c03136e6eb94fe2343ecb0a2ec65a4');

async function syncMuxAssets() {
  console.log('🔄 Syncing Mux assets...\n');

  // Get all recordings with processing status
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('video_status', 'processing')
    .not('mux_asset_id', 'is', null);

  if (error) {
    console.error('❌ Error fetching recordings:', error);
    return;
  }

  if (!recordings || recordings.length === 0) {
    console.log('✅ No recordings to sync');
    return;
  }

  console.log(`Found ${recordings.length} recordings to check\n`);

  for (const recording of recordings) {
    console.log(`\n📹 Recording: ${recording.id}`);
    console.log(`   Stored ID: ${recording.mux_asset_id}`);

    try {
      let asset;
      let assetId = recording.mux_asset_id;

      // Try to fetch as upload first (since we stored Upload IDs initially)
      try {
        const upload = await mux.video.uploads.retrieve(recording.mux_asset_id);
        console.log(`   Upload status: ${upload.status}`);

        if (upload.asset_id) {
          assetId = upload.asset_id;
          console.log(`   Found Asset ID: ${assetId}`);
          asset = await mux.video.assets.retrieve(assetId);
        } else {
          console.log(`   ⏳ Upload still processing, no asset yet`);
          continue;
        }
      } catch (uploadError) {
        // If it's not an upload ID, try as asset ID directly
        console.log(`   Trying as Asset ID...`);
        asset = await mux.video.assets.retrieve(recording.mux_asset_id);
      }

      console.log(`   Asset status: ${asset.status}`);

      if (asset.status === 'ready') {
        const playbackId = asset.playback_ids?.[0]?.id;

        console.log(`   ✅ Asset ready! Playback ID: ${playbackId}`);

        // Update database with actual Asset ID
        await supabase
          .from('recordings')
          .update({
            mux_asset_id: assetId, // Update with actual Asset ID
            video_status: 'ready',
            mux_playback_id: playbackId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recording.id);

        console.log(`   ✅ Database updated`);

        // Trigger transcription
        if (playbackId) {
          console.log(`   🎙️  Starting transcription...`);

          // Update transcript status
          await supabase
            .from('recordings')
            .update({ transcript_status: 'processing' })
            .eq('id', recording.id);

          try {
            // Transcribe audio
            const audioUrl = `https://stream.mux.com/${playbackId}/audio.m4a`;
            console.log(`   Audio URL: ${audioUrl}`);

            const { result, error: deepgramError } = await deepgram.listen.prerecorded.transcribeUrl(
              { url: audioUrl },
              {
                model: 'nova-2',
                smart_format: true,
                punctuate: true,
              }
            );

            if (deepgramError) {
              console.error(`   ❌ Transcription failed:`, deepgramError.message);
              await supabase
                .from('recordings')
                .update({ transcript_status: 'failed' })
                .eq('id', recording.id);
            } else {
              const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
              const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

              console.log(`   ✅ Transcription complete!`);
              console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
              console.log(`   Transcript preview: ${transcript.substring(0, 100)}...`);

              // Save transcript
              await supabase
                .from('recordings')
                .update({
                  transcript,
                  transcript_status: 'completed',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', recording.id);

              console.log(`   ✅ Transcript saved to database`);
            }
          } catch (transcriptError) {
            console.error(`   ❌ Transcription error:`, transcriptError.message);
            await supabase
              .from('recordings')
              .update({ transcript_status: 'failed' })
              .eq('id', recording.id);
          }
        }
      } else if (asset.status === 'errored') {
        console.log(`   ❌ Asset errored`);
        await supabase
          .from('recordings')
          .update({ video_status: 'error' })
          .eq('id', recording.id);
      } else {
        console.log(`   ⏳ Still processing...`);
      }
    } catch (muxError) {
      console.error(`   ❌ Mux error:`, muxError.message);
    }
  }

  console.log('\n\n✅ Sync complete!');
}

syncMuxAssets();
