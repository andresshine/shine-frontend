/**
 * API Route: Transcribe Recording
 * POST /api/transcribe
 * Transcribes a video recording using Deepgram
 */

import { NextRequest, NextResponse } from "next/server";
import { transcribeFromUrl } from "@/lib/deepgram/client";
import { createClient } from "@supabase/supabase-js";

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recordingId, muxAssetId } = body;

    if (!recordingId || !muxAssetId) {
      return NextResponse.json(
        { error: "Missing recordingId or muxAssetId" },
        { status: 400 }
      );
    }

    // Update status to processing
    await supabase
      .from("recordings")
      .update({ transcript_status: "processing" })
      .eq("id", recordingId);

    // Get Mux playback URL for the audio
    // Mux format: https://stream.mux.com/{PLAYBACK_ID}.m3u8
    // We'll need to get the playback ID from the asset
    const muxPlaybackUrl = `https://stream.mux.com/${muxAssetId}/audio.m4a`;

    try {
      // Transcribe the audio
      const { transcript, confidence } = await transcribeFromUrl(muxPlaybackUrl);

      // Update recording with transcript
      const { error: updateError } = await supabase
        .from("recordings")
        .update({
          transcript,
          transcript_status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordingId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        transcript,
        confidence,
      });
    } catch (transcriptionError) {
      // Update status to failed
      await supabase
        .from("recordings")
        .update({ transcript_status: "failed" })
        .eq("id", recordingId);

      throw transcriptionError;
    }
  } catch (error) {
    console.error("Error in transcription API:", error);
    return NextResponse.json(
      { error: "Transcription failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
