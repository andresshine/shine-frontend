/**
 * List Available Gemini Models
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
  console.log("🔍 Checking available Gemini models...\n");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not set");
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log("📡 Fetching model list from Gemini API...\n");

    const models = await genAI.listModels();

    console.log(`✅ Found ${models.length} models:\n`);

    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods.join(", ")}`);
      console.log("");
    });

  } catch (error) {
    console.error("\n❌ Error listing models:");
    console.error(error.message);
    console.log("\nThis might mean:");
    console.log("1. The API key is invalid");
    console.log("2. The API key doesn't have proper permissions");
    console.log("3. There's a network issue");
    console.log("\nPlease verify your API key at: https://aistudio.google.com/app/apikey");
  }
}

listModels();
