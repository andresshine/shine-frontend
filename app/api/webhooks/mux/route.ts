/**
 * API Route: Mux Webhooks
 * POST /api/webhooks/mux
 * Handles Mux webhook events for video processing status
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for webhook operations (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    console.log("Mux webhook received:", type);

    // Handle different webhook events
    switch (type) {
      case "video.asset.ready":
        // Video is ready for playback
        await handleAssetReady(data);
        break;

      case "video.asset.errored":
        // Video processing failed
        await handleAssetError(data);
        break;

      case "video.upload.asset_created":
        // Upload completed and asset created
        await handleUploadComplete(data);
        break;

      default:
        console.log("Unhandled webhook type:", type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling Mux webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle asset ready event
 */
async function handleAssetReady(data: any) {
  const assetId = data.id;
  const playbackId = data.playback_ids?.[0]?.id;

  console.log("Asset ready:", assetId, "Playback ID:", playbackId);

  // Update recording in database - Type cast to bypass Supabase type inference
  const { data: recording, error } = await (supabase
    .from("recordings") as any)
    .update({
      video_status: "ready",
      mux_playback_id: playbackId,
      updated_at: new Date().toISOString(),
    })
    .eq("mux_asset_id", assetId)
    .select("id")
    .single();

  if (error) {
    console.error("Error updating recording:", error);
    return;
  }

  // Trigger transcription asynchronously
  if (recording && playbackId) {
    console.log("Triggering transcription for recording:", recording.id);

    // Call transcription API inline (simpler than fetch in Next.js API route)
    // We'll import and call the transcription logic directly
    triggerTranscription(recording.id, playbackId).catch((err) => {
      console.error("Failed to trigger transcription:", err);
    });
  }
}

/**
 * Trigger transcription for a recording
 */
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
    // Import transcription function (lazy load)
    const { transcribeFromUrl } = await import("@/lib/deepgram/client");

    // Update status to processing
    const { error: updateError } = await supabase
      .from("recordings")
      .update({ transcription_status: "processing" })
      .eq("id", recordingId);

    if (updateError) {
      console.error("❌ Failed to update status to processing:", updateError);
    }

    // Transcribe audio
    const { transcript, fullResult } = await transcribeFromUrl(urlToUse);

    // Save transcript and full result (with word timings for captions) to database
    const { error: saveError } = await supabase
      .from("recordings")
      .update({
        transcription: transcript,
        transcription_data: fullResult, // Full Deepgram result with word timings for SRT generation
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
  }
}

/**
 * Handle asset error event
 */
async function handleAssetError(data: any) {
  const assetId = data.id;

  console.log("Asset errored:", assetId);

  // Update recording in database - Type cast to bypass Supabase type inference
  const { error } = await (supabase
    .from("recordings") as any)
    .update({
      video_status: "error",
      updated_at: new Date().toISOString(),
    })
    .eq("mux_asset_id", assetId);

  if (error) {
    console.error("Error updating recording:", error);
  }
}

/**
 * Handle upload complete event
 */
async function handleUploadComplete(data: any) {
  const uploadId = data.upload_id;
  const assetId = data.id;

  console.log("Upload complete - Asset created:", assetId);

  // Update recording with asset ID if we have upload_id stored
  // For now, this is handled in the upload flow itself
}
