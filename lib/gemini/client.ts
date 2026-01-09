/**
 * Google Gemini AI Client
 * Utility for using Gemini API in the Shine project
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Get a Gemini model instance
 * @param modelName - The model to use (default: gemini-2.5-flash)
 */
export function getGeminiModel(modelName: string = "gemini-2.5-flash") {
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate text content using Gemini
 * @param prompt - The prompt to send to Gemini
 * @param modelName - Optional model name (default: gemini-2.5-flash)
 */
export async function generateContent(
  prompt: string,
  modelName: string = "gemini-2.5-flash"
) {
  try {
    const model = getGeminiModel(modelName);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      text: response.text(),
      response,
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Evaluate an interview answer using Gemini
 * @param question - The interview question
 * @param answer - The user's answer (transcript)
 * @param context - Optional context about the question
 */
export async function evaluateAnswer(
  question: string,
  answer: string,
  context?: string
) {
  const prompt = `You are an AI interview producer evaluating video testimonial answers.

Question: ${question}
${context ? `Context: ${context}` : ""}

User's Answer:
${answer}

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

  try {
    const result = await generateContent(prompt);

    if (!result.success) {
      throw new Error(result.error);
    }

    // Parse JSON response
    const jsonMatch = result.text?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format from Gemini");
    }

    const evaluation = JSON.parse(jsonMatch[0]);

    return {
      success: true,
      evaluation: {
        score: evaluation.score || 0,
        isComplete: evaluation.isComplete || false,
        feedback: evaluation.feedback || "",
        followUp: evaluation.followUp || null,
      },
    };
  } catch (error) {
    console.error("Error evaluating answer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Evaluation failed",
    };
  }
}

/**
 * Analyze video content using Gemini's multimodal capabilities
 * (Requires gemini-pro-vision model)
 * @param videoUrl - URL to the video
 * @param prompt - What to analyze
 */
export async function analyzeVideo(videoUrl: string, prompt: string) {
  // Note: This is a placeholder for future video analysis
  // Gemini's video analysis requires specific file formats and base64 encoding
  // Implementation would depend on your specific needs

  console.warn("Video analysis not yet implemented");
  return {
    success: false,
    error: "Video analysis feature coming soon",
  };
}
