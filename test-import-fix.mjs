/**
 * Test the fixed import
 */

import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { Conversation } from '@elevenlabs/elevenlabs-js/api/resources/conversationalAi/conversation/Conversation.js';

console.log('✅ ElevenLabsClient:', typeof ElevenLabsClient);
console.log('✅ Conversation:', typeof Conversation);
console.log('✅ Conversation.prototype:', Conversation.prototype);

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';
const AGENT_ID = 'agent_4101kdx8y3mvfk9vxvwxj1y7wt36';

async function testConnection() {
  try {
    console.log('\n🧪 Creating ElevenLabs client...');
    const client = new ElevenLabsClient({
      apiKey: ELEVENLABS_API_KEY,
    });
    console.log('✅ Client created');

    console.log('\n🧪 Creating Conversation instance...');

    let responseText = '';

    const conversation = new Conversation({
      client,
      agentId: AGENT_ID,
      requiresAuth: true,
      audioInterface: {
        read: async () => new Uint8Array(0),
        write: async () => {},
      },
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
        console.log('📥 Agent said:', response);
        responseText += response;
      },
    });

    console.log('✅ Conversation instance created');

    console.log('\n🧪 Starting session...');
    await conversation.startSession();

    console.log('⏳ Waiting for session to be active...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    if (conversation.isSessionActive()) {
      console.log('✅ Session is active!');

      console.log('\n📤 Sending test message...');
      conversation.sendUserMessage('Hello, please respond with just "TEST OK"');

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('\n📥 Full response:', responseText);

      conversation.endSession();
      console.log('\n✅ Test completed successfully!');
    } else {
      console.error('❌ Session failed to start');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

testConnection();
