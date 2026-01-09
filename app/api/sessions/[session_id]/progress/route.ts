/**
 * API Route: Update Session Progress
 * PUT /api/sessions/[session_id]/progress
 * Updates the current question index and status of a session
 */

import { NextRequest, NextResponse } from "next/server";
import { updateSessionProgress } from "@/lib/api/sessions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;
    const body = await request.json();
    const { currentQuestionIndex, status } = body;

    // Validate input
    if (currentQuestionIndex === undefined || currentQuestionIndex < 0) {
      return NextResponse.json(
        { error: "Invalid currentQuestionIndex" },
        { status: 400 }
      );
    }

    // Update session progress
    const success = await updateSessionProgress(
      sessionId,
      currentQuestionIndex,
      status
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update session progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in progress API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
