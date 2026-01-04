/**
 * Test ElevenLabs Conversational AI Agent
 */

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';
const ELEVENLABS_AGENT_ID = 'Agent_4101kdx8y3mvfk9vxvwxj1y7wt36';

async function testAgent() {
  console.log('🤖 Testing ElevenLabs Conversational AI Agent...');
  console.log('API Key:', ELEVENLABS_API_KEY.substring(0, 10) + '...');
  console.log('Agent ID:', ELEVENLABS_AGENT_ID);

  const testTranscript = `I had to work with a difficult team member who was constantly negative. I approached them privately to understand their concerns, and discovered they were overwhelmed. I helped redistribute some tasks and things improved significantly.`;

  const questionText = "Tell me about a time when you had to work with a difficult team member. How did you handle it?";

  const evaluationPrompt = `You are evaluating this candidate's answer to an interview question.

QUESTION: "${questionText}"

CANDIDATE'S ANSWER: "${testTranscript}"

Evaluate if the answer is complete and satisfactory. Return your decision in JSON format:
{
  "decision": "APPROVED" or "FOLLOW_UP",
  "reasoning": "brief explanation",
  "followUpText": "specific follow-up question if FOLLOW_UP",
  "score": 0-100
}`;

  // Try different endpoints
  const endpoints = [
    {
      name: 'GET Agent Info',
      method: 'GET',
      url: `https://api.elevenlabs.io/v1/convai/agents/${ELEVENLABS_AGENT_ID}`,
      body: null
    },
    {
      name: 'POST Conversational AI',
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/convai/conversation`,
      body: {
        agent_id: ELEVENLABS_AGENT_ID,
        text: evaluationPrompt,
      }
    },
    {
      name: 'Chat Completion Style',
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/chat/completions`,
      body: {
        model: ELEVENLABS_AGENT_ID,
        messages: [
          {
            role: 'system',
            content: 'You are an interview evaluator.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ]
      }
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n\n📡 Testing: ${endpoint.name}`);
    console.log(`${endpoint.method} ${endpoint.url}`);

    try {
      const fetchOptions = {
        method: endpoint.method,
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      };

      if (endpoint.body) {
        fetchOptions.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(endpoint.url, fetchOptions);

      console.log(`Status: ${response.status} ${response.statusText}`);

      const responseText = await response.text();
      console.log('Response:', responseText.substring(0, 500));

      if (response.ok) {
        console.log('✅ SUCCESS! This endpoint works!');
        try {
          const json = JSON.parse(responseText);
          console.log('Parsed JSON:', JSON.stringify(json, null, 2));
        } catch (e) {
          // Not JSON
        }
        break;
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }
}

testAgent();
