/**
 * Test Gemini API Route
 * Tests the /api/gemini/evaluate endpoint
 */

async function testApiRoute() {
  console.log("🧪 Testing Gemini API Route...\n");

  const testData = {
    question: "What do you like most about our product?",
    answer: "I really love how easy it is to use. The interface is intuitive and I was able to get started right away without any training. It's saved me hours every week.",
    context: "This is a customer testimonial for a SaaS product"
  };

  try {
    console.log("📤 Sending request to /api/gemini/evaluate...");
    console.log("Question:", testData.question);
    console.log("Answer:", testData.answer);
    console.log("");

    const response = await fetch("http://localhost:3000/api/gemini/evaluate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("✅ Response received:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.evaluation) {
      console.log("\n📊 Evaluation Summary:");
      console.log(`   Score: ${result.evaluation.score}/100`);
      console.log(`   Complete: ${result.evaluation.isComplete}`);
      console.log(`   Feedback: ${result.evaluation.feedback}`);
      if (result.evaluation.followUp) {
        console.log(`   Follow-up: ${result.evaluation.followUp}`);
      }
      console.log("\n✅ API route is working correctly!");
    } else {
      console.log("\n⚠️  Unexpected response format");
    }
  } catch (error) {
    console.error("\n❌ Error testing API route:");
    console.error(error.message);
    console.log("\nMake sure:");
    console.log("1. The dev server is running (npm run dev)");
    console.log("2. GEMINI_API_KEY is set in .env.local");
    console.log("3. The server is accessible at http://localhost:3000");
  }
}

testApiRoute();
