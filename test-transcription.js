/**
 * Test Transcription
 * Manually test Deepgram transcription
 */

const { createClient } = require('@deepgram/sdk');

const deepgramApiKey = 'e5d382ac23c03136e6eb94fe2343ecb0a2ec65a4';

async function testTranscription() {
  console.log('🧪 Testing Deepgram Transcription...\n');

  try {
    // Initialize Deepgram
    const deepgram = createClient(deepgramApiKey);

    // Test with a sample audio URL
    // Using a public test audio file
    const testUrl = 'https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav';

    console.log('1️⃣ Testing with sample audio URL...');
    console.log('   URL:', testUrl);

    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
      { url: testUrl },
      {
        model: 'nova-2',
        smart_format: true,
        punctuate: true,
      }
    );

    if (error) {
      console.error('❌ Deepgram error:', error);
      return;
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = result?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

    console.log('\n✅ Transcription successful!');
    console.log('   Transcript:', transcript);
    console.log('   Confidence:', confidence);

    // Now test with Mux URL format
    console.log('\n2️⃣ Testing Mux audio URL format...');
    console.log('   Note: This will fail if we don\'t have a real Mux playback ID');

    // Get a recording from database to test
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabase = createSupabaseClient(
      'https://uhtuxvbwlttsrhcbxeou.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodHV4dmJ3bHR0c3JoY2J4ZW91Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzIwMzg0NSwiZXhwIjoyMDgyNzc5ODQ1fQ.VF8wOViUUST7ZV42ZfbCe50Ua6cmWVRacXPAbcWwZu0'
    );

    const { data: recordings } = await supabase
      .from('recordings')
      .select('*')
      .not('mux_playback_id', 'is', null)
      .limit(1);

    if (recordings && recordings.length > 0) {
      const recording = recordings[0];
      console.log('   Found recording:', recording.id);
      console.log('   Mux playback ID:', recording.mux_playback_id);
      console.log('   Mux asset ID:', recording.mux_asset_id);

      // Try different URL formats
      const urlFormats = [
        `https://stream.mux.com/${recording.mux_playback_id}/audio.m4a`,
        `https://stream.mux.com/${recording.mux_playback_id}.m4a`,
        `https://stream.mux.com/${recording.mux_asset_id}/audio.m4a`,
      ];

      for (const url of urlFormats) {
        console.log('\n   Trying URL:', url);
        try {
          const { result: muxResult, error: muxError } = await deepgram.listen.prerecorded.transcribeUrl(
            { url },
            {
              model: 'nova-2',
              smart_format: true,
              punctuate: true,
            }
          );

          if (muxError) {
            console.log('   ❌ Failed:', muxError.message);
          } else {
            const muxTranscript = muxResult?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
            console.log('   ✅ Success! Transcript:', muxTranscript.substring(0, 100) + '...');
            break;
          }
        } catch (err) {
          console.log('   ❌ Error:', err.message);
        }
      }
    } else {
      console.log('   ⚠️  No recordings with Mux playback ID found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTranscription();
