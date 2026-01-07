/**
 * API Route: Poll Mux Upload Status
 * POST /api/mux/poll-upload
 * Checks if upload has been processed and updates database
 */

import { NextRequest, NextResponse } from "next/server";
import { getUpload, getAsset } from "@/lib/mux/client";
import { createClient } from "@supabase/supabase-js";
import { transcribeFromUrl } from "@/lib/deepgram/client";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uploadId, recordingId } = body;

    if (!uploadId || !recordingId) {
      return NextResponse.json(
        { error: "Missing uploadId or recordingId" },
        { status: 400 }
      );
    }

    // Fetch upload from Mux
    const upload = await getUpload(uploadId);

    if (upload.asset_id) {
      // Asset has been created!
      const asset = await getAsset(upload.asset_id);

      if (asset.status === "ready") {
        const playbackId = asset.playback_ids?.[0]?.id;

        // Update database with asset info
        await supabase
          .from("recordings")
          .update({
            mux_asset_id: asset.id,
            mux_playback_id: playbackId,
            video_status: "ready",
            updated_at: new Date().toISOString(),
          })
          .eq("id", recordingId);

        // Trigger transcription and AWAIT it (serverless functions terminate on response)
        let transcriptionError: string | null = null;
        if (playbackId) {
          console.log("🎬 Triggering transcription before responding...");
          try {
            await triggerTranscription(recordingId, playbackId);
          } catch (err) {
            console.error("❌ Transcription failed:", err);
            transcriptionError = err instanceof Error ? err.message : String(err);
            // Continue anyway - video is still ready
          }
        }

        return NextResponse.json({
          status: "ready",
          assetId: asset.id,
          playbackId,
          transcriptionError, // Include error for debugging
        });
      } else if (asset.status === "preparing") {
        return NextResponse.json({ status: "processing" });
      } else if (asset.status === "errored") {
        await supabase
          .from("recordings")
          .update({ video_status: "error" })
          .eq("id", recordingId);

        return NextResponse.json({ status: "error" });
      }
    }

    // Still processing
    return NextResponse.json({ status: "processing" });
  } catch (error) {
    console.error("Error polling upload:", error);
    return NextResponse.json(
      { error: "Failed to poll upload status" },
      { status: 500 }
    );
  }
}

async function triggerTranscription(recordingId: string, playbackId: string) {
  // Try audio.m4a first, fall back to low.mp4 if not available
  const audioUrl = `https://stream.mux.com/${playbackId}/audio.m4a`;
  const fallbackUrl = `https://stream.mux.com/${playbackId}/low.mp4`;

  console.log("📝 Starting transcription for recording:", recordingId);

  // Check if audio.m4a exists
  let urlToUse = audioUrl;
  try {
    const headResponse = await fetch(audioUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      console.log("⚠️ audio.m4a not available (status:", headResponse.status, "), falling back to low.mp4");
      urlToUse = fallbackUrl;
    }
  } catch (e) {
    console.log("⚠️ Could not check audio.m4a, falling back to low.mp4");
    urlToUse = fallbackUrl;
  }

  console.log("🔗 Using URL:", urlToUse);

  try {
    // Update status to processing
    const { error: updateError } = await supabase
      .from("recordings")
      .update({ transcription_status: "processing" })
      .eq("id", recordingId);

    if (updateError) {
      console.error("❌ Failed to update status to processing:", updateError);
    }

    // Transcribe audio
    const { transcript } = await transcribeFromUrl(urlToUse);

    // Save transcript to database
    const { error: saveError } = await supabase
      .from("recordings")
      .update({
        transcription: transcript,
        transcription_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", recordingId);

    if (saveError) {
      console.error("❌ Failed to save transcript to database:", saveError);
      throw saveError;
    }

    console.log("✅ Transcription completed for recording:", recordingId);
  } catch (error) {
    console.error("❌ Transcription failed for recording:", recordingId, error);

    // Update status to failed
    const { error: failError } = await supabase
      .from("recordings")
      .update({ transcription_status: "failed" })
      .eq("id", recordingId);

    if (failError) {
      console.error("❌ Failed to update status to failed:", failError);
    }

    // Re-throw so caller knows it failed
    throw error;
  }
}
