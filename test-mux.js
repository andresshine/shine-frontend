/**
 * Test Mux Integration
 * Run with: node test-mux.js
 */

async function testMux() {
  console.log('🧪 Testing Mux Integration...\n');

  try {
    // Test 1: Get direct upload URL
    console.log('1️⃣ Testing POST /api/mux/upload');
    const response = await fetch('http://localhost:3000/api/mux/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to get upload URL:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Upload URL generated:');
    console.log('   Upload ID:', data.uploadId);
    console.log('   Upload URL:', data.uploadUrl.substring(0, 50) + '...');

    console.log('\n🎉 Mux integration is working!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testMux();
