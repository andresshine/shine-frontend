#!/usr/bin/env node
/**
 * Ask Gemini - Quick CLI helper
 * Usage: node ask-gemini.js "your question here"
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "AIzaSyAH2sbhjkr_PZwaT1gGiN0gRv6d_99i2c8";

async function askGemini(question) {
  if (!question) {
    console.log("Usage: node ask-gemini.js \"your question here\"");
    console.log("Example: node ask-gemini.js \"How do I fix TypeScript errors?\"");
    process.exit(1);
  }

  console.log("🤖 Asking Gemini...\n");

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();

    console.log(text);
    console.log("\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Get question from command line arguments
const question = process.argv.slice(2).join(" ");
askGemini(question);
