/**
 * Test Gemini API in Production
 * Tests the deployed /api/gemini/evaluate endpoint
 */

async function testProductionApi() {
  console.log("🧪 Testing Gemini API in Production...\n");

  const productionUrl = "https://shine-frontend-gamma.vercel.app/api/gemini/evaluate";

  const testData = {
    question: "What do you like most about our product?",
    answer: "I really love how easy it is to use. The interface is intuitive and I was able to get started right away without any training. It's saved me hours every week.",
    context: "Customer testimonial for SaaS product"
  };

  try {
    console.log("📤 Sending request to production API...");
    console.log(`   URL: ${productionUrl}`);
    console.log(`   Question: ${testData.question}`);
    console.log(`   Answer: ${testData.answer.substring(0, 50)}...`);
    console.log("");

    const response = await fetch(productionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("\n❌ Error response:");
      console.error(errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    console.log("\n✅ Response received:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.evaluation) {
      console.log("\n📊 Evaluation Summary:");
      console.log(`   Score: ${result.evaluation.score}/100`);
      console.log(`   Complete: ${result.evaluation.isComplete}`);
      console.log(`   Feedback: ${result.evaluation.feedback}`);
      if (result.evaluation.followUp) {
        console.log(`   Follow-up: ${result.evaluation.followUp}`);
      }
      console.log("\n🎉 Production API is working correctly!");
      console.log("✅ Gemini integration successfully deployed!");
    } else {
      console.log("\n⚠️  Unexpected response format");
    }
  } catch (error) {
    console.error("\n❌ Error testing production API:");
    console.error(error.message);
    console.log("\nPossible issues:");
    console.log("1. Deployment is still in progress (check Vercel dashboard)");
    console.log("2. GEMINI_API_KEY not properly set in Vercel");
    console.log("3. Environment variable not applied to deployment (try redeploying)");
  }
}

testProductionApi();
