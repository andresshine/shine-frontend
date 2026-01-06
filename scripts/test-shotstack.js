/**
 * Test Shotstack Post-Production Pipeline
 *
 * Usage:
 *   node scripts/test-shotstack.js
 *
 * Make sure to add SHOTSTACK_API_KEY to .env.local first!
 */

const fetch = require('node-fetch');

const TEST_PAYLOAD = {
  videoUrl: 'https://shotstack-assets.s3.amazonaws.com/footage/beach-overhead.mp4',
  quoteText: "What's your role and team size?",
  theme: {
    primaryColor: '#D4AF37',
    secondaryColor: '#C9A961',
    tertiaryColor: '#B8994A',
    fontFamily: 'Inter',
    backgroundType: 'color',
    backgroundColor: '#1a1a1a',
  },
  musicUrl: 'https://shotstack-assets.s3.amazonaws.com/music/unminus/ambisax.mp3',
  duration: 10, // Short duration for testing
};

async function testProduction() {
  console.log('🎬 Testing Shotstack Production Pipeline...\n');

  try {
    // Step 1: Trigger production
    console.log('📤 Sending production request...');
    const produceResponse = await fetch('http://localhost:3000/api/shotstack/produce', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_PAYLOAD),
    });

    const produceData = await produceResponse.json();

    if (!produceData.success) {
      console.error('❌ Production failed:', produceData.error);
      return;
    }

    console.log('✅ Production started!');
    console.log('   Render ID:', produceData.renderId);
    console.log('   Status:', produceData.status);
    console.log('');

    const renderId = produceData.renderId;

    // Step 2: Poll for status
    console.log('📊 Polling for render status...\n');

    let attempts = 0;
    const maxAttempts = 60; // Poll for up to 5 minutes

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await fetch(`http://localhost:3000/api/shotstack/status/${renderId}`);
      const statusData = await statusResponse.json();

      if (!statusData.success) {
        console.error('❌ Status check failed:', statusData.error);
        break;
      }

      console.log(`   [${attempts + 1}] Status: ${statusData.status} - Progress: ${statusData.progress}%`);

      if (statusData.status === 'done') {
        console.log('\n✅ Render complete!');
        console.log('   Video URL:', statusData.url);
        console.log('   Mux Asset ID:', statusData.muxAssetId);
        break;
      }

      if (statusData.status === 'failed') {
        console.log('\n❌ Render failed!');
        console.log('   Error:', statusData.error);
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('\n⏱️ Timeout: Max polling attempts reached');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProduction();
