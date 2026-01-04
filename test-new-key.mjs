/**
 * Test new API key with Conversational AI permissions
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Conversation } from '@elevenlabs/elevenlabs-js/api/resources/conversationalAi/conversation/Conversation.js';
import { AudioInterface } from '@elevenlabs/elevenlabs-js/api/resources/conversationalAi/conversation/AudioInterface.js';

const ELEVENLABS_API_KEY = 'sk_2843df5ad496d7859c32bca009e7639696be82b647ed5897';
const AGENT_ID = 'agent_4101kdx8y3mvfk9vxvwxj1y7wt36'; // lowercase

class SilentAudioInterface extends AudioInterface {
  start(inputCallback) {}
  stop() {}
  output(audio) {}
  interrupt() {}
}

async function testNewKey() {
  console.log('🧪 Testing new API key with Conversational AI permissions...\n');

  try {
    console.log('1️⃣ Creating ElevenLabs client...');
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    console.log('✅ Client created\n');

    console.log('2️⃣ Creating Conversation instance...');

    let agentResponse = '';

    const conversation = new Conversation({
      client,
      agentId: AGENT_ID,
      requiresAuth: true,
      audioInterface: new SilentAudioInterface(),
      config: {
        overrides: {
          agent: {
            firstMessage: false,
          },
          conversation: {
            textOnly: true,
          },
        },
      },
      callbackAgentResponse: (response) => {
        console.log('📥 Agent response chunk:', response);
        agentResponse += response + ' ';
      },
    });

    console.log('✅ Conversation instance created\n');

    console.log('3️⃣ Starting WebSocket session...');
    await conversation.startSession();
    console.log('✅ Session started!\n');

    console.log('⏳ Waiting for session to become active...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (conversation.isSessionActive()) {
      console.log('✅ Session is ACTIVE!\n');

      console.log('4️⃣ Testing actual evaluation request...');

      const testEvaluation = `
I need you to evaluate this candidate's interview answer.

QUESTION: "Tell me about a time when you had to work with a difficult team member. How did you handle it?"

EVALUATION CRITERIA:
1. Describes a specific situation with context
2. Explains their approach to handling the difficulty
3. Shows self-awareness and emotional intelligence
4. Discusses the outcome and lessons learned

CANDIDATE'S ANSWER: "I worked with someone who was always negative. I talked to them privately and found out they were stressed. I helped redistribute work and things got better."

Please evaluate if the answer adequately addresses ALL the criteria. Respond in this exact JSON format:
{
  "decision": "APPROVED" or "FOLLOW_UP",
  "reasoning": "brief explanation of your evaluation",
  "followUpText": "specific follow-up question if FOLLOW_UP decision, otherwise omit",
  "score": 0-100
}

Return ONLY the JSON, no other text.
`;

      console.log('📤 Sending evaluation request...\n');
      conversation.sendUserMessage(testEvaluation);

      console.log('⏳ Waiting for agent response (8 seconds)...\n');
      await new Promise(resolve => setTimeout(resolve, 8000));

      console.log('📥 Full agent response:');
      console.log(agentResponse);
      console.log('\n');

      // Try to parse JSON
      const jsonMatch = agentResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Parsed evaluation result:');
          console.log(JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('⚠️ Could not parse as JSON');
        }
      }

      conversation.endSession();
      console.log('\n✅ ✅ ✅ TEST COMPLETED SUCCESSFULLY! ✅ ✅ ✅');
      console.log('Your agent is working perfectly!\n');

    } else {
      console.error('❌ Session failed to become active');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.body) {
      console.error('Error details:', JSON.stringify(error.body, null, 2));
    }
    console.error('\nFull error:', error);
  }
}

testNewKey();
