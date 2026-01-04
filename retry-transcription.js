/**
 * Retry Transcription
 * Manually retry transcription for failed recordings
 */

const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const { createClient: createDeepgramClient } = require('@deepgram/sdk');

const supabase = createSupabaseClient(
  'https://uhtuxvbwlttsrhcbxeou.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
);

const deepgram = createDeepgramClient('e5d382ac23c03136e6eb94fe2343ecb0a2ec65a4');

async function retryTranscription() {
  console.log('🔄 Retrying transcription for failed recordings...\n');

  // Get recordings with failed transcription that have playback IDs
  const { data: recordings, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('transcript_status', 'failed')
    .not('mux_playback_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching recordings:', error);
    return;
  }

  if (!recordings || recordings.length === 0) {
    console.log('✅ No failed recordings to retry');
    return;
  }

  console.log(`Found ${recordings.length} recordings to retry\n`);

  for (const recording of recordings) {
    console.log(`\n📹 Recording: ${recording.id}`);
    console.log(`   Playback ID: ${recording.mux_playback_id}`);
    console.log(`   Created: ${recording.created_at}`);

    // Use low.mp4 video file instead of audio.m4a (more reliably available)
    const videoUrl = `https://stream.mux.com/${recording.mux_playback_id}/low.mp4`;
    console.log(`   Video URL: ${videoUrl}`);

    // First, check if video URL is accessible
    try {
      const response = await fetch(videoUrl, { method: 'HEAD' });
      console.log(`   Video status: ${response.status}`);

      if (response.status !== 200) {
        console.log(`   ⏭️  Video not ready yet, skipping...`);
        continue;
      }
    } catch (checkError) {
      console.log(`   ❌ Error checking video: ${checkError.message}`);
      continue;
    }

    // Update status to processing
    await supabase
      .from('recordings')
      .update({ transcript_status: 'processing' })
      .eq('id', recording.id);

    try {
      console.log(`   🎙️  Starting transcription...`);

      const { result, error: deepgramError } = await deepgram.listen.prerecorded.transcribeUrl(
        { url: videoUrl },
        {
          model: 'nova-2',
          smart_format: true,
          punctuate: true,
        }
      );

      if (deepgramError) {
        console.error(`   ❌ Transcription failed:`, deepgramError);
        await supabase
          .from('recordings')
          .update({ transcript_status: 'failed' })
          .eq('id', recording.id);
      } else {
        const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

        console.log(`   ✅ Transcription complete!`);
        console.log(`   Confidence: ${(confidence * 100).toFixed(1)}%`);
        console.log(`   Transcript: "${transcript}"`);

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
      console.error(`   ❌ Transcription error:`, transcriptError);
      await supabase
        .from('recordings')
        .update({ transcript_status: 'failed' })
        .eq('id', recording.id);
    }

    // Wait 2 seconds between recordings
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n✅ Retry complete!');
}

retryTranscription();
