/**
 * Test ElevenLabs Agent with correct ID
 */

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';
const AGENT_ID = 'agent_4101kdx8y3mvfk9vxvwxj1y7wt36'; // Lowercase

async function testAgent() {
  console.log('🤖 Testing with correct agent ID:', AGENT_ID);
  console.log('\n');

  // According to ElevenLabs docs, Conversational AI agents typically work via WebSocket
  // But let's try a few potential REST endpoints

  const endpoints = [
    // Get agent details
    {
      name: 'Get Agent Details',
      method: 'GET',
      url: `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`,
      body: null,
    },
    // Try to invoke agent with text
    {
      name: 'Agent Text Endpoint (if exists)',
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}/text`,
      body: {
        text: 'Please evaluate this answer: I worked with a difficult team member by having a private conversation to understand their concerns.'
      },
    },
  ];

  for (const endpoint of endpoints) {
    console.log(`📡 ${endpoint.name}`);
    console.log(`${endpoint.method} ${endpoint.url}\n`);

    try {
      const options = {
        method: endpoint.method,
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, options);
      console.log(`Status: ${response.status} ${response.statusText}`);

      const text = await response.text();

      if (response.ok) {
        console.log('✅ Success!');
        try {
          const json = JSON.parse(text);
          console.log(JSON.stringify(json, null, 2));
        } catch {
          console.log(text);
        }
      } else {
        console.log('❌ Error:', text);
      }
    } catch (error) {
      console.error('❌ Exception:', error.message);
    }

    console.log('\n');
  }

  console.log('ℹ️  Note: ElevenLabs Conversational AI agents are designed for real-time');
  console.log('   voice conversations via WebSocket, not REST API text evaluation.');
  console.log('   For interview evaluation, the content-based analysis is recommended.');
}

testAgent();
