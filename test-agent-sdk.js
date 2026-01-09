/**
 * Test ElevenLabs Agent SDK Integration
 */

const { Conversation } = require('@elevenlabs/elevenlabs-js');

const ELEVENLABS_API_KEY = '56e2ab7528e35761f095cf4416f19eaf02624180242dec0e8995a248908e3065';
const AGENT_ID = 'agent_4101kdx8y3mvfk9vxvwxj1y7wt36';

async function testAgentSDK() {
  console.log('🧪 Testing ElevenLabs Agent SDK...\n');

  try {
    console.log('Creating conversation with agent:', AGENT_ID);

    const conversation = await Conversation.create({
      apiKey: ELEVENLABS_API_KEY,
      agentId: AGENT_ID,
    });

    console.log('✅ Conversation created successfully!\n');

    // Test evaluation request
    const testQuestion = "Tell me about a time when you had to work with a difficult team member. How did you handle it?";
    const testAnswer = "I had a team member who was constantly negative. I approached them privately to understand their concerns. They were overwhelmed with work. I helped redistribute tasks and things improved significantly.";

    const evaluationRequest = `
I need you to evaluate this candidate's interview answer.

QUESTION: "${testQuestion}"

EVALUATION CRITERIA:
1. Describes a specific situation with context
2. Explains their approach to handling the difficulty
3. Shows self-awareness and emotional intelligence
4. Discusses the outcome and lessons learned

CANDIDATE'S ANSWER: "${testAnswer}"

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

    const response = await conversation.sendMessage({
      text: evaluationRequest,
    });

    console.log('📥 Agent response:');
    console.log(response.text);
    console.log('\n');

    // Try to parse JSON
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('✅ Parsed evaluation:');
      console.log(JSON.stringify(parsed, null, 2));
    }

    // End conversation
    await conversation.endSession();
    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

testAgentSDK();
