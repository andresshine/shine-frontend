/**
 * Test ElevenLabs TTS API
 */

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'; // Adam - professional male voice

async function testTTS() {
  console.log('🎙️  Testing ElevenLabs TTS API...');
  console.log('API Key:', ELEVENLABS_API_KEY.substring(0, 10) + '...');
  console.log('Voice ID:', VOICE_ID);

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Hello, this is a test.',
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    console.log('\n📊 Response Status:', response.status, response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ Error Response Body:', errorText);
      return;
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('\n✅ Success! Audio buffer size:', audioBuffer.byteLength, 'bytes');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testTTS();
