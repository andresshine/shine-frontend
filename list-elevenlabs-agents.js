/**
 * List ElevenLabs Agents
 */

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';

async function listAgents() {
  console.log('🔍 Listing ElevenLabs resources...\n');

  const endpoints = [
    { name: 'List Agents', url: 'https://api.elevenlabs.io/v1/convai/agents' },
    { name: 'List Voices', url: 'https://api.elevenlabs.io/v1/voices' },
    { name: 'User Info', url: 'https://api.elevenlabs.io/v1/user' },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 ${endpoint.name}:`);
    console.log(`GET ${endpoint.url}`);

    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      console.log(`Status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
      } else {
        const error = await response.text();
        console.log('Error:', error);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

listAgents();
