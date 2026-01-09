/**
 * Test API Routes
 * Run with: node test-api-routes.js
 * Make sure dev server is running on localhost:3000
 */

const API_BASE = 'http://localhost:3000';
const SESSION_ID = 'session_abc123';

async function testAPI() {
  console.log('🧪 Testing API Routes...\n');

  try {
    // Test 1: Update session progress
    console.log('1️⃣ Testing PUT /api/sessions/:id/progress');
    const progressResponse = await fetch(`${API_BASE}/api/sessions/${SESSION_ID}/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentQuestionIndex: 2,
        status: 'in_progress'
      })
    });

    if (!progressResponse.ok) {
      console.error('❌ Progress update failed:', await progressResponse.text());
    } else {
      const progressData = await progressResponse.json();
      console.log('✅ Progress updated:', progressData);
    }

    // Test 2: Create a recording
    console.log('\n2️⃣ Testing POST /api/sessions/:id/recordings');
    const createResponse = await fetch(`${API_BASE}/api/sessions/${SESSION_ID}/recordings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId: 'q_role_001',
        questionIndex: 0,
        muxAssetId: 'test_asset_123'
      })
    });

    if (!createResponse.ok) {
      console.error('❌ Recording creation failed:', await createResponse.text());
    } else {
      const createData = await createResponse.json();
      console.log('✅ Recording created:', createData);
    }

    // Test 3: Get all recordings
    console.log('\n3️⃣ Testing GET /api/sessions/:id/recordings');
    const getResponse = await fetch(`${API_BASE}/api/sessions/${SESSION_ID}/recordings`);

    if (!getResponse.ok) {
      console.error('❌ Get recordings failed:', await getResponse.text());
    } else {
      const getData = await getResponse.json();
      console.log('✅ Recordings fetched:', getData.recordings.length, 'recordings');
      getData.recordings.forEach((r, i) => {
        console.log(`   ${i + 1}. Question ${r.question_index} - Status: ${r.video_status}`);
      });
    }

    console.log('\n🎉 All API tests completed!\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testAPI();
