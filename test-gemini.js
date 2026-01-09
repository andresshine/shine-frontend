/**
 * Test Gemini Integration
 * Quick test script to verify Gemini API is working
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  console.log("🧪 Testing Gemini Integration...\n");

  // Check if API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in environment variables");
    console.log("Make sure .env.local has GEMINI_API_KEY set");
    process.exit(1);
  }

  console.log("✅ API key found");
  console.log(`   Key: ${process.env.GEMINI_API_KEY.substring(0, 20)}...`);

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("\n🤖 Sending test prompt to Gemini...");

    // Test prompt
    const result = await model.generateContent(
      "Say hello and confirm you're working correctly. Keep it brief."
    );
    const response = await result.response;
    const text = response.text();

    console.log("\n✅ Gemini Response:");
    console.log(`   ${text}`);

    // Test answer evaluation
    console.log("\n🎯 Testing answer evaluation...");

    const evaluationPrompt = `You are an AI interview producer evaluating video testimonial answers.

Question: What do you like most about our product?

User's Answer:
I really love how easy it is to use. The interface is intuitive and I was able to get started right away without any training. It's saved me hours every week.

Evaluate this answer based on:
1. Completeness - Does it fully answer the question?
2. Clarity - Is it well-articulated and easy to understand?
3. Length - Is it an appropriate length (30-90 seconds when spoken)?
4. Marketing value - Would this make good marketing content?

Respond in JSON format:
{
  "score": <number 0-100>,
  "isComplete": <boolean>,
  "feedback": "<brief feedback>",
  "followUp": "<optional follow-up question if score < 80, otherwise null>"
}`;

    const evalResult = await model.generateContent(evaluationPrompt);
    const evalResponse = await evalResult.response;
    const evalText = evalResponse.text();

    console.log("\n✅ Evaluation Response:");
    console.log(evalText);

    // Try to parse as JSON
    const jsonMatch = evalText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log("\n📊 Parsed Evaluation:");
      console.log(`   Score: ${parsed.score}/100`);
      console.log(`   Complete: ${parsed.isComplete}`);
      console.log(`   Feedback: ${parsed.feedback}`);
      if (parsed.followUp) {
        console.log(`   Follow-up: ${parsed.followUp}`);
      }
    }

    console.log("\n✅ All tests passed! Gemini is ready to use.");
  } catch (error) {
    console.error("\n❌ Error testing Gemini:");
    console.error(error.message);
    process.exit(1);
  }
}

testGemini();
