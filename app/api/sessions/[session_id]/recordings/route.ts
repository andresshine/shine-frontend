/**
 * API Routes: Session Recordings
 * POST /api/sessions/[session_id]/recordings - Create a new recording
 * GET /api/sessions/[session_id]/recordings - Get all recordings for a session
 */

import { NextRequest, NextResponse } from "next/server";
import { createRecording, getSessionRecordings } from "@/lib/api/sessions";

/**
 * GET - Fetch all recordings for a session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;
    const recordings = await getSessionRecordings(sessionId);

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Error in GET recordings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new recording entry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { session_id: sessionId } = await params;
    const body = await request.json();
    const { questionId, questionIndex, muxAssetId } = body;

    // Validate input
    if (!questionId || questionIndex === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: questionId, questionIndex" },
        { status: 400 }
      );
    }

    // Create recording entry
    const recordingId = await createRecording(
      sessionId,
      questionId,
      questionIndex,
      muxAssetId
    );

    if (!recordingId) {
      return NextResponse.json(
        { error: "Failed to create recording" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recordingId }, { status: 201 });
  } catch (error) {
    console.error("Error in POST recordings API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
