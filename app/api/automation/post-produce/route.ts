/**
 * API Route: POST /api/automation/post-produce
 * Triggers Shine Post-Producer automation for a ready recording
 *
 * This endpoint:
 * 1. Fetches the recording and its transcript from Supabase
 * 2. Extracts the first 6 words for the text overlay
 * 3. Submits a Shotstack render job with brand theming
 * 4. Outputs directly to Mux via Shotstack destination
 */

import { NextRequest, NextResponse } from "next/server";
import { processReadyVideo, isReadyForPostProduction } from "@/lib/services/automation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId } = body;

    // Validate required field
    if (!recordingId) {
      return NextResponse.json(
        { error: "Missing required field: recordingId" },
        { status: 400 }
      );
    }

    console.log(`🎬 [API] Post-production triggered for recording: ${recordingId}`);

    // Check if recording is ready for post-production
    const isReady = await isReadyForPostProduction(recordingId);
    if (!isReady) {
      return NextResponse.json(
        {
          error: "Recording is not ready for post-production",
          details: "Video must be ready and transcription must be completed"
        },
        { status: 400 }
      );
    }

    // Process the recording
    const result = await processReadyVideo(recordingId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Post-production failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      renderId: result.renderId,
      message: "Post-production started successfully. Video will be uploaded to Mux when complete.",
    });

  } catch (error) {
    console.error("❌ [API] Error in post-produce route:", error);
    return NextResponse.json(
      { error: "Failed to start post-production" },
      { status: 500 }
    );
  }
}
