/**
 * API Route: Gemini Answer Evaluation
 * POST /api/gemini/evaluate
 * Evaluates interview answers using Google Gemini
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswer } from "@/lib/gemini/client";

export async function POST(request: NextRequest) {
  try {
    const { question, answer, context } = await request.json();

    // Validate inputs
    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required" },
        { status: 400 }
      );
    }

    // Call Gemini to evaluate the answer
    const result = await evaluateAnswer(question, answer, context);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Evaluation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluation: result.evaluation,
    });
  } catch (error) {
    console.error("Error in Gemini evaluate route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
