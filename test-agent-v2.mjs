/**
 * Test V2 Agent Implementation
 * Shows exact WebSocket payload structure
 */

import WebSocket from 'ws';

const ELEVENLABS_API_KEY = 'sk_2843df5ad496d7859c32bca009e7639696be82b647ed5897';
const AGENT_ID = 'agent_4101kdx8y3mvfk9vxvwxj1y7wt36';

const EVALUATION_SYSTEM_PROMPT = `# Role
You are an AI interview evaluator for Shine. Your job is to evaluate if a candidate's answer to an interview question is complete and satisfactory.

# Instructions
You will receive:
1. A question
2. Evaluation criteria for that question
3. The candidate's transcript

Your job:
- Evaluate if the answer addresses ALL criteria
- If YES → Return APPROVED with score
- If NO → Return FOLLOW_UP with a specific follow-up question

# Response Format
You MUST respond with ONLY valid JSON in this exact format:
{
  "decision": "APPROVED" or "FOLLOW_UP",
  "reasoning": "brief explanation",
  "followUpText": "specific follow-up question (only if FOLLOW_UP)",
  "score": 0-100
}

CRITICAL: Return ONLY the JSON object, no markdown, no explanation, no other text.`;

async function testV2() {
  console.log('🧪 Testing V2 Agent Implementation\n');

  try {
    // Get signed URL
    console.log('1️⃣ Getting signed WebSocket URL...');
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed: ${JSON.stringify(error)}`);
    }

    const { signed_url } = await response.json();
    console.log('✅ Got signed URL\n');

    // Connect WebSocket
    console.log('2️⃣ Connecting to WebSocket...');
    const ws = new WebSocket(signed_url);

    let agentResponse = '';

    ws.on('open', () => {
      console.log('✅ WebSocket connected!\n');

      // THIS IS THE CRITICAL PAYLOAD
      const initiationPayload = {
        type: 'conversation_initiation_client_data',
        conversation_config_override: {
          agent: {
            prompt: {
              prompt: EVALUATION_SYSTEM_PROMPT,
              llm: 'gemini-2.5-flash',
              temperature: 0,
            },
            first_message: true,
          },
          conversation: {
            text_only: true,
          },
        },
      };

      console.log('3️⃣ SENDING INITIAL PAYLOAD:');
      console.log('==========================================');
      console.log(JSON.stringify(initiationPayload, null, 2));
      console.log('==========================================\n');

      ws.send(JSON.stringify(initiationPayload));

      // Send evaluation request
      setTimeout(() => {
        const testQuestion = "Tell me about a time when you had to work with a difficult team member. How did you handle it?";
        const testAnswer = "I worked with someone who was negative. I talked to them privately and helped them.";
        const testCriteria = [
          "Describes a specific situation with context",
          "Explains their approach to handling the difficulty",
          "Shows self-awareness and emotional intelligence",
          "Discusses the outcome and lessons learned"
        ];

        const evaluationMessage = `
Question: "${testQuestion}"

Evaluation Criteria:
${testCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Candidate's Answer: "${testAnswer}"

Evaluate now and return JSON only.`;

        console.log('4️⃣ Sending evaluation request...\n');
        ws.send(JSON.stringify({
          type: 'user_message',
          text: evaluationMessage,
        }));
      }, 1500);
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log(`📥 [${message.type}]:`, message.text || '(no text)');

      if (message.type === 'agent_response') {
        agentResponse += message.text + ' ';
      }

      if (message.type === 'agent_response_complete' || message.type === 'conversation_complete') {
        console.log('\n✅ FULL AGENT RESPONSE:');
        console.log('==========================================');
        console.log(agentResponse);
        console.log('==========================================\n');

        // Try to parse
        const cleaned = agentResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('✅ PARSED EVALUATION:');
            console.log(JSON.stringify(parsed, null, 2));
          } catch (e) {
            console.log('❌ Could not parse JSON');
          }
        }

        ws.close();
        console.log('\n✅ Test complete!');
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testV2();
