const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  const models = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-pro-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
  ];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  for (const modelName of models) {
    try {
      console.log(`\nTrying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello in one sentence");
      const response = await result.response;
      console.log(`✅ SUCCESS with ${modelName}`);
      console.log(`Response: ${response.text()}`);
      console.log(`\n🎉 Working model found: ${modelName}`);
      break;
    } catch (error) {
      console.log(`❌ Failed: ${error.message.substring(0, 80)}...`);
    }
  }
}

test();
