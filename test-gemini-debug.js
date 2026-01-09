const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  console.log("🔍 Testing Gemini API with detailed error output\n");

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    console.log("Trying model: gemini-1.5-flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello");
    const response = await result.response;
    console.log(`✅ SUCCESS!`);
    console.log(`Response: ${response.text()}`);
  } catch (error) {
    console.log("\n❌ FULL ERROR:");
    console.log(error);
    console.log("\n📋 Error Details:");
    console.log("Message:", error.message);
    if (error.response) {
      console.log("Response Status:", error.response.status);
      console.log("Response Data:", error.response.data);
    }
  }
}

test();
